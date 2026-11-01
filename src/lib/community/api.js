import JSZip from '@turbowarp/jszip';
import {clearContentCache} from './cached-fetch.js';
import {isGalleryExtensionUrl} from '../trusted-extension.js';
import {trackApiSuccess} from '../../community/analytics.js';
import {setMinorAccount} from '../minor-account.js';
import {sharedCredentials} from '../account/shared-credentials.js';
import {
    createApiError, createNetworkError, createTimeoutError, friendlyError
} from '../../community/api-errors.js';
import {createPlatformApi, staleCacheTest} from '../../modules/platform-api';
import {session as sessionStore} from '../../modules/storage';

const API_BASE = process.env.MW_API_BASE || 'https://api.mistwarp.org/v1';

let authInvalidHandler = null;
let bannedHandler = null;

const platformApi = createPlatformApi({
    baseUrl: API_BASE,
    credentials: sharedCredentials,
    cacheStore: sessionStore,
    errors: {
        response: createApiError,
        network: createNetworkError,
        timeout: createTimeoutError
    },
    onSuccess: trackApiSuccess
});

platformApi.session.setEvents({
    onSignedIn: auth => setMinorAccount(auth.minor === true),
    onAuthInvalid: () => authInvalidHandler && authInvalidHandler(),
    onBanned: (message, redirectUrl) => bannedHandler && bannedHandler(message, redirectUrl)
});

const {session} = platformApi;

const setSessionProvider = provider => session.setProvider(provider);
const setRoturTokenGetter = getter => session.setRoturTokenGetter(getter);
const loadSession = () => session.load();
const storeSession = token => session.store(token);
const requestValidator = (roturToken, key) => session.requestValidator(roturToken, key);
const exchangeValidator = roturToken => session.exchangeValidator(roturToken);
const runExchange = roturToken => session.runExchange(roturToken);
const refreshSession = () => session.refresh();

const onAuthInvalid = handler => {
    authInvalidHandler = handler;
};

const onBanned = handler => {
    bannedHandler = handler;
};

const clearApiCache = (test = null) => platformApi.cache.invalidate(test);

const request = (path, {raw = false, ...options} = {}) => (raw ?
    platformApi.requestRaw(path, options) :
    platformApi.request(path, options));

const logout = () => platformApi.logout();

const uploadXhr = (path, form, onUploadProgress) => platformApi.upload(path, form, onUploadProgress);

const createProject = payload => request('/projects', {method: 'POST', body: payload});

const getCustomExtensionUrls = project => {
    const urls = {...(project.extensionURLs || {})};
    for (const target of project.targets || []) {
        Object.assign(urls, (target && target.extensionURLs) || {});
    }
    return [...new Set(Object.values(urls).filter(url => typeof url === 'string' && !isGalleryExtensionUrl(url)))];
};

const hashExtensionUrl = async url => {
    const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(url)));
    return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
};

const extensionSourceUrl = async (project, url) => {
    const params = new URLSearchParams();
    try {
        const key = new URL(project.projectJsonUrl).searchParams.get('k');
        if (key) params.set('k', key);
    } catch (e) {
        params.delete('k');
    }
    const query = params.toString();
    const hash = await hashExtensionUrl(url);
    const sourceUrl = `${API_BASE}/projects/${encodeURIComponent(project.id)}/extensions/${hash}/source`;
    return `${sourceUrl}${query ? `?${query}` : ''}`;
};

const checkProjectAssets = (id, assets) => request(`/projects/${id}/assets/check`, {method: 'POST', body: {assets}});

const collectExtensionSources = async sb3Blob => {
    const zip = await JSZip.loadAsync(sb3Blob);
    const projectFile = zip.file('project.json');
    if (!projectFile) throw new Error('Project has no project.json');
    const urls = getCustomExtensionUrls(JSON.parse(await projectFile.async('text')));
    const sources = {};
    await Promise.all(urls.map(async url => {
        const response = await fetch(url, {credentials: 'omit'});
        if (!response.ok) throw new Error(`Could not read custom extension source (${response.status}): ${url}`);
        sources[url] = await response.text();
    }));
    return sources;
};

const PROJECT_ASSET_NAME = /^[0-9a-f]{32}\.[0-9a-zA-Z]{1,5}$/;
const SPARSE_COMPRESSABLE = ['.json', '.svg', '.wav', '.ttf', '.otf'];

const prepareSparseProjectUpload = async (id, sb3Blob) => {
    const source = await JSZip.loadAsync(sb3Blob);
    const projectFile = source.file('project.json');
    if (!projectFile) throw new Error('Project has no project.json');
    const assetNames = Object.keys(source.files).filter(name => PROJECT_ASSET_NAME.test(name));
    const {missing} = await checkProjectAssets(id, assetNames);
    const missingSet = new Set(missing);
    const sparse = new JSZip();
    const addFile = async (name, file) => {
        sparse.file(name, await file.async('uint8array'), {
            compression: SPARSE_COMPRESSABLE.some(ext => name.endsWith(ext)) ? 'DEFLATE' : 'STORE'
        });
    };
    await addFile('project.json', projectFile);
    await Promise.all(assetNames.filter(name => missingSet.has(name)).map(name => addFile(name, source.file(name))));
    return sparse.generateAsync({type: 'blob', mimeType: 'application/x.scratch.sb3'});
};

const uploadProject = async (id, sb3Blob, thumbnailBlob, onUploadProgress, {
    workspace,
    git,
    expectedHead,
    expectedEdited,
    replaceHistory = false,
    pullId,
    mergeSourceBranch,
    mergeTargetBranch,
    mergeSourceHead,
    mergeTargetHead,
    restoreCommit,
    restoreMessage,
    mergeTree,
    extensions
} = {}) => {
    const form = new FormData();
    form.append('project', sb3Blob, 'project.sb3');
    form.append('extensions', JSON.stringify(
        typeof extensions === 'undefined' ? await collectExtensionSources(sb3Blob) : extensions
    ));
    if (workspace) form.append('workspace', workspace, 'project.mwp');
    if (git) form.append('git', JSON.stringify(git));
    if (expectedHead) form.append('expectedHead', expectedHead);
    if (replaceHistory) form.append('replaceHistory', 'true');
    if (typeof expectedEdited === 'number') form.append('expectedEdited', String(expectedEdited));
    if (pullId) form.append('pullId', String(pullId));
    if (mergeSourceBranch) form.append('mergeSourceBranch', mergeSourceBranch);
    if (mergeTargetBranch) form.append('mergeTargetBranch', mergeTargetBranch);
    if (mergeSourceHead) form.append('mergeSourceHead', mergeSourceHead);
    if (mergeTargetHead) form.append('mergeTargetHead', mergeTargetHead);
    if (restoreCommit) form.append('restoreCommit', restoreCommit);
    if (restoreMessage) form.append('restoreMessage', restoreMessage);
    if (mergeTree) form.append('mergeTree', mergeTree, 'merged-tree.zip');
    if (thumbnailBlob) {
        form.append('thumbnail', thumbnailBlob, 'thumb.png');
    }
    const path = `/projects/${id}/upload`;
    try {
        return await uploadXhr(path, form, onUploadProgress);
    } catch (e) {
        if (e.status !== 401) throw e;
        storeSession(null);
        if (!(await refreshSession())) throw e;
        return uploadXhr(path, form, onUploadProgress);
    } finally {
        clearApiCache();
        clearContentCache();
    }
};

const fetchWorkspace = async url => {
    const path = String(url)
        .replace(/^https?:\/\/[^/]+\/(?:v1|api)/, '')
        .replace(/^\/(?:v1|api)/, '');
    const response = await request(path, {raw: true, cache: false});
    if (!response.ok) throw new Error(`Could not load MistWarp history (${response.status})`);
    return response.blob();
};

const bootstrapProjectHistory = (id, {workspace, git}) => {
    const form = new FormData();
    form.append('workspace', workspace, 'project.mwp');
    form.append('git', JSON.stringify(git));
    return uploadXhr(`/projects/${id}/history/bootstrap`, form);
};

const publishProject = id => request(`/projects/${id}/publish`, {method: 'POST'});

const updateProject = (id, patch) => request(`/projects/${id}`, {method: 'PUT', body: patch});

const getProject = id => request(`/projects/${id}`);

const getRandomProject = exclude => request(
    exclude ? `/projects/random?exclude=${encodeURIComponent(exclude)}` : '/projects/random',
    {cache: false}
);

const getPerks = () => request('/perks');

const getEditorProject = id => request(`/projects/${id}/editor`, {cache: false});

const projectDataLocation = value => {
    try {
        const parsed = new URL(String(value || ''));
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '';
        return `${parsed.origin}${parsed.pathname}`;
    } catch (e) {
        return '';
    }
};

const getServerTrustedExtensions = async (id, projectJsonUrl) => {
    const loading = projectDataLocation(projectJsonUrl);
    if (!id || !loading) return [];
    const params = new URLSearchParams();
    const key = new URL(projectJsonUrl).searchParams.get('k');
    if (key) params.set('k', key);
    const query = params.toString();
    try {
        const path = `/projects/${encodeURIComponent(id)}/trusted-extensions${query ? `?${query}` : ''}`;
        const result = await request(path, {cache: false, timeoutMs: 5000});
        const served = Array.isArray(result && result.jsonUrls) ? result.jsonUrls.map(projectDataLocation) : [];
        if (!served.includes(loading)) return [];
        return Array.isArray(result.trustedExtensions) ? result.trustedExtensions : [];
    } catch (e) {
        return [];
    }
};

const getProjectCommits = (id, projectJsonUrl = '') => {
    const params = new URLSearchParams();
    try {
        const key = new URL(projectJsonUrl).searchParams.get('k');
        if (key) params.set('k', key);
    } catch (e) {
        // Public projects and relative URLs do not need an access key.
    }
    const query = params.toString();
    return request(`/projects/${id}/commits${query ? `?${query}` : ''}`);
};

const remixProject = (id, setup) => request(`/projects/${id}/remix`, {method: 'POST', body: setup});

const deleteProject = id => request(`/projects/${id}`, {method: 'DELETE'});

export {
    setSessionProvider,
    uploadXhr,
    loadSession,
    storeSession,
    exchangeValidator,
    requestValidator,
    runExchange,
    setRoturTokenGetter,
    onAuthInvalid,
    onBanned,
    logout,
    createProject,
    uploadProject,
    publishProject,
    updateProject,
    checkProjectAssets,
    getProject,
    getPerks,
    getEditorProject,
    getServerTrustedExtensions,
    getProjectCommits,
    getRandomProject,
    remixProject,
    deleteProject,
    request,
    getCustomExtensionUrls,
    collectExtensionSources,
    prepareSparseProjectUpload,
    hashExtensionUrl,
    extensionSourceUrl,
    fetchWorkspace,
    bootstrapProjectHistory,
    clearApiCache,
    friendlyError,
    staleCacheTest
};
