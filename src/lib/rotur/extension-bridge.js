import {getRotur, ensureScopes} from './client.js';

const GRANTS_KEY = 'mw:rotur-grants';

// Per-project consent grants: {[projectKey]: string[] scopes}. The key is the
// platform project id when known, else a name-based fallback.
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

// Dispatch a dotted method path (e.g. "me.transfer", "posts.feed",
// "socket.setStatus") on the shared Rotur client. The token lives inside the
// client and is never returned. socket.* methods lazily connect the status
// websocket first.
const callRotur = async (method, args) => {
    const rotur = getRotur();
    if (!rotur.loggedIn) {
        throw new Error('Log in to Rotur to use this block');
    }
    const parts = method.split('.');
    if (parts[0] === 'socket') {
        if (!rotur.socket || !rotur.socket.connected) {
            await rotur.connectSocket();
        }
        const fn = rotur.socket && rotur.socket[parts[1]];
        if (typeof fn !== 'function') {
            throw new Error(`Unknown Rotur socket method: ${method}`);
        }
        return fn.apply(rotur.socket, args);
    }
    let ctx = rotur;
    let fn = rotur;
    for (const part of parts) {
        ctx = fn;
        fn = fn && fn[part];
    }
    if (typeof fn !== 'function') {
        throw new Error(`Unknown Rotur method: ${method}`);
    }
    return fn.apply(ctx, args || []);
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
