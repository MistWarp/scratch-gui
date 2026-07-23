import {getRoturToken} from '../lib/rotur/identity.js';

const ROTUR_API = 'https://api.rotur.dev';
const AVATARS = 'https://avatars.rotur.dev';

const roturToken = () => getRoturToken();

const get = async (path, params = {}) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== null && typeof value !== 'undefined') {
            query.set(key, String(value));
        }
    }
    const token = roturToken();
    const headers = token ? {Authorization: `Bearer ${token}`} : {};
    const search = query.toString();
    const response = await fetch(`${ROTUR_API}${path}${search ? `?${search}` : ''}`, {headers});
    let data = null;
    try {
        data = await response.json();
    } catch (e) {
        data = null;
    }
    if (!response.ok || (data && data.error)) {
        const error = new Error((data && data.error) || `Rotur request failed (${response.status})`);
        error.status = response.status;
        throw error;
    }
    return data;
};

const CACHE_TTL = 30000;
const cache = new Map();

const cachedGet = (path, params = {}) => {
    const key = `${path}|${JSON.stringify(params)}|${roturToken() || ''}`;
    const hit = cache.get(key);
    if (hit) {
        if (hit.promise) return hit.promise;
        if (Date.now() - hit.time < CACHE_TTL) return Promise.resolve(hit.data);
    }
    const promise = get(path, params).then(data => {
        cache.set(key, {time: Date.now(), data});
        return data;
    }, err => {
        cache.delete(key);
        throw err;
    });
    cache.set(key, {promise});
    return promise;
};

const avatar = (username, size = 128, radius = 0) => {
    const params = new URLSearchParams({s: String(size)});
    if (radius) params.set('radius', String(radius));
    return `${AVATARS}/${encodeURIComponent((username || '').toLowerCase())}?${params}`;
};

const banner = username => `${AVATARS}/.banners/${encodeURIComponent((username || '').toLowerCase())}`;

const getStatus = username => cachedGet('/status/get', {name: username});

const followerLeaderboard = async (max = 15) => {
    const users = await cachedGet('/stats/followers', {max});
    return Promise.all(users.map(async user => {
        try {
            const [profile, status] = await Promise.all([
                cachedGet(`/profile/${encodeURIComponent(user.username)}`, {include_posts: '0'}),
                getStatus(user.username).catch(() => null)
            ]);
            return {...user, index: profile.index, status};
        } catch (e) {
            return user;
        }
    }));
};

const rotur = {
    avatar,
    banner,
    profile: (username, {includePosts = false} = {}) =>
        cachedGet(`/profile/${encodeURIComponent(username)}`, {include_posts: includePosts ? '1' : '0'}),
    follow: username => get('/follow', {username}).then(data => {
        cache.clear();
        return data;
    }),
    unfollow: username => get('/unfollow', {username}).then(data => {
        cache.clear();
        return data;
    }),
    followers: username => cachedGet('/followers', {name: username}),
    following: username => cachedGet('/following', {name: username}),
    status: getStatus,
    followerLeaderboard
};

export default rotur;
