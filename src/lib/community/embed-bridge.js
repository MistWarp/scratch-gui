const pending = new Map();
let nextId = 0;
let listening = false;

const hasBridge = () => {
    try {
        return window.parent !== window &&
            new URLSearchParams(window.location.search).get('mw_bridge') === '1';
    } catch (e) {
        return false;
    }
};

const ensureListener = () => {
    if (listening) return;
    listening = true;
    window.addEventListener('message', event => {
        if (event.source !== window.parent) return;
        const data = event.data;
        if (!data || data.type !== 'mw:fetch-result' || !pending.has(data.id)) return;
        const entry = pending.get(data.id);
        pending.delete(data.id);
        clearTimeout(entry.timeout);
        if (data.buffer) {
            entry.resolve(data.buffer);
        } else {
            entry.reject(new Error('Parent page could not fetch the resource'));
        }
    });
};

const bridgeFetch = url => new Promise((resolve, reject) => {
    ensureListener();
    const id = ++nextId;
    const timeout = setTimeout(() => {
        pending.delete(id);
        reject(new Error('Parent page fetch timed out'));
    }, 60000);
    pending.set(id, {resolve, reject, timeout});
    window.parent.postMessage({type: 'mw:fetch', id, url}, '*');
});

export {hasBridge, bridgeFetch};
