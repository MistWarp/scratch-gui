import {getRoturToken} from '../lib/rotur/identity.js';
import {ensureScopes, getRotur} from '../lib/rotur/client.js';
import {responseMessage} from './api-errors.js';
import {formatCommunityMessage} from './locale.js';

const ROTUR_API = 'https://api.rotur.dev';
const AVATARS = 'https://avatars.rotur.dev';
// Rotur shows an app's badges only in that app. A request made with
// MistWarp's sign-in token already counts as MistWarp; `app` names it for the
// rest (signed out, or a legacy Rotur key).
const ROTUR_APP_ID = 'app_1938b6a87799f862';

const roturToken = () => getRoturToken();

const roturError = (response, data) => {
    const error = new Error(responseMessage(response.status, data && data.error));
    error.status = response.status;
    if (data && typeof data.code === 'string') error.code = data.code;
    if (data && typeof data === 'object') error.data = data;
    return error;
};

const get = async (path, params = {}, {optionalAuth = false} = {}) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== null && typeof value !== 'undefined') {
            query.set(key, String(value));
        }
    }
    const token = roturToken();
    const search = query.toString();
    const url = `${ROTUR_API}${path}${search ? `?${search}` : ''}`;
    let response = await fetch(url, {headers: token ? {Authorization: `Bearer ${token}`} : {}});
    if (optionalAuth && token && response.status === 401) response = await fetch(url);
    let data = null;
    try {
        data = await response.json();
    } catch (e) {
        data = null;
    }
    if (!response.ok || (data && data.error)) throw roturError(response, data);
    return data;
};

const CACHE_TTL = 30000;
const CACHE_MAX_ENTRIES = 200;
const cache = new Map();
const cacheKey = (path, params) => `${path}|${JSON.stringify(params)}|${roturToken() || ''}`;

const mutate = async (path, {method = 'POST', params = {}, body, scopes = []} = {}) => {
    if (scopes.length && !(await ensureScopes(scopes, {prompt: true}))) {
        throw new Error(formatCommunityMessage('MistWarp needs your permission on Rotur to do this.'));
    }
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && typeof value !== 'undefined') query.set(key, String(value));
    });
    const token = roturToken();
    if (!token) throw new Error(formatCommunityMessage('Sign in to continue'));
    const response = await fetch(`${ROTUR_API}${path}${query.toString() ? `?${query}` : ''}`, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(typeof body === 'undefined' ? {} : {'Content-Type': 'application/json'})
        },
        ...(typeof body === 'undefined' ? {} : {body: JSON.stringify(body)})
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || (data && data.error)) throw roturError(response, data);
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
    const params = {include_posts: includePosts ? '1' : '0', app: ROTUR_APP_ID};
    return cachedGet(path, params).then(data => {
        if (includePosts) {
            cache.set(cacheKey(path, {...params, include_posts: '0'}), {time: Date.now(), data});
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
    if (!client.loggedIn) throw new Error(formatCommunityMessage('Sign in to continue'));
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

// Group tags change rarely and show on every card and comment, so lookups are
// shared: one request per person however many places show their tag, reused
// for a few minutes. Rotur has no batch profile lookup, so this is the most
// that can be saved.
const GROUP_TAG_TTL = 5 * 60 * 1000;
const groupTags = new Map();

const groupTagKey = username => String(username || '').trim()
    .toLowerCase();

const groupTag = username => {
    const key = groupTagKey(username);
    if (!key) return Promise.resolve('');
    const hit = groupTags.get(key);
    if (hit && Date.now() - hit.at < GROUP_TAG_TTL) return hit.promise;
    // A failed lookup is forgotten, so the next card asks again instead of
    // showing no tag for minutes.
    const promise = getProfile(key).then(profile => String((profile && profile.group_tag) || ''), () => {
        if (groupTags.get(key)?.promise === promise) groupTags.delete(key);
        return '';
    });
    groupTags.set(key, {at: Date.now(), promise});
    if (groupTags.size > CACHE_MAX_ENTRIES) groupTags.delete(groupTags.keys().next().value);
    return promise;
};

const setGroupTag = (username, tag) => {
    const key = groupTagKey(username);
    if (key) groupTags.set(key, {at: Date.now(), promise: Promise.resolve(String(tag || ''))});
};

const withGroupTags = users => Promise.all((users || []).map(async user => {
    if (!user || user.group_tag) return user;
    const tag = await groupTag(user.username);
    return tag ? {...user, group_tag: tag} : user;
}));

const postBody = (content, options, madeWith) => {
    const body = {content, os: 'MistWarp', made_with: madeWith};
    if (options.attachment) body.attachment = options.attachment;
    if (options.attachments) body.attachments = options.attachments.join(',');
    if (options.profileOnly) body.profile_only = '1';
    if (options.poll) body.poll = options.poll;
    if (options.scheduledFor) body.scheduled_for = options.scheduledFor;
    return body;
};

const missingEndpoints = new Set();

const routeMissing = error => Boolean(error) && (
    ((error.status === 404 || error.status === 405) && (!error.code || error.code === 'not_found')) ||
    error.status === 501 || error.code === 'not_available'
);

const optionalEndpoint = async (name, request) => {
    if (missingEndpoints.has(name)) return null;
    try {
        return await request();
    } catch (error) {
        if (routeMissing(error)) {
            missingEndpoints.add(name);
            return null;
        }
        throw error;
    }
};

const asPage = data => (data && Array.isArray(data.items) ? {
    ...data,
    items: data.items.filter(item => item && item.id),
    next_cursor: typeof data.next_cursor === 'string' && data.next_cursor ? data.next_cursor : null
} : null);

const asList = data => (Array.isArray(data) ? data : ((data && Array.isArray(data.items)) ? data.items : []));

const postPath = (id, rest = '') => `/v2/posts/${encodeURIComponent(id)}${rest}`;

const forYou = ({cursor, limit = 20} = {}) => optionalEndpoint('for-you', async () => {
    const page = asPage(await get('/v2/feed/for-you', {cursor: cursor || null, limit: cursor ? null : limit}, {
        optionalAuth: true
    }));
    if (!page) {
        missingEndpoints.add('for-you');
        return null;
    }
    return {...page, personalised: Boolean(page.personalised)};
});

const thread = (id, {sort = 'relevant', limit = 20} = {}) => optionalEndpoint('thread', async () => {
    const data = await get(postPath(id, '/thread'), {sort, limit}, {optionalAuth: true});
    if (!data || !data.post || !data.post.id) {
        missingEndpoints.add('thread');
        return null;
    }
    return {
        ancestors: Array.isArray(data.ancestors) ? data.ancestors.filter(item => item && item.id) : [],
        post: data.post,
        replies: asPage(data.replies) || {items: [], next_cursor: null},
        sort: data.sort || sort
    };
});

const threadReplies = (id, {sort = 'relevant', cursor, limit = 20} = {}) => get(postPath(id, '/replies'), {
    sort, cursor: cursor || '', limit
}, {optionalAuth: true}).then(data => asPage(data) || {items: [], next_cursor: null});

const pounceAllowance = () => (roturToken() ? optionalEndpoint('pounces', async () => {
    const data = await get('/v2/me/pounces');
    return data && typeof data.left === 'number' ? data : null;
}) : Promise.resolve(null));

const setPounce = (id, pounced) => mutate(postPath(id, '/pounce'), {
    method: pounced ? 'PUT' : 'DELETE',
    scopes: ['posts:like']
});

const reportImpressions = async (impressions, {keepalive = false} = {}) => {
    const token = roturToken();
    if (!token || missingEndpoints.has('impressions')) return null;
    const response = await fetch(`${ROTUR_API}/v2/impressions`, {
        method: 'POST',
        keepalive,
        headers: {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'},
        body: JSON.stringify({impressions})
    });
    const data = await response.json().catch(() => null);
    if (response.ok) return data;
    const error = roturError(response, data);
    if (routeMissing(error) || error.status === 403) missingEndpoints.add('impressions');
    throw error;
};

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
    badgePreferences: () => authenticatedAction(
        ['account:view'],
        () => get('/v2/me/badges/preferences', {app: ROTUR_APP_ID})
    ),
    updateBadgePreferences: preferences => authenticatedAction(
        ['account:profile'],
        () => mutate('/v2/me/badges/preferences', {method: 'PUT', params: {app: ROTUR_APP_ID}, body: preferences})
    ),
    createProfilePost: content => authenticatedAction(
        ['posts:create'],
        client => client.posts.create(content, {profileOnly: true, os: 'MistWarp'})
    ),
    createPost: (content, {madeWith, ...options} = {}) => (madeWith ?
        mutate('/v2/posts', {method: 'POST', body: postBody(content, options, madeWith), scopes: ['posts:create']}) :
        authenticatedAction(['posts:create'], client => client.posts.create(content, {...options, os: 'MistWarp'}))),
    post: id => get(postPath(id), {}, {optionalAuth: true}),
    forYou,
    thread,
    threadReplies,
    pounceAllowance,
    pounce: id => setPounce(id, true),
    unpounce: id => setPounce(id, false),
    reportImpressions,
    viewPost: id => authenticatedAction([], client => client.posts.view(id)),
    likePost: id => mutate(`/v2/posts/${encodeURIComponent(id)}/like`, {
        method: 'PUT',
        params: {rating: 1},
        scopes: ['posts:like']
    }),
    unlikePost: id => mutate(`/v2/posts/${encodeURIComponent(id)}/like`, {
        method: 'DELETE',
        params: {rating: 0},
        scopes: ['posts:like']
    }),
    replyToPost: (id, content) => authenticatedAction(
        ['posts:reply'],
        client => client.posts.reply(id, content)
    ),
    repost: id => authenticatedAction(['posts:repost'], client => client.posts.repost(id)),
    editPost: (id, content) => authenticatedAction(
        ['posts:manage'],
        client => client.posts.edit(id, content)
    ),
    pinPost: id => authenticatedAction(['posts:manage'], client => client.posts.pin(id)),
    unpinPost: id => authenticatedAction(['posts:manage'], client => client.posts.unpin(id)),
    bookmarkPost: id => authenticatedAction([], client => client.posts.bookmark(id)),
    unbookmarkPost: id => authenticatedAction([], client => client.posts.unbookmark(id)),
    bookmarks: () => authenticatedAction([], client => client.posts.bookmarks()),
    scheduledPosts: () => authenticatedAction([], client => client.posts.scheduled()),
    topPosts: (limit = 50, hours = 24) => get('/v2/posts/top', {limit, time_period: hours}, {
        optionalAuth: true
    }).then(asList),
    searchPosts: (query, limit = 20) => get('/v2/posts/search', {q: query, limit}, {optionalAuth: true}).then(asList),
    votePost: (id, option) => authenticatedAction([], client => client.posts.vote(id, option)),
    reportPost: (type, id, reason) => authenticatedAction(
        [],
        client => client.reports.submit(type, id, reason)
    ),
    blockedUsers: () => authenticatedAction(['blocked:view'], client => client.me.blocked()),
    blockUser: username => authenticatedAction(
        ['blocked:manage'],
        client => client.me.block(username)
    ),
    unblockUser: username => authenticatedAction(
        ['blocked:manage'],
        client => client.me.unblock(username)
    ),
    deletePost: id => authenticatedAction(['posts:delete'], client => client.posts.delete(id)),
    status: getStatus,
    followerLeaderboard,
    groupTag,
    setGroupTag,
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
        leave: tag => mutate(`/groups/${encodeURIComponent(tag)}/leave`, {scopes: ['groups:leave']})
    }
};

export default rotur;
