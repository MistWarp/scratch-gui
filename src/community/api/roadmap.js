/* eslint-disable max-len */
import {request} from '../../lib/community/api.js';
import {commentQuery} from './query.js';

export default {
    developmentPulls: () => request('/development/pulls'),
    roadmap: () => request('/roadmap'),
    createIdea: idea => request('/roadmap', {method: 'POST', body: idea}),
    voteIdea: (id, vote) => request(`/roadmap/${id}/vote`, {method: 'POST', body: {vote}}),
    updateIdea: (id, idea) => request(`/roadmap/${id}`, {method: 'PUT', body: idea}),
    ideaComments: (id, options) => request(`/roadmap/${id}/comments?${commentQuery(options)}`),
    addIdeaComment: (id, content, parent = '') =>
        request(`/roadmap/${id}/comments`, {method: 'POST', body: {content, parent}}),
    deleteIdeaComment: (id, comment) => request(`/roadmap/${id}/comments/${comment}`, {method: 'DELETE'}),
    editIdeaComment: (id, commentId, content) => request(`/roadmap/${id}/comments/${commentId}`, {method: 'PUT', body: {content}}),
    reactIdeaComment: (id, commentId, type) =>
        request(`/roadmap/${id}/comments/${commentId}/react`, {method: 'POST', body: {type}})
};
