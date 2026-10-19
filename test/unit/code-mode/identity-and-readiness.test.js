import {findItem, indexOfItem, itemIdFor} from '../../../src/lib/asset-identity.js';
import {
    dropWorkspaceWaiters,
    pendingWorkspaceWaiters,
    setWorkspaceReadyCheck,
    settleWorkspaceWaiters,
    whenWorkspaceReady
} from '../../../src/lib/code-mode/workspace-ready.js';
import {
    closeTab,
    cycleTab,
    emptyTabs,
    openTab,
    pinTab,
    pruneTabs,
    scriptTab
} from '../../../src/lib/code-mode/tabs.js';

describe('asset identity', () => {
    test('each costume object gets its own stable id, even when asset ids match', () => {
        const a = {name: 'a', assetId: 'same'};
        const b = {name: 'b', assetId: 'same'};
        expect(itemIdFor(a)).toBe(itemIdFor(a));
        expect(itemIdFor(a)).not.toBe(itemIdFor(b));
    });

    test('the index follows the object through reorders and deletes', () => {
        const a = {name: 'a'};
        const b = {name: 'b'};
        const c = {name: 'c'};
        const id = itemIdFor(b);
        expect(indexOfItem([a, b, c], id)).toBe(1);
        expect(indexOfItem([b, c, a], id)).toBe(0);
        expect(indexOfItem([a, c], id)).toBe(-1);
        expect(findItem([c, b], id)).toBe(b);
    });

    test('renaming keeps the id', () => {
        const item = {name: 'before'};
        const id = itemIdFor(item);
        item.name = 'after';
        expect(itemIdFor(item)).toBe(id);
    });

    test('non objects have no id', () => {
        expect(itemIdFor(null)).toBeNull();
        expect(indexOfItem(null, 'x')).toBe(-1);
    });
});

describe('whenWorkspaceReady', () => {
    afterEach(() => {
        setWorkspaceReadyCheck(null);
        dropWorkspaceWaiters(null);
    });

    test('resolves at once when the workspace already shows the target', async () => {
        setWorkspaceReadyCheck(id => id === 'sprite');
        await expect(whenWorkspaceReady('sprite')).resolves.toBe(true);
        expect(pendingWorkspaceWaiters()).toBe(0);
    });

    test('queues until the workspace is settled for that target', async () => {
        setWorkspaceReadyCheck(() => false);
        const ready = whenWorkspaceReady('sprite');
        const other = whenWorkspaceReady('other');
        expect(pendingWorkspaceWaiters()).toBe(2);
        settleWorkspaceWaiters('sprite');
        await expect(ready).resolves.toBe(true);
        expect(pendingWorkspaceWaiters()).toBe(1);
        settleWorkspaceWaiters('other');
        await expect(other).resolves.toBe(true);
    });

    test('drops waiters when another sprite loads first', async () => {
        setWorkspaceReadyCheck(() => false);
        const stale = whenWorkspaceReady('old');
        const kept = whenWorkspaceReady('new');
        dropWorkspaceWaiters('new');
        await expect(stale).resolves.toBe(false);
        expect(pendingWorkspaceWaiters()).toBe(1);
        settleWorkspaceWaiters('new');
        await expect(kept).resolves.toBe(true);
    });

    test('several waiters for one target settle together', async () => {
        setWorkspaceReadyCheck(() => false);
        const first = whenWorkspaceReady('t');
        const second = whenWorkspaceReady('t');
        settleWorkspaceWaiters('t');
        await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
    });
});

describe('editor tabs', () => {
    const a = scriptTab('a');
    const b = scriptTab('b');
    const c = scriptTab('c');

    test('a preview tab is replaced by the next preview', () => {
        let state = openTab(emptyTabs(), a, {preview: true});
        state = openTab(state, b, {preview: true});
        expect(state.tabs.map(tab => tab.key)).toEqual([b.key]);
        expect(state.previewKey).toBe(b.key);
    });

    test('pinning keeps the tab when the next preview opens', () => {
        let state = openTab(emptyTabs(), a, {preview: true});
        state = pinTab(state, a.key);
        state = openTab(state, b, {preview: true});
        expect(state.tabs.map(tab => tab.key)).toEqual([a.key, b.key]);
    });

    test('opening a preview tab again without preview pins it', () => {
        let state = openTab(emptyTabs(), a, {preview: true});
        state = openTab(state, a, {preview: false});
        expect(state.previewKey).toBeNull();
    });

    test('closing picks a neighbour and cycling wraps', () => {
        let state = openTab(openTab(openTab(emptyTabs(), a, {}), b, {}), c, {});
        expect(cycleTab(state, 1).activeKey).toBe(a.key);
        state = closeTab({...state, activeKey: b.key}, b.key);
        expect(state.activeKey).toBe(c.key);
    });

    test('tabs whose file is gone close', () => {
        const state = openTab(openTab(emptyTabs(), a, {}), b, {});
        const pruned = pruneTabs(state, tab => tab.key !== b.key);
        expect(pruned.tabs.map(tab => tab.key)).toEqual([a.key]);
        expect(pruned.activeKey).toBe(a.key);
    });
});

describe('asset upload file kinds', () => {
    const {classifyFile} = require('../../../src/lib/asset-upload.js');

    test('classifies dropped files by extension and type', () => {
        expect(classifyFile({name: 'cat.PNG', type: ''})).toBe('image');
        expect(classifyFile({name: 'pic.svg', type: 'image/svg+xml'})).toBe('image');
        expect(classifyFile({name: 'meow.flac', type: ''})).toBe('sound');
        expect(classifyFile({name: 'beat.mp3', type: 'audio/mpeg'})).toBe('sound');
        expect(classifyFile({name: 'hero.sprite3', type: ''})).toBe('sprite');
        expect(classifyFile({name: 'myext.js', type: ''})).toBe('extension');
        expect(classifyFile({name: 'notes.txt', type: 'text/plain'})).toBeNull();
    });
});
