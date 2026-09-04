const mockCreateProject = jest.fn();
const mockUploadProject = jest.fn();
const mockCheckProjectAssets = jest.fn();
const mockCollectExtensionSources = jest.fn();
const mockCreateMwp = jest.fn();
const mockGetProject = jest.fn();
const mockGetProjectCommits = jest.fn();
const mockRemixProject = jest.fn();
const mockDeleteRepo = jest.fn(() => Promise.resolve());

jest.mock('../../src/lib/community/api.js', () => ({
    createProject: (...args) => mockCreateProject(...args),
    uploadProject: (...args) => mockUploadProject(...args),
    publishProject: jest.fn(),
    updateProject: jest.fn(),
    checkProjectAssets: (...args) => mockCheckProjectAssets(...args),
    getProject: (...args) => mockGetProject(...args),
    getProjectCommits: (...args) => mockGetProjectCommits(...args),
    remixProject: (...args) => mockRemixProject(...args),
    deleteProject: jest.fn(),
    collectExtensionSources: (...args) => mockCollectExtensionSources(...args)
}));
jest.mock('../../src/lib/git/mwp.js', () => ({
    createMwp: (...args) => mockCreateMwp(...args)
}));
jest.mock('../../src/lib/git/browser-git.js', () => ({
    deleteRepo: (...args) => mockDeleteRepo(...args)
}));
jest.mock('../../src/lib/git/sync-remotes.js', () => ({
    syncConfiguredRemotes: jest.fn(() => Promise.resolve([]))
}));
jest.mock('../../src/lib/git/project-history.js', () => ({
    isProjectHistoryHydrated: jest.fn(() => false),
    preloadProjectHistory: jest.fn(() => Promise.resolve()),
    setRemoteProjectHistory: jest.fn()
}));

const {publishToMistWarp, rememberPlatformProject} = require('../../src/lib/community/publish.js');

describe('MistWarp project upload packaging', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        rememberPlatformProject(null);
        mockCreateProject.mockResolvedValue({id: 'project-1'});
        mockGetProject.mockResolvedValue({project: {id: 'project-1', isOwner: true}});
        mockGetProjectCommits.mockResolvedValue({
            branch: 'main', commits: [], graph: {branches: ['main'], branchLogs: [], nodes: []}
        });
        mockRemixProject.mockResolvedValue({id: 'fork-1'});
        mockCheckProjectAssets.mockResolvedValue({missing: []});
        mockCollectExtensionSources.mockResolvedValue({});
        mockCreateMwp.mockResolvedValue({blob: new Blob(['history']), manifest: {head: 'abc'}});
        mockUploadProject.mockResolvedValue({ok: true});
    });

    test('serializes the VM once and reuses those files for the commit', async () => {
        const files = {'project.json': JSON.stringify({targets: []})};
        const vm = {
            saveProjectSb3DontZip: jest.fn(() => files),
            saveProjectSb3: jest.fn()
        };

        await publishToMistWarp({vm, title: 'Fast upload'});

        expect(vm.saveProjectSb3DontZip).toHaveBeenCalledTimes(1);
        expect(vm.saveProjectSb3).not.toHaveBeenCalled();
        expect(mockCreateMwp).toHaveBeenCalledWith(expect.objectContaining({
            sb3Files: files,
            remoteHead: ''
        }));
        expect(mockUploadProject).toHaveBeenCalledTimes(1);
    });

    test('exports a remix as a delta from its inherited head', async () => {
        const files = {'project.json': JSON.stringify({targets: []})};
        const vm = {saveProjectSb3DontZip: jest.fn(() => files)};
        rememberPlatformProject({id: 'original', isOwner: false, canRemix: true});
        mockGetProject
            .mockResolvedValueOnce({
                project: {
                    id: 'original',
                    isOwner: false,
                    canRemix: true,
                    projectJsonUrl: '/original.json',
                    workspaceUrl: '/original.mwp'
                }
            })
            .mockResolvedValueOnce({
                project: {
                    id: 'fork-1',
                    isOwner: true,
                    remixParent: 'original',
                    remixBaseCommit: 'base-sha',
                    workspaceUrl: '/fork.mwp',
                    gitHead: 'detached-bootstrap-sha'
                }
            });

        await publishToMistWarp({vm, title: 'Fork'});

        expect(mockDeleteRepo).toHaveBeenCalledTimes(1);
        expect(mockGetProjectCommits).toHaveBeenCalledWith('original', '/original.json');
        expect(mockCreateMwp).toHaveBeenCalledWith(expect.objectContaining({
            projectId: 'fork-1',
            remixParent: 'original',
            baseCommit: 'base-sha',
            remoteHead: 'base-sha',
            baseHistory: expect.objectContaining({branch: 'main'})
        }));
    });

    test('keeps the existing graph when an unhydrated remix is saved again', async () => {
        const files = {'project.json': JSON.stringify({targets: []})};
        const vm = {saveProjectSb3DontZip: jest.fn(() => files)};
        const project = {
            id: 'fork-1',
            isOwner: true,
            remixParent: 'original',
            remixBaseCommit: 'base-sha',
            projectJsonUrl: '/fork.json',
            workspaceUrl: '/fork.mwp',
            gitHead: 'fork-head'
        };
        rememberPlatformProject(project);
        mockGetProject.mockResolvedValue({project});
        mockGetProjectCommits.mockResolvedValue({
            branch: 'main',
            commits: [{sha: 'fork-head'}, {sha: 'base-sha'}],
            graph: {
                branches: ['main'],
                branchLogs: [{branch: 'main', oids: ['fork-head', 'base-sha']}],
                nodes: [
                    {sha: 'fork-head', parents: ['base-sha']},
                    {sha: 'base-sha', parents: []}
                ]
            }
        });

        await publishToMistWarp({vm, title: 'Fork'});

        expect(mockGetProjectCommits).toHaveBeenCalledWith('fork-1', '/fork.json');
        expect(mockDeleteRepo).toHaveBeenCalledTimes(1);
        expect(mockCreateMwp).toHaveBeenCalledWith(expect.objectContaining({
            remoteHead: 'fork-head',
            additionalParents: [],
            baseHistory: expect.objectContaining({branch: 'main'})
        }));
    });

    test('reconnects an existing detached remix without discarding its commits', async () => {
        const files = {'project.json': JSON.stringify({targets: []})};
        const vm = {saveProjectSb3DontZip: jest.fn(() => files)};
        const project = {
            id: 'fork-1',
            isOwner: true,
            remixParent: 'original',
            remixBaseCommit: 'base-sha',
            projectJsonUrl: '/fork.json',
            workspaceUrl: '/fork.mwp',
            gitHead: 'detached-head'
        };
        rememberPlatformProject(project);
        mockGetProject.mockResolvedValue({project});
        mockGetProjectCommits
            .mockResolvedValueOnce({
                branch: 'main',
                commits: [{sha: 'detached-head'}],
                graph: {
                    branches: ['main'],
                    branchLogs: [{branch: 'main', oids: ['detached-head']}],
                    nodes: [{sha: 'detached-head', parents: []}]
                }
            })
            .mockResolvedValueOnce({
                branch: 'main',
                commits: [{sha: 'base-sha'}],
                graph: {
                    branches: ['main'],
                    branchLogs: [{branch: 'main', oids: ['base-sha']}],
                    nodes: [{sha: 'base-sha', parents: []}]
                }
            });

        await publishToMistWarp({vm, title: 'Fork'});

        expect(mockGetProjectCommits).toHaveBeenNthCalledWith(1, 'fork-1', '/fork.json');
        expect(mockGetProjectCommits).toHaveBeenNthCalledWith(2, 'original');
        expect(mockCreateMwp).toHaveBeenCalledWith(expect.objectContaining({
            remoteHead: 'detached-head',
            additionalParents: ['base-sha'],
            baseHistory: expect.objectContaining({
                commits: [{sha: 'detached-head'}, {sha: 'base-sha'}],
                graph: expect.objectContaining({
                    nodes: [
                        {sha: 'detached-head', parents: []},
                        {sha: 'base-sha', parents: []}
                    ]
                })
            })
        }));
    });

    test('does not upload an update when no files changed', async () => {
        const files = {'project.json': JSON.stringify({targets: []})};
        const vm = {saveProjectSb3DontZip: jest.fn(() => files)};
        rememberPlatformProject({id: 'project-1', isOwner: true, workspaceUrl: '/project.mwp', gitHead: 'abc'});
        mockGetProject.mockResolvedValue({
            project: {id: 'project-1', isOwner: true, workspaceUrl: '/project.mwp', gitHead: 'abc'}
        });
        const error = Object.assign(new Error('No files changed in this commit.'), {code: 'no_changes'});
        mockCreateMwp.mockRejectedValue(error);

        await expect(publishToMistWarp({vm, title: null, updateOnly: true})).rejects.toMatchObject({
            message: 'No files changed in this commit.',
            code: 'no_changes'
        });

        expect(mockCreateMwp).toHaveBeenCalledWith(expect.objectContaining({requireChanges: true}));
        expect(mockUploadProject).not.toHaveBeenCalled();
    });
});
