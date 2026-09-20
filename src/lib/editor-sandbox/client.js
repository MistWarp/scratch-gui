import {CHANNEL, isIsolatedEditor} from './protocol.js';

let port;
let initialRestore = null;
const eventListeners = new Set();
export const getInitialEditorRestore = () => initialRestore;
export const subscribeEditorEvents = listener => {
    eventListeners.add(listener);
    return () => eventListeners.delete(listener);
};
let identity = {status: 'idle', user: null};
let nextId = 0;
const pending = new Map();
const identityListeners = new Set();
export const getEditorIdentity = () => identity;
export const subscribeEditorIdentity = listener => {
    identityListeners.add(listener);
    return () => identityListeners.delete(listener);
};
export const callEditorHost = (method, args = {}) => new Promise((resolve, reject) => {
    if (!port) return reject(new Error('The isolated editor is not connected. Reopen the editor.'));
    const id = ++nextId;
    const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error('The editor request timed out. Check the editor account controls.'));
    }, 240000);
    pending.set(id, {resolve, reject, timer});
    try {
        port.postMessage({id, method, args});
    } catch (error) {
        clearTimeout(timer);
        pending.delete(id);
        reject(error);
    }
});
export const connectEditorHost = () => new Promise((resolve, reject) => {
    if (!isIsolatedEditor()) return reject(new Error('Open this editor through the MistWarp editor page.'));
    const timer = setTimeout(() => {
        window.removeEventListener('message', receive); // eslint-disable-line no-use-before-define
        reject(new Error('The editor host did not connect. Reopen the editor.'));
    }, 15000);
    const receive = event => {
        if (event.source !== window.parent || event.data?.type !== CHANNEL ||
            event.data?.kind !== 'connect' || !event.ports[0]) return;
        clearTimeout(timer);
        window.removeEventListener('message', receive);
        port = event.ports[0];
        port.onmessage = ({data}) => {
            if (data?.kind === 'database-import') {
                for (const listener of eventListeners) listener(data);
                return;
            }
            if (data?.kind === 'identity') {
                identity = data.identity;
                for (const listener of identityListeners) listener(identity);
                return;
            }
            const request = pending.get(data?.id);
            if (!request) return;
            pending.delete(data.id);
            clearTimeout(request.timer);
            if (data.error) {
                request.reject(Object.assign(new Error(data.error.message), {
                    code: data.error.code, status: data.error.status
                }));
            } else request.resolve(data.result);
        };
        port.start();
        identity = event.data.identity;
        initialRestore = event.data.seed.restore || null;
        resolve(event.data.seed);
    };
    window.addEventListener('message', receive);
    window.parent.postMessage({type: CHANNEL, kind: 'ready'}, '*');
});

export const editorRequest = async (path, options = {}) => {
    const {method = 'GET', body, raw = false} = options;
    const form = typeof FormData !== 'undefined' && body instanceof FormData ? [...body.entries()] : null;
    const result = await callEditorHost('request', {path, method, body: form ? void 0 : body, form, raw});
    return raw ? new Response(result.body, {status: result.status, headers: result.headers}) : result;
};
