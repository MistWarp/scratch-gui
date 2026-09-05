// Saves and project replacements must not read or mutate the same workspace concurrently.
const activeOperations = new WeakSet();
const revisions = new WeakMap();
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
const isProjectOperationActive = vm => Boolean(vm && activeOperations.has(vm));
const beginProjectOperation = vm => {
    if (isProjectOperationActive(vm)) {
        throw new Error('Another save or project change is still running. Wait for it to finish and try again.');
    }
    if (vm) activeOperations.add(vm);
    return () => {
        if (vm) activeOperations.delete(vm);
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
export {beginProjectOperation, isProjectOperationActive, withProjectOperation, projectRevision};
