import JSZip from '@turbowarp/jszip';
import {clearContentCache} from './cached-fetch.js';
import {isGalleryExtensionUrl} from '../trusted-extension.js';
import {trackApiSuccess} from '../../community/analytics.js';
import {setMinorAccount} from '../minor-account.js';
import {sleep} from '../utils/async.js';
import {
    createApiError, createNetworkError, createTimeoutError, friendlyError
} from '../../community/api-errors.js';

// Builds can point at another API with MW_API_BASE (see vite.config.mjs).
const API_BASE = process.env.MW_API_BASE || 'https://api.mistwarp.org/v1';

const SESSION_KEY = 'mw:mistwarp-session';
const GET_CACHE_PREFIX = 'mw:api-cache:';
const GET_CACHE_TTL = 60 * 1000;
// A GET that hasn't answered in this long gives up instead of spinning forever.
const GET_TIMEOUT = 15000;
const GET_RETRY_DELAY = 400;

let cacheGeneration = 0;
const inFlightGets = new Map();

// Where to get a Rotur token for re-signing in to MistWarp after a 401. The
// Rotur session sets it, so this file doesn't depend on it.
let roturTokenGetter = () => Promise.resolve(null);
const setRoturTokenGetter = getter => {
    roturTokenGetter = getter;
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

const cachedPath = key => {
    const start = key.indexOf(':/', GET_CACHE_PREFIX.length);
    return start === -1 ? '' : key.slice(start + 1);
};

// Clears cached GETs. With a test, only the entries whose path it accepts.
const clearApiCache = (test = null) => {
    cacheGeneration += 1;
    for (const key of Array.from(inFlightGets.keys())) {
        if (!test || test(cachedPath(key))) inFlightGets.delete(key);
    }
    try {
        // Find the keys before removing any. Removing an item can reorder the
        // rest, so removing while walking key(i) skips some, and a skipped
        // entry keeps serving stale data, such as a comment list without the
        // comment just posted.
        const keys = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith(GET_CACHE_PREFIX) && (!test || test(cachedPath(key)))) keys.push(key);
        }
        for (const key of keys) sessionStorage.removeItem(key);
    } catch (e) {
        // ignore
    }
};

// Requests that change nothing a GET returns.
const isCacheNeutral = path => path.endsWith('/view') || path.endsWith('/live') || path === '/errors';

// Collections whose items are cached separately, so a change to one item can
// leave the others' cached pages alone.
const SCOPED_COLLECTIONS = ['projects', 'spaces', 'users', 'news', 'roadmap', 'bounties'];
const COLLECTION_PAGES = ['featured', 'random'];
// Actions that change which lists, trees or pages an item shows up in.
const WIDE_ACTIONS = ['remix', 'publish', 'unpublish', 'visibility', 'restore', 'upload', 'history'];

const pathSegments = path => path.split('?')[0].split('/')
    .filter(Boolean);

/**
 * Which cached GETs a request can make stale. Everything, unless the request
 * changes one item of a scoped collection: then that item's pages, and every
 * page that isn't another item of the same collection (lists, feeds, /me and
 * other collections), since those can show the item too.
 * @param {string} method - The request method.
 * @param {string} path - The request path.
 * @returns {?Function} A test for cached paths to drop, or null to drop them all.
 */
const staleCacheTest = (method, path) => {
    const [collection, id, action] = pathSegments(path);
    if (!SCOPED_COLLECTIONS.includes(collection) || !id || COLLECTION_PAGES.includes(id)) return null;
    if (WIDE_ACTIONS.includes(action) || (!action && method === 'DELETE')) return null;
    // Names differ in case between links (/users/Mist, /users/mist), so a
    // case-only difference counts as the same item.
    const item = id.toLowerCase();
    return cached => {
        const [cachedCollection, cachedId] = pathSegments(cached);
        const otherItem = cachedCollection === collection && cachedId &&
            !COLLECTION_PAGES.includes(cachedId) && cachedId.toLowerCase() !== item;
        return !otherItem;
    };
};

const readApiCache = key => {
    try {
        const raw = sessionStorage.getItem(key);
        if (!raw) return null;
        const {data, at} = JSON.parse(raw);
        if (!at || Date.now() - at > GET_CACHE_TTL) {
            sessionStorage.removeItem(key);
            return null;
        }
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

// Codes that mean the account can't use MistWarp at all: a MistWarp ban, a
// Rotur restriction, or a ban from MistWarp's Rotur App.
const RESTRICTED_CODES = ['banned', 'account_blocked', 'app_banned'];

// A ban from MistWarp's Rotur App comes with Rotur's reason and end date.
const banMessage = ({message, data}) => {
    const {reason, until} = data || {};
    const ends = until ? `${message.replace(/\.$/, '')} until ${new Date(until).toLocaleDateString()}.` : message;
    return reason ? `${ends} Reason: ${reason}` : ends;
};

const parseResponse = async response => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false || data.error) {
        const error = createApiError({
            status: response.status,
            code: data.code,
            serverMessage: data.error,
            data
        });
        const isRestricted = RESTRICTED_CODES.includes(data.code);
        error.redirectUrl = data.redirectUrl || data.redirect_url || (isRestricted ? 'https://rotur.dev/me' : null);
        throw error;
    }
    return data;
};

// The token goes in the Authorization header, never the URL, so it stays out
// of server logs, proxies and browser history.
const requestValidator = async (roturToken, key) => {
    const response = await fetch('https://api.rotur.dev/v2/validators', {
        method: 'POST',
        headers: {'Authorization': `Bearer ${roturToken}`, 'Content-Type': 'application/json'},
        body: JSON.stringify({key})
    });
    const data = await response.json().catch(() => ({}));
    if (data.validator) return data.validator;
    const status = response.status;
    const error = new Error(data.error || 'Could not validate Rotur login');
    error.status = status;
    if (status === 403) error.code = data.code || 'account_blocked';
    else if (status === 429 || status >= 500) error.code = data.code || 'VALIDATOR_UNAVAILABLE';
    else error.code = data.code || 'VALIDATOR_GENERATION_FAILED';
    error.redirectUrl = data.redirect_url || 'https://rotur.dev/me';
    error.data = data;
    throw error;
};

// Validators keyed to MistWarp's Rotur App can be made by MistWarp's own
// sign-in token, and Rotur then refuses anyone the app has banned. A server
// that only knows the old key refuses them, so that key is tried next.
const VALIDATOR_KEYS = ['app_1938b6a87799f862', 'mistwarp'];

const exchangeValidator = async roturToken => {
    let authResponse;
    for (const key of VALIDATOR_KEYS) {
        let validator;
        try {
            validator = await requestValidator(roturToken, key);
        } catch (error) {
            // Only MistWarp's own sign-in token can make app-ID validators, so
            // the desktop app's and older tokens get 403 and use the old key.
            // That needs validators:generate; without it, keep an earlier 401.
            if (authResponse) break;
            if (key === VALIDATOR_KEYS[VALIDATOR_KEYS.length - 1]) throw error;
            continue;
        }
        authResponse = await fetch(`${API_BASE}/auth?v=${encodeURIComponent(validator)}`, {method: 'POST'});
        // Today's server answers a validator for a key it doesn't check with
        // 403 invalid_validator; one that tries both keys never does.
        const refused = authResponse.status === 401 || (authResponse.status === 403 &&
            (await authResponse.clone().json()
                .catch(() => ({}))).code === 'invalid_validator');
        if (!refused) break;
    }
    const authData = await parseResponse(authResponse);
    storeSession(authData.token);
    setMinorAccount(authData.minor === true);
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
                if (RESTRICTED_CODES.includes(error.code) && bannedHandler) {
                    bannedHandler(banMessage(error), error.redirectUrl || 'https://rotur.dev/me');
                }
                throw error;
            })
            .finally(() => {
                exchangeInFlight = null;
            });
    }
    return exchangeInFlight;
};

const request = async (path, {method = 'GET', body, headers = {}, raw = false, cache = true, timeoutMs} = {}) => {
    const cacheable = method === 'GET' && !raw && cache;
    const cacheKey = cacheable ? getCacheKey(path) : '';
    // Uploads and raw downloads (project history) can take far longer than a
    // JSON GET, so only those get a deadline unless the caller asks for one.
    const timeout = typeof timeoutMs === 'number' ? timeoutMs : (method === 'GET' && !raw ? GET_TIMEOUT : 0);
    if (cacheable) {
        const hit = readApiCache(cacheKey);
        if (hit) return hit;
        const pending = inFlightGets.get(cacheKey);
        if (pending) return pending;
    } else if (method !== 'GET' && !isCacheNeutral(path)) {
        clearApiCache(staleCacheTest(method, path));
    }
    const generation = cacheGeneration;
    const run = async () => {
        const fetchOnce = () => {
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
            const controller = timeout ? new AbortController() : null;
            if (controller) options.signal = controller.signal;
            const timer = controller ? setTimeout(() => controller.abort(), timeout) : null;
            return fetch(`${API_BASE}${path}`, options)
                .catch(error => {
                    if (controller && controller.signal.aborted) throw createTimeoutError(error);
                    throw createNetworkError(error);
                })
                .finally(() => {
                    if (timer) clearTimeout(timer);
                });
        };
        // A GET changes nothing, so a dropped connection or a server error
        // gets one more try. A timeout doesn't, so the wait stays bounded.
        const doFetch = async () => {
            if (method !== 'GET') return fetchOnce();
            try {
                const response = await fetchOnce();
                if (!(response.status >= 500)) return response;
            } catch (error) {
                if (error.code !== 'network') throw error;
            }
            await sleep(GET_RETRY_DELAY);
            return fetchOnce();
        };
        let response = await doFetch();
        if (
            response.status === 401 &&
            !path.startsWith('/auth') &&
            !path.startsWith('/logout')
        ) {
            storeSession(null);
            const roturToken = await roturTokenGetter();
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
    xhr.onerror = () => finishReject(createNetworkError());
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
        finishReject(createApiError({status: xhr.status, code: data.code, serverMessage: data.error, data}));
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
        const roturToken = await roturTokenGetter();
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
