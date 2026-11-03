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

// A score from 0 to 100 that reaches 50 at `half` and approaches 100 without capping, so bigger values keep counting.
const towards100 = (value, half) => (value > 0 ? (100 * value) / (value + half) : 0);

// Project size on a log scale: 20 blocks score 0, 200 score 29, 2,000 score 59, 20,000 score 88, 50,000 or more 100.
const sizeScore = blocks => Math.min(100, Math.max(0, 100 * Math.log10(blocks / 20) / Math.log10(50000 / 20)));

// Scripts longer than this are hard to follow at a glance.
const LONG_SCRIPT = 60;
// Scripts nested at least this deep are hard to follow.
const DEEP_NESTING = 5;
// A sprite with at least this many scripts is hard to trace.
const BUSY_TARGET = 40;

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
    let depthSum = 0;
    let controlCount = 0;

    const walk = (firstId, depth) => {
        let blockId = firstId;
        while (blockId && !visited.has(blockId)) {
            visited.add(blockId);
            const block = blocks[blockId];
            if (!block) break;

            if (!block.shadow) {
                length++;
                depthSum += depth;
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
    return {length, maxDepth, depthSum, controlCount};
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
    const scriptBlocks = scripts.reduce((sum, script) => sum + script.length, 0);

    // Half the score is how big the project is, half how hard its code is to follow whatever its size: how deep the
    // average block is nested, how many blocks are decisions, and how much of the code is in long scripts.
    const meanBlockDepth = scriptBlocks ? scripts.reduce((sum, script) => sum + script.depthSum, 0) / scriptBlocks : 0;
    const decisionsPerBlock = blockCount ? (conditionalCount + loopCount) / blockCount : 0;
    const longScriptShare = scriptBlocks ?
        scripts.filter(script => script.length > LONG_SCRIPT).reduce((sum, script) => sum + script.length, 0) /
            scriptBlocks :
        0;
    const scoreParts = {
        size: Math.round(sizeScore(blockCount)),
        nesting: Math.round(towards100(meanBlockDepth, 1.5)),
        branching: Math.round(towards100(decisionsPerBlock, 0.12)),
        longScripts: Math.round(100 * longScriptShare)
    };
    const intricacy = (0.4 * scoreParts.nesting) + (0.35 * scoreParts.branching) + (0.25 * scoreParts.longScripts);
    const complexityScore = Math.round((0.5 * scoreParts.size) + (0.5 * intricacy));
    const scalarCount = [...variables.values()].filter(variable => !variable.type).length;
    const listCount = [...variables.values()].filter(variable => variable.type === 'list').length;

    // Recommendations point at where the problem is, and do not fire just because a project is big.
    const recommendations = [];
    const deepScripts = scripts.filter(script => script.maxDepth >= DEEP_NESTING);
    if (deepScripts.length) {
        const deepest = deepScripts.reduce((a, b) => (b.maxDepth > a.maxDepth ? b : a));
        recommendations.push({id: 'nesting', count: deepScripts.length, sprite: deepest.targetName});
    }
    const longScripts = scripts.filter(script => script.length > LONG_SCRIPT);
    if (longScripts.length) {
        const longest = longScripts.reduce((a, b) => (b.length > a.length ? b : a));
        recommendations.push({id: 'length', count: longScripts.length, sprite: longest.targetName});
    }
    if (blockCount >= 300 && customDefinitionCount === 0) recommendations.push({id: 'custom-blocks'});
    const busiest = targetMetrics.reduce((a, b) => (!a || b.scripts > a.scripts ? b : a), null);
    if (busiest && busiest.scripts >= BUSY_TARGET) {
        recommendations.push({id: 'scripts', count: busiest.scripts, sprite: busiest.name});
    }

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
