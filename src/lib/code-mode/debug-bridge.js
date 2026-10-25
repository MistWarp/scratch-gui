import {Text} from '@codemirror/state';
import {findInSourceMap, scriptAtOffset} from './fractch-adapter.js';
import {toBuffer, toFile} from './file-projection.js';
import {
    codeDebugExtension,
    displayName,
    formatValue,
    resolveVariables,
    setBreakpointLines,
    setPausedLine,
    variableNameAt
} from './debug-extension.js';
import {
    installBreakpoints,
    isPaused,
    listBreakpoints,
    originalTarget,
    pausedLocals,
    pausedLocation,
    scriptLocals,
    setPaused,
    singleStep,
    subscribeBreakpoints,
    toggleBreakpoint
} from '../debugger/breakpoints.js';
import messages from '../../components/code-mode/messages.js';
import styles from '../../components/code-mode/workbench.css';

const syncedMap = state => (state && state.status === 'ready' && state.baseline &&
    state.doc === state.baseline.text ? state.baseline.sourceMap : null);

const blockIdAtLine = (map, doc, lineFrom) => {
    const line = doc.lineAt(lineFrom);
    const offset = line.from + (line.text.length - line.text.trimStart().length);
    const hit = findInSourceMap(map, offset);
    if (!hit || hit.kind === 'comment' || doc.lineAt(Math.min(hit.from, doc.length)).number !== line.number) {
        return null;
    }
    return hit.id;
};

const createDebugBridge = host => {
    const {intl} = host;
    installBreakpoints(host.vm);
    let watches = [];
    let lastPausedThread = null;
    const signatures = new WeakMap();

    const syncView = (view, tab) => {
        if (!view || !tab) return;
        const targetId = tab.targetId;
        const map = syncedMap(host.textState(targetId));
        const projection = host.tabProjection(tab);
        if (!map || !projection) return;
        const blocks = map.blocks || {};
        const place = id => (blocks[id] ? toFile(projection, blocks[id].from) : null);
        const positions = listBreakpoints().map(place)
            .filter(pos => pos !== null);
        const location = pausedLocation();
        const paused = location && location.targetId === targetId ? place(location.blockId) : null;
        const signature = `${tab.key}|${positions.join(',')}|${paused}`;
        if (signatures.get(view) === signature) return;
        signatures.set(view, signature);
        setBreakpointLines(view, positions);
        setPausedLine(view, paused);
    };

    const syncActive = () => {
        const tab = host.activeTab();
        if (tab && tab.kind === 'script') syncView(host.activeEditorView(), tab);
    };

    const jumpToPaused = () => {
        const location = pausedLocation();
        if (location) host.jumpTo({targetId: location.targetId, blockId: location.blockId, topId: location.topId});
    };

    const handleChange = () => {
        const location = pausedLocation();
        const thread = location ? location.thread : null;
        if (thread && thread !== lastPausedThread && !lastPausedThread) {
            host.openWatch();
            jumpToPaused();
        }
        lastPausedThread = thread;
        syncActive();
        host.update();
    };

    const unsubscribe = subscribeBreakpoints(handleChange);

    const pin = (target, variable) => {
        const targetId = originalTarget(target).id;
        const key = `${targetId}:${variable.id}`;
        if (watches.some(item => item.key === key)) return;
        watches = watches.concat({key, targetId, variableId: variable.id, name: displayName(variable.name)});
        host.openWatch();
        host.update();
    };

    const readTarget = targetId => {
        const location = pausedLocation();
        if (location && location.targetId === targetId) return location.thread.target;
        return host.vm.runtime.getTargetById(targetId);
    };

    const watchItemsAt = (view, pos) => {
        const tab = host.activeTab();
        if (!tab || tab.kind !== 'script') return null;
        const symbol = variableNameAt(view.state.doc.toString(), pos);
        if (!symbol) return null;
        const target = readTarget(tab.targetId);
        const map = syncedMap(host.textState(tab.targetId));
        const projection = host.tabProjection(tab);
        const script = map && projection ? scriptAtOffset(map, toBuffer(projection, pos)) : null;
        const locals = script ? scriptLocals(target, script.topId) : [];
        const items = resolveVariables(target, symbol, locals).map(variable => ({
            label: displayName(variable.name),
            type: variable.type,
            read: () => formatValue(variable.value, variable.type),
            pin: () => pin(target, variable)
        }));
        return {from: symbol.from, to: symbol.to, items};
    };

    const onToggleBreakpoint = (view, lineFrom) => {
        const tab = host.activeTab();
        if (!tab || tab.kind !== 'script') return;
        const state = host.textState(tab.targetId);
        const map = syncedMap(state);
        const projection = host.tabProjection(tab);
        if (!map || !projection) {
            host.showMessage(tab.targetId, intl.formatMessage(messages.breakpointApplyFirst));
            return;
        }
        const doc = projection.file || projection.pieces.length > 1 ? Text.of(state.doc.split('\n')) : view.state.doc;
        const blockId = blockIdAtLine(map, doc, toBuffer(projection, lineFrom));
        if (blockId) toggleBreakpoint(blockId);
    };

    const callbacks = {current: {onToggleBreakpoint, watchItemsAt}};

    const extension = codeDebugExtension({
        callbacks,
        classes: {
            breakpoint: styles.breakpoint,
            breakpointGutter: styles.breakpointGutter,
            pausedLine: styles.pausedLine,
            watchTooltip: styles.watchTooltip,
            watchTooltipRow: styles.watchTooltipRow,
            watchTooltipValue: styles.watchTooltipValue,
            watchTooltipPin: styles.watchTooltipPin
        },
        labels: {
            list: intl.formatMessage(messages.watchList),
            pin: intl.formatMessage(messages.watchPin)
        }
    });

    const read = () => {
        const location = pausedLocation();
        let paused = null;
        if (location) {
            const found = host.blockLocation(location.targetId, location.blockId);
            const line = found ? found.line : null;
            const script = host.targetLabel(location.targetId, found ? found.file : null);
            paused = {
                compiled: location.compiled,
                compilerOnly: location.compilerOnly,
                script,
                location: script && line ? `${script}:${line}` : script,
                locals: pausedLocals().map(item => ({
                    key: item.key,
                    name: item.name,
                    value: formatValue(item.variable ? item.variable.value : item.value, item.type)
                }))
            };
        }
        return {
            paused,
            watches: watches.map(item => {
                const target = readTarget(item.targetId);
                const variable = target && target.lookupVariableById(item.variableId);
                return {
                    key: item.key,
                    name: item.name,
                    value: variable ? formatValue(variable.value, variable.type) : null
                };
            })
        };
    };

    const watchProps = {
        read,
        onContinue: () => setPaused(false),
        onStep: () => {
            if (isPaused()) singleStep();
        },
        onJump: jumpToPaused,
        onUnpin: key => {
            watches = watches.filter(item => item.key !== key);
            host.update();
        }
    };

    return {
        extension,
        syncView,
        watchProps,
        dispose: unsubscribe
    };
};

export {blockIdAtLine, createDebugBridge};
