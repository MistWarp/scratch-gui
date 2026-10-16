import storage from '../persistence/storage';
import md5 from 'js-md5';
import {soundThumbnail} from '../backpack/sound-payload';
import {arrayBufferToBase64, base64ToArrayBuffer} from '../utils/base64';
import {requestPersistentStorage} from '../utils/storage-request';

// Special constants -- do not change without care.
const DATABASE_NAME = 'TW_Backpack';
const DATABASE_VERSION = 1;
const STORE_NAME = 'backpack';
const CHANGE_CHANNEL_NAME = 'mw:backpack-changes';

const SOUND_FORMAT_BY_MIME = {
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
    'application/ogg': 'ogg',
    'audio/wav': 'wav',
    'audio/wave': 'wav',
    'audio/x-wav': 'wav'
};

const idbItemToBackpackItem = item => {
    // convert id to string
    item.id = `${item.id}`;

    if (item.type === 'sound') {
        // For sounds, use the local thumbnail instead of what was stored in the backpack.
        // The thumbnail was updated and it doesn't make sense for already backpacked sounds to
        // use the old icon instead of the new one.
        item.thumbnailUrl = `data:;base64,${soundThumbnail}`;
    } else {
        // Thumbnail could be any image format. The browser will figure out which format it is.
        item.thumbnailUrl = `data:;base64,${arrayBufferToBase64(item.thumbnailData)}`;
    }

    let assetType;
    if (item.type === 'script') {
        item.bodyUrl = `data:application/json;base64,${arrayBufferToBase64(item.bodyData)}`;
    } else if (item.type === 'sprite') {
        item.bodyUrl = `data:application/zip;base64,${arrayBufferToBase64(item.bodyData)}`;
    } else if (item.type === 'costume') {
        if (item.mime === 'image/svg+xml') {
            assetType = storage.AssetType.ImageVector;
        } else if (item.mime === 'image/png' || item.mime === 'image/jpeg') {
            assetType = storage.AssetType.ImageBitmap;
        }
    } else if (item.type === 'sound') {
        assetType = storage.AssetType.Sound;
    }

    if (assetType) {
        const extension = item.type === 'sound' ?
            SOUND_FORMAT_BY_MIME[item.mime] || assetType.runtimeFormat :
            assetType.runtimeFormat;
        const itemMD5 = item.bodyMD5;
        const md5ext = `${itemMD5}.${extension}`;
        item.body = md5ext;
        storage.builtinHelper._store(
            assetType,
            extension,
            new Uint8Array(item.bodyData),
            itemMD5
        );
    }

    return item;
};

let changeChannel = null;
let changeChannelOpened = false;
const changeListeners = new Set();

const getChangeChannel = () => {
    if (changeChannelOpened) return changeChannel;
    changeChannelOpened = true;
    if (typeof BroadcastChannel === 'undefined') return changeChannel;
    try {
        changeChannel = new BroadcastChannel(CHANGE_CHANNEL_NAME);
        changeChannel.onmessage = () => {
            changeListeners.forEach(listener => listener());
        };
    } catch (e) {
        changeChannel = null;
    }
    return changeChannel;
};

const notifyChange = () => {
    const channel = getChangeChannel();
    if (!channel) return;
    try {
        channel.postMessage({changed: true});
    } catch (e) {
        // Other tabs refresh when the backpack is next opened.
    }
};

const subscribeBackpackChanges = listener => {
    getChangeChannel();
    changeListeners.add(listener);
    return () => {
        changeListeners.delete(listener);
    };
};

let _db;
const openDB = () => new Promise((resolve, reject) => {
    if (_db) {
        resolve(_db);
        return;
    }

    if (!window.indexedDB) {
        reject(new Error('indexedDB is not supported'));
        return;
    }

    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = event => {
        const db = event.target.result;
        db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true
        });
    };

    request.onsuccess = event => {
        const db = event.target.result;
        db.onclose = () => {
            if (_db === db) _db = null;
        };
        _db = db;
        resolve(db);
    };

    request.onerror = event => {
        reject(new Error(`DB error: ${event.target.error}`));
    };
});

const openTransaction = async mode => {
    const db = await openDB();
    try {
        return db.transaction(STORE_NAME, mode);
    } catch (error) {
        if (error.name !== 'InvalidStateError') throw error;
        if (_db === db) _db = null;
        const reopened = await openDB();
        return reopened.transaction(STORE_NAME, mode);
    }
};

const getBackpackContents = async ({
    limit,
    offset
}) => {
    const transaction = await openTransaction('readonly');
    return new Promise((resolve, reject) => {
        transaction.onerror = transaction.onabort = event => {
            reject(new Error(`Getting contents: ${event.target.error}`));
        };
        const store = transaction.objectStore(STORE_NAME);
        const items = [];
        const request = store.openCursor(null, 'prev');
        let first = true;
        request.onsuccess = e => {
            const cursor = e.target.result;
            if (first) {
                first = false;
                if (cursor && offset !== 0) {
                    cursor.advance(offset);
                    return;
                }
            }
            if (cursor && items.length < limit) {
                items.push(idbItemToBackpackItem(cursor.value));
                cursor.continue();
            } else {
                resolve(items);
            }
        };
    });
};

const saveBackpackObject = async ({
    type,
    mime,
    name,
    body,
    thumbnail
}) => {
    // User interaction -- fine to show a permission dialog
    requestPersistentStorage();

    const transaction = await openTransaction('readwrite');
    return new Promise((resolve, reject) => {
        transaction.onerror = transaction.onabort = event => {
            reject(new Error(`Sving object: ${event.target.error}`));
        };
        const store = transaction.objectStore(STORE_NAME);
        const bodyData = base64ToArrayBuffer(body);
        const bodyMD5 = md5(bodyData);
        const idbItem = {
            type,
            mime,
            name,
            bodyData,
            bodyMD5,
            thumbnailData: base64ToArrayBuffer(thumbnail)
        };
        const putRequest = store.put(idbItem);
        putRequest.onsuccess = () => {
            idbItem.id = putRequest.result;
        };
        transaction.oncomplete = () => {
            notifyChange();
            resolve(idbItemToBackpackItem(idbItem));
        };
    });
};

const deleteBackpackObject = async ({
    id
}) => {
    id = +id;
    const transaction = await openTransaction('readwrite');
    return new Promise((resolve, reject) => {
        transaction.onerror = transaction.onabort = event => {
            reject(new Error(`Deleting object: ${event.target.error}`));
        };
        const store = transaction.objectStore(STORE_NAME);
        // Convert string IDs to number IDs
        store.delete(id);
        transaction.oncomplete = () => {
            notifyChange();
            resolve();
        };
    });
};

const updateBackpackObject = async ({
    id,
    name
}) => {
    id = +id;
    const transaction = await openTransaction('readwrite');
    return new Promise((resolve, reject) => {
        transaction.onerror = transaction.onabort = event => {
            reject(new Error(`Updating object: ${event.target.error}`));
        };
        const store = transaction.objectStore(STORE_NAME);
        let newItem;
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
            if (!getRequest.result) return;
            newItem = {
                ...getRequest.result,
                name: name
            };
            store.put(newItem);
        };
        transaction.oncomplete = () => {
            if (!newItem) {
                reject(new Error('Updating object: item no longer exists'));
                return;
            }
            notifyChange();
            resolve(idbItemToBackpackItem(newItem));
        };
    });
};

export default {
    getBackpackContents,
    saveBackpackObject,
    deleteBackpackObject,
    updateBackpackObject,
    subscribeBackpackChanges
};
