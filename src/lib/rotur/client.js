import {Rotur, resolvePermissions} from 'rotur-sdk';
import {
    getRoturSettings,
    formatActivityTitle,
    formatActivityStatus
} from './settings.js';

const TOKEN_KEY = 'mw:rotur-token';
const REQUIRED_PERMISSIONS = [...new Set([
    ...resolvePermissions([
        'me.checkAuth',
        'following.follow',
        'following.unfollow',
        'validators.generate',
        'me.transfer',
        'me.claimDaily',
        'notifications.list'
    ]),
    'account:view',
    'account:profile',
    'account:settings',
    'credits:view',
    'credits:manage',
    'credits:transfer',
    'credits:daily',
    'notifications:view',
    'posts:create',
    'posts:delete',
    'groups:view',
    'groups:members.view',
    'groups:join',
    'groups:leave',
    'groups:manage'
])];
const PRESENCE_PERMISSION = 'account:profile';
const LOGIN_PERMISSIONS = REQUIRED_PERMISSIONS;
const LOGIN_SYSTEM = 'mistwarp';
const ACTIVITY_ID = 'MistWarp';
const APP_URL = 'https://warp.mistium.com';
const APP_IMAGE = 'https://raw.githubusercontent.com/MistWarp/desktop/master/art/icon.png';

/** @type {Rotur|null} */
let client = null;
const notificationListeners = new Set();
const notificationRemovalListeners = new Set();
const visibleNotificationIds = new Set();
const notificationFetches = new Map();
let notificationSocketListener = null;
let notificationRemovalSocketListener = null;

const getClient = () => {
    if (!client) {
        client = new Rotur();
    }
    return client;
};

const loadStoredToken = () => {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch (_) {
        return null;
    }
};

const storeToken = token => {
    try {
        if (token) {
            localStorage.setItem(TOKEN_KEY, token);
        } else {
            localStorage.removeItem(TOKEN_KEY);
        }
    } catch (_) {
        // ignore private-mode / quota failures
    }
};

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

const tokenHasRequiredPermissions = async () => {
    const rotur = getClient();
    try {
        const abilities = await rotur.me.abilities();
        if (!abilities || abilities.error || abilities.token_type === 'main') {
            return true;
        }
        const granted = Array.isArray(abilities.permissions) ? abilities.permissions : [];
        if (granted.includes('full')) {
            return true;
        }
        for (const permission of REQUIRED_PERMISSIONS) {
            if (!granted.includes(permission)) {
                return false;
            }
        }
        return true;
    } catch (_) {
        return true;
    }
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

const readRestoreCache = token => {
    try {
        const raw = sessionStorage.getItem(RESTORE_CACHE_KEY);
        if (!raw) return null;
        const {user, at, token: cachedToken} = JSON.parse(raw);
        if (cachedToken !== token || !at || Date.now() - at > RESTORE_CACHE_TTL) return null;
        return user || null;
    } catch (_) {
        return null;
    }
};

const writeRestoreCache = (token, user) => {
    try {
        if (user) {
            sessionStorage.setItem(RESTORE_CACHE_KEY, JSON.stringify({user, token, at: Date.now()}));
        } else {
            sessionStorage.removeItem(RESTORE_CACHE_KEY);
        }
    } catch (_) {
        // ignore
    }
};

/** Restore a previous session from localStorage. */
const restoreSession = async () => {
    const token = loadStoredToken();
    if (!token) {
        return null;
    }
    const rotur = getClient();
    rotur.setToken(token);
    const cached = readRestoreCache(token);
    const hasPermissions = await tokenHasRequiredPermissions();
    if (!hasPermissions) {
        rotur.logout();
        storeToken(null);
        return null;
    }
    if (cached) {
        return cached;
    }
    const user = await fetchCurrentUser();
    if (!user) {
        rotur.logout();
        storeToken(null);
        return null;
    }
    storeToken(rotur.token);
    writeRestoreCache(rotur.token, user);
    return user;
};

const buildAuthUrl = (returnTo = (typeof window === 'undefined' ? '' : window.location.href)) => {
    const params = new URLSearchParams({
        system: LOGIN_SYSTEM,
        return_to: returnTo,
        requires: LOGIN_PERMISSIONS.join(',')
    });
    return `https://rotur.dev/auth?${params.toString()}`;
};

/** Open the Rotur login flow (popup, with iframe fallback for Electron). */
const login = async () => {
    const rotur = getClient();
    await rotur.login({
        system: LOGIN_SYSTEM,
        timeout: 120000,
        requires: LOGIN_PERMISSIONS
    });
    storeToken(rotur.token);
    const user = await fetchCurrentUser();
    if (!user) {
        throw new Error('Logged in but could not load Rotur profile');
    }
    writeRestoreCache(rotur.token, user);
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
    storeToken(null);
    writeRestoreCache(null, null);
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

// Notifications live on Rotur; the backend only posts them there. Fetch them
// with the user's own token so each account sees its own notifications.
const fetchNotifications = afterDays => {
    const rotur = getClient();
    if (!rotur.loggedIn) {
        return Promise.resolve([]);
    }
    const key = String(afterDays);
    if (notificationFetches.has(key)) {
        return notificationFetches.get(key);
    }
    const request = Promise.resolve().then(async () => {
        const list = await rotur.notifications.list(afterDays);
        if (!Array.isArray(list)) {
            return [];
        }
        const visible = list.map(normalizeNotification).filter(isVisibleNotification);
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

const markNotificationsRead = async () => {
    const rotur = getClient();
    if (!rotur.loggedIn) {
        return false;
    }
    try {
        await rotur.notifications.markRead();
        return true;
    } catch (_) {
        return false;
    }
};

// Ensure the current session token can exercise every scope in `scopes`. If the
// token is already sufficient (or is a full-access main token) this is a no-op;
// otherwise it re-runs the Rotur login popup requesting the union of the existing
// login scopes plus the requested ones, broadening the same session in place. No
// separate per-project sub-token is minted.
const ensureScopes = async scopes => {
    const rotur = getClient();
    if (!rotur.loggedIn) {
        return false;
    }
    const wanted = Array.isArray(scopes) ? scopes.filter(Boolean) : [];
    if (!wanted.length) {
        return true;
    }
    let granted = null;
    try {
        const abilities = await rotur.me.abilities();
        if (!abilities || abilities.error || abilities.token_type === 'main') {
            return true;
        }
        granted = Array.isArray(abilities.permissions) ? abilities.permissions : [];
    } catch (_) {
        return true;
    }
    if (granted.includes('full')) {
        return true;
    }
    const missing = wanted.filter(scope => !granted.includes(scope));
    if (!missing.length) {
        return true;
    }
    await rotur.login({
        system: LOGIN_SYSTEM,
        timeout: 120000,
        requires: [...new Set([...LOGIN_PERMISSIONS, ...granted, ...wanted])]
    });
    storeToken(rotur.token);
    return true;
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

export {
    ACTIVITY_ID,
    APP_URL,
    APP_IMAGE,
    getAvatarUrl,
    buildAuthUrl,
    restoreSession,
    login,
    logout,
    subscribeNotifications,
    subscribeNotificationRemovals,
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
    isVisibleNotification,
    fetchNotifications,
    markNotificationsRead
};
