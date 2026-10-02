import {
    restoreSession as roturRestore,
    login as roturLogin,
    logout as roturLogout,
    getAccessToken,
    getRotur,
    needsReconnect,
    onSessionChange
} from './client.js';
import {onRoturLogout} from './cloud-sync.js';
import {clearGitAuth} from './git-api.js';
import {
    runExchange,
    onAuthInvalid,
    onBanned,
    loadSession,
    storeSession,
    setRoturTokenGetter,
    logout as mistLogout
} from '../community/api.js';
import {setMinorAccount} from '../minor-account.js';

let state = {status: 'idle', user: null, banMessage: null};
const listeners = new Set();

const getState = () => state;

const emit = () => {
    for (const cb of listeners) {
        try {
            cb(state);
        } catch (_) {
            // ignore
        }
    }
};

const setState = patch => {
    state = {...state, ...patch};
    emit();
};

const subscribe = cb => {
    listeners.add(cb);
    return () => listeners.delete(cb);
};

const ensureMistSession = async () => {
    const existing = loadSession();
    if (existing) {
        return existing;
    }
    const token = await getAccessToken();
    return token ? runExchange(token) : null;
};

const invalidateFailedValidator = error => {
    if (!error || error.code !== 'VALIDATOR_GENERATION_FAILED') return false;
    roturLogout();
    storeSession(null);
    setMinorAccount(false);
    setState({status: 'idle', user: null});
    return true;
};

// Signing in or out in another tab, or Rotur ending the session. Wired on
// first use rather than on import.
let wired = false;
const wireSession = () => {
    if (wired) return;
    wired = true;
    setRoturTokenGetter(getAccessToken);
    onSessionChange(session => {
        if (state.status === 'logging-in') return;
        if (session && !state.user) {
            // eslint-disable-next-line no-use-before-define
            restore();
        } else if (!session && state.user && !needsReconnect()) {
            setState({status: 'idle', user: null, reconnect: false});
            roturLogout();
            storeSession(null);
            setMinorAccount(false);
        }
    });
};

let restoreInFlight = null;
const RESTORE_RETRY_DELAYS = [1000, 3000];

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const restoreWithRetry = async () => {
    for (let attempt = 0; ; attempt++) {
        try {
            return await roturRestore();
        } catch (error) {
            if (!error || !error.transient || attempt >= RESTORE_RETRY_DELAYS.length) throw error;
            await wait(RESTORE_RETRY_DELAYS[attempt]);
        }
    }
};

const doRestore = async () => {
    setState({status: 'restoring'});
    let user = null;
    try {
        user = await restoreWithRetry();
    } catch (_) {
        setState({status: 'idle', user: null});
        return null;
    }
    if (!user) {
        storeSession(null);
        setState({status: 'idle', user: null});
        return null;
    }
    try {
        await ensureMistSession();
    } catch (error) {
        if (invalidateFailedValidator(error)) return null;
        if (error && error.code === 'banned') return null;
    }
    setState({status: 'ready', user, banMessage: null, reconnect: needsReconnect()});
    return user;
};

const restore = () => {
    wireSession();
    if (!restoreInFlight) {
        restoreInFlight = doRestore().finally(() => {
            restoreInFlight = null;
        });
    }
    return restoreInFlight;
};

const login = async () => {
    wireSession();
    const previousUser = state.user;
    setState({status: 'logging-in'});
    let user;
    try {
        user = await roturLogin();
    } catch (error) {
        setState({status: previousUser ? 'ready' : 'idle', user: previousUser});
        throw error;
    }
    storeSession(null);
    try {
        await ensureMistSession();
    } catch (error) {
        if (invalidateFailedValidator(error)) throw error;
        if (error && error.code === 'banned') throw error;
    }
    setState({status: 'ready', user, banMessage: null, reconnect: needsReconnect()});
    return user;
};

const logout = () => {
    mistLogout().catch(() => null);
    try {
        onRoturLogout();
    } catch (_) {
        // ignore
    }
    try {
        clearGitAuth();
    } catch (_) {
        // ignore
    }
    roturLogout();
    storeSession(null);
    setMinorAccount(false);
    setState({status: 'idle', user: null, banMessage: null, reconnect: false});
};

const getMistSession = () => loadSession();
const getRoturToken = () => getRotur().token;

const getMistWarpAuthor = async () => {
    const user = state.user || await restore();
    const username = user && typeof user.username === 'string' ? user.username.trim() : '';
    if (!username) throw new Error('Sign in to Rotur before saving a MistWarp project');
    const emailName = username.toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'user';
    return {
        name: username,
        email: `${emailName}@users.mistwarp.local`
    };
};

onAuthInvalid(() => invalidateFailedValidator({code: 'VALIDATOR_GENERATION_FAILED'}));
onBanned((message, redirectUrl) => {
    roturLogout();
    storeSession(null);
    setMinorAccount(false);
    try {
        clearGitAuth();
    } catch (_) {
        // ignore
    }
    try {
        onRoturLogout();
    } catch (_) {
        // ignore
    }
    setState({
        status: 'idle',
        user: null,
        banMessage: message || 'This account is restricted from using Rotur and MistWarp.',
        redirectUrl: redirectUrl || 'https://rotur.dev/me'
    });
});

export {
    getState,
    subscribe,
    restore,
    login,
    logout,
    ensureMistSession,
    getMistSession,
    getRoturToken,
    getMistWarpAuthor
};
