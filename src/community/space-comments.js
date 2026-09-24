import {useMemo} from 'react';
import api from './api';

const useSpaceCommentSource = id => useMemo(() => ({
    list: options => api.spaceComments(id, options),
    add: (content, parent) => api.addSpaceComment(id, content, parent),
    remove: commentId => api.deleteSpaceComment(id, commentId),
    edit: (commentId, content) => api.editSpaceComment(id, commentId, content),
    react: (commentId, type) => api.reactSpaceComment(id, commentId, type),
    pin: (commentId, pinned) => api.pinSpaceComment(id, commentId, pinned)
}), [id]);

export default useSpaceCommentSource;
