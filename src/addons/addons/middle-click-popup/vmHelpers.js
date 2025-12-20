// VM, sprite, costume, and custom block helpers

/**
 * Get all sprites/targets from the VM
 * @param {any} vm VM instance
 * @returns {Array<{
 *     id: string,
 *     name: string,
 *     costume: any,
 *     isStage: boolean
 * }>} List of sprites
 */
const getAllSprites = vm => {
    const targets = [];
    for (const target of vm.runtime.targets) {
        if (target.isOriginal && !target.isStage) {
            const costumes = target.getCostumes();
            targets.push({
                id: target.id,
                name: target.sprite.name,
                costume: costumes.length > 0 ? costumes[0] : null,
                isStage: target.isStage
            });
        }
    }
    return targets;
};

/**
 * Get all costumes from the current editing target
 * @param {any} vm VM instance
 * @returns {Array<{
 *     index: number,
 *     name: string,
 *     asset: any
 * }>} List of costumes
 */
const getAllCostumes = vm => {
    const costumes = [];
    const editingTarget = vm.editingTarget;
    if (editingTarget) {
        const targetCostumes = editingTarget.getCostumes();
        for (let i = 0; i < targetCostumes.length; i++) {
            costumes.push({
                index: i,
                name: targetCostumes[i].name,
                asset: targetCostumes[i].asset
            });
        }
    }
    return costumes;
};

/**
 * Get all custom blocks (procedures) from all sprites in the project
 * @param {any} vm VM instance
 * @returns {Array<{
 *     targetId: string,
 *     targetName: string,
 *     procCode: string,
 *     blockId: string,
 *     prototypeBlockId: string,
 *     displayName: string
 * }>} List of custom blocks
 */
const getAllCustomBlocks = vm => {
    const customBlocks = [];
    for (const target of vm.runtime.targets) {
        if (target.isOriginal) {
            const blocks = target.blocks;
            for (const blockId in blocks._blocks) {
                const block = blocks._blocks[blockId];
                if (block.opcode === 'procedures_definition') {
                    const prototypeBlockId = block.inputs.custom_block?.block;
                    if (prototypeBlockId) {
                        const prototypeBlock = blocks._blocks[prototypeBlockId];
                        if (prototypeBlock && prototypeBlock.mutation) {
                            const procCode = prototypeBlock.mutation.proccode;
                            const displayName = procCode.replace(/%[sb]/g, '()').trim();
                            customBlocks.push({
                                targetId: target.id,
                                targetName: target.isStage ? 'Stage' : target.sprite.name,
                                procCode: procCode,
                                blockId: blockId,
                                prototypeBlockId: prototypeBlockId,
                                displayName: displayName
                            });
                        }
                    }
                }
            }
        }
    }
    return customBlocks;
};

export {
    getAllSprites,
    getAllCostumes,
    getAllCustomBlocks
};
