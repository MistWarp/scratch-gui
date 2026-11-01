import {local} from '../modules/storage';

const BLOCKED_PROJECT_PROMPTS_KEY = 'mw:blocked-project-prompts';
const PLATFORM_PROJECT_KEY = 'mw:mistwarp-current-project';
const volatileBlockedProjectPrompts = new Set();

const storedPlatformProjectId = () => {
    try {
        const stored = sessionStorage.getItem(PLATFORM_PROJECT_KEY);
        if (!stored) return '';
        try {
            const project = JSON.parse(stored);
            return project && typeof project === 'object' ? String(project.id || '') : String(project || '');
        } catch (e) {
            return stored;
        }
    } catch (e) {
        return '';
    }
};

const projectPromptKey = project => {
    const details = project || {};
    const explicitId = details.id || details.projectId;
    if (explicitId) return `id:${String(explicitId)}`;

    const platformId = storedPlatformProjectId();
    if (platformId) return `id:${platformId}`;

    const name = String(details.name || details.projectName || '').trim();
    return name ? `name:${name}` : '';
};

const isPlainObject = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const readBlockedProjectPrompts = () => local.readJSON(BLOCKED_PROJECT_PROMPTS_KEY, {}, isPlainObject);

const writeBlockedProjectPrompts = blocked => local.writeJSON(BLOCKED_PROJECT_PROMPTS_KEY, blocked);

const isProjectPromptBlocked = project => {
    const key = projectPromptKey(project);
    return Boolean(key && (volatileBlockedProjectPrompts.has(key) || readBlockedProjectPrompts()[key]));
};

const blockProjectPrompts = project => {
    const key = projectPromptKey(project);
    if (!key) return '';
    volatileBlockedProjectPrompts.add(key);
    const blocked = readBlockedProjectPrompts();
    const name = String((project && (project.name || project.projectName)) || '').trim();
    blocked[key] = name ? {name} : true;
    writeBlockedProjectPrompts(blocked);
    return key;
};

const unblockProjectPrompts = key => {
    if (!key) return false;
    volatileBlockedProjectPrompts.delete(key);
    const blocked = readBlockedProjectPrompts();
    if (!Object.prototype.hasOwnProperty.call(blocked, key)) return false;
    delete blocked[key];
    writeBlockedProjectPrompts(blocked);
    return true;
};

const clearBlockedProjectPrompts = () => {
    volatileBlockedProjectPrompts.clear();
    local.remove(BLOCKED_PROJECT_PROMPTS_KEY);
};

export {
    BLOCKED_PROJECT_PROMPTS_KEY,
    projectPromptKey,
    readBlockedProjectPrompts,
    isProjectPromptBlocked,
    blockProjectPrompts,
    unblockProjectPrompts,
    clearBlockedProjectPrompts
};
