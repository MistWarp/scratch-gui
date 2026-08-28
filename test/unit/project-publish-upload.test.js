const mockCreateProject = jest.fn();
const mockUploadProject = jest.fn();
const mockCheckProjectAssets = jest.fn();
const mockCollectExtensionSources = jest.fn();
const mockCreateMwp = jest.fn();

jest.mock('../../src/lib/community/api.js', () => ({
    createProject: (...args) => mockCreateProject(...args),
    uploadProject: (...args) => mockUploadProject(...args),
    publishProject: jest.fn(),
    updateProject: jest.fn(),
    checkProjectAssets: (...args) => mockCheckProjectAssets(...args),
    getProject: jest.fn(),
    remixProject: jest.fn(),
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
    preloadProjectHistory: jest.fn(() => Promise.resolve())
}));

const {publishToMistWarp, rememberPlatformProject} = require('../../src/lib/community/publish.js');

describe('MistWarp project upload packaging', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        rememberPlatformProject(null);
        mockCreateProject.mockResolvedValue({id: 'project-1'});
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
});
