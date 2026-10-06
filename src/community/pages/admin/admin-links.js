const adminUserPath = username => `/admin?section=users&user=${encodeURIComponent(username)}`;

const commentLocation = key => {
    const value = String(key || '');
    if (value.startsWith('project-')) return {kind: 'project', id: value.slice(8)};
    if (value.startsWith('profile-')) return {kind: 'profile', id: value.slice(8)};
    if (value.startsWith('space-')) return {kind: 'space', id: value.slice(6)};
    if (value.startsWith('bounty-')) return {kind: 'bounty', id: value.slice(7)};
    if (value.startsWith('roadmap-')) return {kind: 'roadmap', id: value.slice(8)};
    if (value.startsWith('pull-')) {
        const rest = value.slice(5);
        const split = rest.lastIndexOf('-');
        return {kind: 'pull', id: rest.slice(0, split), index: rest.slice(split + 1)};
    }
    return {kind: 'other', id: value};
};

export {adminUserPath, commentLocation};
