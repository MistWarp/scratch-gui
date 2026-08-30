const mockGetRepoStatus = jest.fn();
const mockComputeCommitGraph = jest.fn();
const mockGetRemotes = jest.fn();
const mockReadReadme = jest.fn();
const mockDeleteRepo = jest.fn();
const mockFetchWorkspace = jest.fn();
const mockGetProjectCommits = jest.fn();
const mockImportMwp = jest.fn();
const mockCheckoutMwpBranch = jest.fn();

jest.mock('../../src/lib/git/browser-git.js', () => ({
    getRepoStatus: (...args) => mockGetRepoStatus(...args),
    computeCommitGraph: (...args) => mockComputeCommitGraph(...args),
    getRemotes: (...args) => mockGetRemotes(...args),
    readReadme: (...args) => mockReadReadme(...args),
    deleteRepo: (...args) => mockDeleteRepo(...args)
}));
jest.mock('../../src/lib/community/api.js', () => ({
    fetchWorkspace: (...args) => mockFetchWorkspace(...args),
    getProjectCommits: (...args) => mockGetProjectCommits(...args)
}));
jest.mock('../../src/lib/git/mwp.js', () => ({
    importMwp: (...args) => mockImportMwp(...args),
    checkoutMwpBranch: (...args) => mockCheckoutMwpBranch(...args)
}));

const {
    ensureProjectHistoryHydrated,
    getProjectHistoryState,
    markProjectHistoryLoading,
    preloadProjectHistory,
    setRemoteProjectHistory,
    subscribeProjectHistory
} = require('../../src/lib/git/project-history.js');

describe('project history preload', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setRemoteProjectHistory(null);
        markProjectHistoryLoading();
    });

    test('loads the graph and connections before a history surface opens', async () => {
        const status = {
            initialized: true,
            currentBranch: 'main',
            branches: ['main'],
            commits: [{oid: 'abc'}],
            changes: []
        };
        const graph = {branches: ['main'], nodes: [{oid: 'abc'}], branchLogs: []};
        mockGetRepoStatus.mockResolvedValue(status);
        mockComputeCommitGraph.mockResolvedValue(graph);
        mockGetRemotes.mockResolvedValue([{name: 'origin', url: 'https://example.com/repo.git'}]);
        mockReadReadme.mockResolvedValue('# Project');

        const data = await preloadProjectHistory({}, {force: true});

        expect(data).toEqual({
            status,
            graph,
            remotes: [{name: 'origin', url: 'https://example.com/repo.git'}],
            readme: '# Project'
        });
        expect(getProjectHistoryState()).toEqual({phase: 'ready', data, error: null});
    });

    test('does not create history while preloading an ordinary project', async () => {
        const uninitialized = {
            initialized: false,
            currentBranch: null,
            branches: [],
            commits: [],
            changes: []
        };
        mockGetRepoStatus.mockResolvedValue(uninitialized);

        const data = await preloadProjectHistory({}, {force: true});

        expect(data).toEqual({
            status: uninitialized,
            graph: {branches: [], nodes: [], branchLogs: []},
            remotes: [],
            readme: ''
        });
        expect(mockGetRepoStatus).toHaveBeenCalledTimes(1);
        expect(mockComputeCommitGraph).not.toHaveBeenCalled();
        expect(mockGetRemotes).not.toHaveBeenCalled();
        expect(mockReadReadme).not.toHaveBeenCalled();
    });

    test('notifies consumers as loading becomes ready', async () => {
        mockGetRepoStatus.mockResolvedValue({initialized: true, commits: [{oid: 'initial'}]});
        mockComputeCommitGraph.mockResolvedValue({branches: ['main'], nodes: [], branchLogs: []});
        mockGetRemotes.mockResolvedValue([]);
        mockReadReadme.mockResolvedValue('');
        const phases = [];
        const unsubscribe = subscribeProjectHistory(next => phases.push(next.phase));

        await preloadProjectHistory({}, {force: true});
        unsubscribe();

        expect(phases).toEqual(['loading', 'ready']);
    });

    test('loads remote commit metadata without hydrating the workspace', async () => {
        const project = {
            id: 'project-1',
            gitHead: 'a'.repeat(40),
            gitBranch: 'main',
            workspaceUrl: 'https://example.com/workspace.mwp',
            projectJsonUrl: 'https://example.com/project.json?k=view-key'
        };
        mockGetProjectCommits.mockResolvedValue({
            head: project.gitHead,
            branch: 'main',
            commits: [{sha: project.gitHead, message: 'Latest', author: 'Mist', date: 1000}],
            graph: {
                branches: ['main'],
                branchLogs: [{branch: 'main', oids: [project.gitHead]}],
                nodes: [{sha: project.gitHead, message: 'Latest', author: 'Mist', date: 1000, parents: []}]
            }
        });
        setRemoteProjectHistory(project);

        const data = await preloadProjectHistory({}, {force: true});

        expect(data.remote).toBe(true);
        expect(data.status.commits[0].oid).toBe(project.gitHead);
        expect(data.graph.nodes[0].oid).toBe(project.gitHead);
        expect(mockGetProjectCommits).toHaveBeenCalledWith(project.id, project.projectJsonUrl);
        expect(mockFetchWorkspace).not.toHaveBeenCalled();
        expect(mockImportMwp).not.toHaveBeenCalled();
    });

    test('deduplicates workspace hydration and preserves the advertised remote head', async () => {
        const head = 'b'.repeat(40);
        const project = {
            id: 'project-2',
            gitHead: head,
            gitBranch: 'main',
            workspaceUrl: 'https://example.com/workspace.mwp'
        };
        const vm = {};
        let finishImport;
        mockFetchWorkspace.mockResolvedValue('workspace');
        mockImportMwp.mockReturnValue(new Promise(resolve => {
            finishImport = resolve;
        }));
        mockCheckoutMwpBranch.mockResolvedValue();
        setRemoteProjectHistory(project);

        const first = ensureProjectHistoryHydrated(vm);
        const second = ensureProjectHistoryHydrated(vm);
        expect(first).toBe(second);
        expect(mockFetchWorkspace).toHaveBeenCalledTimes(1);
        finishImport({head, branch: 'main'});

        await expect(first).resolves.toEqual({head, branch: 'main'});
        await expect(ensureProjectHistoryHydrated(vm)).resolves.toEqual({head, branch: 'main'});
        expect(mockImportMwp).toHaveBeenCalledTimes(1);
        expect(mockCheckoutMwpBranch).toHaveBeenCalledWith('main');
        expect(vm._mwHistoryHydration).toMatchObject({ready: true, manifest: {head, branch: 'main'}});
    });
});
