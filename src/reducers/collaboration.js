const OPEN_COLLABORATION_MODAL = 'scratch-gui/collaboration/OPEN_COLLABORATION_MODAL';
const CLOSE_COLLABORATION_MODAL = 'scratch-gui/collaboration/CLOSE_COLLABORATION_MODAL';
const SET_COLLABORATION_CONNECTED = 'scratch-gui/collaboration/SET_COLLABORATION_CONNECTED';
const SET_COLLABORATION_USERS = 'scratch-gui/collaboration/SET_COLLABORATION_USERS';
const SET_COLLABORATION_ERROR = 'scratch-gui/collaboration/SET_COLLABORATION_ERROR';
const SET_COLLABORATION_ROOM_ID = 'scratch-gui/collaboration/SET_COLLABORATION_ROOM_ID';

const initialState = {
    modalVisible: false,
    isConnected: false,
    roomId: null,
    connectedUsers: [],
    connectionError: null
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
            connectionError: action.connected ? null : state.connectionError
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

export {
    reducer as default,
    initialState as collaborationInitialState,
    openCollaborationModal,
    closeCollaborationModal,
    setCollaborationConnected,
    setCollaborationUsers,
    setCollaborationError,
    setCollaborationRoomId
};
