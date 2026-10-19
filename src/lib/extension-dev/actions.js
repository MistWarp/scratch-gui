import {revealInCode} from '../../reducers/editor-tab.js';
import {
    addExtensionOutput,
    clearExtensionOutput,
    clearRuntimeProblems,
    setLoadProblems,
    setStaticProblems
} from '../../reducers/extension-dev.js';
import {applyExtensionSource, extensionConfirm} from '../code-mode/extension-apply.js';
import {clearExtensionHistory} from '../code-mode/code-history.js';
import {prepareProjectReplacement} from '../project-replacement.js';
import {allowUnsandboxedExtensionCreation} from '../../containers/tw-security-manager.jsx';
import AddonHooks from '../../addons/hooks.js';
import {clearDraft, getEntries, markAuthored} from './session.js';

let outputCounter = 0;

const outputEntry = (extensionId, level, text, extra) => ({
    id: ++outputCounter,
    extensionId,
    level,
    text,
    time: Date.now(),
    ...extra
});

const openExtension = (dispatch, id) => {
    dispatch(revealInCode(id ? {kind: 'extension', id} : {kind: 'extensions'}));
};

const openExtensionAt = (dispatch, id, location) => {
    dispatch(revealInCode({kind: 'extension', id, location}));
};

const openRemoveExtensions = (dispatch, ids) => {
    dispatch(revealInCode({kind: 'removeExtensions', ids}));
};

const openNewExtension = (dispatch, source) => {
    dispatch(revealInCode({kind: 'newExtension', source: typeof source === 'string' ? source : null}));
};

const diagnosticsFromError = error => {
    if (error && Array.isArray(error.diagnostics) && error.diagnostics.length) {
        return error.diagnostics.map(item => ({
            severity: item.severity || 'error',
            kind: item.kind || 'load',
            code: item.kind || 'load',
            message: item.message,
            line: item.line || null,
            column: item.column || null
        }));
    }
    return [{
        severity: 'error',
        kind: 'load',
        code: 'load',
        message: (error && error.message) || String(error),
        line: null,
        column: null
    }];
};

const applySource = async ({vm, dispatch, entry, source, keepURL, intl, messages, confirm = null, auto = false}) => {
    try {
        const result = await applyExtensionSource({vm, id: entry.id, source, keepURL, confirm, auto});
        if (!keepURL) markAuthored(entry.id);
        dispatch(clearRuntimeProblems(entry.id));
        const outputs = [outputEntry(entry.id, 'info', intl.formatMessage(messages.outputApplied, {name: entry.name}))];
        if (result && Array.isArray(result.removed) && result.removed.length) {
            outputs.push(outputEntry(entry.id, 'warning', intl.formatMessage(messages.outputRemovedBlocks, {
                opcodes: result.removed.join(', ')
            })));
        }
        dispatch(addExtensionOutput(outputs));
        if (vm.runtime && typeof vm.runtime.emitProjectChanged === 'function') vm.runtime.emitProjectChanged();
        return {ok: true, result, diagnostics: []};
    } catch (error) {
        const diagnostics = diagnosticsFromError(error);
        dispatch(addExtensionOutput([outputEntry(entry.id, 'error', intl.formatMessage(messages.outputApplyFailed, {
            name: entry.name,
            message: diagnostics[0].message
        }))]));
        return {ok: false, error, diagnostics};
    }
};

const reloadEntry = async ({vm, dispatch, entry, intl, messages, confirm}) => {
    const manager = vm.extensionManager;
    const source = await manager.getExtensionSource(entry.id, {fresh: true});
    if (typeof source !== 'string') return {ok: false, diagnostics: []};
    const outcome = await applySource({
        vm,
        dispatch,
        entry,
        source,
        keepURL: entry.kind === 'url',
        intl,
        messages,
        confirm
    });
    dispatch(setLoadProblems(entry.id, outcome.ok ? [] : outcome.diagnostics));
    return {...outcome, source};
};

const convertEntry = async ({vm, dispatch, entry, intl, messages}) => {
    await vm.extensionManager.convertToEmbedded(entry.id);
    markAuthored(entry.id);
    dispatch(addExtensionOutput([outputEntry(entry.id, 'info', intl.formatMessage(messages.outputConverted, {
        name: entry.name
    }))]));
    if (vm.runtime && typeof vm.runtime.emitProjectChanged === 'function') vm.runtime.emitProjectChanged();
};

const describeCreateError = (intl, messages, error) => {
    const first = diagnosticsFromError(error)[0];
    const where = first.line ? ` (${intl.formatMessage(messages.lineColumn, {
        line: first.line,
        column: first.column || 1
    })})` : '';
    return new Error(`${first.message}${where}`);
};

const createExtensionFromSource = async ({vm, dispatch, intl, messages, source, unsandboxed}) => {
    if (unsandboxed) allowUnsandboxedExtensionCreation();
    let ids;
    try {
        ids = await vm.extensionManager.createExtension(source, {unsandboxed});
    } catch (error) {
        throw describeCreateError(intl, messages, error);
    }
    for (const id of ids) markAuthored(id);
    const created = getEntries(vm).find(item => item.id === ids[0]);
    dispatch(addExtensionOutput([outputEntry(ids[0], 'info', intl.formatMessage(messages.outputCreated, {
        name: created ? created.name : ids[0]
    }))]));
    if (vm.runtime && typeof vm.runtime.emitProjectChanged === 'function') vm.runtime.emitProjectChanged();
    return ids;
};

const removeExtensionsFromProject = async ({vm, dispatch, intl, messages, ids, projectTitle}) => {
    const entries = getEntries(vm);
    const names = ids.map(id => (entries.find(entry => entry.id === id) || {name: id}).name);
    const rollback = await prepareProjectReplacement(vm, projectTitle || names.join(', '));
    try {
        vm.removeExtensionFromProject(ids);
    } catch (error) {
        try {
            await rollback();
        } catch (restoreError) {
            console.error(restoreError);
        }
        throw error;
    }
    for (const id of ids) {
        clearDraft(id);
        clearExtensionHistory(id);
        dispatch(setStaticProblems(id, []));
        dispatch(setLoadProblems(id, []));
        dispatch(clearExtensionOutput(id));
    }
    dispatch(addExtensionOutput(names.map((name, index) => outputEntry(ids[index], 'info',
        intl.formatMessage(messages.outputRemoved, {name})))));
    const workspace = AddonHooks.blocklyWorkspace;
    setTimeout(() => {
        if (workspace && typeof workspace.clearUndo === 'function') workspace.clearUndo();
    });
};

const runUnsandboxed = async ({vm, dispatch, intl, messages, entry, fileName, confirm}) => {
    const manager = vm.extensionManager;
    const source = await manager.getExtensionSource(entry.id);
    if (typeof source !== 'string') return false;
    const allowed = await manager.requestUnsandboxedAllowance(entry.id, source, fileName || `${entry.id}.js`);
    if (!allowed) return false;
    clearExtensionHistory(entry.id);
    try {
        await manager.reloadExtension(entry.id, source, {mode: 'unsandboxed', confirm: extensionConfirm(vm, confirm)});
    } catch (error) {
        dispatch(addExtensionOutput([outputEntry(entry.id, 'error', intl.formatMessage(messages.outputApplyFailed, {
            name: entry.name,
            message: diagnosticsFromError(error)[0].message
        }))]));
        return false;
    }
    dispatch(clearRuntimeProblems(entry.id));
    dispatch(addExtensionOutput([outputEntry(entry.id, 'info', intl.formatMessage(messages.outputUnsandboxed, {
        name: entry.name
    }))]));
    if (vm.runtime && typeof vm.runtime.emitProjectChanged === 'function') vm.runtime.emitProjectChanged();
    return true;
};

export {
    applySource,
    convertEntry,
    createExtensionFromSource,
    diagnosticsFromError,
    openExtension,
    openExtensionAt,
    openNewExtension,
    openRemoveExtensions,
    outputEntry,
    reloadEntry,
    removeExtensionsFromProject,
    runUnsandboxed
};
