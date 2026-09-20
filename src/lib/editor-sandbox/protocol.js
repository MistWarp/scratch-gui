// This module contains no account data and may be imported in either realm.
export const CHANNEL = 'mw:editor-sandbox';
export const SANDBOX = 'allow-scripts allow-downloads allow-pointer-lock allow-modals';
export const RUNTIME_CSP = `sandbox ${SANDBOX}`;
export const isIsolatedEditor = () => typeof window !== 'undefined' &&
    window.parent !== window && window.origin === 'null';

export const publicIdentity = state => ({
    status: state && state.user ? 'ready' : 'idle',
    user: state && state.user ? {
        username: String(state.user.username || ''),
        id: state.user.id === null ? null : String(state.user.id || ''),
        avatarUrl: String(state.user.avatarUrl || '')
    } : null
});

export const projectFromURL = url => {
    const parsed = new URL(url);
    const hash = /^#mw-([a-zA-Z0-9_-]+)$/.exec(parsed.hash);
    const id = hash ? hash[1] : parsed.searchParams.get('platform_project');
    return id && /^[a-zA-Z0-9_-]+$/.test(id) ? id : null;
};

// Never use an extension-supplied URL, method name or project ID as authority.
// An allowed API request still goes through the host's validation/consent below.
export const classifyRequest = (path, method, projectId) => {
    if (typeof path !== 'string' || path.length > 4096 ||
        !/^\/[a-zA-Z0-9/_?=&.%-]+$/.test(path) || /%|\.\.|\/\//.test(path.split('?')[0])) return null;
    if (method !== 'GET' && path.includes('?')) return null;
    const pathname = path.split('?')[0];
    if (method === 'GET' && ['/me', '/me/settings', '/me/quota', '/perks'].includes(pathname)) return 'account-read';
    if (method === 'PUT' && pathname === '/me/settings') return 'settings-write';
    if (method === 'POST' && pathname === '/projects') return 'create';
    if (!projectId) return null;
    const base = `/projects/${projectId}`;
    if (method === 'GET' && [base, `${base}/editor`, `${base}/commits`, `${base}/workspace`,
        `${base}/history`, `${base}/live`, `${base}/contributors`].includes(pathname)) return 'project-read';
    if (method === 'POST' && pathname === `${base}/assets/check`) return 'asset-check';
    if (method === 'POST' && [`${base}/upload`, `${base}/history/bootstrap`].includes(pathname)) return 'save';
    if (method === 'POST' && pathname === `${base}/remix`) return 'remix';
    if (method === 'PUT' && pathname === base) return 'metadata';
    if (method === 'POST' && pathname === `${base}/publish`) return 'publish';
    // A failed initial upload may clean up ONLY the project created by this host.
    if (method === 'DELETE' && pathname === base) return 'delete-created';
    return null;
};

export const isEditorDestination = pathname => [
    'editor', 'editor.html', 'mystuff', 'project', 'p', 'users', 'settings', 'wallet',
    'explore', 'leaderboard', 'groups', 'admin'
].includes(pathname.split('/')[1]);
