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

const readBlockedProjectPrompts = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(BLOCKED_PROJECT_PROMPTS_KEY) || '{}');
        return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
    } catch (e) {
        return {};
    }
};

const writeBlockedProjectPrompts = blocked => {
    try {
        localStorage.setItem(BLOCKED_PROJECT_PROMPTS_KEY, JSON.stringify(blocked));
    } catch (e) {
        // The in-memory set still blocks prompts until the page closes.
    }
};

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
    try {
        localStorage.removeItem(BLOCKED_PROJECT_PROMPTS_KEY);
    } catch (e) {
        // The in-memory blocks have still been cleared.
    }
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
