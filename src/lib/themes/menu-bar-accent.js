import {local} from '../../modules/storage';

const ACCENT_MENU_BAR_KEY = 'mw:accent-menu-bar';
const COMPACT_SAVE_KEY = 'mw:compact-save';
const MENU_BAR_TEXT_KEY = 'mw:menu-bar-text';

const MENU_BAR_TEXT_OPTIONS = ['auto', 'light', 'dark'];
const MENU_BAR_TEXT_DEFAULT = 'auto';

const MENU_BAR_TEXT_LIGHT = '#ffffff';
const MENU_BAR_TEXT_DARK = '#2e2e2e';

const notifyCloudSync = part => {
    try {
        require('../rotur/cloud-sync.js').notifyLocalChange(`menuBar.${part}`);
    } catch (_) {
        // cloud sync optional
    }
};

const getAccentMenuBar = () => local.readString(ACCENT_MENU_BAR_KEY) !== 'false';

const setAccentMenuBar = enabled => {
    local.writeBoolean(ACCENT_MENU_BAR_KEY, Boolean(enabled));
    notifyCloudSync('accent');
};

const getMenuBarText = () => {
    const stored = local.readString(MENU_BAR_TEXT_KEY);
    return MENU_BAR_TEXT_OPTIONS.includes(stored) ? stored : MENU_BAR_TEXT_DEFAULT;
};

const setMenuBarText = value => {
    const next = MENU_BAR_TEXT_OPTIONS.includes(value) ? value : MENU_BAR_TEXT_DEFAULT;
    local.writeString(MENU_BAR_TEXT_KEY, next);
    notifyCloudSync('text');
};

const getCompactSave = () => local.readString(COMPACT_SAVE_KEY) === 'true';

const applyCompactSave = () => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('mw-compact-save', getCompactSave());
};

const setCompactSave = enabled => {
    local.writeBoolean(COMPACT_SAVE_KEY, Boolean(enabled));
    applyCompactSave();
    notifyCloudSync('compactSave');
};

applyCompactSave();

export {
    ACCENT_MENU_BAR_KEY,
    COMPACT_SAVE_KEY,
    getCompactSave,
    setCompactSave,
    applyCompactSave,
    MENU_BAR_TEXT_KEY,
    MENU_BAR_TEXT_OPTIONS,
    MENU_BAR_TEXT_DEFAULT,
    MENU_BAR_TEXT_LIGHT,
    MENU_BAR_TEXT_DARK,
    getAccentMenuBar,
    setAccentMenuBar,
    getMenuBarText,
    setMenuBarText
};
