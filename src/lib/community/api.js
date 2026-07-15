const API_BASE = 'https://mwapi.mistium.com/api';

const SESSION_KEY = 'mw:mistwarp-session';

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

const request = async (path, {method = 'GET', body, headers = {}, raw = false} = {}) => {
    const session = loadSession();
    const finalHeaders = {...headers};
    if (session) {
        finalHeaders.Authorization = `Bearer ${session}`;
    }
    const options = {method, headers: finalHeaders, credentials: 'include'};
    if (body instanceof FormData) {
        options.body = body;
    } else if (typeof body !== 'undefined') {
        finalHeaders['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
    }
    const response = await fetch(`${API_BASE}${path}`, options);
    if (path === '/me' && response.status === 401) {
        storeSession(null);
    }
    if (raw) {
        return response;
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
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
    const validatorData = await validatorResponse.json();
    const validator = validatorData.validator;
    if (!validator) {
        const error = new Error(validatorData.error || 'Could not validate Rotur login');
        error.code = 'VALIDATOR_GENERATION_FAILED';
        throw error;
    }
    const authData = await request(`/auth?v=${encodeURIComponent(validator)}`, {method: 'POST'});
    storeSession(authData.token);
    return authData;
};

const logout = async () => {
    try {
        await request('/logout', {method: 'POST'});
    } finally {
        storeSession(null);
    }
};

const createProject = payload => request('/projects', {method: 'POST', body: payload});

const uploadProject = (id, sb3Blob, thumbnailBlob) => {
    const form = new FormData();
    form.append('project', sb3Blob, 'project.sb3');
    if (thumbnailBlob) {
        form.append('thumbnail', thumbnailBlob, 'thumb.png');
    }
    return request(`/projects/${id}/upload`, {method: 'POST', body: form});
};

const publishProject = id => request(`/projects/${id}/publish`, {method: 'POST'});

const getProject = id => request(`/projects/${id}`);

const remixProject = id => request(`/projects/${id}/remix`, {method: 'POST'});

export {
    loadSession,
    storeSession,
    exchangeValidator,
    logout,
    createProject,
    uploadProject,
    publishProject,
    getProject,
    remixProject,
    request
};
