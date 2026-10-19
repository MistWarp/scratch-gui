import reducer, {
    activateTab,
    assetEditorActivated,
    consumeReveal,
    editorTabInitialState,
    revealInCode,
    showBlocksTab
} from '../../../src/reducers/editor-tab.js';
import {
    getActiveAssetEditor,
    isBlocksEditorVisible,
    isCodeMode,
    isCostumesTabVisible,
    isPaintEditorActive,
    isSoundEditorActive,
    isSoundsTabVisible
} from '../../../src/lib/editor-visibility.js';

const blocks = {...editorTabInitialState, editorMode: 'blocks', activeTabIndex: 0};
const code = {...blocks, editorMode: 'code'};

const wrap = (editorTab, editingTarget = {id: 'sprite', currentCostume: 2}) => ({
    scratchGui: {editorTab, vm: {editingTarget}}
});

describe('editor mode reducer', () => {
    test('ACTIVATE_TAB switches tabs in Blocks mode', () => {
        expect(reducer(blocks, activateTab(2)).activeTabIndex).toBe(2);
    });

    test('ACTIVATE_TAB never changes the mode', () => {
        expect(reducer(blocks, activateTab(1)).editorMode).toBe('blocks');
        expect(reducer(code, activateTab(1)).editorMode).toBe('code');
    });

    test('ACTIVATE_TAB 1 or 2 in Code mode becomes a reveal request', () => {
        const costume = reducer(code, activateTab(1));
        expect(costume.activeTabIndex).toBe(0);
        expect(costume.reveal.kind).toBe('currentCostume');
        const sound = reducer(code, activateTab(2));
        expect(sound.reveal.kind).toBe('currentSound');
        expect(sound.reveal.nonce).not.toBe(costume.reveal.nonce);
    });

    test('ACTIVATE_TAB 0 in Code mode is ignored', () => {
        expect(reducer(code, activateTab(0))).toBe(code);
    });

    test('SHOW_BLOCKS_TAB enters Blocks mode with the index', () => {
        const next = reducer(code, showBlocksTab(1));
        expect(next.editorMode).toBe('blocks');
        expect(next.activeTabIndex).toBe(1);
    });

    test('SHOW_BLOCKS_TAB without an index keeps the last tab', () => {
        const next = reducer({...code, activeTabIndex: 2}, showBlocksTab());
        expect(next.activeTabIndex).toBe(2);
        expect(next.editorMode).toBe('blocks');
    });

    test('REVEAL_IN_CODE enters Code mode with a request that is cleared once consumed', () => {
        const next = reducer(blocks, revealInCode({kind: 'block', targetId: 't', id: 'b'}));
        expect(next.editorMode).toBe('code');
        expect(next.reveal).toMatchObject({kind: 'block', targetId: 't', id: 'b'});
        expect(reducer(next, consumeReveal(next.reveal.nonce + 1)).reveal).toBe(next.reveal);
        expect(reducer(next, consumeReveal(next.reveal.nonce)).reveal).toBeNull();
    });

    test('ASSET_EDITOR_ACTIVATED records the mounted asset editor', () => {
        const next = reducer(code, assetEditorActivated({kind: 'costume', targetId: 't', index: 1}));
        expect(next.activeAssetEditor).toEqual({kind: 'costume', targetId: 't', index: 1});
        expect(reducer(next, assetEditorActivated(null)).activeAssetEditor).toBeNull();
    });
});

describe('editor visibility selectors', () => {
    test('Blocks mode follows the tab index', () => {
        expect(isBlocksEditorVisible(wrap(blocks))).toBe(true);
        expect(isCostumesTabVisible(wrap({...blocks, activeTabIndex: 1}))).toBe(true);
        expect(isSoundsTabVisible(wrap({...blocks, activeTabIndex: 2}))).toBe(true);
        expect(isCodeMode(wrap(blocks))).toBe(false);
    });

    test('everything is hidden in Code mode', () => {
        for (const index of [0, 1, 2]) {
            const state = wrap({...code, activeTabIndex: index});
            expect(isBlocksEditorVisible(state)).toBe(false);
            expect(isCostumesTabVisible(state)).toBe(false);
            expect(isSoundsTabVisible(state)).toBe(false);
        }
        expect(isCodeMode(wrap(code))).toBe(true);
    });

    test('getActiveAssetEditor reads the tab in Blocks mode', () => {
        expect(getActiveAssetEditor(wrap(blocks))).toBeNull();
        expect(getActiveAssetEditor(wrap({...blocks, activeTabIndex: 1})))
            .toEqual({kind: 'costume', targetId: 'sprite', index: 2});
        expect(getActiveAssetEditor(wrap({...blocks, activeTabIndex: 2})))
            .toEqual({kind: 'sound', targetId: 'sprite', index: null});
    });

    test('getActiveAssetEditor reads the workbench tab in Code mode', () => {
        expect(getActiveAssetEditor(wrap({...code, activeTabIndex: 1}))).toBeNull();
        const state = wrap({...code, activeAssetEditor: {kind: 'sound', targetId: 'x', index: 3}});
        expect(getActiveAssetEditor(state)).toEqual({kind: 'sound', targetId: 'x', index: 3});
        expect(isSoundEditorActive(state)).toBe(true);
        expect(isPaintEditorActive(state)).toBe(false);
    });
});
