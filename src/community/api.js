import {
    request,
    loadSession,
    storeSession,
    exchangeValidator,
    logout,
    createProject,
    uploadProject
} from '../lib/community/api.js';

const editorUrl = ({clone, platformProject, projectJson, assets} = {}) => {
    if (platformProject) {
        return `/editor#mw-${platformProject}`;
    }
    const params = new URLSearchParams();
    if (clone) params.set('clone', clone);
    if (projectJson) params.set('project_url', projectJson);
    if (assets) params.set('mw_assets', assets);
    const query = params.toString();
    return `/editor${query ? `?${query}` : ''}`;
};

const readStored = key => {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        return null;
    }
};

const embedUrl = (project, {unsandboxed = false, applyProjectTheme = true} = {}) => {
    const params = new URLSearchParams();
    params.set('project_url', project.projectJsonUrl);
    params.set('mw_assets', project.assetsBase);
    if (!applyProjectTheme) {
        params.set('apply_project_theme', '0');
    }
    const theme = readStored('tw:theme');
    if (theme) {
        params.set('theme', theme);
        if (theme.includes('custom')) {
            try {
                const uuid = JSON.parse(theme).customThemeUuid;
                const library = JSON.parse(readStored('tw:custom-themes') || '[]');
                const active = Array.isArray(library) ? library.filter(entry => entry.uuid === uuid) : [];
                if (active.length) params.set('theme_custom', JSON.stringify(active));
            } catch (e) {
                // leave theme_custom out rather than shipping the whole library
            }
        }
    }
    if (unsandboxed) params.set('allow_all', '1');
    return `/embed.html?${params.toString()}`;
};

const projectUrl = id => `/project/${id}`;

const api = {
    loadSession,
    storeSession,
    logout,
    me: () => request('/me'),
    quota: () => request('/me/quota'),
    stats: () => request('/me/stats'),
    settings: {
        get: () => request('/me/settings'),
        put: settings => request('/me/settings', {method: 'PUT', body: settings})
    },
    notifications: () => request('/notifications'),
    readNotifications: () => request('/notifications/read', {method: 'POST'}),
    explore: ({sort = 'recent', q = '', offset = 0, limit = 24} = {}) =>
        request(`/explore?sort=${sort}&q=${encodeURIComponent(q)}&offset=${offset}&limit=${limit}`),
    leaderboard: by => request(`/leaderboard?by=${by}`),
    getProject: id => request(`/projects/${id}`),
    createProject,
    uploadProject,
    updateProject: (id, patch) => request(`/projects/${id}`, {method: 'PUT', body: patch}),
    setThumbnail: (id, blob) => {
        const form = new FormData();
        form.append('thumbnail', blob, 'thumb.png');
        return request(`/projects/${id}/thumbnail`, {method: 'POST', body: form});
    },
    myProjects: name => request(`/users/${name}/projects?all=1`),
    library: () => request('/me/library'),
    purchases: () => request('/me/purchases'),
    saveProject: id => request(`/projects/${id}/save`, {method: 'POST'}),
    unsaveProject: id => request(`/projects/${id}/save`, {method: 'DELETE'}),
    deleteProject: id => request(`/projects/${id}`, {method: 'DELETE'}),
    publish: id => request(`/projects/${id}/publish`, {method: 'POST'}),
    unpublish: id => request(`/projects/${id}/unpublish`, {method: 'POST'}),
    setVisibility: (id, visibility) => request(`/projects/${id}/visibility`, {method: 'POST', body: {visibility}}),
    purchaseIntent: id => request(`/projects/${id}/purchase/intent`, {method: 'POST'}),
    purchaseConfirm: (id, key) => request(`/projects/${id}/purchase/confirm`, {method: 'POST', body: {key}}),
    getUser: name => request(`/users/${name}`),
    searchUsers: q => request(`/search/users?q=${encodeURIComponent(q)}`),
    userLoves: name => request(`/users/${name}/loves`),
    activity: users => request(`/activity?users=${encodeURIComponent(users.join(','))}`),
    getComments: id => request(`/projects/${id}/comments`),
    addComment: (id, content, parent) => request(`/projects/${id}/comments`, {method: 'POST', body: {content, parent}}),
    deleteComment: (id, commentId) => request(`/projects/${id}/comments/${commentId}`, {method: 'DELETE'}),
    getProfileComments: name => request(`/users/${name}/comments`),
    addProfileComment: (name, content, parent) =>
        request(`/users/${name}/comments`, {method: 'POST', body: {content, parent}}),
    deleteProfileComment: (name, commentId) => request(`/users/${name}/comments/${commentId}`, {method: 'DELETE'}),
    updateProfile: patch => request('/me/profile', {method: 'PUT', body: patch}),
    reactProject: (id, type) => request(`/projects/${id}/react`, {method: 'POST', body: {type}}),
    reactComment: (id, commentId, type) =>
        request(`/projects/${id}/comments/${commentId}/react`, {method: 'POST', body: {type}}),
    reactProfileComment: (name, commentId, type) =>
        request(`/users/${name}/comments/${commentId}/react`, {method: 'POST', body: {type}}),
    agreement: () => request('/agreement'),
    acceptAgreement: () => request('/agreement/accept', {method: 'POST'}),
    quotaReset: () => request('/me/quota/reset', {method: 'POST'}),
    quotaResetConfirm: key => request('/me/quota/reset/confirm', {method: 'POST', body: {key}}),
    report: (type, target, reason, context) =>
        request('/reports', {method: 'POST', body: {type, target, reason, context}}),
    admin: {
        reports: () => request('/admin/reports'),
        reportAction: (id, action, reason) => request('/admin/reports/action', {method: 'POST', body: {id, action, reason}}),
        reportEvidence: id => request(`/admin/reports/evidence/${id}`),
        admins: () => request('/admin/admins'),
        addAdmin: username => request('/admin/admins', {method: 'POST', body: {username}}),
        removeAdmin: username => request('/admin/admins/remove', {method: 'POST', body: {username}}),
        bans: () => request('/admin/bans'),
        ban: (username, reason) => request('/admin/ban', {method: 'POST', body: {username, reason}}),
        unban: username => request('/admin/unban', {method: 'POST', body: {username}}),
        getUser: username => request(`/admin/user?username=${encodeURIComponent(username)}`),
        setStanding: (username, level, reason) =>
            request('/admin/standing', {method: 'POST', body: {username, level, reason}}),
        messageUser: (username, message) =>
            request('/admin/user/message', {method: 'POST', body: {username, message}}),
        updateUserProfile: (username, patch) =>
            request('/admin/user/profile', {method: 'POST', body: {username, ...patch}}),
        searchProjects: q => request(`/admin/projects?q=${encodeURIComponent(q)}`),
        stats: () => request('/admin/stats'),
        users: () => request('/admin/users')
    },
    news: () => request('/news'),
    postNews: (title, body) => request('/news', {method: 'POST', body: {title, body}}),
    deleteNews: id => request(`/news/${id}`, {method: 'DELETE'}),
    reactNews: (id, type) => request(`/news/${id}/react`, {method: 'POST', body: {type}}),
    view: id => request(`/projects/${id}/view`, {method: 'POST'}),
    remixes: id => request(`/projects/${id}/remixes`),
    remixTree: id => request(`/projects/${id}/remixtree`),
    remix: id => request(`/projects/${id}/remix`, {method: 'POST'}),
    commits: id => request(`/projects/${id}/commits`),
    pulls: id => request(`/projects/${id}/pulls`),
    getPull: (id, index) => request(`/projects/${id}/pulls/${index}`),
    pullDiff: (id, index) =>
        request(`/projects/${id}/pulls/${index}/diff`, {raw: true}).then(response => {
            if (!response.ok) {
                throw new Error(`Could not load diff (${response.status})`);
            }
            return response.text();
        }),
    mergePull: (id, index) => request(`/projects/${id}/pulls/${index}/merge`, {method: 'POST'}),
    request
};

export default api;
export {editorUrl, embedUrl, projectUrl, loadSession, storeSession, exchangeValidator, request};
