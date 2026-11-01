import {editorRoot} from '../../lib/account/origins.js';
import {STUDENT_HINT_PARAM, isStudentSession} from '../../lib/rotur/student-flag.js';
import {local} from '../../modules/storage';

export const editorUrl = ({
    chat, clone, platformProject, scratchProject, projectJson, assets, starter, restore, collaborate, from
} = {}) => {
    const root = editorRoot();
    const params = new URLSearchParams();
    if (isStudentSession()) params.set(STUDENT_HINT_PARAM, 'student');
    if (collaborate) params.set('collaborate', '1');
    if (from && (platformProject || scratchProject)) params.set('from', from);
    if (platformProject || scratchProject) {
        const query = params.toString();
        return `${root}${query ? `?${query}` : ''}#${platformProject ? `mw-${platformProject}` : scratchProject}`;
    }
    if (starter) params.set('starter', starter);
    if (restore) params.set('restore', String(restore));
    if (clone) params.set('clone', clone);
    if (projectJson) params.set('project_url', projectJson);
    if (assets) params.set('mw_assets', assets);
    if (chat) params.set('chat', '1');
    const query = params.toString();
    return `${root}${query ? `?${query}` : ''}`;
};

const readStored = key => local.readString(key);

const EMBED_STORAGE_PREFIX = 'mw:embed-storage:';
const EMBED_STORAGE_SEED_LIMIT = 32000;

const storageForProject = projectId => {
    if (!projectId) return null;
    const id = String(projectId);
    const seed = {};
    let size = 0;
    const blockedPrefixes = [
        'mw:',
        'tw:'
    ];
    const isBlockedStorageKey = key => blockedPrefixes.some(prefix => key.startsWith(prefix));
    const prefix = `${EMBED_STORAGE_PREFIX}${id}:`;
    for (const key of local.keys()) {
        if (!key.startsWith(prefix)) continue;
        const name = key.slice(prefix.length);
        if (isBlockedStorageKey(name)) continue;
        const value = readStored(key);
        if (value === null) continue;
        const nextSize = size + name.length + value.length + 6;
        if (nextSize > EMBED_STORAGE_SEED_LIMIT) return null;
        seed[name] = value;
        size = nextSize;
    }
    return Object.keys(seed).length ? seed : null;
};

let themeCustomCacheKey;
let themeCustomCacheValue = '';
export const themeCustomFor = theme => {
    const library = readStored('tw:custom-themes') || '[]';
    const cacheKey = `${theme}\n${library}`;
    if (cacheKey !== themeCustomCacheKey) {
        themeCustomCacheKey = cacheKey;
        themeCustomCacheValue = '';
        try {
            const uuid = JSON.parse(theme).customThemeUuid;
            const parsed = JSON.parse(library);
            const active = Array.isArray(parsed) ? parsed.filter(entry => entry.uuid === uuid) : [];
            if (active.length) themeCustomCacheValue = JSON.stringify(active);
        } catch (e) {
            // leave theme_custom out rather than shipping the whole library
        }
    }
    return themeCustomCacheValue;
};

export const embedUrl = (project, {
    unsandboxed = false,
    applyProjectTheme = true,
    bridge = true,
    profilePreview = false,
    persistStorage = false
} = {}) => {
    const params = new URLSearchParams();
    params.set('project_url', project.projectJsonUrl);
    params.set('mw_assets', project.assetsBase);
    if (bridge) params.set('mw_bridge', '1');
    if (profilePreview) params.set('mw_profile_preview', '1');
    if (project.id) params.set('platform_project', project.id);
    if (persistStorage && project.id) {
        params.set('mw_storage', '1');
        const seed = storageForProject(project.id);
        if (seed) {
            try {
                params.set('mw_storage_seed', JSON.stringify(seed));
            } catch (e) {
                // ignore
            }
        }
    }
    if (!applyProjectTheme) {
        params.set('apply_project_theme', '0');
    }
    const theme = readStored('tw:theme');
    if (theme) {
        params.set('theme', theme);
        if (theme.includes('custom')) {
            const themeCustom = themeCustomFor(theme);
            if (themeCustom) params.set('theme_custom', themeCustom);
        }
    }
    if (unsandboxed) params.set('allow_all', '1');
    return `/embed.html?${params.toString()}`;
};

const normalizeVanitySlug = slug => {
    if (typeof slug !== 'string') return '';
    const trimmed = slug.trim();
    if (!trimmed) return '';
    if (/^[A-Za-z0-9-]{3,40}$/.test(trimmed)) return trimmed;
    return '';
};

export const projectUrl = (idOrProject, maybeSlug) => {
    let id = idOrProject;
    let slug = maybeSlug;
    if (idOrProject && typeof idOrProject === 'object') {
        id = idOrProject.id ?? idOrProject.projectId ?? idOrProject.project_id;
        slug = idOrProject.vanitySlug ?? idOrProject.slug ?? maybeSlug;
    }
    const vanity = normalizeVanitySlug(slug);
    if (vanity) return `/p/${encodeURIComponent(vanity)}`;
    return `/project/${id}`;
};
