import {hashString} from 'scratch-vm/src/serialization/fractch-context';

const DATABASE = 'mw-code-drafts';
const STORE = 'drafts';
const WRITE_DELAY = 600;

const memory = new Map();
const pendingWrites = new Map();
let writeTimer = null;
let databasePromise = null;

const draftKey = (identity, {targetName, isStage, extensionId, assetName}) => {
    if (assetName) return `${identity}\u0001asset\u0001${String(assetName).toLowerCase()}`;
    return extensionId ?
        `${identity}\u0001extension\u0001${extensionId}` :
        `${identity}\u0001${isStage ? 'stage' : 'sprite'}\u0001${isStage ? '' : targetName}`;
};

const baseHash = text => hashString(String(text || ''));

const openDatabase = () => {
    if (databasePromise) return databasePromise;
    databasePromise = new Promise(resolve => {
        if (typeof indexedDB === 'undefined') {
            resolve(null);
            return;
        }
        let request;
        try {
            request = indexedDB.open(DATABASE, 1);
        } catch (error) {
            resolve(null);
            return;
        }
        request.onupgradeneeded = () => {
            request.result.createObjectStore(STORE);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
        request.onblocked = () => resolve(null);
    });
    return databasePromise;
};

const run = (mode, action) => openDatabase().then(db => {
    if (!db) return null;
    return new Promise(resolve => {
        try {
            const transaction = db.transaction(STORE, mode);
            const request = action(transaction.objectStore(STORE));
            transaction.oncomplete = () => resolve(request ? request.result : null);
            transaction.onerror = () => resolve(null);
            transaction.onabort = () => resolve(null);
        } catch (error) {
            resolve(null);
        }
    });
});

const writeNow = (key, value) => {
    if (value === null) {
        memory.delete(key);
        return run('readwrite', store => store.delete(key));
    }
    memory.set(key, value);
    return run('readwrite', store => store.put(value, key));
};

const flushDraftWrites = () => {
    clearTimeout(writeTimer);
    writeTimer = null;
    const writes = Array.from(pendingWrites);
    pendingWrites.clear();
    return Promise.all(writes.map(([key, value]) => writeNow(key, value)));
};

const scheduleDraftWrite = (identity, info, value) => {
    if (!identity) return;
    const key = draftKey(identity, info);
    pendingWrites.set(key, value ? {
        text: value.text,
        baseHash: value.baseHash,
        targetName: info.targetName || null,
        isStage: Boolean(info.isStage),
        savedAt: Date.now()
    } : null);
    clearTimeout(writeTimer);
    writeTimer = setTimeout(flushDraftWrites, WRITE_DELAY);
};

const loadDraft = (identity, info) => {
    if (!identity) return Promise.resolve(null);
    const key = draftKey(identity, info);
    if (pendingWrites.has(key)) return Promise.resolve(pendingWrites.get(key));
    if (memory.has(key)) return Promise.resolve(memory.get(key));
    return run('readonly', store => store.get(key)).then(value => value || null);
};

const classifyDraft = (draft, emittedText) => {
    if (!draft || typeof draft.text !== 'string') return null;
    if (draft.text === emittedText) return null;
    return draft.baseHash === baseHash(emittedText) ? 'restore' : 'stale';
};

const projectIdentity = ({projectId, fileHandle, isScratchDesktop}) => {
    if (projectId && projectId !== '0' && projectId !== 0) return `project:${projectId}`;
    if (isScratchDesktop && fileHandle && fileHandle.name) return `file:${fileHandle.name}`;
    return null;
};

const resetDraftStore = () => {
    clearTimeout(writeTimer);
    writeTimer = null;
    pendingWrites.clear();
    memory.clear();
    databasePromise = null;
};

export {
    baseHash,
    classifyDraft,
    draftKey,
    flushDraftWrites,
    loadDraft,
    projectIdentity,
    resetDraftStore,
    scheduleDraftWrite
};
