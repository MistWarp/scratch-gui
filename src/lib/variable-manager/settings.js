import EventTarget from '../../addons/event-target.js';

const STORAGE_PREFIX = 'mw:varmanager:';

const DEFINITIONS = [
    {
        id: 'default_filter',
        type: 'select',
        default: 'all',
        options: [
            {value: 'all', label: 'All'},
            {value: 'variables', label: 'Variables'},
            {value: 'lists', label: 'Lists'},
            {value: 'cloud', label: 'Cloud'}
        ],
        label: 'Default view',
        help: 'Which category the Variable Manager shows when it opens.'
    },
    {
        id: 'live_update',
        type: 'boolean',
        default: true,
        label: 'Live updates',
        help: 'Continuously refresh variable and list values while the project is running. ' +
            'Turning this off improves performance on large projects.'
    },
    {
        id: 'update_throttle',
        type: 'number',
        default: 50,
        min: 16,
        max: 2000,
        step: 1,
        label: 'Update interval (ms)',
        help: 'Minimum time between live value refreshes. Higher values reduce CPU usage.'
    },
    {
        id: 'variable_max_length',
        type: 'number',
        default: 1000000,
        min: 1000,
        max: 100000000,
        step: 1000,
        label: 'Variable display limit',
        help: 'Variable values longer than this many characters are hidden behind a ' +
            '"too large to display" button to keep the editor responsive.'
    },
    {
        id: 'list_max_length',
        type: 'number',
        default: 5000000,
        min: 1000,
        max: 100000000,
        step: 1000,
        label: 'List display limit',
        help: 'List contents longer than this many characters are hidden behind a ' +
            '"too large to display" button to keep the editor responsive.'
    }
];

const definitionsById = {};
const defaults = {};
for (const definition of DEFINITIONS) {
    definitionsById[definition.id] = definition;
    defaults[definition.id] = definition.default;
}

const events = new EventTarget();

const coerce = (definition, raw) => {
    if (definition.type === 'boolean') {
        if (raw === 'true') return true;
        if (raw === 'false') return false;
        return definition.default;
    }
    if (definition.type === 'number') {
        const parsed = Number(raw);
        if (!Number.isFinite(parsed)) return definition.default;
        const clampedLow = typeof definition.min === 'number' ? Math.max(definition.min, parsed) : parsed;
        return typeof definition.max === 'number' ? Math.min(definition.max, clampedLow) : clampedLow;
    }
    if (definition.type === 'select') {
        const allowed = definition.options.some(option => option.value === raw);
        return allowed ? raw : definition.default;
    }
    return raw;
};

const getSetting = id => {
    const definition = definitionsById[id];
    if (!definition) return null;
    let stored = null;
    try {
        stored = localStorage.getItem(STORAGE_PREFIX + id);
    } catch (e) {
        stored = null;
    }
    if (stored === null) return definition.default;
    return coerce(definition, stored);
};

const setSetting = (id, value) => {
    const definition = definitionsById[id];
    if (!definition) return;
    try {
        localStorage.setItem(STORAGE_PREFIX + id, String(value));
    } catch (e) {
        // ignore
    }
    const event = new CustomEvent('change');
    event.settingId = id;
    event.value = getSetting(id);
    events.dispatchEvent(event);
};

const onSettingChanged = listener => {
    events.addEventListener('change', listener);
    return () => events.removeEventListener('change', listener);
};

export {
    DEFINITIONS,
    getSetting,
    setSetting,
    onSettingChanged
};
