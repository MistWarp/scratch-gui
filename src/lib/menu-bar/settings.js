const STORAGE_PREFIX = 'mw:menu-bar:';
const CHANGE_EVENT = 'mw-menu-bar-settings-changed';

const DEFINITIONS = [
    {
        id: 'menu_labels',
        type: 'select',
        default: 'both',
        label: 'Menu item labels',
        options: [
            {value: 'both', label: 'Icons and labels'},
            {value: 'icons', label: 'Icons only'},
            {value: 'labels', label: 'Labels only'}
        ]
    },
    {
        id: 'show_block_count',
        type: 'boolean',
        default: true,
        label: 'Show block count'
    },
    {
        id: 'show_costume_count',
        type: 'boolean',
        default: false,
        label: 'Show costume count'
    },
    {
        id: 'show_sound_count',
        type: 'boolean',
        default: false,
        label: 'Show sound count'
    },
    {
        id: 'show_complexity_score',
        type: 'boolean',
        default: false,
        label: 'Show complexity score'
    },
    {
        id: 'show_media_recorder',
        type: 'boolean',
        default: false,
        label: 'Show project video recorder'
    },
    {
        id: 'autosave_enabled',
        type: 'boolean',
        default: false,
        label: 'Enable autosave'
    },
    {
        id: 'autosave_interval',
        type: 'number',
        default: 5,
        min: 1,
        max: 60,
        label: 'Autosave interval (minutes)'
    },
    {
        id: 'autosave_notifications',
        type: 'boolean',
        default: true,
        label: 'Show autosave notifications'
    },
    {
        id: 'autosave_only_when_changed',
        type: 'boolean',
        default: true,
        label: 'Only autosave changed projects'
    }
];

const byId = Object.fromEntries(DEFINITIONS.map(definition => [definition.id, definition]));

const readLegacy = () => {
    try {
        return JSON.parse(localStorage.getItem('tw:addons')) || {};
    } catch (_) {
        return {};
    }
};

const legacyValue = id => {
    const addons = readLegacy();
    const blockCount = addons['block-count'] || addons['tw-project-info'];
    const autosave = addons.autosave;

    switch (id) {
    case 'menu_labels':
        return addons['custom-menu-bar']?.enabled ? addons['custom-menu-bar']['menu-labels'] : null;
    case 'show_block_count':
        return blockCount ? blockCount.enabled !== false && blockCount.hide_block_count !== true : null;
    case 'show_costume_count':
    case 'show_sound_count':
    case 'show_complexity_score':
        return blockCount?.[id];
    case 'show_media_recorder':
        return typeof addons.mediarecorder?.enabled === 'boolean' ? addons.mediarecorder.enabled : null;
    case 'autosave_enabled':
        return autosave ? autosave.enabled === true && autosave.autosaveEnabled !== false : null;
    case 'autosave_interval':
        return autosave?.interval;
    case 'autosave_notifications':
        return autosave?.showNotifications;
    case 'autosave_only_when_changed':
        return autosave?.saveOnlyWhenChanged;
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
    return definition.options.some(option => option.value === value) ? value : definition.default;
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
        require('../rotur/cloud-sync.js').notifyLocalChange();
    } catch (_) {
        // ignore
    }
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, {detail: {id, value: normalized}}));
};

const onSettingsChanged = listener => {
    window.addEventListener(CHANGE_EVENT, listener);
    return () => window.removeEventListener(CHANGE_EVENT, listener);
};

export {
    STORAGE_PREFIX,
    CHANGE_EVENT,
    DEFINITIONS,
    getSetting,
    getSettings,
    setSetting,
    onSettingsChanged
};
