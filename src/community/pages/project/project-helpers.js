import api from '../../api';
import {sameUser} from '../../format';

// The MistWarp session a request is sent with; it changes when the viewer signs in, out, or switches account.
export const currentSession = () => (typeof api.loadSession === 'function' ? api.loadSession() : null);

export const reviewPayload = (rating, message) => ({rating, message: message.trim()});
export const releasePayload = form => ({...form, version: form.version.trim(), notes: form.notes.trim()});
export const contributionPayload = (remixProjectId, title, body, bountyId = '') => {
    const payload = {
        remixProjectId: remixProjectId.trim(),
        title: title.trim(),
        body: body.trim()
    };
    if (bountyId) payload.bountyId = bountyId;
    return payload;
};
export const bountyProjectId = project => project.remixParent || project.id;
export const contributionRemixes = (projects, targetId, username) => (projects || []).filter(project => (
    project.remixParent === targetId && (!username || sameUser(project.owner, username))
));
export const openPullForRemix = (pulls, targetId, remixProjectId) => (pulls || []).find(pull => (
    pull.state === 'open' && pull.targetProjectId === targetId && pull.sourceProjectId === remixProjectId
));
const BOUNTY_CLAIM_KEY = 'mw:bounty-claim:';
export const rememberBountyClaim = (projectId, bountyId) => {
    try {
        if (bountyId) localStorage.setItem(`${BOUNTY_CLAIM_KEY}${projectId}`, bountyId);
        else localStorage.removeItem(`${BOUNTY_CLAIM_KEY}${projectId}`);
    } catch (e) {
        // Bounty selection is a convenience. The contribution form still works without storage.
    }
};
export const recalledBountyClaim = projectId => {
    try {
        return localStorage.getItem(`${BOUNTY_CLAIM_KEY}${projectId}`) || '';
    } catch (e) {
        return '';
    }
};
export const applyReactionResult = (project, result) => ({
    ...project,
    loveCount: result.hearts,
    brokenHeartCount: result.brokenHearts,
    myReaction: result.myReaction || ''
});
export const updateReviewSummary = (summary, previousRating, nextRating) => {
    const previous = Number(previousRating) || 0;
    const next = Number(nextRating) || 0;
    const count = Math.max(0, (Number(summary.count) || 0) + (previous ? 0 : 1) - (next ? 0 : 1));
    const total = ((Number(summary.average) || 0) * (Number(summary.count) || 0)) - previous + next;
    return {count, average: count ? total / count : 0};
};
