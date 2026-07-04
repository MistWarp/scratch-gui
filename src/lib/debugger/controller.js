import EventTarget from '../../addons/event-target.js';
import createEngine from './engine.js';
import createBlockHelpers from './block-helpers.js';
import registerDebuggerBlocks from './blocks.js';

const MAX_LOGS = 200000;

const initDebugger = vm => {
    if (vm.__mwDebuggerController) {
        return vm.__mwDebuggerController;
    }

    const events = new EventTarget();
    const engine = createEngine(vm);
    const helpers = createBlockHelpers(vm);

    engine.onPauseChanged(paused => {
        const event = new CustomEvent('pause');
        event.paused = paused;
        events.dispatchEvent(event);
    });

    let visible = false;
    let hasUnread = false;

    const rows = [];

    const setHasUnreadMessage = unread => {
        if (hasUnread === unread) return;
        hasUnread = unread;
        const event = new CustomEvent('unread');
        event.unread = unread;
        events.dispatchEvent(event);
    };

    const addLog = (text, thread, type) => {
        const log = {
            text,
            type,
            count: 1,
            preview: true,
            timestamp: Date.now()
        };
        if (thread) {
            log.blockId = thread.peekStack();
            const targetId = thread.target.id;
            log.targetId = targetId;
            log.targetInfo = helpers.getTargetInfoById(targetId);
        }
        if (type === 'internal') {
            log.internal = true;
            log.preview = false;
            log.type = 'log';
        }
        if (type === 'internal-warn') {
            log.internal = true;
            log.type = 'warn';
        }

        rows.push(log);
        while (rows.length > MAX_LOGS) {
            rows.shift();
        }

        const event = new CustomEvent('log');
        event.log = log;
        events.dispatchEvent(event);

        if (!visible && !log.internal) {
            setHasUnreadMessage(true);
        }
    };

    const clearLogs = () => {
        rows.length = 0;
        events.dispatchEvent(new CustomEvent('clear'));
    };

    let hasLoggedPauseError = false;
    const onBreakpoint = thread => {
        const store = window.ReduxStore;
        const isPlayerOnly = store && store.getState().scratchGui.mode.isPlayerOnly;
        if (isPlayerOnly) {
            if (!hasLoggedPauseError) {
                addLog('Cannot pause when the editor is not open', thread, 'error');
                hasLoggedPauseError = true;
            }
            return;
        }
        engine.setPaused(true);
        events.dispatchEvent(new CustomEvent('show'));
    };

    registerDebuggerBlocks(vm, {
        onLog: addLog,
        onBreakpoint,
        onClearLogs: clearLogs
    });

    const afterStepCallbacks = [];
    if (!vm.runtime.__mwDebuggerAfterStep) {
        vm.runtime.__mwDebuggerAfterStep = afterStepCallbacks;
        const originalStep = vm.runtime._step;
        vm.runtime._step = function (...args) {
            const ret = originalStep.call(this, ...args);
            for (const cb of vm.runtime.__mwDebuggerAfterStep) {
                cb();
            }
            return ret;
        };
    }
    const addAfterStepCallback = cb => {
        vm.runtime.__mwDebuggerAfterStep.push(cb);
        return () => {
            const list = vm.runtime.__mwDebuggerAfterStep;
            const index = list.indexOf(cb);
            if (index !== -1) list.splice(index, 1);
        };
    };

    const controller = {
        vm,
        events,
        engine,
        rows,
        addLog,
        clearLogs,
        addAfterStepCallback,
        setHasUnreadMessage,
        isVisible: () => visible,
        setVisible: value => {
            visible = value;
            if (value) {
                setHasUnreadMessage(false);
            }
        },
        hasUnread: () => hasUnread,
        getBlock: helpers.getBlock,
        getTargetInfoById: helpers.getTargetInfoById,
        createBlockLink: helpers.createBlockLink,
        createBlockPreview: helpers.createBlockPreview
    };

    vm.__mwDebuggerController = controller;
    return controller;
};

export default initDebugger;
