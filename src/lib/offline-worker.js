import log from './utils/log';

const isSupported = () => Boolean(process.env.ENABLE_SERVICE_WORKER) && 'serviceWorker' in navigator;

const currentRegistration = () => (isSupported() ? navigator.serviceWorker.getRegistration() : Promise.resolve(null));

let registered = false;

const registerOfflineWorker = () => {
    if (registered || !isSupported()) return;
    registered = true;
    const register = () => navigator.serviceWorker.register(`${process.env.ROOT}sw.js`)
        .catch(error => log.error('The offline worker could not be registered', error));
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, {once: true});
};

const untilInstalled = worker => new Promise((resolve, reject) => {
    const check = () => {
        if (worker.state === 'installed') resolve();
        else if (worker.state === 'redundant') reject(new Error('The new version could not be installed.'));
    };
    worker.addEventListener('statechange', check);
    check();
});

const prepareUpdate = async () => {
    const registration = await currentRegistration();
    if (!registration || !navigator.serviceWorker.controller) return;
    if (!registration.waiting) await registration.update();
    if (registration.installing) await untilInstalled(registration.installing);
    if (!registration.waiting) throw new Error('The new version is not ready yet.');
};

const switchToUpdate = async () => {
    const registration = await currentRegistration();
    if (!registration?.waiting || !navigator.serviceWorker.controller) return;
    const switched = new Promise(resolve => {
        navigator.serviceWorker.addEventListener('controllerchange', resolve, {once: true});
    });
    registration.waiting.postMessage({type: 'SKIP_WAITING'});
    await switched;
};

export {
    registerOfflineWorker,
    prepareUpdate,
    switchToUpdate
};
