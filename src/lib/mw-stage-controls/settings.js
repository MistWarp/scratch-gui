import EventTarget from '../../addons/event-target.js';
import {local, readLegacyAddonSettings} from '../../modules/storage';

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
    const stored = local.readString(STORAGE_PREFIX + id);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return defaults[id] || false;
};

const setSetting = (id, value) => {
    local.writeBoolean(STORAGE_PREFIX + id, !!value);
    const event = new CustomEvent('change');
    event.settingId = id;
    event.value = value;
    events.dispatchEvent(event);
};

const onSettingChanged = listener => {
    events.addEventListener('change', listener);
    return () => events.removeEventListener('change', listener);
};

const SOUND_URL_KEY = `${STORAGE_PREFIX}screenshot_sound_url`;

const getScreenshotSoundUrl = () => local.readString(SOUND_URL_KEY) || '';

const setScreenshotSoundUrl = value => {
    local.writeString(SOUND_URL_KEY, String(value));
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

const migrateRetiredAddons = () => {
    const oldStore = readLegacyAddonSettings();
    for (const [addonId, settingId] of Object.entries(ADDON_TO_SETTING)) {
        const entry = oldStore[addonId];
        if (!entry || typeof entry !== 'object' || typeof entry.enabled !== 'boolean') {
            continue;
        }
        if (local.readString(STORAGE_PREFIX + settingId) === null &&
            !local.writeBoolean(STORAGE_PREFIX + settingId, entry.enabled)) {
            return;
        }
        if (addonId === 'canvas-screenshot') {
            if (typeof entry.show_notifications === 'boolean' &&
                local.readString(`${STORAGE_PREFIX}screenshot_notifications`) === null &&
                !local.writeBoolean(`${STORAGE_PREFIX}screenshot_notifications`, entry.show_notifications)) {
                return;
            }
            if (typeof entry.sound_url === 'string' && entry.sound_url &&
                !local.readString(SOUND_URL_KEY) &&
                !local.writeString(SOUND_URL_KEY, entry.sound_url)) {
                return;
            }
        }
    }
};

migrateRetiredAddons();
