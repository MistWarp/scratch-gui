import {TWGitModal} from '../../../src/containers/mw-git-modal.jsx';
import {cloneRepo, cloneRepoFromHistory} from '../../../src/lib/git/browser-git.js';

let mockSplit = false;
jest.mock('../../../src/lib/account/origins.js', () => ({
    ACCOUNT_ORIGIN: 'https://mistwarp.org',
    EDITOR_ORIGIN: 'https://editor.mistwarp.org',
    isSplitEditor: () => mockSplit,
    isEditorOrigin: () => false
}));
jest.mock('../../../src/lib/git/browser-git.js', () => ({
    REPO_DIR: '/repo',
    cloneRepo: jest.fn(async () => {}),
    cloneRepoFromHistory: jest.fn(async () => {}),
    cloneRepoFromArchive: jest.fn(async () => {}),
    getDefaultAuthor: jest.fn(() => ({name: 'User', email: 'user@example.com'})),
    getFs: jest.fn(),
    repoHasFractch: jest.fn()
}));

const clone = async (url, roturUsername = 'sophie') => {
    const modal = new TWGitModal({onClose: jest.fn(), roturUsername, vm: {}});
    modal.state.cloneUrl = url;
    modal.state.remoteToken = 'ghp_secret';
    modal.loadProjectFromClonedRepo = jest.fn(async () => {});
    modal.refresh = jest.fn(async () => {});
    cloneRepo.mockClear();
    cloneRepoFromHistory.mockClear();
    await TWGitModal.prototype.handleClone.call(modal);
    return cloneRepo.mock.calls[0]?.[0];
};

afterEach(() => {
    mockSplit = false;
});

test('a Rotur Git clone is rebuilt from Rotur Git history instead of a token clone', async () => {
    for (const [split, roturUsername] of [[false, 'sophie'], [true, 'sophie'], [false, null]]) {
        mockSplit = split;
        expect(await clone('https://git.rotur.dev/sophie/game.git', roturUsername)).toBeUndefined();
        expect(cloneRepo).not.toHaveBeenCalled();
        expect(cloneRepoFromHistory).toHaveBeenCalledWith(expect.objectContaining({owner: 'sophie', name: 'game'}));
        expect(JSON.stringify(cloneRepoFromHistory.mock.calls)).not.toContain('ghp_secret');
    }
});

test('other hosts still get the saved token', async () => {
    mockSplit = true;
    const {onAuth} = await clone('https://github.com/sophie/game.git');
    expect(onAuth()).toEqual({username: 'sophie', password: 'ghp_secret'});
});
