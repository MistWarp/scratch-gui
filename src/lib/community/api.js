import JSZip from '@turbowarp/jszip';
import {clearContentCache} from './cached-fetch.js';
import {isGalleryExtensionUrl} from '../trusted-extension.js';

const API_BASE = 'https://mwapi.mistium.com/api';

const SESSION_KEY = 'mw:mistwarp-session';
const ROTUR_TOKEN_KEY = 'mw:rotur-token';

const loadRoturToken = () => {
    try {
        return localStorage.getItem(ROTUR_TOKEN_KEY) || null;
    } catch (e) {
        return null;
    }
};

let exchangeInFlight = null;

const loadSession = () => {
    try {
        return localStorage.getItem(SESSION_KEY) || null;
    } catch (e) {
        return null;
    }
};

const storeSession = token => {
    try {
        if (token) {
            localStorage.setItem(SESSION_KEY, token);
        } else {
            localStorage.removeItem(SESSION_KEY);
        }
    } catch (e) {
        // ignore
    }
};

const GET_CACHE_PREFIX = 'mw:api-cache:';
const GET_CACHE_TTL = 60 * 1000;

const getCacheKey = path => {
    const session = loadSession();
    return `${GET_CACHE_PREFIX}${session ? session.slice(-8) : 'anon'}:${path}`;
};

const clearApiCache = () => {
    try {
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith(GET_CACHE_PREFIX)) {
                sessionStorage.removeItem(key);
            }
        }
    } catch (e) {
        // ignore
    }
};

const readApiCache = path => {
    try {
        const raw = sessionStorage.getItem(getCacheKey(path));
        if (!raw) return null;
        const {data, at} = JSON.parse(raw);
        if (!at || Date.now() - at > GET_CACHE_TTL) return null;
        return data;
    } catch (e) {
        return null;
    }
};

const writeApiCache = (path, data) => {
    try {
        sessionStorage.setItem(getCacheKey(path), JSON.stringify({data, at: Date.now()}));
    } catch (e) {
        clearApiCache();
    }
};

const parseResponse = async response => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false || data.error) {
        const error = new Error(data.error || `Request failed (${response.status})`);
        error.status = response.status;
        error.code = data.code;
        error.data = data;
        throw error;
    }
    return data;
};

const exchangeValidator = async (roturToken, appKey = 'mistwarp') => {
    const validatorResponse = await fetch(
        `https://api.rotur.dev/generate_validator?key=${encodeURIComponent(appKey)}&auth=${encodeURIComponent(roturToken)}`
    );
    const validatorData = await validatorResponse.json().catch(() => ({}));
    const validator = validatorData.validator;
    if (!validator) {
        const error = new Error(validatorData.error || 'Could not validate Rotur login');
        if (validatorData.error || validatorResponse.status === 403) {
            error.code = 'VALIDATOR_GENERATION_FAILED';
        }
        throw error;
    }
    const authResponse = await fetch(
        `${API_BASE}/auth?v=${encodeURIComponent(validator)}`,
        {method: 'POST'}
    );
    const authData = await parseResponse(authResponse);
    storeSession(authData.token);
    return authData;
};

let authInvalidHandler = null;
const onAuthInvalid = handler => {
    authInvalidHandler = handler;
};

let bannedHandler = null;
const onBanned = handler => {
    bannedHandler = handler;
};

const runExchange = token => {
    if (!exchangeInFlight) {
        exchangeInFlight = exchangeValidator(token)
            .catch(error => {
                if (error.code === 'VALIDATOR_GENERATION_FAILED' && authInvalidHandler) {
                    authInvalidHandler();
                }
                if (error.code === 'banned' && bannedHandler) {
                    bannedHandler(error.message);
                }
                throw error;
            })
            .finally(() => {
                exchangeInFlight = null;
            });
    }
    return exchangeInFlight;
};

const request = async (path, {method = 'GET', body, headers = {}, raw = false, cache = true} = {}) => {
    const cacheable = method === 'GET' && !raw && cache;
    if (cacheable) {
        const hit = readApiCache(path);
        if (hit) return hit;
    } else if (method !== 'GET' && !path.endsWith('/view')) {
        clearApiCache();
    }
    const doFetch = () => {
        const session = loadSession();
        const finalHeaders = {...headers};
        if (session) {
            finalHeaders.Authorization = `Bearer ${session}`;
        }
        const options = {method, headers: finalHeaders};
        if (body instanceof FormData) {
            options.body = body;
        } else if (typeof body !== 'undefined') {
            finalHeaders['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }
        return fetch(`${API_BASE}${path}`, options);
    };
    let response = await doFetch();
    if (
        response.status === 401 &&
        !path.startsWith('/auth') &&
        !path.startsWith('/logout')
    ) {
        storeSession(null);
        const roturToken = loadRoturToken();
        if (roturToken) {
            try {
                await runExchange(roturToken);
                response = await doFetch();
            } catch (e) {
                // keep the original 401 response
            }
        }
    }
    if (path === '/me' && response.status === 401) {
        storeSession(null);
    }
    if (raw) {
        return response;
    }
    const data = await parseResponse(response);
    if (cacheable) {
        writeApiCache(path, data);
    }
    return data;
};

const logout = async () => {
    try {
        await request('/logout', {method: 'POST'});
    } finally {
        storeSession(null);
    }
};

const createProject = payload => request('/projects', {method: 'POST', body: payload});

const uploadXhr = (path, form, onUploadProgress) => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}${path}`);
    const session = loadSession();
    if (session) {
        xhr.setRequestHeader('Authorization', `Bearer ${session}`);
    }
    xhr.upload.onprogress = event => {
        if (event.lengthComputable && typeof onUploadProgress === 'function') {
            onUploadProgress(event.loaded, event.total);
        }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onload = () => {
        let data = {};
        try {
            data = JSON.parse(xhr.responseText);
        } catch (e) {
            data = {};
        }
        if (xhr.status >= 200 && xhr.status < 300 && data.ok !== false && !data.error) {
            resolve(data);
            return;
        }
        const error = new Error(data.error || `Request failed (${xhr.status})`);
        error.status = xhr.status;
        error.code = data.code;
        error.data = data;
        reject(error);
    };
    xhr.send(form);
});

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

const uploadProject = async (id, sb3Blob, thumbnailBlob, onUploadProgress) => {
    const form = new FormData();
    form.append('project', sb3Blob, 'project.sb3');
    form.append('extensions', JSON.stringify(await collectExtensionSources(sb3Blob)));
    if (thumbnailBlob) {
        form.append('thumbnail', thumbnailBlob, 'thumb.png');
    }
    const path = `/projects/${id}/upload`;
    try {
        return await uploadXhr(path, form, onUploadProgress);
    } catch (e) {
        if (e.status !== 401) throw e;
        storeSession(null);
        const roturToken = loadRoturToken();
        if (!roturToken) throw e;
        await runExchange(roturToken);
        return uploadXhr(path, form, onUploadProgress);
    } finally {
        clearApiCache();
        clearContentCache();
    }
};

const publishProject = id => request(`/projects/${id}/publish`, {method: 'POST'});

const updateProject = (id, patch) => request(`/projects/${id}`, {method: 'PUT', body: patch});

const checkProjectAssets = (id, assets) => request(`/projects/${id}/assets/check`, {method: 'POST', body: {assets}});

const getProject = id => request(`/projects/${id}`);

const getEditorProject = id => request(`/projects/${id}/editor`, {cache: false});

const remixProject = id => request(`/projects/${id}/remix`, {method: 'POST'});

const deleteProject = id => request(`/projects/${id}`, {method: 'DELETE'});

const HANDOFF_KEY = 'mw:project-handoff';
const HANDOFF_MAX_AGE = 5 * 60 * 1000;

const stashProjectHandoff = project => {
    try {
        sessionStorage.setItem(HANDOFF_KEY, JSON.stringify({project, at: Date.now()}));
    } catch (e) {
        // ignore
    }
};

const takeProjectHandoff = id => {
    try {
        const raw = sessionStorage.getItem(HANDOFF_KEY);
        if (!raw) return null;
        sessionStorage.removeItem(HANDOFF_KEY);
        const {project, at} = JSON.parse(raw);
        if (!project || String(project.id) !== String(id)) return null;
        if (!at || Date.now() - at > HANDOFF_MAX_AGE) return null;
        return project;
    } catch (e) {
        return null;
    }
};

export {
    loadSession,
    stashProjectHandoff,
    takeProjectHandoff,
    storeSession,
    exchangeValidator,
    runExchange,
    onAuthInvalid,
    onBanned,
    logout,
    createProject,
    uploadProject,
    publishProject,
    updateProject,
    checkProjectAssets,
    getProject,
    getEditorProject,
    remixProject,
    deleteProject,
    request,
    getCustomExtensionUrls,
    hashExtensionUrl,
    extensionSourceUrl
};
