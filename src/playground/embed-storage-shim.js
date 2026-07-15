import * as fakeIndexedDB from 'fake-indexeddb';

try {
    if (new URLSearchParams(window.location.search).get('allow_all') === '1') {
        window.__mwAllowAllSecurity = true;
    }
} catch (e) {
    // ignore
}

const storageBlocked = (() => {
    try {
        window.localStorage.getItem('__mw_probe__');
        return false;
    } catch (e) {
        return true;
    }
})();

const createMemoryStorage = () => {
    const map = new Map();
    const methods = {
        getItem: k => (map.has(String(k)) ? map.get(String(k)) : null),
        setItem: (k, v) => {
            map.set(String(k), String(v));
        },
        removeItem: k => {
            map.delete(String(k));
        },
        clear: () => {
            map.clear();
        },
        key: i => {
            const keys = [...map.keys()];
            return i >= 0 && i < keys.length ? keys[i] : null;
        }
    };
    return new Proxy(methods, {
        get (target, prop) {
            if (prop === 'length') return map.size;
            if (prop in target) return target[prop];
            const k = String(prop);
            return map.has(k) ? map.get(k) : void 0;
        },
        set (target, prop, value) {
            if (!(prop in target)) map.set(String(prop), String(value));
            return true;
        },
        has (target, prop) {
            return (prop in target) || map.has(String(prop));
        },
        deleteProperty (target, prop) {
            map.delete(String(prop));
            return true;
        },
        ownKeys () {
            return [...map.keys()];
        },
        getOwnPropertyDescriptor (target, prop) {
            const k = String(prop);
            if (map.has(k)) {
                return {enumerable: true, configurable: true, writable: true, value: map.get(k)};
            }
            return void 0;
        }
    });
};

const define = (name, value) => {
    try {
        Object.defineProperty(window, name, {configurable: true, value});
    } catch (e) {
        // ignore
    }
};

if (storageBlocked) {
    for (const name of ['localStorage', 'sessionStorage']) {
        define(name, createMemoryStorage());
    }

    const IDB_GLOBALS = {
        indexedDB: fakeIndexedDB.default,
        IDBCursor: fakeIndexedDB.IDBCursor,
        IDBCursorWithValue: fakeIndexedDB.IDBCursorWithValue,
        IDBDatabase: fakeIndexedDB.IDBDatabase,
        IDBFactory: fakeIndexedDB.IDBFactory,
        IDBIndex: fakeIndexedDB.IDBIndex,
        IDBKeyRange: fakeIndexedDB.IDBKeyRange,
        IDBObjectStore: fakeIndexedDB.IDBObjectStore,
        IDBOpenDBRequest: fakeIndexedDB.IDBOpenDBRequest,
        IDBRequest: fakeIndexedDB.IDBRequest,
        IDBTransaction: fakeIndexedDB.IDBTransaction,
        IDBVersionChangeEvent: fakeIndexedDB.IDBVersionChangeEvent
    };
    for (const [name, value] of Object.entries(IDB_GLOBALS)) {
        if (value) define(name, value);
    }

    const emptyCache = {
        match: () => Promise.resolve(void 0),
        matchAll: () => Promise.resolve([]),
        add: () => Promise.resolve(),
        addAll: () => Promise.resolve(),
        put: () => Promise.resolve(),
        delete: () => Promise.resolve(false),
        keys: () => Promise.resolve([])
    };
    define('caches', {
        open: () => Promise.resolve(emptyCache),
        match: () => Promise.resolve(void 0),
        has: () => Promise.resolve(false),
        delete: () => Promise.resolve(false),
        keys: () => Promise.resolve([])
    });

    try {
        const params = new URLSearchParams(window.location.search);
        const theme = params.get('theme');
        const themeCustom = params.get('theme_custom');
        if (theme) window.localStorage.setItem('tw:theme', theme);
        if (themeCustom) window.localStorage.setItem('tw:custom-themes', themeCustom);
    } catch (e) {
        // ignore
    }
}
