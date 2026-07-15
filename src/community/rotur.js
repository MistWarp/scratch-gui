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

const followerLeaderboard = async (max = 15) => {
    const users = await get('/stats/followers', {max});
    return Promise.all(users.map(async user => {
        try {
            const profile = await get(`/profile/${encodeURIComponent(user.username)}`, {include_posts: '0'});
            return {...user, index: profile.index, status: profile.status};
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
    follow: username => get('/follow', {username}),
    unfollow: username => get('/unfollow', {username}),
    followers: username => get('/followers', {name: username}),
    following: username => get('/following', {name: username}),
    followerLeaderboard
};

export default rotur;
