import {request, uploadProject} from '../../lib/community/api.js';
import {projectAccessQuery, SLOW_GET_TIMEOUT} from './query.js';

const updateCommit = (id, sha, patch) => request(
    `/projects/${id}/commits/${encodeURIComponent(sha)}`,
    {method: 'PATCH', body: patch}
);

export default {
    commits: id => request(`/projects/${id}/commits`),
    branches: id => request(`/projects/${id}/branches`),
    createBranch: (id, name, from) => request(`/projects/${id}/branches`, {
        method: 'POST',
        body: {name, from}
    }),
    renameBranch: (id, branch, name) => request(`/projects/${id}/branches`, {
        method: 'PATCH',
        body: {branch, name}
    }),
    deleteBranch: (id, branch) => request(`/projects/${id}/branches`, {
        method: 'DELETE',
        body: {branch}
    }),
    mergeBranches: (id, source, target) => request(`/projects/${id}/branches/merge`, {
        method: 'POST',
        body: {source, target}
    }),
    commitInspection: (id, sha) => {
        const params = new URLSearchParams(projectAccessQuery().replace(/^\?/, ''));
        params.set('inline', '1');
        return request(`/projects/${id}/commits/${encodeURIComponent(sha)}?${params.toString()}`, {
            cache: false, timeoutMs: SLOW_GET_TIMEOUT
        });
    },
    commitTree: (id, sha) => request(
        `/projects/${id}/commits/${encodeURIComponent(sha)}/tree${projectAccessQuery()}`,
        {cache: false, timeoutMs: SLOW_GET_TIMEOUT}
    ),
    commitFile: (id, sha, path, pull = '', pullTarget = '') => {
        const params = new URLSearchParams(projectAccessQuery().replace(/^\?/, ''));
        params.set('path', path);
        if (pull !== '') params.set('pull', String(pull));
        if (pullTarget) params.set('pullTarget', pullTarget);
        return request(`/projects/${id}/commits/${encodeURIComponent(sha)}/file?${params.toString()}`, {
            cache: false, timeoutMs: SLOW_GET_TIMEOUT
        });
    },
    commitCoAuthors: (id, sha) => request(
        `/projects/${id}/commits/${encodeURIComponent(sha)}/co-authors${projectAccessQuery()}`
    ),
    updateCommit,
    setCommitCoAuthors: (id, sha, coAuthors) => updateCommit(id, sha, {coAuthors}),
    pulls: id => request(`/projects/${id}/pulls`),
    getPull: (id, index) => request(`/projects/${id}/pulls/${index}`),
    pullTimeline: (id, index) => request(`/projects/${id}/pulls/${index}/timeline`),
    addPullComment: (id, index, content) =>
        request(`/projects/${id}/pulls/${index}/comments`, {method: 'POST', body: {content}}),
    editPullComment: (id, index, comment, content) =>
        request(`/projects/${id}/pulls/${index}/comments/${comment}`, {method: 'PUT', body: {content}}),
    deletePullComment: (id, index, comment) =>
        request(`/projects/${id}/pulls/${index}/comments/${comment}`, {method: 'DELETE'}),
    pullDiff: (id, index) => request(`/projects/${id}/pulls/${index}/diff?inline=1`, {
        cache: false, timeoutMs: SLOW_GET_TIMEOUT
    }),
    mergePull: (id, index) => request(`/projects/${id}/pulls/${index}/merge`, {method: 'POST'}),
    closePull: (id, index) => request(`/projects/${id}/pulls/${index}/close`, {method: 'POST'}),
    uploadPullMerge: (id, {sb3, mergeTree, expectedHead, pullId}) =>
        uploadProject(id, sb3, null, null, {mergeTree, expectedHead, pullId}),
    uploadBranchMerge: (id, {sb3, mergeTree, sourceBranch, targetBranch, sourceHead, targetHead}) =>
        uploadProject(id, sb3, null, null, {
            mergeTree,
            mergeSourceBranch: sourceBranch,
            mergeTargetBranch: targetBranch,
            mergeSourceHead: sourceHead,
            mergeTargetHead: targetHead
        })
};
