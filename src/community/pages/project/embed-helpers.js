import {Theme} from '../../../lib/themes';
import {CustomTheme} from '../../../lib/themes/custom-themes.js';
import {applyThemeVisuals, detectTheme} from '../../../lib/themes/themePersistance';
import {hashExtensionUrl} from '../../../lib/community/api.js';
import {isGalleryExtensionUrl} from '../../../lib/trusted-extension.js';

export const EMBED_STORAGE_PREFIX = 'mw:embed-storage:';
const EMBED_STORAGE_BLOCKED_PREFIXES = ['mw:', 'tw:'];

const PROJECT_THEME_MODE_KEY = 'mw:project-theme-mode';
export const getProjectThemeMode = () => {
    try {
        return localStorage.getItem(PROJECT_THEME_MODE_KEY) || 'all';
    } catch (e) {
        return 'all';
    }
};

export const buildProjectTheme = payload => {
    try {
        if (payload && payload.kind === 'custom' && payload.data) {
            return CustomTheme.import(payload.data);
        }
        if (payload && payload.kind === 'standard' && payload.data) {
            const d = payload.data;
            return new Theme(d.accent, d.gui, d.blocks, d.menuBarAlign, d.wallpaper, d.fonts, null, d.appearance || {});
        }
    } catch (e) {
        // ignore malformed payloads
    }
    return null;
};

export const clearProjectStorage = projectId => {
    if (!projectId) return;
    const prefix = `${EMBED_STORAGE_PREFIX}${String(projectId)}:`;
    try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) keys.push(key);
        }
        for (const key of keys) {
            localStorage.removeItem(key);
        }
    } catch (e) {
        // ignore
    }
};

export const isBlockedProjectStorageKey = key => EMBED_STORAGE_BLOCKED_PREFIXES.some(prefix => key.startsWith(prefix));

export const restoreUserTheme = () => {
    try {
        applyThemeVisuals(detectTheme());
    } catch (e) {
        // ignore
    }
};

export const getCustomExtensions = async (urls, trustedExtensions) => {
    const custom = (urls || []).filter(url => typeof url === 'string' && !isGalleryExtensionUrl(url));
    const trusted = new Set(trustedExtensions || []);
    const hashes = await Promise.all(custom.map(hashExtensionUrl));
    return custom.filter((url, index) => !trusted.has(hashes[index]));
};

export const analyzeBlocks = summary => ({total: Number(summary && summary.total) || 0});
