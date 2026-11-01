import {getRemotes, push} from '../../../src/lib/git/browser-git';
import {syncConfiguredRemotes} from '../../../src/lib/git/sync-remotes';
import {projectSession, detachProjectSession} from '../../../src/modules/project-session';

jest.mock('../../../src/lib/git/browser-git', () => ({
    getDefaultAuthor: () => ({name: 'User'}),
    getRemotes: jest.fn(),
    push: jest.fn()
}));
jest.mock('../../../src/lib/rotur/git-api', () => ({
    getAuth: jest.fn(), isRoturGitUrl: () => false
}));

const importedWorkspaceVm = (approvedUrls = []) => {
    const vm = {};
    detachProjectSession(vm);
    for (const url of approvedUrls) projectSession(vm).approvedRemotes.add(url);
    return vm;
};

beforeEach(() => {
    jest.clearAllMocks();
    getRemotes.mockResolvedValue([{name: 'origin', url: 'https://example.com/imported.git'}]);
    push.mockResolvedValue({});
});

test('saving an imported workspace does not push inherited connections', async () => {
    const vm = importedWorkspaceVm();
    expect(await syncConfiguredRemotes({vm})).toEqual([]);
    expect(push).not.toHaveBeenCalled();
});

test('only explicitly approved imported connections sync on save', async () => {
    getRemotes.mockResolvedValue([
        {name: 'origin', url: 'https://example.com/imported.git'},
        {name: 'mine', url: 'https://example.com/mine.git'}
    ]);
    const vm = importedWorkspaceVm(['https://example.com/mine.git']);
    expect(await syncConfiguredRemotes({vm})).toEqual([{name: 'mine', ok: true}]);
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith(expect.objectContaining({remote: 'mine'}));
});
