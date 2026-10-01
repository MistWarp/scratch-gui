import lazyScratchBlocks from '../tw-lazy-scratch-blocks';
import {isBackpackAvailable, saveToBackpack} from './save-to-backpack';

let getLabel = () => 'Add to backpack';

const getTargetBlock = ScratchBlocks => {
    const workspace = ScratchBlocks.getMainWorkspace && ScratchBlocks.getMainWorkspace();
    const gesture = workspace && workspace.currentGesture_;
    if (!gesture || gesture.flyout_) return null;
    const block = gesture.targetBlock_;
    if (!block || block.isShadow() || block.workspace !== workspace) return null;
    return block;
};

const addBackpackItem = (ScratchBlocks, items) => {
    if (!isBackpackAvailable()) return items;
    const block = getTargetBlock(ScratchBlocks);
    if (!block) return items;
    const item = {
        enabled: true,
        icon: 'backpack',
        text: getLabel(),
        callback: () => saveToBackpack({kind: 'script', blockId: block.id})
    };
    const next = items.slice();
    next.splice(Math.min(1, next.length), 0, item);
    return next;
};

const installBlockContextMenu = labelGetter => {
    if (labelGetter) getLabel = labelGetter;
    if (!lazyScratchBlocks.isLoaded()) return false;
    const ScratchBlocks = lazyScratchBlocks.get();
    const ContextMenu = ScratchBlocks.ContextMenu;
    if (!ContextMenu || ContextMenu._mwBackpackWrapped) return Boolean(ContextMenu);
    ContextMenu._mwBackpackWrapped = true;
    const originalShow = ContextMenu.show;
    ContextMenu.show = function (event, items, rtl) {
        let nextItems = items;
        try {
            nextItems = addBackpackItem(ScratchBlocks, items);
        } catch (e) {
            nextItems = items;
        }
        return originalShow.call(this, event, nextItems, rtl);
    };
    return true;
};

export default installBlockContextMenu;
