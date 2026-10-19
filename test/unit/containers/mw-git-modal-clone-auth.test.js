import {TWGitModal} from '../../../src/containers/mw-git-modal.jsx';
import {cloneRepo} from '../../../src/lib/git/browser-git.js';
import {getAuth as getRoturGitAuth} from '../../../src/lib/rotur/git-api.js';

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
    await TWGitModal.prototype.handleClone.call(modal);
    return cloneRepo.mock.calls[0][0];
};

afterEach(() => {
    mockSplit = false;
});

test('a Rotur Git clone uses the Rotur sign-in on the account origin', async () => {
    expect((await clone('https://git.rotur.dev/sophie/game.git')).onAuth).toBe(getRoturGitAuth);
});

test('a Rotur Git clone never gets the token saved for other git hosts', async () => {
    mockSplit = true;
    expect((await clone('https://git.rotur.dev/sophie/game.git')).onAuth).toBeUndefined();
    mockSplit = false;
    expect((await clone('https://git.rotur.dev/sophie/game.git', null)).onAuth).toBeUndefined();
});

test('other hosts still get the saved token', async () => {
    mockSplit = true;
    const {onAuth} = await clone('https://github.com/sophie/game.git');
    expect(onAuth()).toEqual({username: 'sophie', password: 'ghp_secret'});
});
