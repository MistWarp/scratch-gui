import LazyScratchBlocks from '../tw-lazy-scratch-blocks.js';
import log from '../utils/log.js';
import {
    PROJECT_OPERATION_EVENT,
    isProjectOperationActive,
    isProjectOperationActiveError,
    projectRevision,
    withProjectOperation
} from '../project-operation.js';
import {prepareProjectReplacement} from '../project-replacement.js';
import {getChangeKey} from 'scratch-vm/src/serialization/fractch-context';
import {
    canRedoExactly,
    canUndoExactly,
    latestRedo,
    latestUndo,
    markRedone,
    markUndone,
    pushCodeApply,
    pushCodeGroup
} from './code-history.js';
import {hasErrorDiagnostics} from './fractch-adapter.js';
import {plainName, textFacts, usesAs} from './text-facts.js';

const REFUSAL = {
    collaboration: 'Editing code is unavailable during collaboration',
    changed: 'The project changed while applying, try again',
    blocksChanged: 'Blocks changed since this apply, so it can\'t be undone here',
    redoChanged: 'Blocks changed since this undo, so it can\'t be redone here',
    cancelled: 'Apply cancelled',
    backup: 'The backup failed, so nothing was applied'
};

class CodeRefusal extends Error {
    constructor (reason, message, targetId = null) {
        super(message || REFUSAL[reason] || reason);
        this.name = 'CodeRefusal';
        this.reason = reason;
        this.targetId = targetId;
    }
}

class ApplyAllFailure extends Error {
    constructor (file, message, diagnostics = null) {
        super(message);
        this.name = 'ApplyAllFailure';
        this.targetId = file.targetId;
        this.fileName = file.name;
        this.diagnostics = diagnostics;
    }
}

const isCollaborating = vm => Boolean(vm && vm.editingCommands && vm.editingCommands.handler);

const mainWorkspace = () => {
    if (!LazyScratchBlocks.isLoaded()) return null;
    const ScratchBlocks = LazyScratchBlocks.get();
    return ScratchBlocks && ScratchBlocks.getMainWorkspace ? ScratchBlocks.getMainWorkspace() : null;
};

const blocksAttached = vm => {
    const workspace = mainWorkspace();
    return Boolean(workspace && Array.isArray(workspace.listeners_) &&
        workspace.listeners_.includes(vm.blockListener));
};

const flushBlockly = vm => {
    if (!blocksAttached(vm)) return;
    const ScratchBlocks = LazyScratchBlocks.get();
    if (ScratchBlocks.Events && ScratchBlocks.Events.fireNow_) ScratchBlocks.Events.fireNow_();
};

const liveChangeKey = (vm, targetId) => {
    const target = vm.runtime.getTargetById(targetId);
    return target && target.isOriginal ? getChangeKey(vm.runtime, target) : null;
};

const refuseIfStale = (vm, baseline) => {
    if (isCollaborating(vm)) throw new CodeRefusal('collaboration');
    if (!baseline) return;
    const target = vm.runtime.getTargetById(baseline.targetId);
    if (!target || !target.isOriginal ||
        projectRevision(vm) !== baseline.projectRevision ||
        (vm._projectLoadGeneration || 0) !== baseline.generation ||
        liveChangeKey(vm, baseline.targetId) !== baseline.changeKey) {
        throw new CodeRefusal('changed');
    }
};

const waitForIdle = vm => new Promise(resolve => {
    if (!isProjectOperationActive(vm) || typeof window === 'undefined') {
        resolve();
        return;
    }
    const listener = event => {
        if (event.detail && event.detail.vm === vm && !event.detail.active) {
            window.removeEventListener(PROJECT_OPERATION_EVENT, listener);
            resolve();
        }
    };
    window.addEventListener(PROJECT_OPERATION_EVENT, listener);
});

const withWaitingOperation = async (vm, operation) => {
    for (;;) {
        await waitForIdle(vm);
        try {
            return await withProjectOperation(vm, operation);
        } catch (error) {
            if (!isProjectOperationActiveError(error)) throw error;
        }
    }
};

const sessionBackups = new WeakMap();

const ensureSessionBackup = async (vm, {title, confirmBackupFailure, baseline}) => {
    const generation = vm._projectLoadGeneration || 0;
    const existing = sessionBackups.get(vm);
    if (existing && existing.generation === generation) return;
    try {
        const rollback = await prepareProjectReplacement(vm, title || 'Before applying code');
        sessionBackups.set(vm, {generation, rollback});
    } catch (error) {
        refuseIfStale(vm, baseline);
        const proceed = confirmBackupFailure ? await confirmBackupFailure(error) : false;
        if (!proceed) throw new CodeRefusal('backup');
        sessionBackups.set(vm, {generation, rollback: null});
    }
};

const hasSessionBackup = vm => {
    const existing = sessionBackups.get(vm);
    return Boolean(existing) && existing.generation === (vm._projectLoadGeneration || 0);
};

const emitWorkspaceIfAttached = (vm, targetId) => {
    if (!blocksAttached(vm) || !vm.editingTarget) return false;
    const ids = Array.isArray(targetId) ? targetId : [targetId];
    if (!ids.includes(vm.editingTarget.id)) return false;
    vm.emitWorkspaceUpdate();
    return true;
};

const commitSync = (vm, {baseline, targetId, check, run}) => {
    flushBlockly(vm);
    refuseIfStale(vm, baseline);
    if (check) check();
    const result = run();
    emitWorkspaceIfAttached(vm, targetId);
    return result;
};

const commitChange = (vm, {baseline, targetId, check, run, title, confirmBackupFailure, backup = true}) =>
    withWaitingOperation(vm, async () => {
        flushBlockly(vm);
        refuseIfStale(vm, baseline);
        if (backup) await ensureSessionBackup(vm, {title, confirmBackupFailure, baseline});
        return commitSync(vm, {baseline, targetId, check, run});
    });

const isEmptyValue = value => value === '' || value === 0 || value === '0' || value === null ||
    typeof value === 'undefined' || (Array.isArray(value) && value.length === 0);

const sameValue = (a, b) => (Array.isArray(a) || Array.isArray(b) ?
    JSON.stringify(a) === JSON.stringify(b) :
    String(a) === String(b));

const walkScript = (blocks, topId, into) => {
    const pending = [topId];
    while (pending.length) {
        const id = pending.pop();
        if (!id || into.has(id) || !blocks[id]) continue;
        into.add(id);
        const block = blocks[id];
        pending.push(block.next);
        for (const name in block.inputs) pending.push(block.inputs[name].block, block.inputs[name].shadow);
        if (Array.isArray(block.obscuredHeadShadows)) pending.push(...block.obscuredHeadShadows);
    }
    return into;
};

const importLines = text => new Set(String(text || '').split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('import ')));

const referencingSprites = (vm, stage, ids) => {
    const names = new Set();
    for (const target of vm.runtime.targets) {
        if (!target.isOriginal || target === stage) continue;
        const blocks = target.blocks._blocks;
        for (const blockId in blocks) {
            const fields = blocks[blockId].fields || {};
            if (['VARIABLE', 'LIST', 'BROADCAST_OPTION'].some(name => fields[name] && ids.has(fields[name].id))) {
                names.add(target.getName());
                break;
            }
        }
    }
    return Array.from(names);
};

const computeImpact = (vm, targetId, built, {previousText = '', text = ''} = {}) => {
    const target = vm.runtime.getTargetById(targetId);
    const reasons = [];
    const live = target ? target.blocks._blocks : {};
    const change = built.change || {blocks: {}, keepScripts: []};
    const kept = new Set();
    for (const topId of change.keepScripts || []) walkScript(live, topId, kept);
    const rebuilt = new Set(Object.keys(change.blocks || {}));
    for (const inputs of Object.values(change.primitiveIds || {})) {
        for (const ids of Object.values(inputs)) {
            if (ids && ids.block) rebuilt.add(ids.block);
            if (ids && ids.shadow) rebuilt.add(ids.shadow);
        }
    }
    let blocks = 0;
    for (const id in live) {
        if (!live[id].shadow && !kept.has(id) && !rebuilt.has(id)) blocks++;
    }
    const removed = built.removed || {};
    const removedDeclarations = (removed.variables || []).concat(removed.lists || []);
    const scripts = (removed.scripts || []).length;
    if (scripts) reasons.push('scriptRemoved');
    if (blocks > 20) reasons.push('manyBlocks');
    const before = importLines(previousText);
    const after = importLines(text);
    const stdlibRemoved = Array.from(before).filter(line => !after.has(line));
    if (stdlibRemoved.length) reasons.push('stdlib');
    const lookup = id => (target ? target.lookupVariableById(id) : null);
    const cloud = removedDeclarations.filter(entry => {
        const variable = lookup(entry.id);
        return entry.cloud || (variable && variable.isCloud);
    });
    if (cloud.length) reasons.push('cloud');
    const holdingValues = removedDeclarations.filter(entry => {
        const variable = lookup(entry.id);
        return variable && !isEmptyValue(variable.value);
    });
    if (holdingValues.length) reasons.push('values');
    const replacedValues = Object.keys(built.valueSets || {}).filter(id => {
        const variable = lookup(id);
        return variable && !isEmptyValue(variable.value) && !sameValue(variable.value, built.valueSets[id]);
    });
    if (replacedValues.length) reasons.push('replaceValue');
    let sprites = [];
    if (target && target.isStage) {
        const ids = new Set(removedDeclarations.map(entry => entry.id).concat(Object.keys(built.valueSets || {})));
        if (ids.size) sprites = referencingSprites(vm, target, ids);
        if (sprites.length) reasons.push('shared');
    }
    return {
        needsConfirm: reasons.length > 0,
        reasons,
        counts: {
            scripts,
            blocks,
            variables: removedDeclarations.length,
            comments: (removed.comments || []).length,
            sprites: sprites.length
        },
        sprites,
        cloud: cloud.map(entry => entry.name),
        replacedValues: replacedValues.map(id => {
            const variable = lookup(id);
            return variable ? variable.name : id;
        }),
        stdlibRemoved
    };
};

const FR220_HINT = 'put the declaration back, or use Apply all to apply every file together';

const factsFor = async (client, texts) => {
    if (!texts.length) return [];
    if (client && typeof client.facts === 'function') {
        try {
            return await client.facts(texts);
        } catch (error) {
            return texts.map(textFacts);
        }
    }
    return texts.map(textFacts);
};

const withFacts = others => (others || []).map(other => (other.facts ?
    other :
    {...other, facts: textFacts(other.text)}));

const removedDeclarations = built => ((built.removed && built.removed.variables) || [])
    .concat((built.removed && built.removed.lists) || []);

const usedByPrefix = name => `${name} is used by `;

const reportedUsers = (diagnostics, name) => {
    const prefix = usedByPrefix(name);
    const item = (diagnostics || []).find(entry => entry.code === 'FR220' && typeof entry.message === 'string' &&
        entry.message.startsWith(prefix));
    return item ? item.message.slice(prefix.length).split(', ') : null;
};

const isListEntry = (built, entry) => ((built.removed && built.removed.lists) || []).includes(entry);

const otherKindDeclared = (built, name, list, declared) => {
    if (declared) return declared.some(decl => decl.name === name && decl.list !== list);
    const created = built.created || {};
    return ((list ? created.variables : created.lists) || []).some(entry => plainName(entry.name) === name);
};

const otherTextReferences = (built, otherTexts, {declared = null} = {}) => {
    const diagnostics = [];
    const others = withFacts(otherTexts);
    for (const entry of removedDeclarations(built)) {
        const name = plainName(entry.name);
        const list = isListEntry(built, entry);
        const options = {otherKindDeclared: otherKindDeclared(built, name, list, declared)};
        const users = others.filter(other => usesAs(other.facts, name, list ? 'list' : 'var', options))
            .map(other => other.name);
        if (!users.length) continue;
        diagnostics.push({
            severity: 'error',
            code: 'FR220',
            message: `${usedByPrefix(entry.name)}${users.join(', ')}`,
            hint: FR220_HINT,
            line: 1,
            column: 1,
            endLine: 1,
            endColumn: 1
        });
    }
    return diagnostics;
};

const cloudChanges = built => {
    const created = (built.created && built.created.variables) || [];
    const changes = [];
    for (const entry of (built.removed && built.removed.variables) || []) {
        const name = plainName(entry.name);
        const toCloud = !entry.cloud;
        if (created.some(item => plainName(item.name) === name && Boolean(item.cloud) === toCloud)) {
            changes.push({removed: entry.name, name, toCloud});
        }
    }
    return changes;
};

const explainCloudChanges = (diagnostics, built) => {
    const changes = cloudChanges(built);
    if (!changes.length) return diagnostics;
    return diagnostics.map(item => {
        if (item.code !== 'FR220' || typeof item.message !== 'string') return item;
        const change = changes.find(entry => item.message.startsWith(usedByPrefix(entry.removed)));
        if (!change) return item;
        const users = item.message.slice(usedByPrefix(change.removed).length);
        const declaration = change.toCloud ? `cloud ${change.name}` : `var ${change.name}`;
        return {
            ...item,
            message: change.toCloud ?
                `${change.name} is used by ${users}, so it can't become a cloud variable in the same apply.` :
                `${change.name} is used by ${users}, so it can't stop being a cloud variable in the same apply.`,
            hint: `Remove the uses of ${change.name} and apply without it first. ` +
                `Then add ${declaration} and the uses back, and apply again.`
        };
    });
};

const creationDiagnostic = (diagnostics, name, list) => (diagnostics || []).find(item => item.code === 'FR222' &&
    item.message === `creates ${list ? 'list' : 'variable'} ${JSON.stringify(name)}`);

const movesToSprite = (stageBuilt, built) => {
    const removed = new Set();
    for (const entry of (stageBuilt.removed && stageBuilt.removed.variables) || []) {
        if (!entry.cloud) removed.add(`var:${plainName(entry.name)}`);
    }
    for (const entry of (stageBuilt.removed && stageBuilt.removed.lists) || []) removed.add(`list:${entry.name}`);
    const diagnostics = [];
    const created = built.created || {};
    const check = (entries, list) => {
        for (const entry of entries || []) {
            if (entry.implicit || entry.local || !removed.has(`${list ? 'list' : 'var'}:${entry.name}`)) continue;
            const at = creationDiagnostic(built.diagnostics, entry.name, list);
            diagnostics.push({
                severity: 'error',
                code: 'FR229',
                message: `Apply all can't move ${entry.name} from the Stage to this sprite in one step.`,
                hint: `First apply this sprite with a different name for its ${list ? 'list' : 'variable'}, ` +
                    `then apply the Stage without ${entry.name}, then rename it back and apply again.`,
                line: at ? at.line : 1,
                column: at ? at.column : 1,
                endLine: at ? at.endLine : 1,
                endColumn: at ? at.endColumn : 1
            });
        }
    };
    check(created.variables, false);
    check(created.lists, true);
    return diagnostics;
};

const withApplyAllHints = (diagnostics, built, otherTexts) => {
    const dirty = new Set((otherTexts || []).map(other => other.name));
    if (!dirty.size) return diagnostics;
    const removed = removedDeclarations(built).map(entry => entry.name);
    return diagnostics.map(item => {
        if (item.code !== 'FR220' || typeof item.message !== 'string') return item;
        const name = removed.find(entry => item.message.startsWith(usedByPrefix(entry)));
        if (!name) return item;
        const users = item.message.slice(usedByPrefix(name).length).split(', ');
        if (!users.some(user => dirty.has(user))) return item;
        return {...item, hint: FR220_HINT};
    });
};

const assignmentDiagnostic = (diagnostics, name) => (diagnostics || []).find(item => item.code === 'FR213' &&
    typeof item.message === 'string' && item.message.endsWith(`'${name}'`));

const spriteOnlyConflicts = (built, stageText) => {
    if (!stageText) return [];
    const declared = withFacts([stageText])[0].facts.declared;
    const diagnostics = [];
    const created = built.created || {};
    const check = (entries, list) => {
        for (const entry of entries || []) {
            if (!entry.implicit) continue;
            const name = plainName(entry.name);
            if (!declared.some(decl => decl.name === name && decl.list === list)) continue;
            const at = assignmentDiagnostic(built.diagnostics, name);
            const location = at ? {
                line: at.line,
                column: at.column,
                endLine: at.endLine,
                endColumn: at.endColumn,
                from: at.from,
                to: at.to
            } : {line: 1, column: 1, endLine: 1, endColumn: 1};
            diagnostics.push({
                severity: 'error',
                code: 'FR228',
                message: `this would make ${name} a sprite-only ${list ? 'list' : 'variable'}, ` +
                    `but the Stage code you have not applied yet declares ${name}`,
                hint: 'apply the Stage first, or use Apply all to apply every file together',
                ...location
            });
        }
    };
    check(created.variables, false);
    check(created.lists, true);
    return diagnostics;
};

const crossFileDiagnostics = async (vm, client, targetId, built, text, otherTexts) => {
    const others = otherTexts || [];
    if (!others.length) return [];
    const target = vm.runtime.getTargetById(targetId);
    if (!target) return [];
    const relevant = target.isStage ? others : others.filter(other => other.isStage);
    if (!relevant.length) return [];
    const facts = await factsFor(client, relevant.map(other => other.text).concat(target.isStage ? [text] : []));
    const items = relevant.map((other, index) => ({...other, facts: facts[index]}));
    if (target.isStage) {
        return otherTextReferences(built, items, {declared: facts[relevant.length].declared});
    }
    return spriteOnlyConflicts(built, items[0]);
};

const mergeUsedBy = (diagnostics, extra, built) => {
    const out = diagnostics.slice();
    const removed = removedDeclarations(built).map(entry => entry.name);
    for (const item of extra) {
        const name = item.code === 'FR220' ?
            removed.find(entry => item.message.startsWith(usedByPrefix(entry))) :
            null;
        const users = name ? reportedUsers(out, name) : null;
        if (!users) {
            out.push(item);
            continue;
        }
        const index = out.findIndex(entry => entry.code === 'FR220' && entry.message.startsWith(usedByPrefix(name)));
        const merged = Array.from(new Set(users.concat(reportedUsers([item], name))));
        out[index] = {...out[index], message: `${usedByPrefix(name)}${merged.join(', ')}`, hint: FR220_HINT};
    }
    return out;
};

const createsOrRemoves = built => {
    const created = built.created || {};
    const removed = built.removed || {};
    const any = group => Object.values(group).some(list => Array.isArray(list) && list.length > 0);
    return any(created) || any(removed) || (built.diagnostics || []).some(item => item.code === 'FR213');
};

const prepareApply = async ({vm, client, targetId, text, previous, lockedScripts, otherTexts}) => {
    if (isCollaborating(vm)) return {status: 'refused', reason: 'collaboration', message: REFUSAL.collaboration};
    const revision = projectRevision(vm);
    const generation = vm._projectLoadGeneration || 0;
    const built = await client.build(vm, targetId, text, {previous, lockedScripts, verifyRoundTrip: true});
    const baseline = {
        targetId,
        projectRevision: revision,
        generation,
        changeKey: built.tag ? built.tag.changeKey : null
    };
    if (!built.tag || built.tag.generation !== generation) {
        return {status: 'refused', reason: 'changed', message: REFUSAL.changed, built};
    }
    const extra = await crossFileDiagnostics(vm, client, targetId, built, text, otherTexts);
    const diagnostics = explainCloudChanges(
        mergeUsedBy(withApplyAllHints(built.diagnostics, built, otherTexts), extra, built),
        built
    );
    if (hasErrorDiagnostics(diagnostics)) return {status: 'invalid', diagnostics, built, baseline};
    const impact = computeImpact(vm, targetId, built, {previousText: previous ? previous.text : '', text});
    return {status: 'ready', diagnostics, built, change: built.change, impact, baseline, snapshot: text};
};

const refusalResult = error => {
    if (error instanceof ApplyAllFailure) {
        return {
            status: 'failed',
            reason: 'applyAllFailed',
            message: error.message,
            targetId: error.targetId,
            fileName: error.fileName,
            diagnostics: error.diagnostics
        };
    }
    if (error instanceof CodeRefusal) {
        return {status: 'refused', reason: error.reason, message: error.message, targetId: error.targetId};
    }
    if (error && error.name === 'CodeApplyError') {
        return {status: 'refused', reason: 'invalid', message: error.message, details: error.details || null};
    }
    throw error;
};

const commitApply = async (plan, {vm, confirmImpact, confirmBackupFailure, title, auto = false}) => {
    const {targetId} = plan.baseline;
    if (plan.impact && plan.impact.needsConfirm) {
        const accepted = confirmImpact ? await confirmImpact(plan.impact) : false;
        if (!accepted) return {status: 'cancelled', reason: 'cancelled', message: REFUSAL.cancelled};
    }
    try {
        const result = await commitChange(vm, {
            baseline: plan.baseline,
            targetId,
            title,
            confirmBackupFailure,
            run: () => vm.replaceTargetScripts(targetId, plan.change)
        });
        const afterHash = vm.getCodeStateHash(targetId);
        const entry = pushCodeApply({targetId, previous: result.previous, afterHash, auto});
        return {status: 'committed', result, entry, commitKey: liveChangeKey(vm, targetId)};
    } catch (error) {
        return refusalResult(error);
    }
};

const targetName = (vm, targetId) => {
    const target = vm.runtime.getTargetById(targetId);
    if (!target) return targetId;
    return target.isStage ? 'Stage' : target.getName();
};

const keepEverything = (target, variables) => ({
    format: 'vm',
    keepScripts: target.blocks._scripts.slice(),
    blocks: {},
    variables
});

const monitorVisible = (vm, id) => {
    const monitor = vm.runtime.getMonitorState().get(id);
    if (!monitor) return false;
    return Boolean(typeof monitor.get === 'function' ? monitor.get('visible') : monitor.visible);
};

const removableStageVariable = (vm, stage, id) => {
    if (!Object.prototype.hasOwnProperty.call(stage.variables, id)) return false;
    return !stage.variables[id].isCloud && !monitorVisible(vm, id);
};

const removeCreatedStageVariables = (vm, steps) => {
    const stage = vm.runtime.getTargetForStage();
    if (!stage) return null;
    const ids = new Set();
    for (const step of steps) {
        for (const id of (step && step.createdStageIds) || []) {
            if (removableStageVariable(vm, stage, id)) ids.add(id);
        }
    }
    if (!ids.size) return null;
    const result = vm.replaceTargetScripts(stage.id, keepEverything(stage, {
        delete: Array.from(ids),
        restoring: true
    }));
    return result.deletedVariableIds.length ? result.previous : null;
};

const restoreSteps = (vm, steps) => {
    const done = [];
    try {
        for (const step of steps) done.push(vm.replaceTargetScripts(step.targetId, {restore: step}).previous);
    } catch (error) {
        for (const step of done.slice().reverse()) {
            vm.replaceTargetScripts(step.targetId, {restore: step});
        }
        throw error;
    }
    return done;
};

const runRestores = (vm, targetId, steps) => restoreSteps(vm, steps.map(step => (step.targetId ?
    step :
    {...step, targetId})));

const rollbackSteps = (vm, steps) => {
    for (const step of steps.slice().reverse()) {
        try {
            vm.replaceTargetScripts(step.targetId, {restore: step});
        } catch (error) {
            log.warn('Apply all could not roll back a step', error);
        }
    }
    try {
        removeCreatedStageVariables(vm, steps);
    } catch (error) {
        log.warn('Apply all could not remove the variables it created', error);
    }
};

const groupHashes = (vm, targetIds) => {
    const hashes = {};
    for (const targetId of targetIds) hashes[targetId] = vm.getCodeStateHash(targetId);
    return hashes;
};

const changedTarget = (expected, actual) => Object.keys(expected || {})
    .find(targetId => expected[targetId] !== actual[targetId]) || null;

const orderFiles = (vm, files) => {
    const order = new Map(vm.runtime.targets.map((target, index) => [target.id, index]));
    const rank = file => {
        const target = vm.runtime.getTargetById(file.targetId);
        if (target && target.isStage) return -1;
        return order.has(file.targetId) ? order.get(file.targetId) : Number.MAX_SAFE_INTEGER;
    };
    return files.slice().sort((a, b) => rank(a) - rank(b));
};

const batchUsers = (diagnostics, built, names) => {
    const removed = removedDeclarations(built).map(entry => entry.name);
    const out = [];
    for (const item of diagnostics || []) {
        const name = item.code === 'FR220' && typeof item.message === 'string' ?
            removed.find(entry => item.message.startsWith(usedByPrefix(entry))) :
            null;
        if (!name) {
            out.push(item);
            continue;
        }
        const outside = item.message.slice(usedByPrefix(name).length)
            .split(', ')
            .filter(user => !names.has(user));
        if (outside.length) out.push({...item, message: `${usedByPrefix(name)}${outside.join(', ')}`});
    }
    return out;
};

const prepareApplyAll = async ({vm, client, files}) => {
    if (isCollaborating(vm)) return {status: 'refused', reason: 'collaboration', message: REFUSAL.collaboration};
    const revision = projectRevision(vm);
    const generation = vm._projectLoadGeneration || 0;
    const ordered = orderFiles(vm, files).map(file => ({...file, name: file.name || targetName(vm, file.targetId)}));
    const builds = await client.buildBatch(vm, ordered.map(file => ({
        targetId: file.targetId,
        text: file.text,
        previous: file.previous,
        lockedScripts: file.lockedScripts,
        verifyRoundTrip: true
    })));
    if (builds.some(built => !built.tag || built.tag.generation !== generation)) {
        return {status: 'refused', reason: 'changed', message: REFUSAL.changed};
    }
    const facts = await factsFor(client, ordered.map(file => file.text));
    const names = new Set(ordered.map(file => file.name));
    const stageIndex = ordered.findIndex(file => {
        const target = vm.runtime.getTargetById(file.targetId);
        return Boolean(target && target.isStage);
    });
    const results = ordered.map((file, index) => {
        const built = builds[index];
        let diagnostics = built.diagnostics;
        if (index === stageIndex) {
            const others = ordered.map((other, at) => ({name: other.name, text: other.text, facts: facts[at]}))
                .filter((other, at) => at !== index);
            const references = otherTextReferences(built, others, {declared: facts[index].declared});
            diagnostics = explainCloudChanges(
                mergeUsedBy(batchUsers(diagnostics, built, names), references, built),
                built
            );
        } else if (stageIndex !== -1) {
            diagnostics = diagnostics.concat(movesToSprite(builds[stageIndex], built));
        }
        return {
            targetId: file.targetId,
            name: file.name,
            snapshot: file.text,
            previous: file.previous,
            lockedScripts: file.lockedScripts,
            built,
            diagnostics,
            baseline: {
                targetId: file.targetId,
                projectRevision: revision,
                generation,
                changeKey: built.tag.changeKey
            }
        };
    });
    if (results.some(result => hasErrorDiagnostics(result.diagnostics))) {
        return {status: 'invalid', files: results};
    }
    for (const result of results) {
        result.impact = computeImpact(vm, result.targetId, result.built, {
            previousText: result.previous ? result.previous.text : '',
            text: result.snapshot
        });
    }
    const confirm = results.filter(result => result.impact.needsConfirm);
    return {
        status: 'ready',
        files: results,
        impact: {
            needsConfirm: confirm.length > 0,
            files: confirm.map(result => ({targetId: result.targetId, name: result.name, impact: result.impact}))
        }
    };
};

const errorMessage = diagnostics => {
    const first = (diagnostics || []).find(item => item.severity === 'error');
    return first ? first.message : REFUSAL.changed;
};

const runApplyAll = async (vm, client, plan) => {
    const steps = [];
    const held = [];
    let stageFile = null;
    const built = {};
    const generation = vm._projectLoadGeneration || 0;
    try {
        for (const file of plan.files) {
            const target = vm.runtime.getTargetById(file.targetId);
            if (!target || !target.isOriginal) throw new ApplyAllFailure(file, REFUSAL.changed);
            let current = file.built;
            if (liveChangeKey(vm, file.targetId) !== file.baseline.changeKey) {
                current = await client.build(vm, file.targetId, file.snapshot, {
                    previous: file.previous,
                    lockedScripts: file.lockedScripts,
                    verifyRoundTrip: true
                });
                if (!current.tag || current.tag.generation !== generation) {
                    throw new ApplyAllFailure(file, REFUSAL.changed);
                }
                if (hasErrorDiagnostics(current.diagnostics)) {
                    throw new ApplyAllFailure(file, errorMessage(current.diagnostics), current.diagnostics);
                }
            }
            if (isCollaborating(vm)) throw new CodeRefusal('collaboration');
            if (liveChangeKey(vm, file.targetId) !== current.tag.changeKey) {
                throw new ApplyAllFailure(file, REFUSAL.changed);
            }
            let change = current.change;
            if (target.isStage) {
                const variables = change.variables || {};
                held.push(...(variables.delete || []));
                change = {...change, variables: {...variables, delete: []}};
                stageFile = file;
            }
            try {
                steps.push(vm.replaceTargetScripts(file.targetId, change).previous);
            } catch (error) {
                throw error && error.name === 'CodeApplyError' ? new ApplyAllFailure(file, error.message) : error;
            }
            built[file.targetId] = current;
        }
        if (held.length && stageFile) {
            const stage = vm.runtime.getTargetById(stageFile.targetId);
            try {
                steps.push(vm.replaceTargetScripts(stage.id, keepEverything(stage, {delete: held})).previous);
            } catch (error) {
                throw error && error.name === 'CodeApplyError' ? new ApplyAllFailure(stageFile, error.message) : error;
            }
        }
    } catch (error) {
        rollbackSteps(vm, steps);
        throw error;
    }
    return {steps, built};
};

const commitApplyAll = async (plan, {vm, client, confirmImpact, confirmBackupFailure, title}) => {
    if (plan.impact && plan.impact.needsConfirm) {
        const accepted = confirmImpact ? await confirmImpact(plan.impact) : false;
        if (!accepted) return {status: 'cancelled', reason: 'cancelled', message: REFUSAL.cancelled};
    }
    const targetIds = plan.files.map(file => file.targetId);
    try {
        const {steps, built} = await withWaitingOperation(vm, async () => {
            flushBlockly(vm);
            for (const file of plan.files) refuseIfStale(vm, file.baseline);
            await ensureSessionBackup(vm, {title, confirmBackupFailure, baseline: plan.files[0].baseline});
            flushBlockly(vm);
            for (const file of plan.files) refuseIfStale(vm, file.baseline);
            try {
                return await runApplyAll(vm, client, plan);
            } finally {
                emitWorkspaceIfAttached(vm, targetIds);
            }
        });
        const entry = pushCodeGroup({targetIds, steps, afterHash: groupHashes(vm, targetIds)});
        return {
            status: 'committed',
            entry,
            files: plan.files.map(file => ({
                targetId: file.targetId,
                built: built[file.targetId],
                commitKey: liveChangeKey(vm, file.targetId)
            }))
        };
    } catch (error) {
        try {
            return refusalResult(error);
        } catch (unknown) {
            log.warn('Apply all failed', unknown);
            return {
                status: 'refused',
                reason: 'error',
                message: (unknown && unknown.message) || String(unknown)
            };
        }
    }
};

const undoGroup = (vm, entry) => commitChange(vm, {
    targetId: entry.targetIds,
    backup: false,
    check: () => {
        const actual = groupHashes(vm, entry.targetIds);
        if (!canUndoExactly(entry, actual)) {
            throw new CodeRefusal('blocksChanged', null, changedTarget(entry.afterHash, actual));
        }
    },
    run: () => {
        const redo = restoreSteps(vm, entry.steps.slice().reverse());
        const cleanup = removeCreatedStageVariables(vm, entry.steps);
        if (cleanup) redo.push(cleanup);
        return redo.reverse();
    }
});

const redoGroup = (vm, entry) => commitChange(vm, {
    targetId: entry.targetIds,
    backup: false,
    check: () => {
        const actual = groupHashes(vm, entry.targetIds);
        if (!canRedoExactly(entry, actual)) {
            throw new CodeRefusal('redoChanged', null, changedTarget(entry.redo.hash, actual));
        }
    },
    run: () => {
        const steps = restoreSteps(vm, entry.redo.steps);
        const cleanup = removeCreatedStageVariables(vm, entry.redo.steps);
        if (cleanup) steps.push(cleanup);
        return steps;
    }
});

const entryHash = (vm, entry) => (entry.kind === 'group' ?
    groupHashes(vm, entry.targetIds) :
    vm.getCodeStateHash(entry.targetId));

const undoCodeApply = async ({vm, targetId = null, entry = latestUndo(targetId)}) => {
    if (!entry) return {status: 'empty'};
    if (isCollaborating(vm)) return {status: 'refused', reason: 'collaboration', message: REFUSAL.collaboration};
    flushBlockly(vm);
    try {
        const redo = entry.kind === 'group' ? await undoGroup(vm, entry) : await commitChange(vm, {
            targetId: entry.targetId,
            backup: false,
            check: () => {
                if (!canUndoExactly(entry, vm.getCodeStateHash(entry.targetId))) {
                    throw new CodeRefusal('blocksChanged');
                }
            },
            run: () => runRestores(vm, entry.targetId, entry.steps.slice().reverse()).reverse()
        });
        markUndone(entry, redo, entryHash(vm, entry));
        return {status: 'committed', entry};
    } catch (error) {
        return {...refusalResult(error), entry};
    }
};

const redoCodeApply = async ({vm, targetId = null, entry = latestRedo(targetId)}) => {
    if (!entry) return {status: 'empty'};
    if (isCollaborating(vm)) return {status: 'refused', reason: 'collaboration', message: REFUSAL.collaboration};
    flushBlockly(vm);
    try {
        const steps = entry.kind === 'group' ? await redoGroup(vm, entry) : await commitChange(vm, {
            targetId: entry.targetId,
            backup: false,
            check: () => {
                if (!canRedoExactly(entry, vm.getCodeStateHash(entry.targetId))) {
                    throw new CodeRefusal('redoChanged');
                }
            },
            run: () => runRestores(vm, entry.targetId, entry.redo.steps)
        });
        markRedone(entry, steps, entryHash(vm, entry));
        return {status: 'committed', entry};
    } catch (error) {
        return {...refusalResult(error), entry};
    }
};

export {
    CodeRefusal,
    REFUSAL,
    blocksAttached,
    commitApply,
    commitApplyAll,
    commitChange,
    commitSync,
    computeImpact,
    createsOrRemoves,
    flushBlockly,
    hasSessionBackup,
    isCollaborating,
    liveChangeKey,
    otherTextReferences,
    prepareApply,
    prepareApplyAll,
    redoCodeApply,
    undoCodeApply,
    withWaitingOperation
};
