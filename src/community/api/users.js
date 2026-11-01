import {request} from '../../lib/community/api.js';

export default {
    getUser: name => request(`/users/${encodeURIComponent(name)}`),
    userPlaytimeLibrary: (name, {offset = 0, limit = 24} = {}) =>
        request(`/users/${encodeURIComponent(name)}/library?offset=${offset}&limit=${limit}`),
    userProjects: (name, {offset = 0, limit = 24} = {}) =>
        request(`/users/${encodeURIComponent(name)}/projects?offset=${offset}&limit=${limit}`),
    searchUsers: (q, {limit = 8} = {}) => request(`/search/users?q=${encodeURIComponent(q)}&limit=${limit}`),
    activity: users => request(`/activity?users=${encodeURIComponent(users.join(','))}`)
};
