/* eslint-env jest */
import collaborationReducer, {
    collaborationInitialState,
    openCollaborationModal,
    closeCollaborationModal,
    setCollaborationConnected,
    setCollaborationUsers,
    setCollaborationError,
    setCollaborationRoomId,
    setCollaborationRoomPrivacy
} from '../../../src/reducers/collaboration';

test('initialState', () => {
    let defaultState;
    /* collaborationReducer(state, action) */
    expect(collaborationReducer(defaultState, {type: 'anything'})).toBeDefined();
    expect(collaborationReducer(defaultState, {type: 'anything'}).modalVisible).toBe(false);
    expect(collaborationReducer(defaultState, {type: 'anything'}).isConnected).toBe(false);
    expect(collaborationReducer(defaultState, {type: 'anything'}).roomId).toBe(null);
    expect(collaborationReducer(defaultState, {type: 'anything'}).roomPrivacy).toBe('public');
    expect(collaborationReducer(defaultState, {type: 'anything'}).connectedUsers).toEqual([]);
    expect(collaborationReducer(defaultState, {type: 'anything'}).connectionError).toBe(null);
});

test('openCollaborationModal sets modalVisible to true and clears error', () => {
    const initialState = {
        modalVisible: false,
        connectionError: 'Some error'
    };
    const action = openCollaborationModal();
    const resultState = collaborationReducer(initialState, action);
    expect(resultState.modalVisible).toBe(true);
    expect(resultState.connectionError).toBe(null);
});

test('openCollaborationModal with no error preserves other state', () => {
    const initialState = {
        modalVisible: false,
        isConnected: true,
        roomId: 'test-room',
        connectedUsers: [{id: '1', username: 'User'}]
    };
    const action = openCollaborationModal();
    const resultState = collaborationReducer(initialState, action);
    expect(resultState.modalVisible).toBe(true);
    expect(resultState.isConnected).toBe(true);
    expect(resultState.roomId).toBe('test-room');
    expect(resultState.connectedUsers).toEqual([{id: '1', username: 'User'}]);
});

test('closeCollaborationModal sets modalVisible to false', () => {
    const initialState = {
        modalVisible: true,
        isConnected: true
    };
    const action = closeCollaborationModal();
    const resultState = collaborationReducer(initialState, action);
    expect(resultState.modalVisible).toBe(false);
    expect(resultState.isConnected).toBe(true);
});

test('setCollaborationConnected with true clears connection error', () => {
    const initialState = {
        isConnected: false,
        connectionError: 'Connection failed'
    };
    const action = setCollaborationConnected(true);
    const resultState = collaborationReducer(initialState, action);
    expect(resultState.isConnected).toBe(true);
    expect(resultState.connectionError).toBe(null);
});

test('setCollaborationConnected with false preserves error', () => {
    const initialState = {
        isConnected: false,
        connectionError: 'Already connected'
    };
    const action = setCollaborationConnected(false);
    const resultState = collaborationReducer(initialState, action);
    expect(resultState.isConnected).toBe(false);
    expect(resultState.connectionError).toBe('Already connected');
});

test('setCollaborationConnected toggles connection state', () => {
    let initialState = {isConnected: false};
    let action = setCollaborationConnected(true);
    let resultState = collaborationReducer(initialState, action);
    expect(resultState.isConnected).toBe(true);

    initialState = resultState;
    action = setCollaborationConnected(false);
    resultState = collaborationReducer(initialState, action);
    expect(resultState.isConnected).toBe(false);
});

test('setCollaborationUsers updates users list', () => {
    const initialState = {
        connectedUsers: []
    };
    const users = [
        {id: '1', username: 'Alice', isHost: false},
        {id: '2', username: 'Bob', isHost: true}
    ];
    const action = setCollaborationUsers(users);
    const resultState = collaborationReducer(initialState, action);
    expect(resultState.connectedUsers).toEqual(users);
});

test('setCollaborationUsers with undefined defaults to empty array', () => {
    const initialState = {
        connectedUsers: [{id: '1', username: 'Alice'}]
    };
    const action = setCollaborationUsers(undefined);
    const resultState = collaborationReducer(initialState, action);
    expect(resultState.connectedUsers).toEqual([]);
});

test('setCollaborationError updates error message', () => {
    const initialState = {
        connectionError: null
    };
    const action = setCollaborationError('Connection timed out');
    const resultState = collaborationReducer(initialState, action);
    expect(resultState.connectionError).toBe('Connection timed out');
});

test('setCollaborationError can clear error', () => {
    const initialState = {
        connectionError: 'Previous error'
    };
    const action = setCollaborationError(null);
    const resultState = collaborationReducer(initialState, action);
    expect(resultState.connectionError).toBe(null);
});

test('setCollaborationRoomId updates room ID', () => {
    const initialState = {
        roomId: null
    };
    const action = setCollaborationRoomId('test-room-123');
    const resultState = collaborationReducer(initialState, action);
    expect(resultState.roomId).toBe('test-room-123');
});

test('setCollaborationRoomId can clear room ID', () => {
    const initialState = {
        roomId: 'previous-room'
    };
    const action = setCollaborationRoomId(null);
    const resultState = collaborationReducer(initialState, action);
    expect(resultState.roomId).toBe(null);
});

test('setCollaborationRoomPrivacy updates room privacy to public', () => {
    const initialState = {
        roomPrivacy: 'private'
    };
    const action = setCollaborationRoomPrivacy('public');
    const resultState = collaborationReducer(initialState, action);
    expect(resultState.roomPrivacy).toBe('public');
});

test('setCollaborationRoomPrivacy updates room privacy to private', () => {
    const initialState = {
        roomPrivacy: 'public'
    };
    const action = setCollaborationRoomPrivacy('private');
    const resultState = collaborationReducer(initialState, action);
    expect(resultState.roomPrivacy).toBe('private');
});

test('multiple actions in sequence', () => {
    let state = collaborationInitialState;

    state = collaborationReducer(state, openCollaborationModal());
    expect(state.modalVisible).toBe(true);

    state = collaborationReducer(state, setCollaborationRoomId('room-123'));
    expect(state.roomId).toBe('room-123');

    state = collaborationReducer(state, setCollaborationConnected(true));
    expect(state.isConnected).toBe(true);

    state = collaborationReducer(state, setCollaborationUsers([
        {id: '1', username: 'Alice', isHost: true}
    ]));
    expect(state.connectedUsers).toEqual([{id: '1', username: 'Alice', isHost: true}]);

    state = collaborationReducer(state, closeCollaborationModal());
    expect(state.modalVisible).toBe(false);
    expect(state.isConnected).toBe(true);
});

test('unknown action types return unchanged state', () => {
    const initialState = {
        modalVisible: true,
        isConnected: true,
        roomId: 'test',
        roomPrivacy: 'public',
        connectedUsers: [{id: '1'}],
        connectionError: null
    };
    const action = {type: 'UNKNOWN_ACTION'};
    const resultState = collaborationReducer(initialState, action);
    expect(resultState).toEqual(initialState);
});

test('full collaboration workflow', () => {
    const initialState = collaborationInitialState;

    state = collaborationReducer(initialState, openCollaborationModal());
    expect(state.modalVisible).toBe(true);

    state = collaborationReducer(state, setCollaborationConnected(true));
    expect(state.isConnected).toBe(true);

    state = collaborationReducer(state, setCollaborationRoomId('cool-cat-room'));
    expect(state.roomId).toBe('cool-cat-room');

    state = collaborationReducer(state, setCollaborationRoomPrivacy('public'));
    expect(state.roomPrivacy).toBe('public');

    state = collaborationReducer(state, setCollaborationUsers([
        {id: 'host-1', username: 'HostUser', isHost: true},
        {id: 'user-2', username: 'GuestUser', isHost: false}
    ]));
    expect(state.connectedUsers.length).toBe(2);
    expect(state.connectedUsers[0].isHost).toBe(true);
    expect(state.connectedUsers[1].isHost).toBe(false);

    state = collaborationReducer(state, setCollaborationError('Connection lost'));
    expect(state.connectionError).toBe('Connection lost');

    state = collaborationReducer(state, setCollaborationConnected(false));
    expect(state.isConnected).toBe(false);
    expect(state.connectionError).toBe('Connection lost');

    state = collaborationReducer(state, setCollaborationRoomId(null));
    expect(state.roomId).toBe(null);
});
