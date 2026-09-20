import * as idb from 'fake-indexeddb';
import {callEditorHost, subscribeEditorEvents} from './client.js';

const requestResult = request => new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
});
const transactionDone = transaction => new Promise((resolve, reject) => {
    transaction.addEventListener('complete', resolve);
    transaction.addEventListener('abort', () => reject(transaction.error));
});

export const snapshotDatabase = async (factory, name) => {
    const db = await requestResult(factory.open(name));
    try {
        const names = [...db.objectStoreNames];
        if (!names.length) return {name, version: db.version, stores: []};
        const transaction = db.transaction(names, 'readonly');
        const done = transactionDone(transaction);
        const stores = await Promise.all(names.map(async storeName => {
            const store = transaction.objectStore(storeName);
            const indexes = [...store.indexNames].map(indexName => {
                const index = store.index(indexName);
                return {name: index.name, keyPath: index.keyPath, unique: index.unique, multiEntry: index.multiEntry};
            });
            const [keys, values] = await Promise.all([
                requestResult(store.getAllKeys()), requestResult(store.getAll())
            ]);
            return {name: store.name,
                keyPath: store.keyPath,
                autoIncrement: store.autoIncrement,
                indexes,
                keys,
                values};
        }));
        await done;
        return {name, version: db.version, stores};
    } finally {
        db.close();
    }
};

export const restoreDatabase = async (factory, snapshot) => {
    const request = factory.open(snapshot.name, snapshot.version);
    request.onupgradeneeded = () => {
        for (const entry of snapshot.stores) {
            const store = request.result.createObjectStore(entry.name, {
                keyPath: entry.keyPath, autoIncrement: entry.autoIncrement
            });
            for (const index of entry.indexes) store.createIndex(index.name, index.keyPath, index);
        }
    };
    const db = await requestResult(request);
    try {
        if (!snapshot.stores.length) return;
        const transaction = db.transaction(snapshot.stores.map(store => store.name), 'readwrite');
        const done = transactionDone(transaction);
        for (const entry of snapshot.stores) {
            const store = transaction.objectStore(entry.name);
            entry.values.forEach((value, i) => {
                if (entry.keyPath === null) store.put(value, entry.keys[i]);
                else store.put(value);
            });
        }
        await done;
    } finally {
        db.close();
    }
};

export const createStorage = (seed, changed) => {
    const map = new Map(Object.entries(seed || {}).map(([key, value]) => [key, String(value)]));
    const methods = {
        getItem: key => map.get(String(key)) ?? null,
        setItem: (key, value) => {
            map.set(String(key), String(value)); changed(Object.fromEntries(map));
        },
        removeItem: key => {
            map.delete(String(key)); changed(Object.fromEntries(map));
        },
        clear: () => {
            map.clear(); changed({});
        },
        key: index => [...map.keys()][index] ?? null
    };
    return new Proxy(methods, {
        get: (target, key) => (key === 'length' ? map.size :
            Object.prototype.hasOwnProperty.call(target, key) ? target[key] : map.get(String(key))),
        set: (target, key, value) => {
            methods.setItem(key, value); return true;
        },
        deleteProperty: (target, key) => {
            methods.removeItem(key); return true;
        },
        ownKeys: () => [...map.keys()],
        getOwnPropertyDescriptor: (target, key) => (map.has(key) ?
            {enumerable: true, configurable: true, value: map.get(key)} : void 0)
    });
};

export const installEditorStorage = async seed => {
    const define = (key, value) => Object.defineProperty(window, key, {configurable: true, value});
    // Only a private factory is exposed. Nothing can address the host's databases.
    const factory = new idb.IDBFactory();
    for (const snapshot of seed.databases || []) await restoreDatabase(factory, snapshot);
    let chain = Promise.resolve();
    let outstanding = 0;
    const persist = operation => {
        outstanding++;
        chain = chain.then(operation).catch(error => {
            window.dispatchEvent(new CustomEvent('mw:editor-storage-error', {detail: error.message}));
        })
            .finally(() => {
                outstanding--;
            });
    };
    let localTimer = null;
    let pendingLocal;
    define('localStorage', createStorage(seed.local, local => {
        pendingLocal = local;
        if (localTimer) return;
        localTimer = setTimeout(() => {
            localTimer = null;
            const snapshot = pendingLocal;
            persist(() => callEditorHost('storage.local', {local: snapshot}));
        }, 100);
    }));
    define('sessionStorage', createStorage(seed.session, () => {}));
    define('indexedDB', factory);
    for (const [name, value] of Object.entries(idb)) {
        if (name.startsWith('IDB')) define(name, value);
    }
    // Git and autosave write many small transactions. Copy each dirty database
    // once per burst, rather than enqueueing a full filesystem copy per file.
    const dirtyDatabases = new Set();
    let databaseTimer = null;
    const markDatabaseDirty = name => {
        dirtyDatabases.add(name);
        if (databaseTimer) return;
        databaseTimer = setTimeout(() => {
            databaseTimer = null;
            const names = [...dirtyDatabases];
            dirtyDatabases.clear();
            persist(async () => {
                const existing = await factory.databases();
                for (const databaseName of names) {
                    if (!existing.some(database => database.name === databaseName)) continue;
                    const snapshot = await snapshotDatabase(factory, databaseName);
                    await callEditorHost('storage.database', {snapshot});
                }
            });
        }, 250);
    };
    const originalOpen = factory.open.bind(factory);
    factory.open = (...args) => {
        const request = originalOpen(...args);
        request.addEventListener('upgradeneeded', () => {
            request.transaction.addEventListener('complete', () => markDatabaseDirty(String(args[0])));
        });
        return request;
    };
    const originalTransaction = idb.IDBDatabase.prototype.transaction;
    idb.IDBDatabase.prototype.transaction = function (...args) {
        const transaction = originalTransaction.apply(this, args);
        if (transaction.mode !== 'readonly') {
            const name = this.name;
            transaction.addEventListener('complete', () => markDatabaseDirty(name));
        }
        return transaction;
    };
    const originalDelete = factory.deleteDatabase.bind(factory);
    factory.deleteDatabase = name => {
        const request = originalDelete(name);
        request.addEventListener('success', () => persist(() => callEditorHost('storage.deleteDatabase', {name})));
        return request;
    };
    subscribeEditorEvents(event => {
        if (event.kind === 'database-import') {
            restoreDatabase(factory, event.snapshot).catch(error => {
                callEditorHost('storage.error', {message: error.message}).catch(() => {});
            });
        }
    });
    window.addEventListener('beforeunload', event => {
        if (outstanding || databaseTimer || localTimer) {
            event.preventDefault(); event.returnValue = '';
        }
    });
    window.addEventListener('mw:editor-storage-error', event => {
        callEditorHost('storage.error', {message: event.detail}).catch(() => {});
    });
};
