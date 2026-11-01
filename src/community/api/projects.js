/* eslint-disable max-len */
import {request, createProject, uploadProject, prepareSparseProjectUpload} from '../../lib/community/api.js';
import {projectAccessQuery} from './query.js';

export default {
    explore: ({sort = 'recent', q = '', tag = '', offset = 0, limit = 24} = {}) =>
        request(`/explore?sort=${sort}&q=${encodeURIComponent(q)}&tag=${encodeURIComponent(tag)}&offset=${offset}&limit=${limit}`),
    randomProject: exclude => request(
        exclude ? `/projects/random?exclude=${encodeURIComponent(exclude)}` : '/projects/random',
        {cache: false}
    ),
    relatedProjects: (id, {exclude = [], limit = 6} = {}) => request(
        `/projects/${id}/related?limit=${limit}&exclude=${encodeURIComponent(exclude.join(','))}`
    ),
    featuredProject: () => request('/projects/featured'),
    leaderboard: by => request(`/leaderboard?by=${by}`),
    getProject: id => request(`/projects/${id}${projectAccessQuery()}`, {cache: false}),
    createProject,
    uploadProject,
    prepareSparseProjectUpload,
    updateProject: (id, patch) => request(`/projects/${id}`, {method: 'PUT', body: patch}),
    setThumbnail: (id, blob) => {
        const form = new FormData();
        form.append('thumbnail', blob, 'thumb.png');
        return request(`/projects/${id}/thumbnail`, {method: 'POST', body: form});
    },
    myProjects: name => request(`/users/${encodeURIComponent(name)}/projects?all=1`),
    myProjectPage: (name, {offset = 0, limit = 24} = {}) =>
        request(`/users/${encodeURIComponent(name)}/projects?all=1&offset=${offset}&limit=${limit}`),
    library: ({offset = 0, limit = 24} = {}) => request(`/me/library?offset=${offset}&limit=${limit}`),
    setLibraryProjectVisibility: (id, libraryPublic) => request(
        `/me/library/${encodeURIComponent(id)}/visibility`,
        {method: 'PUT', body: {public: libraryPublic}}
    ),
    trash: () => request('/me/trash'),
    restoreProject: id => request(`/projects/${id}/restore`, {method: 'POST'}),
    purgeProject: id => request(`/trash/${id}`, {method: 'DELETE'}),
    saveProject: id => request(`/projects/${id}/save`, {method: 'POST'}),
    unsaveProject: id => request(`/projects/${id}/save`, {method: 'DELETE'}),
    deleteProject: id => request(`/projects/${id}`, {method: 'DELETE'}),
    publish: id => request(`/projects/${id}/publish`, {method: 'POST'}),
    unpublish: id => request(`/projects/${id}/unpublish`, {method: 'POST'}),
    setVisibility: (id, visibility) => request(`/projects/${id}/visibility`, {method: 'POST', body: {visibility}}),
    reactProject: (id, type) => request(`/projects/${id}/react`, {method: 'POST', body: {type}}),
    view: id => request(`/projects/${id}/view`, {method: 'POST'}),
    remixes: id => request(`/projects/${id}/remixes`),
    remixTree: id => request(`/projects/${id}/remixtree`),
    remix: (id, setup) => request(`/projects/${id}/remix`, {method: 'POST', body: setup}),
    createPreview: (id, hours = 24) => request(`/projects/${id}/preview`, {method: 'POST', body: {hours}}),
    releases: id => request(`/projects/${id}/releases`),
    createRelease: (id, release) => request(`/projects/${id}/releases`, {method: 'POST', body: release}),
    contribute: (id, contribution) => request(`/projects/${id}/contribute`, {method: 'POST', body: contribution}),
    diagnostics: id => request(`/projects/${id}/diagnostics`),
    recordDiagnostic: (id, diagnostic) => request(`/projects/${id}/diagnostics`, {method: 'POST', body: diagnostic})
};
