const MOVED_KEY = 'mw:editor-data-moved';

const KEPT_KEYS = new Set([
    'sa-find-case-sensitive'
]);

const KEPT_PREFIXES = ['tw:', 'mw:', 'PackagerOptions.'];

const ACCOUNT_KEYS = new Set([
    MOVED_KEY,
    'tw:persisted_unsandboxed',
    'tw:settings-dirty',
    'mw:rotur-token',
    'mw:rotur-oauth',
    'mw:rotur-oauth-pending',
    'mw:rotur-oauth-error',
    'mw:rotur-oauth-refresh',
    'mw:rotur-restore',
    'mw:mistwarp-session',
    'mw:warptheme-session',
    'mw:git-token',
    'mw:analytics-session',
    'mw:session-projects',
    'mw:minor-account',
    'mw:rotur-settings',
    'mw:rotur-grants',
    'mw:rotur-activity-grants'
]);

const ACCOUNT_PREFIXES = ['mw:tier:', 'mw:api-cache', 'mw:embed-storage:', 'mw:bounty-claim:', 'mw:signup-tracked:'];

const CREDENTIAL_WORDS = /token|session|oauth|secret|password|credential/i;

const movableKey = key => typeof key === 'string' &&
    (KEPT_KEYS.has(key) || KEPT_PREFIXES.some(prefix => key.startsWith(prefix))) &&
    !ACCOUNT_KEYS.has(key) &&
    !ACCOUNT_PREFIXES.some(prefix => key.startsWith(prefix)) &&
    !CREDENTIAL_WORDS.test(key);

const RESTORE_POINTS = 'TW_RestorePoints';
const BACKPACK = 'TW_Backpack';
const BACKPACK_BATCH = 20;

const openExisting = (name, factory = typeof indexedDB === 'undefined' ? null : indexedDB) => new Promise(resolve => {
    if (!factory) {
        resolve(null);
        return;
    }
    let request;
    try {
        request = factory.open(name);
    } catch (e) {
        resolve(null);
        return;
    }
    request.onupgradeneeded = () => {
        request.transaction.abort();
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = event => {
        event.preventDefault();
        resolve(null);
    };
    request.onblocked = () => resolve(null);
});

const hasStores = (db, stores) => db && stores.every(store => db.objectStoreNames.contains(store));

const read = (db, store, run) => new Promise((resolve, reject) => {
    const transaction = db.transaction(store, 'readonly');
    const request = run(transaction.objectStore(store));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
});

const validId = id => typeof id === 'number' && Number.isInteger(id) && id >= 0;
const validAssetId = id => typeof id === 'string' && /^[0-9a-f]{32}\.[a-z0-9]{1,8}$/i.test(id);

const createEditorData = ({storage = () => localStorage, open = name => openExisting(name)} = {}) => {
    const moved = () => {
        try {
            return Boolean(storage().getItem(MOVED_KEY));
        } catch (e) {
            return false;
        }
    };

    const refuseAfterMove = () => {
        if (moved()) throw Object.assign(new Error('Your editor data has already moved'), {code: 'moved'});
    };

    const withDb = async (name, stores, fallback, run) => {
        const db = await open(name);
        if (!hasStores(db, stores)) {
            if (db) db.close();
            return fallback;
        }
        try {
            return await run(db);
        } finally {
            db.close();
        }
    };

    const restoreStores = ['meta', 'projects', 'assets', 'thumbnails'];

    return {
        status: () => ({moved: moved()}),
        settings: () => {
            refuseAfterMove();
            const local = storage();
            const entries = [];
            for (let i = 0; i < local.length; i++) {
                const key = local.key(i);
                if (movableKey(key)) entries.push([key, local.getItem(key)]);
            }
            return entries;
        },
        restorePoints: () => {
            refuseAfterMove();
            return withDb(RESTORE_POINTS, restoreStores, [], async db => {
                const [keys, values] = await Promise.all([
                    read(db, 'meta', store => store.getAllKeys()),
                    read(db, 'meta', store => store.getAll())
                ]);
                return keys.map((id, index) => ({id, meta: values[index]}));
            });
        },
        restorePoint: ({id}) => {
            refuseAfterMove();
            if (!validId(id)) throw new Error('That is not a restore point');
            return withDb(RESTORE_POINTS, restoreStores, null, async db => {
                const [project, thumbnail] = await Promise.all([
                    read(db, 'projects', store => store.get(id)),
                    read(db, 'thumbnails', store => store.get(id))
                ]);
                return typeof project === 'undefined' ? null : {project, thumbnail: thumbnail || null};
            });
        },
        asset: ({id}) => {
            refuseAfterMove();
            if (!validAssetId(id)) throw new Error('That is not a project asset');
            return withDb(RESTORE_POINTS, restoreStores, null, db => read(db, 'assets', store => store.get(id))
                .then(data => (typeof data === 'undefined' ? null : data)));
        },
        backpack: ({after}) => {
            refuseAfterMove();
            const start = typeof after === 'number' && Number.isFinite(after) ? after : null;
            return withDb(BACKPACK, ['backpack'], {items: [], done: true}, async db => {
                const range = start === null ? null : IDBKeyRange.lowerBound(start, true);
                const items = await read(db, 'backpack', store => store.getAll(range, BACKPACK_BATCH + 1));
                return {items: items.slice(0, BACKPACK_BATCH), done: items.length <= BACKPACK_BATCH};
            });
        },
        done: () => {
            try {
                storage().setItem(MOVED_KEY, String(Date.now()));
            } catch (e) {
                return false;
            }
            return true;
        }
    };
};

export {
    MOVED_KEY,
    movableKey,
    createEditorData
};
