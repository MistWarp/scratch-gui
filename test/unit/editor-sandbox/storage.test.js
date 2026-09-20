/** @jest-environment node */
import {IDBFactory, IDBDatabase} from 'fake-indexeddb';
import {createStorage, snapshotDatabase, restoreDatabase, installEditorStorage}
    from '../../../src/lib/editor-sandbox/storage';
import {callEditorHost} from '../../../src/lib/editor-sandbox/client';

jest.mock('../../../src/lib/editor-sandbox/client', () => ({
    callEditorHost: jest.fn(async () => {}), subscribeEditorEvents: jest.fn()
}));

const result = request => new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
});

test('persists and restores binary project backups, indexes and generated keys', async () => {
    const first = new IDBFactory();
    const opening = first.open('backups', 2);
    opening.onupgradeneeded = () => {
        const store = opening.result.createObjectStore('projects', {autoIncrement: true});
        store.createIndex('title', 'title');
    };
    const db = await result(opening);
    const transaction = db.transaction('projects', 'readwrite');
    const done = new Promise(resolve => { transaction.oncomplete = resolve; });
    transaction.objectStore('projects').put({title: 'Draft', bytes: new Uint8Array([1, 2, 3])}, 12);
    await done;
    db.close();
    const snapshot = await snapshotDatabase(first, 'backups');
    const second = new IDBFactory();
    await restoreDatabase(second, snapshot);
    const restored = await result(second.open('backups'));
    const read = restored.transaction('projects').objectStore('projects');
    expect(await result(read.index('title').get('Draft'))).toEqual({title: 'Draft', bytes: new Uint8Array([1, 2, 3])});
    expect(await result(restored.transaction('projects', 'readwrite').objectStore('projects').add({title: 'Next'}))).toBe(13);
    restored.close();
});

test('local storage supports property access without reaching host storage', () => {
    const changed = jest.fn();
    const storage = createStorage({theme: 'dark'}, changed);
    storage.setItem('project', 123);
    storage.extra = 'value';
    expect(storage.getItem('project')).toBe('123');
    expect(storage.theme).toBe('dark');
    expect(Object.keys(storage)).toEqual(['theme', 'project', 'extra']);
    delete storage.extra;
    expect(storage.length).toBe(2);
    storage.clear();
    expect(changed).toHaveBeenLastCalledWith({});
});

test('a burst of filesystem writes persists one complete database snapshot', async () => {
    const originalTransaction = IDBDatabase.prototype.transaction;
    global.window = {addEventListener: jest.fn(), dispatchEvent: jest.fn()};
    try {
        await installEditorStorage({local: {}, databases: []});
        const opening = window.indexedDB.open('filesystem', 1);
        opening.onupgradeneeded = () => opening.result.createObjectStore('files');
        const db = await result(opening);
        for (let i = 0; i < 12; i++) {
            const transaction = db.transaction('files', 'readwrite');
            const done = new Promise(resolve => { transaction.oncomplete = resolve; });
            transaction.objectStore('files').put(new Uint8Array([i]), `file-${i}`);
            await done;
        }
        db.close();
        window.localStorage.setItem('draft', 'first');
        window.localStorage.setItem('draft', 'latest');
        const deadline = Date.now() + 3000;
        while (!callEditorHost.mock.calls.some(([method]) => method === 'storage.database') && Date.now() < deadline) {
            await new Promise(resolve => setTimeout(resolve, 20));
        }
        const databaseCalls = callEditorHost.mock.calls.filter(([method]) => method === 'storage.database');
        expect(databaseCalls).toHaveLength(1);
        expect(databaseCalls[0][1].snapshot.stores[0].values).toHaveLength(12);
        expect(callEditorHost).toHaveBeenCalledWith('storage.local', {local: {draft: 'latest'}});
    } finally {
        IDBDatabase.prototype.transaction = originalTransaction;
        delete global.window;
    }
});
