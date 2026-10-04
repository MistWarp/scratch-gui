import {getAvatarUrl} from '../rotur/client.js';

const avatarForCollabUser = user => {
    const handle = user && user.handle;
    if (typeof handle !== 'string' || !handle) return null;
    return getAvatarUrl(handle);
};

const hashName = name => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = ((hash << 5) - hash) + name.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash);
};

/**
 * A stable colour for a collaborator, so their cursor label and their
 * sprite/tab badges always match.
 * @param {string} username Display name.
 * @returns {string} A CSS colour.
 */
const colorForCollabUser = username => `hsl(${hashName(username || '') % 360}, 70%, 45%)`;

export {avatarForCollabUser, colorForCollabUser};
