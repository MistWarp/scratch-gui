/* eslint-disable max-len */
import {request} from '../../lib/community/api.js';
import {commentQuery} from './query.js';

export default {
    spaces: ({kind = '', q = '', offset = 0, limit = 24, startsBefore = 0, endsAfter = 0, resultsAfter = 0} = {}) => {
        const dateWindow = startsBefore > 0 && endsAfter > 0 ?
            `&startsBefore=${startsBefore}&endsAfter=${endsAfter}` : '';
        const results = resultsAfter > 0 ? `&resultsAfter=${resultsAfter}` : '';
        return request(`/spaces?kind=${encodeURIComponent(kind)}&q=${encodeURIComponent(q)}&offset=${offset}&limit=${limit}${dateWindow}${results}`);
    },
    getSpace: id => request(`/spaces/${id}`),
    getSpaceManagement: id => request(`/spaces/${id}/manage`),
    mySpaces: () => request('/me/spaces'),
    createSpace: space => request('/spaces', {method: 'POST', body: space}),
    updateSpace: (id, space) => request(`/spaces/${id}`, {method: 'PUT', body: space}),
    setSpaceThumbnail: (id, blob) => {
        const form = new FormData();
        form.append('thumbnail', blob, 'studio-thumbnail.png');
        return request(`/spaces/${id}/thumbnail`, {method: 'POST', body: form});
    },
    deleteSpace: id => request(`/spaces/${id}`, {method: 'DELETE'}),
    addSpaceProject: (id, project) => request(`/spaces/${id}/projects/${project}`, {method: 'POST'}),
    removeSpaceProject: (id, project) => request(`/spaces/${id}/projects/${project}`, {method: 'DELETE'}),
    followSpace: id => request(`/spaces/${id}/follow`, {method: 'POST'}),
    unfollowSpace: id => request(`/spaces/${id}/follow`, {method: 'DELETE'}),
    inviteSpaceCurator: (id, username) => request(`/spaces/${id}/curators`, {method: 'POST', body: {username}}),
    removeSpaceCurator: (id, username) => request(`/spaces/${id}/curators/${encodeURIComponent(username)}`, {method: 'DELETE'}),
    respondSpaceInvitation: (id, accepted) => request(`/spaces/${id}/invitations/respond`, {method: 'POST', body: {accepted}}),
    cancelSpaceInvitation: (id, username) => request(`/spaces/${id}/invitations/${encodeURIComponent(username)}`, {method: 'DELETE'}),
    inviteChallengeJudge: (id, username) => request(`/spaces/${id}/judges`, {method: 'POST', body: {username}}),
    removeChallengeJudge: (id, username) => request(`/spaces/${id}/judges/${encodeURIComponent(username)}`, {method: 'DELETE'}),
    respondJudgeInvitation: (id, accepted) => request(`/spaces/${id}/judge-invitations/respond`, {method: 'POST', body: {accepted}}),
    joinChallenge: id => request(`/spaces/${id}/join`, {method: 'POST'}),
    leaveChallenge: id => request(`/spaces/${id}/join`, {method: 'DELETE'}),
    scoreChallengeEntry: (id, project, score) => request(`/spaces/${id}/entries/${project}/score`, {method: 'PUT', body: score}),
    voteChallengeEntry: (id, project, value) => request(`/spaces/${id}/entries/${project}/vote`, {method: 'PUT', body: {value}}),
    publishChallengeResults: id => request(`/spaces/${id}/results`, {method: 'POST'}),
    reactSpace: (id, type) => request(`/spaces/${id}/react`, {method: 'POST', body: {type}}),
    spaceComments: (id, options) => request(`/spaces/${id}/comments?${commentQuery(options)}`),
    addSpaceComment: (id, content, parent) => request(`/spaces/${id}/comments`, {method: 'POST', body: {content, parent}}),
    deleteSpaceComment: (id, commentId) => request(`/spaces/${id}/comments/${commentId}`, {method: 'DELETE'}),
    editSpaceComment: (id, commentId, content) => request(`/spaces/${id}/comments/${commentId}`, {method: 'PUT', body: {content}}),
    reactSpaceComment: (id, commentId, type) => request(`/spaces/${id}/comments/${commentId}/react`, {method: 'POST', body: {type}}),
    pinSpaceComment: (id, commentId, pinned) => request(`/spaces/${id}/comments/${commentId}/pin`, {method: 'POST', body: {pinned}})
};
