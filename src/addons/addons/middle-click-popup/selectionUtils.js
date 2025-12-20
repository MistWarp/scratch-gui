// Selection and navigation utilities

/**
 * Find the next selectable (non-header) item index
 * @param {any[]} queryPreviews Array of preview items
 * @param {number} startIdx Starting index
 * @param {number} selectedPreviewIdx Current selection
 * @returns {number} Index of next selectable item, or startIdx if none found
 */
const findNextSelectableIndex = (queryPreviews, startIdx, selectedPreviewIdx) => {
    let actualIdx = startIdx;
    
    if (actualIdx >= 0 && actualIdx < queryPreviews.length) {
        const candidate = queryPreviews[actualIdx];
        if (candidate && candidate.isHeader) {
            // Determine direction based on where we're coming from
            const direction = actualIdx > selectedPreviewIdx ? 1 : -1;
            
            // Search for the next non-header in that direction
            let searchIdx = actualIdx + direction;
            while (searchIdx >= 0 && searchIdx < queryPreviews.length) {
                if (!queryPreviews[searchIdx].isHeader) {
                    actualIdx = searchIdx;
                    break;
                }
                searchIdx += direction;
            }
            
            // If we didn't find anything in that direction, try the opposite
            if (queryPreviews[actualIdx].isHeader) {
                searchIdx = actualIdx - direction;
                while (searchIdx >= 0 && searchIdx < queryPreviews.length) {
                    if (!queryPreviews[searchIdx].isHeader) {
                        actualIdx = searchIdx;
                        break;
                    }
                    searchIdx -= direction;
                }
            }
            
            // If still a header (all items are headers?), return -1
            if (queryPreviews[actualIdx] && queryPreviews[actualIdx].isHeader) {
                return -1;
            }
        }
    }
    
    return actualIdx;
};

/**
 * Handle sprite selection
 * @param {any} spriteData Sprite data
 * @param {any} vm VM instance
 */
const handleSpriteSelection = (spriteData, vm) => {
    const spriteId = spriteData.id;
    vm.setEditingTarget(spriteId);
};

/**
 * Handle costume selection
 * @param {any} costumeData Costume data
 * @param {any} vm VM instance
 * @param {any} redux Redux store
 */
const handleCostumeSelection = (costumeData, vm, redux) => {
    const editingTarget = vm.editingTarget;
    if (editingTarget) {
        editingTarget.setCostume(costumeData.index);
        
        redux.dispatch({
            type: 'scratch-gui/navigation/ACTIVATE_TAB',
            activeTabIndex: 1
        });
    }
};

/**
 * Handle custom block selection
 * @param {any} customBlockData Custom block data
 * @param {any} vm VM instance
 * @param {any} Blockly Blockly instance
 * @param {any} redux Redux store
 */
const handleCustomBlockSelection = (customBlockData, vm, Blockly, redux) => {
    vm.setEditingTarget(customBlockData.targetId);
    
    redux.dispatch({
        type: 'scratch-gui/navigation/ACTIVATE_TAB',
        activeTabIndex: 0
    });
    
    setTimeout(() => {
        const workspace = Blockly.getMainWorkspace();
        if (workspace) {
            const block = workspace.getBlockById(customBlockData.blockId);
            if (block) {
                workspace.centerOnBlock(customBlockData.blockId);
                
                block.select();
                setTimeout(() => {
                    block.unselect();
                }, 500);
            }
        }
    }, 100);
};

/**
 * Handle regular block selection and creation
 * @param {any} block Block instance
 * @param {any} Blockly Blockly instance
 * @param {{x: number, y: number}} mousePosition Mouse position
 * @returns {any} New block
 */
const handleBlockSelection = (block, Blockly, mousePosition) => {
    const workspace = Blockly.getMainWorkspace();
    
    // This is mostly copied from https://github.com/scratchfoundation/scratch-blocks/blob/893c7e7ad5bfb416eaed75d9a1c93bdce84e36ab/core/scratch_blocks_utils.js#L171
    // Some bits were removed or changed to fit our needs.
    workspace.setResizesEnabled(false);

    let newBlock;
    Blockly.Events.disable();
    try {
        newBlock = block.createWorkspaceForm();
        Blockly.scratchBlocksUtils.changeObscuredShadowIds(newBlock);

        const svgRootNew = newBlock.getSvgRoot();
        if (!svgRootNew) {
            throw new Error('newBlock is not rendered.');
        }

        const blockBounds = newBlock.svgPath_.getBoundingClientRect();
        const newBlockX = Math.floor(
            (mousePosition.x - ((blockBounds.left + blockBounds.right) / 2)) / workspace.scale);
        const newBlockY = Math.floor(
            (mousePosition.y - ((blockBounds.top + blockBounds.bottom) / 2)) / workspace.scale);
        newBlock.moveBy(newBlockX, newBlockY);
    } finally {
        Blockly.Events.enable();
    }
    if (Blockly.Events.isEnabled()) {
        Blockly.Events.fire(new Blockly.Events.BlockCreate(newBlock));
    }

    return newBlock;
};

export {
    findNextSelectableIndex,
    handleSpriteSelection,
    handleCostumeSelection,
    handleCustomBlockSelection,
    handleBlockSelection
};
