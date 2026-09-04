const MILESTONES = new Set([5, 25, 50, 100, 500, 1000]);
const KINDS = new Set([
    'project', 'comment', 'roadmap post', 'studio', 'challenge', 'news post', 'post', 'theme', 'collection'
]);

export const isMilestoneNotification = item =>
    item.type === 'like_milestone' || item.type === 'follower_milestone';

export const milestoneText = item => {
    const count = Number(item.milestone);
    if (!MILESTONES.has(count)) return item.body || 'You reached a new milestone';
    if (item.type === 'follower_milestone') return `You reached ${count.toLocaleString('en-US')} followers`;
    const kind = KINDS.has(item.contentKind) ? item.contentKind : 'post';
    return `Your ${kind} got ${count.toLocaleString('en-US')} likes`;
};

export const milestoneLink = item => {
    const path = item.path;
    if (typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') &&
        !path.includes('\\') && [...path].every(char => char.charCodeAt(0) > 31 && char.charCodeAt(0) !== 127)) {
        return path;
    }
    if (item.type === 'follower_milestone' && item.profile) {
        return `/users/${encodeURIComponent(item.profile)}/followers`;
    }
    if (item.post_id) return `/posts/${encodeURIComponent(item.post_id)}`;
    return '/notifications';
};
