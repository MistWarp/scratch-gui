import {isSplitEditor} from './origins.js';
import * as accountBridge from './bridge.js';

const MOVED_KEY = 'mw:editor-data-moved';
const TRIED_KEY = 'mw:editor-data-move-tried';
const UNSAVED_BACKUP_KEY = 'mw:unsaved-device-backup';
const LOCK_NAME = 'mw:editor-data-move';
const RESTORE_POINTS = 'TW_RestorePoints';
const RESTORE_POINTS_VERSION = 2;
const BACKPACK = 'TW_Backpack';
const BACKPACK_VERSION = 1;
const RESTORE_STORES = ['meta', 'projects', 'assets', 'thumbnails'];

const openDb = (name, version, upgrade) => new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.onupgradeneeded = () => upgrade(request.result);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Another tab is still using editor storage'));
});

const openRestorePoints = () => openDb(RESTORE_POINTS, RESTORE_POINTS_VERSION, db => {
    if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', {autoIncrement: true});
    for (const store of RESTORE_STORES.slice(1)) {
        if (!db.objectStoreNames.contains(store)) db.createObjectStore(store);
    }
});

const openBackpack = () => openDb(BACKPACK, BACKPACK_VERSION, db => {
    if (!db.objectStoreNames.contains('backpack')) {
        db.createObjectStore('backpack', {keyPath: 'id', autoIncrement: true});
    }
});

const readAll = (db, store, method) => new Promise((resolve, reject) => {
    const objectStore = db.transaction(store, 'readonly').objectStore(store);
    const request = objectStore[method]();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
});

const finished = transaction => new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error('Moving editor data was interrupted'));
});

const restorePointSignature = meta => (meta && typeof meta === 'object' ?
    `${meta.created}|${meta.title}|${meta.projectSize}|${meta.type}` : '');

const backpackSignature = item => (item && typeof item === 'object' ?
    `${item.type}|${item.name}|${item.bodyMD5 || (item.bodyData && item.bodyData.byteLength)}` : '');

const createCounter = () => {
    const counts = new Map();
    return {
        add: (signature, value) => {
            const entry = counts.get(signature);
            if (entry) entry.push(value);
            else counts.set(signature, [value]);
        },
        take: signature => {
            const entry = counts.get(signature);
            return entry && entry.length ? entry.shift() : null;
        }
    };
};

const readLocal = key => {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        return null;
    }
};

const isMoved = () => {
    try {
        return Boolean(localStorage.getItem(MOVED_KEY));
    } catch (e) {
        return true;
    }
};

const moveSettings = (entries, keepExisting) => {
    let changed = 0;
    for (const entry of Array.isArray(entries) ? entries : []) {
        if (!Array.isArray(entry) || typeof entry[0] !== 'string' || typeof entry[1] !== 'string') continue;
        const current = localStorage.getItem(entry[0]);
        if (current === entry[1] || (keepExisting && current !== null)) continue;
        localStorage.setItem(entry[0], entry[1]);
        changed += 1;
    }
    return changed;
};

const moveRestorePoints = async (call, onProgress) => {
    const ids = new Map();
    const listed = await call('restorePoints');
    if (!Array.isArray(listed) || listed.length === 0) return {moved: 0, ids};
    const db = await openRestorePoints();
    try {
        const existing = createCounter();
        const [metas, keys] = await Promise.all([readAll(db, 'meta', 'getAll'), readAll(db, 'meta', 'getAllKeys')]);
        metas.forEach((meta, index) => existing.add(restorePointSignature(meta), keys[index]));
        const usedIds = new Set(keys);
        const savedAssets = new Set(await readAll(db, 'assets', 'getAllKeys'));
        let moved = 0;
        for (let index = 0; index < listed.length; index++) {
            const {id, meta} = listed[index] || {};
            onProgress(index, listed.length);
            if (!meta || typeof meta !== 'object') continue;
            const already = existing.take(restorePointSignature(meta));
            if (already !== null) {
                ids.set(id, already);
                continue;
            }
            const point = await call('restorePoint', {id});
            if (!point) continue;
            const assets = {};
            for (const assetId of Object.keys(meta.assets || {})) {
                if (savedAssets.has(assetId)) continue;
                const data = await call('asset', {id: assetId});
                if (data !== null && typeof data !== 'undefined') assets[assetId] = data;
            }
            const transaction = db.transaction(RESTORE_STORES, 'readwrite');
            const done = finished(transaction);
            const keepId = Number.isSafeInteger(id) && id > 0 && !usedIds.has(id);
            const metaRequest = keepId ?
                transaction.objectStore('meta').add(meta, id) :
                transaction.objectStore('meta').add(meta);
            let newId = null;
            metaRequest.onsuccess = () => {
                newId = metaRequest.result;
                transaction.objectStore('projects').put(point.project, newId);
                if (point.thumbnail) transaction.objectStore('thumbnails').put(point.thumbnail, newId);
                for (const assetId of Object.keys(assets)) {
                    transaction.objectStore('assets').put(assets[assetId], assetId);
                }
            };
            await done;
            for (const assetId of Object.keys(assets)) savedAssets.add(assetId);
            usedIds.add(newId);
            ids.set(id, newId);
            moved += 1;
        }
        return {moved, ids};
    } finally {
        db.close();
    }
};

const remapUnsavedBackup = (settings, ids) => {
    const moved = (Array.isArray(settings) ? settings : []).find(entry => Array.isArray(entry) &&
        entry[0] === UNSAVED_BACKUP_KEY);
    if (!moved || readLocal(UNSAVED_BACKUP_KEY) !== moved[1]) return;
    let record = null;
    try {
        record = JSON.parse(moved[1]);
    } catch (e) {
        record = null;
    }
    if (record && typeof record === 'object' && ids.has(record.id)) {
        localStorage.setItem(UNSAVED_BACKUP_KEY, JSON.stringify({...record, id: ids.get(record.id)}));
    } else {
        localStorage.removeItem(UNSAVED_BACKUP_KEY);
    }
};

const moveBackpack = async call => {
    const db = await openBackpack();
    try {
        const existing = createCounter();
        for (const item of await readAll(db, 'backpack', 'getAll')) existing.add(backpackSignature(item), true);
        let moved = 0;
        let after = null;
        for (;;) {
            const page = await call('backpack', after === null ? {} : {after});
            const items = page && Array.isArray(page.items) ? page.items : [];
            const fresh = items.filter(item => item && typeof item === 'object' &&
                existing.take(backpackSignature(item)) === null);
            if (fresh.length) {
                const transaction = db.transaction('backpack', 'readwrite');
                const done = finished(transaction);
                const store = transaction.objectStore('backpack');
                for (const item of fresh) {
                    const copy = {...item};
                    delete copy.id;
                    store.add(copy);
                }
                await done;
                moved += fresh.length;
            }
            const last = items[items.length - 1];
            if (!page || page.done || !last || typeof last.id !== 'number') return moved;
            after = last.id;
        }
    } finally {
        db.close();
    }
};

const showProgress = text => {
    const splash = document.querySelector('.spash-waiting-for-js');
    if (!splash) return;
    let status = splash.querySelector('.mw-data-move');
    if (!status) {
        status = document.createElement('div');
        status.className = 'mw-data-move';
        status.style.marginTop = '1rem';
        splash.appendChild(status);
    }
    status.textContent = text;
};

const STATUS_WAIT = 8000;
const CALL_WAIT = 60000;

const withinTime = (promise, wait) => {
    let timer = null;
    return Promise.race([
        promise,
        new Promise((resolve, reject) => {
            timer = setTimeout(() => reject(new Error('The account frame did not answer')), wait);
        })
    ]).finally(() => clearTimeout(timer));
};

const exclusively = (locks, run) => {
    if (!locks || typeof locks.request !== 'function') return run();
    return locks.request(LOCK_NAME, {ifAvailable: true}, lock => (lock ? run() : false));
};

const runMove = async ({call, connect, progress, statusWait, callWait}) => {
    if (isMoved()) return true;
    const keepExisting = readLocal(TRIED_KEY) !== null;
    localStorage.setItem(TRIED_KEY, String(Date.now()));
    const status = await withinTime(connect().then(() => call('editorData', {action: 'status'})), statusWait);
    if (status && status.moved) {
        localStorage.setItem(MOVED_KEY, String(Date.now()));
        localStorage.removeItem(TRIED_KEY);
        return false;
    }
    progress('Moving your editor data from mistwarp.org…');
    const ask = (action, args = {}) => withinTime(call('editorData', {...args, action}), callWait);
    const settingEntries = await ask('settings');
    const settings = moveSettings(settingEntries, keepExisting);
    const points = await moveRestorePoints(ask, (index, total) => {
        progress(`Moving your restore points from mistwarp.org (${index + 1} of ${total})…`);
    });
    remapUnsavedBackup(settingEntries, points.ids);
    const backpack = await moveBackpack(ask);
    await ask('done');
    localStorage.setItem(MOVED_KEY, String(Date.now()));
    localStorage.removeItem(TRIED_KEY);
    return settings + points.moved + backpack > 0;
};

const moveEditorData = async ({
    call = accountBridge.call,
    connect = accountBridge.connect,
    progress = showProgress,
    reload = () => location.reload(),
    statusWait = STATUS_WAIT,
    callWait = CALL_WAIT,
    locks = typeof navigator === 'undefined' ? null : navigator.locks,
    online = () => typeof navigator === 'undefined' || navigator.onLine !== false
} = {}) => {
    if (!isSplitEditor() || isMoved() || !online()) return false;
    let changed = false;
    try {
        changed = await exclusively(locks, () => runMove({call, connect, progress, statusWait, callWait}));
    } catch (e) {
        changed = false;
    }
    if (changed) {
        reload();
        return true;
    }
    progress('');
    return false;
};

export {
    MOVED_KEY,
    moveEditorData
};
