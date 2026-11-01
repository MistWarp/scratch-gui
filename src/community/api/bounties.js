import {request} from '../../lib/community/api.js';

export default {
    bountyActivity: id => request(`/bounties/${encodeURIComponent(id)}/activity`, {cache: false}),
    addBountyComment: (id, content) =>
        request(`/bounties/${encodeURIComponent(id)}/comments`, {method: 'POST', body: {content}}),
    deleteBountyComment: (id, comment) =>
        request(`/bounties/${encodeURIComponent(id)}/comments/${comment}`, {method: 'DELETE'}),
    joinBounty: id => request(`/bounties/${encodeURIComponent(id)}/workers/me`, {method: 'POST'}),
    leaveBounty: id => request(`/bounties/${encodeURIComponent(id)}/workers/me`, {method: 'DELETE'})
};
