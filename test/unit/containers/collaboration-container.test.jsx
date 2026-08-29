import React from 'react';
import {Provider} from 'react-redux';
import {IntlProvider} from 'react-intl';
import {createStore, combineReducers} from 'redux';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import CollaborationContainer from '../../../src/containers/collaboration-container.jsx';
import collaborationReducer from '../../../src/reducers/collaboration';

jest.mock('../../../src/lib/collaboration/index.js');
jest.mock('../../../src/lib/notification-manager.js');

import CollaborationService from '../../../src/lib/collaboration/index.js';
import NotificationSystem from '../../../src/lib/notification-manager.js';

const mockCollaborationService = {
    isConnected: false,
    init: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    connectToRoom: jest.fn(() => Promise.resolve()),
    kickUser: jest.fn(),
    changeUsername: jest.fn(),
    getConnectedUsers: jest.fn(() => []),
    getRoomPrivacy: jest.fn(() => 'public'),
    getCurrentUserId: jest.fn(() => 'current-user-id'),
    approveJoinRequest: jest.fn(() => Promise.resolve()),
    denyJoinRequest: jest.fn(() => Promise.resolve()),
    changeRoomPrivacy: jest.fn(() => Promise.resolve()),
    attachToWorkspace: jest.fn(),
    disconnect: jest.fn(),
    cancelJoinRequest: jest.fn()
};

CollaborationService.getInstance.mockReturnValue(mockCollaborationService);

const mockVM = {
    on: jest.fn()
};

const ROTUR_HANDLE = 'TestHandle';

describe('CollaborationContainer', () => {
    let store;

    const mountContainer = () => mountWithIntl(
        <IntlProvider locale="en">
            <Provider store={store}>
                <CollaborationContainer />
            </Provider>
        </IntlProvider>
    );

    // The class itself is not exported; reach it through its displayName.
    const instanceOf = wrapper => wrapper.find('CollaborationContainer').instance();

    const collaborationState = () => store.getState().scratchGui.collaboration;

    beforeEach(() => {
        jest.clearAllMocks();
        mockCollaborationService.isConnected = false;

        store = createStore(combineReducers({
            locales: (state = {isRtl: false, locale: 'en', messages: {}}) => state,
            scratchGui: combineReducers({
                collaboration: collaborationReducer,
                tw: (state = {username: 'TestUser'}) => state,
                rotur: (state = {username: ROTUR_HANDLE}) => state,
                theme: (state = {theme: null}) => state,
                vm: (state = mockVM) => state
            })
        }));
    });

    test('initializes the collaboration service with the vm on mount', () => {
        mountContainer();

        expect(mockCollaborationService.init).toHaveBeenCalledWith(mockVM);
    });

    test('subscribes to service events on mount and unsubscribes on unmount', () => {
        const wrapper = mountContainer();

        const subscribed = mockCollaborationService.on.mock.calls.map(call => call[0]);
        expect(subscribed).toEqual(expect.arrayContaining([
            'user-joined',
            'user-left',
            'users-updated',
            'username-changed',
            'kicked-from-room',
            'host-left',
            'connected-to-host',
            'disconnected',
            'connection-failed'
        ]));

        wrapper.unmount();

        const unsubscribed = mockCollaborationService.off.mock.calls.map(call => call[0]);
        // the service is a singleton, so every listener added on mount must be
        // removed on unmount or it leaks onto the next session
        expect(unsubscribed.sort()).toEqual(subscribed.sort());
    });

    test('disconnects on unmount only when connected', () => {
        mockCollaborationService.isConnected = false;
        mountContainer().unmount();
        expect(mockCollaborationService.disconnect).not.toHaveBeenCalled();

        mockCollaborationService.isConnected = true;
        mountContainer().unmount();
        expect(mockCollaborationService.disconnect).toHaveBeenCalled();
    });

    test('handleJoinRoom connects as a guest and stores the room id', async () => {
        const container = instanceOf(mountContainer());

        await container.handleJoinRoom('test-room', 'Alice');

        expect(mockCollaborationService.connectToRoom)
            .toHaveBeenCalledWith('test-room', 'Alice', false, 'public', ROTUR_HANDLE);
        expect(collaborationState().roomId).toBe('test-room');
        // guests only become "connected" once the host answers
        expect(collaborationState().isConnected).toBe(false);
    });

    test('handleJoinRoom reports the error and rethrows', async () => {
        mockCollaborationService.connectToRoom.mockRejectedValueOnce(new Error('nope'));
        const container = instanceOf(mountContainer());

        await expect(container.handleJoinRoom('test-room', 'Alice')).rejects.toThrow('nope');
        expect(collaborationState().connectionError).toBe('nope');
    });

    test('handleCreateRoom connects as host and marks the room connected', async () => {
        const container = instanceOf(mountContainer());

        await container.handleCreateRoom('test-room', 'Alice', 'private');

        expect(mockCollaborationService.connectToRoom)
            .toHaveBeenCalledWith('test-room', 'Alice', true, 'private', ROTUR_HANDLE, 3);
        expect(collaborationState().roomId).toBe('test-room');
        expect(collaborationState().roomPrivacy).toBe('private');
        // the host is connected straight away
        expect(collaborationState().isConnected).toBe(true);
    });

    test('handleCreateRoom defaults to a public room', async () => {
        const container = instanceOf(mountContainer());

        await container.handleCreateRoom('test-room', 'Alice');

        expect(mockCollaborationService.connectToRoom)
            .toHaveBeenCalledWith('test-room', 'Alice', true, 'public', ROTUR_HANDLE, 3);
        expect(collaborationState().roomPrivacy).toBe('public');
    });

    test('handleCreateRoom rejects an empty room id without calling the service', async () => {
        const container = instanceOf(mountContainer());

        await expect(container.handleCreateRoom('', 'Alice')).rejects.toThrow('Room ID is required');
        expect(mockCollaborationService.connectToRoom).not.toHaveBeenCalled();
    });

    test('handleLeaveRoom disconnects and resets the room state', async () => {
        const container = instanceOf(mountContainer());
        await container.handleCreateRoom('test-room', 'Alice', 'private');

        container.handleLeaveRoom();

        expect(mockCollaborationService.disconnect).toHaveBeenCalled();
        expect(collaborationState().isConnected).toBe(false);
        expect(collaborationState().roomId).toBe(null);
        expect(collaborationState().roomPrivacy).toBe('public');
        expect(collaborationState().connectedUsers).toEqual([]);
        expect(collaborationState().connectionError).toBe(null);
    });

    test('handleKickUser kicks through the service and refreshes the user list', () => {
        const container = instanceOf(mountContainer());
        mockCollaborationService.getConnectedUsers.mockReturnValueOnce([{id: 'a', username: 'Alice'}]);

        container.handleKickUser('user-1');

        expect(mockCollaborationService.kickUser).toHaveBeenCalledWith('user-1');
        expect(collaborationState().connectedUsers).toEqual([{id: 'a', username: 'Alice'}]);
    });

    test('handleKickedFromRoom clears the room and surfaces a kick message', () => {
        const container = instanceOf(mountContainer());

        container.handleKickedFromRoom({});

        expect(mockCollaborationService.disconnect).toHaveBeenCalled();
        expect(collaborationState().isConnected).toBe(false);
        expect(collaborationState().roomId).toBe(null);
        expect(collaborationState().connectionError)
            .toBe('You have been removed from the collaboration room by the host.');
    });

    test('handleHostLeft closes the room and warns the user', () => {
        const container = instanceOf(mountContainer());

        container.handleHostLeft();

        expect(NotificationSystem.warning).toHaveBeenCalled();
        expect(collaborationState().isConnected).toBe(false);
        expect(collaborationState().roomId).toBe(null);
        expect(collaborationState().connectionError).toMatch(/host has left/i);
    });

    test('handleConnectedToHost marks the session connected', () => {
        const container = instanceOf(mountContainer());

        container.handleConnectedToHost();

        expect(collaborationState().isConnected).toBe(true);
    });

    test('handleJoinDenied surfaces the reason and clears the room', () => {
        const container = instanceOf(mountContainer());

        container.handleJoinDenied('the host said no');

        expect(collaborationState().connectionError).toBe('the host said no');
        expect(collaborationState().isConnected).toBe(false);
        expect(collaborationState().roomId).toBe(null);
    });

    test('handleChangeRoomPrivacy updates privacy through the service', async () => {
        const container = instanceOf(mountContainer());

        await container.handleChangeRoomPrivacy('private');

        expect(mockCollaborationService.changeRoomPrivacy).toHaveBeenCalledWith('private');
        expect(collaborationState().roomPrivacy).toBe('private');
    });

    test('handleChangeRoomPrivacy reports failures and rethrows', async () => {
        mockCollaborationService.changeRoomPrivacy.mockRejectedValueOnce(new Error('denied'));
        const container = instanceOf(mountContainer());

        await expect(container.handleChangeRoomPrivacy('private')).rejects.toThrow('denied');
        expect(collaborationState().connectionError).toBe('denied');
    });

    test('handleApproveJoinRequest and handleDenyJoinRequest delegate to the service', async () => {
        const container = instanceOf(mountContainer());

        await container.handleApproveJoinRequest('req-1', 'Alice');
        await container.handleDenyJoinRequest('req-2');

        expect(mockCollaborationService.approveJoinRequest).toHaveBeenCalledWith('req-1', 'Alice');
        expect(mockCollaborationService.denyJoinRequest).toHaveBeenCalledWith('req-2');
    });

    test('handleRoomPrivacyChanged mirrors a privacy change pushed by the host', () => {
        const container = instanceOf(mountContainer());

        container.handleRoomPrivacyChanged('private');

        expect(collaborationState().roomPrivacy).toBe('private');
    });
});
