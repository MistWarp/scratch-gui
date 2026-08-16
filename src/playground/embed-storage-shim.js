import * as fakeIndexedDB from 'fake-indexeddb';

try {
    if (new URLSearchParams(window.location.search).get('allow_all') === '1') {
        window.__mwAllowAllSecurity = true;
    }
} catch (e) {
    // ignore
}

const parseQueryParams = () => {
    try {
        return new URLSearchParams(window.location.search);
    } catch (e) {
        return null;
    }
};

const parseStorageSeed = raw => {
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
        const out = {};
        for (const [key, value] of Object.entries(parsed)) {
            if (typeof key !== 'string' || typeof value !== 'string') continue;
            out[key] = value;
        }
        return out;
    } catch (e) {
        return {};
    }
};

const EMBED_STORAGE_BLOCKED_PREFIXES = ['mw:', 'tw:'];
const EMBED_STORAGE_ALLOWED_KEYS = new Set([
    'tw:theme',
    'tw:custom-themes'
]);
const EMBED_IDB_PREFIX = 'mw:embed-idb:';

const isBlockedStorageKey = key => {
    const value = String(key);
    if (EMBED_STORAGE_ALLOWED_KEYS.has(value)) return false;
    return EMBED_STORAGE_BLOCKED_PREFIXES.some(prefix => value.startsWith(prefix));
};

const isBlockedDatabase = name => {
    const value = String(name);
    return value === 'TW_Backpack' || value === 'TW_RestorePoints' || value === 'TW_AutoSave';
};

const databaseNameForProject = (name, projectId) => {
    const rawName = String(name);
    if (!projectId) return rawName;
    return `${EMBED_IDB_PREFIX}${String(projectId)}:${rawName}`;
};

const createBridgeStorage = (projectId, seed) => {
    const map = new Map();
    for (const [key, value] of Object.entries(seed)) {
        if (isBlockedStorageKey(key)) continue;
        map.set(String(key), String(value));
    }

    const notify = (type, key, value) => {
        if (!projectId || window.parent === window) return;
        try {
            window.parent.postMessage({
                type: `mw:storage-${type}`,
                storageProject: projectId,
                key,
                value
            }, '*');
        } catch (e) {
            // ignore
        }
    };

    const methods = {
        getItem: k => (map.has(String(k)) ? map.get(String(k)) : null),
        setItem: (k, v) => {
            const key = String(k);
            const value = String(v);
            if (isBlockedStorageKey(key)) return;
            map.set(key, value);
            notify('set', key, value);
        },
        removeItem: k => {
            const key = String(k);
            if (isBlockedStorageKey(key)) return;
            map.delete(key);
            notify('remove', key);
        },
        clear: () => {
            map.clear();
            notify('clear');
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
            if (!(prop in target)) {
                methods.setItem(prop, value);
            }
            return true;
        },
        has (target, prop) {
            return (prop in target) || map.has(String(prop));
        },
        deleteProperty (target, prop) {
            methods.removeItem(prop);
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

const storageIsBlocked = name => {
    try {
        window[name].getItem('__mw_probe__');
        return false;
    } catch (e) {
        return true;
    }
};

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

const cookieIsBlocked = (() => {
    try {
        void document.cookie;
        return false;
    } catch (e) {
        return true;
    }
})();

const params = parseQueryParams();
const storageBridgeEnabled = params && params.get('mw_storage') === '1';
const storageProject = params && (params.get('platform_project') || params.get('mw_storage_project'));
const storageSeed = parseStorageSeed(storageBridgeEnabled && storageProject ? params.get('mw_storage_seed') : null);

if (cookieIsBlocked) {
    const cookies = new Map();
    try {
        Object.defineProperty(document, 'cookie', {
            configurable: true,
            get: () => [...cookies.entries()]
                .map(([name, value]) => `${name}=${value}`)
                .join('; '),
            set: input => {
                const parts = String(input)
                    .split(';')
                    .map(part => part.trim());
                const separator = parts[0].indexOf('=');
                if (separator < 1) return;
                const name = parts[0].slice(0, separator).trim();
                const value = parts[0].slice(separator + 1);
                const attributes = parts.slice(1)
                    .map(part => part.toLowerCase());
                const expired = attributes.some(attribute => attribute === 'max-age=0' || (
                    attribute.startsWith('expires=') && Date.parse(attribute.slice(8)) <= Date.now()
                ));
                if (expired) {
                    cookies.delete(name);
                } else {
                    cookies.set(name, value);
                }
            }
        });
    } catch (e) {
        String(e);
    }
}

const blockedStorage = ['localStorage', 'sessionStorage'].filter(storageIsBlocked);

if (blockedStorage.length) {
    for (const name of blockedStorage) {
        if (name === 'localStorage' && storageBridgeEnabled) {
            define(name, createBridgeStorage(storageProject, storageSeed));
            continue;
        }
        define(name, createMemoryStorage());
    }

    if (storageBridgeEnabled) {
        const originalOpen = fakeIndexedDB.default.open.bind(fakeIndexedDB.default);
        const originalDeleteDatabase = fakeIndexedDB.default.deleteDatabase.bind(fakeIndexedDB.default);
        fakeIndexedDB.default.open = (name, version) => {
            if (isBlockedDatabase(name)) {
                throw new DOMException(`IndexedDB database "${name}" is blocked`, 'SecurityError');
            }
            return originalOpen(databaseNameForProject(name, storageProject), version);
        };
        fakeIndexedDB.default.deleteDatabase = name => {
            if (isBlockedDatabase(name)) {
                throw new DOMException(`IndexedDB database "${name}" is blocked`, 'SecurityError');
            }
            return originalDeleteDatabase(databaseNameForProject(name, storageProject));
        };
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

if (storageBridgeEnabled) {
    define('sessionStorage', createMemoryStorage());
}
