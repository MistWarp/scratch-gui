const settle = () => new Promise(resolve => setTimeout(resolve, 0));

const createWorker = state => {
    const listeners = [];
    return {
        state,
        postMessage: jest.fn(),
        addEventListener: (type, listener) => listeners.push(listener),
        become (next) {
            this.state = next;
            listeners.forEach(listener => listener());
        }
    };
};

const setup = ({enabled = true, controlled = true, registration = null} = {}) => {
    jest.resetModules();
    process.env.ENABLE_SERVICE_WORKER = enabled ? 'true' : '';
    process.env.ROOT = '/';
    const controllerListeners = [];
    const serviceWorker = {
        controller: controlled ? {} : null,
        register: jest.fn(() => Promise.resolve()),
        getRegistration: jest.fn(() => Promise.resolve(registration)),
        addEventListener: (type, listener) => controllerListeners.push({type, listener}),
        changeController: () => controllerListeners
            .filter(({type}) => type === 'controllerchange')
            .forEach(({listener}) => listener())
    };
    Object.defineProperty(navigator, 'serviceWorker', {configurable: true, value: serviceWorker});
    return {serviceWorker, offline: require('../../../src/lib/offline-worker')};
};

afterEach(() => {
    delete navigator.serviceWorker;
    delete process.env.ENABLE_SERVICE_WORKER;
});

test('registers the worker once, after the page has loaded', () => {
    const {serviceWorker, offline} = setup();
    offline.registerOfflineWorker();
    offline.registerOfflineWorker();
    expect(serviceWorker.register).toHaveBeenCalledTimes(1);
    expect(serviceWorker.register).toHaveBeenCalledWith('/sw.js');
});

test('builds without the worker never register it', () => {
    const {serviceWorker, offline} = setup({enabled: false});
    offline.registerOfflineWorker();
    expect(serviceWorker.register).not.toHaveBeenCalled();
});

test('an update is ready once the new worker has installed', async () => {
    const installing = createWorker('installing');
    const registration = {waiting: null, installing, update: jest.fn(() => Promise.resolve())};
    const {offline} = setup({registration});
    let ready = false;
    const preparing = offline.prepareUpdate().then(() => {
        ready = true;
    });
    await settle();
    expect(registration.update).toHaveBeenCalled();
    expect(ready).toBe(false);
    registration.waiting = installing;
    registration.installing = null;
    installing.become('installed');
    await preparing;
    expect(ready).toBe(true);
});

test('a failed update is not offered', async () => {
    const installing = createWorker('installing');
    const registration = {waiting: null, installing, update: jest.fn(() => Promise.resolve())};
    const {offline} = setup({registration});
    const preparing = offline.prepareUpdate();
    await settle();
    installing.become('redundant');
    await expect(preparing).rejects.toThrow('The new version could not be installed.');
});

test('pages the worker does not control reload straight into the new version', async () => {
    const registration = {waiting: null, installing: null, update: jest.fn()};
    const {offline} = setup({registration, controlled: false});
    await offline.prepareUpdate();
    expect(registration.update).not.toHaveBeenCalled();
});

test('switching asks the waiting worker to take over and waits until it has', async () => {
    const waiting = createWorker('installed');
    const {serviceWorker, offline} = setup({registration: {waiting}});
    let switched = false;
    const switching = offline.switchToUpdate().then(() => {
        switched = true;
    });
    await settle();
    expect(waiting.postMessage).toHaveBeenCalledWith({type: 'SKIP_WAITING'});
    expect(switched).toBe(false);
    serviceWorker.changeController();
    await switching;
    expect(switched).toBe(true);
});
