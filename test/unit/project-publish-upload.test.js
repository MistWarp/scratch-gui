const mockCreateProject = jest.fn();
const mockUploadProject = jest.fn();
const mockCheckProjectAssets = jest.fn();
const mockCollectExtensionSources = jest.fn();
const mockCreateMwp = jest.fn();
const mockGetProject = jest.fn();
const mockGetProjectCommits = jest.fn();
const mockRemixProject = jest.fn();
const mockEnsureProjectHistoryHydrated = jest.fn(() => Promise.resolve());

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
jest.mock('../../src/lib/git/sync-remotes.js', () => ({
    syncConfiguredRemotes: jest.fn(() => Promise.resolve([]))
}));
jest.mock('../../src/lib/git/project-history.js', () => ({
    ensureProjectHistoryHydrated: (...args) => mockEnsureProjectHistoryHydrated(...args),
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
                project: {id: 'original', isOwner: false, canRemix: true, workspaceUrl: '/original.mwp'}
            })
            .mockResolvedValueOnce({
                project: {
                    id: 'fork-1',
                    isOwner: true,
                    remixParent: 'original',
                    remixBaseCommit: 'base-sha',
                    workspaceUrl: '/fork.mwp',
                    gitHead: 'base-sha'
                }
            });

        await publishToMistWarp({vm, title: 'Fork'});

        expect(mockEnsureProjectHistoryHydrated).not.toHaveBeenCalled();
        expect(mockGetProjectCommits).toHaveBeenCalledWith('fork-1', undefined);
        expect(mockCreateMwp).toHaveBeenCalledWith(expect.objectContaining({
            projectId: 'fork-1',
            remixParent: 'original',
            baseCommit: 'base-sha',
            remoteHead: 'base-sha',
            baseHistory: expect.objectContaining({branch: 'main'})
        }));
    });
});
