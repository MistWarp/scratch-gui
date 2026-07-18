import {Rotur, resolvePermissions} from 'rotur-sdk';
import {
    getRoturSettings,
    formatActivityTitle,
    formatActivityStatus
} from './settings.js';

const TOKEN_KEY = 'mw:rotur-token';
const ACTIVITY_ID = 'MistWarp';
const APP_URL = 'https://warp.mistium.com';
const APP_IMAGE = 'https://raw.githubusercontent.com/MistWarp/desktop/master/art/icon.png';

/** @type {Rotur|null} */
let client = null;

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

/** Stable avatar URL derived only from username. */
const getAvatarUrl = username => (
    `https://avatars.rotur.dev/${encodeURIComponent(String(username).toLowerCase())}`
);

/**
 * Normalize me.get() / profile payloads into a stable shape.
 * @returns {{username: string, id: string|null, avatarUrl: string, bio: string|null}|null}
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

/** Restore a previous session from localStorage. */
const restoreSession = async () => {
    const token = loadStoredToken();
    if (!token) {
        return null;
    }
    const rotur = getClient();
    rotur.setToken(token);
    const user = await fetchCurrentUser();
    if (!user) {
        rotur.logout();
        storeToken(null);
        return null;
    }
    storeToken(rotur.token);
    return user;
};

/** Open the Rotur login flow (popup, with iframe fallback for Electron). */
const login = async () => {
    const rotur = getClient();
    await rotur.login({
        system: 'rotur',
        timeout: 120000,
        requires: [
            ...resolvePermissions([
                'me.checkAuth',
                'following.follow',
                'following.unfollow',
                'validators.generate',
                'me.transfer'
            ]),
            'credits:view'
        ]
    });
    storeToken(rotur.token);
    const user = await fetchCurrentUser();
    if (!user) {
        throw new Error('Logged in but could not load Rotur profile');
    }
    return user;
};

const logout = () => {
    clearActivity();
    const rotur = getClient();
    rotur.logout();
    storeToken(null);
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

/**
 * Publish MistWarp editing presence.
 * Title/status are fixed strings; edit duration uses start_time only.
 * @param {{projectTitle?: string, editingSince?: number}|string} projectTitleOrCtx
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

const isLoggedIn = () => getClient().loggedIn;
const getRotur = () => getClient();

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
        return me && typeof me.currency === 'number' ? me.currency : null;
    } catch (_) {
        return null;
    }
};

// Read balance plus donation totals from the account's transaction history.
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
        const balance = typeof me.currency === 'number' ? me.currency : null;
        const txns = me['sys.transactions'] || me.transactions || [];
        let donationsReceived = 0;
        let donationsGiven = 0;
        if (Array.isArray(txns)) {
            for (const t of txns) {
                if (!String(t.note || '').toLowerCase().includes('donation')) continue;
                if (t.type === 'in') donationsReceived += Number(t.amount) || 0;
                else if (t.type === 'out') donationsGiven += Number(t.amount) || 0;
            }
        }
        const round = value => Math.round(value * 100) / 100;
        return {
            balance,
            donationsReceived: round(donationsReceived),
            donationsGiven: round(donationsGiven),
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

export {
    ACTIVITY_ID,
    APP_URL,
    APP_IMAGE,
    getAvatarUrl,
    restoreSession,
    login,
    logout,
    syncActivity,
    clearActivity,
    isLoggedIn,
    getRotur,
    fetchCurrentUser,
    getBalance,
    getAccountSummary,
    payUser
};
