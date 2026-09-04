import EventTarget from '../../addons/event-target.js';

const STORAGE_PREFIX = 'mw:stage-controls:';

const DEFINITIONS = [
    {
        id: 'mouse_position',
        default: false,
        label: 'Show mouse x/y position',
        help: 'Displays the current mouse x/y position next to the stage controls.'
    },
    {
        id: 'clone_counter',
        default: false,
        label: 'Show clone counter',
        help: 'Shows the total number of active clones next to the stage controls. ' +
            'The counter turns red when the clone limit is reached.'
    },
    {
        id: 'volume_slider',
        default: false,
        label: 'Show project volume slider',
        help: 'Adds a volume slider next to the green flag controls. Clicking its icon mutes or unmutes.'
    },
    {
        id: 'mute_ctrl_click',
        default: true,
        label: 'Ctrl+Click green flag to mute',
        help: 'Ctrl+Click (Cmd+Click on macOS) the green flag to mute or unmute the project.'
    },
    {
        id: 'screenshot',
        default: true,
        label: 'Show stage screenshot button',
        help: 'Adds a camera button to the stage header that captures the stage and copies it to the clipboard.'
    },
    {
        id: 'screenshot_notifications',
        default: true,
        label: 'Show screenshot preview',
        help: 'Shows a small preview popup after a stage screenshot is captured.'
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

const SOUND_URL_KEY = `${STORAGE_PREFIX}screenshot_sound_url`; const getScreenshotSoundUrl = () => {
    try {
        return localStorage.getItem(SOUND_URL_KEY) || '';
    } catch (e) {
        return '';
    }
};

const setScreenshotSoundUrl = value => {
    try {
        localStorage.setItem(SOUND_URL_KEY, value);
    } catch (e) {
        void e;
    }
    const event = new CustomEvent('change');
    event.settingId = 'screenshot_sound_url';
    event.value = value;
    events.dispatchEvent(event);
};

export {
    DEFINITIONS,
    getSetting,
    setSetting,
    onSettingChanged,
    getScreenshotSoundUrl,
    setScreenshotSoundUrl
};

// One-time migration from the retired stage addons (mouse-pos, clones,
// vol-slider, mute-project, canvas-screenshot) so existing users keep
// their setup. Only fills keys the user has never set natively.
const ADDON_TO_SETTING = {
    'mouse-pos': 'mouse_position',
    'clones': 'clone_counter',
    'vol-slider': 'volume_slider',
    'mute-project': 'mute_ctrl_click',
    'canvas-screenshot': 'screenshot'
};

try {
    const raw = localStorage.getItem('tw:addons');
    const oldStore = raw ? JSON.parse(raw) : null;
    if (oldStore && typeof oldStore === 'object') {
        for (const [addonId, settingId] of Object.entries(ADDON_TO_SETTING)) {
            const entry = oldStore[addonId];
            if (!entry || typeof entry !== 'object' || typeof entry.enabled !== 'boolean') {
                continue;
            }
            if (localStorage.getItem(STORAGE_PREFIX + settingId) === null) {
                localStorage.setItem(STORAGE_PREFIX + settingId, entry.enabled ? 'true' : 'false');
            }
            if (addonId === 'canvas-screenshot') {
                if (typeof entry.show_notifications === 'boolean' &&
                    localStorage.getItem(`${STORAGE_PREFIX}screenshot_notifications`) === null) {
                    localStorage.setItem(
                        `${STORAGE_PREFIX}screenshot_notifications`,
                        entry.show_notifications ? 'true' : 'false'
                    );
                }
                if (typeof entry.sound_url === 'string' && entry.sound_url &&
                    !localStorage.getItem(SOUND_URL_KEY)) {
                    localStorage.setItem(SOUND_URL_KEY, entry.sound_url);
                }
            }
        }
    }
} catch (e) {
    // ignore migration failures; defaults apply
}
