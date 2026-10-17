const SET_PROBLEMS = 'scratch-gui/extension-dev/SET_PROBLEMS';
const SET_LOAD_PROBLEMS = 'scratch-gui/extension-dev/SET_LOAD_PROBLEMS';
const ADD_RUNTIME_PROBLEMS = 'scratch-gui/extension-dev/ADD_RUNTIME_PROBLEMS';
const CLEAR_RUNTIME_PROBLEMS = 'scratch-gui/extension-dev/CLEAR_RUNTIME_PROBLEMS';
const ADD_SCRIPT_PROBLEMS = 'scratch-gui/extension-dev/ADD_SCRIPT_PROBLEMS';
const CLEAR_SCRIPT_PROBLEMS = 'scratch-gui/extension-dev/CLEAR_SCRIPT_PROBLEMS';
const ADD_OUTPUT = 'scratch-gui/extension-dev/ADD_OUTPUT';
const CLEAR_OUTPUT = 'scratch-gui/extension-dev/CLEAR_OUTPUT';
const SET_LIVE_PROBLEMS = 'scratch-gui/extension-dev/SET_LIVE_PROBLEMS';
const RESET = 'scratch-gui/extension-dev/RESET';

const MAX_RUNTIME_PROBLEMS = 100;
const MAX_OUTPUT = 2000;

const initialState = {
    staticProblems: {},
    loadProblems: {},
    runtimeProblems: {},
    hiddenRuntimeProblems: {},
    scriptProblems: {},
    liveProblems: {},
    output: [],
    generation: 0
};

const runtimeKey = problem => `${problem.kind}:${problem.blockId || problem.opcode || ''}`;

const mergeRuntimeProblems = (state, problems) => {
    const runtimeProblems = {...state.runtimeProblems};
    const hiddenRuntimeProblems = {...state.hiddenRuntimeProblems};
    for (const problem of problems) {
        const id = problem.extensionId;
        if (!id) continue;
        const list = runtimeProblems[id] ? [...runtimeProblems[id]] : [];
        const key = runtimeKey(problem);
        const index = list.findIndex(item => item.key === key);
        if (index === -1) {
            if (list.length >= MAX_RUNTIME_PROBLEMS) {
                hiddenRuntimeProblems[id] = (hiddenRuntimeProblems[id] || 0) + 1;
                continue;
            }
            list.push({...problem, key, count: problem.count || 1});
        } else {
            list[index] = {...list[index], ...problem, key, count: list[index].count + (problem.count || 1)};
        }
        runtimeProblems[id] = list;
    }
    return {...state, runtimeProblems, hiddenRuntimeProblems};
};

const mergeScriptProblems = (state, problems) => {
    const scriptProblems = {...state.scriptProblems};
    for (const problem of problems) {
        const list = scriptProblems[problem.targetId] ? [...scriptProblems[problem.targetId]] : [];
        const key = `thread:${problem.topId}`;
        const index = list.findIndex(item => item.key === key);
        if (index === -1) {
            if (list.length >= MAX_RUNTIME_PROBLEMS) continue;
            list.push({...problem, key, count: 1});
        } else {
            list[index] = {...list[index], ...problem, key, count: list[index].count + 1};
        }
        scriptProblems[problem.targetId] = list;
    }
    return {...state, scriptProblems};
};

const clearScriptProblems = (state, targetId, topId) => {
    const list = state.scriptProblems[targetId];
    if (!list) return state;
    const scriptProblems = {...state.scriptProblems};
    const kept = topId ? list.filter(item => item.topId !== topId) : [];
    if (kept.length === list.length) return state;
    if (kept.length) scriptProblems[targetId] = kept;
    else delete scriptProblems[targetId];
    return {...state, scriptProblems};
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_PROBLEMS:
        return {...state, staticProblems: {...state.staticProblems, [action.id]: action.problems}};
    case SET_LOAD_PROBLEMS:
        return {...state, loadProblems: {...state.loadProblems, [action.id]: action.problems}};
    case ADD_RUNTIME_PROBLEMS:
        return mergeRuntimeProblems(state, action.problems);
    case CLEAR_RUNTIME_PROBLEMS: {
        if (!state.runtimeProblems[action.id] && !state.hiddenRuntimeProblems[action.id]) return state;
        const runtimeProblems = {...state.runtimeProblems};
        const hiddenRuntimeProblems = {...state.hiddenRuntimeProblems};
        delete runtimeProblems[action.id];
        delete hiddenRuntimeProblems[action.id];
        return {...state, runtimeProblems, hiddenRuntimeProblems};
    }
    case ADD_SCRIPT_PROBLEMS:
        return mergeScriptProblems(state, action.problems);
    case CLEAR_SCRIPT_PROBLEMS:
        return clearScriptProblems(state, action.targetId, action.topId);
    case ADD_OUTPUT: {
        const output = state.output.concat(action.entries);
        return {...state, output: output.length > MAX_OUTPUT ? output.slice(output.length - MAX_OUTPUT) : output};
    }
    case CLEAR_OUTPUT:
        return {...state, output: action.id ? state.output.filter(entry => entry.extensionId !== action.id) : []};
    case SET_LIVE_PROBLEMS:
        return {...state, liveProblems: action.problems};
    case RESET:
        return {...initialState, generation: state.generation + 1};
    default:
        return state;
    }
};

const setStaticProblems = (id, problems) => ({type: SET_PROBLEMS, id, problems});
const setLoadProblems = (id, problems) => ({type: SET_LOAD_PROBLEMS, id, problems});
const addRuntimeProblems = problems => ({type: ADD_RUNTIME_PROBLEMS, problems});
const clearRuntimeProblems = id => ({type: CLEAR_RUNTIME_PROBLEMS, id});
const addScriptProblems = problems => ({type: ADD_SCRIPT_PROBLEMS, problems});
const clearScriptProblemsFor = (targetId, topId = null) => ({type: CLEAR_SCRIPT_PROBLEMS, targetId, topId});
const addExtensionOutput = entries => ({type: ADD_OUTPUT, entries});
const clearExtensionOutput = id => ({type: CLEAR_OUTPUT, id});
const setLiveProblems = problems => ({type: SET_LIVE_PROBLEMS, problems});
const resetExtensionDev = () => ({type: RESET});

const countProblems = (state, id) => {
    const statics = (state.staticProblems[id] || []).concat(state.loadProblems[id] || []);
    const runtime = state.runtimeProblems[id] || [];
    let errors = 0;
    let warnings = 0;
    for (const problem of statics.concat(runtime)) {
        if (problem.severity === 'error') errors++;
        else if (problem.severity === 'warning') warnings++;
    }
    return {errors, warnings, total: errors + warnings};
};

const countAllProblems = state => {
    const ids = new Set(Object.keys(state.staticProblems)
        .concat(Object.keys(state.loadProblems), Object.keys(state.runtimeProblems)));
    let total = 0;
    for (const id of ids) total += countProblems(state, id).errors;
    return total;
};

export {
    reducer as default,
    initialState as extensionDevInitialState,
    MAX_OUTPUT,
    setStaticProblems,
    setLoadProblems,
    addRuntimeProblems,
    clearRuntimeProblems,
    addScriptProblems,
    clearScriptProblemsFor,
    addExtensionOutput,
    clearExtensionOutput,
    resetExtensionDev,
    setLiveProblems,
    countProblems,
    countAllProblems
};
