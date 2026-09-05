const STORAGE_PREFIX = 'mw:autosave:';
const CHANGE_EVENT = 'mw-autosave-settings-changed';

const DEFINITIONS = [
    {
        id: 'enabled',
        type: 'boolean',
        default: false,
        label: 'Enable autosave'
    },
    {
        id: 'interval',
        type: 'number',
        default: 5,
        min: 1,
        max: 60,
        label: 'Autosave interval (minutes)'
    },
    {
        id: 'notifications',
        type: 'boolean',
        default: true,
        label: 'Show autosave notifications'
    },
    {
        id: 'only_when_changed',
        type: 'boolean',
        default: true,
        label: 'Only autosave changed projects'
    }
];

const byId = Object.fromEntries(DEFINITIONS.map(definition => [definition.id, definition]));

// Previous home of these settings, kept as a migration source.
const MENU_BAR_IDS = {
    enabled: 'autosave_enabled',
    interval: 'autosave_interval',
    notifications: 'autosave_notifications',
    only_when_changed: 'autosave_only_when_changed'
};

const readLegacyMenuBar = id => {
    try {
        const stored = localStorage.getItem(`mw:menu-bar:${MENU_BAR_IDS[id]}`);
        return stored === null ? null : stored;
    } catch (_) {
        return null;
    }
};

const readLegacyAddon = () => {
    try {
        return JSON.parse(localStorage.getItem('tw:addons')) || {};
    } catch (_) {
        return {};
    }
};

const legacyValue = id => {
    const fromMenuBar = readLegacyMenuBar(id);
    if (fromMenuBar !== null) return fromMenuBar;
    const autosave = readLegacyAddon().autosave;
    if (!autosave) return null;
    switch (id) {
    case 'enabled':
        return autosave.enabled === true && autosave.autosaveEnabled !== false;
    case 'interval':
        return autosave.interval;
    case 'notifications':
        return autosave.showNotifications;
    case 'only_when_changed':
        return autosave.saveOnlyWhenChanged;
    default:
        return null;
    }
};

const normalize = (definition, value) => {
    if (definition.type === 'boolean') return value === true || value === 'true';
    if (definition.type === 'number') {
        const number = Number(value);
        if (!Number.isFinite(number)) return definition.default;
        return Math.min(definition.max, Math.max(definition.min, number));
    }
    return definition.default;
};

const getSetting = id => {
    const definition = byId[id];
    if (!definition) return null;
    let stored = null;
    try {
        stored = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
    } catch (_) {
        return definition.default;
    }
    if (stored !== null) return normalize(definition, stored);
    const legacy = legacyValue(id);
    return legacy === null || typeof legacy === 'undefined' ?
        definition.default : normalize(definition, legacy);
};

const getSettings = () => Object.fromEntries(DEFINITIONS.map(({id}) => [id, getSetting(id)]));

const setSetting = (id, value) => {
    const definition = byId[id];
    if (!definition) return;
    const normalized = normalize(definition, value);
    try {
        localStorage.setItem(`${STORAGE_PREFIX}${id}`, String(normalized));
    } catch (_) {
        // ignore
    }
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, {detail: {id, value: normalized}}));
};

const onSettingsChanged = listener => {
    window.addEventListener(CHANGE_EVENT, listener);
    return () => window.removeEventListener(CHANGE_EVENT, listener);
};

// Saving once is not consent to background uploads. Only the settings toggle
// enables autosave; keep this export for older callers.
const enableAfterCloudSave = () => {};

export {
    STORAGE_PREFIX,
    CHANGE_EVENT,
    DEFINITIONS,
    getSetting,
    getSettings,
    setSetting,
    onSettingsChanged,
    enableAfterCloudSave
};
