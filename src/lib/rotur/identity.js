import {
    restoreSession as roturRestore,
    login as roturLogin,
    logout as roturLogout,
    getRotur
} from './client.js';
import {onRoturLogout} from './cloud-sync.js';
import {clearGitAuth} from './git-api.js';
import {
    runExchange,
    onAuthInvalid,
    onBanned,
    loadSession,
    storeSession,
    logout as mistLogout
} from '../community/api.js';

const ROTUR_TOKEN_KEY = 'mw:rotur-token';
const MIST_SESSION_KEY = 'mw:mistwarp-session';

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

const readRoturToken = () => {
    try {
        return localStorage.getItem(ROTUR_TOKEN_KEY);
    } catch (_) {
        return null;
    }
};

const adoptUrlToken = () => {
    try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (!token || !token.startsWith('rotur_')) {
            return;
        }
        if (token !== readRoturToken()) {
            roturLogout();
            localStorage.setItem(ROTUR_TOKEN_KEY, token);
            storeSession(null);
        }
        params.delete('token');
        const query = params.toString();
        const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
        window.history.replaceState(null, '', nextUrl);
    } catch (_) {
        return;
    }
};

const ensureMistSession = () => {
    const existing = loadSession();
    if (existing) {
        return Promise.resolve(existing);
    }
    const token = getRotur().token || readRoturToken();
    if (!token) {
        return Promise.resolve(null);
    }
    return runExchange(token);
};

const invalidateFailedValidator = error => {
    if (!error || error.code !== 'VALIDATOR_GENERATION_FAILED') return false;
    roturLogout();
    storeSession(null);
    setState({status: 'idle', user: null});
    return true;
};

let restoreInFlight = null;

const doRestore = async () => {
    setState({status: 'restoring'});
    adoptUrlToken();
    let user = null;
    try {
        user = await roturRestore();
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
    setState({status: 'ready', user, banMessage: null});
    return user;
};

const restore = () => {
    if (!restoreInFlight) {
        restoreInFlight = doRestore().finally(() => {
            restoreInFlight = null;
        });
    }
    return restoreInFlight;
};

const login = async () => {
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
    setState({status: 'ready', user, banMessage: null});
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
    setState({status: 'idle', user: null, banMessage: null});
};

const getMistSession = () => loadSession();
const getRoturToken = () => getRotur().token || readRoturToken();

onAuthInvalid(() => invalidateFailedValidator({code: 'VALIDATOR_GENERATION_FAILED'}));
onBanned(message => {
    roturLogout();
    storeSession(null);
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
    setState({status: 'idle', user: null, banMessage: message || 'This account is banned from MistWarp.'});
});

if (typeof window !== 'undefined') {
    window.addEventListener('storage', event => {
        if (event.key !== ROTUR_TOKEN_KEY && event.key !== MIST_SESSION_KEY) {
            return;
        }
        const token = readRoturToken();
        if (!token) {
            if (state.user) {
                roturLogout();
                storeSession(null);
                setState({status: 'idle', user: null});
            }
        } else if (!state.user) {
            restore();
        } else if (event.key === ROTUR_TOKEN_KEY && event.newValue !== event.oldValue) {
            restore();
        }
    });
}

export {
    getState,
    subscribe,
    restore,
    login,
    logout,
    ensureMistSession,
    getMistSession,
    getRoturToken
};
