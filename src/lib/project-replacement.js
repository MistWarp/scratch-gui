import RestorePointAPI from './api/restore-points.js';
import {createRepoBackup} from './git/browser-git.js';
import {withProjectOperation, projectRevision} from './project-operation.js';

// Consent belongs to the caller. This protects both code and history if the
// approved operation fails after it has started changing the workspace.
const prepareProjectReplacement = async (vm, title) => {
    const hydration = vm._mwHistoryHydration;
    if (hydration && hydration.promise) await hydration.promise;
    const revision = projectRevision(vm);
    const backupId = await RestorePointAPI.createSafetyRestorePoint(vm, title);
    const restoreRepo = await createRepoBackup();
    if (projectRevision(vm) !== revision) {
        throw new Error('The project changed while its backup was being made. Nothing was replaced. Try again.');
    }
    return async ({restoreCode = true} = {}) => {
        await restoreRepo();
        vm._mwHistoryHydration = hydration;
        if (restoreCode) await RestorePointAPI.loadRestorePoint(vm, backupId);
    };
};

const withProjectReplacement = (vm, title, operation) => withProjectOperation(vm, async () => {
    const rollback = await prepareProjectReplacement(vm, title);
    const revision = projectRevision(vm);
    const loadProject = vm.loadProject;
    let replacedCode = false;
    vm.loadProject = (...args) => {
        if (!replacedCode && projectRevision(vm) !== revision) {
            throw new Error('You edited the project while this operation was running. ' +
                'Nothing was replaced. Try again.');
        }
        replacedCode = true;
        return loadProject.apply(vm, args);
    };
    try {
        return await operation();
    } catch (error) {
        try {
            vm.loadProject = loadProject;
            await rollback({restoreCode: replacedCode});
        } catch (restoreError) {
            throw new Error(`${error.message} Automatic recovery failed. ` +
                `Your previous code is in File > Device backups as "${title}". ${restoreError.message}`);
        }
        throw error;
    } finally {
        // The operation lock guarantees this is still the same workspace.
        // eslint-disable-next-line require-atomic-updates
        vm.loadProject = loadProject;
    }
});

export {prepareProjectReplacement, withProjectReplacement};
