const LOCAL_KEYS = ['mw:anonymous-analytics', 'mw:analytics-session'];
const LOCAL_PREFIXES = ['mw:signup-tracked:'];
const SESSION_PREFIXES = ['mw:analytics-once:', 'mw:analytics-day:'];

const removeMatching = (storage, keys, prefixes) => {
    const matches = [];
    for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && (keys.includes(key) || prefixes.some(prefix => key.startsWith(prefix)))) matches.push(key);
    }
    matches.forEach(key => storage.removeItem(key));
};

const clearAnalyticsStorage = () => {
    try {
        removeMatching(localStorage, LOCAL_KEYS, LOCAL_PREFIXES);
        removeMatching(sessionStorage, [], SESSION_PREFIXES);
    } catch (e) {
        return false;
    }
    return true;
};

export default clearAnalyticsStorage;
