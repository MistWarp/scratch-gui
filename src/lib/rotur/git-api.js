import {getRotur, fetchCurrentUser} from './client.js';

const GIT_HOST = 'https://git.rotur.dev';

// Rotur Git's password is the Rotur token. Its REST API (/api/v1) and its Git
// endpoints (info/refs, git-upload-pack, git-receive-pack) both send CORS
// headers, so both are called directly. Nothing here goes through a third-party
// CORS proxy, so the token only ever goes to git.rotur.dev.
//
// The Git endpoints allow exactly Content-Type, Authorization, User-Agent and
// Git-Protocol. isomorphic-git sends Git-Protocol on every request because it
// defaults to protocolVersion 2, so that header has to stay on the allow list
// at git.rotur.dev or the preflight fails and no sync request reaches the page.
const ROTUR_GIT_SYNC_AVAILABLE = true;
// Cloning still defaults to the archive route. The REST API serves a branch as a
// zip archive with CORS open, so a clone downloads the archive and rebuilds a
// local repository from it, which is cheaper than a full clone for most
// projects. The direct route is available for pushing and pulling.
const ROTUR_GIT_DOWNLOAD_AVAILABLE = true;
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


const getGitUsername = async () => {
    const auth = await requireAuth();
    return auth.username;
};

const getRemoteUrl = (owner, name) => `${GIT_HOST}/${encodeURIComponent(owner)}/${encodeURIComponent(name)}.git`;

const repoPath = (owner, name) => `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;

// Repository reads work without signing in when the repository is public, so
// these attach the token only if there is one.
const archiveHeaders = async () => {
    try {
        const auth = await requireAuth();
        return {Authorization: authHeader(auth)};
    } catch (e) {
        // Public repositories download without signing in.
        return {};
    }
};

// Repository reads work without signing in for public repos, so these send the
// token only when there is one and never fail just because nobody is signed in.
const readFetch = async path => {
    const response = await fetch(`${API_BASE}${path}`, {headers: await archiveHeaders()});
    if (!response.ok) {
        let message = `Rotur Git request failed (${response.status})`;
        try {
            const data = await response.json();
            if (data && data.message) message = data.message;
        } catch (e) {
            // ignore
        }
        const error = new Error(message);
        error.status = response.status;
        throw error;
    }
    return response.json();
};

// Git dates look like "2026-09-26T13:12:01+01:00" or "...Z". Converting to the
// minutes-west-of-UTC form git stores, and back again, reproduces the original
// commit object byte for byte, so rebuilt commits keep their real sha.
const timezoneOffsetFromDate = date => {
    const match = /([+-])(\d{2}):(\d{2})$/.exec(String(date));
    if (!match) return 0;
    const minutes = (Number(match[2]) * 60) + Number(match[3]);
    return match[1] === '+' ? -minutes : minutes;
};

const toGitAuthor = (person, date) => ({
    name: (person && person.name) || '',
    email: (person && person.email) || '',
    timestamp: Math.floor(new Date(date).getTime() / 1000),
    timezoneOffset: timezoneOffsetFromDate(date)
});

const getCommit = async (owner, name, sha) => {
    const data = await readFetch(`${repoPath(owner, name)}/git/commits/${sha}`);
    const commit = data.commit || {};
    const author = commit.author || data.author || {};
    const committer = commit.committer || data.committer || {};
    return {
        sha: data.sha || sha,
        parents: (data.parents || []).map(parent => parent.sha || parent),
        message: commit.message || '',
        author: toGitAuthor(author, author.date || commit.author_date),
        committer: toGitAuthor(committer, committer.date || commit.committer_date)
    };
};

const TREE_PAGE_SIZE = 500;

// The tree endpoint is recursive and paginated: keep asking until a page comes
// back short, so a large repository is read in full rather than truncated.
const getTree = async (owner, name, sha) => {
    const entries = [];
    for (let page = 1; page <= 200; page++) {
        const data = await readFetch(
            `${repoPath(owner, name)}/git/trees/${sha}?recursive=true&page=${page}&per_page=${TREE_PAGE_SIZE}`
        );
        const batch = data.tree || [];
        for (const entry of batch) {
            entries.push({
                path: entry.path,
                mode: entry.mode,
                type: entry.type,
                sha: entry.sha,
                size: entry.size
            });
        }
        if (batch.length < TREE_PAGE_SIZE) break;
    }
    return entries;
};

const COMMITS_PAGE_SIZE = 100;

// Commits on one branch, newest first, as the repository page lists them.
const listCommits = async ({owner, name, sha, page = 1, limit = COMMITS_PAGE_SIZE} = {}) => {
    const query = `page=${page}&limit=${limit}${sha ? `&sha=${encodeURIComponent(sha)}` : ''}`;
    const data = await readFetch(`${repoPath(owner, name)}/commits?${query}`);
    return (data || []).map(commit => ({
        sha: commit.sha,
        parents: (commit.parents || []).map(parent => parent.sha || parent),
        message: (commit.commit && commit.commit.message) || ''
    }));
};

const getBlob = async (owner, name, sha) => {
    const data = await readFetch(`${repoPath(owner, name)}/git/blobs/${sha}`);
    return {
        sha: data.sha,
        size: data.size,
        bytes: data.encoding === 'base64' ?
            Uint8Array.from(atob(data.content), c => c.charCodeAt(0)) :
            new TextEncoder().encode(data.content)
    };
};

const listBranches = async (owner, name) => {
    const data = await readFetch(`${repoPath(owner, name)}/branches`);
    return (data || []).map(branch => ({
        name: branch.name,
        sha: branch.commit && branch.commit.id
    })).filter(branch => branch.name && branch.sha);
};

const getArchiveUrl = (owner, name, ref) =>
    `${API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}` +
    `/archive/${encodeURIComponent(ref)}.zip`;

const fetchArchive = async (owner, name, ref) => {
    const response = await fetch(getArchiveUrl(owner, name, ref), {headers: await archiveHeaders()});
    if (!response.ok) {
        const error = new Error(`Rotur Git could not serve ${owner}/${name} at ${ref} (${response.status})`);
        error.status = response.status;
        throw error;
    }
    return response.arrayBuffer();
};

// Gitea's archive endpoint needs an explicit ref. Use the repository's default
// branch when signed in, and fall back to the two names new repos use.
const downloadArchive = async (owner, name, ref) => {
    if (ref) {
        return {bytes: await fetchArchive(owner, name, ref), branch: ref};
    }
    try {
        const repo = await getRepo(owner, name);
        const branch = repo.defaultBranch || 'main';
        return {bytes: await fetchArchive(owner, name, branch), branch};
    } catch (e) {
        if (e && e.status && e.status !== 401 && e.status !== 403 && e.status !== 404) {
            throw e;
        }
    }
    for (const branch of ['main', 'master']) {
        try {
            return {bytes: await fetchArchive(owner, name, branch), branch};
        } catch (e) {
            if (!e || e.status !== 404) {
                throw e;
            }
        }
    }
    throw new Error(`Rotur Git has no main or master branch for ${owner}/${name}`);
};

const isRoturGitUrl = url => {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' && parsed.host === new URL(GIT_HOST).host &&
            !parsed.username && !parsed.password;
    } catch (e) {
        return false;
    }
};

// isomorphic-git calls onAuth(url) whenever any server answers 401, so only
// answer for Rotur Git itself. Anything else gets nothing.
const getAuth = url => {
    if (!isRoturGitUrl(url)) {
        return Promise.resolve({cancel: true});
    }
    return requireAuth();
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
    ROTUR_GIT_SYNC_AVAILABLE,
    ROTUR_GIT_DOWNLOAD_AVAILABLE,
    getArchiveUrl,
    downloadArchive,
    listMyRepos,
    getRepo,
    createRepo,
    deleteRepo,
    getAuth,
    getGitUsername,
    getRemoteUrl,
    getCommit,
    getTree,
    getBlob,
    listBranches,
    listCommits,
    isRoturGitUrl,
    parseRepoUrl,
    clearGitAuth
};
