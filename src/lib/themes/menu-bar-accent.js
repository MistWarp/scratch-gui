const ACCENT_MENU_BAR_KEY = 'mw:accent-menu-bar';
const COMPACT_SAVE_KEY = 'mw:compact-save';
const MENU_BAR_TEXT_KEY = 'mw:menu-bar-text';

const MENU_BAR_TEXT_OPTIONS = ['auto', 'light', 'dark'];
const MENU_BAR_TEXT_DEFAULT = 'auto';

const MENU_BAR_TEXT_LIGHT = '#ffffff';
const MENU_BAR_TEXT_DARK = '#2e2e2e';

const notifyCloudSync = () => {
    try {
        require('../rotur/cloud-sync.js').notifyLocalChange();
    } catch (_) {
        // cloud sync optional
    }
};

const getAccentMenuBar = () => {
    try {
        return localStorage.getItem(ACCENT_MENU_BAR_KEY) !== 'false';
    } catch (_) {
        return true;
    }
};

const setAccentMenuBar = enabled => {
    try {
        localStorage.setItem(ACCENT_MENU_BAR_KEY, enabled ? 'true' : 'false');
    } catch (_) {
        // ignore
    }
    notifyCloudSync();
};

const getMenuBarText = () => {
    try {
        const stored = localStorage.getItem(MENU_BAR_TEXT_KEY);
        return MENU_BAR_TEXT_OPTIONS.includes(stored) ? stored : MENU_BAR_TEXT_DEFAULT;
    } catch (_) {
        return MENU_BAR_TEXT_DEFAULT;
    }
};

const setMenuBarText = value => {
    const next = MENU_BAR_TEXT_OPTIONS.includes(value) ? value : MENU_BAR_TEXT_DEFAULT;
    try {
        localStorage.setItem(MENU_BAR_TEXT_KEY, next);
    } catch (_) {
        // ignore
    }
    notifyCloudSync();
};

const getCompactSave = () => {
    try {
        return localStorage.getItem(COMPACT_SAVE_KEY) === 'true';
    } catch (_) {
        return false;
    }
};

const applyCompactSave = () => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('mw-compact-save', getCompactSave());
};

const setCompactSave = enabled => {
    try {
        localStorage.setItem(COMPACT_SAVE_KEY, enabled ? 'true' : 'false');
    } catch (_) {
        // ignore
    }
    applyCompactSave();
    notifyCloudSync();
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
