import {getRotur, ensureScopes} from './client.js';
import {invokeProjectMethod} from './project-methods.js';

const GRANTS_KEY = 'mw:rotur-grants';

// Per-project consent grants: {[projectKey]: string[] scopes}. The key is the
// platform project id when known, else a name-based fallback. Hosts that know
// the project (the community project page) pass meta.projectId themselves, so
// the project cannot pick which grant it reads.
const readGrants = () => {
    try {
        return JSON.parse(localStorage.getItem(GRANTS_KEY) || '{}') || {};
    } catch (_) {
        return {};
    }
};

const writeGrants = grants => {
    try {
        localStorage.setItem(GRANTS_KEY, JSON.stringify(grants));
    } catch (_) {
        // ignore private-mode / quota failures
    }
};

const projectKey = meta => {
    if (meta && meta.projectId) {
        return `id:${meta.projectId}`;
    }
    try {
        const stored = sessionStorage.getItem('mw:mistwarp-current-project');
        if (stored) {
            return `id:${stored}`;
        }
    } catch (_) {
        // ignore
    }
    return `name:${(meta && meta.name) || 'untitled'}`;
};

const grantedScopesFor = meta => {
    const grants = readGrants();
    const value = grants[projectKey(meta)];
    return Array.isArray(value) ? value : [];
};

const saveGrant = (meta, scopes) => {
    const grants = readGrants();
    grants[projectKey(meta)] = [...new Set(scopes)];
    writeGrants(grants);
};

// True if every requested scope is already granted for this project.
const hasFullGrant = (meta, scopes) => {
    const granted = new Set(grantedScopesFor(meta));
    return scopes.every(scope => granted.has(scope));
};

// Broaden the session to cover the granted scopes, then persist the grant.
const commitGrant = async (meta, scopes) => {
    await ensureScopes(scopes);
    saveGrant(meta, [...new Set([...grantedScopesFor(meta), ...scopes])]);
};

// Per-project decisions on whether a project may show activity on the user's
// Rotur profile: {[projectKey]: boolean}. Global default lives in settings
// (activitySharing: 'ask' | 'all' | 'off').
const ACTIVITY_GRANTS_KEY = 'mw:rotur-activity-grants';

const readActivityGrants = () => {
    try {
        return JSON.parse(localStorage.getItem(ACTIVITY_GRANTS_KEY) || '{}') || {};
    } catch (_) {
        return {};
    }
};

const writeActivityGrants = grants => {
    try {
        localStorage.setItem(ACTIVITY_GRANTS_KEY, JSON.stringify(grants));
    } catch (_) {
        // ignore
    }
};

// Whether an activity method (socket presence) may run right now, given the
// global mode and any remembered per-project decision. Returns true / false, or
// null when undecided (the caller should ask and then persist a decision).
const activityAllowed = (mode, key) => {
    if (mode === 'off') {
        return false;
    }
    if (mode === 'all') {
        return true;
    }
    const grants = readActivityGrants();
    const value = grants[key];
    return typeof value === 'boolean' ? value : null;
};

const rememberActivityDecision = (key, allowed) => {
    const grants = readActivityGrants();
    grants[key] = allowed;
    writeActivityGrants(grants);
};

const isActivityMethod = method => (
    method === 'socket.addActivity' ||
    method === 'socket.setStatus' ||
    method === 'socket.removeActivity'
);

// Run an allowlisted Rotur method (see project-methods.js) on the shared
// client. The token lives inside the client and is never returned. Anything
// outside the allowlist, such as "_http.getToken", is rejected.
const callRotur = (method, args) => {
    const rotur = getRotur();
    if (!rotur.loggedIn) {
        return Promise.reject(new Error('Log in to Rotur to use this block'));
    }
    return invokeProjectMethod(rotur, method, args || []);
};

export {
    grantedScopesFor,
    hasFullGrant,
    commitGrant,
    callRotur,
    activityAllowed,
    rememberActivityDecision,
    readActivityGrants,
    writeActivityGrants,
    isActivityMethod
};
