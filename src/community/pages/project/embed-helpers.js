import {Theme} from '../../../lib/themes';
import {CustomTheme} from '../../../lib/themes/custom-themes.js';
import {applyThemeVisuals, detectTheme} from '../../../lib/themes/themePersistance';
import {hashExtensionUrl} from '../../../lib/community/api.js';
import {isGalleryExtensionUrl} from '../../../lib/trusted-extension.js';
import {local} from '../../../modules/storage';

export const EMBED_STORAGE_PREFIX = 'mw:embed-storage:';
const EMBED_STORAGE_BLOCKED_PREFIXES = ['mw:', 'tw:'];

const PROJECT_THEME_MODE_KEY = 'mw:project-theme-mode';
export const getProjectThemeMode = () => local.readString(PROJECT_THEME_MODE_KEY) || 'all';

export const storeProjectThemeMode = mode => local.writeString(PROJECT_THEME_MODE_KEY, String(mode));

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
    for (const key of local.keys()) {
        if (key.startsWith(prefix)) local.remove(key);
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
