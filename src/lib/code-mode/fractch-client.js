import {
    getChangeKey,
    getExtensionSignatureHash,
    getExtensionSignatures
} from 'scratch-vm/src/serialization/fractch-context';
import {createEngine} from './fractch-engine.js';

const generationOf = vm => vm._projectLoadGeneration || 0;

const liveTag = (vm, targetId) => {
    const target = vm.runtime.getTargetById(targetId);
    if (!target || !target.isOriginal) return null;
    return {generation: generationOf(vm), changeKey: getChangeKey(vm.runtime, target)};
};

const sameTag = (a, b) => Boolean(a && b) && a.generation === b.generation && a.changeKey === b.changeKey;

const createFractchClient = ({spawn = null} = {}) => {
    const posted = new Map();
    const pending = new Map();
    let generation = null;
    let signatureHash = null;
    let nextId = 1;
    let worker = null;
    let workerReady = null;
    let direct = null;
    let disposed = false;

    const runDirect = (id, message) => {
        if (!direct) direct = createEngine();
        Promise.resolve().then(() => {
            const request = pending.get(id);
            if (!request) return;
            pending.delete(id);
            try {
                request.resolve(direct.handle(message));
            } catch (error) {
                request.reject(error);
            }
        });
    };

    const failOver = () => {
        if (worker) worker.terminate();
        worker = null;
        workerReady = Promise.resolve(null);
        posted.clear();
        generation = null;
        for (const [id, request] of Array.from(pending)) {
            pending.delete(id);
            request.reject(new Error('The code worker stopped. Try again.'));
        }
    };

    const startWorker = () => {
        if (workerReady) return workerReady;
        if (typeof Worker === 'undefined') {
            workerReady = Promise.resolve(null);
            return workerReady;
        }
        const load = spawn ? Promise.resolve({default: spawn}) : import('./fractch-worker-spawn.js');
        workerReady = load
            .then(module => {
                if (disposed) return null;
                worker = module.default();
                worker.onmessage = event => {
                    const {id, result, error} = event.data || {};
                    const request = pending.get(id);
                    if (!request) return;
                    pending.delete(id);
                    if (error) request.reject(new Error(error));
                    else request.resolve(result);
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

    const request = message => new Promise((resolve, reject) => {
        if (disposed) {
            reject(new Error('The code worker was closed'));
            return;
        }
        const id = nextId++;
        pending.set(id, {resolve, reject});
        startWorker().then(active => {
            if (!pending.has(id)) return;
            if (!active) {
                runDirect(id, message);
                return;
            }
            try {
                active.postMessage({id, message});
            } catch (error) {
                pending.delete(id);
                reject(error);
            }
        });
    });

    const sync = vm => {
        const runtime = vm.runtime;
        const hash = getExtensionSignatureHash(runtime);
        const currentGeneration = generationOf(vm);
        if (currentGeneration !== generation || hash !== signatureHash) posted.clear();
        const originals = runtime.targets.filter(target => target.isOriginal);
        const stale = originals.filter(target => posted.get(target.id) !== getChangeKey(runtime, target, hash));
        const keep = originals.map(target => target.id);
        for (const id of Array.from(posted.keys())) {
            if (!keep.includes(id)) posted.delete(id);
        }
        if (!stale.length && currentGeneration === generation) return Promise.resolve();
        const full = stale.length === originals.length ? vm.getFractchContext() : null;
        const targets = full ? full.targets : stale.map(target => vm.getFractchContext(target.id).targets[0]);
        const extensionSignatures = full ? full.extensionSignatures : getExtensionSignatures(runtime);
        for (const target of targets) posted.set(target.id, target.changeKey);
        generation = currentGeneration;
        signatureHash = hash;
        return request({
            type: 'update',
            generation: currentGeneration,
            extensionSignatures,
            extensionSignatureHash: hash,
            targets,
            keep
        });
    };

    const postedTag = targetId => (posted.has(targetId) ? {generation, changeKey: posted.get(targetId)} : null);

    const syncFirst = vm => {
        try {
            sync(vm);
            return null;
        } catch (error) {
            return Promise.reject(error);
        }
    };

    const emit = (vm, targetId, options = {}) => {
        const failed = syncFirst(vm);
        if (failed) return failed;
        return request({type: 'emit', targetId, lockCheck: options.lockCheck !== false});
    };

    const build = (vm, targetId, text, options = {}) => {
        const failed = syncFirst(vm);
        if (failed) return failed;
        return request({
            type: 'build',
            targetId,
            text,
            previous: options.previous,
            lockedScripts: options.lockedScripts,
            verifyRoundTrip: options.verifyRoundTrip !== false
        });
    };

    const buildBatch = (vm, items) => {
        const failed = syncFirst(vm);
        if (failed) return failed;
        return request({
            type: 'buildBatch',
            items: items.map(item => ({
                targetId: item.targetId,
                text: item.text,
                previous: item.previous,
                lockedScripts: item.lockedScripts,
                verifyRoundTrip: item.verifyRoundTrip !== false
            }))
        });
    };

    const facts = texts => request({type: 'facts', texts});

    const emitProject = (vm, project) => {
        const failed = syncFirst(vm);
        if (failed) return failed;
        return request({type: 'emitProject', targets: project.targets || [], monitors: project.monitors || []});
    };

    const reset = () => {
        posted.clear();
        generation = null;
        signatureHash = null;
    };

    const dispose = () => {
        disposed = true;
        if (worker) worker.terminate();
        worker = null;
        for (const item of pending.values()) item.reject(new Error('The code worker was closed'));
        pending.clear();
    };

    return {build, buildBatch, dispose, emit, emitProject, facts, postedTag, reset, sync};
};

let shared = null;

const getFractchClient = () => {
    if (!shared) shared = createFractchClient();
    return shared;
};

export {createFractchClient, getFractchClient, liveTag, sameTag};
