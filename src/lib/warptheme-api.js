import {ensureScopes} from './rotur/client.js';

const WARPTHEME_API_BASE = 'https://warptheme.mistium.com/api';
const WARPTHEME_SESSION_KEY = 'mw:warptheme-session';
const ROTUR_TOKEN_KEY = 'mw:rotur-token';
const likedThemes = new Set();

const clearSession = () => {
    likedThemes.clear();
    try {
        localStorage.removeItem(WARPTHEME_SESSION_KEY);
    } catch (error) {
        // Ignore unavailable storage.
    }
};

const readStorage = key => {
    try {
        return localStorage.getItem(key) || '';
    } catch (error) {
        return '';
    }
};

const readSession = () => {
    const stored = readStorage(WARPTHEME_SESSION_KEY);
    const roturToken = readStorage(ROTUR_TOKEN_KEY);
    if (!stored) {
        likedThemes.clear();
        return '';
    }
    if (!roturToken) {
        clearSession();
        return '';
    }
    try {
        const session = JSON.parse(stored);
        if (session.roturToken === roturToken && session.token) return session.token;
    } catch (error) {
        // Legacy sessions were not bound to an identity and must be exchanged again.
    }
    clearSession();
    return '';
};

const storeSession = token => {
    try {
        if (token) {
            localStorage.setItem(WARPTHEME_SESSION_KEY, JSON.stringify({
                token,
                roturToken: readStorage(ROTUR_TOKEN_KEY)
            }));
        } else clearSession();
    } catch (error) {
        // Storage can be unavailable in private browsing. The current request can still continue.
    }
};

const responseData = async response => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false || data.error) {
        const error = new Error(data.error || `WarpTheme request failed (${response.status})`);
        error.status = response.status;
        error.data = data;
        throw error;
    }
    return data;
};

const exchangeSession = async () => {
    await ensureScopes(['validators:generate']);
    const roturToken = readStorage(ROTUR_TOKEN_KEY);
    if (!roturToken) throw new Error('Sign in with Rotur to use this WarpTheme action.');
    const validatorResponse = await fetch(
        `https://api.rotur.dev/generate_validator?key=warptheme&auth=${encodeURIComponent(roturToken)}`
    );
    const validatorData = await validatorResponse.json().catch(() => ({}));
    if (!validatorResponse.ok || !validatorData.validator) {
        const error = new Error(validatorData.error || 'Could not authorize WarpTheme.');
        error.status = validatorResponse.status;
        error.data = validatorData;
        throw error;
    }
    const authResponse = await fetch(
        `${WARPTHEME_API_BASE}/auth?v=${encodeURIComponent(validatorData.validator)}`,
        {method: 'POST'}
    );
    const authData = await responseData(authResponse);
    storeSession(authData.token || authData.sessionId);
    return authData.token || authData.sessionId;
};

const request = async (
    path,
    {method = 'GET', body, authenticated = false, optionalAuth = false, form = false} = {}
) => {
    const run = token => {
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const options = {method, headers};
        if (typeof body !== 'undefined') {
            if (form) {
                headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
                options.body = new URLSearchParams(body).toString();
            } else {
                headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(body);
            }
        }
        return fetch(`${WARPTHEME_API_BASE}${path}`, options);
    };
    let token = authenticated || optionalAuth ? readSession() : '';
    if (authenticated && !token) token = await exchangeSession();
    let response = await run(token);
    if ((authenticated || optionalAuth) && response.status === 401) {
        storeSession('');
        if (authenticated) {
            token = await exchangeSession();
            response = await run(token);
        }
    }
    return responseData(response);
};

const hydrateLikedThemes = async ({required = false} = {}) => {
    if (!required && !readSession()) return;
    const liked = await request('/user/likes', {
        authenticated: required,
        optionalAuth: !required
    });
    likedThemes.clear();
    for (const theme of liked.themes || []) likedThemes.add(theme.uuid || theme.id);
};

const normalizeTheme = theme => ({
    ...theme,
    id: theme.uuid || theme.id,
    owner: theme.authorName || theme.owner || theme.author || 'Unknown',
    visual: theme.visual || {colors: theme.colors || theme.theme?.colors || {}},
    liked: likedThemes.has(theme.uuid || theme.id)
});

const listThemes = async ({owner = '', sort = 'likes'} = {}) => {
    const remoteSort = sort === 'downloads' ? 'newest' : sort;
    const data = await request(`/themes?platform=mistwarp&sort=${encodeURIComponent(remoteSort)}`);
    let themes = (data.themes || []).map(normalizeTheme);
    if (owner) {
        const expected = owner.toLowerCase();
        themes = themes.filter(theme => theme.owner.toLowerCase() === expected)
            .map(theme => ({...theme, isOwner: true}));
    }
    if (sort === 'downloads') themes.sort((left, right) => (right.downloads || 0) - (left.downloads || 0));
    return {themes};
};

const downloadTheme = async (id, {track = false} = {}) => {
    const exported = await request(`/theme/download?uuid=${encodeURIComponent(id)}&platform=mistwarp`, {
        authenticated: track
    });
    const theme = Array.isArray(exported.themes) ? exported.themes[0] : exported;
    if (!theme || typeof theme !== 'object') throw new Error('WarpTheme returned invalid theme data.');
    return {theme};
};

const getTheme = async id => {
    const encodedId = encodeURIComponent(id);
    const [detail, downloaded, listed] = await Promise.all([
        request(`/theme?uuid=${encodedId}`),
        downloadTheme(id),
        listThemes().catch(() => ({themes: []})),
        hydrateLikedThemes().catch(() => {})
    ]);
    const listing = listed.themes.find(theme => theme.id === id) || {};
    return {
        theme: normalizeTheme({
            ...detail.theme,
            ...listing,
            uuid: id,
            theme: downloaded.theme
        })
    };
};

const createTheme = async payload => {
    const result = await request('/theme', {
        method: 'POST',
        authenticated: true,
        body: {
            themes: [{
                name: payload.name,
                description: payload.description || '',
                platform: 'mistwarp',
                themeJson: payload.theme
            }]
        }
    });
    const id = (result.uuids || [])[0];
    if (!id) throw new Error('WarpTheme did not return the published theme id.');
    return {theme: {id}};
};

const updateTheme = (id, patch) => {
    if (!Object.hasOwn(patch, 'name') && !Object.hasOwn(patch, 'description')) return Promise.resolve({});
    return request('/theme/name', {
        method: 'PUT',
        authenticated: true,
        body: {uuid: id, name: patch.name, description: patch.description || ''}
    });
};

const deleteTheme = id => request(`/theme?uuid=${encodeURIComponent(id)}`, {
    method: 'DELETE', authenticated: true
});

const likeTheme = async id => {
    await hydrateLikedThemes({required: true});
    const wasLiked = likedThemes.has(id);
    const result = await request('/rate', {
        method: 'POST', authenticated: true, form: true, body: {uuid: id, rating: 'like'}
    });
    if (wasLiked) likedThemes.delete(id);
    else likedThemes.add(id);
    return {...result, liked: likedThemes.has(id)};
};

const warpthemeApi = {
    themes: listThemes,
    getTheme,
    createTheme,
    updateTheme,
    deleteTheme,
    likeTheme,
    downloadTheme
};

export {WARPTHEME_API_BASE, normalizeTheme, request};
export default warpthemeApi;
