import {loadClonedProject, TWGitModal} from '../../../src/containers/mw-git-modal.jsx';
import RestorePointAPI from '../../../src/lib/api/restore-points.js';
import {
    getFs,
    repoHasFractch
} from '../../../src/lib/git/browser-git.js';
import {buildSb3FromFractchTree} from '../../../src/lib/git/fractch-tree.js';

jest.mock('../../../src/lib/api/restore-points.js', () => ({
    createSafetyRestorePoint: jest.fn()
}));
jest.mock('../../../src/lib/git/browser-git.js', () => ({
    REPO_DIR: '/repo',
    deleteRepo: jest.fn(),
    getDefaultAuthor: jest.fn(() => ({name: 'User', email: 'user@example.com'})),
    getFs: jest.fn(),
    repoHasFractch: jest.fn()
}));
jest.mock('../../../src/lib/git/fractch-tree.js', () => ({
    buildSb3FromFractchTree: jest.fn()
}));

describe('git modal project loading', () => {
    let vm;

    beforeEach(() => {
        vm = {
            loadProject: jest.fn(() => Promise.resolve()),
            quit: jest.fn(),
            renderer: {
                draw: jest.fn()
            }
        };
        repoHasFractch.mockResolvedValue(true);
        getFs.mockReturnValue({promises: {}});
        buildSb3FromFractchTree.mockResolvedValue(new Uint8Array([1, 2, 3]));
        RestorePointAPI.createSafetyRestorePoint.mockReset();
        RestorePointAPI.createSafetyRestorePoint.mockResolvedValue();
    });

    test('restore point storage failure does not block a cloned project', async () => {
        RestorePointAPI.createSafetyRestorePoint.mockRejectedValue(new Error('storage unavailable'));

        await loadClonedProject(vm, 'Current project');

        expect(vm.quit).toHaveBeenCalledTimes(1);
        expect(vm.loadProject).toHaveBeenCalledWith(expect.any(ArrayBuffer), {skipGitImport: true});
        expect(vm.renderer.draw).toHaveBeenCalledTimes(1);
    });

    test('renderer failure does not report a valid cloned project as failed', async () => {
        vm.renderer.draw.mockImplementation(() => {
            throw new Error('renderer unavailable');
        });

        await expect(loadClonedProject(vm, 'Current project')).resolves.toBeUndefined();
        expect(vm.loadProject).toHaveBeenCalledTimes(1);
    });
});

describe('git modal dismissal', () => {
    test('cannot close while an operation is running', () => {
        const onClose = jest.fn();
        const modal = new TWGitModal({
            onClose,
            vm: {}
        });

        modal.state.busy = true;
        modal.handleClose();
        expect(onClose).not.toHaveBeenCalled();

        modal.state.busy = false;
        modal.handleClose();
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
