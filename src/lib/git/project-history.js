import {
    computeCommitGraph,
    getRemotes,
    getRepoStatus,
    initRepo,
    readReadme
} from './browser-git.js';

let generation = 0;
let currentPromise = null;
let state = {
    phase: 'idle',
    data: null,
    error: null
};
const listeners = new Set();

const emit = () => {
    for (const listener of listeners) listener(state);
};

const setState = next => {
    state = next;
    emit();
    return state;
};

const markProjectHistoryLoading = () => {
    generation += 1;
    currentPromise = null;
    return setState({phase: 'loading', data: null, error: null});
};

const readProjectHistory = async vm => {
    let status = await getRepoStatus(vm);
    // Version history is part of every MistWarp project, including older SB3s
    // and community projects created before MWP existed. Keep the baseline
    // local until the user's next save embeds or uploads it.
    if (!status.initialized) {
        await initRepo({defaultBranch: 'main', vm, initialMessage: 'Initial version'});
        status = await getRepoStatus(vm);
    }
    if (!status.initialized || !Array.isArray(status.commits) || status.commits.length === 0) {
        return {
            status,
            graph: {branches: [], nodes: [], branchLogs: []},
            remotes: [],
            readme: ''
        };
    }
    const [graph, remotes, readme] = await Promise.all([
        computeCommitGraph({depth: 50}),
        getRemotes(vm).catch(() => []),
        readReadme().catch(() => '')
    ]);
    return {status, graph, remotes, readme};
};

const preloadProjectHistory = (vm, {force = false} = {}) => {
    if (!force && currentPromise && state.phase === 'loading') return currentPromise;
    const loadGeneration = ++generation;
    setState({phase: 'loading', data: null, error: null});
    currentPromise = readProjectHistory(vm)
        .then(data => {
            if (loadGeneration === generation) setState({phase: 'ready', data, error: null});
            return data;
        })
        .catch(error => {
            if (loadGeneration === generation) setState({phase: 'error', data: null, error});
            throw error;
        })
        .finally(() => {
            if (loadGeneration === generation) currentPromise = null;
        });
    return currentPromise;
};

const getProjectHistoryState = () => state;

const subscribeProjectHistory = listener => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export {
    getProjectHistoryState,
    markProjectHistoryLoading,
    preloadProjectHistory,
    subscribeProjectHistory
};
