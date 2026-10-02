import * as bundledModule0 from '../../community/api.js';

import {Rotur} from 'rotur-sdk';
import {loadSession} from '../community/api.js';
import {
    getRoturSettings,
    formatActivityTitle,
    formatActivityStatus
} from './settings.js';
import {ROTUR_TOKEN_KEY} from './token-key.js';
import * as oauth from './oauth.js';
import {hasRotur, roturOfflineError} from './availability.js';

// What MistWarp asks for when someone signs in with Rotur. Nothing here can
// spend credits, change account settings or read secrets: payments go through
// Rotur's own approval page, and the rest is asked for when someone turns it on.
const SIGN_IN_SCOPES = [
    'offline_access', // Stay signed in past the hour an access token lasts.
    'validators:generate', // OriginChats chat and attachments, and WarpTheme. MistWarp's
    // own server takes validators keyed to its Rotur App, which need no permission.
    'account:view', // Your Rotur ID, and the badge editor on your profile.
    'account:profile', // Reorder or hide badges, and show what you're editing.
    'signing:keys', // Register this device's public key to sign chat messages.
    'credits:view', // Wallet balance, donation history, earnings, bounties.
    'credits:daily', // The daily credits button in the wallet.
    'notifications:view', // Notifications, live and on the notifications page.
    'posts:view', // Posts from people you follow, on Home.
    'posts:create', // The composer on your profile's Posts tab.
    'posts:reply',
    'posts:repost',
    'posts:like',
    'posts:delete',
    'posts:manage', // Edit and pin your own posts.
    'blocked:view', // Block and unblock people from a post.
    'blocked:manage',
    'following:follow', // Follow buttons on profiles and Home.
    'following:unfollow',
    'groups:view', // The Groups pages.
    'groups:members.view',
    'groups:join',
    'groups:leave'
];
const PRESENCE_PERMISSION = 'account:profile';
const ACTIVITY_ID = 'MistWarp';
const APP_URL = 'https://mistwarp.org';
const APP_IMAGE = 'https://raw.githubusercontent.com/MistWarp/desktop/master/art/icon.png';

/** @type {Rotur|null} */
let client = null;
const notificationListeners = new Set();
const notificationRemovalListeners = new Set();
const visibleNotificationIds = new Set();
const notificationFetches = new Map();
const followingFeedFetches = new Map();
let notificationSocketListener = null;
let notificationRemovalSocketListener = null;

const getClient = () => {
    if (!client) {
        client = new Rotur();
    }
    return client;
};

// A token from the old Rotur sign-in, kept until its owner reconnects with
// Sign in with Rotur so nobody is signed out without warning.
const loadLegacyToken = () => {
    try {
        return localStorage.getItem(ROTUR_TOKEN_KEY);
    } catch (_) {
        return null;
    }
};

// The desktop app's editor runs on tw-editor://, not a web origin, and Sign in
// with Rotur only returns to registered web origins. Until the desktop app has
// its own sign-in, it keeps Rotur's older one, asking for the same permissions.
const webOrigin = typeof location !== 'undefined' && /^https?:$/.test(location.protocol);

const legacyLogin = async scopes => {
    const rotur = getClient();
    await rotur.login({
        system: 'mistwarp',
        timeout: 120000,
        requires: scopes.filter(scope => scope.includes(':'))
    });
    try {
        localStorage.setItem(ROTUR_TOKEN_KEY, rotur.token);
    } catch (_) {
        // ignore private-mode failures
    }
    return rotur.token;
};

const dropLegacyToken = () => {
    try {
        localStorage.removeItem(ROTUR_TOKEN_KEY);
    } catch (_) {
        // ignore private-mode failures
    }
};

const useToken = token => {
    const rotur = getClient();
    rotur.setToken(token);
    // The socket reconnects with the token it was opened with, and a refresh
    // revokes that one.
    if (rotur.socket) rotur.socket.token = token;
};

// Keep the client on the newest token when any tab refreshes it.
oauth.onSessionChange(session => {
    if (session) useToken(session.accessToken);
});

/**
 * A stable key for whoever is signed in, readable before the session is
 * restored: their Rotur ID, or the old sign-in's token.
 * @returns {string} The key, or '' when signed out.
 */
const accountKey = () => {
    const session = oauth.readSession();
    return (session && session.subject) || loadLegacyToken() || '';
};

/**
 * Whether the person is still on the old sign-in, so should be offered to
 * reconnect with Sign in with Rotur.
 * @returns {boolean} True to offer reconnecting.
 */
const needsReconnect = () => webOrigin && !oauth.readSession() && Boolean(loadLegacyToken());

/**
 * Stable avatar URL derived only from username.
 * @param {string} username - Account username
 * @returns {string} Avatar URL
 */
const getAvatarUrl = username => (
    `https://avatars.rotur.dev/${encodeURIComponent(String(username).toLowerCase())}`
);

/**
 * Normalize me.get() / profile payloads into a stable shape.
 * @param {object} data - Raw profile payload
 * @returns {object|null} Normalized user or null
 */
const normalizeUser = data => {
    if (!data || typeof data !== 'object' || data.error) {
        return null;
    }
    const username = data.username || data.name || data.user;
    if (!username || typeof username !== 'string') {
        return null;
    }
    const id = data['sys.id'] || data.id || data.key || data.sys_id || null;
    return {
        username,
        id: id === null ? null : String(id),
        avatarUrl: getAvatarUrl(username),
        bio: typeof data.bio === 'string' ? data.bio : null
    };
};

const fetchCurrentUser = async () => {
    const rotur = getClient();
    if (!rotur.loggedIn) {
        return null;
    }
    let sawNetworkError = false;
    try {
        const user = normalizeUser(await rotur.me.get());
        if (user) return user;
    } catch (_) {
        sawNetworkError = true;
    }
    try {
        const auth = await rotur.me.checkAuth();
        if (auth && auth.username) {
            return normalizeUser({username: auth.username});
        }
        return null;
    } catch (_) {
        sawNetworkError = true;
    }
    if (sawNetworkError) {
        const error = new Error('Could not reach Rotur');
        error.transient = true;
        throw error;
    }
    return null;
};

/** Whether the current token may publish status/activity over the status socket. */
const presenceSupported = async () => {
    const rotur = getClient();
    if (!rotur.loggedIn) {
        return false;
    }
    try {
        const abilities = await rotur.me.abilities();
        if (!abilities || abilities.error || abilities.token_type === 'main') {
            return true;
        }
        const granted = Array.isArray(abilities.permissions) ? abilities.permissions : [];
        return granted.includes('full') || granted.includes(PRESENCE_PERMISSION);
    } catch (_) {
        return true;
    }
};

const RESTORE_CACHE_KEY = 'mw:rotur-restore';
const RESTORE_CACHE_TTL = 5 * 60 * 1000;

// Who is signed in, for five minutes, so each page load doesn't ask Rotur
// again. It holds no token, and only counts for the account it was saved for.
const readRestoreCache = () => {
    try {
        const {user, at, account} = JSON.parse(sessionStorage.getItem(RESTORE_CACHE_KEY) || '{}');
        return user && at && account === accountKey() && Date.now() - at <= RESTORE_CACHE_TTL ? user : null;
    } catch (_) {
        return null;
    }
};

const writeRestoreCache = user => {
    try {
        if (user) {
            sessionStorage.setItem(RESTORE_CACHE_KEY, JSON.stringify({user, at: Date.now(), account: accountKey()}));
        } else {
            sessionStorage.removeItem(RESTORE_CACHE_KEY);
        }
    } catch (_) {
        // ignore
    }
};

/**
 * The token to call Rotur with: the Sign in with Rotur session, refreshed if
 * needed, or a token from the old sign-in.
 * @returns {Promise<string|null>} The token, or null when signed out.
 */
const getAccessToken = async () => {
    if (!hasRotur()) return null;
    return (await oauth.getAccessToken()) || loadLegacyToken();
};

/** Restore a previous session. */
const restoreSession = async () => {
    if (!hasRotur()) return null;
    await oauth.completeRedirect();
    const token = await getAccessToken();
    if (!token) {
        return null;
    }
    useToken(token);
    const cached = readRestoreCache();
    if (cached) {
        return cached;
    }
    const user = await fetchCurrentUser();
    if (!user) {
        getClient().logout();
        oauth.signOut();
        dropLegacyToken();
        return null;
    }
    writeRestoreCache(user);
    return user;
};

/**
 * Sign in with Rotur, asking for SIGN_IN_SCOPES and anything extra. Call it
 * straight from a click, so the popup isn't blocked.
 * @param {string[]} [extraScopes] More permissions to ask for.
 * @param {boolean} [redirectFallback] Go to Rotur in this tab if the popup is
 *     blocked. Only the sign-in buttons do.
 * @returns {Promise<object>} The signed-in user.
 */
const login = async (extraScopes = [], redirectFallback = true) => {
    if (!hasRotur()) throw roturOfflineError();
    const scopes = [...new Set([...SIGN_IN_SCOPES, ...extraScopes])];
    if (webOrigin) {
        const session = await oauth.signIn(scopes, {redirectFallback});
        dropLegacyToken();
        useToken(session.accessToken);
    } else {
        useToken(await legacyLogin(scopes));
    }
    writeRestoreCache(null);
    const user = await fetchCurrentUser();
    if (!user) {
        throw new Error('Signed in, but could not load your Rotur profile');
    }
    writeRestoreCache(user);
    return user;
};

const clearActivity = () => {
    const rotur = getClient();
    if (!rotur.loggedIn || !rotur.socket) {
        return;
    }
    try {
        if (typeof rotur.socket.removeActivity === 'function') {
            rotur.socket.removeActivity(ACTIVITY_ID);
        } else if (typeof rotur.socket.clearActivity === 'function') {
            rotur.socket.clearActivity(ACTIVITY_ID);
        }
    } catch (_) {
        // ignore
    }
};

const logout = () => {
    clearActivity();
    const rotur = getClient();
    if (notificationSocketListener) {
        if (rotur.socket && typeof rotur.socket.off === 'function') {
            rotur.socket.off('notification', notificationSocketListener);
        }
        notificationSocketListener = null;
    }
    notificationListeners.clear();
    visibleNotificationIds.clear();
    notificationFetches.clear();
    rotur.logout();
    oauth.signOut();
    dropLegacyToken();
    writeRestoreCache(null);
};

const ensureSocket = async () => {
    const rotur = getClient();
    if (!rotur.loggedIn) {
        return false;
    }
    if (rotur.socket && rotur.socket.connected) {
        return true;
    }
    try {
        await rotur.connectSocket();
        return Boolean(rotur.socket && rotur.socket.connected);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('[Rotur] socket connect failed', error);
        return false;
    }
};

// Notifications are delivered canonically: type/id/timestamp/read/actor at the
// top level, platform-specific fields inside platform_data. Lift the payload so
// mistwarp types (love, comment, ...) and platform extras are visible to UI.
const normalizeNotification = notification => {
    if (!notification || typeof notification !== 'object') {
        return notification;
    }
    const pd = notification.platform_data;
    if (!pd || typeof pd !== 'object') {
        return notification;
    }
    const out = {...notification};
    const isMistWarpRelay = String(out.platform || '').toLowerCase() === 'mistwarp' &&
        String(out.type || '').toLowerCase() === 'notification' &&
        String(out.actor || '').toLowerCase() === 'mistwarp';
    for (const [k, v] of Object.entries(pd)) {
        if (k === 'type' || k === 'id' || k === 'timestamp' || k === 'created' || k === 'read') {
            continue;
        }
        out[k] = v;
    }
    if (out.platform === 'mistwarp' && typeof pd.type === 'string' && pd.type) {
        out.type = pd.type;
    }
    const payloadActor = pd.actor || pd.from;
    if (out.platform === 'mistwarp' && typeof payloadActor === 'string' && payloadActor) {
        out.actor = payloadActor;
    }
    if (isMistWarpRelay && String(pd.type || '').toLowerCase() === 'follow') {
        out.mwDiscard = true;
    }
    return out;
};

// MistWarp only shows its own activity plus Rotur's account-level follow
// notifications. Other apps share the same Rotur notification inbox.
const isVisibleNotification = notification => {
    const normalized = normalizeNotification(notification);
    if (!normalized || typeof normalized !== 'object') {
        return false;
    }
    if (normalized.mwDiscard) {
        return false;
    }
    if (String(normalized.type || '').toLowerCase() === 'follow') {
        return true;
    }
    const platformData = normalized.platform_data && typeof normalized.platform_data === 'object' ?
        normalized.platform_data : {};
    return [
        normalized.platform,
        normalized.source,
        platformData.platform,
        platformData.source
    ].some(value => typeof value === 'string' && value.toLowerCase() === 'mistwarp');
};

const notifyNotificationListeners = notification => {
    if (!notification || notification.read === true) {
        return;
    }
    const normalized = normalizeNotification(notification);
    if (!isVisibleNotification(normalized)) {
        return;
    }
    if (typeof normalized.id === 'string') {
        visibleNotificationIds.add(normalized.id);
    }
    notificationListeners.forEach(listener => {
        try {
            listener(normalized);
        } catch (_) {
            // ignore
        }
    });
};

const notifyRemovalListeners = payload => {
    if (!payload || typeof payload.id !== 'string' || !visibleNotificationIds.has(payload.id)) {
        return;
    }
    visibleNotificationIds.delete(payload.id);
    notificationRemovalListeners.forEach(listener => {
        try {
            listener(payload);
        } catch (_) {
            // ignore
        }
    });
};

const detachNotificationSocketListener = () => {
    if (!notificationSocketListener) {
        return;
    }
    const rotur = getClient();
    if (rotur.socket && typeof rotur.socket.off === 'function') {
        rotur.socket.off('notification', notificationSocketListener);
        rotur.socket.off('notification_removed', notificationRemovalSocketListener);
    }
    notificationSocketListener = null;
    notificationRemovalSocketListener = null;
};

const ensureNotificationSocketListener = () => {
    const rotur = getClient();
    if (
        !rotur.loggedIn ||
        !rotur.socket ||
        (!notificationListeners.size && !notificationRemovalListeners.size) ||
        notificationSocketListener
    ) {
        return;
    }
    if (typeof rotur.socket.on !== 'function') {
        return;
    }
    notificationSocketListener = payload => notifyNotificationListeners(payload);
    notificationRemovalSocketListener = payload => notifyRemovalListeners(payload);
    rotur.socket.on('notification', notificationSocketListener);
    rotur.socket.on('notification_removed', notificationRemovalSocketListener);
};

const subscribeNotifications = listener => {
    if (typeof listener !== 'function') {
        return () => {};
    }
    notificationListeners.add(listener);
    if (getClient().loggedIn) {
        ensureSocket()
            .then(ensureNotificationSocketListener)
            .catch(() => {});
    }
    return () => {
        notificationListeners.delete(listener);
        if (!notificationListeners.size && !notificationRemovalListeners.size) {
            detachNotificationSocketListener();
        }
    };
};

const subscribeNotificationRemovals = listener => {
    if (typeof listener !== 'function') {
        return () => {};
    }
    notificationRemovalListeners.add(listener);
    if (getClient().loggedIn) {
        ensureSocket()
            .then(ensureNotificationSocketListener)
            .catch(() => {});
    }
    return () => {
        notificationRemovalListeners.delete(listener);
        if (!notificationListeners.size && !notificationRemovalListeners.size) {
            detachNotificationSocketListener();
        }
    };
};

const subscribeTier = listener => {
    let off = null;
    let cancelled = false;
    const read = value => (value && typeof value === 'object' ? String(value.tier || 'Free') : 'Free');
    ensureSocket().then(connected => {
        if (!connected || cancelled) return;
        const socket = getClient().socket;
        listener(read(socket.getKey('sys.subscription')));
        off = socket.onKeyChange((key, value) => {
            if (key === 'sys.subscription') listener(read(value));
        });
    });
    return () => {
        cancelled = true;
        if (off) off();
    };
};

/**
 * Publish MistWarp editing presence.
 * Title/status are fixed strings; edit duration uses start_time only.
 * @param {object|string} projectTitleOrCtx - Project title or activity context.
 * @param {object} [extra] - Extra activity fields.
 */
const syncActivity = async (projectTitleOrCtx, extra = {}) => {
    const rotur = getClient();
    if (!rotur.loggedIn) {
        return;
    }

    const settings = getRoturSettings();
    if (!settings.presenceEnabled) {
        clearActivity();
        return;
    }

    if (!rotur.socket) {
        return;
    }
    if (!(await ensureSocket())) {
        return;
    }

    const ctx = typeof projectTitleOrCtx === 'object' && projectTitleOrCtx !== null ?
        {...projectTitleOrCtx} :
        {projectTitle: projectTitleOrCtx, ...extra};

    if (typeof ctx.editingSince !== 'number') {
        ctx.editingSince = Date.now();
    }

    const title = formatActivityTitle(ctx);
    const status = formatActivityStatus(ctx);

    const activity = {
        id: ACTIVITY_ID,
        title,
        status,
        image: APP_IMAGE,
        url: ctx.url || APP_URL,
        application: {
            name: ACTIVITY_ID,
            url: ctx.url || APP_URL
        }
    };
    if (settings.includeEditDuration) {
        activity.start_time = ctx.editingSince;
    }

    try {
        if (typeof rotur.socket.addActivity === 'function') {
            rotur.socket.addActivity(activity);
            return;
        }
        if (typeof rotur.socket.setPlaying === 'function') {
            rotur.socket.setPlaying(ACTIVITY_ID, {
                title,
                status,
                image: APP_IMAGE,
                url: APP_URL
            });
        }
    } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('[Rotur] Failed to sync activity', error);
    }
};

const isLoggedIn = () => getClient().loggedIn;
const getRotur = () => getClient();

// Read the shared inbox and MistWarp's local fallback using the current account.
const fetchNotifications = afterDays => {
    const rotur = getClient();
    if (!rotur.loggedIn) {
        return Promise.resolve([]);
    }
    const key = `${getClient().token || ''}:${loadSession() || ''}:${afterDays}`;
    if (notificationFetches.has(key)) {
        return notificationFetches.get(key);
    }
    const request = Promise.resolve().then(async () => {
        let local = [];
        let localLoaded = false;
        if (loadSession()) {
            try {
                const {default: communityApi} = await Promise.resolve(bundledModule0);
                const data = await communityApi.notifications();
                local = data.notifications || [];
                localLoaded = true;
            } catch (_) {
                // Rotur may still have the notification if MistWarp is unavailable.
            }
        }
        let remote = [];
        try {
            const list = await rotur.notifications.list(afterDays);
            remote = Array.isArray(list) ? list : [];
        } catch (error) {
            if (!localLoaded) throw error;
        }
        const seen = new Set();
        const visible = [...remote, ...local].map(normalizeNotification).filter(isVisibleNotification)
            .filter(item => {
                if (item.id && seen.has(item.id)) return false;
                if (item.id) seen.add(item.id);
                return true;
            })
            .sort((a, b) => (b.created || b.timestamp || 0) - (a.created || a.timestamp || 0));
        for (const notification of visible) {
            if (typeof notification.id === 'string') {
                visibleNotificationIds.add(notification.id);
            }
        }
        return visible;
    });
    notificationFetches.set(key, request);
    request.then(
        () => notificationFetches.delete(key),
        () => notificationFetches.delete(key)
    );
    return request;
};

// Rotur's following feed is already assembled server-side. Keep concurrent
// consumers on the home and notifications pages on one request.
const fetchFollowingFeed = (limit = 100) => {
    const rotur = getClient();
    if (!rotur.loggedIn) {
        return Promise.resolve([]);
    }
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 100));
    const key = String(safeLimit);
    if (followingFeedFetches.has(key)) {
        return followingFeedFetches.get(key);
    }
    const request = Promise.resolve(rotur.posts.followingFeed(safeLimit))
        .then(list => (Array.isArray(list) ? list : []));
    followingFeedFetches.set(key, request);
    request.then(
        () => followingFeedFetches.delete(key),
        () => followingFeedFetches.delete(key)
    );
    return request;
};

const markNotificationsRead = async () => {
    const rotur = getClient();
    if (!rotur.loggedIn) {
        return false;
    }
    try {
        const {default: communityApi} = await Promise.resolve(bundledModule0);
        const results = await Promise.allSettled([
            rotur.notifications.markRead(),
            communityApi.loadSession() ? communityApi.readNotifications() : Promise.resolve()
        ]);
        return results.every(result => result.status === 'fulfilled');
    } catch (_) {
        return false;
    }
};

// Someone can untick scopes on the consent screen, so check what was granted.
const hasScopes = scopes => {
    const session = oauth.readSession();
    return Boolean(session) && scopes.every(scope => session.scopes.includes(scope));
};

// Whether the session can use every scope in `scopes`. With prompt, and only
// then, missing ones are asked for in a popup, so call it from a click; it
// never leaves the page. Someone can switch scopes off on Rotur's consent
// screen, so reads just find out, and fail quietly if they can't.
const ensureScopes = async (scopes, {prompt = false} = {}) => {
    if (!hasRotur()) return false;
    const wanted = Array.isArray(scopes) ? scopes.filter(Boolean) : [];
    const session = oauth.readSession();
    if (session) {
        if (wanted.every(scope => session.scopes.includes(scope))) return true;
        if (!prompt) return false;
        await login(session.scopes.filter(scope => scope !== 'profile').concat(wanted), false);
        return hasScopes(wanted);
    }
    if (!loadLegacyToken()) return false;
    // A token from the old sign-in says what it may do.
    const abilities = await getClient().me.abilities()
        .catch(() => null);
    const granted = (abilities && abilities.permissions) || [];
    if (!abilities || abilities.token_type === 'main' || granted.includes('full') ||
        wanted.every(scope => granted.includes(scope))) {
        return true;
    }
    if (!prompt) return false;
    // On the web this moves to Sign in with Rotur, so it asks only for what
    // is wanted, not everything the old token could do.
    await login(webOrigin ? wanted : granted.concat(wanted), false);
    return !oauth.readSession() || hasScopes(wanted);
};


const isPaymentPermissionError = error => {
    const message = String((error && error.message) || error || '').toLowerCase();
    return message.includes('permission') ||
        message.includes('scope') ||
        message.includes('not allowed') ||
        message.includes('unauthorized') ||
        message.includes('token');
};

// Read the current Rotur credit balance, or null if the token can't see it.
const getBalance = async () => {
    const rotur = getClient();
    if (!rotur.loggedIn) {
        return null;
    }
    try {
        const me = await rotur.me.get();
        return me && typeof me['sys.currency'] === 'number' ? me['sys.currency'] : null;
    } catch (_) {
        return null;
    }
};

export const donationTransactions = transactions => {
    if (!Array.isArray(transactions)) return [];
    return transactions.reduce((donations, transaction, index) => {
        const note = String((transaction && transaction.note) || '');
        if (!note.toLowerCase().includes('donation')) return donations;
        const direction = transaction.type === 'in' ? 'received' :
            transaction.type === 'out' ? 'given' : null;
        const amount = Math.round((Number(transaction.amount) || 0) * 100) / 100;
        if (!direction || amount <= 0) return donations;
        const rawTime = Number(transaction.time || transaction.timestamp || 0);
        const time = rawTime > 0 && rawTime < 10000000000 ? rawTime * 1000 : rawTime;
        donations.push({
            id: String(transaction.id || `${direction}-${rawTime}-${index}`),
            direction,
            amount,
            user: String(transaction.user || transaction.from || transaction.to || ''),
            note,
            time: Number.isFinite(time) ? time : 0
        });
        return donations;
    }, []).sort((left, right) => right.time - left.time);
};

// Read balance plus donation totals and history from the account's transactions.
// Returns null if the token can't see credits. Fields default to 0/null.
const getAccountSummary = async () => {
    const rotur = getClient();
    if (!rotur.loggedIn) {
        return null;
    }
    try {
        const me = await rotur.me.get();
        if (!me || me.error) {
            return null;
        }
        const balance = typeof me['sys.currency'] === 'number' ? me['sys.currency'] : null;
        const txns = me['sys.transactions'] || me.transactions || [];
        const donations = donationTransactions(txns);
        let donationsReceived = 0;
        let donationsGiven = 0;
        for (const donation of donations) {
            if (donation.direction === 'received') donationsReceived += donation.amount;
            else donationsGiven += donation.amount;
        }
        const round = value => Math.round(value * 100) / 100;
        return {
            balance,
            donationsReceived: round(donationsReceived),
            donationsGiven: round(donationsGiven),
            donations,
            hasTransactions: Array.isArray(txns)
        };
    } catch (_) {
        return null;
    }
};

// Transfer credits to another Rotur user. Throws an Error; if the failure is a
// missing-permission on the current (sub-)token, the error carries needsReauth.
const payUser = async (to, amount, note) => {
    const rotur = getClient();
    if (!rotur.loggedIn) {
        const error = new Error('Log in to send credits');
        error.needsReauth = true;
        throw error;
    }
    const result = await rotur.me.transfer(to, amount, note);
    if (result && result.error) {
        const error = new Error(result.error);
        if (isPaymentPermissionError(result.error)) {
            error.needsReauth = true;
        }
        throw error;
    }
    return result;
};

// Claim the account's daily credits. Throws on failure; the error carries
// needsReauth when the token lacks the credits:daily permission, and waitHours
// when the daily claim is not yet available.
const claimDaily = async () => {
    const rotur = getClient();
    if (!rotur.loggedIn) {
        const error = new Error('Log in to claim daily credits');
        error.needsReauth = true;
        throw error;
    }
    const result = await rotur.me.claimDaily();
    if (result && result.error) {
        const error = new Error(result.error);
        if (isPaymentPermissionError(result.error)) {
            error.needsReauth = true;
        }
        if (result.wait_hours) {
            error.waitHours = result.wait_hours;
        }
        throw error;
    }
    return result;
};

const onSessionChange = oauth.onSessionChange;

export {
    ACTIVITY_ID,
    APP_URL,
    APP_IMAGE,
    getAvatarUrl,
    restoreSession,
    login,
    logout,
    subscribeNotifications,
    subscribeNotificationRemovals,
    subscribeTier,
    syncActivity,
    clearActivity,
    isLoggedIn,
    presenceSupported,
    getRotur,
    fetchCurrentUser,
    getBalance,
    getAccountSummary,
    payUser,
    claimDaily,
    ensureScopes,
    getAccessToken,
    needsReconnect,
    onSessionChange,
    accountKey,
    isVisibleNotification,
    fetchNotifications,
    fetchFollowingFeed,
    markNotificationsRead
};
