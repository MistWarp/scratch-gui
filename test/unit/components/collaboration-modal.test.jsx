import React from 'react';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import CollaborationModal from '../../../src/components/collaboration-modal/collaboration-modal.jsx';

const defaultProps = () => ({
    visible: true,
    currentUsername: 'TestUser',
    currentUserId: 'user-1',
    isConnected: false,
    roomId: null,
    roomPrivacy: 'public',
    connectedUsers: [],
    connectionError: null,
    onRequestClose: jest.fn(),
    onJoinRoom: jest.fn(() => Promise.resolve()),
    onCreateRoom: jest.fn(() => Promise.resolve()),
    onLeaveRoom: jest.fn(),
    onKickUser: jest.fn(),
    onCancelConnection: jest.fn()
});

const mountModal = props => mountWithIntl(<CollaborationModal {...props} />);

// injectIntl wraps the class, so reach the class itself by displayName
const modalOf = wrapper => wrapper.find('CollaborationModal').instance();

const buttonWithText = (wrapper, text) => wrapper.find('ButtonComponent')
    .filterWhere(button => button.text().includes(text))
    .first();

describe('CollaborationModal', () => {
    test('live project sessions show participants and an explicit end control', () => {
        const wrapper = mountModal({
            ...defaultProps(),
            projectSessionActive: true,
            projectSession: {active: true, isHost: true, phase: 'live', editors: [], onLeave: jest.fn()},
            connectedUsers: [{id: 'user-1', username: 'Mist'}, {id: 'user-2', username: 'MistWarp'}]
        });
        expect(wrapper.text()).toContain('Project collaboration');
        expect(wrapper.text()).toContain('End live session for everyone');
        expect(wrapper.text()).toContain('MistWarp');
        expect(wrapper.text()).toContain('You');
        expect(wrapper.text()).not.toContain('Join Room');
        expect(wrapper.text()).not.toContain('Leave Room');
        wrapper.unmount();
    });

    test('joining asks before replacing the current project', () => {
        const onJoin = jest.fn();
        const wrapper = mountModal({...defaultProps(), projectSession: {
            session: {id: 'live', host: 'friend', public: true}, canJoin: true,
            editors: [], onJoin
        }});
        buttonWithText(wrapper, 'Join session').props().onClick();
        wrapper.update();
        expect(onJoin).not.toHaveBeenCalled();
        expect(wrapper.text()).toContain("Joining replaces this editor's project");
        buttonWithText(wrapper, 'Join and load host project').props().onClick();
        expect(onJoin).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });

    test('loading, connecting, and stale discovery never claim a live connection', () => {
        const wrapper = mountModal({...defaultProps(), projectSession: {
            checking: true, canHost: true, editors: []
        }});
        expect(wrapper.text()).toContain('Checking project collaboration');
        expect(buttonWithText(wrapper, 'Open to collaborators').props().disabled).toBe(true);
        wrapper.setProps({projectSession: {active: true, phase: 'joining', editors: []}});
        expect(wrapper.text()).toContain('Joining and loading');
        expect(wrapper.text()).not.toContain('Your edits are syncing');
        expect(wrapper.text()).toContain('Cancel joining');
        wrapper.setProps({projectSession: {
            discoveryError: 'Could not check who is online.', canHost: true, editors: []
        }});
        expect(buttonWithText(wrapper, 'Open to collaborators').props().disabled).toBe(true);
        wrapper.unmount();
    });

    test('renders nothing when not visible', () => {
        const wrapper = mountModal({...defaultProps(), visible: false});

        expect(wrapper.html()).toBe('');
    });

    test('renders the join step when not connected', () => {
        const wrapper = mountModal(defaultProps());

        expect(wrapper.text()).toContain('Join an Existing Room');
        expect(wrapper.text()).toContain('Room ID');
        expect(wrapper.text()).toContain('Join Room');
        expect(wrapper.text()).toContain('Create New Room');
    });

    test('shows the username the user will be known as', () => {
        const wrapper = mountModal(defaultProps());

        expect(wrapper.text()).toContain('TestUser');
    });

    test('joining passes the typed room id and the current username', async () => {
        const props = defaultProps();
        const wrapper = mountModal(props);

        wrapper.find('input').first()
            .simulate('change', {target: {value: 'test-room'}});
        await buttonWithText(wrapper, 'Join Room').props()
            .onClick();

        expect(props.onJoinRoom).toHaveBeenCalledWith('test-room', 'TestUser');
    });

    test('joining with an empty room id shows an error and does not connect', async () => {
        const props = defaultProps();
        const wrapper = mountModal(props);

        await buttonWithText(wrapper, 'Join Room').props()
            .onClick();

        expect(props.onJoinRoom).not.toHaveBeenCalled();
        expect(modalOf(wrapper).state.error).toBe('Please enter a room ID');
    });

    test('a room id is trimmed before joining', async () => {
        const props = defaultProps();
        const wrapper = mountModal(props);

        wrapper.find('input').first()
            .simulate('change', {target: {value: '  spaced  '}});
        await buttonWithText(wrapper, 'Join Room').props()
            .onClick();

        expect(props.onJoinRoom).toHaveBeenCalledWith('spaced', 'TestUser');
    });

    test('a failed join surfaces the error message', async () => {
        const props = defaultProps();
        props.onJoinRoom = jest.fn(() => Promise.reject(new Error('boom')));
        const wrapper = mountModal(props);

        wrapper.find('input').first()
            .simulate('change', {target: {value: 'test-room'}});
        await buttonWithText(wrapper, 'Join Room').props()
            .onClick();

        expect(modalOf(wrapper).state.error).toBe('boom');
        expect(modalOf(wrapper).state.isConnecting).toBe(false);
    });

    test('joining a room nobody hosts suggests creating it', async () => {
        const props = defaultProps();
        const notFound = new Error('nope');
        notFound.collabCode = 'ROOM_NOT_FOUND';
        props.onJoinRoom = jest.fn(() => Promise.reject(notFound));
        const wrapper = mountModal(props);

        wrapper.find('input').first()
            .simulate('change', {target: {value: 'test-room'}});
        await buttonWithText(wrapper, 'Join Room').props()
            .onClick();

        expect(modalOf(wrapper).state.error).toContain('Nobody is hosting room "test-room" yet');
    });

    test('creating a room uses the typed room id and hosts it privately by default', async () => {
        const props = defaultProps();
        const wrapper = mountModal(props);

        wrapper.find('input').first()
            .simulate('change', {target: {value: 'my-room'}});
        // once a room id is typed, the create button offers to host that room by name
        await buttonWithText(wrapper, 'Host room "my-room"').props()
            .onClick();

        expect(props.onCreateRoom).toHaveBeenCalledWith('my-room', 'TestUser', 'private');
    });

    test('creating a room with no room id generates one', async () => {
        const props = defaultProps();
        const wrapper = mountModal(props);

        await buttonWithText(wrapper, 'Create New Room').props()
            .onClick();

        expect(props.onCreateRoom).toHaveBeenCalledTimes(1);
        const [roomCode, username, privacy] = props.onCreateRoom.mock.calls[0];
        expect(roomCode).toBeTruthy();
        expect(username).toBe('TestUser');
        expect(privacy).toBe('private');
    });

    test('the host can explicitly create a public room', async () => {
        const props = defaultProps();
        const wrapper = mountModal(props);

        wrapper.find('button[role="radio"]').at(1).simulate('click');
        await buttonWithText(wrapper, 'Create New Room').props().onClick();

        expect(props.onCreateRoom).toHaveBeenCalledWith(expect.any(String), 'TestUser', 'public');
    });

    test('a failed create surfaces the error message', async () => {
        const props = defaultProps();
        props.onCreateRoom = jest.fn(() => Promise.reject(new Error('cannot host')));
        const wrapper = mountModal(props);

        wrapper.find('input').first()
            .simulate('change', {target: {value: 'my-room'}});
        await buttonWithText(wrapper, 'Host room "my-room"').props()
            .onClick();

        expect(modalOf(wrapper).state.error).toBe('cannot host');
        expect(modalOf(wrapper).state.isConnecting).toBe(false);
    });

    describe('when connected', () => {
        const connectedProps = () => ({
            ...defaultProps(),
            isConnected: true,
            roomId: 'abc',
            connectedUsers: [
                {id: 'user-1', username: 'TestUser', isHost: true},
                {id: 'user-2', username: 'Alice'}
            ]
        });

        test('lists the room and the connected users', () => {
            const wrapper = mountModal(connectedProps());

            expect(wrapper.text()).toContain('Room: abc');
            expect(wrapper.text()).toContain('TestUser');
            expect(wrapper.text()).toContain('Alice');
            expect(wrapper.text()).toContain('2 users online');
        });

        test('marks the host and the current user', () => {
            const wrapper = mountModal(connectedProps());

            expect(wrapper.text()).toContain('Host');
            expect(wrapper.text()).toContain('You');
        });

        test('leaving the room calls back and returns to the join step', () => {
            const props = connectedProps();
            const wrapper = mountModal(props);

            modalOf(wrapper).handleLeaveRoom();

            expect(props.onLeaveRoom).toHaveBeenCalled();
            expect(modalOf(wrapper).state.connectionStep).toBe('join');
        });

        test('kicking a user calls back with that user id', () => {
            const props = connectedProps();
            const wrapper = mountModal(props);

            modalOf(wrapper).handleKickUser('user-2');

            expect(props.onKickUser).toHaveBeenCalledWith('user-2');
        });

        test('locks both privacy choices while an update is running', async () => {
            let finishUpdate;
            const props = {
                ...connectedProps(),
                onChangeRoomPrivacy: jest.fn(() => new Promise(resolve => {
                    finishUpdate = resolve;
                }))
            };
            const wrapper = mountModal(props);
            const modal = modalOf(wrapper);

            const firstUpdate = modal.handleSelectPrivatePrivacy();
            modal.handleSelectPublicPrivacy();
            wrapper.update();

            await Promise.resolve();
            expect(props.onChangeRoomPrivacy).toHaveBeenCalledTimes(1);
            expect(wrapper.find('button[role="radio"]').everyWhere(button => button.prop('disabled'))).toBe(true);
            finishUpdate();
            await firstUpdate;
            wrapper.update();
            expect(wrapper.find('button[role="radio"]').everyWhere(button => !button.prop('disabled'))).toBe(true);
        });
    });
});
