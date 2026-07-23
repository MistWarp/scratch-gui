/**
 * Persistent Rotur integration settings.
 * Presence text is fixed; users can toggle RPC and the edit-duration timer
 * (native start_time — never written into title/status strings).
 */

const STORAGE_KEY = 'mw:rotur-settings';
const APP_NAME = 'MistWarp';

const DEFAULTS = {
    presenceEnabled: true,
    includeEditDuration: true,
    // How project extensions may show activity on your Rotur profile:
    // 'ask' (prompt per project), 'all' (always allow), 'off' (never).
    activitySharing: 'ask'
};

const SHARING_MODES = ['ask', 'all', 'off'];

/** @type {Set<(settings: typeof DEFAULTS) => void>} */
const listeners = new Set();

const readAll = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {...DEFAULTS};
        const parsed = JSON.parse(raw);
        return {
            presenceEnabled: parsed.presenceEnabled !== false,
            includeEditDuration: parsed.includeEditDuration !== false,
            activitySharing: SHARING_MODES.includes(parsed.activitySharing) ?
                parsed.activitySharing : 'ask'
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

/**
 * @param {object|string} [ctx] - Activity context.
 * @returns {string} Activity title
 */
const formatActivityTitle = ctx =>
    ((ctx && typeof ctx === 'object' && ctx.collaborating) ?
        `Collaborating In ${APP_NAME}` :
        `Editing In ${APP_NAME}`);

/**
 * @param {string|object} projectTitleOrCtx - Project title or activity context.
 * @returns {string} Activity status
 */
const formatActivityStatus = projectTitleOrCtx => {
    const ctx = typeof projectTitleOrCtx === 'object' && projectTitleOrCtx !== null ?
        projectTitleOrCtx :
        {projectTitle: projectTitleOrCtx};
    const name = (ctx.projectTitle && String(ctx.projectTitle).trim()) || 'Untitled Project';
    // e.g. "Working on My Game · Editing costume "walk-a" in Sprite1"
    return ctx.doing ? `Working on ${name} · ${ctx.doing}` : `Working on ${name}`;
};

/**
 * @param {Function} handler - Settings change handler
 * @returns {Function} Unsubscribe function
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
