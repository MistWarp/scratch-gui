import {PROMPT_LIFETIME, publicIdentity, toError} from './protocol.js';

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

const signedInName = state => (state && state.user && state.user.username ? String(state.user.username) : '');

const createFrameServer = ({
    identity, createEditorSession, callRotur, projectRotur, confirmSignOut, now = Date.now
}) => {
    let session = null;
    let minting = null;
    let lastMint = -Infinity;

    const mint = username => {
        if (!minting) {
            minting = Promise.resolve(createEditorSession())
                .then(result => {
                    lastMint = now();
                    const next = {token: String(result.token), expiresAt: Number(result.expiresAt), username};
                    if (signedInName(identity.getState()) === username) session = next;
                    return next;
                })
                .finally(() => {
                    minting = null;
                });
        }
        return minting;
    };

    const handlers = {
        identity: () => publicIdentity(identity.getState()),
        editorSession: async ({stale}) => {
            const username = signedInName(identity.getState());
            if (!username) throw Object.assign(new Error('Sign in to MistWarp first'), {code: 'signed_out'});
            const reusable = session && session.username === username &&
                session.expiresAt - TOKEN_REUSE_MARGIN > now();
            const renew = reusable && typeof stale === 'string' && stale === session.token &&
                now() - lastMint >= RENEW_INTERVAL;
            const result = reusable && !renew ? session : await mint(username);
            return {token: result.token, expiresAt: result.expiresAt};
        },
        signOut: async () => {
            if (signedInName(identity.getState()) && await confirmSignOut() === true) identity.logout();
            return publicIdentity(identity.getState());
        },
        rotur: ({method, args}) => {
            if (typeof method !== 'string' || !EDITOR_ROTUR_METHODS.has(method)) {
                throw new Error('The editor cannot make that Rotur request');
            }
            return callRotur(method, Array.isArray(args) ? args : []);
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

    identity.subscribe(state => {
        if (session && session.username !== signedInName(state)) session = null;
    });

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
                port.postMessage({
                    id: data.id,
                    result: typeof result === 'undefined' ? null : JSON.parse(JSON.stringify(result))
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
    createFrameServer
};
