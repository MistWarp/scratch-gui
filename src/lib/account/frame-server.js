import {publicIdentity, toError} from './protocol.js';

const EDITOR_ROTUR_METHODS = new Set([
    'notifications.list'
]);

const RESERVED_IDS = ['__proto__', 'constructor', 'prototype'];

const validProjectId = id => typeof id === 'undefined' ||
    (typeof id === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(id) && !RESERVED_IDS.includes(id));

const validProject = project => project && typeof project === 'object' &&
    typeof project.name === 'string' && project.name.length <= 200 && validProjectId(project.id);

const createFrameServer = ({identity, createEditorSession, callRotur, projectRotur}) => {
    const handlers = {
        identity: () => publicIdentity(identity.getState()),
        editorSession: async () => {
            const state = identity.getState();
            if (!state.user) throw Object.assign(new Error('Sign in to MistWarp first'), {code: 'signed_out'});
            const result = await createEditorSession();
            return {token: String(result.token), expiresAt: Number(result.expiresAt)};
        },
        signOut: () => {
            identity.logout();
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
            if (action === 'ensureConsent') {
                if (!Array.isArray(scopes) || !scopes.every(scope => typeof scope === 'string')) {
                    throw new Error('Projects cannot ask for that Rotur permission');
                }
                return projectRotur.ensureConsent(project, scopes);
            }
            if (action === 'call') {
                if (typeof method !== 'string') throw new Error('This project cannot make that Rotur request');
                return projectRotur.call(project, method, Array.isArray(args) ? args : []);
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
