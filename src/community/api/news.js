import {request} from '../../lib/community/api.js';

export default {
    news: () => request('/news'),
    newsItem: id => request(`/news/${encodeURIComponent(id)}`),
    viewNews: id => request(`/news/${encodeURIComponent(id)}/view`, {method: 'POST'}),
    publicStats: (days = 30) => request(`/stats?days=${encodeURIComponent(days)}`),
    postNews: post => request('/news', {method: 'POST', body: post}),
    updateNews: (id, post) => request(`/news/${encodeURIComponent(id)}`, {method: 'PUT', body: post}),
    deleteNews: id => request(`/news/${id}`, {method: 'DELETE'}),
    reactNews: (id, type) => request(`/news/${id}/react`, {method: 'POST', body: {type}}),
    voteNewsPoll: (id, option) => request(`/news/${id}/poll`, {method: 'POST', body: {option}})
};
