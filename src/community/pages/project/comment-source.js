import api from '../../api';
import projectRealtime from '../../project-realtime.js';

const projectCommentSource = id => ({
    list: options => api.getComments(id, options),
    add: (content, parent, kind, donation) => api.addComment(id, content, parent, kind, donation),
    donationIntent: (amount, returnUrl) => api.commentDonationIntent(id, amount, returnUrl),
    remove: commentId => api.deleteComment(id, commentId),
    edit: (commentId, content) => api.editComment(id, commentId, content),
    react: (commentId, type) => api.reactComment(id, commentId, type),
    pin: (commentId, pinned) => api.pinComment(id, commentId, pinned),
    issue: (commentId, state) => api.setCommentIssue(id, commentId, state),
    subscribe: listener => projectRealtime.subscribe(
        id,
        listener,
        new URLSearchParams(window.location.search).get('k') || ''
    )
});

export default projectCommentSource;
