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
    adoptImportedProjectHistory: jest.fn(),
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

    test('a background metadata refresh cannot authorize overwriting newer cloud code', async () => {
        rememberPlatformProject({id: 'project-1', isOwner: true, gitHead: 'opened', edited: 10});
        rememberPlatformProject({id: 'project-1', isOwner: true, gitHead: 'newer', edited: 20});
        mockGetProject.mockResolvedValue({project: {
            id: 'project-1', isOwner: true, gitHead: 'newer', edited: 20
        }});
        await expect(publishToMistWarp({vm: {}})).rejects.toMatchObject({code: 'head_changed'});
        expect(mockUploadProject).not.toHaveBeenCalled();
        expect(mockDeleteRepo).not.toHaveBeenCalled();
    });

    test('the successful upload establishes the base for the next save', async () => {
        const project = {id: 'project-1', isOwner: true, gitHead: 'opened', edited: 10};
        rememberPlatformProject(project);
        mockGetProject.mockResolvedValue({project});
        mockUploadProject.mockResolvedValue({ok: true, project: {gitHead: 'abc', edited: 20}});
        const vm = {saveProjectSb3DontZip: () => ({'project.json': '{}'})};
        await publishToMistWarp({vm});
        const {getRememberedPlatformProjectState} = require('../../src/lib/community/publish.js');
        expect(getRememberedPlatformProjectState().saveBase).toEqual({head: 'abc', edited: 20});
    });

    test('uploads imported history in full without restoring the old remote graph', async () => {
        const project = {id: 'project-1', isOwner: true, workspaceUrl: '/old.mwp', gitHead: 'old'};
        rememberPlatformProject(project);
        mockGetProject.mockResolvedValue({project});
        const vm = {
            saveProjectSb3DontZip: () => ({'project.json': '{"targets":[]}'}),
            _mwHistoryHydration: {projectId: project.id, replaceHistory: true, ready: true}
        };
        await publishToMistWarp({vm, title: 'Imported'});
        expect(mockDeleteRepo).not.toHaveBeenCalled();
        expect(mockGetProjectCommits).not.toHaveBeenCalled();
        expect(mockCreateMwp).toHaveBeenCalledWith(expect.objectContaining({
            remoteHead: '', baseHistory: null, requireChanges: false
        }));
        expect(mockUploadProject.mock.calls[0][4]).toEqual(expect.objectContaining({expectedHead: 'old', replaceHistory: true}));
        const {adoptImportedProjectHistory} = require('../../src/lib/git/project-history.js');
        expect(adoptImportedProjectHistory).toHaveBeenCalledWith(vm, {head: 'abc'},
            expect.objectContaining({id: project.id, gitHead: 'abc'}), false);
    });

    test('keeps history replacement pending when an upload fails', async () => {
        rememberPlatformProject({id: 'project-1', isOwner: true});
        const vm = {
            saveProjectSb3DontZip: () => ({'project.json': '{"targets":[]}'}),
            _mwHistoryHydration: {projectId: 'project-1', replaceHistory: true}
        };
        mockUploadProject.mockRejectedValueOnce(Object.assign(new Error('Retry later'), {code: 'debounced'}));
        await expect(publishToMistWarp({vm})).rejects.toThrow('Retry later');
        expect(vm._mwHistoryHydration.replaceHistory).toBe(true);
        const {adoptImportedProjectHistory} = require('../../src/lib/git/project-history.js');
        expect(adoptImportedProjectHistory).not.toHaveBeenCalled();
    });

    test('approved contributors save directly without becoming owners', async () => {
        const project = {id: 'project-1', isOwner: false, canSaveDirectly: true, edited: 123};
        rememberPlatformProject(project);
        mockGetProject.mockResolvedValue({project});
        const vm = {saveProjectSb3DontZip: jest.fn(() => ({'project.json': '{"targets":[]}'}))};
        await publishToMistWarp({vm, title: 'Team project'});
        expect(mockRemixProject).not.toHaveBeenCalled();
        expect(mockUploadProject.mock.calls[0][0]).toBe(project.id);
        const {getRememberedPlatformProjectState} = require('../../src/lib/community/publish.js');
        expect(getRememberedPlatformProjectState().isOwner).toBe(false);
        expect(mockUploadProject.mock.calls[0][4]).toEqual(expect.objectContaining({expectedEdited: 123}));
    });

    test('revoked live approval does not silently remix or upload', async () => {
        rememberPlatformProject({id: 'project-1', isOwner: false, canSaveDirectly: true});
        mockGetProject.mockResolvedValue({project: {id: 'project-1', isOwner: false, canSaveDirectly: false}});
        await expect(publishToMistWarp({vm: {}, title: 'Team project'})).rejects.toThrow('access ended');
        expect(mockRemixProject).not.toHaveBeenCalled();
        expect(mockUploadProject).not.toHaveBeenCalled();
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

    test('does not infer repair parents from bounded history metadata', async () => {
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
        expect(mockGetProjectCommits).toHaveBeenCalledTimes(1);
        expect(mockCreateMwp).toHaveBeenCalledWith(expect.objectContaining({
            remoteHead: 'detached-head',
            additionalParents: [],
            baseHistory: expect.objectContaining({
                commits: [{sha: 'detached-head'}],
                graph: expect.objectContaining({
                    nodes: [
                        {sha: 'detached-head', parents: []}
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
