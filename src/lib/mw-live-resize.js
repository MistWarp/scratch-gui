let holdCount = 0;
const pending = new Set();

const isLiveResizing = () => holdCount > 0;

const afterLiveResize = callback => {
    if (holdCount > 0) {
        pending.add(callback);
    } else {
        callback();
    }
};

const cancelAfterLiveResize = callback => {
    pending.delete(callback);
};

const beginLiveResize = () => {
    holdCount++;
    let released = false;
    return () => {
        if (released) return;
        released = true;
        holdCount--;
        if (holdCount > 0) return;
        const callbacks = Array.from(pending);
        pending.clear();
        callbacks.forEach(callback => callback());
    };
};

export {
    afterLiveResize,
    beginLiveResize,
    cancelAfterLiveResize,
    isLiveResizing
};
