import {customThemeManager} from './custom-themes';
import {applyThemeVisuals, detectTheme, THEME_CHANGE_EVENT} from './themePersistance';

// Keep the storage wire format used by community embeds, while also accepting
// structured-cloned objects from hosts that do not serialize their settings.
const serializeTheme = value => {
    if (value === null || value === '') return null;
    if (value === 'light' || value === 'dark') return value;
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Invalid embed theme');
    }
    return JSON.stringify(parsed);
};

const serializeCustomThemes = value => {
    if (value === null || value === '') return null;
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) throw new Error('Invalid embed custom themes');
    return JSON.stringify(parsed);
};

const applyEmbedThemeMessage = event => {
    if (event.source !== window.parent || !event.data || event.data.type !== 'mw:apply-theme') return;
    try {
        const theme = serializeTheme(event.data.theme);
        const hasCustomThemes = Object.prototype.hasOwnProperty.call(event.data, 'customThemes');
        // Validate both fields before changing storage.
        const customThemes = hasCustomThemes ? serializeCustomThemes(event.data.customThemes) : null;
        if (hasCustomThemes) {
            if (customThemes === null) {
                localStorage.removeItem('tw:custom-themes');
            } else {
                localStorage.setItem('tw:custom-themes', customThemes);
            }
            customThemeManager.loadCustomThemes(true);
        }
        if (theme === null) {
            localStorage.removeItem('tw:theme');
        } else {
            localStorage.setItem('tw:theme', theme);
        }
        applyThemeVisuals(detectTheme());
        // Storage writes in this window do not emit a storage event. Notify the
        // mounted theme manager so Redux consumers receive the same theme.
        window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
    } catch (e) {
        // Ignore malformed messages without interrupting the project.
    }
};

export {applyEmbedThemeMessage};
