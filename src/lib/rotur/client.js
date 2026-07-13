import {Rotur} from 'rotur-sdk';
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
 * @returns {{username: string, avatarUrl: string, bio: string|null}|null}
 */
const normalizeUser = data => {
    if (!data || typeof data !== 'object' || data.error) {
        return null;
    }
    const username = data.username || data.name || data.user;
    if (!username || typeof username !== 'string') {
        return null;
    }
    return {
        username,
        avatarUrl: getAvatarUrl(username),
        bio: typeof data.bio === 'string' ? data.bio : null
    };
};

const fetchCurrentUser = async () => {
    const rotur = getClient();
    if (!rotur.loggedIn) {
        return null;
    }
    try {
        const user = normalizeUser(await rotur.me.get());
        if (user) return user;
    } catch (_) {
        // fall through
    }
    try {
        const auth = await rotur.me.checkAuth();
        if (auth && auth.username) {
            return normalizeUser({username: auth.username});
        }
    } catch (_) {
        // fall through
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
        requires: ['account:view', 'account:profile', 'files:view', 'files:manage']
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

    const title = formatActivityTitle();
    const status = formatActivityStatus(ctx);

    const activity = {
        id: ACTIVITY_ID,
        title,
        status,
        image: APP_IMAGE,
        url: APP_URL,
        application: {
            name: ACTIVITY_ID,
            url: APP_URL
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
    fetchCurrentUser
};
