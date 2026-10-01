/**
 * Persistent Rotur integration settings.
 * Presence text is fixed; users can toggle RPC and the edit-duration timer
 * (native start_time — never written into title/status strings).
 */

import {isMinorAccount, subscribeMinorAccount} from '../minor-account.js';

const STORAGE_KEY = 'mw:rotur-settings';
const APP_NAME = 'MistWarp';

const DEFAULTS = {
    presenceEnabled: true,
    includeEditDuration: true,
    // How project extensions may show activity on your Rotur profile:
    // 'ask' (prompt per project), 'all' (always allow), 'off' (never).
    activitySharing: 'ask'
};

const MINOR_DEFAULTS = {
    ...DEFAULTS,
    presenceEnabled: false,
    includeEditDuration: false
};

const SETTING_KEYS = Object.keys(DEFAULTS);
const SHARING_MODES = ['ask', 'all', 'off'];

/** @type {Set<(settings: typeof DEFAULTS) => void>} */
const listeners = new Set();

const defaultsFor = minor => (minor ? MINOR_DEFAULTS : DEFAULTS);

const normalizeValue = (key, value) => {
    if (key === 'activitySharing') return SHARING_MODES.includes(value) ? value : DEFAULTS.activitySharing;
    return value !== false;
};

const legacyChoices = parsed => SETTING_KEYS.filter(key => (
    Object.prototype.hasOwnProperty.call(parsed, key) &&
    normalizeValue(key, parsed[key]) !== DEFAULTS[key]
));

const readStored = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {values: {}, chosen: []};
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return {values: {}, chosen: []};
        const chosen = Array.isArray(parsed.chosen) ?
            parsed.chosen.filter(key => SETTING_KEYS.includes(key)) :
            legacyChoices(parsed);
        const values = {};
        for (const key of chosen) {
            values[key] = normalizeValue(key, parsed[key]);
        }
        return {values, chosen};
    } catch (_) {
        return {values: {}, chosen: []};
    }
};

const effectiveSettings = stored => ({...defaultsFor(isMinorAccount()), ...stored.values});

const readAll = () => effectiveSettings(readStored());

const notify = next => {
    for (const handler of listeners) {
        try {
            handler(next);
        } catch (_) {
            // ignore subscriber errors
        }
    }
};

const writeStored = stored => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({...stored.values, chosen: stored.chosen}));
    } catch (_) {
        // ignore
    }
    notify(effectiveSettings(stored));
};

const getRoturSettings = () => readAll();

const chooseSettings = patch => {
    const stored = readStored();
    const values = {...stored.values};
    const chosen = [...stored.chosen];
    for (const key of Object.keys(patch)) {
        if (SETTING_KEYS.includes(key)) {
            values[key] = normalizeValue(key, patch[key]);
            if (!chosen.includes(key)) chosen.push(key);
        }
    }
    writeStored({values, chosen});
};

const setRoturSetting = (key, value) => {
    if (!SETTING_KEYS.includes(key)) {
        return;
    }
    chooseSettings({[key]: value});
};

const updateRoturSettings = patch => {
    chooseSettings(patch || {});
};

const getRoturSettingsSnapshot = () => {
    const stored = readStored();
    return {...effectiveSettings(stored), chosen: stored.chosen};
};

const applyRoturSettingsSnapshot = snapshot => {
    if (!snapshot || typeof snapshot !== 'object') return;
    const chosen = Array.isArray(snapshot.chosen) ?
        snapshot.chosen.filter(key => SETTING_KEYS.includes(key)) :
        legacyChoices(snapshot);
    const values = {};
    for (const key of chosen) {
        values[key] = normalizeValue(key, snapshot[key]);
    }
    writeStored({values, chosen});
};

subscribeMinorAccount(() => {
    notify(readAll());
});

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
    getRoturSettingsSnapshot,
    applyRoturSettingsSnapshot,
    setRoturSetting,
    updateRoturSettings,
    formatActivityTitle,
    formatActivityStatus,
    subscribeRoturSettings
};
