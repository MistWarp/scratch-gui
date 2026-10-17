const POUNCE_ORIGIN = 'https://pounce.rotur.dev';

const lower = value => String(value || '').toLowerCase();
const finite = value => (typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : null);
const viewerOf = post => (post && post.viewer && typeof post.viewer === 'object' ? post.viewer : null);

const authorName = post => String((post && (post.user || (post.author && post.author.username))) || '');

const postStats = (post, username) => {
    const likes = Array.isArray(post.likes) ? post.likes : null;
    const replies = Array.isArray(post.replies) ? post.replies : null;
    const viewer = viewerOf(post);
    const me = lower(username);
    const likedFromList = Boolean(me && likes && likes.some(name => lower(name) === me));
    return {
        likeCount: finite(post.like_count) ?? (likes ? likes.length : 0),
        liked: viewer && typeof viewer.liked === 'boolean' ? viewer.liked : likedFromList,
        replyCount: finite(post.reply_count) ?? (replies ? replies.length : 0),
        pounceCount: finite(post.pounce_count),
        pounced: Boolean(viewer && viewer.pounced),
        views: Math.max(finite(post.view_count) || 0, Number(post.views) || 0)
    };
};

const withLike = (post, liked, username) => {
    const before = postStats(post, username);
    if (before.liked === liked) return post;
    const next = {...post};
    const me = lower(username);
    if (Array.isArray(post.likes) || finite(post.like_count) === null) {
        const others = (Array.isArray(post.likes) ? post.likes : []).filter(name => lower(name) !== me);
        next.likes = liked ? [...others, username] : others;
    }
    if (finite(post.like_count) !== null) next.like_count = Math.max(0, post.like_count + (liked ? 1 : -1));
    if (viewerOf(post)) next.viewer = {...post.viewer, liked};
    return next;
};

const withPounce = (post, pounced, count) => {
    const current = finite(post.pounce_count) || 0;
    const wasPounced = Boolean(viewerOf(post) && post.viewer.pounced);
    const fallback = wasPounced === pounced ? current : Math.max(0, current + (pounced ? 1 : -1));
    return {
        ...post,
        pounce_count: finite(count) ?? fallback,
        viewer: {...(viewerOf(post) || {}), pounced}
    };
};

const canPounce = post => Boolean(post) && finite(post.pounce_count) !== null && !post.is_repost &&
    !post.deleted && !post.unavailable;

const promotedBy = post => {
    if (!post) return '';
    if (typeof post.promoted_by === 'string' && post.promoted_by) return post.promoted_by;
    const reason = (Array.isArray(post.reasons) ? post.reasons : []).find(item => item && item.type === 'promoted');
    if (reason && typeof reason.by === 'string' && reason.by) return reason.by;
    return post.placement === 'promoted' ? '' : null;
};

const cleanName = value => (typeof value === 'string' ? value.trim().slice(0, 64) : '');
const positive = value => (typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0);
const handles = names => names.map(name => `@${name}`).join(', ');

const reasonText = (reason, author, communityText) => {
    if (!reason || typeof reason.type !== 'string') return null;
    switch (reason.type) {
    case 'followed_author': return communityText('You follow {value1}', {value1: `@${author}`});
    case 'friend_author': return communityText('You and {value1} are friends', {value1: `@${author}`});
    case 'pounced_by': {
        const users = (Array.isArray(reason.users) ? reason.users : []).map(cleanName).filter(Boolean)
            .slice(0, 3);
        return users.length ?
            communityText('Pounced by {value1}', {value1: handles(users)}) :
            communityText('Pounced by people you follow');
    }
    case 'friend_replied': {
        const count = positive(reason.count);
        return count > 1 ?
            communityText('{value1} people you follow replied', {value1: count}) :
            communityText('Someone you follow replied');
    }
    case 'made_with': return cleanName(reason.app) ?
        communityText('Made with {value1}', {value1: cleanName(reason.app)}) : null;
    case 'app_match': return cleanName(reason.app) ?
        communityText('You use {value1}', {value1: cleanName(reason.app)}) : null;
    case 'group_match': return cleanName(reason.group) ?
        communityText('From {value1}, a group you are in', {value1: cleanName(reason.group)}) : null;
    case 'conversation': {
        const replies = positive(reason.replies);
        return replies ?
            communityText('{value1, plural, one {# reply so far} other {# replies so far}}', {value1: replies}) :
            communityText('People are replying');
    }
    case 'popular': return communityText('Popular right now');
    case 'new_voice': return communityText('New to claw');
    case 'fresh': return communityText('Posted recently');
    case 'recent': return communityText('From this week');
    case 'promoted': return cleanName(reason.by) ?
        communityText('Promoted by {value1}', {value1: `@${cleanName(reason.by)}`}) :
        communityText('Promoted');
    default: return null;
    }
};

const reasonLines = (reasons, author, communityText) => {
    const lines = [];
    for (const reason of Array.isArray(reasons) ? reasons : []) {
        const line = reasonText(reason, author, communityText);
        if (line && !lines.includes(line)) lines.push(line);
    }
    return lines;
};

const replyContext = post => {
    if (!post || typeof post.reply_to !== 'string' || !post.reply_to) return null;
    const user = post.reply_to_user && typeof post.reply_to_user === 'object' ?
        cleanName(post.reply_to_user.username) : '';
    return {
        parentId: post.reply_to,
        rootId: typeof post.root_id === 'string' && post.root_id ? post.root_id : post.reply_to,
        user,
        selfThread: Boolean(post.self_thread)
    };
};

const pounceUrl = path => `${POUNCE_ORIGIN}${path}`;
const pouncePostLink = id => pounceUrl(`/p/${encodeURIComponent(id)}`);

const mayPromote = (post, username) => Boolean(post && username) && lower(authorName(post)) === lower(username) &&
    !post.is_repost && !post.profile_only && !replyContext(post) && !post.deleted;

export {
    POUNCE_ORIGIN,
    authorName,
    canPounce,
    mayPromote,
    postStats,
    pounceUrl,
    pouncePostLink,
    promotedBy,
    reasonLines,
    reasonText,
    replyContext,
    withLike,
    withPounce
};
