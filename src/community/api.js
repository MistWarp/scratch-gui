/* eslint-disable max-len */
import {
    request,
    loadSession,
    storeSession,
    exchangeValidator,
    logout,
    createProject,
    uploadProject,
    prepareSparseProjectUpload,
    stashProjectHandoff
} from '../lib/community/api.js';
import warpthemeApi from '../lib/warptheme-api.js';

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
    try {
        const prefix = `${EMBED_STORAGE_PREFIX}${id}:`;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith(prefix)) continue;
            const name = key.slice(prefix.length);
            if (isBlockedStorageKey(name)) continue;
            const value = readStored(key);
            if (value === null) continue;
            const nextSize = size + name.length + value.length + 6;
            if (nextSize > EMBED_STORAGE_SEED_LIMIT) return null;
            seed[name] = value;
            size = nextSize;
        }
    } catch (e) {
        return null;
    }
    return Object.keys(seed).length ? seed : null;
};

const commentQuery = ({offset = 0, limit = 20, anchor = '', all = false} = {}) => {
    const params = new URLSearchParams();
    if (all) {
        params.set('all', '1');
    } else {
        params.set('offset', String(offset));
        params.set('limit', String(limit));
    }
    if (anchor) params.set('anchor', anchor);
    return params.toString();
};

let themeCustomCacheKey;
let themeCustomCacheValue = '';
const themeCustomFor = theme => {
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

const embedUrl = (project, {
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
    if (project.trustedExtensions && project.trustedExtensions.length) {
        params.set('mw_te', JSON.stringify(project.trustedExtensions));
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

const projectUrl = id => `/project/${id}`;

const api = {
    loadSession,
    storeSession,
    logout,
    me: () => request('/me'),
    perks: () => request('/perks'),
    group: tag => request(`/groups/${encodeURIComponent(tag)}`),
    resolveVanity: slug => request(`/vanity/${encodeURIComponent(slug)}`),
    quota: () => request('/me/quota'),
    stats: () => request('/me/stats'),
    settings: {
        get: () => request('/me/settings'),
        put: settings => request('/me/settings', {method: 'PUT', body: settings})
    },
    exportMyData: () => request('/me/export'),
    deleteMyData: username => request('/me/data', {method: 'DELETE', body: {username}}),
    safety: () => request('/me/safety'),
    blockUser: name => request(`/me/blocks/${encodeURIComponent(name)}`, {method: 'POST'}),
    unblockUser: name => request(`/me/blocks/${encodeURIComponent(name)}`, {method: 'DELETE'}),
    muteUser: name => request(`/me/mutes/${encodeURIComponent(name)}`, {method: 'POST'}),
    unmuteUser: name => request(`/me/mutes/${encodeURIComponent(name)}`, {method: 'DELETE'}),
    support: ticket => request('/support', {method: 'POST', body: ticket}),
    notifications: () => request('/notifications'),
    readNotifications: () => request('/notifications/read', {method: 'POST'}),
    explore: ({sort = 'recent', q = '', tag = '', offset = 0, limit = 24} = {}) =>
        request(`/explore?sort=${sort}&q=${encodeURIComponent(q)}&tag=${encodeURIComponent(tag)}&offset=${offset}&limit=${limit}`),
    leaderboard: by => request(`/leaderboard?by=${by}`),
    getProject: id => {
        const key = typeof location === 'undefined' ? '' : new URLSearchParams(location.search).get('k');
        return request(`/projects/${id}${key ? `?k=${encodeURIComponent(key)}` : ''}`);
    },
    createProject,
    uploadProject,
    prepareSparseProjectUpload,
    updateProject: (id, patch) => request(`/projects/${id}`, {method: 'PUT', body: patch}),
    setThumbnail: (id, blob) => {
        const form = new FormData();
        form.append('thumbnail', blob, 'thumb.png');
        return request(`/projects/${id}/thumbnail`, {method: 'POST', body: form});
    },
    myProjects: name => request(`/users/${encodeURIComponent(name)}/projects?all=1`),
    myProjectPage: (name, {offset = 0, limit = 24} = {}) =>
        request(`/users/${encodeURIComponent(name)}/projects?all=1&offset=${offset}&limit=${limit}`),
    library: ({offset = 0, limit = 24} = {}) => request(`/me/library?offset=${offset}&limit=${limit}`),
    trash: () => request('/me/trash'),
    restoreProject: id => request(`/projects/${id}/restore`, {method: 'POST'}),
    purgeProject: id => request(`/trash/${id}`, {method: 'DELETE'}),
    purchases: () => request('/me/purchases'),
    saveProject: id => request(`/projects/${id}/save`, {method: 'POST'}),
    unsaveProject: id => request(`/projects/${id}/save`, {method: 'DELETE'}),
    deleteProject: id => request(`/projects/${id}`, {method: 'DELETE'}),
    publish: id => request(`/projects/${id}/publish`, {method: 'POST'}),
    unpublish: id => request(`/projects/${id}/unpublish`, {method: 'POST'}),
    setVisibility: (id, visibility) => request(`/projects/${id}/visibility`, {method: 'POST', body: {visibility}}),
    purchaseIntent: id => request(`/projects/${id}/purchase/intent`, {method: 'POST'}),
    purchaseConfirm: (id, key, paymentId) => request(`/projects/${id}/purchase/confirm`, {
        method: 'POST', body: {key, paymentId}
    }),
    gameProducts: id => request(`/projects/${id}/products`, {cache: false}),
    ownsGameProduct: (id, product) => request(`/projects/${id}/products/${encodeURIComponent(product)}/owns`, {
        cache: false
    }),
    gameProductIntent: (id, product) => request(`/projects/${id}/products/${encodeURIComponent(product)}/purchase/intent`, {
        method: 'POST'
    }),
    gameProductConfirm: (id, product, key, paymentId) => request(`/projects/${id}/products/${encodeURIComponent(product)}/purchase/confirm`, {
        method: 'POST', body: {key, paymentId}
    }),
    createGameDataCapability: (id, context) => request(`/projects/${id}/data-capability`, {
        method: 'POST', body: {context}
    }),
    createMultiplayerTicket: (id, context, room) => request(`/projects/${id}/multiplayer-ticket`, {
        method: 'POST', body: {context, room}
    }),
    getProjectSave: (id, capability) => request(`/projects/${id}/me/save`, {
        headers: {'X-MistWarp-Game-Data': capability}, cache: false
    }),
    putProjectSave: (id, capability, save) => request(`/projects/${id}/me/save`, {
        method: 'PUT', body: save, headers: {'X-MistWarp-Game-Data': capability}
    }),
    getProjectGlobalGameData: (id, capability) => request(`/projects/${id}/me/global-data`, {
        headers: {'X-MistWarp-Game-Data': capability}, cache: false
    }),
    gameSaves: () => request('/me/game-saves', {cache: false}),
    deleteGameSave: id => request(`/me/game-saves/${id}`, {method: 'DELETE'}),
    globalGameData: () => request('/me/game-data/global', {cache: false}),
    putGlobalGameData: data => request('/me/game-data/global', {method: 'PUT', body: data}),
    gameInventory: () => request('/me/game-inventory', {cache: false}),
    gameInventoryConfig: id => request(`/projects/${id}/game-inventory-config`, {cache: false}),
    ...warpthemeApi,
    getUser: name => request(`/users/${encodeURIComponent(name)}`),
    userProjects: (name, {offset = 0, limit = 24} = {}) =>
        request(`/users/${encodeURIComponent(name)}/projects?offset=${offset}&limit=${limit}`),
    searchUsers: q => request(`/search/users?q=${encodeURIComponent(q)}`),
    activity: users => request(`/activity?users=${encodeURIComponent(users.join(','))}`),
    getComments: (id, options) => request(`/projects/${id}/comments?${commentQuery(options)}`),
    addComment: (id, content, parent, kind = 'comment') =>
        request(`/projects/${id}/comments`, {method: 'POST', body: {content, parent, kind}}),
    deleteComment: (id, commentId) => request(`/projects/${id}/comments/${commentId}`, {method: 'DELETE'}),
    editComment: (id, commentId, content) => request(`/projects/${id}/comments/${commentId}`, {method: 'PUT', body: {content}}),
    getProfileComments: (name, options) =>
        request(`/users/${encodeURIComponent(name)}/comments?${commentQuery(options)}`),
    addProfileComment: (name, content, parent) =>
        request(`/users/${encodeURIComponent(name)}/comments`, {method: 'POST', body: {content, parent}}),
    deleteProfileComment: (name, commentId) => request(`/users/${encodeURIComponent(name)}/comments/${commentId}`, {method: 'DELETE'}),
    editProfileComment: (name, commentId, content) => request(`/users/${encodeURIComponent(name)}/comments/${commentId}`, {method: 'PUT', body: {content}}),
    updateProfile: patch => request('/me/profile', {method: 'PUT', body: patch}),
    reactProject: (id, type) => request(`/projects/${id}/react`, {method: 'POST', body: {type}}),
    reactComment: (id, commentId, type) =>
        request(`/projects/${id}/comments/${commentId}/react`, {method: 'POST', body: {type}}),
    reactProfileComment: (name, commentId, type) =>
        request(`/users/${encodeURIComponent(name)}/comments/${commentId}/react`, {method: 'POST', body: {type}}),
    agreement: () => request('/agreement'),
    acceptAgreement: () => request('/agreement/accept', {method: 'POST'}),
    quotaReset: () => request('/me/quota/reset', {method: 'POST'}),
    quotaResetConfirm: key => request('/me/quota/reset/confirm', {method: 'POST', body: {key}}),
    report: (type, target, reason, context) =>
        request('/reports', {method: 'POST', body: {type, target, reason, context}}),
    admin: {
        reports: () => request('/admin/reports'),
        reportAction: (id, action, reason) =>
            request('/admin/reports/action', {method: 'POST', body: {id, action, reason}}),
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
        stats: (days = 30) => request(`/admin/stats?days=${encodeURIComponent(days)}`),
        users: () => request('/admin/users'),
        payouts: () => request('/admin/payouts'),
        retryPayouts: () => request('/admin/payouts/retry', {method: 'POST'}),
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
            request(`/admin/projects/${id}/extensions/index`, {method: 'POST', body: {sources}})
    },
    news: () => request('/news'),
    postNews: post => request('/news', {method: 'POST', body: post}),
    deleteNews: id => request(`/news/${id}`, {method: 'DELETE'}),
    reactNews: (id, type) => request(`/news/${id}/react`, {method: 'POST', body: {type}}),
    voteNewsPoll: (id, option) => request(`/news/${id}/poll`, {method: 'POST', body: {option}}),
    view: id => request(`/projects/${id}/view`, {method: 'POST'}),
    remixes: id => request(`/projects/${id}/remixes`),
    remixTree: id => request(`/projects/${id}/remixtree`),
    remix: (id, setup) => request(`/projects/${id}/remix`, {method: 'POST', body: setup}),
    createPreview: (id, hours = 24) => request(`/projects/${id}/preview`, {method: 'POST', body: {hours}}),
    releases: id => request(`/projects/${id}/releases`),
    createRelease: (id, release) => request(`/projects/${id}/releases`, {method: 'POST', body: release}),
    contribute: (id, contribution) => request(`/projects/${id}/contribute`, {method: 'POST', body: contribution}),
    diagnostics: id => request(`/projects/${id}/diagnostics`),
    recordDiagnostic: (id, diagnostic) => request(`/projects/${id}/diagnostics`, {method: 'POST', body: diagnostic}),
    feedback: id => request(`/projects/${id}/feedback`),
    sendFeedback: (id, feedback) => request(`/projects/${id}/feedback`, {method: 'POST', body: feedback}),
    updateFeedback: (id, feedback, status) => request(`/projects/${id}/feedback/${feedback}`, {method: 'PUT', body: {status}}),
    reviews: id => request(`/projects/${id}/reviews`),
    userReviews: (name, limit = 6) => request(`/users/${encodeURIComponent(name)}/reviews?limit=${limit}`),
    saveReview: (id, review) => request(`/projects/${id}/reviews/me`, {method: 'PUT', body: review}),
    deleteReview: id => request(`/projects/${id}/reviews/me`, {method: 'DELETE'}),
    spaces: ({kind = '', q = '', offset = 0, limit = 24, startsBefore = 0, endsAfter = 0} = {}) => {
        const dateWindow = startsBefore > 0 && endsAfter > 0 ?
            `&startsBefore=${startsBefore}&endsAfter=${endsAfter}` : '';
        return request(`/spaces?kind=${encodeURIComponent(kind)}&q=${encodeURIComponent(q)}&offset=${offset}&limit=${limit}${dateWindow}`);
    },
    getSpace: id => request(`/spaces/${id}`),
    getSpaceManagement: id => request(`/spaces/${id}/manage`),
    mySpaces: () => request('/me/spaces'),
    createSpace: space => request('/spaces', {method: 'POST', body: space}),
    updateSpace: (id, space) => request(`/spaces/${id}`, {method: 'PUT', body: space}),
    setSpaceThumbnail: (id, blob) => {
        const form = new FormData();
        form.append('thumbnail', blob, 'studio-thumbnail.png');
        return request(`/spaces/${id}/thumbnail`, {method: 'POST', body: form});
    },
    deleteSpace: id => request(`/spaces/${id}`, {method: 'DELETE'}),
    addSpaceProject: (id, project) => request(`/spaces/${id}/projects/${project}`, {method: 'POST'}),
    removeSpaceProject: (id, project) => request(`/spaces/${id}/projects/${project}`, {method: 'DELETE'}),
    followSpace: id => request(`/spaces/${id}/follow`, {method: 'POST'}),
    unfollowSpace: id => request(`/spaces/${id}/follow`, {method: 'DELETE'}),
    inviteSpaceCurator: (id, username) => request(`/spaces/${id}/curators`, {method: 'POST', body: {username}}),
    removeSpaceCurator: (id, username) => request(`/spaces/${id}/curators/${encodeURIComponent(username)}`, {method: 'DELETE'}),
    respondSpaceInvitation: (id, accepted) => request(`/spaces/${id}/invitations/respond`, {method: 'POST', body: {accepted}}),
    cancelSpaceInvitation: (id, username) => request(`/spaces/${id}/invitations/${encodeURIComponent(username)}`, {method: 'DELETE'}),
    inviteChallengeJudge: (id, username) => request(`/spaces/${id}/judges`, {method: 'POST', body: {username}}),
    removeChallengeJudge: (id, username) => request(`/spaces/${id}/judges/${encodeURIComponent(username)}`, {method: 'DELETE'}),
    respondJudgeInvitation: (id, accepted) => request(`/spaces/${id}/judge-invitations/respond`, {method: 'POST', body: {accepted}}),
    joinChallenge: id => request(`/spaces/${id}/join`, {method: 'POST'}),
    leaveChallenge: id => request(`/spaces/${id}/join`, {method: 'DELETE'}),
    scoreChallengeEntry: (id, project, score) => request(`/spaces/${id}/entries/${project}/score`, {method: 'PUT', body: score}),
    voteChallengeEntry: (id, project, value) => request(`/spaces/${id}/entries/${project}/vote`, {method: 'PUT', body: {value}}),
    publishChallengeResults: id => request(`/spaces/${id}/results`, {method: 'POST'}),
    reactSpace: (id, type) => request(`/spaces/${id}/react`, {method: 'POST', body: {type}}),
    spaceComments: (id, options) => request(`/spaces/${id}/comments?${commentQuery(options)}`),
    addSpaceComment: (id, content, parent) => request(`/spaces/${id}/comments`, {method: 'POST', body: {content, parent}}),
    deleteSpaceComment: (id, commentId) => request(`/spaces/${id}/comments/${commentId}`, {method: 'DELETE'}),
    editSpaceComment: (id, commentId, content) => request(`/spaces/${id}/comments/${commentId}`, {method: 'PUT', body: {content}}),
    reactSpaceComment: (id, commentId, type) => request(`/spaces/${id}/comments/${commentId}/react`, {method: 'POST', body: {type}}),
    roadmap: () => request('/roadmap'),
    createIdea: idea => request('/roadmap', {method: 'POST', body: idea}),
    voteIdea: (id, vote) => request(`/roadmap/${id}/vote`, {method: 'POST', body: {vote}}),
    updateIdea: (id, idea) => request(`/roadmap/${id}`, {method: 'PUT', body: idea}),
    ideaComments: (id, options) => request(`/roadmap/${id}/comments?${commentQuery(options)}`),
    addIdeaComment: (id, content, parent = '') =>
        request(`/roadmap/${id}/comments`, {method: 'POST', body: {content, parent}}),
    deleteIdeaComment: (id, comment) => request(`/roadmap/${id}/comments/${comment}`, {method: 'DELETE'}),
    editIdeaComment: (id, commentId, content) => request(`/roadmap/${id}/comments/${commentId}`, {method: 'PUT', body: {content}}),
    commits: id => request(`/projects/${id}/commits`),
    pulls: id => request(`/projects/${id}/pulls`),
    getPull: (id, index) => request(`/projects/${id}/pulls/${index}`),
    pullDiff: (id, index) =>
        request(`/projects/${id}/pulls/${index}/diff`, {cache: false}),
    mergePull: (id, index) => request(`/projects/${id}/pulls/${index}/merge`, {method: 'POST'}),
    uploadPullMerge: (id, {sb3, mwp, git, expectedHead, pullId}) =>
        uploadProject(id, sb3, null, null, {workspace: mwp, git, expectedHead, pullId}),
    request
};

export default api;
export {
    editorUrl, embedUrl, projectUrl, loadSession, storeSession, exchangeValidator,
    request, stashProjectHandoff, themeCustomFor
};
