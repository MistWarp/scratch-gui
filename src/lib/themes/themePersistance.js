import {BLOCKS_CUSTOM, Theme, ACCENT_DEFAULT, GUI_DEFAULT, BLOCKS_THREE, MENUBAR_ALIGN_DEFAULT} from './index.js';
import {customThemeManager, CustomTheme} from './custom-themes.js';
import {applyGuiColors} from './guiHelpers.js';

const matchMedia = query => (window.matchMedia ? window.matchMedia(query) : null);
const PREFERS_HIGH_CONTRAST_QUERY = matchMedia('(prefers-contrast: more)');
const PREFERS_DARK_QUERY = matchMedia('(prefers-color-scheme: dark)');

const STORAGE_KEY = 'tw:theme';

/**
 * @returns {Theme} detected theme
 */
const systemPreferencesTheme = () => {
    const defaultsAvailable = Theme && Theme.defaults && Theme.defaults.light;
    if (defaultsAvailable) {
        if (PREFERS_HIGH_CONTRAST_QUERY && PREFERS_HIGH_CONTRAST_QUERY.matches) {
            return Theme.defaults.highContrast;
        }
        if (PREFERS_DARK_QUERY && PREFERS_DARK_QUERY.matches) {
            return Theme.defaults.dark;
        }
        return Theme.defaults.light;
    }

    // Fallback: construct a minimal Theme if Theme.defaults isn't initialized yet
    if (PREFERS_HIGH_CONTRAST_QUERY && PREFERS_HIGH_CONTRAST_QUERY.matches) {
        return new Theme(ACCENT_DEFAULT, GUI_DEFAULT, BLOCKS_THREE, MENUBAR_ALIGN_DEFAULT);
    }
    if (PREFERS_DARK_QUERY && PREFERS_DARK_QUERY.matches) {
        return new Theme(ACCENT_DEFAULT, 'dark', BLOCKS_THREE, MENUBAR_ALIGN_DEFAULT);
    }
    return new Theme(ACCENT_DEFAULT, GUI_DEFAULT, BLOCKS_THREE, MENUBAR_ALIGN_DEFAULT);
};

/**
 * @param {function} onChange callback; no guarantees about arguments
 * @returns {function} call to remove event listeners to prevent memory leak
 */
const onSystemPreferenceChange = onChange => {
    if (
        !PREFERS_HIGH_CONTRAST_QUERY ||
        !PREFERS_DARK_QUERY ||
        // Some old browsers don't support addEventListener on media queries
        !PREFERS_HIGH_CONTRAST_QUERY.addEventListener ||
        !PREFERS_DARK_QUERY.addEventListener
    ) {
        return () => {};
    }

    PREFERS_HIGH_CONTRAST_QUERY.addEventListener('change', onChange);
    PREFERS_DARK_QUERY.addEventListener('change', onChange);

    return () => {
        PREFERS_HIGH_CONTRAST_QUERY.removeEventListener('change', onChange);
        PREFERS_DARK_QUERY.removeEventListener('change', onChange);
    };
};

/**
 * @returns {Theme} the theme
 */
const detectTheme = () => {
    const systemPreferences = systemPreferencesTheme();

    try {
        const local = localStorage.getItem(STORAGE_KEY);

        // Migrate legacy preferences
        if (local === 'dark') {
            return Theme.defaults.dark;
        }
        if (local === 'light') {
            return Theme.defaults.light;
        }

        const parsed = JSON.parse(local);
        
        // Check if this is a custom theme
        if (parsed.isCustom && parsed.customThemeUuid) {
            const customTheme = customThemeManager.getTheme(parsed.customThemeUuid);
            if (customTheme) {
                return customTheme;
            }
            // Fall back to system preferences if custom theme not found
            console.warn(`Custom theme ${parsed.customThemeUuid} not found, falling back to system preferences`);
        }

        if (parsed.inlineCustomTheme && typeof parsed.inlineCustomTheme === 'object') {
            try {
                return CustomTheme.import(parsed.inlineCustomTheme);
            } catch (e) {
                console.warn('Failed to import inline custom theme, falling back to system preferences', e);
            }
        }
        
        // Any invalid values in storage will be handled by Theme itself
        const wallpaper = parsed.wallpaper || {url: '', opacity: 0.3, darkness: 0, gridVisible: true, history: []};
        
        // Add backward compatibility for gridVisible
        if (typeof wallpaper.gridVisible === 'undefined') {
            wallpaper.gridVisible = true;
        }

        return new Theme(
            parsed.accent || systemPreferences.accent,
            parsed.gui || systemPreferences.gui,
            parsed.blocks || systemPreferences.blocks,
            parsed.menuBarAlign || systemPreferences.menuBarAlign,
            wallpaper,
            parsed.fonts || {system: [], google: [], history: []}
        );
    } catch (e) {
        // ignore
    }

    return systemPreferences;
};

/**
 * @param {Theme} theme the theme
 */
const persistTheme = theme => {
    const systemPreferences = systemPreferencesTheme();
    const nonDefaultSettings = {};

    // Handle custom themes differently
    if (theme instanceof CustomTheme) {
        const isSavedCustomTheme = !!customThemeManager.getTheme(theme.uuid);
        if (isSavedCustomTheme) {
            nonDefaultSettings.customThemeUuid = theme.uuid;
            nonDefaultSettings.isCustom = true;
        } else {
            // Modified/unselected custom theme: persist inline so it can be restored.
            nonDefaultSettings.inlineCustomTheme = theme.export();
        }
    } else {
        if (theme.accent !== systemPreferences.accent) {
            nonDefaultSettings.accent = theme.accent;
        }
        if (theme.gui !== systemPreferences.gui) {
            nonDefaultSettings.gui = theme.gui;
        }
        // custom blocks are managed by addon at runtime, don't save here
        if (theme.blocks !== systemPreferences.blocks && theme.blocks !== BLOCKS_CUSTOM) {
            nonDefaultSettings.blocks = theme.blocks;
        }
        if (theme.menuBarAlign !== systemPreferences.menuBarAlign) {
            nonDefaultSettings.menuBarAlign = theme.menuBarAlign;
        }
        // Always save wallpaper settings if they exist
        if (theme.wallpaper && (theme.wallpaper.url || theme.wallpaper.history.length > 0)) {
            nonDefaultSettings.wallpaper = theme.wallpaper;
        }

        // Always save fonts settings if they exist
        if (theme.fonts &&
            (theme.fonts.system.length > 0 ||
             theme.fonts.google.length > 0 ||
             theme.fonts.history.length > 0)) {
            nonDefaultSettings.fonts = theme.fonts;
        }
    }

    if (Object.keys(nonDefaultSettings).length === 0) {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            // ignore
        }
    } else {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(nonDefaultSettings));
        } catch (e) {
            // ignore
        }
    }
};

/**
 * Apply a theme to the GUI pipeline and persist settings.
 * This centralizes application so loading and manual changes behave the same.
 * @param {Theme} theme the theme
 */
const applyTheme = theme => {
    try {
        applyGuiColors(theme);
    } catch (e) {
        // Don't let GUI application failures block persistence
        console.error('Failed to apply GUI colors for theme:', e);
    }

    persistTheme(theme);
};

try {
    applyTheme(detectTheme());
} catch (e) {
    console.error('Failed to apply theme:', e);
}

export {
    onSystemPreferenceChange,
    detectTheme,
    persistTheme,
    applyTheme
};
