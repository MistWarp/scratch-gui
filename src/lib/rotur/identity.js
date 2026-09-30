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
    request as mistRequest,
    logout as mistLogout
} from '../community/api.js';
import {ROTUR_TOKEN_KEY} from './token-key.js';
import {isStudentSession, readStudentFlag, writeStudentFlag} from './student-flag.js';

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

const studentUser = me => ({
    username: me.username,
    displayName: me.displayName || me.username,
    isStudent: true
});

const forgetRoturToken = () => {
    try {
        localStorage.removeItem(ROTUR_TOKEN_KEY);
        return true;
    } catch (_) {
        return false;
    }
};

const restoreStudent = async () => {
    if (!readStudentFlag()) return {user: null};
    if (!loadSession()) {
        writeStudentFlag(false);
        return {user: null};
    }
    try {
        const me = await mistRequest('/me', {cache: false});
        if (me && me.isStudent && me.username) return {user: studentUser(me)};
    } catch (error) {
        if (loadSession() && !(error && error.status)) return {user: null, retry: true};
    }
    writeStudentFlag(false);
    storeSession(null);
    return {user: null};
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
    adoptUrlToken();
    const student = await restoreStudent();
    if (student.user) {
        setState({status: 'ready', user: student.user, banMessage: null});
        return student.user;
    }
    if (student.retry) {
        setState({status: 'idle', user: null});
        return null;
    }
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

const loginStudent = ({token, username, displayName}) => {
    roturLogout();
    forgetRoturToken();
    storeSession(token);
    writeStudentFlag(true);
    const user = studentUser({username, displayName});
    setState({status: 'ready', user, banMessage: null});
    return user;
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
    writeStudentFlag(false);
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
    writeStudentFlag(false);
    storeSession(null);
    setState({status: 'idle', user: null, banMessage: null});
};

const getMistSession = () => loadSession();
const getRoturToken = () => getRotur().token || readRoturToken();

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

if (typeof window !== 'undefined') {
    window.addEventListener('storage', event => {
        if (event.key !== ROTUR_TOKEN_KEY && event.key !== MIST_SESSION_KEY) {
            return;
        }
        const token = readRoturToken();
        if (readStudentFlag()) {
            if (!loadSession() && state.user) {
                writeStudentFlag(false);
                setState({status: 'idle', user: null});
            } else if (loadSession() && !state.user) {
                restore();
            }
        } else if (!token) {
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
    loginStudent,
    logout,
    ensureMistSession,
    getMistSession,
    isStudentSession,
    getRoturToken,
    getMistWarpAuthor
};
