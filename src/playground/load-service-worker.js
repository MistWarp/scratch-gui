import log from '../lib/utils/log';

// sw.js is emitted to the build root by the mw-service-worker plugin (see vite.config.mjs).
const serviceWorkerUrl = `${process.env.ROOT}sw.js`;

let loaded = false;
const actuallyLoadServiceWorker = () => {
    navigator.serviceWorker.register(serviceWorkerUrl)
        .catch(err => {
            log.error('sw error', err);
        });
};
const loadServiceWorker = () => {
    if (process.env.ENABLE_SERVICE_WORKER && 'serviceWorker' in navigator && !loaded) {
        loaded = true;
        if (document.readyState === 'complete') {
            actuallyLoadServiceWorker();
        } else {
            window.addEventListener('load', actuallyLoadServiceWorker);
        }
    }
};

export {
    loadServiceWorker
};
