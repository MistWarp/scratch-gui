import {request} from '../../lib/community/api.js';

export default {
    reports: () => request('/admin/reports'),
    reportAction: (id, action, reason) =>
        request('/admin/reports/action', {method: 'POST', body: {id, action, reason}}),
    escalateReport: (id, note) =>
        request('/admin/reports/escalate', {method: 'POST', body: {id, note}}),
    reportEvidence: id => request(`/admin/reports/evidence/${id}`),
    admins: () => request('/admin/admins'),
    addAdmin: username => request('/admin/admins', {method: 'POST', body: {username}}),
    removeAdmin: username => request('/admin/admins/remove', {method: 'POST', body: {username}}),
    bans: () => request('/admin/bans'),
    ban: (username, reason) => request('/admin/ban', {method: 'POST', body: {username, reason}}),
    unban: username => request('/admin/unban', {method: 'POST', body: {username}}),
    shadowBans: () => request('/admin/shadowbans', {cache: false}),
    shadowBan: (username, reason) => request('/admin/shadowban', {method: 'POST', body: {username, reason}}),
    liftShadowBan: username => request('/admin/unshadowban', {method: 'POST', body: {username}}),
    hideProject: (id, reason) => request(`/admin/projects/${id}/hide`, {method: 'POST', body: {reason}}),
    restoreProject: id => request(`/admin/projects/${id}/restore`, {method: 'POST'}),
    shadowBanProject: (id, reason) =>
        request(`/admin/projects/${id}/shadowban`, {method: 'POST', body: {reason}}),
    liftProjectShadowBan: id => request(`/admin/projects/${id}/unshadowban`, {method: 'POST'}),
    getUser: username => request(`/admin/user?username=${encodeURIComponent(username)}`),
    setStanding: (username, level, reason) =>
        request('/admin/standing', {method: 'POST', body: {username, level, reason}}),
    messageUser: (username, message) =>
        request('/admin/user/message', {method: 'POST', body: {username, message}}),
    updateUserProfile: (username, patch) =>
        request('/admin/user/profile', {method: 'POST', body: {username, ...patch}}),
    setUserNote: (username, note) =>
        request('/admin/user/note', {method: 'POST', body: {username, note}}),
    searchProjects: q => request(`/admin/projects?q=${encodeURIComponent(q)}`),
    stats: (days = 30) => request(`/admin/stats?days=${encodeURIComponent(days)}`),
    storage: () => request('/admin/storage'),
    syncStorage: () => request('/admin/storage/sync', {method: 'POST'}),
    users: ({q = '', offset = 0, limit = 30, sort = 'name', filter = ''} = {}) => request(
        `/admin/users?q=${encodeURIComponent(q)}&offset=${encodeURIComponent(offset)}` +
        `&limit=${encodeURIComponent(limit)}&sort=${encodeURIComponent(sort)}&filter=${encodeURIComponent(filter)}`
    ),
    extensions: () => request('/admin/extensions', {cache: false}),
    setExtensionPolicy: (hash, status) =>
        request('/admin/extensions/policy', {method: 'POST', body: {hash, status}}),
    setExtensionUrlPolicy: (url, blocked) =>
        request('/admin/extensions/url-policy', {method: 'POST', body: {url, blocked}}),
    extensionSource: hash =>
        request(`/admin/extensions/${hash}/source`, {raw: true}).then(response => {
            if (!response.ok) throw new Error(`Could not load source (${response.status})`);
            return response.text();
        }),
    indexProjectExtensions: (id, sources) =>
        request(`/admin/projects/${id}/extensions/index`, {method: 'POST', body: {sources}}),
    siteErrors: (show = 'open') => request(`/admin/errors?show=${encodeURIComponent(show)}`, {cache: false}),
    resolveSiteError: (id, resolved = true) =>
        request('/admin/errors/resolve', {method: 'POST', body: {id, resolved}}),
    deleteSiteError: id =>
        request('/admin/errors/delete', {method: 'POST', body: {id}}),
    deleteAllSiteErrors: () => request('/admin/errors/delete-all', {method: 'POST'})
};
