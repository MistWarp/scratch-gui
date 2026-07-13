import JSZip from '@turbowarp/jszip';
import Blocks from 'scratch-vm/src/engine/blocks';
import Comment from 'scratch-vm/src/engine/comment';
import Variable from 'scratch-vm/src/engine/variable';
import {deserializeBlocks} from 'scratch-vm/src/serialization/sb3';

const clone = value => JSON.parse(JSON.stringify(value || {}));

const deepStableStringify = value => {
    if (Array.isArray(value)) return `[${value.map(deepStableStringify).join(',')}]`;
    if (value && typeof value === 'object') {
        return `{${Object.keys(value)
            .sort()
            .map(key => `${JSON.stringify(key)}:${deepStableStringify(value[key])}`)
            .join(',')}}`;
    }
    return JSON.stringify(value);
};

const targetKey = target => (target && target.isStage ? 'Stage' : target.name);

const targetsByKey = project => {
    const map = new Map();
    for (const target of project.targets || []) {
        map.set(targetKey(target), target);
    }
    return map;
};

const variableShape = (target, includeStage) => deepStableStringify({
    variables: target.variables || {},
    lists: target.lists || {},
    broadcasts: includeStage ? target.broadcasts || {} : null
});

const spriteLocalShape = target => deepStableStringify({
    variables: target.variables || {},
    lists: target.lists || {}
});

const immutableTargetShape = target => {
    const base = {
        isStage: target.isStage,
        name: target.name,
        costumes: target.costumes || [],
        sounds: target.sounds || [],
        currentCostume: target.currentCostume,
        volume: target.volume,
        layerOrder: target.layerOrder,
        extensionStorage: target.extensionStorage || null
    };

    if (target.isStage) {
        base.tempo = target.tempo;
        base.videoTransparency = target.videoTransparency;
        base.videoState = target.videoState;
        base.textToSpeechLanguage = target.textToSpeechLanguage;
    } else {
        base.visible = target.visible;
        base.x = target.x;
        base.y = target.y;
        base.size = target.size;
        base.direction = target.direction;
        base.draggable = target.draggable;
        base.rotationStyle = target.rotationStyle;
    }

    return deepStableStringify(base);
};

const patchableTargetShape = target => deepStableStringify({
    blocks: target.blocks || {},
    comments: target.comments || {},
    variables: target.isStage ? null : target.variables || {},
    lists: target.isStage ? null : target.lists || {}
});

const collectBlockIds = (blocks, topId, out = new Set()) => {
    if (!topId || out.has(topId) || !blocks || !blocks[topId]) return out;
    out.add(topId);
    const block = blocks[topId];
    if (block.next) collectBlockIds(blocks, block.next, out);
    for (const input of Object.values(block.inputs || {})) {
        if (Array.isArray(input)) {
            collectBlockIds(blocks, input[1], out);
            if (input[2] !== input[1]) collectBlockIds(blocks, input[2], out);
        } else if (input && typeof input === 'object') {
            collectBlockIds(blocks, input.block, out);
            if (input.shadow !== input.block) collectBlockIds(blocks, input.shadow, out);
        }
    }
    return out;
};

const topBlockIds = target => Object.keys(target.blocks || {})
    .filter(id => target.blocks[id] && target.blocks[id].topLevel)
    .sort();

const workspaceCommentsShape = target => deepStableStringify(
    Object.entries(target.comments || {})
        .filter(([, comment]) => !comment.blockId)
        .sort(([a], [b]) => a.localeCompare(b))
);

const subgraphShape = (target, topId) => {
    const ids = Array.from(collectBlockIds(target.blocks || {}, topId)).sort();
    const blocks = {};
    for (const id of ids) blocks[id] = target.blocks[id];
    const comments = {};
    for (const [id, comment] of Object.entries(target.comments || {})) {
        if (comment.blockId && ids.includes(comment.blockId)) {
            comments[id] = comment;
        }
    }
    return deepStableStringify({blocks, comments});
};

const changedTopLevelScripts = (previousTarget, nextTarget) => {
    if (workspaceCommentsShape(previousTarget) !== workspaceCommentsShape(nextTarget)) {
        return {canPatchWorkspace: false, reason: 'workspace comments changed'};
    }

    const previousTopIds = topBlockIds(previousTarget);
    const nextTopIds = topBlockIds(nextTarget);
    const allTopIds = Array.from(new Set([...previousTopIds, ...nextTopIds])).sort();
    const changedTopIds = [];
    const removedTopIds = [];

    for (const topId of allTopIds) {
        const previousHas = previousTopIds.includes(topId);
        const nextHas = nextTopIds.includes(topId);
        if (!previousHas && nextHas) {
            changedTopIds.push(topId);
        } else if (previousHas && !nextHas) {
            removedTopIds.push(topId);
        } else if (subgraphShape(previousTarget, topId) !== subgraphShape(nextTarget, topId)) {
            changedTopIds.push(topId);
        }
    }

    return {
        canPatchWorkspace: true,
        changedTopIds,
        removedTopIds
    };
};

const globalProjectShape = project => deepStableStringify({
    extensions: project.extensions || [],
    extensionURLs: project.extensionURLs || null,
    extensionStorage: project.extensionStorage || null,
    monitors: project.monitors || [],
    customFonts: project.customFonts || null,
    meta: project.meta || null
});

const makeVariables = target => {
    const variables = {};
    for (const id of Object.keys(target.variables || {})) {
        const [name, value, isCloud] = target.variables[id];
        const variable = new Variable(id, name, Variable.SCALAR_TYPE, Boolean(isCloud && target.isStage));
        variable.value = value;
        variables[id] = variable;
    }
    for (const id of Object.keys(target.lists || {})) {
        const [name, value] = target.lists[id];
        const variable = new Variable(id, name, Variable.LIST_TYPE, false);
        variable.value = Array.isArray(value) ? value.slice() : value;
        variables[id] = variable;
    }
    for (const id of Object.keys(target.broadcasts || {})) {
        variables[id] = new Variable(id, target.broadcasts[id], Variable.BROADCAST_MESSAGE_TYPE, false);
    }
    return variables;
};

const makeComments = target => {
    const comments = {};
    for (const id of Object.keys(target.comments || {})) {
        const source = target.comments[id];
        const comment = new Comment(
            id,
            `${source.text || ''}${typeof source.extraText === 'string' ? source.extraText : ''}`,
            source.x,
            source.y,
            source.width,
            source.height,
            source.minimized
        );
        if (source.blockId) comment.blockId = source.blockId;
        comments[id] = comment;
    }
    return comments;
};

const makeBlocks = (runtime, serializedBlocks) => {
    const blocks = new Blocks(runtime);
    const blockJson = clone(serializedBlocks);
    deserializeBlocks(blockJson);
    for (const id of Object.keys(blockJson)) {
        blocks.createBlock(blockJson[id]);
    }
    return blocks;
};

const getLiveTarget = (vm, sourceTarget) => {
    const key = targetKey(sourceTarget);
    return (vm.runtime.targets || []).find(target => (
        target.isOriginal &&
        (target.isStage ? key === 'Stage' : target.getName() === key)
    ));
};

const stopTargetThreads = (runtime, target) => {
    const clones = target && target.sprite && Array.isArray(target.sprite.clones) ?
        target.sprite.clones :
        [target];
    clones.forEach(cloneTarget => runtime.stopForTarget(cloneTarget));
};

const replaceTargetBlocks = (runtime, liveTarget, blocks) => {
    liveTarget.blocks = blocks;
    if (liveTarget.sprite) {
        liveTarget.sprite.blocks = blocks;
        for (const cloneTarget of liveTarget.sprite.clones || []) {
            cloneTarget.blocks = blocks;
        }
    }
    if (typeof blocks.resetCache === 'function') {
        blocks.resetCache();
    }
    if (typeof runtime.requestRedraw === 'function') {
        runtime.requestRedraw();
    }
};

const makePlan = (previousProject, nextProject) => {
    if (!previousProject || !nextProject) {
        return {type: 'reload', reason: 'missing baseline'};
    }

    if (globalProjectShape(previousProject) !== globalProjectShape(nextProject)) {
        return {type: 'reload', reason: 'global project metadata changed'};
    }

    const previousTargets = targetsByKey(previousProject);
    const nextTargets = targetsByKey(nextProject);
    const previousKeys = Array.from(previousTargets.keys()).sort();
    const nextKeys = Array.from(nextTargets.keys()).sort();
    if (deepStableStringify(previousKeys) !== deepStableStringify(nextKeys)) {
        return {type: 'reload', reason: 'target list changed'};
    }

    const changedTargets = [];
    for (const key of nextKeys) {
        const previousTarget = previousTargets.get(key);
        const nextTarget = nextTargets.get(key);
        if (immutableTargetShape(previousTarget) !== immutableTargetShape(nextTarget)) {
            return {type: 'reload', reason: `${key} assets or properties changed`};
        }
        if (previousTarget.isStage && variableShape(previousTarget, true) !== variableShape(nextTarget, true)) {
            return {type: 'reload', reason: 'stage variables, lists, or broadcasts changed'};
        }
        if (!previousTarget.isStage &&
            deepStableStringify(previousTarget.broadcasts || {}) !== deepStableStringify(nextTarget.broadcasts || {})) {
            return {type: 'reload', reason: `${key} broadcasts changed`};
        }
        if (patchableTargetShape(previousTarget) !== patchableTargetShape(nextTarget)) {
            const workspacePatch = changedTopLevelScripts(previousTarget, nextTarget);
            changedTargets.push({
                key,
                previous: previousTarget,
                source: nextTarget,
                workspacePatch,
                replaceVariables: !nextTarget.isStage &&
                    spriteLocalShape(previousTarget) !== spriteLocalShape(nextTarget)
            });
        }
    }

    return {type: 'patch', targets: changedTargets};
};

const parseProjectBuffer = async buffer => {
    const zip = await JSZip.loadAsync(buffer);
    const projectEntry = zip.file('project.json');
    if (!projectEntry) throw new Error('Invalid sb3: missing project.json');
    return JSON.parse(await projectEntry.async('string'));
};

const softReload = async (vm, buffer) => {
    vm.quit();
    await vm.loadProject(buffer, {skipGitImport: true});
    if (vm.renderer) vm.renderer.draw();
};

const getVisibleWorkspace = () => {
    if (typeof window === 'undefined') return null;
    if (window.AddonHooks && window.AddonHooks.blocklyWorkspace) {
        return window.AddonHooks.blocklyWorkspace;
    }
    if (window.Blockly && typeof window.Blockly.getMainWorkspace === 'function') {
        return window.Blockly.getMainWorkspace();
    }
    return null;
};

const withBlocklyEventsDisabled = (ScratchBlocks, fn) => {
    const wasEnabled = ScratchBlocks.Events && ScratchBlocks.Events.isEnabled();
    if (ScratchBlocks.Events) ScratchBlocks.Events.disable();
    try {
        return fn();
    } finally {
        if (wasEnabled) ScratchBlocks.Events.enable();
    }
};

const patchVisibleWorkspaceStacks = ({vm, liveTarget, sourceTarget, blocks, comments, workspacePatch}) => {
    if (typeof window === 'undefined') return false;
    if (!workspacePatch || !workspacePatch.canPatchWorkspace) return false;
    if (vm.editingTarget !== liveTarget) return true;
    if (workspacePatch.changedTopIds.length === 0 && workspacePatch.removedTopIds.length === 0) return true;

    const ScratchBlocks = window.ScratchBlocks;
    const workspace = getVisibleWorkspace();
    if (!ScratchBlocks || !ScratchBlocks.Xml || !workspace) return false;

    try {
        withBlocklyEventsDisabled(ScratchBlocks, () => {
            if (workspace.setResizesEnabled) workspace.setResizesEnabled(false);
            if (workspace.setToolboxRefreshEnabled) workspace.setToolboxRefreshEnabled(false);
            try {
                for (const topId of [...workspacePatch.removedTopIds, ...workspacePatch.changedTopIds]) {
                    const existing = workspace.getBlockById(topId);
                    if (existing) existing.dispose(false, true);
                }
                for (const topId of workspacePatch.changedTopIds) {
                    if (!sourceTarget.blocks || !sourceTarget.blocks[topId]) continue;
                    const xml = blocks.blockToXML(topId, comments);
                    if (!xml) continue;
                    const dom = ScratchBlocks.Xml.textToDom(`<xml xmlns="http://www.w3.org/1999/xhtml">${xml}</xml>`);
                    ScratchBlocks.Xml.domToWorkspace(dom, workspace);
                }
            } finally {
                if (workspace.setToolboxRefreshEnabled) workspace.setToolboxRefreshEnabled(true);
                if (workspace.setResizesEnabled) workspace.setResizesEnabled(true);
            }
        });
    } catch (e) {
        return false;
    }

    if (workspace.toolbox_ && workspace.toolbox_.refreshSelection) {
        workspace.toolbox_.refreshSelection();
    }
    if (workspace.resizeContents) workspace.resizeContents();
    if (workspace.clearUndo) workspace.clearUndo();
    return true;
};

const applyPatchPlan = (vm, plan) => {
    if (!plan.targets.length) {
        return {mode: 'noop', message: 'no source changes'};
    }

    let needsWorkspaceUpdate = false;
    let patchedWorkspaceStacks = 0;

    for (const item of plan.targets) {
        const liveTarget = getLiveTarget(vm, item.source);
        if (!liveTarget) {
            return {mode: 'reload', reason: `${item.key} is not loaded`};
        }
        stopTargetThreads(vm.runtime, liveTarget);
        const blocks = makeBlocks(vm.runtime, item.source.blocks || {});
        const comments = makeComments(item.source);
        replaceTargetBlocks(vm.runtime, liveTarget, blocks);
        liveTarget.comments = comments;
        if (item.replaceVariables) {
            liveTarget.variables = makeVariables(item.source);
        }
        if (liveTarget === vm.editingTarget) {
            const patchedWorkspace = !item.replaceVariables && patchVisibleWorkspaceStacks({
                vm,
                liveTarget,
                sourceTarget: item.source,
                blocks,
                comments,
                workspacePatch: item.workspacePatch
            });
            if (patchedWorkspace) {
                patchedWorkspaceStacks += item.workspacePatch ?
                    item.workspacePatch.changedTopIds.length + item.workspacePatch.removedTopIds.length :
                    0;
            } else {
                needsWorkspaceUpdate = true;
            }
        }
    }

    if (typeof vm.emitTargetsUpdate === 'function') {
        vm.emitTargetsUpdate(false);
    }
    if (needsWorkspaceUpdate && typeof vm.emitWorkspaceUpdate === 'function') {
        vm.emitWorkspaceUpdate();
    }
    if (vm.renderer) vm.renderer.draw();

    const targetNames = plan.targets.map(item => item.key).join(', ');
    const stackText = `${patchedWorkspaceStacks} stack${patchedWorkspaceStacks === 1 ? '' : 's'}`;
    return {
        mode: 'patch',
        message: patchedWorkspaceStacks ?
            `hot patched ${targetNames} (${stackText})` :
            `hot patched ${targetNames}`
    };
};

const hotPatchProject = ({vm, previousProject, nextProject, buffer, loadFallback}) => {
    const reload = async reason => {
        const fallbackBuffer = buffer || (loadFallback ? await loadFallback() : null);
        if (!fallbackBuffer) {
            return {mode: 'reload-needed', message: `soft reload needed: ${reason}`, reason};
        }
        await softReload(vm, fallbackBuffer);
        return {mode: 'reload', message: `soft reload: ${reason}`};
    };

    const plan = makePlan(previousProject, nextProject);
    if (plan.type === 'patch') {
        const result = applyPatchPlan(vm, plan);
        if (result.mode !== 'reload') return result;
        return reload(result.reason);
    }
    return reload(plan.reason);
};

export {
    hotPatchProject,
    parseProjectBuffer,
    softReload
};
