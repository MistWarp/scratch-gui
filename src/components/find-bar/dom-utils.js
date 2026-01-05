export const getReactInternalKey = element => {
    if (!element) return null;
    const keys = Object.keys(element);
    return (
        keys.find(key => key.startsWith('__reactFiber$')) ||
        keys.find(key => key.startsWith('__reactInternalInstance$')) ||
        null
    );
};

export const waitForElement = (selector, {signal} = {}) => new Promise((resolve, reject) => {
    const existing = document.querySelector(selector);
    if (existing) {
        resolve(existing);
        return;
    }

    const observer = new MutationObserver(() => {
        const found = document.querySelector(selector);
        if (found) {
            observer.disconnect();
            resolve(found);
        }
    });

    const abort = () => {
        observer.disconnect();
        reject(new Error('aborted'));
    };

    if (signal) {
        if (signal.aborted) return abort();
        signal.addEventListener('abort', abort, {once: true});
    }

    observer.observe(document.documentElement, {childList: true, subtree: true});
});
