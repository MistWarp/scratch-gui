import JSZip from '@turbowarp/jszip';
import {clearContentCache} from './cached-fetch.js';
import {isGalleryExtensionUrl} from '../trusted-extension.js';
import {trackApiSuccess} from '../../community/analytics.js';

const API_BASE = 'https://mwapi.mistium.com/api';

const SESSION_KEY = 'mw:mistwarp-session';
const ROTUR_TOKEN_KEY = 'mw:rotur-token';
const GET_CACHE_PREFIX = 'mw:api-cache:';
const GET_CACHE_TTL = 60 * 1000;

let cacheGeneration = 0;
const inFlightGets = new Map();

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
        const previous = localStorage.getItem(SESSION_KEY);
        if (token) {
            localStorage.setItem(SESSION_KEY, token);
        } else {
            localStorage.removeItem(SESSION_KEY);
        }
        if (previous !== token) {
            cacheGeneration += 1;
            inFlightGets.clear();
        }
    } catch (e) {
        // ignore
    }
};

const getCacheKey = path => {
    const session = loadSession();
    return `${GET_CACHE_PREFIX}${session ? session.slice(-8) : 'anon'}:${path}`;
};

const clearApiCache = () => {
    cacheGeneration += 1;
    inFlightGets.clear();
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

const readApiCache = key => {
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const {data, at} = JSON.parse(raw);
        if (!at || Date.now() - at > GET_CACHE_TTL) return null;
        return data;
    } catch (e) {
        return null;
    }
};

const writeApiCache = (key, data) => {
    try {
        sessionStorage.setItem(key, JSON.stringify({data, at: Date.now()}));
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
        const isRestricted = data.code === 'banned' || data.code === 'account_blocked';
        error.redirectUrl = data.redirectUrl || data.redirect_url || (isRestricted ? 'https://rotur.dev/me' : null);
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
        error.status = validatorResponse.status;
        const defaultCode = validatorResponse.status === 403 ? 'account_blocked' : 'VALIDATOR_GENERATION_FAILED';
        error.code = validatorData.code || defaultCode;
        error.redirectUrl = validatorData.redirect_url || 'https://rotur.dev/me';
        error.data = validatorData;
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
                if ((error.code === 'banned' || error.code === 'account_blocked') && bannedHandler) {
                    bannedHandler(error.message, error.redirectUrl || 'https://rotur.dev/me');
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
    const cacheKey = cacheable ? getCacheKey(path) : '';
    if (cacheable) {
        const hit = readApiCache(cacheKey);
        if (hit) return hit;
        const pending = inFlightGets.get(cacheKey);
        if (pending) return pending;
    } else if (method !== 'GET' && !path.endsWith('/view')) {
        clearApiCache();
    }
    const generation = cacheGeneration;
    const run = async () => {
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
        if (raw) return response;
        const data = await parseResponse(response);
        trackApiSuccess(path, method);
        if (cacheable && generation === cacheGeneration) {
            writeApiCache(cacheKey, data);
        }
        return data;
    };
    if (!cacheable) return run();
    const pending = run();
    inFlightGets.set(cacheKey, pending);
    try {
        return await pending;
    } finally {
        if (inFlightGets.get(cacheKey) === pending) {
            inFlightGets.delete(cacheKey);
        }
    }
};

const logout = async () => {
    try {
        await request('/logout', {method: 'POST'});
    } finally {
        storeSession(null);
    }
};

const createProject = payload => request('/projects', {method: 'POST', body: payload});

const UPLOAD_STALL_TIMEOUT = 120000;
const UPLOAD_PROCESSING_TIMEOUT = 180000;

const uploadXhr = (path, form, onUploadProgress) => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let timeoutId = null;
    let settled = false;
    const finish = callback => value => {
        if (settled) return;
        settled = true;
        if (timeoutId) clearTimeout(timeoutId);
        callback(value);
    };
    const finishResolve = finish(resolve);
    const finishReject = finish(reject);
    const scheduleTimeout = (delay, processing) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            const error = new Error(processing ?
                'The upload finished, but the server took too long to respond. It may still finish in the ' +
                    'background; check My Stuff before retrying.' :
                'The upload stopped making progress. Check your connection and try again.');
            error.code = processing ? 'upload_processing_timeout' : 'upload_stalled';
            finishReject(error);
            xhr.abort();
        }, delay);
    };
    xhr.open('POST', `${API_BASE}${path}`);
    const session = loadSession();
    if (session) {
        xhr.setRequestHeader('Authorization', `Bearer ${session}`);
    }
    xhr.upload.onprogress = event => {
        if (settled) return;
        scheduleTimeout(
            event.lengthComputable && event.loaded >= event.total ? UPLOAD_PROCESSING_TIMEOUT : UPLOAD_STALL_TIMEOUT,
            event.lengthComputable && event.loaded >= event.total
        );
        if (event.lengthComputable && typeof onUploadProgress === 'function') {
            onUploadProgress(event.loaded, event.total);
        }
    };
    xhr.onerror = () => finishReject(new Error('Network error during upload'));
    xhr.onabort = () => {
        if (!settled) finishReject(new Error('Upload cancelled'));
    };
    xhr.onload = () => {
        let data = {};
        try {
            data = JSON.parse(xhr.responseText);
        } catch (e) {
            data = {};
        }
        if (xhr.status >= 200 && xhr.status < 300 && data.ok !== false && !data.error) {
            finishResolve(data);
            return;
        }
        const error = new Error(data.error || `Request failed (${xhr.status})`);
        error.status = xhr.status;
        error.code = data.code;
        error.data = data;
        finishReject(error);
    };
    scheduleTimeout(UPLOAD_STALL_TIMEOUT, false);
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
    pullId,
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
    if (pullId) form.append('pullId', String(pullId));
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

const fetchWorkspace = async url => {
    const path = String(url)
        .replace(/^https?:\/\/[^/]+\/api/, '')
        .replace(/^\/api/, '');
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

const getPerks = () => request('/perks');

const getEditorProject = id => request(`/projects/${id}/editor`, {cache: false});

const remixProject = (id, setup) => request(`/projects/${id}/remix`, {method: 'POST', body: setup});

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
    uploadXhr,
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
    getPerks,
    getEditorProject,
    remixProject,
    deleteProject,
    request,
    getCustomExtensionUrls,
    collectExtensionSources,
    prepareSparseProjectUpload,
    hashExtensionUrl,
    extensionSourceUrl,
    fetchWorkspace,
    bootstrapProjectHistory
};
