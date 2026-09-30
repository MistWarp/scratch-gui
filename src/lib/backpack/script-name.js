import lazyScratchBlocks from '../tw-lazy-scratch-blocks';

const UNNAMED_SCRIPT_NAMES = ['', 'code'];

const getBlockList = blockObjects => {
    if (Array.isArray(blockObjects)) return blockObjects;
    if (blockObjects && Array.isArray(blockObjects.blocks)) return blockObjects.blocks;
    return [];
};

const describeBlocks = blockObjects => {
    const blocks = getBlockList(blockObjects).filter(block => block && !block.shadow);
    const top = blocks.find(block => block.topLevel) || blocks[0] || null;
    return {
        opcode: top ? top.opcode : null,
        blockCount: blocks.length
    };
};

const humanizeOpcode = opcode => {
    if (!opcode) return null;
    const withoutCategory = opcode.includes('_') ? opcode.slice(opcode.indexOf('_') + 1) : opcode;
    return withoutCategory.replace(/[_]+/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .toLowerCase()
        .trim() || null;
};

const getWorkspaceBlockText = blockId => {
    if (!blockId || !lazyScratchBlocks.isLoaded()) return null;
    try {
        const workspace = lazyScratchBlocks.get().getMainWorkspace();
        const block = workspace && workspace.getBlockById(blockId);
        if (!block || typeof block.toString !== 'function') return null;
        const text = `${block.toString(48)}`.replace(/\s+/g, ' ').trim();
        return text || null;
    } catch (e) {
        return null;
    }
};

const isUnnamedScript = item => item.type === 'script' && UNNAMED_SCRIPT_NAMES.includes(`${item.name || ''}`.trim());

export {
    describeBlocks,
    humanizeOpcode,
    getWorkspaceBlockText,
    isUnnamedScript
};
