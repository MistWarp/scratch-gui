import {getRoturToken} from '../lib/rotur/identity.js';
import {ensureScopes, getRotur} from '../lib/rotur/client.js';

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
const CACHE_MAX_ENTRIES = 200;
const cache = new Map();
const cacheKey = (path, params) => `${path}|${JSON.stringify(params)}|${roturToken() || ''}`;

const mutate = async (path, {method = 'POST', params = {}, body, scopes = []} = {}) => {
    if (scopes.length) await ensureScopes(scopes);
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && typeof value !== 'undefined') query.set(key, String(value));
    });
    const token = roturToken();
    if (!token) throw new Error('Log in to continue');
    const response = await fetch(`${ROTUR_API}${path}${query.toString() ? `?${query}` : ''}`, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(typeof body === 'undefined' ? {} : {'Content-Type': 'application/json'})
        },
        ...(typeof body === 'undefined' ? {} : {body: JSON.stringify(body)})
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || (data && data.error)) {
        throw new Error((data && data.error) || `Rotur request failed (${response.status})`);
    }
    cache.clear();
    return data;
};

const pruneCache = () => {
    const now = Date.now();
    for (const [key, entry] of cache) {
        if (!entry.promise && now - entry.time >= CACHE_TTL) cache.delete(key);
    }
    while (cache.size > CACHE_MAX_ENTRIES) {
        const oldestResolved = Array.from(cache).find(([, entry]) => !entry.promise);
        if (!oldestResolved) break;
        cache.delete(oldestResolved[0]);
    }
};

const cachedGet = (path, params = {}) => {
    const key = cacheKey(path, params);
    const hit = cache.get(key);
    if (hit) {
        cache.delete(key);
        cache.set(key, hit);
        if (hit.promise) return hit.promise;
        if (Date.now() - hit.time < CACHE_TTL) return Promise.resolve(hit.data);
    }
    pruneCache();
    const promise = get(path, params).then(data => {
        cache.set(key, {time: Date.now(), data});
        pruneCache();
        return data;
    }, err => {
        cache.delete(key);
        throw err;
    });
    cache.set(key, {promise});
    return promise;
};

const getProfile = (username, {includePosts = false} = {}) => {
    const canonicalUsername = String(username || '').trim().toLowerCase();
    const path = `/profile/${encodeURIComponent(canonicalUsername)}`;
    const params = {include_posts: includePosts ? '1' : '0'};
    return cachedGet(path, params).then(data => {
        if (includePosts) {
            cache.set(cacheKey(path, {include_posts: '0'}), {time: Date.now(), data});
            pruneCache();
        }
        return data;
    });
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
            const profile = await cachedGet(`/profile/${encodeURIComponent(user.username)}`, {
                include_posts: '0'
            });
            return {...user, index: profile.index, status: profile.status || null};
        } catch (e) {
            return user;
        }
    }));
};

const authenticatedAction = async (scopes, action) => {
    await ensureScopes(scopes);
    const client = getRotur();
    if (!client.loggedIn) throw new Error('Log in to continue');
    const result = await action(client);
    cache.clear();
    return result;
};

const scopedGet = async (scopes, path, params = {}) => {
    await ensureScopes(scopes);
    return get(path, params);
};

const groupBundle = async (tag, {includeMembers = false} = {}) => {
    await ensureScopes(includeMembers ? ['groups:view', 'groups:members.view'] : ['groups:view']);
    const base = `/groups/${encodeURIComponent(tag)}`;
    const safe = promise => promise.catch(() => []);
    const [campaigns, announcements, events, products, roles, members] = await Promise.all([
        safe(get(`${base}/campaigns`)),
        safe(get(`${base}/announcements`)),
        safe(get(`${base}/events`)),
        safe(get(`${base}/products`)),
        safe(get(`${base}/roles`)),
        includeMembers ? get(`${base}/members`, {per_page: 100}).catch(() => null) : null
    ]);
    return {campaigns, announcements, events, products, roles, members};
};

const withGroupTags = users => Promise.all((users || []).map(async user => {
    if (!user || user.group_tag) return user;
    try {
        const profile = await cachedGet(`/profile/${encodeURIComponent(user.username)}`, {include_posts: '0'});
        return {...user, group_tag: profile.group_tag || ''};
    } catch (e) {
        return user;
    }
}));

const rotur = {
    avatar,
    banner,
    profile: getProfile,
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
    badgePreferences: () => authenticatedAction(['account:view'], client => client.me.badgePreferences()),
    updateBadgePreferences: preferences => authenticatedAction(
        ['account:profile'],
        client => client.me.updateBadgePreferences(preferences)
    ),
    createProfilePost: content => authenticatedAction(
        ['posts:create'],
        client => client.posts.create(content, {profileOnly: true, os: 'MistWarp'})
    ),
    deletePost: id => authenticatedAction(['posts:delete'], client => client.posts.delete(id)),
    status: getStatus,
    followerLeaderboard,
    withGroupTags,
    groups: {
        search: query => get('/groups/search', {query}),
        bundle: groupBundle,
        mine: () => scopedGet(['groups:view'], '/groups/mine'),
        get: tag => get(`/groups/${encodeURIComponent(tag)}`),
        members: tag => scopedGet(
            ['groups:view', 'groups:members.view'],
            `/groups/${encodeURIComponent(tag)}/members`,
            {per_page: 100}
        ),
        campaigns: tag => scopedGet(['groups:view'], `/groups/${encodeURIComponent(tag)}/campaigns`),
        announcements: tag => scopedGet(['groups:view'], `/groups/${encodeURIComponent(tag)}/announcements`),
        events: tag => scopedGet(['groups:view'], `/groups/${encodeURIComponent(tag)}/events`),
        products: tag => scopedGet(['groups:view'], `/groups/${encodeURIComponent(tag)}/products`),
        roles: tag => scopedGet(['groups:view'], `/groups/${encodeURIComponent(tag)}/roles`),
        join: tag => mutate(`/groups/${encodeURIComponent(tag)}/join`, {scopes: ['groups:join']}),
        requestJoin: (tag, message = '') => mutate(`/groups/${encodeURIComponent(tag)}/join_requests`, {
            params: {message}, scopes: ['groups:join']
        }),
        leave: tag => mutate(`/groups/${encodeURIComponent(tag)}/leave`, {scopes: ['groups:leave']}),
        represent: tag => mutate(`/groups/${encodeURIComponent(tag)}/rep`, {scopes: ['account:settings']}),
        stopRepresenting: tag => mutate(`/groups/${encodeURIComponent(tag)}/disrep`, {
            scopes: ['account:settings']
        }),
        create: group => mutate('/groups/create', {params: group, scopes: ['groups:manage']}),
        contribute: (tag, campaign, amount, note = '') => mutate(
            `/groups/${encodeURIComponent(tag)}/campaigns/${encodeURIComponent(campaign)}/contribute`,
            {params: {amount, note}, scopes: ['credits:manage']}
        )
    }
};

export default rotur;
