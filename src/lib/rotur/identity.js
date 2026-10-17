import {
    restoreSession as roturRestore,
    login as roturLogin,
    logout as roturLogout,
    accountKey,
    getAccessToken,
    getAvatarUrl,
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
    setSessionProvider,
    logout as mistLogout
} from '../community/api.js';
import {ACCOUNT_ORIGIN, isSplitEditor} from '../account/origins.js';
import {FRAME_PATH} from '../account/protocol.js';
import * as accountBridge from '../account/bridge.js';
import {setMinorAccount} from '../minor-account.js';
import {ROTUR_TOKEN_KEY} from './token-key.js';
import {sleep} from '../utils/async.js';

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

const TOKEN_MARGIN = 60000;
const SIGN_IN_POPUP = 'mw-account-signin';
const MINT_RETRY_DELAY = 30000;
let editorToken = null;
let staleToken = null;
let editorTokenRequest = null;
let mintFailedAt = 0;
let tokenGeneration = 0;
let identityGeneration = 0;
let applying = null;
let splitWired = false;

const bridgeUsername = () => {
    const user = accountBridge.getIdentity().user;
    return user && user.username ? user.username : '';
};

const splitSession = {
    get: () => (editorToken && editorToken.username === bridgeUsername() &&
        editorToken.expiresAt - TOKEN_MARGIN > Date.now() ? editorToken.token : null),
    refresh: () => {
        const username = bridgeUsername();
        if (!username || Date.now() - mintFailedAt < MINT_RETRY_DELAY) return Promise.resolve(null);
        if (!editorTokenRequest) {
            const generation = tokenGeneration;
            editorTokenRequest = accountBridge.call('editorSession', staleToken ? {stale: staleToken} : {})
                .then(next => {
                    if (generation !== tokenGeneration || username !== bridgeUsername()) return null;
                    mintFailedAt = 0;
                    staleToken = null;
                    editorToken = {...next, username};
                    return next.token;
                }, error => {
                    if (!error || error.code !== 'bridge') mintFailedAt = Date.now();
                    throw error;
                })
                .finally(() => {
                    editorTokenRequest = null;
                });
        }
        return editorTokenRequest;
    },
    clear: () => {
        tokenGeneration += 1;
        staleToken = editorToken ? editorToken.token : null;
        editorToken = null;
        editorTokenRequest = null;
    }
};

const userFromBridge = user => (user && user.username ? {
    username: user.username,
    id: user.id || null,
    avatarUrl: getAvatarUrl(user.username),
    bio: user.bio
} : null);

const applyIdentity = async (entry, generation) => {
    const user = userFromBridge(entry.next.user);
    if (!user || (editorToken && editorToken.username !== user.username)) storeSession(null);
    if (user && !splitSession.get()) {
        await splitSession.refresh().catch(() => null);
        if (generation !== identityGeneration) return;
    }
    const latest = entry.next;
    setState({
        status: latest.status === 'restoring' ? 'restoring' : (user ? 'ready' : 'idle'),
        user,
        banMessage: latest.banMessage || null,
        reconnect: false
    });
};

const applyBridgeIdentity = next => {
    const username = next && next.user && next.user.username ? next.user.username : '';
    if (applying && applying.username === username) {
        applying.next = next;
        return applying.promise;
    }
    const generation = ++identityGeneration;
    const entry = {username, next};
    entry.promise = applyIdentity(entry, generation).finally(() => {
        if (applying === entry) applying = null;
    });
    applying = entry;
    return entry.promise;
};

const wireSplitEditor = () => {
    if (splitWired) return;
    splitWired = true;
    setSessionProvider(splitSession);
    accountBridge.subscribeIdentity(applyBridgeIdentity);
};

const restoreSplitEditor = async () => {
    wireSplitEditor();
    if (!state.user) setState({status: 'restoring'});
    try {
        await accountBridge.connect();
    } catch (_) {
        setState({status: 'idle', user: null});
        return null;
    }
    await applyBridgeIdentity(accountBridge.getIdentity());
    return state.user;
};

const loginSplitEditor = () => {
    wireSplitEditor();
    const left = Math.max(0, (screen.width - 480) / 2);
    const top = Math.max(0, (screen.height - 720) / 2);
    const popup = window.open(`${ACCOUNT_ORIGIN}${FRAME_PATH}?signin=1`, SIGN_IN_POPUP,
        `popup,width=480,height=720,left=${left},top=${top}`);
    if (!popup) {
        return Promise.reject(Object.assign(new Error('Allow pop-ups for this site to sign in with Rotur'),
            {code: 'popup_blocked'}));
    }
    return new Promise((resolve, reject) => {
        let unsubscribe = null;
        let watch = null;
        const finish = () => {
            clearInterval(watch);
            if (unsubscribe) unsubscribe();
        };
        unsubscribe = accountBridge.subscribeIdentity(next => {
            if (!next.user) return;
            finish();
            restoreSplitEditor().then(resolve, reject);
        });
        watch = setInterval(() => {
            if (!popup.closed) return;
            finish();
            restoreSplitEditor().then(user => {
                if (user) resolve(user);
                else reject(Object.assign(new Error('The Rotur sign-in window was closed'), {code: 'closed'}));
            }, reject);
        }, 500);
    });
};

const ensureMistSession = async () => {
    if (isSplitEditor()) return splitSession.get() || splitSession.refresh();
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
// Signed out here, keeping the Rotur session if another tab still uses it.
const signedOutElsewhere = () => {
    setState({status: 'idle', user: null, reconnect: false});
    roturLogout();
    storeSession(null);
    setMinorAccount(false);
};

const isSomeoneElse = session => (state.user.id ?
    String(state.user.id) !== session.subject :
    state.user.username !== session.username);

let wired = false;
const wireSession = () => {
    if (wired) return;
    wired = true;
    setRoturTokenGetter(getAccessToken);
    onSessionChange(session => {
        if (state.status === 'logging-in') return;
        if (session && (!state.user || isSomeoneElse(session))) {
            // Signed in, or switched account, in another tab. The MistWarp
            // session belongs to whoever was here before.
            if (state.user) storeSession(null);
            // eslint-disable-next-line no-use-before-define
            restore();
        } else if (!session && state.user && !needsReconnect()) {
            signedOutElsewhere();
        }
    });
    // The old sign-in has no session events: notice another tab removing it.
    window.addEventListener('storage', event => {
        if (event.key === ROTUR_TOKEN_KEY && !event.newValue && state.user && !accountKey()) {
            signedOutElsewhere();
        }
    });
};

let restoreInFlight = null;
const RESTORE_RETRY_DELAYS = [1000, 3000];

const restoreWithRetry = async () => {
    for (let attempt = 0; ; attempt++) {
        try {
            return await roturRestore();
        } catch (error) {
            if (!error || !error.transient || attempt >= RESTORE_RETRY_DELAYS.length) throw error;
            await sleep(RESTORE_RETRY_DELAYS[attempt]);
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
    if (isSplitEditor()) {
        if (!restoreInFlight) {
            restoreInFlight = restoreSplitEditor().finally(() => {
                restoreInFlight = null;
            });
        }
        return restoreInFlight;
    }
    wireSession();
    if (!restoreInFlight) {
        restoreInFlight = doRestore().finally(() => {
            restoreInFlight = null;
        });
    }
    return restoreInFlight;
};

const login = async () => {
    if (isSplitEditor()) return loginSplitEditor();
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
    if (isSplitEditor()) {
        return accountBridge.call('signOut').then(next => {
            if (next && next.user) return;
            identityGeneration += 1;
            applying = null;
            storeSession(null);
            try {
                onRoturLogout();
            } catch (_) {
                // ignore
            }
            setMinorAccount(false);
            setState({status: 'idle', user: null, banMessage: null, reconnect: false});
        })
            .catch(() => null);
    }
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
const getRoturToken = () => (isSplitEditor() ? null : getRotur().token);

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
