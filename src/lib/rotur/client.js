import {Rotur, resolvePermissions} from 'rotur-sdk';
import {
    getRoturSettings,
    formatActivityTitle,
    formatActivityStatus
} from './settings.js';

const TOKEN_KEY = 'mw:rotur-token';
const REQUIRED_PERMISSIONS = [
    ...resolvePermissions([
        'me.checkAuth',
        'following.follow',
        'following.unfollow',
        'validators.generate',
        'me.transfer',
        'me.claimDaily'
    ]),
    'credits:view'
];
const PRESENCE_PERMISSION = 'account:profile';
const LOGIN_PERMISSIONS = [...REQUIRED_PERMISSIONS, PRESENCE_PERMISSION];
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
    if (cached) {
        return cached;
    }
    const [user, hasPermissions] = await Promise.all([fetchCurrentUser(), tokenHasRequiredPermissions()]);
    if (!user || !hasPermissions) {
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
        system: 'rotur',
        return_to: returnTo,
        requires: LOGIN_PERMISSIONS.join(',')
    });
    return `https://rotur.dev/auth?${params.toString()}`;
};

/** Open the Rotur login flow (popup, with iframe fallback for Electron). */
const login = async () => {
    const rotur = getClient();
    await rotur.login({
        system: 'rotur',
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
        system: 'rotur',
        timeout: 120000,
        requires: [...new Set([...LOGIN_PERMISSIONS, ...wanted])]
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
        const balance = typeof me['sys.currency'] === 'number' ? me['sys.currency'] : null;
        const txns = me['sys.transactions'] || me.transactions || [];
        let donationsReceived = 0;
        let donationsGiven = 0;
        if (Array.isArray(txns)) {
            for (const t of txns) {
                const note = String(t.note || '').toLowerCase();
                if (!note.includes('donation')) continue;
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
    ensureScopes
};
