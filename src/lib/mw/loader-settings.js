import {local} from '../../modules/storage';

const STORAGE_KEY = 'mw:loader-settings';

const DEFAULTS = {
    showAnimation: true,
    showTitle: true,
    showStatus: true,
    showProgress: true,
    showDetail: true,
    showQuotes: true,
    showGithub: true,
    customQuotes: []
};

const listeners = new Set();
let cached = null;

const read = () => {
    try {
        const stored = local.readJSON(STORAGE_KEY, null);
        if (!stored || typeof stored !== 'object') return {...DEFAULTS};
        return {
            ...DEFAULTS,
            ...stored,
            customQuotes: Array.isArray(stored.customQuotes) ? stored.customQuotes : []
        };
    } catch (e) {
        return {...DEFAULTS};
    }
};

const getLoaderSettings = () => {
    if (!cached) cached = read();
    return cached;
};

const setLoaderSettings = changes => {
    cached = {...getLoaderSettings(), ...changes};
    local.writeJSON(STORAGE_KEY, cached);
    for (const listener of listeners) listener(cached);
    return cached;
};

const resetLoaderSettings = () => setLoaderSettings({...DEFAULTS});

const subscribeToLoaderSettings = listener => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export {
    DEFAULTS,
    getLoaderSettings,
    setLoaderSettings,
    resetLoaderSettings,
    subscribeToLoaderSettings
};
