import PropTypes from 'prop-types';
import {useEffect, useRef} from 'react';
import {connect} from 'react-redux';
import {injectIntl, intlShape} from 'react-intl';
import VM from 'scratch-vm';

import {
    MAX_OUTPUT,
    addExtensionOutput,
    addRuntimeProblems,
    addScriptProblems,
    clearRuntimeProblems,
    clearScriptProblemsFor,
    resetExtensionDev
} from '../reducers/extension-dev.js';
import {outputEntry} from '../lib/extension-dev/actions.js';
import {setMarkedBlocks} from '../lib/extension-dev/block-marks.js';
import {resetSession} from '../lib/extension-dev/session.js';
import AddonHooks from '../addons/hooks.js';
import messages from '../components/extension-dev/messages.js';
import '../components/extension-dev/extension-dev.css';

const FLUSH_MS = 250;

const originalId = target => {
    if (!target) return null;
    const original = target.sprite && target.sprite.clones[0];
    return (original || target).id;
};

const errorText = error => (error && typeof error.message === 'string' ? error.message : String(error));

const describeProblem = (intl, problem) => {
    if (problem.kind === 'menu') {
        return intl.formatMessage(messages.kindMenuError, {menu: problem.opcode || '', message: problem.message});
    }
    if (problem.opcode) {
        return intl.formatMessage(messages.kindBlockError, {block: problem.opcode, message: problem.message});
    }
    return problem.message;
};

const ExtensionDevListener = props => {
    const buffer = useRef([]);
    const consoleBuffer = useRef([]);
    const threadBuffer = useRef([]);
    const timer = useRef(null);
    const propsRef = useRef(props);
    propsRef.current = props;

    useEffect(() => {
        const vm = props.vm;
        if (!vm || !vm.runtime) return;
        const runtime = vm.runtime;

        const flush = () => {
            timer.current = null;
            const items = buffer.current;
            const logs = consoleBuffer.current;
            const threads = threadBuffer.current;
            buffer.current = [];
            consoleBuffer.current = [];
            threadBuffer.current = [];
            const {intl} = propsRef.current;
            const outputs = [];
            if (items.length) {
                props.onAddRuntimeProblems(items.map(item => ({
                    ...item,
                    severity: 'error',
                    text: describeProblem(intl, item)
                })));
                for (const item of items) {
                    outputs.push(outputEntry(item.extensionId, 'error', describeProblem(intl, item), {
                        source: 'runtime',
                        line: item.line,
                        column: item.column,
                        targetId: item.targetId,
                        blockId: item.blockId
                    }));
                }
            }
            if (threads.length) {
                props.onAddScriptProblems(threads);
                for (const item of threads) {
                    outputs.push(outputEntry(null, 'error', item.message, {
                        source: 'runtime',
                        targetId: item.targetId,
                        topId: item.topId
                    }));
                }
            }
            for (const item of logs) {
                outputs.push(outputEntry(item.extensionId, item.level === 'warn' ? 'warning' : item.level,
                    item.message, {source: 'console', line: item.line, column: item.column}));
            }
            if (outputs.length) props.onAddOutput(outputs);
        };

        const schedule = () => {
            if (!timer.current) timer.current = setTimeout(flush, FLUSH_MS);
        };

        const onExtensionError = event => {
            if (!event || !event.extensionId) return;
            buffer.current.push({
                extensionId: event.extensionId,
                kind: event.kind || 'block',
                opcode: event.opcode || null,
                blockId: event.blockId || null,
                targetId: event.targetId || null,
                message: event.message || '',
                stack: event.stack || '',
                line: event.line || null,
                column: event.column || null,
                count: event.count || 1,
                time: Date.now()
            });
            schedule();
        };

        const onConsole = event => {
            if (!event || !event.extensionId) return;
            consoleBuffer.current.push(event);
            if (consoleBuffer.current.length > MAX_OUTPUT) consoleBuffer.current.shift();
            schedule();
        };

        const onThreadError = event => {
            const thread = event && event.thread;
            const targetId = thread && originalId(thread.target);
            if (!targetId || !thread.topBlock) return;
            threadBuffer.current.push({
                targetId,
                topId: thread.topBlock,
                message: errorText(event.error),
                time: Date.now()
            });
            schedule();
        };

        const hasScriptProblem = (targetId, topId) => {
            const list = propsRef.current.scriptProblems[targetId];
            return Boolean(list) && (!topId || list.some(item => item.topId === topId));
        };

        const onThreadStarted = thread => {
            const targetId = thread && originalId(thread.target);
            if (!targetId) return;
            threadBuffer.current = threadBuffer.current.filter(item =>
                item.targetId !== targetId || item.topId !== thread.topBlock);
            if (hasScriptProblem(targetId, thread.topBlock)) {
                props.onClearScriptProblems(targetId, thread.topBlock);
            }
        };

        const onScriptsReplaced = targetId => {
            threadBuffer.current = threadBuffer.current.filter(item => item.targetId !== targetId);
            if (hasScriptProblem(targetId, null)) props.onClearScriptProblems(targetId, null);
        };

        const onReloaded = event => {
            if (!event || !event.id) return;
            buffer.current = buffer.current.filter(item => item.extensionId !== event.id);
            props.onClearRuntimeProblems(event.id);
            const workspace = AddonHooks.blocklyWorkspace;
            const changed = [].concat(event.added || [], event.changed || [], event.removed || []);
            if (!changed.length) return;
            const target = vm.editingTarget;
            const usesChanged = target && target.blocks && Object.values(target.blocks._blocks)
                .some(block => changed.includes(block.opcode));
            setTimeout(() => {
                if (usesChanged) vm.emitWorkspaceUpdate();
                if ((event.removed && event.removed.length) || (event.changed && event.changed.length)) {
                    if (workspace && typeof workspace.clearUndo === 'function') workspace.clearUndo();
                }
            });
        };

        const onRemoved = event => {
            if (event && event.id) props.onClearRuntimeProblems(event.id);
        };

        const onProjectLoaded = () => {
            buffer.current = [];
            consoleBuffer.current = [];
            threadBuffer.current = [];
            props.onReset();
            resetSession();
        };

        runtime.on('EXTENSION_ERROR', onExtensionError);
        runtime.on('EXTENSION_CONSOLE', onConsole);
        runtime.on('THREAD_ERROR', onThreadError);
        runtime.on('THREAD_STARTED', onThreadStarted);
        runtime.on('TARGET_SCRIPTS_REPLACED', onScriptsReplaced);
        runtime.on('EXTENSION_RELOADED', onReloaded);
        runtime.on('EXTENSION_REMOVED', onRemoved);
        runtime.on('PROJECT_LOADED', onProjectLoaded);
        return () => {
            runtime.off('EXTENSION_ERROR', onExtensionError);
            runtime.off('EXTENSION_CONSOLE', onConsole);
            runtime.off('THREAD_ERROR', onThreadError);
            runtime.off('THREAD_STARTED', onThreadStarted);
            runtime.off('TARGET_SCRIPTS_REPLACED', onScriptsReplaced);
            runtime.off('EXTENSION_RELOADED', onReloaded);
            runtime.off('EXTENSION_REMOVED', onRemoved);
            runtime.off('PROJECT_LOADED', onProjectLoaded);
            if (timer.current) clearTimeout(timer.current);
        };
    }, [props.vm]);

    useEffect(() => {
        const ids = [];
        for (const list of Object.values(props.runtimeProblems)) {
            for (const problem of list) {
                if (problem.blockId) ids.push(problem.blockId);
            }
        }
        setMarkedBlocks(ids, props.intl.formatMessage(messages.blockMarkTooltip));
    }, [props.runtimeProblems]);

    return null;
};

ExtensionDevListener.propTypes = {
    intl: intlShape,
    onAddOutput: PropTypes.func,
    onAddRuntimeProblems: PropTypes.func,
    onAddScriptProblems: PropTypes.func,
    onClearRuntimeProblems: PropTypes.func,
    onClearScriptProblems: PropTypes.func,
    onReset: PropTypes.func,
    runtimeProblems: PropTypes.object,
    // eslint-disable-next-line react/no-unused-prop-types
    scriptProblems: PropTypes.object,
    vm: PropTypes.instanceOf(VM)
};

const mapStateToProps = state => ({
    vm: state.scratchGui.vm,
    runtimeProblems: state.scratchGui.extensionDev.runtimeProblems,
    scriptProblems: state.scratchGui.extensionDev.scriptProblems
});

const mapDispatchToProps = dispatch => ({
    onAddOutput: entries => dispatch(addExtensionOutput(entries)),
    onAddRuntimeProblems: problems => dispatch(addRuntimeProblems(problems)),
    onAddScriptProblems: problems => dispatch(addScriptProblems(problems)),
    onClearRuntimeProblems: id => dispatch(clearRuntimeProblems(id)),
    onClearScriptProblems: (targetId, topId) => dispatch(clearScriptProblemsFor(targetId, topId)),
    onReset: () => dispatch(resetExtensionDev())
});

export {ExtensionDevListener};
export default injectIntl(connect(mapStateToProps, mapDispatchToProps)(ExtensionDevListener));
