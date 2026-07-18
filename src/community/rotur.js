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

const avatar = (username, size = 128, radius = 0) => {
    const params = new URLSearchParams({s: String(size)});
    if (radius) params.set('radius', String(radius));
    return `${AVATARS}/${encodeURIComponent((username || '').toLowerCase())}?${params}`;
};

const banner = username => `${AVATARS}/.banners/${encodeURIComponent((username || '').toLowerCase())}`;

const getStatus = username => get('/status/get', {name: username});

const followerCountCache = new Map();
const followerCount = async username => {
    const key = (username || '').toLowerCase();
    if (followerCountCache.has(key)) {
        return followerCountCache.get(key);
    }
    try {
        const profile = await get(`/profile/${encodeURIComponent(username)}`, {include_posts: '0'});
        const count = typeof profile.followers === 'number' ? profile.followers : 0;
        followerCountCache.set(key, count);
        return count;
    } catch (e) {
        return 0;
    }
};

const followerLeaderboard = async (max = 15) => {
    const users = await get('/stats/followers', {max});
    return Promise.all(users.map(async user => {
        try {
            const [profile, status] = await Promise.all([
                get(`/profile/${encodeURIComponent(user.username)}`, {include_posts: '0'}),
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
        get(`/profile/${encodeURIComponent(username)}`, {include_posts: includePosts ? '1' : '0'}),
    follow: async username => {
        const result = await get('/follow', {username});
        followerCountCache.delete((username || '').toLowerCase());
        return result;
    },
    unfollow: async username => {
        const result = await get('/unfollow', {username});
        followerCountCache.delete((username || '').toLowerCase());
        return result;
    },
    followers: username => get('/followers', {name: username}),
    following: username => get('/following', {name: username}),
    status: getStatus,
    followerCount,
    followerLeaderboard
};

export default rotur;
