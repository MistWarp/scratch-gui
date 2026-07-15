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

const embedUrl = (project, {unsandboxed = false} = {}) => {
    const params = new URLSearchParams();
    params.set('project_url', project.projectJsonUrl);
    params.set('mw_assets', project.assetsBase);
    const theme = readStored('tw:theme');
    if (theme) {
        params.set('theme', theme);
        if (theme.includes('custom')) {
            const customThemes = readStored('tw:custom-themes');
            if (customThemes) params.set('theme_custom', customThemes);
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
    settings: {
        get: () => request('/me/settings'),
        put: settings => request('/me/settings', {method: 'PUT', body: settings})
    },
    notifications: () => request('/notifications'),
    readNotifications: () => request('/notifications/read', {method: 'POST'}),
    explore: ({sort = 'recent', q = '', offset = 0, limit = 24} = {}) =>
        request(`/explore?sort=${sort}&q=${encodeURIComponent(q)}&offset=${offset}&limit=${limit}`),
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
    deleteProject: id => request(`/projects/${id}`, {method: 'DELETE'}),
    publish: id => request(`/projects/${id}/publish`, {method: 'POST'}),
    unpublish: id => request(`/projects/${id}/unpublish`, {method: 'POST'}),
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
