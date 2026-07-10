/**
 * Persistent Rotur integration settings.
 * Presence text is fixed; users can toggle RPC and the edit-duration timer
 * (native start_time — never written into title/status strings).
 */

const STORAGE_KEY = 'mw:rotur-settings';
const APP_NAME = 'MistWarp';

const DEFAULTS = {
    presenceEnabled: true,
    includeEditDuration: true
};

/** @type {Set<(settings: typeof DEFAULTS) => void>} */
const listeners = new Set();

const readAll = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {...DEFAULTS};
        const parsed = JSON.parse(raw);
        return {
            presenceEnabled: parsed.presenceEnabled !== false,
            includeEditDuration: parsed.includeEditDuration !== false
        };
    } catch (_) {
        return {...DEFAULTS};
    }
};

const writeAll = next => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (_) {
        // ignore
    }
    for (const handler of listeners) {
        try {
            handler(next);
        } catch (_) {
            // ignore subscriber errors
        }
    }
};

const getRoturSettings = () => readAll();

const setRoturSetting = (key, value) => {
    if (!Object.prototype.hasOwnProperty.call(DEFAULTS, key)) {
        return;
    }
    writeAll({...readAll(), [key]: value});
};

const updateRoturSettings = patch => {
    const next = {...readAll()};
    for (const key of Object.keys(patch)) {
        if (Object.prototype.hasOwnProperty.call(DEFAULTS, key)) {
            next[key] = patch[key];
        }
    }
    writeAll(next);
};

/** @returns {string} */
const formatActivityTitle = () => `Editing In ${APP_NAME}`;

/**
 * @param {string|{projectTitle?: string}|null|undefined} projectTitleOrCtx
 * @returns {string}
 */
const formatActivityStatus = projectTitleOrCtx => {
    const raw = typeof projectTitleOrCtx === 'object' && projectTitleOrCtx !== null ?
        (projectTitleOrCtx.projectTitle || '') :
        (projectTitleOrCtx || '');
    const name = (raw && String(raw).trim()) || 'Untitled Project';
    return `Working on ${name}`;
};

/**
 * @param {(settings: typeof DEFAULTS) => void} handler
 * @returns {() => void}
 */
const subscribeRoturSettings = handler => {
    listeners.add(handler);
    return () => {
        listeners.delete(handler);
    };
};

export {
    getRoturSettings,
    setRoturSetting,
    updateRoturSettings,
    formatActivityTitle,
    formatActivityStatus,
    subscribeRoturSettings
};
