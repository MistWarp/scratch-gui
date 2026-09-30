const STORAGE_KEY = 'mw:minor-account';

const listeners = new Set();
let fallback = false;

const isMinorAccount = () => {
    try {
        return localStorage.getItem(STORAGE_KEY) === '1';
    } catch (e) {
        return fallback;
    }
};

const writeFlag = next => {
    try {
        if (next) localStorage.setItem(STORAGE_KEY, '1');
        else localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (e) {
        return false;
    }
};

const setMinorAccount = value => {
    const next = value === true;
    if (next === isMinorAccount()) return;
    fallback = next;
    writeFlag(next);
    for (const listener of listeners) {
        try {
            listener(next);
        } catch (e) {
            continue;
        }
    }
};

const subscribeMinorAccount = listener => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

export {
    isMinorAccount,
    setMinorAccount,
    subscribeMinorAccount
};
