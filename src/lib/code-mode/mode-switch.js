import AddonHooks from '../../addons/hooks.js';
import Utils from '../find-bar/Utils.js';
import {revealInCode, showBlocksTab, BLOCKS_TAB_INDEX} from '../../reducers/editor-tab.js';
import {whenWorkspaceReady} from './workspace-ready.js';

let cursorBlockProvider = null;

const setCursorBlockProvider = provider => {
    cursorBlockProvider = typeof provider === 'function' ? provider : null;
};

const getScratchBlocks = () => AddonHooks.blockly || (typeof window === 'undefined' ? null : window.ScratchBlocks);

const selectedBlockId = () => {
    const ScratchBlocks = getScratchBlocks();
    const selected = ScratchBlocks && ScratchBlocks.selected;
    if (!selected || !selected.workspace || selected.workspace.isFlyout) return null;
    return selected.id || null;
};

const focusBlock = (vm, blockId) => {
    const ScratchBlocks = getScratchBlocks();
    const workspace = ScratchBlocks && ScratchBlocks.getMainWorkspace && ScratchBlocks.getMainWorkspace();
    if (!workspace || !blockId) return false;
    new Utils(vm, ScratchBlocks).scrollBlockIntoView(blockId);
    const block = workspace.getBlockById(blockId);
    if (block && typeof block.select === 'function') block.select();
    return Boolean(block);
};

const showBlock = ({dispatch, vm, targetId, blockId}) => {
    const target = targetId ? vm.runtime.getTargetById(targetId) : vm.editingTarget;
    if (!target) return Promise.resolve(false);
    if (vm.editingTarget !== target) vm.setEditingTarget(target.id);
    dispatch(showBlocksTab(BLOCKS_TAB_INDEX));
    return whenWorkspaceReady(target.id).then(ready => {
        if (ready && blockId) focusBlock(vm, blockId);
        return ready;
    });
};

const switchToCode = ({dispatch, vm, blocksVisible}) => {
    const target = vm.editingTarget;
    const blockId = blocksVisible ? selectedBlockId() : null;
    dispatch(revealInCode(blockId && target ?
        {kind: 'block', targetId: target.id, id: blockId} :
        {kind: 'enter'}));
};

const switchToBlocks = ({dispatch, vm}) => {
    const cursor = cursorBlockProvider ? cursorBlockProvider() : null;
    if (cursor && cursor.blockId) {
        return showBlock({dispatch, vm, targetId: cursor.targetId, blockId: cursor.blockId});
    }
    dispatch(showBlocksTab());
    return Promise.resolve(true);
};

const toggleEditorMode = context => {
    if (context.isCode) return switchToBlocks(context);
    switchToCode(context);
    return Promise.resolve(true);
};

export {
    focusBlock,
    setCursorBlockProvider,
    showBlock,
    switchToBlocks,
    switchToCode,
    toggleEditorMode
};
