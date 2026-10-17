import 'fake-indexeddb/auto';
import {IDBFactory} from 'fake-indexeddb';
import {createEditorData, movableKey, MOVED_KEY} from '../../../src/lib/account/frame-editor-data.js';

jest.mock('../../../src/lib/account/origins.js', () => ({
    ACCOUNT_ORIGIN: 'https://mistwarp.org',
    EDITOR_ORIGIN: 'https://editor.mistwarp.org',
    isSplitEditor: () => true,
    isEditorOrigin: () => true
}));

jest.mock('../../../src/lib/account/bridge.js', () => ({
    connect: jest.fn(() => Promise.resolve()),
    call: jest.fn()
}));

const {moveEditorData} = require('../../../src/lib/account/data-move.js');

const createStorage = entries => {
    const map = new Map(entries);
    return {
        get length () {
            return map.size;
        },
        key: index => [...map.keys()][index],
        getItem: key => (map.has(key) ? map.get(key) : null),
        setItem: (key, value) => map.set(key, String(value)),
        removeItem: key => map.delete(key)
    };
};

const request = r => new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
});

const openWith = (factory, name, version, upgrade) => new Promise((resolve, reject) => {
    const r = factory.open(name, version);
    r.onupgradeneeded = () => upgrade(r.result);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
});

const restoreSchema = db => {
    db.createObjectStore('meta', {autoIncrement: true});
    db.createObjectStore('projects');
    db.createObjectStore('assets');
    db.createObjectStore('thumbnails');
};

const backpackSchema = db => db.createObjectStore('backpack', {keyPath: 'id', autoIncrement: true});

const meta = (title, created, assets) => ({
    title,
    created,
    type: 0,
    projectSize: 3,
    thumbnailSize: 1,
    thumbnailWidth: 480,
    thumbnailHeight: 360,
    assets
});

const ASSET_A = `${'a'.repeat(32)}.svg`;
const ASSET_B = `${'b'.repeat(32)}.wav`;

const seedSource = async factory => {
    const db = await openWith(factory, 'TW_RestorePoints', 2, restoreSchema);
    const tx = db.transaction(['meta', 'projects', 'assets', 'thumbnails'], 'readwrite');
    for (const [title, created, assets] of [['First', 100, {[ASSET_A]: 2}], ['Second', 200, {[ASSET_A]: 2, [ASSET_B]: 2}]]) {
        const id = await request(tx.objectStore('meta').add(meta(title, created, assets)));
        tx.objectStore('projects').put(new Uint8Array([1, 2, id]), id);
        tx.objectStore('thumbnails').put({data: new Uint8Array([9]), type: 'image/png'}, id);
    }
    tx.objectStore('assets').put(new Uint8Array([7, 7]), ASSET_A);
    tx.objectStore('assets').put(new Uint8Array([8, 8]), ASSET_B);
    db.close();
    const backpack = await openWith(factory, 'TW_Backpack', 1, backpackSchema);
    const btx = backpack.transaction('backpack', 'readwrite');
    for (let i = 0; i < 25; i++) {
        btx.objectStore('backpack').add({
            type: 'script',
            name: `Script ${i}`,
            mime: 'application/json',
            bodyData: new Uint8Array([i]).buffer,
            bodyMD5: `md5-${i}`,
            thumbnailData: new Uint8Array([1]).buffer
        });
    }
    backpack.close();
};

const setup = async (sourceEntries = []) => {
    const source = new IDBFactory();
    await seedSource(source);
    const accountStorage = createStorage([
        ['tw:theme', '{"gui":"dark"}'],
        ['tw:addons', '{"a":1}'],
        ['mw:autosave:interval', '5'],
        ['mw:rotur-token', 'secret'],
        ['mw:rotur-oauth', '{"accessToken":"x"}'],
        ['mw:mistwarp-session', 'session'],
        ['mw:git-token', 'pat'],
        ['tw:persisted_unsandboxed', '["https://evil"]'],
        ['mw:rotur-grants', '{}'],
        ['mw:tier:mist', 'Pro'],
        ['unrelated', 'x'],
        ...sourceEntries
    ]);
    const frame = createEditorData({
        storage: () => accountStorage,
        open: name => new Promise(resolve => {
            const r = source.open(name);
            r.onupgradeneeded = () => r.transaction.abort();
            r.onsuccess = () => resolve(r.result);
            r.onerror = event => {
                event.preventDefault();
                resolve(null);
            };
        })
    });
    const call = jest.fn(async (method, args) => {
        expect(method).toBe('editorData');
        return structuredClone(await frame[args.action](args));
    });
    const reload = jest.fn();
    return {source, accountStorage, frame, call, reload};
};

const readEditor = async () => {
    const db = await openWith(indexedDB, 'TW_RestorePoints', 2, restoreSchema);
    const tx = db.transaction(['meta', 'projects', 'assets', 'thumbnails']);
    const result = {
        meta: await request(tx.objectStore('meta').getAll()),
        metaKeys: await request(tx.objectStore('meta').getAllKeys()),
        projects: await request(tx.objectStore('projects').getAll()),
        assets: await request(tx.objectStore('assets').getAllKeys()),
        thumbnails: await request(tx.objectStore('thumbnails').getAllKeys())
    };
    db.close();
    const backpack = await openWith(indexedDB, 'TW_Backpack', 1, backpackSchema);
    result.backpack = await request(backpack.transaction('backpack').objectStore('backpack')
        .getAll());
    backpack.close();
    return result;
};

if (typeof structuredClone === 'undefined') {
    global.structuredClone = value => value;
}

beforeEach(() => {
    global.indexedDB = new IDBFactory();
    localStorage.clear();
});

test('only editor settings can leave mistwarp.org, never credentials or account permissions', () => {
    for (const key of ['tw:theme', 'tw:addons', 'mw:autosave:interval', 'mw:menu-bar-order-v7', 'PackagerOptions.x',
        'sa-find-case-sensitive', 'mw:blocked-project-prompts', 'mw:unsaved-device-backup']) {
        expect(movableKey(key)).toBe(true);
    }
    for (const key of ['mw:rotur-token', 'mw:rotur-oauth', 'mw:rotur-oauth-pending', 'mw:mistwarp-session',
        'mw:warptheme-session', 'mw:git-token', 'mw:analytics-session', 'tw:persisted_unsandboxed',
        'mw:rotur-grants', 'mw:rotur-activity-grants', 'mw:rotur-settings', 'mw:tier:mist', MOVED_KEY,
        'mw:new-access-token', 'unrelated', '__proto__']) {
        expect(movableKey(key)).toBe(false);
    }
});

test('moves settings, restore points and the backpack once, then reloads', async () => {
    const {call, reload, accountStorage} = await setup();
    await expect(moveEditorData({call, reload, progress: () => {}})).resolves.toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('tw:theme')).toBe('{"gui":"dark"}');
    expect(localStorage.getItem('mw:autosave:interval')).toBe('5');
    for (const key of ['mw:rotur-token', 'mw:rotur-oauth', 'mw:mistwarp-session', 'mw:git-token',
        'tw:persisted_unsandboxed', 'mw:rotur-grants', 'mw:tier:mist', 'unrelated']) {
        expect(localStorage.getItem(key)).toBeNull();
    }
    const editor = await readEditor();
    expect(editor.meta.map(point => point.title)).toEqual(['First', 'Second']);
    expect(editor.assets.sort()).toEqual([ASSET_A, ASSET_B]);
    expect(editor.thumbnails).toEqual(editor.metaKeys);
    expect(editor.projects.map(project => Array.from(project))).toEqual([[1, 2, 1], [1, 2, 2]]);
    expect(editor.backpack).toHaveLength(25);
    expect(editor.backpack[24].name).toBe('Script 24');
    expect(localStorage.getItem(MOVED_KEY)).toBeTruthy();
    expect(accountStorage.getItem(MOVED_KEY)).toBeTruthy();

    reload.mockClear();
    await expect(moveEditorData({call, reload, progress: () => {}})).resolves.toBe(false);
    expect(reload).not.toHaveBeenCalled();
});

test('the account refuses to hand data out again once it has moved', async () => {
    const {frame} = await setup();
    await frame.done();
    expect(frame.status()).toEqual({moved: true});
    expect(() => frame.settings()).toThrow('already moved');
    expect(() => frame.restorePoints()).toThrow('already moved');
    expect(() => frame.asset({id: ASSET_A})).toThrow('already moved');
});

test('another browser that already moved the data skips the move', async () => {
    const {call, reload, frame} = await setup();
    await frame.done();
    await expect(moveEditorData({call, reload, progress: () => {}})).resolves.toBe(false);
    expect(localStorage.getItem(MOVED_KEY)).toBeTruthy();
    expect(localStorage.getItem('tw:theme')).toBeNull();
});

test('restore points already on the editor are kept, and a move that stopped halfway resumes without copies', async () => {
    const {call, reload} = await setup();
    const db = await openWith(indexedDB, 'TW_RestorePoints', 2, restoreSchema);
    const tx = db.transaction(['meta', 'projects'], 'readwrite');
    const id = await request(tx.objectStore('meta').add(meta('Made on the editor', 300, {})));
    tx.objectStore('projects').put(new Uint8Array([5]), id);
    await new Promise(resolve => {
        tx.oncomplete = resolve;
    });
    db.close();
    let points = 0;
    const flaky = jest.fn((method, args) => {
        if (args.action === 'restorePoint' && ++points === 2) return Promise.reject(new Error('dropped'));
        return call(method, args);
    });
    await expect(moveEditorData({call: flaky, reload, progress: () => {}})).resolves.toBe(false);
    expect(localStorage.getItem(MOVED_KEY)).toBeNull();
    expect((await readEditor()).meta.map(point => point.title)).toEqual(['Made on the editor', 'First']);
    await expect(moveEditorData({call, reload, progress: () => {}})).resolves.toBe(true);
    const editor = await readEditor();
    expect(editor.meta.map(point => point.title)).toEqual(['Made on the editor', 'First', 'Second']);
    expect(editor.backpack).toHaveLength(25);
});

test('the account never creates a database that does not exist', async () => {
    const empty = new IDBFactory();
    const frame = createEditorData({
        storage: () => createStorage([]),
        open: name => new Promise(resolve => {
            const r = empty.open(name);
            r.onupgradeneeded = () => r.transaction.abort();
            r.onsuccess = () => resolve(r.result);
            r.onerror = event => {
                event.preventDefault();
                resolve(null);
            };
        })
    });
    await expect(frame.restorePoints()).resolves.toEqual([]);
    await expect(frame.backpack({})).resolves.toEqual({items: [], done: true});
    const names = await empty.databases();
    expect(names).toEqual([]);
});

test('requests for anything outside restore points are refused', async () => {
    const {frame} = await setup();
    expect(() => frame.restorePoint({id: 'x'})).toThrow();
    expect(() => frame.asset({id: '../meta'})).toThrow();
    expect(() => frame.asset({id: 1})).toThrow();
});

test('an unreachable account frame does not hold up the editor', async () => {
    const reload = jest.fn();
    const started = Date.now();
    await expect(moveEditorData({
        connect: () => new Promise(() => {}),
        call: jest.fn(),
        reload,
        progress: () => {},
        statusWait: 50
    })).resolves.toBe(false);
    expect(Date.now() - started).toBeLessThan(2000);
    expect(localStorage.getItem(MOVED_KEY)).toBeNull();
});
