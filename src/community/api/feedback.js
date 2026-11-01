/* eslint-disable max-len */
import {request} from '../../lib/community/api.js';

export default {
    feedback: id => request(`/projects/${id}/feedback`),
    sendFeedback: (id, feedback) => request(`/projects/${id}/feedback`, {method: 'POST', body: feedback}),
    updateFeedback: (id, feedback, status) => request(`/projects/${id}/feedback/${feedback}`, {method: 'PUT', body: {status}}),
    reviews: id => request(`/projects/${id}/reviews`),
    userReviews: (name, limit = 6) => request(`/users/${encodeURIComponent(name)}/reviews?limit=${limit}`),
    saveReview: (id, review) => request(`/projects/${id}/reviews/me`, {method: 'PUT', body: review}),
    deleteReview: id => request(`/projects/${id}/reviews/me`, {method: 'DELETE'})
};
