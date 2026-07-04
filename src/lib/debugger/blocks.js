import {getSetting} from './settings.js';

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

const addBlock = (vm, procedureCode, {args, displayName, callback}) => {
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
        displayName
    });
};

const patchBlockly = () => {
    if (window.__mwDebuggerBlocklyPatched) return;
    const ScratchBlocks = window.ScratchBlocks;
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

const registerDebuggerBlocks = (vm, handlers) => {
    if (vm.__mwDebuggerBlocksInstalled) return;
    vm.__mwDebuggerBlocksInstalled = true;

    const {onLog, onBreakpoint, onClearLogs} = handlers;

    addBlock(vm, BREAKPOINT, {
        args: [],
        displayName: 'breakpoint',
        callback: (_, thread) => onBreakpoint(thread)
    });
    addBlock(vm, LOG, {
        args: ['content'],
        displayName: 'log %s',
        callback: ({content}, thread) => onLog(content, thread, 'log')
    });
    addBlock(vm, WARN, {
        args: ['content'],
        displayName: 'warn %s',
        callback: ({content}, thread) => onLog(content, thread, 'warn')
    });
    addBlock(vm, ERROR, {
        args: ['content'],
        displayName: 'error %s',
        callback: ({content}, thread) => onLog(content, thread, 'error')
    });

    patchBlockly();

    const ogGreenFlag = vm.runtime.greenFlag;
    vm.runtime.greenFlag = function (...args) {
        if (getSetting('log_clear_greenflag')) {
            onClearLogs();
        }
        if (getSetting('log_greenflag')) {
            onLog('Green flag clicked', null, 'internal');
        }
        return ogGreenFlag.call(this, ...args);
    };

    const ogStartHats = vm.runtime.startHats;
    vm.runtime.startHats = function (hat, optMatchFields, ...args) {
        if (getSetting('log_broadcasts') && hat === 'event_whenbroadcastreceived') {
            onLog(
                `Broadcasted "${optMatchFields.BROADCAST_OPTION}"`,
                vm.runtime.sequencer.activeThread,
                'internal'
            );
        }
        return ogStartHats.call(this, hat, optMatchFields, ...args);
    };

    const installCloneHook = () => {
        if (vm.__mwDebuggerCloneHookInstalled) return;
        const firstTarget = vm.runtime.targets[0];
        if (!firstTarget) return;
        vm.__mwDebuggerCloneHookInstalled = true;

        const proto = firstTarget.constructor.prototype;
        const ogMakeClone = proto.makeClone;
        proto.makeClone = function (...args) {
            if (getSetting('log_failed_clone_creation') && !vm.runtime.clonesAvailable()) {
                onLog(
                    `Failed to create clone of "${this.getName()}" because there are too many clones`,
                    vm.runtime.sequencer.activeThread,
                    'internal-warn'
                );
            }
            const clone = ogMakeClone.call(this, ...args);
            if (getSetting('log_clone_create') && clone) {
                onLog(
                    `Created clone of "${this.getName()}"`,
                    vm.runtime.sequencer.activeThread,
                    'internal'
                );
            }
            return clone;
        };
    };
    installCloneHook();
    vm.runtime.on('PROJECT_LOADED', installCloneHook);
};

export default registerDebuggerBlocks;
