import {getSetting} from './settings.js';
import {getScratchBlocks} from '../../modules/blocks-registry';

const parseArguments = code => code
    .split(/(?=[^\\]%[nbs])/g)
    .map(i => i.trim())
    .filter(i => i.charAt(0) === '%')
    .map(i => i.substring(0, 2));
const fixDisplayName = displayName =>
    displayName.replace(/([^\s])(%[nbs])/g, (_, before, arg) => `${before} ${arg}`);
const compareArrays = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const ZW = '\u200b\u200b';
const BREAKPOINT = `${ZW}breakpoint${ZW}`;
const LOG = `${ZW}log${ZW} %s`;
const WARN = `${ZW}warn${ZW} %s`;
const ERROR = `${ZW}error${ZW} %s`;

const addBlock = (vm, procedureCode, {args, displayName, callback, yields}) => {
    const procCodeArguments = parseArguments(procedureCode);
    if (args.length !== procCodeArguments.length) {
        throw new Error('Procedure code and argument list do not match');
    }
    if (displayName) {
        displayName = fixDisplayName(displayName);
        const displayNameArguments = parseArguments(displayName);
        if (!compareArrays(procCodeArguments, displayNameArguments)) {
            displayName = procedureCode;
        }
    } else {
        displayName = procedureCode;
    }

    vm.addAddonBlock({
        procedureCode,
        arguments: args,
        callback: (a, util) => callback(a, util.thread),
        displayName,
        yields
    });
};

const patchBlockly = () => {
    if (window.__mwDebuggerBlocklyPatched) return;
    const ScratchBlocks = getScratchBlocks();
    if (!ScratchBlocks) {
        setTimeout(patchBlockly, 500);
        return;
    }
    window.__mwDebuggerBlocklyPatched = true;

    const vm = window.vm;
    const BlockSvg = ScratchBlocks.BlockSvg;
    const oldUpdateColour = BlockSvg.prototype.updateColour;
    BlockSvg.prototype.updateColour = function (...args) {
        if (!this.isInsertionMarker() && this.type === 'procedures_call') {
            const block = this.procCode_ && vm && vm.runtime.getAddonBlock(this.procCode_);
            if (block) {
                const theme = window.ReduxStore &&
                    window.ReduxStore.getState().scratchGui.theme.theme;
                const colors = theme && theme.getBlockColors().addons;
                if (colors) {
                    this.colour_ = colors.primary;
                    this.colourSecondary_ = colors.secondary;
                    this.colourTertiary_ = colors.tertiary;
                    this.colourQuaternary_ = colors.quaternary;
                }
                this.customContextMenu = null;
            }
        }
        return oldUpdateColour.call(this, ...args);
    };

    const originalCreateAllInputs = ScratchBlocks.Blocks.procedures_call.createAllInputs_;
    ScratchBlocks.Blocks.procedures_call.createAllInputs_ = function (...args) {
        const block = this.procCode_ && vm && vm.runtime.getAddonBlock(this.procCode_);
        if (block && block.displayName) {
            const originalProcCode = this.procCode_;
            this.procCode_ = block.displayName;
            const ret = originalCreateAllInputs.call(this, ...args);
            this.procCode_ = originalProcCode;
            return ret;
        }
        return originalCreateAllInputs.call(this, ...args);
    };

    if (vm && vm.editingTarget) {
        vm.emitWorkspaceUpdate();
    }
};

const vmsWithDebuggerBlocks = new WeakSet();

const registerDebuggerBlocks = (vm, handlers) => {
    if (vmsWithDebuggerBlocks.has(vm)) return;
    vmsWithDebuggerBlocks.add(vm);

    const {onLog, onBreakpoint, onClearLogs} = handlers;

    addBlock(vm, BREAKPOINT, {
        args: [],
        displayName: 'breakpoint',
        callback: (_, thread) => onBreakpoint(thread)
    });
    // log, warn and error never pause, so they must not make the custom blocks that use them able to pause: projects
    // call them from hot custom blocks, and a block that can pause is compiled as a much slower generator.
    addBlock(vm, LOG, {
        args: ['content'],
        displayName: 'log %s',
        yields: false,
        callback: ({content}, thread) => onLog(content, thread, 'log')
    });
    addBlock(vm, WARN, {
        args: ['content'],
        displayName: 'warn %s',
        yields: false,
        callback: ({content}, thread) => onLog(content, thread, 'warn')
    });
    addBlock(vm, ERROR, {
        args: ['content'],
        displayName: 'error %s',
        yields: false,
        callback: ({content}, thread) => onLog(content, thread, 'error')
    });

    patchBlockly();

    vm.runtime.on('PROJECT_START', () => {
        if (getSetting('log_clear_greenflag')) {
            onClearLogs();
        }
        if (getSetting('log_greenflag')) {
            onLog('Green flag clicked', null, 'internal');
        }
    });

    vm.runtime.on('HATS_STARTED', (hat, matchFields) => {
        if (hat === 'event_whenbroadcastreceived' && getSetting('log_broadcasts')) {
            onLog(
                `Broadcasted "${matchFields.BROADCAST_OPTION}"`,
                vm.runtime.sequencer.activeThread,
                'internal'
            );
        }
    });

    vm.runtime.on('CLONE_LIMIT_REACHED', target => {
        if (getSetting('log_failed_clone_creation')) {
            onLog(
                `Failed to create clone of "${target.getName()}" because there are too many clones`,
                vm.runtime.sequencer.activeThread,
                'internal-warn'
            );
        }
    });

    vm.runtime.on('targetWasCreated', (target, original) => {
        if (original && !target.isOriginal && getSetting('log_clone_create')) {
            onLog(
                `Created clone of "${original.getName()}"`,
                vm.runtime.sequencer.activeThread,
                'internal'
            );
        }
    });
};

export default registerDebuggerBlocks;
