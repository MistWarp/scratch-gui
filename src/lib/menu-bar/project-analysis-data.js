const CONDITIONALS = new Set([
    'control_if',
    'control_if_else',
    'control_switch'
]);

const LOOPS = new Set([
    'control_repeat',
    'control_repeat_until',
    'control_forever',
    'control_while',
    'control_for_each'
]);

const clamp = (value, max) => Math.min(max, Math.round(value));

const getTargetName = target => {
    if (typeof target.getName === 'function') return target.getName();
    return target.sprite && target.sprite.name ? target.sprite.name : 'Sprite';
};

const getScriptIds = target => {
    if (typeof target.blocks.getScripts === 'function') return target.blocks.getScripts();
    return Object.values(target.blocks._blocks)
        .filter(block => !block.shadow && !block.parent)
        .map(block => block.id);
};

const humanizeOpcode = opcode => {
    const labels = {
        event_whenflagclicked: 'Green flag',
        event_whenkeypressed: 'Key pressed',
        event_whenthisspriteclicked: 'Sprite clicked',
        event_whenstageclicked: 'Stage clicked',
        event_whenbroadcastreceived: 'Broadcast received',
        control_start_as_clone: 'Clone starts',
        procedures_definition: 'Custom block'
    };
    if (labels[opcode]) return labels[opcode];
    const name = (opcode.split('_')
        .slice(1)
        .join(' ') || opcode).replace(/([a-z])([A-Z])/g, '$1 $2');
    return name.charAt(0).toUpperCase() + name.slice(1);
};

const analyzeScript = (blocks, rootId) => {
    const visited = new Set();
    let length = 0;
    let maxDepth = 0;
    let controlCount = 0;

    const walk = (firstId, depth) => {
        let blockId = firstId;
        while (blockId && !visited.has(blockId)) {
            visited.add(blockId);
            const block = blocks[blockId];
            if (!block) break;

            if (!block.shadow) {
                length++;
                maxDepth = Math.max(maxDepth, depth);
                if (CONDITIONALS.has(block.opcode) || LOOPS.has(block.opcode)) controlCount++;
            }

            for (const [name, input] of Object.entries(block.inputs || {})) {
                if (input.block) walk(input.block, name.startsWith('SUBSTACK') ? depth + 1 : depth);
            }
            blockId = block.next;
        }
    };

    walk(rootId, 0);
    return {length, maxDepth, controlCount};
};

const analyzeProject = runtime => {
    const targets = (runtime.targets || []).filter(target =>
        target && target.blocks && target.blocks._blocks && target.isOriginal !== false
    );
    const categories = Object.create(null);
    const variables = new Map();
    const scripts = [];
    const targetMetrics = [];
    let blockCount = 0;
    let costumeCount = 0;
    let soundCount = 0;
    let conditionalCount = 0;
    let loopCount = 0;
    let eventCount = 0;
    let customCallCount = 0;
    let customDefinitionCount = 0;

    for (const target of targets) {
        const blocks = target.blocks._blocks;
        const visibleBlocks = Object.values(blocks).filter(block => !block.shadow);
        const scriptIds = getScriptIds(target);
        const targetName = getTargetName(target);
        const targetScripts = [];

        blockCount += visibleBlocks.length;
        costumeCount += target.sprite && target.sprite.costumes ? target.sprite.costumes.length : 0;
        soundCount += target.sprite && target.sprite.sounds ? target.sprite.sounds.length : 0;

        for (const variable of Object.values(target.variables || {})) variables.set(variable.id, variable);

        for (const block of visibleBlocks) {
            const category = block.opcode.split('_')[0] || 'other';
            categories[category] = (categories[category] || 0) + 1;
            if (CONDITIONALS.has(block.opcode)) conditionalCount++;
            if (LOOPS.has(block.opcode)) loopCount++;
            if (block.opcode.startsWith('event_')) eventCount++;
            if (block.opcode === 'procedures_call') customCallCount++;
            if (block.opcode === 'procedures_definition') customDefinitionCount++;
        }

        for (const rootId of scriptIds) {
            const root = blocks[rootId];
            if (!root || root.shadow) continue;
            const shape = analyzeScript(blocks, rootId);
            const script = {
                ...shape,
                id: rootId,
                targetId: target.id,
                targetName,
                label: humanizeOpcode(root.opcode),
                score: shape.length + (shape.controlCount * 4) + (shape.maxDepth * 8)
            };
            scripts.push(script);
            targetScripts.push(script);
        }

        targetMetrics.push({
            id: target.id,
            name: targetName,
            isStage: Boolean(target.isStage),
            blocks: visibleBlocks.length,
            scripts: targetScripts.length,
            costumes: target.sprite && target.sprite.costumes ? target.sprite.costumes.length : 0,
            sounds: target.sprite && target.sprite.sounds ? target.sprite.sounds.length : 0
        });
    }

    const scriptCount = scripts.length;
    const maxDepth = scripts.reduce((max, script) => Math.max(max, script.maxDepth), 0);
    const averageDepth = scriptCount ? scripts.reduce((sum, script) => sum + script.maxDepth, 0) / scriptCount : 0;
    const longestScript = scripts.reduce((max, script) => Math.max(max, script.length), 0);
    const scoreParts = {
        size: clamp(blockCount / 20, 25),
        structure: clamp(scriptCount / 3, 20),
        flow: clamp(((conditionalCount * 2) + loopCount) / 3, 25),
        nesting: clamp((maxDepth * 3) + averageDepth, 15),
        length: clamp(Math.max(0, longestScript - 10) / 3, 15)
    };
    const complexityScore = Object.values(scoreParts).reduce((sum, value) => sum + value, 0);
    const scalarCount = [...variables.values()].filter(variable => !variable.type).length;
    const listCount = [...variables.values()].filter(variable => variable.type === 'list').length;
    const recommendations = [];

    if (maxDepth >= 4) {
        recommendations.push({
            id: 'nesting',
            count: scripts.filter(script => script.maxDepth >= 4).length
        });
    }
    if (longestScript >= 40) {
        recommendations.push({
            id: 'length',
            count: scripts.filter(script => script.length >= 40).length
        });
    }
    if (blockCount >= 100 && customDefinitionCount === 0) recommendations.push({id: 'custom-blocks'});
    if (scriptCount >= 30) recommendations.push({id: 'scripts', count: scriptCount});

    return {
        blockCount,
        scriptCount,
        spriteCount: targetMetrics.filter(target => !target.isStage).length,
        costumeCount,
        soundCount,
        scalarCount,
        listCount,
        conditionalCount,
        loopCount,
        eventCount,
        customCallCount,
        customDefinitionCount,
        maxDepth,
        averageDepth: Math.round(averageDepth * 10) / 10,
        longestScript,
        complexityScore,
        scoreParts,
        recommendations,
        categories: Object.entries(categories).sort((a, b) => b[1] - a[1]),
        targets: targetMetrics.sort((a, b) => b.blocks - a.blocks),
        scripts: scripts.sort((a, b) => b.score - a.score)
    };
};

export {
    analyzeProject,
    humanizeOpcode
};
