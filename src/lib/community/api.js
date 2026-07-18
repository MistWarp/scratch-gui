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

const runExchange = token => {
    if (!exchangeInFlight) {
        exchangeInFlight = exchangeValidator(token)
            .catch(error => {
                if (error.code === 'VALIDATOR_GENERATION_FAILED' && authInvalidHandler) {
                    authInvalidHandler();
                }
                throw error;
            })
            .finally(() => {
                exchangeInFlight = null;
            });
    }
    return exchangeInFlight;
};

const request = async (path, {method = 'GET', body, headers = {}, raw = false} = {}) => {
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
    return parseResponse(response);
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

const uploadProject = async (id, sb3Blob, thumbnailBlob, onUploadProgress) => {
    const form = new FormData();
    form.append('project', sb3Blob, 'project.sb3');
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
    }
};

const publishProject = id => request(`/projects/${id}/publish`, {method: 'POST'});

const updateProject = (id, patch) => request(`/projects/${id}`, {method: 'PUT', body: patch});

const checkProjectAssets = (id, assets) => request(`/projects/${id}/assets/check`, {method: 'POST', body: {assets}});

const getProject = id => request(`/projects/${id}`);

const remixProject = id => request(`/projects/${id}/remix`, {method: 'POST'});

const deleteProject = id => request(`/projects/${id}`, {method: 'DELETE'});

export {
    loadSession,
    storeSession,
    exchangeValidator,
    runExchange,
    onAuthInvalid,
    logout,
    createProject,
    uploadProject,
    publishProject,
    updateProject,
    checkProjectAssets,
    getProject,
    remixProject,
    deleteProject,
    request
};
