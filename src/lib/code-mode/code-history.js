import {clearWorkspaceRedo, nextUndoSequence, onBlockEdit, onDeletionRecorded} from '../undo-history.js';

const MAX_ENTRIES = 50;
const BUDGET = 200000;
const AUTO_MERGE_MS = 2000;

let entries = [];
let undoClock = 0;
let lastEvent = null;
const listeners = new Set();

const notify = () => {
    for (const listener of Array.from(listeners)) listener();
};

const subscribeCodeHistory = listener => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

const valueUnits = value => {
    if (Array.isArray(value)) {
        let units = value.length;
        for (let i = 0; i < value.length && units <= BUDGET; i++) {
            if (typeof value[i] === 'string') units += Math.floor(value[i].length / 100);
        }
        return units;
    }
    if (typeof value === 'string') return 1 + Math.floor(value.length / 100);
    return 1;
};

const stepUnits = step => {
    if (!step) return 0;
    let units = 0;
    for (const script of Object.values(step.scripts || {})) units += Object.keys(script).length;
    for (const value of Object.values(step.values || {})) units += valueUnits(value);
    for (const declaration of step.declarations || []) {
        if (declaration.deleted && declaration.variable) units += valueUnits(declaration.variable.value);
        else units += 1;
    }
    units += Object.keys(step.comments || {}).length;
    return units;
};

const entryUnits = entry => {
    if (entry.kind === 'extension') return valueUnits(entry.before) + valueUnits(entry.after);
    return entry.steps.concat(entry.redo ? entry.redo.steps : []).reduce((sum, step) => sum + stepUnits(step), 0);
};

const enforceLimits = newest => {
    entries.sort((a, b) => a.sequence - b.sequence);
    let total = entries.reduce((sum, entry) => sum + entry.units, 0);
    while (entries.length > 1 && (entries.length > MAX_ENTRIES || total > BUDGET)) {
        const index = entries[0] === newest ? 1 : 0;
        if (index >= entries.length) break;
        total -= entries[index].units;
        entries.splice(index, 1);
    }
};

const clearRedoFor = targetId => {
    const before = entries.length;
    entries = entries.filter(entry => !entry.redo || (targetId && entry.targetId !== targetId));
    return entries.length !== before;
};

const extensionStateKey = (mode, source) => `${mode || ''}\n${typeof source === 'string' ? source : ''}`;

const pushExtensionApply = ({extensionId, before, after, mode, keepURL = false, auto = false, now = Date.now()}) => {
    entries = entries.filter(entry => !entry.redo || entry.extensionId !== extensionId);
    clearWorkspaceRedo();
    const afterHash = extensionStateKey(mode, after);
    const last = entries.filter(entry => !entry.redo).sort((a, b) => b.sequence - a.sequence)[0];
    if (auto && last && last.auto && last.extensionId === extensionId && last.after === before &&
        last.mode === mode && now - last.time <= AUTO_MERGE_MS) {
        last.after = after;
        last.afterHash = afterHash;
        last.time = now;
        last.units = entryUnits(last);
        enforceLimits(last);
        notify();
        return last;
    }
    const entry = {
        kind: 'extension',
        extensionId,
        targetId: null,
        sequence: nextUndoSequence(),
        steps: [],
        before,
        after,
        mode,
        keepURL,
        afterHash,
        auto,
        label: null,
        time: now,
        redo: null,
        units: 0
    };
    entry.units = entryUnits(entry);
    entries.push(entry);
    enforceLimits(entry);
    notify();
    return entry;
};

const clearExtensionHistory = extensionId => {
    const before = entries.length;
    entries = entries.filter(entry => entry.extensionId !== extensionId);
    if (entries.length !== before) notify();
};

const pushCodeApply = ({targetId, previous, afterHash, auto = false, label = null, now = Date.now()}) => {
    clearRedoFor(targetId);
    clearWorkspaceRedo();
    const last = entries.filter(entry => !entry.redo).sort((a, b) => b.sequence - a.sequence)[0];
    if (auto && last && last.auto && last.targetId === targetId && now - last.time <= AUTO_MERGE_MS) {
        last.steps.push(previous);
        last.afterHash = afterHash;
        last.time = now;
        last.units = entryUnits(last);
        enforceLimits(last);
        notify();
        return last;
    }
    const entry = {
        targetId,
        sequence: nextUndoSequence(),
        steps: [previous],
        afterHash,
        auto,
        label,
        time: now,
        redo: null,
        units: 0
    };
    entry.units = entryUnits(entry);
    entries.push(entry);
    enforceLimits(entry);
    notify();
    return entry;
};

const latestUndo = targetId => entries
    .filter(entry => !entry.redo && (!targetId || entry.targetId === targetId))
    .sort((a, b) => b.sequence - a.sequence)[0] || null;

const latestRedo = targetId => entries
    .filter(entry => entry.redo && (!targetId || entry.targetId === targetId))
    .sort((a, b) => b.redo.clock - a.redo.clock)[0] || null;

const canUndoExactly = (entry, hash) => Boolean(entry) && !entry.redo && entry.afterHash === hash;

const canRedoExactly = (entry, hash) => Boolean(entry && entry.redo) && entry.redo.hash === hash;

const markUndone = (entry, redoSteps, hash) => {
    entry.redo = {steps: redoSteps, hash, clock: ++undoClock};
    entry.units = entryUnits(entry);
    lastEvent = {kind: 'undo', targetId: entry.targetId, clock: undoClock};
    enforceLimits(entry);
    notify();
};

const markRedone = (entry, steps, hash) => {
    entry.steps = steps;
    entry.afterHash = hash;
    entry.redo = null;
    entry.sequence = nextUndoSequence();
    entry.units = entryUnits(entry);
    lastEvent = {kind: 'redo', targetId: entry.targetId, clock: ++undoClock};
    clearWorkspaceRedo();
    enforceLimits(entry);
    notify();
};

const codeHistoryLastEvent = () => lastEvent;

const clearCodeHistory = () => {
    lastEvent = null;
    if (!entries.length) return;
    entries = [];
    notify();
};

const clearCodeRedo = targetId => {
    if (clearRedoFor(targetId)) notify();
};

const codeHistoryEntries = () => entries.slice();

const codeHistoryUnits = () => entries.reduce((sum, entry) => sum + entry.units, 0);

onDeletionRecorded(() => clearCodeRedo(null));
onBlockEdit(targetId => {
    if (targetId) clearCodeRedo(targetId);
});

export {
    AUTO_MERGE_MS,
    BUDGET,
    MAX_ENTRIES,
    canRedoExactly,
    canUndoExactly,
    clearCodeHistory,
    clearCodeRedo,
    clearExtensionHistory,
    codeHistoryEntries,
    codeHistoryLastEvent,
    codeHistoryUnits,
    extensionStateKey,
    latestRedo,
    latestUndo,
    markRedone,
    markUndone,
    pushCodeApply,
    pushExtensionApply,
    stepUnits,
    subscribeCodeHistory
};
