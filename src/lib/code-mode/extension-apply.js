import {
    canRedoExactly,
    canUndoExactly,
    extensionStateKey,
    markRedone,
    markUndone,
    pushExtensionApply
} from './code-history.js';

const REFUSAL = {
    collaboration: 'Editing extensions is unavailable during collaboration',
    extensionChanged: 'The extension changed since this apply, so it can\'t be undone here',
    extensionRedoChanged: 'The extension changed since this undo, so it can\'t be redone here'
};

const isCollaborating = vm => Boolean(vm && vm.editingCommands && vm.editingCommands.handler);

const placeholders = text => {
    const names = [];
    for (const part of [].concat(text || [])) {
        for (const match of String(part).matchAll(/\[([^\]\s]+)\]/g)) {
            if (!names.includes(match[1])) names.push(match[1]);
        }
    }
    return names;
};

const argumentShape = info => {
    if (!info) return '';
    const args = info.arguments && typeof info.arguments === 'object' ? info.arguments : {};
    const order = placeholders(info.text).filter(name => Object.prototype.hasOwnProperty.call(args, name));
    for (const name of Object.keys(args)) if (!order.includes(name)) order.push(name);
    return order.join(',');
};

const opcodeUsage = vm => {
    const usage = new Map();
    for (const target of vm.runtime.targets) {
        if (!target.isOriginal) continue;
        for (const block of Object.values(target.blocks._blocks)) {
            let entry = usage.get(block.opcode);
            if (!entry) {
                entry = {blocks: 0, targets: new Set()};
                usage.set(block.opcode, entry);
            }
            entry.blocks++;
            entry.targets.add(target.isStage ? 'Stage' : target.getName());
        }
    }
    return usage;
};

const labelOf = opcode => {
    const index = opcode.indexOf('_');
    return index === -1 ? opcode : `${opcode.slice(0, index)}.${opcode.slice(index + 1)}`;
};

const extensionImpact = (vm, diff) => {
    const usage = opcodeUsage(vm);
    const items = [];
    for (const opcode of (diff && diff.removed) || []) {
        const used = usage.get(opcode);
        if (!used) continue;
        items.push({
            opcode,
            label: labelOf(opcode),
            kind: 'removed',
            blocks: used.blocks,
            targets: Array.from(used.targets)
        });
    }
    for (const opcode of (diff && diff.changed) || []) {
        const used = usage.get(opcode);
        const detail = diff.details && diff.details[opcode];
        if (!used || !detail || argumentShape(detail.before) === argumentShape(detail.after)) continue;
        items.push({
            opcode,
            label: labelOf(opcode),
            kind: 'changed',
            blocks: used.blocks,
            targets: Array.from(used.targets)
        });
    }
    return items;
};

const gate = (vm, confirm) => async diff => {
    const impact = extensionImpact(vm, diff);
    if (!impact.length) return true;
    return confirm ? (await confirm(impact)) === true : false;
};

const readSource = async (vm, id) => {
    try {
        const source = await vm.extensionManager.getExtensionSource(id);
        return typeof source === 'string' ? source.replace(/\r\n?/g, '\n') : null;
    } catch (e) {
        return null;
    }
};

const liveState = async (vm, id) => {
    const source = await readSource(vm, id);
    return extensionStateKey(vm.extensionManager.getExtensionMode(id), source);
};

const applyExtensionSource = async ({vm, id, source, keepURL = false, confirm = null, auto = false}) => {
    if (isCollaborating(vm)) throw new Error(REFUSAL.collaboration);
    const before = await readSource(vm, id);
    const options = {confirm: gate(vm, confirm)};
    if (keepURL) options.keepURL = true;
    const result = await vm.extensionManager.reloadExtension(id, source, options);
    if (typeof before === 'string' && before !== source) {
        pushExtensionApply({
            extensionId: id,
            before,
            after: source,
            mode: vm.extensionManager.getExtensionMode(id),
            keepURL,
            auto
        });
    }
    return result;
};

const refused = (reason, entry, message) => ({status: 'refused', reason, message: message || REFUSAL[reason], entry});

const runExtensionHistory = async ({vm, entry, direction, confirm}) => {
    if (isCollaborating(vm)) return refused('collaboration', entry);
    const state = await liveState(vm, entry.extensionId);
    const undo = direction === 'undo';
    if (undo ? !canUndoExactly(entry, state) : !canRedoExactly(entry, state)) {
        return refused(undo ? 'extensionChanged' : 'extensionRedoChanged', entry);
    }
    const source = undo ? entry.before : entry.after;
    const options = {confirm: gate(vm, confirm)};
    if (entry.keepURL) options.keepURL = true;
    try {
        await vm.extensionManager.reloadExtension(entry.extensionId, source, options);
    } catch (error) {
        return refused('invalid', entry, (error && error.message) || String(error));
    }
    const hash = extensionStateKey(vm.extensionManager.getExtensionMode(entry.extensionId), source);
    if (undo) markUndone(entry, [], hash);
    else markRedone(entry, [], hash);
    return {status: 'committed', entry};
};

const undoExtensionApply = options => runExtensionHistory({...options, direction: 'undo'});

const redoExtensionApply = options => runExtensionHistory({...options, direction: 'redo'});

export {
    REFUSAL as EXTENSION_REFUSAL,
    applyExtensionSource,
    argumentShape,
    gate as extensionConfirm,
    extensionImpact,
    redoExtensionApply,
    undoExtensionApply
};
