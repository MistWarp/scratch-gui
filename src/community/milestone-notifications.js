import {formatCommunityMessage, getCommunityLocale} from './locale.js';
const MILESTONES = new Set([5, 25, 50, 100, 500, 1000]);
// One whole sentence per kind of content, so each can be translated.
const LIKE_MILESTONES = {
    'project': count => formatCommunityMessage('Your project got {count} likes', {count}),
    'comment': count => formatCommunityMessage('Your comment got {count} likes', {count}),
    'roadmap post': count => formatCommunityMessage('Your roadmap post got {count} likes', {count}),
    'studio': count => formatCommunityMessage('Your studio got {count} likes', {count}),
    'challenge': count => formatCommunityMessage('Your challenge got {count} likes', {count}),
    'news post': count => formatCommunityMessage('Your news post got {count} likes', {count}),
    'post': count => formatCommunityMessage('Your post got {count} likes', {count}),
    'theme': count => formatCommunityMessage('Your theme got {count} likes', {count}),
    'collection': count => formatCommunityMessage('Your collection got {count} likes', {count})
};

export const isMilestoneNotification = item =>
    item.type === 'like_milestone' || item.type === 'follower_milestone';

export const milestoneText = item => {
    const count = Number(item.milestone);
    if (!MILESTONES.has(count)) return item.body || formatCommunityMessage('You reached a new milestone');
    const formatted = count.toLocaleString(getCommunityLocale());
    if (item.type === 'follower_milestone') {
        return formatCommunityMessage('You reached {count} followers', {count: formatted});
    }
    const kind = Object.prototype.hasOwnProperty.call(LIKE_MILESTONES, item.contentKind) ? item.contentKind : 'post';
    return LIKE_MILESTONES[kind](formatted);
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
