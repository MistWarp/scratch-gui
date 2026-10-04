// Saves and project replacements must not read or mutate the same workspace concurrently.
const activeOperations = new WeakSet();
const revisions = new WeakMap();
// Fired on window whenever an operation starts or ends, so UI such as the
// save button can show it is busy. detail: {vm, active}
const PROJECT_OPERATION_EVENT = 'mw:project-operation';
const PROJECT_OPERATION_ACTIVE = 'project_operation_active';
const projectRevision = vm => {
    if (!revisions.has(vm)) {
        const revision = {value: 0};
        revisions.set(vm, revision);
        if (typeof vm.on === 'function') {
            vm.on('PROJECT_CHANGED', () => {
                revision.value++;
            });
        }
    }
    return revisions.get(vm).value;
};
const notify = (vm, active) => {
    if (!vm || typeof window === 'undefined' || typeof CustomEvent !== 'function') return;
    window.dispatchEvent(new CustomEvent(PROJECT_OPERATION_EVENT, {detail: {vm, active}}));
};
const isProjectOperationActive = vm => Boolean(vm && activeOperations.has(vm));
const isProjectOperationActiveError = error => Boolean(error) && error.code === PROJECT_OPERATION_ACTIVE;
const beginProjectOperation = vm => {
    if (isProjectOperationActive(vm)) {
        const error = new Error('Another save or project change is still running. ' +
            'Wait for it to finish and try again.');
        error.code = PROJECT_OPERATION_ACTIVE;
        throw error;
    }
    if (vm) activeOperations.add(vm);
    notify(vm, true);
    let released = false;
    return () => {
        if (released) return;
        released = true;
        if (vm) activeOperations.delete(vm);
        notify(vm, false);
    };
};
const withProjectOperation = async (vm, operation) => {
    const release = beginProjectOperation(vm);
    try {
        return await operation();
    } finally {
        release();
    }
};
export {
    PROJECT_OPERATION_EVENT,
    beginProjectOperation,
    isProjectOperationActive,
    isProjectOperationActiveError,
    withProjectOperation,
    projectRevision
};
