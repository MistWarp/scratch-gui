import {ACCOUNT_ORIGIN} from './origins.js';
import {CHANNEL, FRAME_PATH, CALL_TIMEOUT, CONNECT_TIMEOUT, fromError} from './protocol.js';

const HIDDEN_STYLE = 'position:fixed;width:0;height:0;border:0;opacity:0;pointer-events:none;left:0;top:0;';
const SHOWN_STYLE = 'position:fixed;inset:0;width:100%;height:100%;border:0;z-index:2147483647;' +
    'background:rgba(0, 0, 0, 0.55);color-scheme:normal;';

let connection = null;
let frame = null;
let port = null;
let nextId = 0;
let identity = {status: 'restoring', user: null, banMessage: null};
const pending = new Map();
const identityListeners = new Set();

const setIdentity = next => {
    identity = next;
    for (const listener of identityListeners) {
        try {
            listener(identity);
        } catch (e) {
            // ignore
        }
    }
};

const setShown = shown => {
    if (!frame) return;
    frame.setAttribute('style', shown ? SHOWN_STYLE : HIDDEN_STYLE);
    frame.setAttribute('aria-hidden', shown ? 'false' : 'true');
    frame.tabIndex = shown ? 0 : -1;
    if (shown) frame.focus();
};

const rejectAll = error => {
    for (const request of pending.values()) {
        clearTimeout(request.timer);
        request.reject(error);
    }
    pending.clear();
};

const handleMessage = ({data}) => {
    if (!data || typeof data !== 'object') return;
    if (data.kind === 'identity') {
        setIdentity(data.identity);
        return;
    }
    if (data.kind === 'show' || data.kind === 'hide') {
        setShown(data.kind === 'show');
        return;
    }
    const request = pending.get(data.id);
    if (!request) return;
    pending.delete(data.id);
    clearTimeout(request.timer);
    if (data.error) request.reject(fromError(data.error));
    else request.resolve(data.result);
};

const connect = () => {
    if (connection) return connection;
    connection = new Promise((resolve, reject) => {
        frame = document.createElement('iframe');
        frame.src = `${ACCOUNT_ORIGIN}${FRAME_PATH}`;
        frame.title = 'MistWarp account';
        setShown(false);
        const thisFrame = frame;
        const timer = setTimeout(() => {
            connection = null;
            if (frame === thisFrame) frame = null;
            thisFrame.remove();
            reject(Object.assign(new Error('Could not reach your MistWarp account. Check your connection and reload.'),
                {code: 'bridge'}));
        }, CONNECT_TIMEOUT);
        thisFrame.addEventListener('load', () => {
            if (frame !== thisFrame) return;
            const channel = new MessageChannel();
            setShown(false);
            if (port) {
                port.close();
                rejectAll(Object.assign(new Error('Your MistWarp account reloaded. Try again.'), {code: 'bridge'}));
            }
            port = channel.port1;
            port.onmessage = event => {
                if (event.data && event.data.kind === 'ready') {
                    clearTimeout(timer);
                    setIdentity(event.data.identity);
                    resolve();
                    return;
                }
                handleMessage(event);
            };
            port.start();
            thisFrame.contentWindow.postMessage({type: CHANNEL, kind: 'connect'}, ACCOUNT_ORIGIN, [channel.port2]);
        });
        document.body.appendChild(thisFrame);
    });
    return connection;
};

const call = async (method, args = {}) => {
    await connect();
    return new Promise((resolve, reject) => {
        const id = ++nextId;
        const timer = setTimeout(() => {
            pending.delete(id);
            const message = 'Your MistWarp account did not answer. Check for an open dialog and try again.';
            reject(Object.assign(new Error(message), {code: 'bridge'}));
        }, CALL_TIMEOUT);
        pending.set(id, {resolve, reject, timer});
        try {
            port.postMessage({id, method, args});
        } catch (error) {
            clearTimeout(timer);
            pending.delete(id);
            reject(error);
        }
    });
};

const getIdentity = () => identity;

const subscribeIdentity = listener => {
    identityListeners.add(listener);
    return () => identityListeners.delete(listener);
};

export {
    connect,
    call,
    getIdentity,
    subscribeIdentity
};
