import v8 from 'v8';
import {IDBDatabase, IDBFactory} from 'fake-indexeddb';

jest.mock('virtual:packager-runtime', () => ({buildId: 'test', runtimeUrl: name => name}), {virtual: true});

if (typeof global.structuredClone === 'undefined') {
    global.structuredClone = value => v8.deserialize(v8.serialize(value));
}

const missing = () => {
    delete global.indexedDB;
    return null;
};

const insecure = () => {
    const open = jest.fn(() => {
        throw new DOMException('The operation is insecure.', 'SecurityError');
    });
    global.indexedDB = {open};
    return open;
};

const working = () => {
    global.indexedDB = new IDBFactory();
    return global.indexedDB;
};

const load = path => {
    let loaded;
    jest.isolateModules(() => {
        loaded = require(path);
    });
    return loaded.default || loaded;
};

const settle = ms => new Promise(resolve => setTimeout(resolve, ms));

const closingOnce = () => jest.spyOn(IDBDatabase.prototype, 'transaction').mockImplementationOnce(() => {
    throw new DOMException('The database connection is closing.', 'InvalidStateError');
});

let warn;


beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
    jest.restoreAllMocks();
    delete global.indexedDB;
});

describe.each([
    ['indexedDB is undefined', missing],
    ['indexedDB.open throws', insecure]
])('when %s', (name, block) => {
    test('project history storage rejects only to its callers and recovers later', async () => {
        block();
        const LightningFS = load('@isomorphic-git/lightning-fs');
        const fs = new LightningFS(`history-${name}`, {defer: true}).promises;
        await expect(fs.stat('/repo')).rejects.toBeTruthy();
        await expect(fs.mkdir('/repo')).rejects.toBeTruthy();
        await settle(700);

        working();
        await fs.mkdir('/repo');
        expect((await fs.stat('/repo')).isDirectory()).toBe(true);
        await settle(700);
    });

    test('loading the packager does not touch storage, and using its cache fails softly', async () => {
        const open = block();
        const cache = load('../../src/packager/packager/web/cache');
        if (open) expect(open).not.toHaveBeenCalled();
        await expect(cache.get({src: 'asset.js', sha256: 'abc'})).rejects.toBeTruthy();
        await settle(10);
        expect(warn).toHaveBeenCalled();
    });

    test('the local backpack reports that it is unavailable', async () => {
        block();
        const backpack = load('../../src/lib/api/local-backpack');
        await expect(backpack.getBackpackContents({limit: 20, offset: 0})).rejects.toThrow();
    });
});

describe('a connection that is closing is reopened once', () => {
    test('project history storage', async () => {
        working();
        const idb = load('@isomorphic-git/idb-keyval');
        const store = new idb.Store('reopen-history', 'keyval');
        await idb.set('key', 'value', store);
        (await store._dbp).close();
        expect(await idb.get('key', store)).toBe('value');
        await idb.close(store);
        await idb.close(store);
    });

    test('packager asset cache', async () => {
        const factory = working();
        const open = jest.spyOn(factory, 'open');
        const Database = load('../../src/packager/common/idb');
        const db = new Database('reopen-packager', 1, 'assets');
        await db.open();
        closingOnce();
        const {store} = await db.createTransaction('readonly');
        expect(store.name).toBe('assets');
        expect(open).toHaveBeenCalledTimes(2);
        db.close();
    });

    test('local backpack', async () => {
        const factory = working();
        const open = jest.spyOn(factory, 'open');
        const backpack = load('../../src/lib/api/local-backpack');
        expect(await backpack.getBackpackContents({limit: 20, offset: 0})).toEqual([]);
        closingOnce();
        expect(await backpack.getBackpackContents({limit: 20, offset: 0})).toEqual([]);
        expect(open).toHaveBeenCalledTimes(2);
    });

    test('a second failure still reaches the caller', async () => {
        working();
        const idb = load('@isomorphic-git/idb-keyval');
        const store = new idb.Store('reopen-twice', 'keyval');
        await idb.set('key', 'value', store);
        closingOnce();
        closingOnce();
        await expect(idb.get('key', store)).rejects.toMatchObject({name: 'InvalidStateError'});
        expect(await idb.get('key', store)).toBe('value');
    });
});
