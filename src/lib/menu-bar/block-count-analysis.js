import WindowManager from '../../addons/window-system/window-manager.js';
import Utils from '../find-bar/Utils.js';

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

export const analyzeProject = runtime => {
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

/**
 * @param {object} options Native menu bar integration.
 * @returns {object} Controller.
 */
export default function (options) {
    const {vm, display, getSetting, getBlockly, msg} = options;
    let analysisWindow = null;
    let analysisRoot = null;
    let navigation = null;
    let refreshTimer = null;

    const element = (tag, className, text = null) => {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== null) node.textContent = text;
        return node;
    };

    const levelFor = score => {
        if (score >= 60) return {id: 'high', label: msg('level-high')};
        if (score >= 30) return {id: 'medium', label: msg('level-medium')};
        return {id: 'low', label: msg('level-low')};
    };

    const metricCard = (label, value, hint) => {
        const card = element('div', 'sa-complexity-metric');
        card.append(
            element('span', 'sa-complexity-metric-value', value),
            element('span', 'sa-complexity-metric-label', label)
        );
        if (hint) card.appendChild(element('span', 'sa-complexity-metric-hint', hint));
        return card;
    };

    const createSection = title => {
        const section = element('section', 'sa-complexity-section');
        section.appendChild(element('h2', null, title));
        return section;
    };

    const categoryLabel = category => {
        const known = new Set(['motion', 'looks', 'sound', 'event', 'control', 'sensing', 'operators', 'data',
            'procedures', 'pen']);
        return known.has(category) ? msg(`category-${category}`) : humanizeOpcode(category);
    };

    const showScript = async script => {
        const Blockly = await getBlockly();
        if (!navigation) navigation = new Utils(vm, Blockly);
        if (!vm.editingTarget || vm.editingTarget.id !== script.targetId) vm.setEditingTarget(script.targetId);
        if (analysisWindow) analysisWindow.hide();
        window.focus();
        setTimeout(() => navigation.scrollBlockIntoView(script.id), 120);
    };

    const renderAnalysis = () => {
        if (!analysisRoot) return;
        const metrics = analyzeProject(vm.runtime);
        const level = levelFor(metrics.complexityScore);
        analysisRoot.replaceChildren();

        const summary = element('header', `sa-complexity-summary sa-complexity-${level.id}`);
        const score = element('div', 'sa-complexity-score');
        score.title = msg('score-help');
        score.append(
            element('strong', null, metrics.complexityScore),
            element('span', null, msg('out-of-100'))
        );
        const summaryText = element('div', 'sa-complexity-summary-text');
        summaryText.append(
            element('span', 'sa-complexity-eyebrow', msg('complexity-score')),
            element('h1', null, msg('level-summary', {level: level.label})),
            element('p', null, msg('project-summary', {
                blocks: metrics.blockCount,
                sprites: metrics.spriteCount,
                scripts: metrics.scriptCount
            }))
        );
        const refresh = element('button', 'sa-complexity-refresh', msg('refresh'));
        refresh.type = 'button';
        refresh.addEventListener('click', renderAnalysis);
        summary.append(score, summaryText, refresh);
        analysisRoot.appendChild(summary);

        const overview = createSection(msg('overview'));
        const grid = element('div', 'sa-complexity-metrics');
        grid.append(
            metricCard(msg('total-blocks'), metrics.blockCount),
            metricCard(msg('total-scripts'), metrics.scriptCount, msg('longest-value', {count: metrics.longestScript})),
            metricCard(msg('total-sprites'), metrics.spriteCount),
            metricCard(msg('assets'), metrics.costumeCount + metrics.soundCount,
                msg('assets-detail', {costumes: metrics.costumeCount, sounds: metrics.soundCount})),
            metricCard(msg('data'), metrics.scalarCount + metrics.listCount,
                msg('data-detail', {variables: metrics.scalarCount, lists: metrics.listCount})),
            metricCard(msg('max-nesting'), metrics.maxDepth, msg('average-value', {value: metrics.averageDepth}))
        );
        overview.appendChild(grid);
        analysisRoot.appendChild(overview);

        const insights = element('div', 'sa-complexity-two-column');
        const flow = createSection(msg('code-shape'));
        const flowGrid = element('div', 'sa-complexity-shape');
        flowGrid.append(
            metricCard(msg('conditional-blocks'), metrics.conditionalCount),
            metricCard(msg('loop-blocks'), metrics.loopCount),
            metricCard(msg('event-blocks'), metrics.eventCount),
            metricCard(msg('custom-blocks'), metrics.customDefinitionCount,
                msg('calls-value', {count: metrics.customCallCount}))
        );
        flow.appendChild(flowGrid);

        const distribution = createSection(msg('block-distribution'));
        const distributionList = element('div', 'sa-complexity-bars');
        const largestCategory = metrics.categories.length ? metrics.categories[0][1] : 1;
        for (const [category, count] of metrics.categories.slice(0, 6)) {
            const row = element('div', 'sa-complexity-bar-row');
            const label = element('span', null, categoryLabel(category));
            const track = element('div', 'sa-complexity-bar-track');
            const fill = element('div', 'sa-complexity-bar-fill');
            fill.style.width = `${(count / largestCategory) * 100}%`;
            track.appendChild(fill);
            row.append(label, track, element('strong', null, count));
            distributionList.appendChild(row);
        }
        if (!metrics.categories.length) {
            distributionList.appendChild(element('p', 'sa-complexity-empty', msg('empty-project')));
        }
        distribution.appendChild(distributionList);
        insights.append(flow, distribution);
        analysisRoot.appendChild(insights);

        const recommendations = createSection(msg('recommendations'));
        const recommendationList = element('div', 'sa-complexity-recommendations');
        if (metrics.recommendations.length) {
            for (const recommendation of metrics.recommendations) {
                const item = element('div', 'sa-complexity-recommendation');
                item.append(
                    element('strong', null, msg(`recommend-${recommendation.id}-title`)),
                    element('span', null, msg(`recommend-${recommendation.id}-detail`, {
                        count: recommendation.count || 0
                    }))
                );
                recommendationList.appendChild(item);
            }
        } else {
            const item = element('div', 'sa-complexity-recommendation sa-complexity-balanced');
            item.append(element('strong', null, msg('balanced-title')), element('span', null, msg('balanced-detail')));
            recommendationList.appendChild(item);
        }
        recommendations.appendChild(recommendationList);
        analysisRoot.appendChild(recommendations);

        const hotspots = createSection(msg('hotspots'));
        hotspots.appendChild(element('p', 'sa-complexity-section-help', msg('hotspots-help')));
        const hotspotList = element('div', 'sa-complexity-table');
        for (const script of metrics.scripts.slice(0, 8)) {
            const row = element('button', 'sa-complexity-table-row');
            row.type = 'button';
            const identity = element('span', 'sa-complexity-script');
            identity.append(element('strong', null, script.targetName), element('small', null, script.label));
            row.append(
                identity,
                element('span', null, msg('blocks-value', {count: script.length})),
                element('span', null, msg('depth-value', {count: script.maxDepth})),
                element('span', 'sa-complexity-open', msg('show-script'))
            );
            row.addEventListener('click', () => showScript(script));
            hotspotList.appendChild(row);
        }
        if (!metrics.scripts.length) hotspotList.appendChild(element('p', 'sa-complexity-empty', msg('no-scripts')));
        hotspots.appendChild(hotspotList);
        analysisRoot.appendChild(hotspots);

        const bySprite = createSection(msg('by-sprite'));
        const targetList = element('div', 'sa-complexity-table');
        for (const target of metrics.targets) {
            const row = element('div', 'sa-complexity-table-row sa-complexity-target-row');
            row.append(
                element('strong', null, target.name),
                element('span', null, msg('blocks-value', {count: target.blocks})),
                element('span', null, msg('scripts-value', {count: target.scripts})),
                element('span', null, msg('assets-value', {count: target.costumes + target.sounds}))
            );
            targetList.appendChild(row);
        }
        bySprite.appendChild(targetList);
        analysisRoot.appendChild(bySprite);
    };

    const showAnalysis = () => {
        if (analysisWindow) {
            renderAnalysis();
            analysisWindow.show().bringToFront();
            return;
        }

        analysisRoot = element('main', 'sa-complexity');
        analysisWindow = WindowManager.createWindow({
            id: 'project-complexity',
            title: msg('complexity-title'),
            width: 780,
            height: 680,
            minWidth: 540,
            minHeight: 420,
            maxWidth: 1100,
            maxHeight: 900,
            className: 'sa-block-count-window',
            onClose: () => {
                analysisWindow = null;
                analysisRoot = null;
            }
        });
        analysisWindow.setContent(analysisRoot)
            .center()
            .show();
        renderAnalysis();
    };

    const updateDisplay = () => {
        const metrics = analyzeProject(vm.runtime);
        if (display) {
            const parts = [];
            if (getSetting('show_block_count')) parts.push(msg('blocks', {num: metrics.blockCount}));
            if (getSetting('show_costume_count')) parts.push(msg('costumes', {num: metrics.costumeCount}));
            if (getSetting('show_sound_count')) parts.push(msg('sounds', {num: metrics.soundCount}));
            if (getSetting('show_complexity_score')) {
                parts.push(msg('complexity-menu', {score: metrics.complexityScore}));
            }
            display.textContent = parts.length ? parts.join(' · ') : msg('analysis-short');
        }
        if (analysisWindow) renderAnalysis();
    };

    const scheduleUpdate = () => {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(updateDisplay, 500);
    };

    vm.on('PROJECT_CHANGED', scheduleUpdate);
    vm.runtime.on('PROJECT_LOADED', updateDisplay);
    display.type = 'button';
    display.title = msg('open-analysis');
    display.addEventListener('click', showAnalysis);
    updateDisplay();

    return {
        update: updateDisplay,
        destroy: () => {
            vm.off('PROJECT_CHANGED', scheduleUpdate);
            vm.runtime.off('PROJECT_LOADED', updateDisplay);
            display.removeEventListener('click', showAnalysis);
            clearTimeout(refreshTimer);
            if (analysisWindow) analysisWindow.close();
        }
    };
}
