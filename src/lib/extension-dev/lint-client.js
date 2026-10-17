import {lintExtension} from './lint.js';

const createLinter = () => {
    let disposed = false;
    let worker = null;
    let workerReady = null;
    let latest = null;
    let busy = false;
    let nextId = 1;

    const supersede = () => {
        if (latest) latest.resolve(null);
        latest = null;
    };

    const actions = {};

    const runDirect = request => {
        Promise.resolve().then(() => {
            if (latest !== request) return;
            latest = null;
            try {
                request.resolve(lintExtension(request.source, request.options));
            } catch (error) {
                request.reject(error);
            }
        });
    };

    const failOver = () => {
        if (worker) worker.terminate();
        worker = null;
        busy = false;
        workerReady = Promise.resolve(null);
        if (latest) latest.sent = false;
        actions.pump();
    };

    const startWorker = () => {
        if (workerReady) return workerReady;
        if (typeof Worker === 'undefined') {
            workerReady = Promise.resolve(null);
            return workerReady;
        }
        workerReady = import('./lint-worker-spawn.js')
            .then(module => {
                if (disposed) return null;
                worker = module.default();
                worker.onmessage = event => {
                    const {id, diagnostics, error} = event.data || {};
                    busy = false;
                    if (latest && latest.id === id) {
                        const request = latest;
                        latest = null;
                        if (error) request.reject(new Error(error));
                        else request.resolve(diagnostics);
                    }
                    actions.pump();
                };
                worker.onerror = event => {
                    if (event && event.preventDefault) event.preventDefault();
                    failOver();
                };
                return worker;
            })
            .catch(() => null);
        return workerReady;
    };

    actions.pump = () => {
        if (disposed || !latest || latest.sent) return;
        startWorker().then(active => {
            const request = latest;
            if (disposed || !request || request.sent) return;
            if (!active) {
                request.sent = true;
                runDirect(request);
                return;
            }
            if (busy) return;
            busy = true;
            request.sent = true;
            try {
                active.postMessage({id: request.id, source: request.source, options: request.options});
            } catch (error) {
                failOver();
            }
        });
    };

    const lint = (source, options = {}) => {
        if (disposed) return Promise.resolve(null);
        supersede();
        return new Promise((resolve, reject) => {
            latest = {id: nextId++, source, options, resolve, reject, sent: false};
            actions.pump();
        });
    };

    const dispose = () => {
        disposed = true;
        if (worker) worker.terminate();
        worker = null;
        supersede();
    };

    return {lint, dispose};
};

export {createLinter};
