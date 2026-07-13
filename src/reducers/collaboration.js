const OPEN_COLLABORATION_MODAL = 'scratch-gui/collaboration/OPEN_COLLABORATION_MODAL';
const CLOSE_COLLABORATION_MODAL = 'scratch-gui/collaboration/CLOSE_COLLABORATION_MODAL';
const SET_COLLABORATION_CONNECTED = 'scratch-gui/collaboration/SET_COLLABORATION_CONNECTED';
const SET_COLLABORATION_USERS = 'scratch-gui/collaboration/SET_COLLABORATION_USERS';
const SET_COLLABORATION_ERROR = 'scratch-gui/collaboration/SET_COLLABORATION_ERROR';
const SET_COLLABORATION_ROOM_ID = 'scratch-gui/collaboration/SET_COLLABORATION_ROOM_ID';
const SET_COLLABORATION_ROOM_PRIVACY = 'scratch-gui/collaboration/SET_COLLABORATION_ROOM_PRIVACY';
const SET_COLLABORATION_LOADING = 'scratch-gui/collaboration/SET_COLLABORATION_LOADING';
const SET_COLLABORATION_HOST_LOADING_PROGRESS = 'scratch-gui/collaboration/SET_HOST_LOADING_PROGRESS';
const SET_COLLABORATION_RECONNECTING = 'scratch-gui/collaboration/SET_RECONNECTING';
const SET_USER_ACTIVITY = 'scratch-gui/collaboration/SET_USER_ACTIVITY';
const REMOVE_USER_ACTIVITY = 'scratch-gui/collaboration/REMOVE_USER_ACTIVITY';

const initialState = {
    modalVisible: false,
    isConnected: false,
    isReconnecting: false,
    roomId: null,
    roomPrivacy: 'public',
    connectedUsers: [],
    connectionError: null,
    isCollabLoading: false,
    collabLoadingMessage: null,
    hostLoadingProgress: 0,
    // Where each remote peer is working, keyed by user id:
    // {username, handle, targetId, tab, assetIndex}. Never contains us.
    activity: {}
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    
    switch (action.type) {
    case OPEN_COLLABORATION_MODAL:
        return Object.assign({}, state, {
            modalVisible: true,
            connectionError: null
        });
    
    case CLOSE_COLLABORATION_MODAL:
        return Object.assign({}, state, {
            modalVisible: false
        });
    
    case SET_COLLABORATION_CONNECTED:
        return Object.assign({}, state, {
            isConnected: action.connected,
            isReconnecting: action.connected ? state.isReconnecting : false,
            connectionError: action.connected ? null : state.connectionError
        });

    case SET_COLLABORATION_RECONNECTING:
        return Object.assign({}, state, {
            isReconnecting: action.isReconnecting
        });
    
    case SET_COLLABORATION_USERS:
        return Object.assign({}, state, {
            connectedUsers: action.users || []
        });
    
    case SET_COLLABORATION_ERROR:
        return Object.assign({}, state, {
            connectionError: action.error
        });
    
    case SET_COLLABORATION_ROOM_ID:
        return Object.assign({}, state, {
            roomId: action.roomId
        });
    
    case SET_COLLABORATION_ROOM_PRIVACY:
        return Object.assign({}, state, {
            roomPrivacy: action.privacy
        });

    case SET_COLLABORATION_LOADING:
        return Object.assign({}, state, {
            isCollabLoading: action.isLoading,
            collabLoadingMessage: action.message || null,
            hostLoadingProgress: action.isLoading ? state.hostLoadingProgress : 0
        });

    case SET_COLLABORATION_HOST_LOADING_PROGRESS:
        return Object.assign({}, state, {
            hostLoadingProgress: action.progress
        });

    case SET_USER_ACTIVITY:
        return Object.assign({}, state, {
            activity: Object.assign({}, state.activity, {
                [action.userId]: {
                    userId: action.userId,
                    username: action.username,
                    handle: action.handle || null,
                    targetId: action.targetId,
                    tab: action.tab,
                    assetIndex: action.assetIndex
                }
            })
        });

    case REMOVE_USER_ACTIVITY: {
        if (!state.activity[action.userId]) return state;
        const activity = Object.assign({}, state.activity);
        delete activity[action.userId];
        return Object.assign({}, state, {activity});
    }


    default:
        return state;
    }
};

const openCollaborationModal = function () {
    return {
        type: OPEN_COLLABORATION_MODAL
    };
};

const closeCollaborationModal = function () {
    return {
        type: CLOSE_COLLABORATION_MODAL
    };
};

const setCollaborationConnected = function (connected) {
    return {
        type: SET_COLLABORATION_CONNECTED,
        connected
    };
};

const setCollaborationUsers = function (users) {
    return {
        type: SET_COLLABORATION_USERS,
        users
    };
};

const setCollaborationError = function (error) {
    return {
        type: SET_COLLABORATION_ERROR,
        error
    };
};

const setCollaborationRoomId = function (roomId) {
    return {
        type: SET_COLLABORATION_ROOM_ID,
        roomId
    };
};

const setCollaborationRoomPrivacy = function (privacy) {
    return {
        type: SET_COLLABORATION_ROOM_PRIVACY,
        privacy
    };
};

const setCollaborationLoading = function (isLoading, message = null) {
    return {
        type: SET_COLLABORATION_LOADING,
        isLoading,
        message
    };
};

const setCollaborationHostLoadingProgress = function (progress) {
    return {
        type: SET_COLLABORATION_HOST_LOADING_PROGRESS,
        progress
    };
};

const setCollaborationReconnecting = function (isReconnecting) {
    return {
        type: SET_COLLABORATION_RECONNECTING,
        isReconnecting
    };
};

const setUserActivity = function ({userId, username, handle, targetId, tab, assetIndex}) {
    return {
        type: SET_USER_ACTIVITY,
        userId,
        username,
        handle,
        targetId,
        tab,
        assetIndex
    };
};

const removeUserActivity = function (userId) {
    return {
        type: REMOVE_USER_ACTIVITY,
        userId
    };
};

export {
    reducer as default,
    initialState as collaborationInitialState,
    openCollaborationModal,
    closeCollaborationModal,
    setCollaborationConnected,
    setCollaborationUsers,
    setCollaborationError,
    setCollaborationRoomId,
    setCollaborationRoomPrivacy,
    setCollaborationLoading,
    setCollaborationHostLoadingProgress,
    setCollaborationReconnecting,
    setUserActivity,
    removeUserActivity
};
