import {getAvatarUrl} from '../rotur/client.js';

const avatarForCollabUser = user => {
    const handle = user && user.handle;
    if (typeof handle !== 'string' || !handle) return null;
    return getAvatarUrl(handle);
};

export {avatarForCollabUser};
