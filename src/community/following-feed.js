const timestampMs = value => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return 0;
    return numeric < 10000000000 ? numeric * 1000 : numeric;
};

const normalizeFollowingPost = post => {
    if (!post || typeof post !== 'object' || !post.id || !post.user) return null;
    return {
        ...post,
        id: String(post.id),
        user: String(post.user),
        content: typeof post.content === 'string' ? post.content : '',
        timestamp: timestampMs(post.timestamp),
        timelineType: 'following-post'
    };
};

const normalizeFollowingPosts = posts => {
    const seen = new Set();
    const normalized = [];
    for (const raw of posts || []) {
        const post = normalizeFollowingPost(raw);
        if (!post || seen.has(post.id)) continue;
        seen.add(post.id);
        normalized.push(post);
    }
    return normalized.sort((left, right) => right.timestamp - left.timestamp);
};

const timelineTimestamp = item => timestampMs(item && (
    item.timelineType === 'following-post' ? item.timestamp : item.created || item.timestamp
));

const interleaveTimeline = (notifications, posts) => [
    ...(notifications || []).map(item => ({...item, timelineType: 'notification'})),
    ...normalizeFollowingPosts(posts)
].sort((left, right) => timelineTimestamp(right) - timelineTimestamp(left));

const postUrl = id => `/posts/${encodeURIComponent(id)}`;

export {
    interleaveTimeline,
    normalizeFollowingPost,
    normalizeFollowingPosts,
    postUrl,
    timelineTimestamp,
    timestampMs
};
