import {getRunningThread, isPaused, onPauseChanged, onSingleStep, setPaused, setup, singleStep} from './pause.js';

const LOCAL_NAME = /^!local_[A-Za-z0-9]+_(.+)$/;

const breakpoints = new Set();
const listeners = new Set();
let installedVm = null;

const notify = () => {
    for (const listener of listeners) listener();
};

const sync = () => {
    if (installedVm) installedVm.runtime.setBreakpoints(breakpoints);
    notify();
};

const isPlayerOnly = () => {
    const store = typeof window === 'undefined' ? null : window.ReduxStore;
    return Boolean(store && store.getState().scratchGui.mode.isPlayerOnly);
};

const installBreakpoints = vm => {
    const runtime = vm && vm.runtime;
    if (installedVm === vm || !runtime || !runtime.sequencer || typeof runtime.setBreakpoints !== 'function') return;
    installedVm = vm;
    setup(vm);
    vm.runtime.on('BREAKPOINT_HIT', () => {
        if (isPaused() || isPlayerOnly()) return;
        setPaused(true);
    });
    vm.runtime.on('PROJECT_LOADED', () => {
        breakpoints.clear();
        sync();
    });
    onPauseChanged(notify);
    onSingleStep(notify);
    sync();
};

const hasBreakpoint = blockId => breakpoints.has(blockId);

const toggleBreakpoint = blockId => {
    if (!blockId) return false;
    if (breakpoints.has(blockId)) breakpoints.delete(blockId);
    else breakpoints.add(blockId);
    sync();
    return breakpoints.has(blockId);
};

const listBreakpoints = () => Array.from(breakpoints);

const subscribeBreakpoints = listener => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

const originalTarget = target => (target && target.sprite && target.sprite.clones[0]) || target;

const pausedLocation = () => {
    const thread = getRunningThread();
    if (!isPaused() || !thread || !thread.target) return null;
    return {
        thread,
        targetId: originalTarget(thread.target).id,
        blockId: thread.isCompiled ? thread.topBlock : thread.peekStack(),
        topId: thread.topBlock,
        compiled: Boolean(thread.isCompiled),
        compilerOnly: Boolean(thread.isCompiled && thread.blockContainer &&
            typeof thread.target.runtime.scriptNeedsCompiler === 'function' &&
            thread.target.runtime.scriptNeedsCompiler(thread.blockContainer, thread.topBlock))
    };
};

const scriptVariableIds = (blocks, topId) => {
    const ids = new Set();
    const seen = new Set();
    const pending = [topId];
    while (pending.length) {
        const id = pending.pop();
        if (!id || seen.has(id)) continue;
        seen.add(id);
        const block = blocks.getBlock(id);
        if (!block) continue;
        pending.push(block.next);
        for (const name of Object.keys(block.inputs || {})) pending.push(block.inputs[name].block);
        for (const name of ['VARIABLE', 'LIST']) {
            const field = block.fields && block.fields[name];
            if (field && field.id) ids.add(field.id);
        }
    }
    return ids;
};

const scriptLocals = (target, topId) => {
    if (!target || !topId) return [];
    const locals = [];
    for (const id of scriptVariableIds(target.blocks, topId)) {
        const variable = target.lookupVariableById(id);
        const match = variable && LOCAL_NAME.exec(variable.name);
        if (match) locals.push({key: `var:${id}`, name: match[1], type: variable.type, variable});
    }
    return locals;
};

const threadParams = thread => {
    for (let i = thread.stackFrames.length - 1; i >= 0; i--) {
        const params = thread.stackFrames[i].params;
        if (params) {
            return Object.keys(params).map(name => ({key: `param:${name}`, name, type: 'param', value: params[name]}));
        }
    }
    return [];
};

const pausedLocals = () => {
    const location = pausedLocation();
    if (!location) return [];
    const {thread} = location;
    const top = location.blockId ? thread.target.blocks.getTopLevelScript(location.blockId) : location.topId;
    return threadParams(thread).concat(scriptLocals(thread.target, top || location.topId));
};

export {
    hasBreakpoint,
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
};
