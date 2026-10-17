import {isSplitEditor} from './origins.js';
import * as accountBridge from './bridge.js';

const MOVED_KEY = 'mw:editor-data-moved';
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

const isMoved = () => {
    try {
        return Boolean(localStorage.getItem(MOVED_KEY));
    } catch (e) {
        return true;
    }
};

const moveSettings = entries => {
    let moved = 0;
    for (const entry of Array.isArray(entries) ? entries : []) {
        if (!Array.isArray(entry) || typeof entry[0] !== 'string' || typeof entry[1] !== 'string') continue;
        try {
            localStorage.setItem(entry[0], entry[1]);
            moved += 1;
        } catch (e) {
            return moved;
        }
    }
    return moved;
};

const moveRestorePoints = async (call, onProgress) => {
    const listed = await call('restorePoints');
    if (!Array.isArray(listed) || listed.length === 0) return 0;
    const db = await openRestorePoints();
    try {
        const existing = new Set((await readAll(db, 'meta', 'getAll')).map(restorePointSignature));
        const savedAssets = new Set(await readAll(db, 'assets', 'getAllKeys'));
        let moved = 0;
        for (const {id, meta} of listed) {
            onProgress(moved, listed.length);
            if (!meta || typeof meta !== 'object' || existing.has(restorePointSignature(meta))) continue;
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
            const metaRequest = transaction.objectStore('meta').add(meta);
            metaRequest.onsuccess = () => {
                const newId = metaRequest.result;
                transaction.objectStore('projects').put(point.project, newId);
                if (point.thumbnail) transaction.objectStore('thumbnails').put(point.thumbnail, newId);
                for (const assetId of Object.keys(assets)) {
                    transaction.objectStore('assets').put(assets[assetId], assetId);
                }
            };
            await done;
            for (const assetId of Object.keys(assets)) savedAssets.add(assetId);
            existing.add(restorePointSignature(meta));
            moved += 1;
        }
        return moved;
    } finally {
        db.close();
    }
};

const moveBackpack = async call => {
    const db = await openBackpack();
    try {
        const existing = new Set((await readAll(db, 'backpack', 'getAll')).map(backpackSignature));
        let moved = 0;
        let after = null;
        for (;;) {
            const page = await call('backpack', after === null ? {} : {after});
            const items = page && Array.isArray(page.items) ? page.items : [];
            const fresh = items.filter(item => item && typeof item === 'object' &&
                !existing.has(backpackSignature(item)));
            if (fresh.length) {
                const transaction = db.transaction('backpack', 'readwrite');
                const done = finished(transaction);
                const store = transaction.objectStore('backpack');
                for (const item of fresh) {
                    const copy = {...item};
                    delete copy.id;
                    store.add(copy);
                    existing.add(backpackSignature(item));
                }
                await done;
                moved += fresh.length;
            }
            if (!page || page.done || items.length === 0) return moved;
            after = items[items.length - 1].id;
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

const withinTime = (promise, wait) => {
    let timer = null;
    return Promise.race([
        promise,
        new Promise((resolve, reject) => {
            timer = setTimeout(() => reject(new Error('The account frame did not answer')), wait);
        })
    ]).finally(() => clearTimeout(timer));
};

const moveEditorData = async ({
    call = accountBridge.call,
    connect = accountBridge.connect,
    progress = showProgress,
    reload = () => location.reload(),
    statusWait = STATUS_WAIT
} = {}) => {
    if (!isSplitEditor() || isMoved()) return false;
    try {
        const status = await withinTime(connect().then(() => call('editorData', {action: 'status'})), statusWait);
        if (status && status.moved) {
            localStorage.setItem(MOVED_KEY, String(Date.now()));
            return false;
        }
        progress('Moving your editor data from mistwarp.org…');
        const ask = (action, args = {}) => call('editorData', {...args, action});
        const settings = moveSettings(await ask('settings'));
        const points = await moveRestorePoints(ask, (done, total) => {
            progress(`Moving your restore points from mistwarp.org (${done + 1} of ${total})…`);
        });
        const backpack = await moveBackpack(ask);
        await ask('done');
        localStorage.setItem(MOVED_KEY, String(Date.now()));
        if (settings + points + backpack > 0) {
            reload();
            return true;
        }
    } catch (e) {
        progress('');
    }
    return false;
};

export {
    MOVED_KEY,
    moveEditorData
};
