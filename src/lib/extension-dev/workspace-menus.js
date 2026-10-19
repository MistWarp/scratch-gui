import {
    AlertTriangle,
    Code2,
    Eye,
    FileCode2,
    FileInput,
    Pencil,
    RefreshCw,
    Trash2
} from 'lucide-react';

import messages from '../../components/extension-dev/messages.js';
import codeMessages from '../../components/code-mode/messages.js';
import {revealInCode} from '../../reducers/editor-tab.js';
import {convertEntry, openExtension, openExtensionAt, openRemoveExtensions, reloadEntry} from './actions.js';
import {getEntries} from './session.js';

const findEntry = (vm, id) => getEntries(vm).find(entry => entry.id === id) || null;

const extensionIdForOpcode = (vm, opcode) => {
    if (typeof opcode !== 'string') return null;
    const manager = vm.extensionManager;
    let best = null;
    for (let index = opcode.indexOf('_'); index > 0; index = opcode.indexOf('_', index + 1)) {
        const id = opcode.slice(0, index);
        if (manager.isCoreExtension && manager.isCoreExtension(id)) return null;
        if (manager.isExtensionLoaded(id) || (manager.isExtensionUnloaded && manager.isExtensionUnloaded(id))) {
            best = id;
        }
    }
    return best;
};

const categoryItems = (context, categoryId) => {
    const {vm, intl, dispatch, collaborating, readOnly} = context;
    const manager = vm.extensionManager;
    if (!manager.isExtensionLoaded(categoryId) || (manager.isCoreExtension && manager.isCoreExtension(categoryId))) {
        return [];
    }
    const entry = findEntry(vm, categoryId);
    if (!entry) return [];
    const disabled = collaborating || readOnly;
    const items = [];
    if (entry.kind === 'builtin') {
        items.push({
            text: intl.formatMessage(messages.viewSource),
            icon: Eye,
            enabled: true,
            callback: () => openExtension(dispatch, entry.id)
        });
    } else {
        items.push({
            text: intl.formatMessage(entry.kind === 'url' ? messages.viewSource : messages.editExtension),
            icon: entry.kind === 'url' ? Eye : Pencil,
            enabled: true,
            callback: () => openExtension(dispatch, entry.id)
        });
        items.push({
            text: intl.formatMessage(messages.reloadExtension),
            icon: RefreshCw,
            enabled: !disabled,
            callback: () => {
                reloadEntry({vm, dispatch, entry, intl, messages}).then(outcome => {
                    if (!outcome.ok) openExtension(dispatch, entry.id);
                });
            }
        });
        if (entry.kind === 'url') {
            items.push({
                text: intl.formatMessage(messages.convert),
                icon: FileInput,
                enabled: !disabled,
                callback: () => {
                    convertEntry({vm, dispatch, entry, intl, messages}).catch(error => {
                        console.error(error);
                        openExtension(dispatch, entry.id);
                    });
                }
            });
        }
    }
    items.push({
        text: intl.formatMessage(messages.remove),
        icon: Trash2,
        enabled: !disabled,
        callback: () => openRemoveExtensions(dispatch, [entry.id])
    });
    return items;
};

const problemForBlock = (context, extensionId, blockId) => {
    const list = context.runtimeProblems[extensionId] || [];
    return list.find(problem => problem.blockId === blockId) || null;
};

const blockItems = (context, block) => {
    const {vm, intl, dispatch} = context;
    const extensionId = extensionIdForOpcode(vm, block.type);
    if (!extensionId) return [];
    const opcode = block.type.slice(extensionId.length + 1);
    const entry = findEntry(vm, extensionId);
    const items = [];
    if (entry && entry.kind !== 'builtin') {
        items.push({
            text: intl.formatMessage(messages.goToDefinition),
            icon: Code2,
            enabled: true,
            callback: () => openExtensionAt(dispatch, extensionId, {opcode})
        });
    }
    const problem = problemForBlock(context, extensionId, block.id);
    if (problem) {
        items.push({
            text: intl.formatMessage(messages.showProblem),
            icon: AlertTriangle,
            enabled: true,
            callback: () => openExtensionAt(dispatch, extensionId, problem.line ?
                {line: problem.line, column: problem.column} :
                {opcode})
        });
    }
    return items;
};

const codeItems = (context, block) => {
    const {vm, intl, dispatch} = context;
    if (!block || !block.workspace || block.workspace.isFlyout || !vm.editingTarget || !block.id) return [];
    const targetId = vm.editingTarget.id;
    return [{
        text: intl.formatMessage(codeMessages.showInCode),
        icon: FileCode2,
        enabled: true,
        callback: () => dispatch(revealInCode({kind: 'block', targetId, id: block.id}))
    }];
};

let currentGetContext = null;

const installBlockMenu = (ScratchBlocks, getContext) => {
    currentGetContext = getContext;
    const ContextMenu = ScratchBlocks && ScratchBlocks.ContextMenu;
    if (!ContextMenu || ContextMenu.mwExtensionDevInstalled) return;
    ContextMenu.mwExtensionDevInstalled = true;
    const original = ContextMenu.show;
    ContextMenu.show = function (event, items, rtl) {
        let nextItems = items;
        try {
            const workspace = ScratchBlocks.mainWorkspace;
            const gesture = workspace && workspace.currentGesture_;
            const block = gesture && gesture.targetBlock_;
            if (block && !gesture.startBubble_) {
                const context = currentGetContext ? currentGetContext() : null;
                const extra = context ? codeItems(context, block).concat(blockItems(context, block)) : [];
                if (extra.length) {
                    extra[0] = {...extra[0], separator: true};
                    nextItems = items.concat(extra);
                }
            }
        } catch (e) {
            console.error(e);
        }
        return original.call(this, event, nextItems, rtl);
    };
};

export {blockItems, categoryItems, codeItems, extensionIdForOpcode, installBlockMenu};
