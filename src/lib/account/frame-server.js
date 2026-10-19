import {PROMPT_LIFETIME, publicIdentity, toError, fromError} from './protocol.js';

const EDITOR_ROTUR_METHODS = new Set([
    'notifications.list'
]);

const RESERVED_IDS = ['__proto__', 'constructor', 'prototype'];

const validProjectId = id => typeof id === 'undefined' ||
    (typeof id === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(id) && !RESERVED_IDS.includes(id));

const validProject = project => project && typeof project === 'object' &&
    typeof project.name === 'string' && project.name.length <= 200 && validProjectId(project.id);

const TOKEN_REUSE_MARGIN = 300000;
const RENEW_INTERVAL = 300000;
const FAILED_MINT_WAIT = 10000;
const MINT_TIMEOUT = 30000;
const CHECK_INTERVAL = 10000;

const signedInName = state => (state && state.user && state.user.username ? String(state.user.username) : '');

const fingerprint = text => {
    let first = 0xdeadbeef;
    let second = 0x41c6ce57;
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        first = Math.imul(first ^ code, 2654435761);
        second = Math.imul(second ^ code, 1597334677);
    }
    first = Math.imul(first ^ (first >>> 16), 2246822507) ^ Math.imul(second ^ (second >>> 13), 3266489909);
    second = Math.imul(second ^ (second >>> 16), 2246822507) ^ Math.imul(first ^ (first >>> 13), 3266489909);
    return `${(second >>> 0).toString(16)}${(first >>> 0).toString(16)}`;
};

const createMemoryStore = () => {
    let saved = null;
    return {
        read: () => saved,
        write: next => {
            saved = next;
        }
    };
};

const createStorageStore = (getStorage, key) => {
    const memory = createMemoryStore();
    return {
        read: () => {
            try {
                return JSON.parse(getStorage().getItem(key) || 'null');
            } catch (e) {
                return memory.read();
            }
        },
        write: next => {
            memory.write(next);
            try {
                getStorage().setItem(key, JSON.stringify(next));
            } catch (e) {
                // ignore
            }
        }
    };
};

const createSerialLock = () => {
    let tail = Promise.resolve();
    return task => {
        const run = tail.then(() => task());
        tail = run.catch(() => null);
        return run;
    };
};

const validSession = session => session && typeof session === 'object' && typeof session.token === 'string' &&
    session.token !== '' && Number.isFinite(session.expiresAt) && typeof session.username === 'string' &&
    typeof session.parent === 'string' && session.parent !== '';

const readMints = store => {
    let saved = null;
    try {
        saved = store.read();
    } catch (e) {
        saved = null;
    }
    if (!saved || typeof saved !== 'object') saved = {};
    const failure = saved.failure && typeof saved.failure === 'object' ? saved.failure : null;
    return {
        session: validSession(saved.session) ? saved.session : null,
        lastMint: Number(saved.lastMint) || 0,
        checkedAt: Number(saved.checkedAt) || 0,
        failedAt: failure ? Number(saved.failedAt) || 0 : 0,
        failure
    };
};

const withTimeout = (promise, delay) => {
    let timer = null;
    return Promise.race([
        promise,
        new Promise((resolve, reject) => {
            timer = setTimeout(() => reject(new Error('MistWarp took too long to answer. Try again.')), delay);
        })
    ]).finally(() => clearTimeout(timer));
};

const mintEditorSession = async ({ensureMistSession, dropMistSession, mint}) => {
    await ensureMistSession();
    try {
        return await mint();
    } catch (error) {
        if (!error || error.status !== 401) throw error;
        dropMistSession();
        await ensureMistSession();
        return mint();
    }
};

const EDITOR_DATA_ACTIONS = ['status', 'settings', 'restorePoints', 'restorePoint', 'asset', 'backpack', 'done'];

const CHAT_ACTIONS = ['validator', 'signingStatus', 'sign'];

const ACTIVITY_ACTIONS = ['set', 'clear'];

const createFrameServer = ({
    identity, createEditorSession, mistSession, callRotur, projectRotur, confirmSignOut,
    activity, chat, editorData,
    tokenRejected = () => Promise.resolve(false),
    store = createMemoryStore(), lock = createSerialLock(), now = Date.now
}) => {
    let signingOut = null;

    const parentKey = () => {
        const token = mistSession();
        return token ? fingerprint(String(token)) : '';
    };

    const elapsedSince = time => {
        const elapsed = now() - time;
        return elapsed < 0 ? Infinity : elapsed;
    };

    const mintFor = async (username, saved) => {
        if (saved.failure && elapsedSince(saved.failedAt) < FAILED_MINT_WAIT) throw fromError(saved.failure);
        let next;
        try {
            const result = await withTimeout(Promise.resolve().then(createEditorSession), MINT_TIMEOUT);
            next = {
                token: String((result && result.token) || ''),
                expiresAt: Number(result && result.expiresAt),
                username,
                parent: parentKey()
            };
            if (!validSession(next)) throw new Error('MistWarp could not start an editor session. Try again.');
        } catch (error) {
            store.write({...readMints(store), failedAt: now(), failure: toError(error)});
            throw error;
        }
        const kept = signedInName(identity.getState()) === username;
        store.write({session: kept ? next : null, lastMint: now(), failedAt: 0, failure: null});
        if (!kept) throw Object.assign(new Error('Your MistWarp account changed. Try again.'), {code: 'bridge'});
        return next;
    };

    const editorSession = async stale => {
        const username = signedInName(identity.getState());
        if (!username) throw Object.assign(new Error('Sign in to MistWarp first'), {code: 'signed_out'});
        const saved = readMints(store);
        const session = saved.session;
        const parent = parentKey();
        const reusable = Boolean(session) && parent !== '' && session.parent === parent &&
            session.username === username && session.expiresAt - TOKEN_REUSE_MARGIN > now();
        const reported = reusable && typeof stale === 'string' && stale === session.token;
        let renew = reported && elapsedSince(saved.lastMint) >= RENEW_INTERVAL;
        if (reported && !renew && elapsedSince(saved.checkedAt) >= CHECK_INTERVAL) {
            store.write({...readMints(store), checkedAt: now()});
            renew = await withTimeout(Promise.resolve().then(() => tokenRejected(session.token)), MINT_TIMEOUT)
                .catch(() => false) === true;
        }
        const result = reusable && !renew ? session : await mintFor(username, saved);
        return {token: result.token, expiresAt: result.expiresAt};
    };

    const forgetSession = () => {
        store.write({...readMints(store), session: null});
    };

    const handlers = {
        identity: () => publicIdentity(identity.getState()),
        editorSession: ({stale}) => lock(() => editorSession(stale)),
        signOut: async () => {
            const username = signedInName(identity.getState());
            if (!username) return publicIdentity(identity.getState());
            if (!signingOut) {
                signingOut = Promise.resolve()
                    .then(() => confirmSignOut(username))
                    .then(answer => {
                        if (answer !== true || signedInName(identity.getState()) !== username) return;
                        identity.logout();
                        forgetSession();
                    })
                    .finally(() => {
                        signingOut = null;
                    });
            }
            await signingOut;
            return publicIdentity(identity.getState());
        },
        rotur: ({method, args}) => {
            if (typeof method !== 'string' || !EDITOR_ROTUR_METHODS.has(method)) {
                throw new Error('The editor cannot make that Rotur request');
            }
            return callRotur(method, Array.isArray(args) ? args : []);
        },
        editorData: args => {
            const action = args.action;
            if (!EDITOR_DATA_ACTIONS.includes(action) || !editorData) throw new Error('Unknown editor data request');
            return editorData[action](args);
        },
        chat: args => {
            if (!CHAT_ACTIONS.includes(args.action) || !chat) throw new Error('Unknown chat request');
            return chat[args.action](args);
        },
        activity: args => {
            if (!ACTIVITY_ACTIONS.includes(args.action) || !activity) throw new Error('Unknown activity request');
            if (!identity.getState().user) return false;
            return activity[args.action](args);
        },
        projectRotur: ({action, project, scopes, method, args}) => {
            if (!validProject(project)) throw new Error('This project cannot use Rotur');
            const deadline = Date.now() + PROMPT_LIFETIME;
            if (action === 'ensureConsent') {
                if (!Array.isArray(scopes) || !scopes.every(scope => typeof scope === 'string')) {
                    throw new Error('Projects cannot ask for that Rotur permission');
                }
                return projectRotur.ensureConsent(project, scopes, deadline);
            }
            if (action === 'call') {
                if (typeof method !== 'string') throw new Error('This project cannot make that Rotur request');
                return projectRotur.call(project, method, Array.isArray(args) ? args : [], deadline);
            }
            if (action === 'clear') return projectRotur.clear(project);
            throw new Error('This project cannot make that Rotur request');
        }
    };

    const serve = port => {
        const unsubscribe = identity.subscribe(state => {
            port.postMessage({kind: 'identity', identity: publicIdentity(state)});
        });
        port.onmessage = async ({data}) => {
            if (!data || typeof data !== 'object' || typeof data.id !== 'number') return;
            const handler = Object.prototype.hasOwnProperty.call(handlers, data.method) ? handlers[data.method] : null;
            try {
                if (!handler) throw new Error('Unknown MistWarp account request');
                const result = await handler(data.args && typeof data.args === 'object' ? data.args : {});
                const plain = typeof result === 'undefined' ? null : result;
                port.postMessage({
                    id: data.id,
                    result: data.method === 'editorData' || plain === null ? plain : JSON.parse(JSON.stringify(plain))
                });
            } catch (error) {
                port.postMessage({id: data.id, error: toError(error)});
            }
        };
        port.start();
        port.postMessage({kind: 'ready', identity: publicIdentity(identity.getState())});
        return unsubscribe;
    };

    return {serve, handlers};
};

export {
    EDITOR_ROTUR_METHODS,
    createFrameServer,
    createSerialLock,
    createStorageStore,
    mintEditorSession
};
