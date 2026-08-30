import {
    computeCommitGraph,
    deleteRepo,
    getRemotes,
    getRepoStatus,
    readReadme
} from './browser-git.js';
import {checkoutMwpBranch, importMwp} from './mwp.js';
import {fetchWorkspace, getProjectCommits} from '../community/api.js';

let generation = 0;
let currentPromise = null;
let state = {
    phase: 'idle',
    data: null,
    error: null
};
const listeners = new Set();
let remoteProject = null;

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

const remoteProjectKey = project => (project ?
    `${project.id || ''}:${project.gitHead || ''}:${project.workspaceUrl || ''}` : '');

const gitAuthor = (name, date) => ({
    name: name || '',
    email: '',
    timestamp: Number(date) > 100000000000 ? Math.floor(Number(date) / 1000) : Number(date) || 0,
    timezoneOffset: 0
});

const remoteCommit = commit => ({
    oid: commit.sha || commit.oid,
    commit: {
        message: commit.message || '',
        author: gitAuthor(commit.author, commit.date),
        committer: gitAuthor(commit.author, commit.date),
        parent: commit.parents || []
    }
});

const remoteHistoryData = history => {
    const branch = history.branch || 'main';
    const commits = (history.commits || []).map(remoteCommit);
    const graph = history.graph || {branches: [], nodes: [], branchLogs: []};
    return {
        status: {
            initialized: commits.length > 0,
            currentBranch: branch,
            branches: graph.branches?.length ? graph.branches : [branch],
            commits,
            changes: []
        },
        graph: {
            branches: graph.branches || [],
            branchLogs: graph.branchLogs || [],
            nodes: (graph.nodes || []).map(node => ({
                oid: node.sha || node.oid,
                commit: {
                    message: node.message || node.commit?.message || '',
                    author: gitAuthor(node.author || node.commit?.author?.name, node.date),
                    committer: gitAuthor(node.author || node.commit?.author?.name, node.date),
                    parent: node.parents || node.commit?.parent || []
                },
                parents: node.parents || node.commit?.parent || [],
                branches: node.branches || []
            }))
        },
        remotes: [],
        readme: '',
        remote: true,
        head: history.head || ''
    };
};

const setRemoteProjectHistory = project => {
    remoteProject = project && project.id ? {...project} : null;
};

const preloadRemoteProjectHistory = project => {
    const target = project || remoteProject;
    if (!target || !target.id) return Promise.resolve(null);
    const loadGeneration = ++generation;
    setState({phase: 'loading', data: null, error: null});
    currentPromise = getProjectCommits(target.id, target.projectJsonUrl)
        .then(history => {
            const data = remoteHistoryData(history);
            if (loadGeneration === generation && remoteProjectKey(target) === remoteProjectKey(remoteProject)) {
                setState({phase: 'ready', data, error: null});
            }
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

const isProjectHistoryHydrated = vm => {
    const expected = remoteProjectKey(remoteProject);
    return !expected || Boolean(vm && vm._mwHistoryHydration &&
        vm._mwHistoryHydration.key === expected && vm._mwHistoryHydration.ready);
};

const ensureProjectHistoryHydrated = vm => {
    const project = remoteProject;
    const key = remoteProjectKey(project);
    if (!key || !project.workspaceUrl) return Promise.resolve(null);
    if (!vm) return Promise.reject(new Error('The editor is unavailable.'));
    const existing = vm._mwHistoryHydration;
    if (existing && existing.key === key) {
        if (existing.ready) return Promise.resolve(existing.manifest);
        if (existing.promise) return existing.promise;
    }
    const hydration = {key, ready: false, manifest: null, promise: null};
    hydration.promise = fetchWorkspace(project.workspaceUrl)
        .then(workspace => importMwp(workspace))
        .then(async manifest => {
            if (project.gitHead && manifest.head && manifest.head !== project.gitHead) {
                await deleteRepo();
                throw new Error('The project history changed while it was loading. Try again.');
            }
            if (project.gitBranch) await checkoutMwpBranch(project.gitBranch);
            hydration.ready = true;
            hydration.manifest = manifest;
            hydration.promise = null;
            return manifest;
        })
        .catch(error => {
            if (vm._mwHistoryHydration === hydration) vm._mwHistoryHydration = null;
            throw error;
        });
    vm._mwHistoryHydration = hydration;
    return hydration.promise;
};

const readProjectHistory = async vm => {
    const status = await getRepoStatus(vm);
    // Reading history must not create it. The first save owns repository
    // initialization so a new project gets exactly one initial version.
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
    if (remoteProject && !isProjectHistoryHydrated(vm)) {
        if (!force && currentPromise && state.phase === 'loading') return currentPromise;
        return preloadRemoteProjectHistory(remoteProject);
    }
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
    ensureProjectHistoryHydrated,
    getProjectHistoryState,
    isProjectHistoryHydrated,
    markProjectHistoryLoading,
    preloadProjectHistory,
    preloadRemoteProjectHistory,
    remoteHistoryData,
    setRemoteProjectHistory,
    subscribeProjectHistory
};
