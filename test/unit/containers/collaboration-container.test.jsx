import React from 'react';
import {mount, shallow} from 'enzyme';
import {Provider} from 'react-redux';
import {createStore, combineReducers} from 'redux';
import CollaborationContainer from '../../../src/containers/collaboration-container.jsx';
import renderer from 'react-test-renderer';

jest.mock('../../../src/lib/collaboration/index.js');
jest.mock('../../../src/lib/toast-system.js');

import CollaborationService from '../../../src/lib/collaboration/index.js';
import ToastSystem from '../../../src/lib/toast-system.js';

const mockCollaborationService = {
    init: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    connectToRoom: jest.fn(),
    kickUser: jest.fn(),
    changeUsername: jest.fn(),
    getConnectedUsers: jest.fn(() => []),
    getRoomPrivacy: jest.fn(() => 'public'),
    getCurrentUserId: jest.fn(() => 'current-user-id'),
    approveJoinRequest: jest.fn(),
    denyJoinRequest: jest.fn(),
    changeRoomPrivacy: jest.fn(),
    attachToWorkspace: jest.fn(),
    disconnect: jest.fn(),
    cancelJoinRequest: jest.fn()
};

CollaborationService.getInstance.mockReturnValue(mockCollaborationService);

describe('CollaborationContainer', () => {
    let store;

    beforeEach(() => {
        store = createStore(combineReducers({
            scratchGui: combineReducers({
                collaboration: (state = {
                    modalVisible: false,
                    isConnected: false,
                    roomId: null,
                    roomPrivacy: 'public',
                    connectedUsers: [],
                    connectionError: null
                }) => state,
                tw: (state = {
                    username: 'TestUser'
                }) => state,
                vm: (state = {}) => state
            })
        }));

        jest.clearAllMocks();
    });

    const defaultProps = {
        vm: {
            on: jest.fn()
        },
        isVisible: false,
        isConnected: false,
        roomId: null,
        roomPrivacy: 'public',
        connectedUsers: [],
        connectionError: null,
        currentUsername: 'TestUser',
        onRequestClose: jest.fn(),
        onSetConnected: jest.fn(),
        onSetUsers: jest.fn(),
        onSetError: jest.fn(),
        onSetRoomId: jest.fn(),
        onSetRoomPrivacy: jest.fn(),
        onSetUsername: jest.fn()
    };

    test('matches snapshot', () => {
        const component = renderer.create(
            <Provider store={store}>
                <CollaborationContainer {...defaultProps} />
            </Provider>
        );
        expect(component.toJSON()).toMatchSnapshot();
    });

    test('initializes collaboration service on mount', () => {
        mount(
            <Provider store={store}>
                <CollaborationContainer {...defaultProps} />
            </Provider>
        );

        expect(mockCollaborationService.init).toHaveBeenCalledWith(defaultProps.vm);
    });

    test('sets up event listeners on mount', () => {
        mount(
            <Provider store={store}>
                <CollaborationContainer {...defaultProps} />
            </Provider>
        );

        const expectedEvents = [
            'user-joined',
            'user-left',
            'users-updated',
            'username-changed',
            'kicked-from-room',
            'host-left',
            'connected-to-host',
            'disconnected',
            'connection-failed',
            'join-request-received',
            'join-approved',
            'join-denied',
            'room-privacy-changed',
            'request-workspace-reattach',
            'project-sync-download-start',
            'project-sync-download-progress',
            'project-sync-download-complete',
            'project-sync-download-error'
        ];

        expectedEvents.forEach(event => {
            expect(mockCollaborationService.on).toHaveBeenCalledWith(event, expect.any(Function));
        });
    });

    test('cleans up event listeners on unmount', () => {
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...defaultProps} />
            </Provider>
        );

        wrapper.unmount();

        const expectedEvents = [
            'user-joined',
            'user-left',
            'users-updated',
            'username-changed',
            'kicked-from-room',
            'host-left',
            'connected-to-host',
            'disconnected',
            'connection-failed',
            'room-privacy-changed',
            'request-workspace-reattach',
            'project-sync-download-start',
            'project-sync-download-progress',
            'project-sync-download-complete',
            'project-sync-download-error'
        ];

        expectedEvents.forEach(event => {
            expect(mockCollaborationService.off).toHaveBeenCalledWith(event, expect.any(Function));
        });
    });

    test('disconnects from service and resets state on unmount when connected', () => {
        mockCollaborationService.isConnected = true;
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...defaultProps} />
            </Provider>
        );

        wrapper.unmount();

        expect(mockCollaborationService.disconnect).toHaveBeenCalled();
    });

    test('does not disconnect on unmount when not connected', () => {
        mockCollaborationService.isConnected = false;
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...defaultProps} />
            </Provider>
        );

        wrapper.unmount();

        expect(mockCollaborationService.disconnect).not.toHaveBeenCalled();
    });

    test('handleJoinRoom calls connectToRoom and sets room ID', async () => {
        const onSetRoomIdMock = jest.fn();
        const props = {
            ...defaultProps,
            onSetError: jest.fn(),
            onSetRoomId: onSetRoomIdMock
        };
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...props} />
            </Provider>
        );

        mockCollaborationService.connectToRoom.mockResolvedValue();

        await wrapper.instance().handleJoinRoom('test-room', 'Alice');

        expect(mockCollaborationService.connectToRoom).toHaveBeenCalledWith('test-room', 'Alice', false);
        expect(onSetRoomIdMock).toHaveBeenCalledWith('test-room');
    });

    test('handleJoinRoom handles errors', async () => {
        const onSetErrorMock = jest.fn();
        const props = {
            ...defaultProps,
            onSetError: onSetErrorMock
        };
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...props} />
            </Provider>
        );

        mockCollaborationService.connectToRoom.mockRejectedValue(new Error('Connection failed'));

        await expect(
            wrapper.instance().handleJoinRoom('test-room', 'Alice')
        ).rejects.toThrow();

        expect(onSetErrorMock).toHaveBeenCalledWith('Connection failed');
    });

    test('handleCreateRoom calls connectToRoom as host and sets state', async () => {
        const onSetConnectedMock = jest.fn();
        const onSetRoomIdMock = jest.fn();
        const onSetRoomPrivacyMock = jest.fn();
        const onSetUsersMock = jest.fn();
        const props = {
            ...defaultProps,
            onSetError: jest.fn(),
            onSetConnected: onSetConnectedMock,
            onSetRoomId: onSetRoomIdMock,
            onSetRoomPrivacy: onSetRoomPrivacyMock,
            onSetUsers: onSetUsersMock
        };
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...props} />
            </Provider>
        );

        mockCollaborationService.connectToRoom.mockResolvedValue();
        mockCollaborationService.getConnectedUsers.mockReturnValue([]);

        await wrapper.instance().handleCreateRoom('test-room', 'Alice', 'public');

        expect(mockCollaborationService.connectToRoom).toHaveBeenCalledWith('test-room', 'Alice', true, 'public');
        expect(onSetConnectedMock).toHaveBeenCalledWith(true);
        expect(onSetRoomIdMock).toHaveBeenCalledWith('test-room');
        expect(onSetRoomPrivacyMock).toHaveBeenCalledWith('public');
        expect(onSetUsersMock).toHaveBeenCalled();
    });

    test('handleCreateRoom throws error for empty room ID', async () => {
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...defaultProps} />
            </Provider>
        );

        await expect(
            wrapper.instance().handleCreateRoom('', 'Alice')
        ).rejects.toThrow('Room ID is required to create a room');
    });

    test('handleCreateRoom handles errors', async () => {
        const onSetErrorMock = jest.fn();
        const props = {
            ...defaultProps,
            onSetError: onSetErrorMock
        };
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...props} />
            </Provider>
        );

        mockCollaborationService.connectToRoom.mockRejectedValue(new Error('Failed to create'));

        await expect(
            wrapper.instance().handleCreateRoom('test-room', 'Alice')
        ).rejects.toThrow();

        expect(onSetErrorMock).toHaveBeenCalledWith('Failed to create');
    });

    test('handleLeaveRoom disconnects and resets state', () => {
        const onSetConnectedMock = jest.fn();
        const onSetRoomIdMock = jest.fn();
        const onSetRoomPrivacyMock = jest.fn();
        const onSetUsersMock = jest.fn();
        const onSetErrorMock = jest.fn();
        const props = {
            ...defaultProps,
            onSetConnected: onSetConnectedMock,
            onSetRoomId: onSetRoomIdMock,
            onSetRoomPrivacy: onSetRoomPrivacyMock,
            onSetUsers: onSetUsersMock,
            onSetError: onSetErrorMock
        };
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...props} />
            </Provider>
        );

        wrapper.instance().handleLeaveRoom();

        expect(mockCollaborationService.disconnect).toHaveBeenCalled();
        expect(onSetConnectedMock).toHaveBeenCalledWith(false);
        expect(onSetRoomIdMock).toHaveBeenCalledWith(null);
        expect(onSetRoomPrivacyMock).toHaveBeenCalledWith('public');
        expect(onSetUsersMock).toHaveBeenCalledWith([]);
        expect(onSetErrorMock).toHaveBeenCalledWith(null);
    });

    test('handleKickUser calls collaboration service and updates users', () => {
        const onSetUsersMock = jest.fn();
        const props = {
            ...defaultProps,
            onSetUsers: onSetUsersMock
        };
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...props} />
            </Provider>
        );

        wrapper.instance().handleKickUser('user-123');

        expect(mockCollaborationService.kickUser).toHaveBeenCalledWith('user-123');
        expect(onSetUsersMock).toHaveBeenCalled();
    });

    test('handleChangeUsername calls collaboration service and updates users', () => {
        const onSetUsersMock = jest.fn();
        const props = {
            ...defaultProps,
            onSetUsers: onSetUsersMock
        };
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...props} />
            </Provider>
        );

        wrapper.instance().handleChangeUsername('NewUsername');

        expect(mockCollaborationService.changeUsername).toHaveBeenCalledWith('NewUsername');
        expect(onSetUsersMock).toHaveBeenCalled();
    });

    test('handleUserJoined updates users list', () => {
        const onSetUsersMock = jest.fn();
        const props = {
            ...defaultProps,
            onSetUsers: onSetUsersMock
        };
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...props} />
            </Provider>
        );

        wrapper.instance().handleUserJoined({id: 'user-1', username: 'Alice'});

        expect(onSetUsersMock).toHaveBeenCalled();
    });

    test('handleUsersUpdated updates users list', () => {
        const onSetUsersMock = jest.fn();
        const props = {
            ...defaultProps,
            onSetUsers: onSetUsersMock
        };
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...props} />
            </Provider>
        );

        wrapper.instance().handleUsersUpdated({users: [{id: 'user-1', username: 'Alice'}]});

        expect(onSetUsersMock).toHaveBeenCalled();
    });

    test('handleKickedFromRoom disconnects and shows error', () => {
        const onSetConnectedMock = jest.fn();
        const onSetRoomIdMock = jest.fn();
        const onSetUsersMock = jest.fn();
        const onSetErrorMock = jest.fn();
        const props = {
            ...defaultProps,
            onSetConnected: onSetConnectedMock,
            onSetRoomId: onSetRoomIdMock,
            onSetUsers: onSetUsersMock,
            onSetError: onSetErrorMock
        };
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...props} />
            </Provider>
        );

        wrapper.instance().handleKickedFromRoom({reason: 'kicked by host'});

        expect(mockCollaborationService.disconnect).toHaveBeenCalled();
        expect(onSetConnectedMock).toHaveBeenCalledWith(false);
        expect(onSetRoomIdMock).toHaveBeenCalledWith(null);
        expect(onSetUsersMock).toHaveBeenCalledWith([]);
        expect(onSetErrorMock).toHaveBeenCalledWith('You have been removed from the collaboration room by the host.');
    });

    test('handleHostLeft disconnects and shows error', () => {
        const onSetConnectedMock = jest.fn();
        const onSetRoomIdMock = jest.fn();
        const onSetUsersMock = jest.fn();
        const onSetErrorMock = jest.fn();
        const props = {
            ...defaultProps,
            onSetConnected: onSetConnectedMock,
            onSetRoomId: onSetRoomIdMock,
            onSetUsers: onSetUsersMock,
            onSetError: onSetErrorMock
        };
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...props} />
            </Provider>
        );

        wrapper.instance().handleHostLeft();

        expect(onSetConnectedMock).toHaveBeenCalledWith(false);
        expect(onSetRoomIdMock).toHaveBeenCalledWith(null);
        expect(onSetUsersMock).toHaveBeenCalledWith([]);
        expect(onSetErrorMock).toHaveBeenCalledWith('The host has left the collaboration room. The room has been closed.');
        expect(ToastSystem.warning).toHaveBeenCalled();
    });

    test('handleConnectedToHost updates state when connected', () => {
        const onSetConnectedMock = jest.fn();
        const onSetUsernameMock = jest.fn();
        const onSetRoomPrivacyMock = jest.fn();
        const onSetUsersMock = jest.fn();
        const props = {
            ...defaultProps,
            onSetConnected: onSetConnectedMock,
            onSetUsername: onSetUsernameMock,
            onSetRoomPrivacy: onSetRoomPrivacyMock,
            onSetUsers: onSetUsersMock
        };
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...props} />
            </Provider>
        );

        mockCollaborationService.username = 'ServiceUsername';
        mockCollaborationService.getRoomPrivacy.mockReturnValue('private');

        wrapper.instance().handleConnectedToHost();

        expect(onSetConnectedMock).toHaveBeenCalledWith(true);
        expect(onSetUsernameMock).toHaveBeenCalledWith('ServiceUsername');
        expect(onSetRoomPrivacyMock).toHaveBeenCalledWith('private');
        expect(onSetUsersMock).toHaveBeenCalled();
    });

    test('handleConnectedToHost does not update username if already set', () => {
        const onSetConnectedMock = jest.fn();
        const onSetUsernameMock = jest.fn();
        const onSetUsersMock = jest.fn();
        const props = {
            ...defaultProps,
            currentUsername: 'TestUser',
            onSetConnected: onSetConnectedMock,
            onSetUsername: onSetUsernameMock,
            onSetUsers: onSetUsersMock
        };
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...props} />
            </Provider>
        );

        mockCollaborationService.username = 'TestUser';

        wrapper.instance().handleConnectedToHost();

        expect(onSetConnectedMock).toHaveBeenCalledWith(true);
        expect(onSetUsernameMock).not.toHaveBeenCalled();
    });

    test('handleConnectedToHost updates username if different', () => {
        const onSetConnectedMock = jest.fn();
        const onSetUsernameMock = jest.fn();
        const onSetUsersMock = jest.fn();
        const props = {
            ...defaultProps,
            currentUsername: 'OldUsername',
            onSetConnected: onSetConnectedMock,
            onSetUsername: onSetUsernameMock,
            onSetUsers: onSetUsersMock
        };
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...props} />
            </Provider>
        );

        mockCollaborationService.username = 'NewUsername';

        wrapper.instance().handleConnectedToHost();

        expect(onSetConnectedMock).toHaveBeenCalledWith(true);
        expect(onSetUsernameMock).toHaveBeenCalledWith('NewUsername');
        onSetUsernameMock.mockClear();

        wrapper.instance().handleUsernameChanged({id: 'ServiceUsername', username: 'UpdatedUsername'});
        expect(onSetUsernameMock).not.toHaveBeenCalled();
    });

    test('handleDisconnected clears state', () => {
        const onSetConnectedMock = jest.fn();
        const onSetRoomIdMock = jest.fn();
        const onSetRoomPrivacyMock = jest.fn();
        const onSetUsersMock = jest.fn();
        const props = {
            ...defaultProps,
            onSetConnected: onSetConnectedMock,
            onSetRoomId: onSetRoomIdMock,
            onSetRoomPrivacy: onSetRoomPrivacyMock,
            onSetUsers: onSetUsersMock
        };
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...props} />
            </Provider>
        );

        wrapper.instance().handleDisconnected();

        expect(onSetConnectedMock).toHaveBeenCalledWith(false);
        expect(onSetRoomIdMock).toHaveBeenCalledWith(null);
        expect(onSetRoomPrivacyMock).toHaveBeenCalledWith('public');
        expect(onSetUsersMock).toHaveBeenCalledWith([]);
        expect(ToastSystem.info).toHaveBeenCalled();
    });

    test('handleCancelConnection disconnects and clears state', () => {
        const onSetConnectedMock = jest.fn();
        const onSetRoomIdMock = jest.fn();
        const onSetRoomPrivacyMock = jest.fn();
        const onSetUsersMock = jest.fn();
        const onSetErrorMock = jest.fn();
        const props = {
            ...defaultProps,
            onSetConnected: onSetConnectedMock,
            onSetRoomId: onSetRoomIdMock,
            onSetRoomPrivacy: onSetRoomPrivacyMock,
            onSetUsers: onSetUsersMock,
            onSetError: onSetErrorMock
        };
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...props} />
            </Provider>
        );

        wrapper.instance().handleCancelConnection();

        expect(mockCollaborationService.disconnect).toHaveBeenCalled();
        expect(onSetConnectedMock).toHaveBeenCalledWith(false);
        expect(onSetRoomIdMock).toHaveBeenCalledWith(null);
        expect(onSetRoomPrivacyMock).toHaveBeenCalledWith('public');
        expect(onSetUsersMock).toHaveBeenCalledWith([]);
        expect(onSetErrorMock).toHaveBeenCalledWith(null);
    });

    test('handleApproveJoinRequest calls service and updates state', async () => {
        const onSetErrorMock = jest.fn();
        const props = {
            ...defaultProps,
            onSetError: onSetErrorMock
        };
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...props} />
            </Provider>
        );

        mockCollaborationService.approveJoinRequest = jest.fn().mockResolvedValue();

        await wrapper.instance().handleApproveJoinRequest('user-123', 'Alice');

        expect(mockCollaborationService.approveJoinRequest).toHaveBeenCalledWith('user-123', 'Alice');
    });

    test('handleApproveJoinRequest handles errors', async () => {
        const onSetErrorMock = jest.fn();
        const props = {
            ...defaultProps,
            onSetError: onSetErrorMock
        };
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...props} />
            </Provider>
        );

        mockCollaborationService.approveJoinRequest = jest.fn().mockRejectedValue(new Error('Failed'));

        await expect(
            wrapper.instance().handleApproveJoinRequest('user-123', 'Alice')
        ).rejects.toThrow();

        expect(onSetErrorMock).toHaveBeenCalledWith('Failed');
    });

    test('handleDenyJoinRequest calls service', async () => {
        const onSetErrorMock = jest.fn();
        const props = {
            ...defaultProps,
            onSetError: onSetErrorMock
        };
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...props} />
            </Provider>
        );

        mockCollaborationService.denyJoinRequest = jest.fn().mockResolvedValue();

        await wrapper.instance().handleDenyJoinRequest('user-123');

        expect(mockCollaborationService.denyJoinRequest).toHaveBeenCalledWith('user-123');
    });

    test('handleDenyJoinRequest handles errors', async () => {
        const onSetErrorMock = jest.fn();
        const props = {
            ...defaultProps,
            onSetError: onSetErrorMock
        };
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...props} />
            </Provider>
        );

        mockCollaborationService.denyJoinRequest = jest.fn().mockRejectedValue(new Error('Failed'));

        await expect(
            wrapper.instance().handleDenyJoinRequest('user-123')
        ).rejects.toThrow();

        expect(onSetErrorMock).toHaveBeenCalledWith('Failed');
    });

    test('handleChangeRoomPrivacy calls service and updates state', async () => {
        const onSetRoomPrivacyMock = jest.fn();
        const onSetErrorMock = jest.fn();
        const props = {
            ...defaultProps,
            onSetRoomPrivacy: onSetRoomPrivacyMock,
            onSetError: onSetErrorMock
        };
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...props} />
            </Provider>
        );

        mockCollaborationService.changeRoomPrivacy = jest.fn().mockResolvedValue();

        await wrapper.instance().handleChangeRoomPrivacy('private');

        expect(mockCollaborationService.changeRoomPrivacy).toHaveBeenCalledWith('private');
        expect(onSetRoomPrivacyMock).toHaveBeenCalledWith('private');
    });

    test('handleChangeRoomPrivacy handles errors', async () => {
        const onSetErrorMock = jest.fn();
        const props = {
            ...defaultProps,
            onSetError: onSetErrorMock
        };
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...props} />
            </Provider>
        );

        mockCollaborationService.changeRoomPrivacy = jest.fn().mockRejectedValue(new Error('Failed'));

        await expect(
            wrapper.instance().handleChangeRoomPrivacy('private')
        ).rejects.toThrow();

        expect(onSetErrorMock).toHaveBeenCalledWith('Failed');
    });

    test('getCurrentUserId returns the service peer id', () => {
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...defaultProps} />
            </Provider>
        );

        const userId = wrapper.instance().getCurrentUserId();

        expect(userId).toBe('current-user-id');
    });

    test('getCurrentUserId returns null when disconnected', () => {
        mockCollaborationService.getCurrentUserId.mockReturnValueOnce(null);
        const wrapper = mount(
            <Provider store={store}>
                <CollaborationContainer {...defaultProps} />
            </Provider>
        );

        const userId = wrapper.instance().getCurrentUserId();

        expect(userId).toBe(null);
    });
});
