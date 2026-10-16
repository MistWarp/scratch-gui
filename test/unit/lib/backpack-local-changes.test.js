import v8 from 'v8';
import {IDBFactory} from 'fake-indexeddb';

jest.mock('virtual:packager-runtime', () => ({buildId: 'test', runtimeUrl: name => name}), {virtual: true});
jest.mock('../../../src/lib/utils/storage-request', () => ({requestPersistentStorage: () => {}}));

if (typeof global.structuredClone === 'undefined') {
    global.structuredClone = value => v8.deserialize(v8.serialize(value));
}

class FakeBroadcastChannel {
    constructor (name) {
        this.name = name;
        this.onmessage = null;
        FakeBroadcastChannel.channels.push(this);
    }
    postMessage (data) {
        FakeBroadcastChannel.channels
            .filter(channel => channel !== this && channel.name === this.name && channel.onmessage)
            .forEach(channel => channel.onmessage({data}));
    }
}
FakeBroadcastChannel.channels = [];

const loadTab = () => {
    let loaded;
    jest.isolateModules(() => {
        loaded = require('../../../src/lib/api/local-backpack');
    });
    return loaded.default;
};

const item = name => ({
    type: 'script',
    mime: 'application/json',
    name,
    body: btoa('[]'),
    thumbnail: btoa('png')
});

describe('local backpack change notifications', () => {
    let previousChannel;

    beforeEach(() => {
        previousChannel = global.BroadcastChannel;
        FakeBroadcastChannel.channels = [];
        global.BroadcastChannel = FakeBroadcastChannel;
        global.indexedDB = new IDBFactory();
    });

    afterEach(() => {
        global.BroadcastChannel = previousChannel;
    });

    test('tells other tabs when an item is saved, renamed or deleted', async () => {
        const tabA = loadTab();
        const tabB = loadTab();
        const seenByA = jest.fn();
        const seenByB = jest.fn();
        tabA.subscribeBackpackChanges(seenByA);
        const unsubscribe = tabB.subscribeBackpackChanges(seenByB);

        const saved = await tabA.saveBackpackObject(item('Walk'));
        expect(seenByB).toHaveBeenCalledTimes(1);
        expect(await tabB.getBackpackContents({limit: 20, offset: 0})).toEqual([
            expect.objectContaining({id: saved.id, name: 'Walk'})
        ]);

        await tabA.updateBackpackObject({id: saved.id, name: 'Run'});
        expect(seenByB).toHaveBeenCalledTimes(2);

        await tabA.deleteBackpackObject({id: saved.id});
        expect(seenByB).toHaveBeenCalledTimes(3);
        expect(seenByA).not.toHaveBeenCalled();

        unsubscribe();
        await tabA.saveBackpackObject(item('Jump'));
        expect(seenByB).toHaveBeenCalledTimes(3);
    });

    test('does not recreate an item that another tab deleted when renaming it', async () => {
        const tabA = loadTab();
        const tabB = loadTab();
        const saved = await tabA.saveBackpackObject(item('Walk'));
        await tabB.deleteBackpackObject({id: saved.id});

        await expect(tabA.updateBackpackObject({id: saved.id, name: 'Run'})).rejects.toThrow();
        expect(await tabA.getBackpackContents({limit: 20, offset: 0})).toEqual([]);
    });

    test('works without BroadcastChannel', async () => {
        delete global.BroadcastChannel;
        const tab = loadTab();
        const listener = jest.fn();
        tab.subscribeBackpackChanges(listener)();
        await expect(tab.saveBackpackObject(item('Walk'))).resolves.toEqual(expect.objectContaining({name: 'Walk'}));
    });
});
