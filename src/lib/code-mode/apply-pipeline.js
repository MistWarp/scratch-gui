import LazyScratchBlocks from '../tw-lazy-scratch-blocks.js';
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
    pushCodeApply
} from './code-history.js';
import {hasErrorDiagnostics} from './fractch-adapter.js';

const REFUSAL = {
    collaboration: 'Editing code is unavailable during collaboration',
    changed: 'The project changed while applying, try again',
    blocksChanged: 'Blocks changed since this apply, so it can\'t be undone here',
    redoChanged: 'Blocks changed since this undo, so it can\'t be redone here',
    cancelled: 'Apply cancelled',
    backup: 'The backup failed, so nothing was applied'
};

class CodeRefusal extends Error {
    constructor (reason, message) {
        super(message || REFUSAL[reason] || reason);
        this.name = 'CodeRefusal';
        this.reason = reason;
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
    if (!blocksAttached(vm)) return false;
    if (!vm.editingTarget || vm.editingTarget.id !== targetId) return false;
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

const IDENTIFIER = name => new RegExp(`(^|[^\\w$])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w$])`);

const otherTextReferences = (built, otherTexts) => {
    const diagnostics = [];
    const removed = ((built.removed && built.removed.variables) || [])
        .concat((built.removed && built.removed.lists) || []);
    for (const entry of removed) {
        const pattern = IDENTIFIER(entry.name);
        const users = (otherTexts || []).filter(other => pattern.test(other.text)).map(other => other.name);
        if (!users.length) continue;
        diagnostics.push({
            severity: 'error',
            code: 'FR220',
            message: `${entry.name} is used by ${users.join(', ')}`,
            hint: 'put the declaration back, or apply the other file first',
            line: 1,
            column: 1,
            endLine: 1,
            endColumn: 1
        });
    }
    return diagnostics;
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
    const diagnostics = built.diagnostics.concat(otherTextReferences(built, otherTexts));
    if (hasErrorDiagnostics(diagnostics)) return {status: 'invalid', diagnostics, built, baseline};
    const impact = computeImpact(vm, targetId, built, {previousText: previous ? previous.text : '', text});
    return {status: 'ready', diagnostics, built, change: built.change, impact, baseline, snapshot: text};
};

const refusalResult = error => {
    if (error instanceof CodeRefusal) return {status: 'refused', reason: error.reason, message: error.message};
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

const runRestores = (vm, targetId, steps) => {
    const done = [];
    try {
        for (const step of steps) done.push(vm.replaceTargetScripts(targetId, {restore: step}).previous);
    } catch (error) {
        for (const step of done.slice().reverse()) {
            vm.replaceTargetScripts(targetId, {restore: step});
        }
        throw error;
    }
    return done;
};

const undoCodeApply = async ({vm, targetId = null, entry = latestUndo(targetId)}) => {
    if (!entry) return {status: 'empty'};
    if (isCollaborating(vm)) return {status: 'refused', reason: 'collaboration', message: REFUSAL.collaboration};
    flushBlockly(vm);
    try {
        const redo = await commitChange(vm, {
            targetId: entry.targetId,
            backup: false,
            check: () => {
                if (!canUndoExactly(entry, vm.getCodeStateHash(entry.targetId))) {
                    throw new CodeRefusal('blocksChanged');
                }
            },
            run: () => runRestores(vm, entry.targetId, entry.steps.slice().reverse()).reverse()
        });
        markUndone(entry, redo, vm.getCodeStateHash(entry.targetId));
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
        const steps = await commitChange(vm, {
            targetId: entry.targetId,
            backup: false,
            check: () => {
                if (!canRedoExactly(entry, vm.getCodeStateHash(entry.targetId))) {
                    throw new CodeRefusal('redoChanged');
                }
            },
            run: () => runRestores(vm, entry.targetId, entry.redo.steps)
        });
        markRedone(entry, steps, vm.getCodeStateHash(entry.targetId));
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
    redoCodeApply,
    undoCodeApply,
    withWaitingOperation
};
