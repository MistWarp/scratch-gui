/* eslint-disable max-len */
import {request} from '../../lib/community/api.js';
import {commentQuery} from './query.js';

export default {
    getComments: (id, options) => request(`/projects/${id}/comments?${commentQuery(options)}`),
    addComment: (id, content, parent, kind = 'comment', donation = null) =>
        request(`/projects/${id}/comments`, {method: 'POST', body: {content, parent, kind, donation}}),
    commentDonationIntent: (id, amount, returnUrl) => request(`/projects/${id}/comments/donation/intent`, {
        method: 'POST', body: {amount, returnUrl}
    }),
    deleteComment: (id, commentId) => request(`/projects/${id}/comments/${commentId}`, {method: 'DELETE'}),
    editComment: (id, commentId, content) => request(`/projects/${id}/comments/${commentId}`, {method: 'PUT', body: {content}}),
    getProfileComments: (name, options) =>
        request(`/users/${encodeURIComponent(name)}/comments?${commentQuery(options)}`),
    addProfileComment: (name, content, parent) =>
        request(`/users/${encodeURIComponent(name)}/comments`, {method: 'POST', body: {content, parent}}),
    deleteProfileComment: (name, commentId) => request(`/users/${encodeURIComponent(name)}/comments/${commentId}`, {method: 'DELETE'}),
    editProfileComment: (name, commentId, content) => request(`/users/${encodeURIComponent(name)}/comments/${commentId}`, {method: 'PUT', body: {content}}),
    reactComment: (id, commentId, type) =>
        request(`/projects/${id}/comments/${commentId}/react`, {method: 'POST', body: {type}}),
    pinComment: (id, commentId, pinned) =>
        request(`/projects/${id}/comments/${commentId}/pin`, {method: 'POST', body: {pinned}}),
    reactProfileComment: (name, commentId, type) =>
        request(`/users/${encodeURIComponent(name)}/comments/${commentId}/react`, {method: 'POST', body: {type}}),
    pinProfileComment: (name, commentId, pinned) =>
        request(`/users/${encodeURIComponent(name)}/comments/${commentId}/pin`, {method: 'POST', body: {pinned}})
};
