const mockGetRepoStatus = jest.fn();
const mockComputeCommitGraph = jest.fn();
const mockGetRemotes = jest.fn();
const mockReadReadme = jest.fn();
const mockInitRepo = jest.fn();

jest.mock('../../src/lib/git/browser-git.js', () => ({
    getRepoStatus: (...args) => mockGetRepoStatus(...args),
    computeCommitGraph: (...args) => mockComputeCommitGraph(...args),
    getRemotes: (...args) => mockGetRemotes(...args),
    initRepo: (...args) => mockInitRepo(...args),
    readReadme: (...args) => mockReadReadme(...args)
}));

const {
    getProjectHistoryState,
    markProjectHistoryLoading,
    preloadProjectHistory,
    subscribeProjectHistory
} = require('../../src/lib/git/project-history.js');

describe('project history preload', () => {
    beforeEach(() => {
        jest.clearAllMocks();
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

    test('gives an ordinary project a local initial version', async () => {
        const uninitialized = {
            initialized: false,
            currentBranch: null,
            branches: [],
            commits: [],
            changes: []
        };
        const initialized = {
            initialized: true,
            currentBranch: 'main',
            branches: ['main'],
            commits: [{oid: 'initial'}],
            changes: []
        };
        const graph = {branches: ['main'], nodes: [{oid: 'initial'}], branchLogs: []};
        mockGetRepoStatus.mockResolvedValueOnce(uninitialized).mockResolvedValueOnce(initialized);
        mockComputeCommitGraph.mockResolvedValue(graph);
        mockGetRemotes.mockResolvedValue([]);
        mockReadReadme.mockResolvedValue('');

        const data = await preloadProjectHistory({}, {force: true});

        expect(mockInitRepo).toHaveBeenCalledWith({
            defaultBranch: 'main',
            vm: {},
            initialMessage: 'Initial version'
        });
        expect(data.status).toEqual(initialized);
        expect(data.graph).toEqual(graph);
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
});
