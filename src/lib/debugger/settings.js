import EventTarget from '../../addons/event-target.js';

const STORAGE_PREFIX = 'mw:debugger:';

const DEFINITIONS = [
    {
        id: 'stage_pause_button',
        default: true,
        label: 'Show pause button in stage controls',
        help: 'Adds a pause/play button between the green flag and stop button that freezes the project ' +
            'in place. The project can also be paused with Alt+X (Option+X on macOS).'
    },
    {
        id: 'stage_step_button',
        default: true,
        label: 'Show frame step button while paused',
        help: 'While the project is paused, adds a button that advances it by exactly one frame so you can ' +
            'watch behavior change step by step.'
    },
    {
        id: 'thread_glow',
        default: true,
        label: 'Highlight running blocks',
        help: 'Draws a colored glow around the blocks that are currently being executed so you can follow ' +
            'which scripts are running.'
    },
    {
        id: 'log_clear_greenflag',
        default: false,
        label: 'Clear logs on green flag',
        help: 'Empties the debugger log every time the green flag is clicked.'
    },
    {
        id: 'log_greenflag',
        default: false,
        label: 'Log green flag clicks',
        help: 'Adds a debugger log entry each time the green flag is clicked.'
    },
    {
        id: 'log_clone_create',
        default: false,
        label: 'Log clone creation',
        help: 'Adds a debugger log entry each time a sprite creates a clone.'
    },
    {
        id: 'log_failed_clone_creation',
        default: true,
        label: 'Log when the clone limit is exceeded',
        help: 'Adds a debugger warning when a clone cannot be created because the 300 clone limit is reached.'
    },
    {
        id: 'log_broadcasts',
        default: false,
        label: 'Log broadcasts',
        help: 'Adds a debugger log entry each time a broadcast is received.'
    },
    {
        id: 'fancy_graphs',
        default: false,
        label: 'Animated graphs (may affect performance)',
        help: 'Smoothly animates the performance and memory graphs. Turning this off can improve performance ' +
            'on slower devices.'
    }
];

const defaults = {};
for (const definition of DEFINITIONS) {
    defaults[definition.id] = definition.default;
}

const events = new EventTarget();

const getSetting = id => {
    const stored = localStorage.getItem(STORAGE_PREFIX + id);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return defaults[id] || false;
};

const setSetting = (id, value) => {
    try {
        localStorage.setItem(STORAGE_PREFIX + id, value ? 'true' : 'false');
    } catch (e) {
        void e;
    }
    const event = new CustomEvent('change');
    event.settingId = id;
    event.value = value;
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
