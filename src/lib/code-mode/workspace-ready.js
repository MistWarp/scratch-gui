let readyCheck = null;
let waiters = [];

const setWorkspaceReadyCheck = check => {
    readyCheck = typeof check === 'function' ? check : null;
};

const whenWorkspaceReady = targetId => {
    if (readyCheck && readyCheck(targetId)) return Promise.resolve(true);
    return new Promise(resolve => {
        waiters.push({targetId, resolve});
    });
};

const settleWorkspaceWaiters = targetId => {
    const remaining = [];
    for (const waiter of waiters) {
        if (waiter.targetId === targetId) waiter.resolve(true);
        else remaining.push(waiter);
    }
    waiters = remaining;
};

const dropWorkspaceWaiters = keepTargetId => {
    const remaining = [];
    for (const waiter of waiters) {
        if (waiter.targetId === keepTargetId) remaining.push(waiter);
        else waiter.resolve(false);
    }
    waiters = remaining;
};

const pendingWorkspaceWaiters = () => waiters.length;

export {
    dropWorkspaceWaiters,
    pendingWorkspaceWaiters,
    setWorkspaceReadyCheck,
    settleWorkspaceWaiters,
    whenWorkspaceReady
};
