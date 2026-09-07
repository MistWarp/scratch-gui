import api from './api';

// Rotur relays MistWarp notifications without the comment text, so resolve
// the comment through the thread it lives in. The server's `anchor` param
// returns just the anchor's thread, keeping each lookup to one small page.
// Resolved text is cached per thread+comment; misses cache as null.

const cache = new Map();

const pick = (comments, id) => {
    for (const comment of comments || []) {
        if (comment && typeof comment === 'object' && comment.id === id) return comment;
    }
    return null;
};

const projectThread = (projectId, commentId) => ({
    key: `project:${projectId}:${commentId}`,
    commentId,
    load: () => api.getComments(projectId, {anchor: commentId, limit: 1}).then(data => data && data.comments)
});

const profileThread = (profile, commentId) => ({
    key: `profile:${String(profile).toLowerCase()}:${commentId}`,
    commentId,
    load: () => api.getProfileComments(profile, {anchor: commentId, limit: 1}).then(data => data && data.comments)
});

const spaceThread = (spaceId, commentId) => ({
    key: `space:${spaceId}:${commentId}`,
    commentId,
    load: () => api.spaceComments(spaceId, {anchor: commentId, limit: 1}).then(data => data && data.comments)
});

const roadmapThread = (roadmapId, commentId) => ({
    key: `roadmap:${roadmapId}:${commentId}`,
    commentId,
    load: () => api.ideaComments(roadmapId, {anchor: commentId, limit: 1}).then(data => data && data.comments)
});

// Like milestones don't carry the thread directly; contentId is the storage
// key ("profile-mist:cAbc...", "project-p123:cAbc...", ...) used at notify time.
const milestoneThread = n => {
    if (n.type !== 'like_milestone' || n.contentKind !== 'comment' || typeof n.contentId !== 'string') {
        return null;
    }
    const sep = n.contentId.lastIndexOf(':');
    if (sep <= 0) return null;
    const thread = n.contentId.slice(0, sep);
    const commentId = n.contentId.slice(sep + 1);
    if (!commentId) return null;
    if (thread.startsWith('profile-')) return profileThread(thread.slice('profile-'.length), commentId);
    if (thread.startsWith('project-')) return projectThread(thread.slice('project-'.length), commentId);
    if (thread.startsWith('space-')) return spaceThread(thread.slice('space-'.length), commentId);
    if (thread.startsWith('roadmap-')) return roadmapThread(thread.slice('roadmap-'.length), commentId);
    return null;
};

const threadFor = n => {
    if (!n || typeof n !== 'object') return null;
    if (n.pull && n.projectId) {
        const {projectId, pull} = n;
        return {
            key: `pull:${projectId}/${pull}:${n.commentId || ''}`,
            commentId: n.commentId || null,
            load: () => api.pullTimeline(projectId, pull).then(data => data && data.comments)
        };
    }
    if (n.projectId && n.commentId) return projectThread(n.projectId, n.commentId);
    if (n.profile && n.commentId) return profileThread(n.profile, n.commentId);
    if (n.spaceId && n.commentId) return spaceThread(n.spaceId, n.commentId);
    if (n.roadmapId && n.commentId) return roadmapThread(n.roadmapId, n.commentId);
    return milestoneThread(n);
};

const fetchCommentPreview = n => {
    if (typeof n.preview === 'string' && n.preview.trim()) {
        return Promise.resolve(n.preview);
    }
    const thread = threadFor(n);
    if (!thread) return Promise.resolve(null);
    if (!cache.has(thread.key)) {
        cache.set(thread.key, thread.load()
            .then(comments => {
                const comment = pick(comments, thread.commentId);
                const text = comment && typeof comment.content === 'string' && comment.content.trim() ?
                    comment.content : null;
                if (!text) cache.delete(thread.key);
                return text;
            })
            .catch(() => {
                cache.delete(thread.key);
                return null;
            }));
    }
    return cache.get(thread.key);
};

export {
    fetchCommentPreview,
    threadFor
};
