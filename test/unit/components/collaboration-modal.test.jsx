import React from 'react';
import {mount, shallow} from 'enzyme';
import {Provider} from 'react-redux';
import {createStore} from 'redux';
import CollaborationModal from '../../../src/components/collaboration-modal/collaboration-modal.jsx';
import renderer from 'react-test-renderer';

const mockStore = createStore((state = {}) => state);

describe('CollaborationModal', () => {
    const defaultProps = {
        visible: true,
        currentUsername: 'TestUser',
        currentUserId: 'user-123',
        isConnected: false,
        roomId: null,
        roomPrivacy: 'public',
        connectedUsers: [],
        connectionError: null,
        onRequestClose: jest.fn(),
        onJoinRoom: jest.fn(),
        onCreateRoom: jest.fn(),
        onLeaveRoom: jest.fn(),
        onKickUser: jest.fn(),
        onChangeUsername: jest.fn(),
        onCancelConnection: jest.fn(),
        onApproveJoinRequest: jest.fn(),
        onDenyJoinRequest: jest.fn(),
        onCancelJoinRequest: jest.fn(),
        onChangeRoomPrivacy: jest.fn(),
        intl: {
            formatMessage: ({defaultMessage}) => defaultMessage
        }
    };

    test('matches snapshot when not connected', () => {
        const component = renderer.create(
            <CollaborationModal {...defaultProps} />
        );
        expect(component.toJSON()).toMatchSnapshot();
    });

    test('matches snapshot when connected', () => {
        const props = {
            ...defaultProps,
            isConnected: true,
            roomId: 'test-room',
            connectedUsers: [
                {id: 'user-1', username: 'Alice', isHost: true},
                {id: 'user-2', username: 'Bob', isHost: false}
            ]
        };
        const component = renderer.create(
            <CollaborationModal {...props} />
        );
        expect(component.toJSON()).toMatchSnapshot();
    });

    test('renders correctly when modal is hidden', () => {
        const props = {...defaultProps, visible: false};
        const wrapper = shallow(<CollaborationModal {...props} />);
        expect(wrapper.prop('visible')).toBe(false);
    });

    test('renders join step when not connected and no roomId', () => {
        const wrapper = mount(
            <Provider store={mockStore}>
                <CollaborationModal {...defaultProps} />
            </Provider>
        );
        expect(wrapper.text()).toContain('Room ID');
        expect(wrapper.text()).toContain('Join Room');
        expect(wrapper.text()).toContain('Create New Room');
    });

    test('displays current username', () => {
        const wrapper = mount(
            <Provider store={mockStore}>
                <CollaborationModal {...defaultProps} currentUsername="Alice" />
            </Provider>
        );
        expect(wrapper.text()).toContain('Alice');
    });

    test('calls handleJoinRoom when join button is clicked', () => {
        const onJoinRoomMock = jest.fn();
        const wrapper = shallow(
            <CollaborationModal {...defaultProps} onJoinRoom={onJoinRoomMock} />
        );

        wrapper.instance().setState({roomId: 'test-room'});
        const buttons = wrapper.find('Button');
        const joinButton = buttons.findWhere(btn => btn.text().includes('Join Room'));

        joinButton.simulate('click');

        expect(onJoinRoomMock).toHaveBeenCalled();
    });

    test('shows error when joining with empty room ID', () => {
        const onJoinRoomMock = jest.fn();
        const wrapper = shallow(
            <CollaborationModal {...defaultProps} onJoinRoom={onJoinRoomMock} />
        );

        wrapper.instance().setState({roomId: ''});
        const buttons = wrapper.find('Button');
        const joinButton = buttons.findWhere(btn => btn.text().includes('Join Room'));

        joinButton.simulate('click');

        expect(wrapper.state().error).toBe('Please enter a room ID');
        expect(onJoinRoomMock).not.toHaveBeenCalled();
    });

    test('calls handleCreateRoom when create button is clicked', () => {
        const onCreateRoomMock = jest.fn();
        const wrapper = shallow(
            <CollaborationModal {...defaultProps} onCreateRoom={onCreateRoomMock} />
        );

        const buttons = wrapper.find('Button');
        const createButton = buttons.findWhere(btn => btn.text().includes('Create New Room'));

        createButton.simulate('click');

        expect(onCreateRoomMock).toHaveBeenCalled();
    });

    test('shows connecting state when connecting', () => {
        const wrapper = mount(
            <Provider store={mockStore}>
                <CollaborationModal {...defaultProps} />
            </Provider>
        );

        wrapper.instance().setState({connectionStep: 'connecting', isConnecting: true});
        wrapper.update();

        expect(wrapper.text()).toContain('Connecting to room...');
        expect(wrapper.text()).toContain('Cancel');
    });

    test('calls onCancelConnection when cancel is clicked', () => {
        const onCancelConnectionMock = jest.fn();
        const wrapper = shallow(
            <CollaborationModal {...defaultProps} onCancelConnection={onCancelConnectionMock} />
        );

        wrapper.instance().setState({connectionStep: 'connecting'});
        const buttons = wrapper.find('Button');
        const cancelButton = buttons.findWhere(btn => btn.text().includes('Cancel'));

        cancelButton.simulate('click');

        expect(onCancelConnectionMock).toHaveBeenCalled();
    });

    test('renders connected step when isConnected is true', () => {
        const props = {
            ...defaultProps,
            isConnected: true,
            roomId: 'test-room',
            connectedUsers: [
                {id: 'host-1', username: 'HostUser', isHost: true},
                {id: 'user-2', username: 'GuestUser', isHost: false}
            ]
        };
        const wrapper = mount(
            <Provider store={mockStore}>
                <CollaborationModal {...props} />
            </Provider>
        );

        expect(wrapper.text()).toContain('Room: test-room');
        expect(wrapper.text()).toContain('Connected');
        expect(wrapper.text()).toContain('HostUser');
        expect(wrapper.text()).toContain('GuestUser');
    });

    test('displays user count (singular)', () => {
        const props = {
            ...defaultProps,
            isConnected: true,
            roomId: 'test-room',
            connectedUsers: [
                {id: 'user-1', username: 'Alice', isHost: true}
            ]
        };
        const wrapper = mount(
            <Provider store={mockStore}>
                <CollaborationModal {...props} />
            </Provider>
        );
        expect(wrapper.text()).toContain('1 user');
    });

    test('displays user count (plural)', () => {
        const props = {
            ...defaultProps,
            isConnected: true,
            roomId: 'test-room',
            connectedUsers: [
                {id: 'user-1', username: 'Alice', isHost: true},
                {id: 'user-2', username: 'Bob', isHost: false}
            ]
        };
        const wrapper = mount(
            <Provider store={mockStore}>
                <CollaborationModal {...props} />
            </Provider>
        );
        expect(wrapper.text()).toContain('2 users');
    });

    test('shows host badge for host users', () => {
        const props = {
            ...defaultProps,
            isConnected: true,
            roomId: 'test-room',
            connectedUsers: [
                {id: 'host-1', username: 'HostUser', isHost: true}
            ]
        };
        const wrapper = mount(
            <Provider store={mockStore}>
                <CollaborationModal {...props} />
            </Provider>
        );
        expect(wrapper.text()).toContain('Host');
    });

    test('shows you badge for current user', () => {
        const props = {
            ...defaultProps,
            isConnected: true,
            roomId: 'test-room',
            currentUserId: 'user-1',
            connectedUsers: [
                {id: 'user-1', username: 'MyUser', isHost: false}
            ]
        };
        const wrapper = mount(
            <Provider store={mockStore}>
                <CollaborationModal {...props} />
            </Provider>
        );
        expect(wrapper.text()).toContain('You');
    });

    test('shows kick button for host', () => {
        const onKickUserMock = jest.fn();
        const props = {
            ...defaultProps,
            isConnected: true,
            roomId: 'test-room',
            currentUserId: 'host-1',
            connectedUsers: [
                {id: 'host-1', username: 'HostUser', isHost: true},
                {id: 'user-2', username: 'GuestUser', isHost: false}
            ],
            onKickUser: onKickUserMock
        };
        const wrapper = mount(
            <Provider store={mockStore}>
                <CollaborationModal {...props} />
            </Provider>
        );

        const kickButtons = wrapper.find('Button').filterWhere(btn => btn.text().includes('Kick'));
        expect(kickButtons).toHaveLength(1);
    });

    test('does not show kick button for non-host', () => {
        const props = {
            ...defaultProps,
            isConnected: true,
            roomId: 'test-room',
            currentUserId: 'user-2',
            connectedUsers: [
                {id: 'host-1', username: 'HostUser', isHost: true},
                {id: 'user-2', username: 'GuestUser', isHost: false}
            ]
        };
        const wrapper = mount(
            <Provider store={mockStore}>
                <CollaborationModal {...props} />
            </Provider>
        );

        const kickButtons = wrapper.find('Button').filterWhere(btn => btn.text().includes('Kick'));
        expect(kickButtons).toHaveLength(0);
    });

    test('calls onLeaveRoom when leave button is clicked', () => {
        const onLeaveRoomMock = jest.fn();
        const props = {
            ...defaultProps,
            isConnected: true,
            roomId: 'test-room',
            connectedUsers: [{id: 'user-1', username: 'Alice', isHost: true}],
            onLeaveRoom: onLeaveRoomMock
        };
        const wrapper = mount(
            <Provider store={mockStore}>
                <CollaborationModal {...props} />
            </Provider>
        );

        const leaveButton = wrapper.find('Button').findWhere(btn => btn.text().includes('Leave Room'));
        leaveButton.simulate('click');

        expect(onLeaveRoomMock).toHaveBeenCalled();
    });

    test('calls onRequestClose when modal close is requested', () => {
        const onRequestCloseMock = jest.fn();
        const wrapper = shallow(
            <CollaborationModal {...defaultProps} onRequestClose={onRequestCloseMock} />
        );

        const modal = wrapper.find('Modal');
        modal.prop('onRequestClose')();

        expect(onRequestCloseMock).toHaveBeenCalled();
    });

    test('handles room privacy change', () => {
        const onChangeRoomPrivacyMock = jest.fn();
        const props = {
            ...defaultProps,
            isConnected: true,
            roomId: 'test-room',
            currentUserId: 'host-1',
            connectedUsers: [
                {id: 'host-1', username: 'HostUser', isHost: true}
            ],
            roomPrivacy: 'public',
            onChangeRoomPrivacy: onChangeRoomPrivacyMock
        };
        const wrapper = mount(
            <Provider store={mockStore}>
                <CollaborationModal {...props} />
            </Provider>
        );

        const checkboxes = wrapper.find('FancyCheckbox');
        const privateCheckbox = checkboxes.at(1);
        privateCheckbox.prop('onChange')({target: {checked: true}});

        expect(onChangeRoomPrivacyMock).toHaveBeenCalledWith('private');
    });

    test('shows pending requests when host has them', () => {
        const props = {
            ...defaultProps,
            isVisible: true,
            isConnected: true,
            roomId: 'test-room',
            currentUserId: 'host-1',
            connectedUsers: [
                {id: 'host-1', username: 'HostUser', isHost: true}
            ],
            roomPrivacy: 'private'
        };
        const wrapper = mount(
            <Provider store={mockStore}>
                <CollaborationModal {...props} />
            </Provider>
        );

        wrapper.instance().setState({
            pendingRequests: [
                {id: 'user-2', username: 'GuestUser'}
            ]
        });
        wrapper.update();

        expect(wrapper.text()).toContain('Pending Join Requests');
        expect(wrapper.text()).toContain('GuestUser');
    });

    test('handles approve join request', async () => {
        const onApproveJoinRequestMock = jest.fn().mockResolvedValue();
        const props = {
            ...defaultProps,
            isVisible: true,
            isConnected: true,
            roomId: 'test-room',
            currentUserId: 'host-1',
            connectedUsers: [
                {id: 'host-1', username: 'HostUser', isHost: true}
            ]
        };
        const wrapper = mount(
            <Provider store={mockStore}>
                <CollaborationModal {...props} onApproveJoinRequest={onApproveJoinRequestMock} />
            </Provider>
        );

        wrapper.instance().setState({
            pendingRequests: [
                {id: 'user-2', username: 'GuestUser'}
            ]
        });
        wrapper.update();

        const approveButton = wrapper.find('Button').findWhere(
            btn => btn.text().includes('Approve')
        );
        await approveButton.prop('onClick')();

        expect(onApproveJoinRequestMock).toHaveBeenCalledWith('user-2', 'GuestUser');
    });

    test('handles deny join request', async () => {
        const onDenyJoinRequestMock = jest.fn().mockResolvedValue();
        const props = {
            ...defaultProps,
            isVisible: true,
            isConnected: true,
            roomId: 'test-room',
            currentUserId: 'host-1',
            connectedUsers: [
                {id: 'host-1', username: 'HostUser', isHost: true}
            ]
        };
        const wrapper = mount(
            <Provider store={mockStore}>
                <CollaborationModal {...props} onDenyJoinRequest={onDenyJoinRequestMock} />
            </Provider>
        );

        wrapper.instance().setState({
            pendingRequests: [
                {id: 'user-2', username: 'GuestUser'}
            ]
        });
        wrapper.update();

        const denyButton = wrapper.find('Button').findWhere(
            btn => btn.text().includes('Deny')
        );
        await denyButton.prop('onClick')();

        expect(onDenyJoinRequestMock).toHaveBeenCalledWith('user-2');
    });

    test('renders pending approval step', () => {
        const wrapper = mount(
            <Provider store={mockStore}>
                <CollaborationModal {...defaultProps} />
            </Provider>
        );

        wrapper.instance().setState({connectionStep: 'pending-approval'});
        wrapper.update();

        expect(wrapper.text()).toContain('Waiting for Host Approval');
        expect(wrapper.text()).toContain('Cancel Request');
    });

    test('calls onCancelJoinRequest when cancel request is clicked', () => {
        const onCancelJoinRequestMock = jest.fn();
        const wrapper = shallow(
            <CollaborationModal {...defaultProps} onCancelJoinRequest={onCancelJoinRequestMock} />
        );

        wrapper.instance().setState({connectionStep: 'pending-approval'});
        const buttons = wrapper.find('Button');
        const cancelButton = buttons.findWhere(btn => btn.text().includes('Cancel Request'));

        cancelButton.simulate('click');

        expect(onCancelJoinRequestMock).toHaveBeenCalled();
    });

    test('displays connection error when present', () => {
        const wrapper = mount(
            <Provider store={mockStore}>
                <CollaborationModal {...defaultProps} connectionError="Connection failed" />
            </Provider>
        );

        expect(wrapper.text()).toContain('Connection failed');
    });

    test('updates roomId state when input changes', () => {
        const wrapper = shallow(<CollaborationModal {...defaultProps} />);
        const input = wrapper.find('BufferedInput');
        input.prop('onSubmit')('new-room-id');
        expect(wrapper.state().roomId).toBe('new-room-id');
    });
});
