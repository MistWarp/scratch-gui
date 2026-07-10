import {getRotur, fetchCurrentUser} from './client.js';

const GIT_HOST = 'https://git.rotur.dev';
const API_BASE = `${GIT_HOST}/api/v1`;
const PAGE_SIZE = 50;
const MAX_PAGES = 10;

let cachedIdentity = null;

const requireAuth = async () => {
    const rotur = getRotur();
    if (!rotur.loggedIn || !rotur.token) {
        cachedIdentity = null;
        throw new Error('Sign in to Rotur to use Rotur Git');
    }
    const token = rotur.token;
    if (cachedIdentity && cachedIdentity.token === token) {
        return {username: cachedIdentity.username, password: token};
    }
    const user = await fetchCurrentUser();
    if (!user) {
        throw new Error('Sign in to Rotur to use Rotur Git');
    }
    // eslint-disable-next-line require-atomic-updates
    cachedIdentity = {token, username: user.username};
    return {username: user.username, password: token};
};

const clearGitAuth = () => {
    cachedIdentity = null;
};

const authHeader = ({username, password}) => `Basic ${btoa(`${username}:${password}`)}`;

const apiFetch = async (path, {method = 'GET', body} = {}) => {
    const auth = await requireAuth();
    const headers = {Authorization: authHeader(auth)};
    const init = {method, headers};
    if (body) {
        headers['Content-Type'] = 'application/json';
        init.body = JSON.stringify(body);
    }
    const response = await fetch(`${API_BASE}${path}`, init);
    if (!response.ok) {
        let message = `Rotur Git request failed (${response.status})`;
        try {
            const data = await response.json();
            if (data && data.message) {
                message = data.message;
            }
        } catch (e) {
            // ignore
        }
        const error = new Error(message);
        error.status = response.status;
        throw error;
    }
    if (response.status === 204) {
        return null;
    }
    return response.json();
};

const normalizeRepo = repo => ({
    name: repo.name,
    fullName: repo.full_name,
    owner: repo.owner ? repo.owner.login : null,
    description: repo.description || '',
    isPrivate: Boolean(repo.private),
    defaultBranch: repo.default_branch || 'main',
    htmlUrl: repo.html_url || `${GIT_HOST}/${repo.full_name}`,
    cloneUrl: repo.clone_url || `${GIT_HOST}/${repo.full_name}.git`,
    updatedAt: repo.updated_at || null,
    isEmpty: Boolean(repo.empty)
});

const listMyRepos = async () => {
    const repos = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
        const batch = await apiFetch(`/user/repos?page=${page}&limit=${PAGE_SIZE}`);
        if (!Array.isArray(batch) || batch.length === 0) {
            break;
        }
        repos.push(...batch);
        if (batch.length < PAGE_SIZE) {
            break;
        }
    }
    return repos.map(normalizeRepo);
};

const getRepo = async (owner, name) => {
    const repo = await apiFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`);
    return normalizeRepo(repo);
};

const createRepo = async ({name, description = '', isPrivate = false, defaultBranch = 'main'}) => {
    const repo = await apiFetch('/user/repos', {
        method: 'POST',
        body: {
            name,
            description,
            private: isPrivate,
            default_branch: defaultBranch,
            auto_init: false
        }
    });
    return normalizeRepo(repo);
};

const deleteRepo = (owner, name) => apiFetch(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
    {method: 'DELETE'}
);

const getAuth = () => requireAuth();

const getGitUsername = async () => {
    const auth = await requireAuth();
    return auth.username;
};

const getRemoteUrl = (owner, name) => `${GIT_HOST}/${encodeURIComponent(owner)}/${encodeURIComponent(name)}.git`;

const isRoturGitUrl = url => {
    try {
        return new URL(url).host === new URL(GIT_HOST).host;
    } catch (e) {
        return false;
    }
};

const parseRepoUrl = url => {
    if (!url || typeof url !== 'string') {
        return null;
    }
    if (isRoturGitUrl(url)) {
        try {
            const segments = new URL(url).pathname.split('/').filter(Boolean);
            if (segments.length >= 2) {
                const owner = decodeURIComponent(segments[0]);
                const name = decodeURIComponent(segments[1]).replace(/\.git$/i, '');
                if (owner && name) {
                    return {owner, name, fullName: `${owner}/${name}`};
                }
            }
        } catch (e) {
            return null;
        }
        return null;
    }
    const match = url.trim().match(/^([^/\s]+)\/([^/\s]+?)(?:\.git)?$/);
    if (match) {
        return {owner: match[1], name: match[2], fullName: `${match[1]}/${match[2]}`};
    }
    return null;
};

export {
    GIT_HOST,
    listMyRepos,
    getRepo,
    createRepo,
    deleteRepo,
    getAuth,
    getGitUsername,
    getRemoteUrl,
    isRoturGitUrl,
    parseRepoUrl,
    clearGitAuth
};
