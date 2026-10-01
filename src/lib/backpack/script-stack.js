const collectStackBlocks = (blocks, topBlockId) => {
    const collected = [];
    const seen = new Set();
    const visit = id => {
        if (!id || seen.has(id)) return;
        const block = blocks.getBlock(id);
        if (!block) return;
        seen.add(id);
        collected.push(JSON.parse(JSON.stringify(block)));
        for (const input of Object.values(block.inputs || {})) {
            visit(input.block);
            visit(input.shadow);
        }
        visit(block.next);
    };
    visit(topBlockId);
    if (collected.length > 0) {
        const top = collected[0];
        top.parent = null;
        top.topLevel = true;
        top.x = Number(top.x) || 0;
        top.y = Number(top.y) || 0;
    }
    return collected;
};

export default collectStackBlocks;
