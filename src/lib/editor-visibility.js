const BLOCKS_TAB_INDEX = 0;
const COSTUMES_TAB_INDEX = 1;
const SOUNDS_TAB_INDEX = 2;

const editorTab = state => (state && state.scratchGui && state.scratchGui.editorTab) || {};

const isCodeMode = state => editorTab(state).editorMode === 'code';

const blocksTabIs = (state, index) => !isCodeMode(state) && (editorTab(state).activeTabIndex || 0) === index;

const isBlocksEditorVisible = state => blocksTabIs(state, BLOCKS_TAB_INDEX);

const isCostumesTabVisible = state => blocksTabIs(state, COSTUMES_TAB_INDEX);

const isSoundsTabVisible = state => blocksTabIs(state, SOUNDS_TAB_INDEX);

const editingTargetOf = state => {
    const vm = state && state.scratchGui && state.scratchGui.vm;
    return (vm && vm.editingTarget) || null;
};

const getActiveAssetEditor = state => {
    if (isCodeMode(state)) {
        const active = editorTab(state).activeAssetEditor;
        return active ? {kind: active.kind, targetId: active.targetId, index: active.index} : null;
    }
    const target = editingTargetOf(state);
    const targetId = target ? target.id : null;
    if (isCostumesTabVisible(state)) {
        return {kind: 'costume', targetId, index: target ? target.currentCostume : null};
    }
    if (isSoundsTabVisible(state)) {
        return {kind: 'sound', targetId, index: null};
    }
    return null;
};

const isPaintEditorActive = state => {
    const active = getActiveAssetEditor(state);
    return Boolean(active && active.kind === 'costume');
};

const isSoundEditorActive = state => {
    const active = getActiveAssetEditor(state);
    return Boolean(active && active.kind === 'sound');
};

export {
    getActiveAssetEditor,
    isBlocksEditorVisible,
    isCodeMode,
    isCostumesTabVisible,
    isPaintEditorActive,
    isSoundEditorActive,
    isSoundsTabVisible
};
