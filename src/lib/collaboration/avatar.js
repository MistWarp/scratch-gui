import {getAvatarUrl} from '../rotur/client.js';
import {isClassroomUsername, isStudentSession} from '../rotur/student-flag.js';
import {initialsAvatar} from '../../community/classroom.js';

const avatarForCollabUser = user => {
    const handle = user && user.handle;
    const username = user && user.username;
    if (isStudentSession() || isClassroomUsername(handle) || isClassroomUsername(username)) {
        const name = typeof username === 'string' && username ? username : handle;
        return typeof name === 'string' && name ? initialsAvatar(name.replace(/^@/, '')) : null;
    }
    if (typeof handle !== 'string' || !handle) return null;
    return getAvatarUrl(handle);
};

export {avatarForCollabUser};
