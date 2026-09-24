import {EventEmitter} from 'events';
import {withProjectReplacement} from '../../src/lib/project-replacement.js';
import {withProjectOperation, isProjectOperationActive} from '../../src/lib/project-operation.js';
import RestorePointAPI from '../../src/lib/api/restore-points.js';
import {createRepoBackup} from '../../src/lib/git/browser-git.js';

jest.mock('../../src/lib/api/restore-points.js', () => ({
    createSafetyRestorePoint: jest.fn(),
    isStorageUnavailableError: error => Boolean(error) && error.name === 'StorageUnavailableError',
    loadRestorePoint: jest.fn()
}));
jest.mock('../../src/lib/git/browser-git.js', () => ({createRepoBackup: jest.fn()}));

let vm;
let restoreRepo;
beforeEach(() => {
    jest.resetAllMocks();
    vm = new EventEmitter();
    vm.code = 'original';
    vm.loadProject = jest.fn(async code => { vm.code = code; });
    restoreRepo = jest.fn();
    createRepoBackup.mockResolvedValue(restoreRepo);
    RestorePointAPI.createSafetyRestorePoint.mockResolvedValue(42);
    RestorePointAPI.loadRestorePoint.mockImplementation(async () => { vm.code = 'original'; });
});

test('backup failure prevents every mutation', async () => {
    const replace = jest.fn();
    RestorePointAPI.createSafetyRestorePoint.mockRejectedValue(new Error('disk full'));
    await expect(withProjectReplacement(vm, 'Before import', replace)).rejects.toThrow('disk full');
    expect(replace).not.toHaveBeenCalled();
    expect(vm.code).toBe('original');
    expect(isProjectOperationActive(vm)).toBe(false);
});

test('a failed load restores code and the whole previous repository', async () => {
    await expect(withProjectReplacement(vm, 'Before import', async () => {
        await vm.loadProject('partially loaded');
        throw new Error('missing asset');
    })).rejects.toThrow('missing asset');
    expect(restoreRepo).toHaveBeenCalledTimes(1);
    expect(RestorePointAPI.loadRestorePoint).toHaveBeenCalledWith(vm, 42);
    expect(vm.code).toBe('original');
});

test('edits during a slow operation are preserved and cancel the replacement', async () => {
    await expect(withProjectReplacement(vm, 'Before clone', async () => {
        vm.code = 'new edits';
        vm.emit('PROJECT_CHANGED');
        await vm.loadProject('remote');
    })).rejects.toThrow('You edited the project');
    expect(vm.code).toBe('new edits');
    expect(RestorePointAPI.loadRestorePoint).not.toHaveBeenCalled();
    expect(restoreRepo).toHaveBeenCalledTimes(1);
});

test('edits during backup stop the operation before it begins', async () => {
    RestorePointAPI.createSafetyRestorePoint.mockImplementation(async () => {
        vm.emit('PROJECT_CHANGED');
        return 42;
    });
    const replace = jest.fn();
    await expect(withProjectReplacement(vm, 'Before import', replace)).rejects.toThrow('changed while its backup');
    expect(replace).not.toHaveBeenCalled();
});

test('a save and a project replacement cannot run at the same time', async () => {
    await withProjectOperation(vm, async () => {
        const replace = jest.fn();
        await expect(withProjectReplacement(vm, 'Before import', replace)).rejects.toThrow('still running');
        expect(replace).not.toHaveBeenCalled();
    });
    expect(isProjectOperationActive(vm)).toBe(false);
});

test('without device backup storage the previous code is kept in memory for the rollback', async () => {
    const unavailable = new Error('IndexedDB is blocked');
    unavailable.name = 'StorageUnavailableError';
    RestorePointAPI.createSafetyRestorePoint.mockRejectedValue(unavailable);
    vm.saveProjectSb3 = jest.fn(async () => `sb3:${vm.code}`);
    vm.loadProject = jest.fn(async code => {
        vm.code = code.startsWith('sb3:') ? code.slice(4) : code;
    });

    await expect(withProjectReplacement(vm, 'Before import', async () => {
        await vm.loadProject('partially loaded');
        throw new Error('missing asset');
    })).rejects.toThrow('missing asset');

    expect(vm.saveProjectSb3).toHaveBeenCalledWith('arraybuffer');
    expect(RestorePointAPI.loadRestorePoint).not.toHaveBeenCalled();
    expect(vm.code).toBe('original');
    expect(isProjectOperationActive(vm)).toBe(false);
});

test('other backup failures still stop the replacement', async () => {
    RestorePointAPI.createSafetyRestorePoint.mockRejectedValue(new Error('quota exceeded'));
    vm.saveProjectSb3 = jest.fn();
    const replace = jest.fn();
    await expect(withProjectReplacement(vm, 'Before import', replace)).rejects.toThrow('quota exceeded');
    expect(vm.saveProjectSb3).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
});
