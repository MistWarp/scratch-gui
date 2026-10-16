import {
    closeEverywhere,
    closeInGroup,
    focusGroup,
    focusedGroup,
    mountsAssetEditor,
    moveTab,
    openInLayout,
    setRatio,
    singleLayout,
    splitTab
} from '../../../src/lib/code-mode/editor-groups.js';
import {assetTab, referenceTab, scriptTab} from '../../../src/lib/code-mode/tabs.js';

const a = scriptTab('a');
const b = scriptTab('b');
const c = scriptTab('c');
const costume1 = assetTab('costume', 'a', 1);
const costume2 = assetTab('costume', 'b', 2);
const sound = assetTab('sound', 'a', 3);

const withTabs = (...tabs) => tabs.reduce((layout, tab) => openInLayout(layout, tab), singleLayout());
const keys = group => group.tabs.map(tab => tab.key);

describe('editor groups', () => {
    test('splitting moves the tab into a new focused group', () => {
        const layout = splitTab(withTabs(a, b), 'g0', b.key, 'row');
        expect(layout.groups).toHaveLength(2);
        expect(layout.direction).toBe('row');
        expect(keys(layout.groups[0])).toEqual([a.key]);
        expect(keys(layout.groups[1])).toEqual([b.key]);
        expect(layout.focused).toBe(layout.groups[1].id);
        expect(layout.groups[1].activeKey).toBe(b.key);
    });

    test('splitting the only tab of the only group does nothing, copying works', () => {
        const single = withTabs(a);
        expect(splitTab(single, 'g0', a.key, 'column')).toBe(single);
        const copied = splitTab(single, 'g0', a.key, 'column', {copy: true});
        expect(copied.direction).toBe('column');
        expect(copied.groups.map(keys)).toEqual([[a.key], [a.key]]);
    });

    test('at most two groups: a further split moves into the other group', () => {
        const two = splitTab(withTabs(a, b, c), 'g0', c.key, 'row');
        const next = splitTab(two, 'g0', b.key, 'column');
        expect(next.groups).toHaveLength(2);
        expect(next.direction).toBe('row');
        expect(keys(next.groups[1])).toEqual([c.key, b.key]);
    });

    test('tabs move between groups and reorder within a group', () => {
        const two = splitTab(withTabs(a, b, c), 'g0', c.key, 'row');
        const other = two.groups[1].id;
        const moved = moveTab(two, 'g0', a.key, other, 0);
        expect(keys(moved.groups[0])).toEqual([b.key]);
        expect(keys(moved.groups[1])).toEqual([a.key, c.key]);
        expect(moved.focused).toBe(other);
        const reordered = moveTab(moved, other, a.key, other, 2);
        expect(keys(reordered.groups[1])).toEqual([c.key, a.key]);
        expect(reordered.groups[1].activeKey).toBe(a.key);
    });

    test('each group keeps its own active tab', () => {
        const two = splitTab(withTabs(a, b, c), 'g0', c.key, 'row');
        const back = focusGroup(two, 'g0');
        const opened = openInLayout(back, a);
        expect(opened.groups[0].activeKey).toBe(a.key);
        expect(opened.groups[1].activeKey).toBe(c.key);
    });

    test('opening a file shown in the other group focuses that group', () => {
        const two = focusGroup(splitTab(withTabs(a, b), 'g0', b.key, 'row'), 'g0');
        const opened = openInLayout(two, b);
        expect(opened.focused).toBe(two.groups[1].id);
        expect(keys(opened.groups[0])).toEqual([a.key]);
    });

    test('closing the last tab of a group removes the group', () => {
        const two = splitTab(withTabs(a, b), 'g0', b.key, 'row');
        const closed = closeInGroup(two, two.groups[1].id, b.key);
        expect(closed.groups).toHaveLength(1);
        expect(closed.focused).toBe('g0');
        const moved = moveTab(two, two.groups[1].id, b.key, 'g0');
        expect(moved.groups).toHaveLength(1);
        expect(keys(moved.groups[0])).toEqual([a.key, b.key]);
    });

    test('closing everywhere keeps one empty group', () => {
        const two = splitTab(withTabs(a), 'g0', a.key, 'row', {copy: true});
        const closed = closeEverywhere(two, a.key);
        expect(closed.groups).toHaveLength(1);
        expect(closed.groups[0].tabs).toEqual([]);
        expect(focusedGroup(closed)).toBe(closed.groups[0]);
    });

    test('only one asset editor of a kind mounts, in the focused group first', () => {
        const two = splitTab(withTabs(costume1, costume2), 'g0', costume2.key, 'row');
        const other = two.groups[1].id;
        expect(mountsAssetEditor(two, other)).toBe(true);
        expect(mountsAssetEditor(two, 'g0')).toBe(false);
        const refocused = focusGroup(two, 'g0');
        expect(mountsAssetEditor(refocused, 'g0')).toBe(true);
        expect(mountsAssetEditor(refocused, other)).toBe(false);
    });

    test('different asset kinds and text tabs mount side by side', () => {
        const two = splitTab(withTabs(costume1, sound), 'g0', sound.key, 'row');
        expect(mountsAssetEditor(two, 'g0')).toBe(true);
        expect(mountsAssetEditor(two, two.groups[1].id)).toBe(true);
        const ref = splitTab(withTabs(referenceTab(), a), 'g0', a.key, 'row', {copy: true});
        expect(mountsAssetEditor(ref, 'g0')).toBe(false);
    });

    test('the split ratio is clamped', () => {
        const two = splitTab(withTabs(a, b), 'g0', b.key, 'row');
        expect(setRatio(two, 0.01).ratio).toBe(0.15);
        expect(setRatio(two, 2).ratio).toBe(0.85);
        expect(setRatio(two, 0.4).ratio).toBe(0.4);
    });
});
