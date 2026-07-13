const SET_USER = 'scratch-gui/rotur/SET_USER';
const SET_STATUS = 'scratch-gui/rotur/SET_STATUS';
const SET_ERROR = 'scratch-gui/rotur/SET_ERROR';
const SET_USERNAME_OVERRIDE = 'scratch-gui/rotur/SET_USERNAME_OVERRIDE';
const CLEAR = 'scratch-gui/rotur/CLEAR';

const initialState = {
    status: 'idle', // idle | restoring | logging-in | ready | error
    username: null,
    id: null,
    avatarUrl: null,
    bio: null,
    usernameOverride: null,
    error: null
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_STATUS:
        return Object.assign({}, state, {
            status: action.status,
            error: action.status === 'error' ? state.error : null
        });
    case SET_USER:
        return Object.assign({}, state, {
            status: 'ready',
            username: action.username,
            id: action.id || null,
            avatarUrl: action.avatarUrl,
            bio: action.bio || null,
            error: null
        });
    case SET_USERNAME_OVERRIDE:
        return Object.assign({}, state, {
            usernameOverride: action.username || null
        });
    case SET_ERROR:
        return Object.assign({}, state, {
            status: 'error',
            error: action.error
        });
    case CLEAR:
        return Object.assign({}, initialState);
    default:
        return state;
    }
};

const setRoturStatus = status => ({
    type: SET_STATUS,
    status
});

const setRoturUser = ({username, id, avatarUrl, bio}) => ({
    type: SET_USER,
    username,
    id: id || null,
    avatarUrl,
    bio: bio || null
});

const setRoturUsernameOverride = username => ({
    type: SET_USERNAME_OVERRIDE,
    username: username || null
});

const setRoturError = error => ({
    type: SET_ERROR,
    error: error ? String(error) : 'Unknown error'
});

const clearRoturUser = () => ({
    type: CLEAR
});

export {
    reducer as default,
    initialState as roturInitialState,
    setRoturStatus,
    setRoturUser,
    setRoturUsernameOverride,
    setRoturError,
    clearRoturUser
};
