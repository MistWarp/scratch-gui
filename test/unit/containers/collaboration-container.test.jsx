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
    cancelJoinRequest: jest.fn(),
    getInviteLink: jest.fn(() => null),
    getInviteRole: jest.fn(() => null),
    getMyRole: jest.fn(() => null),
    setInviteRole: jest.fn(),
    setUserRole: jest.fn(() => true),
    isConnectedToHostPeer: jest.fn(() => false)
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
    const instanceOf = wrapper => {
        const instance = wrapper.find('CollaborationContainer').instance();
        instance.props = {...instance.props, openSimpleDialog: config => config.onOk()};
        return instance;
    };

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

    test('canceling live editing leaves the current workspace disconnected', async () => {
        const container = instanceOf(mountContainer());
        container.props = {...container.props, openSimpleDialog: config => config.onCancel()};
        await expect(container.handleJoinRoom('room', 'Alice')).rejects.toMatchObject({cancelled: true});
        expect(mockCollaborationService.connectToRoom).not.toHaveBeenCalled();
    });

    test('handleJoinRoom connects as a guest and stores the room id', async () => {
        const container = instanceOf(mountContainer());

        await container.handleJoinRoom('test-room', 'Alice');

        expect(mockCollaborationService.connectToRoom)
            .toHaveBeenCalledWith('test-room', 'Alice', false, 'private', ROTUR_HANDLE, null, {invite: undefined});
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
            .toHaveBeenCalledWith('test-room', 'Alice', true, 'private', ROTUR_HANDLE, null, {inviteRole: 'watch'});
        expect(collaborationState().roomId).toBe('test-room');
        expect(collaborationState().roomPrivacy).toBe('private');
        // the host is connected straight away
        expect(collaborationState().isConnected).toBe(true);
    });

    test('handleCreateRoom always opens a room that invite links can join', async () => {
        const container = instanceOf(mountContainer());

        await container.handleCreateRoom('test-room', 'Alice', 'public');

        expect(mockCollaborationService.connectToRoom)
            .toHaveBeenCalledWith('test-room', 'Alice', true, 'private', ROTUR_HANDLE, null, {inviteRole: 'watch'});
        expect(collaborationState().roomPrivacy).toBe('private');
    });

    test('an invite link from the URL is used once and then cleared', async () => {
        const container = instanceOf(mountContainer());

        await container.handleJoinRoom('test-room', 'Alice', null, {invite: 'secret'});

        expect(mockCollaborationService.connectToRoom)
            .toHaveBeenCalledWith('test-room', 'Alice', false, 'private', ROTUR_HANDLE, null, {invite: 'secret'});
        expect(collaborationState().pendingInvite).toBe(null);
    });

    test('host role controls go through the service', () => {
        const container = instanceOf(mountContainer());

        container.handleChangeInviteRole('edit');
        container.handleChangeUserRole('guest-1', 'edit');

        expect(mockCollaborationService.setInviteRole).toHaveBeenCalledWith('edit');
        expect(mockCollaborationService.setUserRole).toHaveBeenCalledWith('guest-1', 'edit');
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
            .toBe('The host removed you from the room. Your copy of the project is still here.');
    });

    test('handleHostLeft closes the room and warns the user', () => {
        const container = instanceOf(mountContainer());

        container.handleHostLeft();

        expect(NotificationSystem.warning).toHaveBeenCalled();
        expect(collaborationState().isConnected).toBe(false);
        expect(collaborationState().roomId).toBe(null);
        expect(collaborationState().connectionError).toMatch(/host ended the live session/i);
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



    test('handleApproveJoinRequest and handleDenyJoinRequest delegate to the service', async () => {
        const container = instanceOf(mountContainer());

        await container.handleApproveJoinRequest('req-1', 'Alice', 'edit');
        await container.handleDenyJoinRequest('req-2');

        expect(mockCollaborationService.approveJoinRequest).toHaveBeenCalledWith('req-1', 'edit');
        expect(mockCollaborationService.denyJoinRequest).toHaveBeenCalledWith('req-2');
    });

    test('unmounting leaves the app-wide notification system working', () => {
        mountContainer().unmount();
        expect(NotificationSystem.cleanup).not.toHaveBeenCalled();
        expect(NotificationSystem.dismissAll).not.toHaveBeenCalled();
    });

    test('a session-ending message is toasted only while the window is closed', () => {
        const container = instanceOf(mountContainer());
        container.handleConnectionFailed({error: 'The host did not answer.'});
        expect(NotificationSystem.error).toHaveBeenCalledWith('The host did not answer.', 8000);
        expect(collaborationState().connectionError).toBe('The host did not answer.');

        NotificationSystem.error.mockClear();
        store.dispatch({type: 'scratch-gui/collaboration/OPEN_COLLABORATION_MODAL'});
        container.handleConnectionFailed({});
        expect(NotificationSystem.error).not.toHaveBeenCalled();
        expect(collaborationState().connectionError).toMatch(/connection failed/);
    });

    test('a denial while waiting clears loading and reconnecting state', () => {
        const container = instanceOf(mountContainer());
        store.dispatch({type: 'scratch-gui/collaboration/SET_RECONNECTING', isReconnecting: true});
        container.handleJoinDenied('Nope.');
        expect(collaborationState().isReconnecting).toBe(false);
        expect(collaborationState().isCollabLoading).toBe(false);
        expect(collaborationState().connectionError).toBe('Nope.');
        expect(NotificationSystem.warning).toHaveBeenCalledWith('Nope.', 8000);
    });

    test('reconnecting lasts until reconnected, through a host restart, and keeps its reason', () => {
        const container = instanceOf(mountContainer());
        container.handleReconnecting({attempt: 1, delayMs: 1000, reason: 'ROOM_NOT_FOUND'});
        expect(collaborationState().isReconnecting).toBe(true);
        expect(collaborationState().reconnectReason).toBe('ROOM_NOT_FOUND');
        container.handleHostRestarted();
        expect(collaborationState().isReconnecting).toBe(true);
        container.handleReconnected();
        expect(collaborationState().isReconnecting).toBe(false);
        expect(collaborationState().reconnectReason).toBe(null);
    });

    test.each([
        ['ROOM_NOT_FOUND', /Nobody is hosting room "room-1"/, true],
        ['SERVER_UNREACHABLE', /Could not reach the collaboration server/, true],
        ['DIAL_TIMEOUT', /Could not connect to the host/, true],
        ['RECONNECT_FAILED', /could not be restored/, true],
        ['SNAPSHOT_FAILED', /could not be downloaded/, true],
        ['ASSET_FAILED', /costume or sound/, true],
        ['ROOM_TAKEN', /already in use/, false],
        [null, /^engine text$/, false]
    ])('connection-failed %s explains itself and offers a retry only when it can help',
        async (code, message, retry) => {
            const wrapper = mountContainer();
            const container = instanceOf(wrapper);
            await container.handleJoinRoom('room-1', 'Alice');
            container.handleConnectionFailed({error: 'engine text', code});
            expect(collaborationState().connectionError).toMatch(message);
            wrapper.update();
            expect(wrapper.find('CollaborationModal').prop('canRetry')).toBe(retry);
        });

    test('a failed join explains the code, and Try again repeats it with the same invite', async () => {
        const notFound = new Error('raw');
        notFound.collabCode = 'ROOM_NOT_FOUND';
        mockCollaborationService.connectToRoom.mockRejectedValueOnce(notFound);
        const wrapper = mountContainer();
        const container = instanceOf(wrapper);
        let confirms = 0;
        container.props = {...container.props, openSimpleDialog: config => {
            confirms++;
            config.onOk();
        }};

        await expect(container.handleJoinRoom('room-1', 'Alice', null, {invite: 'key'}))
            .rejects.toMatchObject({collabCode: 'ROOM_NOT_FOUND'});
        expect(collaborationState().connectionError).toMatch(/ask the host for a new invite link/);
        wrapper.update();
        expect(wrapper.find('CollaborationModal').prop('canRetry')).toBe(true);
        expect(confirms).toBe(1);

        await container.handleRetry();
        expect(confirms).toBe(1);
        expect(mockCollaborationService.connectToRoom).toHaveBeenLastCalledWith(
            'room-1', 'Alice', false, 'private', ROTUR_HANDLE, null, {invite: 'key'});
        wrapper.update();
        expect(wrapper.find('CollaborationModal').prop('canRetry')).toBe(false);
    });

    test('a taken room code cannot be retried as is; hosting retries reuse the code', async () => {
        const taken = new Error('raw');
        taken.collabCode = 'ROOM_TAKEN';
        mockCollaborationService.connectToRoom.mockRejectedValueOnce(taken);
        const wrapper = mountContainer();
        const container = instanceOf(wrapper);
        await expect(container.handleCreateRoom('mine', 'Alice')).rejects.toThrow(/already in use/);
        wrapper.update();
        expect(wrapper.find('CollaborationModal').prop('canRetry')).toBe(false);

        const offline = new Error('raw');
        offline.collabCode = 'SERVER_UNREACHABLE';
        mockCollaborationService.connectToRoom.mockRejectedValueOnce(offline);
        await expect(container.handleCreateRoom('mine', 'Alice')).rejects.toThrow(/server/);
        await container.handleRetry();
        expect(mockCollaborationService.connectToRoom).toHaveBeenLastCalledWith(
            'mine', 'Alice', true, 'private', ROTUR_HANDLE, null, {inviteRole: 'watch'});
    });

    test('project sessions never offer the room Try again', async () => {
        const offline = new Error('raw');
        offline.collabCode = 'SERVER_UNREACHABLE';
        mockCollaborationService.connectToRoom.mockRejectedValueOnce(offline);
        const wrapper = mountContainer();
        const container = instanceOf(wrapper);
        await expect(container.handleCreateRoom('r', 'Alice', 'private', {projectId: '1', branch: 'main'}))
            .rejects.toThrow();
        expect(container.state.canRetry).toBe(false);
    });

    test('reclaiming a held room id is shown until hosting settles', async () => {
        let resolve;
        mockCollaborationService.connectToRoom.mockImplementationOnce(() => new Promise(done => {
            resolve = done;
        }));
        const wrapper = mountContainer();
        const container = instanceOf(wrapper);
        const hosting = container.handleCreateRoom('mine', 'Alice');
        container.handleHostIdTaken({attempt: 1, delayMs: 2000});
        wrapper.update();
        expect(wrapper.find('CollaborationModal').prop('isReclaimingRoom')).toBe(true);
        resolve('id');
        await hosting;
        wrapper.update();
        expect(wrapper.find('CollaborationModal').prop('isReclaimingRoom')).toBe(false);
    });

    test('a download that will not be retried drops the loader at once', () => {
        const container = instanceOf(mountContainer());
        container.handleProjectSyncDownloadStart();
        container.handleProjectSyncDownloadError({error: new Error('x'), attempt: 3, willRetry: false});
        expect(collaborationState().isCollabLoading).toBe(false);
        expect(NotificationSystem.error).not.toHaveBeenCalled();
    });

    test('the host hears about join requests while the window is closed', () => {
        const container = instanceOf(mountContainer());
        container.handleJoinRequestReceived({requesterId: 'r', requesterUsername: 'Bob'});
        expect(NotificationSystem.info).toHaveBeenCalledWith(expect.stringContaining('Bob wants to join'), 10000);

        NotificationSystem.info.mockClear();
        container.props = {...container.props, isVisible: true};
        container.handleJoinRequestReceived({requesterId: 'r', requesterUsername: 'Bob'});
        expect(NotificationSystem.info).not.toHaveBeenCalled();
    });

    test('a failed download keeps the loader up while it retries, then gives up', () => {
        jest.useFakeTimers();
        try {
            const container = instanceOf(mountContainer());
            container.handleProjectSyncDownloadStart();
            expect(collaborationState().isCollabLoading).toBe(true);
            expect(collaborationState().collabLoadingMessage).toBe('downloading');

            container.handleProjectSyncDownloadError({error: new Error('stalled'), attempt: 1, willRetry: true});
            expect(collaborationState().isCollabLoading).toBe(true);
            expect(collaborationState().collabLoadingMessage).toBe('retrying');

            // A retry that starts cancels the give-up timer.
            container.handleProjectSyncDownloadStart();
            jest.advanceTimersByTime(60000);
            expect(collaborationState().isCollabLoading).toBe(true);

            container.handleProjectSyncDownloadError({error: new Error('stalled')});
            jest.advanceTimersByTime(60000);
            expect(collaborationState().isCollabLoading).toBe(false);
            expect(NotificationSystem.error).toHaveBeenCalled();
        } finally {
            jest.useRealTimers();
        }
    });

    test('a quiet end after a failed attempt still tells the user they left', async () => {
        const container = instanceOf(mountContainer());
        container.handleConnectionFailed({error: 'failed'});
        await container.handleCreateRoom('room', 'Alice');
        container.handleDisconnected();
        expect(NotificationSystem.info).toHaveBeenCalledWith('You left the live session.', 3000);
    });

    test('cancelling mid-connect is not reported as a failure', async () => {
        let reject;
        mockCollaborationService.connectToRoom.mockImplementationOnce(() => new Promise((resolve, fail) => {
            reject = fail;
        }));
        const container = instanceOf(mountContainer());
        const joining = container.handleJoinRoom('room', 'Alice');
        await Promise.resolve();
        container.handleCancelConnection();
        reject(new Error('Collaboration connection cancelled'));

        await expect(joining).rejects.toMatchObject({cancelled: true});
        expect(collaborationState().connectionError).toBe(null);
    });

    test('handleRoomPrivacyChanged mirrors a privacy change pushed by the host', () => {
        const container = instanceOf(mountContainer());

        container.handleRoomPrivacyChanged('private');

        expect(collaborationState().roomPrivacy).toBe('private');
    });
});
