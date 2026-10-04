import React from 'react';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import CollaborationModal from '../../../src/components/collaboration-modal/collaboration-modal.jsx';

const serviceState = {roomId: null, pendingRequests: [], handlers: {}};

jest.mock('../../../src/lib/collaboration/index.js', () => ({
    getInstance: () => ({
        on: (event, handler) => {
            serviceState.handlers[event] = handler;
        },
        off: (event, handler) => {
            if (serviceState.handlers[event] === handler) delete serviceState.handlers[event];
        },
        disconnect: () => {},
        get roomId () {
            return serviceState.roomId;
        },
        getPendingJoinRequests: () => serviceState.pendingRequests
    })
}));

const defaultProps = () => ({
    visible: true,
    currentUsername: 'TestUser',
    currentUserId: 'user-1',
    isConnected: false,
    roomId: null,
    connectedUsers: [],
    connectionError: null,
    onRequestClose: jest.fn(),
    onJoinRoom: jest.fn(() => Promise.resolve()),
    onCreateRoom: jest.fn(() => Promise.resolve()),
    onLeaveRoom: jest.fn(),
    onKickUser: jest.fn(),
    onCancelConnection: jest.fn(),
    onShowToast: jest.fn(),
    openSimpleDialog: jest.fn()
});

const mountModal = props => mountWithIntl(<CollaborationModal {...props} />);

// injectIntl wraps the class, so reach the class itself by displayName
const modalOf = wrapper => wrapper.find('CollaborationModal').instance();

const buttonWithText = (wrapper, text) => wrapper.find('ButtonComponent')
    .filterWhere(button => button.text().includes(text))
    .first();

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

beforeEach(() => {
    serviceState.roomId = null;
    serviceState.pendingRequests = [];
    serviceState.handlers = {};
});

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
        expect(wrapper.text()).not.toContain('Join room');
        expect(wrapper.text()).not.toContain('Leave room');
        wrapper.unmount();
    });

    test('joining a project session hands off to the container without an inline confirm', () => {
        const onJoin = jest.fn();
        const wrapper = mountModal({...defaultProps(),
            projectSession: {
                session: {id: 'live', host: 'friend', public: true},
                canJoin: true,
                editors: [],
                onJoin
            }});
        buttonWithText(wrapper, 'Join session').props()
            .onClick();
        expect(onJoin).toHaveBeenCalledTimes(1);
        expect(wrapper.text()).not.toContain("Joining replaces this editor's project");
        wrapper.unmount();
    });

    test('a project session host gets the invite link section', () => {
        const onChangeInviteRole = jest.fn();
        const wrapper = mountModal({
            ...defaultProps(),
            projectSessionActive: true,
            projectSession: {active: true, isHost: true, phase: 'live', editors: [], onLeave: jest.fn()},
            connectedUsers: [{id: 'user-1', username: 'Mist', isHost: true}],
            inviteLink: 'https://example.test/?room=abc&invite=key',
            inviteRole: 'watch',
            onChangeInviteRole
        });
        expect(wrapper.text()).toContain('Invite link');
        expect(wrapper.find('input[readOnly]').prop('value')).toBe('https://example.test/?room=abc&invite=key');
        wrapper.find('button[data-role="edit"]').simulate('click');
        expect(onChangeInviteRole).toHaveBeenCalledWith('edit');
        wrapper.unmount();
    });

    test('loading, connecting, and stale discovery never claim a live connection', () => {
        const wrapper = mountModal({...defaultProps(),
            projectSession: {
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

        expect(wrapper.text()).toContain('Join a room');
        expect(wrapper.text()).toContain('Room ID');
        expect(wrapper.text()).toContain('Join room');
        expect(wrapper.text()).toContain('Create new room');
        expect(wrapper.find('button[role="radio"]').exists()).toBe(false);
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
        await buttonWithText(wrapper, 'Join room').props()
            .onClick();

        expect(props.onJoinRoom).toHaveBeenCalledWith('test-room', 'TestUser');
    });

    test('joining with an empty room id shows an error and does not connect', async () => {
        const props = defaultProps();
        const wrapper = mountModal(props);

        await buttonWithText(wrapper, 'Join room').props()
            .onClick();

        expect(props.onJoinRoom).not.toHaveBeenCalled();
        expect(modalOf(wrapper).state.error).toBe('Enter a room ID to join, or create a new room below.');
    });

    test('a room id is trimmed before joining', async () => {
        const props = defaultProps();
        const wrapper = mountModal(props);

        wrapper.find('input').first()
            .simulate('change', {target: {value: '  spaced  '}});
        await buttonWithText(wrapper, 'Join room').props()
            .onClick();

        expect(props.onJoinRoom).toHaveBeenCalledWith('spaced', 'TestUser');
    });

    test('a failed join surfaces the error message', async () => {
        const props = defaultProps();
        props.onJoinRoom = jest.fn(() => Promise.reject(new Error('boom')));
        const wrapper = mountModal(props);

        wrapper.find('input').first()
            .simulate('change', {target: {value: 'test-room'}});
        await buttonWithText(wrapper, 'Join room').props()
            .onClick();

        expect(modalOf(wrapper).state.error).toBe('boom');
        expect(modalOf(wrapper).state.isConnecting).toBe(false);
    });

    test('a cancelled join goes back to the join step without an error', async () => {
        const props = defaultProps();
        const cancelled = new Error('cancelled');
        cancelled.cancelled = true;
        props.onJoinRoom = jest.fn(() => Promise.reject(cancelled));
        const wrapper = mountModal(props);

        wrapper.find('input').first()
            .simulate('change', {target: {value: 'test-room'}});
        await buttonWithText(wrapper, 'Join room').props()
            .onClick();
        wrapper.update();

        expect(modalOf(wrapper).state.error).toBeNull();
        expect(modalOf(wrapper).state.connectionStep).toBe('join');
        expect(modalOf(wrapper).state.isConnecting).toBe(false);
        expect(wrapper.text()).not.toContain('cancelled');
        expect(wrapper.text()).toContain('Join room');
    });

    test('joining a room nobody hosts says what to do', async () => {
        const props = defaultProps();
        const notFound = new Error('nope');
        notFound.collabCode = 'ROOM_NOT_FOUND';
        props.onJoinRoom = jest.fn(() => Promise.reject(notFound));
        const wrapper = mountModal(props);

        wrapper.find('input').first()
            .simulate('change', {target: {value: 'test-room'}});
        await buttonWithText(wrapper, 'Join room').props()
            .onClick();

        expect(modalOf(wrapper).state.error).toContain('Nobody is hosting room "test-room" right now');
        expect(modalOf(wrapper).state.error).toContain('ask the host for a new invite link');
    });

    test('a room in the url auto-joins with the pending invite key', async () => {
        const props = {...defaultProps(), roomId: 'from-url', pendingInvite: 'invite-key'};
        const wrapper = mountModal(props);
        await flush();

        expect(props.onJoinRoom).toHaveBeenCalledWith('from-url', 'TestUser', null, {invite: 'invite-key'});
        wrapper.unmount();
    });

    test('an auto-join still runs when a community project is open but no session is active', async () => {
        const props = {
            ...defaultProps(),
            roomId: 'from-url',
            pendingInvite: 'invite-key',
            projectSession: {editors: [], canHost: true}
        };
        const wrapper = mountModal(props);
        await flush();

        expect(props.onJoinRoom).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });

    test('an auto-join is skipped while a project session is active', async () => {
        const props = {
            ...defaultProps(),
            roomId: 'from-url',
            projectSessionActive: true,
            projectSession: {active: true, editors: []}
        };
        const wrapper = mountModal(props);
        await flush();

        expect(props.onJoinRoom).not.toHaveBeenCalled();
        wrapper.unmount();
    });

    test('a cancelled auto-join shows no error', async () => {
        const props = {...defaultProps(), roomId: 'from-url'};
        const cancelled = new Error('cancelled');
        cancelled.cancelled = true;
        props.onJoinRoom = jest.fn(() => Promise.reject(cancelled));
        const wrapper = mountModal(props);
        await flush();
        wrapper.update();

        expect(modalOf(wrapper).state.error).toBeNull();
        expect(modalOf(wrapper).state.connectionStep).toBe('join');
        expect(wrapper.find('input').first()
            .prop('value')).toBe('from-url');
        wrapper.unmount();
    });

    test('creating a room uses the typed room id and hosts it privately', async () => {
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

        await buttonWithText(wrapper, 'Create new room').props()
            .onClick();

        expect(props.onCreateRoom).toHaveBeenCalledTimes(1);
        const [roomCode, username, privacy] = props.onCreateRoom.mock.calls[0];
        expect(roomCode).toBeTruthy();
        expect(username).toBe('TestUser');
        expect(privacy).toBe('private');
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
            inviteLink: 'https://example.test/?room=abc&invite=key',
            inviteRole: 'watch',
            myRole: 'edit',
            onChangeInviteRole: jest.fn(),
            onChangeUserRole: jest.fn(),
            onApproveJoinRequest: jest.fn(() => Promise.resolve()),
            onDenyJoinRequest: jest.fn(() => Promise.resolve()),
            connectedUsers: [
                {id: 'user-1', username: 'TestUser', isHost: true, role: 'edit'},
                {id: 'user-2', username: 'Alice', role: 'watch'}
            ]
        });

        test('lists the room and the connected users', () => {
            const wrapper = mountModal(connectedProps());

            expect(wrapper.text()).toContain('Room: abc');
            expect(wrapper.text()).toContain('TestUser');
            expect(wrapper.text()).toContain('Alice');
            expect(wrapper.text()).toContain('2 users online');
        });

        test('marks the host, the current user and each role', () => {
            const wrapper = mountModal(connectedProps());

            expect(wrapper.text()).toContain('Host');
            expect(wrapper.text()).toContain('You');
            expect(wrapper.text()).toContain('Editing');
            expect(wrapper.text()).toContain('Watching');
            expect(wrapper.text()).not.toContain('experimental');
        });

        test('a host with guests confirms before ending the session for everyone', () => {
            const props = connectedProps();
            const wrapper = mountModal(props);

            expect(wrapper.text()).toContain('End live session for everyone');
            modalOf(wrapper).handleLeaveRoom();

            expect(props.onLeaveRoom).not.toHaveBeenCalled();
            expect(props.openSimpleDialog).toHaveBeenCalledTimes(1);
            const dialog = props.openSimpleDialog.mock.calls[0][0];
            expect(dialog.type).toBe('confirm');
            expect(dialog.message).toContain('1 person is still here');

            dialog.onCancel();
            expect(props.onLeaveRoom).not.toHaveBeenCalled();

            dialog.onOk();
            expect(props.onLeaveRoom).toHaveBeenCalled();
            expect(modalOf(wrapper).state.connectionStep).toBe('join');
        });

        test('a host alone and a guest leave without a confirmation', () => {
            const alone = {...connectedProps(), connectedUsers: [
                {id: 'user-1', username: 'TestUser', isHost: true, role: 'edit'}
            ]};
            let wrapper = mountModal(alone);
            expect(wrapper.text()).toContain('No one else has joined yet');
            modalOf(wrapper).handleLeaveRoom();
            expect(alone.openSimpleDialog).not.toHaveBeenCalled();
            expect(alone.onLeaveRoom).toHaveBeenCalledTimes(1);
            wrapper.unmount();

            const guest = {...connectedProps(), currentUserId: 'user-2', inviteLink: null};
            wrapper = mountModal(guest);
            expect(wrapper.text()).toContain('Leave live session');
            expect(wrapper.text()).not.toContain('No one else has joined yet');
            modalOf(wrapper).handleLeaveRoom();
            expect(guest.openSimpleDialog).not.toHaveBeenCalled();
            expect(guest.onLeaveRoom).toHaveBeenCalledTimes(1);
            wrapper.unmount();
        });

        test('a dropped connection shows as reconnecting, not connected', () => {
            const wrapper = mountModal({...connectedProps(), isReconnecting: true});

            expect(wrapper.text()).toContain('Connection lost. Reconnecting…');
            expect(wrapper.text()).not.toContain('users online');

            wrapper.setProps({isReconnecting: false});
            expect(wrapper.text()).toContain('2 users online');
            wrapper.unmount();
        });

        test('the reason a session ended survives the room being cleared', () => {
            const wrapper = mountModal(connectedProps());

            // The container clears the connection and the room, then sets
            // the reason; or sets the reason first. Either way it must show.
            wrapper.setProps({isConnected: false});
            wrapper.setProps({roomId: null});
            wrapper.setProps({connectionError: 'The host removed you from the room.'});
            expect(modalOf(wrapper).state.error).toBe('The host removed you from the room.');

            wrapper.setProps({connectionError: null, isConnected: true, roomId: 'abc'});
            wrapper.setProps({connectionError: 'The host did not let you in.'});
            wrapper.setProps({isConnected: false, roomId: null});
            expect(modalOf(wrapper).state.connectionStep).toBe('join');
            expect(modalOf(wrapper).state.error).toBe('The host did not let you in.');
            expect(wrapper.find('[role="alert"]').text()).toBe('The host did not let you in.');
            wrapper.unmount();
        });

        test('kicking a user asks first, naming them, then calls back with their id', () => {
            const props = connectedProps();
            const wrapper = mountModal(props);

            wrapper.find('button[aria-label="Remove Alice"]').simulate('click');

            expect(props.onKickUser).not.toHaveBeenCalled();
            expect(props.openSimpleDialog).toHaveBeenCalledTimes(1);
            const dialog = props.openSimpleDialog.mock.calls[0][0];
            expect(dialog.type).toBe('confirm');
            expect(dialog.title).toBe('Remove Alice?');
            expect(dialog.message).toMatch(/^Alice will leave the live session/);

            dialog.onCancel();
            expect(props.onKickUser).not.toHaveBeenCalled();
            dialog.onOk();
            expect(props.onKickUser).toHaveBeenCalledWith('user-2');
        });

        test('the host can switch a guest between watching and editing', () => {
            const props = connectedProps();
            const wrapper = mountModal(props);

            const letEdit = wrapper.find('button[aria-label="Let Alice edit"]');
            expect(letEdit.text()).toBe('Let edit');
            letEdit.simulate('click');
            expect(props.onChangeUserRole).toHaveBeenCalledWith('user-2', 'edit');

            wrapper.setProps({connectedUsers: [
                {id: 'user-1', username: 'TestUser', isHost: true, role: 'edit'},
                {id: 'user-2', username: 'Alice', role: 'edit'}
            ]});
            const makeWatcher = wrapper.find('button[aria-label="Make Alice a watcher"]');
            expect(makeWatcher.text()).toBe('Make watcher');
            makeWatcher.simulate('click');
            expect(props.onChangeUserRole).toHaveBeenCalledWith('user-2', 'watch');
        });

        test('the host sees the invite link and can change what it allows', () => {
            const props = connectedProps();
            const wrapper = mountModal(props);

            expect(wrapper.text()).toContain('Invite link');
            expect(wrapper.text()).toContain('People with the link can');
            expect(wrapper.text()).toContain('cannot edit');
            expect(wrapper.find('input[readOnly]').prop('value')).toBe(props.inviteLink);
            expect(wrapper.find('[role="radiogroup"]').exists()).toBe(true);
            expect(wrapper.find('button[data-role="watch"]').prop('aria-checked')).toBe(true);
            expect(wrapper.find('button[data-role="edit"]').prop('aria-checked')).toBe(false);

            wrapper.find('button[data-role="edit"]').simulate('click');
            expect(props.onChangeInviteRole).toHaveBeenCalledWith('edit');

            wrapper.setProps({inviteRole: 'edit'});
            expect(wrapper.find('button[data-role="edit"]').prop('aria-checked')).toBe(true);
            expect(wrapper.text()).toContain('just like you');
            expect(wrapper.text()).not.toContain('Copy Room URL');
        });

        test('arrow keys move between the invite link options', () => {
            const props = connectedProps();
            const wrapper = mountModal(props);

            wrapper.find('[role="radiogroup"]').simulate('keydown', {key: 'ArrowRight'});
            expect(props.onChangeInviteRole).toHaveBeenCalledWith('edit');

            wrapper.setProps({inviteRole: 'edit'});
            wrapper.find('[role="radiogroup"]').simulate('keydown', {key: 'ArrowLeft'});
            expect(props.onChangeInviteRole).toHaveBeenLastCalledWith('watch');
        });

        test('copying uses the invite link', async () => {
            const props = connectedProps();
            const writeText = jest.fn(() => Promise.resolve());
            Object.defineProperty(navigator, 'clipboard', {value: {writeText}, configurable: true});
            const wrapper = mountModal(props);

            buttonWithText(wrapper, 'Copy').props()
                .onClick();
            await flush();

            expect(writeText).toHaveBeenCalledWith(props.inviteLink);
            expect(props.onShowToast).toHaveBeenCalledWith('Invite link copied to clipboard', 'success');
            delete navigator.clipboard;
        });

        test('guests do not see the invite link or host controls', () => {
            const wrapper = mountModal({
                ...connectedProps(),
                currentUserId: 'user-2',
                inviteLink: null,
                inviteRole: null
            });

            expect(wrapper.text()).not.toContain('Invite link');
            expect(wrapper.find('button[aria-label="Remove TestUser"]').exists()).toBe(false);
            expect(wrapper.find('button[aria-label="Let TestUser edit"]').exists()).toBe(false);
        });

        test('a watcher sees a calm notice instead of an error', () => {
            const wrapper = mountModal({
                ...connectedProps(),
                currentUserId: 'user-2',
                myRole: 'watch',
                inviteLink: null,
                inviteRole: null
            });

            expect(wrapper.text()).toContain('You are watching.');
            expect(wrapper.find('[role="status"]').exists()).toBe(true);
            expect(wrapper.find('[role="alert"]').exists()).toBe(false);
        });

        test('an editor does not see the watcher notice', () => {
            const wrapper = mountModal({
                ...connectedProps(),
                currentUserId: 'user-2',
                myRole: 'edit'
            });

            expect(wrapper.text()).not.toContain('You are watching.');
        });

        test('pending requests can be let in as a watcher or editor, or denied', async () => {
            const props = connectedProps();
            serviceState.pendingRequests = [{id: 'req-1', username: 'Bob'}];
            const wrapper = mountModal(props);
            wrapper.setProps({connectionError: null});
            wrapper.update();

            expect(wrapper.text()).toContain('Join requests (1)');
            await wrapper.find('button[aria-label="Let Bob watch"]').props()
                .onClick();
            expect(props.onApproveJoinRequest).toHaveBeenCalledWith('req-1', 'Bob', 'watch');

            await wrapper.find('button[aria-label="Let Bob edit"]').props()
                .onClick();
            expect(props.onApproveJoinRequest).toHaveBeenCalledWith('req-1', 'Bob', 'edit');

            await wrapper.find('button[aria-label="Deny Bob"]').props()
                .onClick();
            expect(props.onDenyJoinRequest).toHaveBeenCalledWith('req-1');
        });

        test('a cancelled join request disappears from the host\'s list', () => {
            serviceState.pendingRequests = [{id: 'req-1', username: 'Bob'}];
            const wrapper = mountModal(connectedProps());
            wrapper.setProps({connectionError: null});
            expect(wrapper.text()).toContain('Join requests (1)');

            serviceState.pendingRequests = [];
            serviceState.handlers['join-request-cancelled']({requesterId: 'req-1'});
            wrapper.update();
            expect(wrapper.text()).not.toContain('Join requests');
            wrapper.unmount();
        });
    });

    test('only a real approval request shows the waiting-for-host step', async () => {
        const props = defaultProps();
        props.onJoinRoom = jest.fn(() => new Promise(() => {}));
        const wrapper = mountModal(props);
        wrapper.find('input').first()
            .simulate('change', {target: {value: 'room'}});
        buttonWithText(wrapper, 'Join room').props()
            .onClick();
        wrapper.update();
        expect(wrapper.text()).toContain('Connecting to room "room"');
        expect(serviceState.handlers['awaiting-approval']).toBeUndefined();

        serviceState.handlers['join-pending']();
        wrapper.update();
        expect(wrapper.text()).toContain('Waiting for the host');

        serviceState.handlers['approval-resolved']();
        wrapper.setProps({isConnected: true, roomId: 'room'});
        expect(modalOf(wrapper).state.connectionStep).toBe('connected');

        // A reconnect re-sends the hello; it must not look like a new request.
        serviceState.handlers['join-pending']();
        expect(modalOf(wrapper).state.connectionStep).toBe('connected');
        wrapper.unmount();
    });

    test('a project session host confirms before ending it for collaborators', () => {
        const onLeave = jest.fn();
        const props = {
            ...defaultProps(),
            projectSessionActive: true,
            projectSession: {active: true, isHost: true, phase: 'live', editors: [], onLeave},
            connectedUsers: [{id: 'user-1', username: 'Mist', isHost: true}, {id: 'user-2', username: 'Alex'}]
        };
        const wrapper = mountModal(props);
        buttonWithText(wrapper, 'End live session for everyone').props()
            .onClick();
        expect(onLeave).not.toHaveBeenCalled();
        props.openSimpleDialog.mock.calls[0][0].onOk();
        expect(onLeave).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });

    test('a project session shows why the last session ended', () => {
        const wrapper = mountModal({
            ...defaultProps(),
            connectionError: 'The host ended the live session.',
            projectSession: {editors: [], canHost: true}
        });
        expect(wrapper.find('[role="alert"]').text()).toBe('The host ended the live session.');
        wrapper.unmount();
    });

    test('a retryable failure offers Try again, which repeats the attempt', async () => {
        const props = {...defaultProps(), canRetry: true, onRetry: jest.fn(() => Promise.resolve())};
        const wrapper = mountModal(props);
        expect(buttonWithText(wrapper, 'Try again').exists()).toBe(false);

        wrapper.setProps({connectionError: 'Could not reach the collaboration server.'});
        wrapper.update();
        await buttonWithText(wrapper, 'Try again').props()
            .onClick();
        expect(props.onRetry).toHaveBeenCalledTimes(1);
        expect(modalOf(wrapper).state.connectionStep).toBe('connecting');

        // Without canRetry (kicked, room taken...) there is no button.
        wrapper.setProps({canRetry: false, connectionError: 'Taken.'});
        wrapper.update();
        expect(buttonWithText(wrapper, 'Try again').exists()).toBe(false);
        wrapper.unmount();
    });

    test('a failed retry shows the new reason', async () => {
        const failure = new Error('raw');
        failure.collabCode = 'SERVER_UNREACHABLE';
        const props = {...defaultProps(), canRetry: true, onRetry: jest.fn(() => Promise.reject(failure))};
        const wrapper = mountModal(props);
        await modalOf(wrapper).handleRetry();
        expect(modalOf(wrapper).state.error).toContain('Could not reach the collaboration server');
        expect(modalOf(wrapper).state.connectionStep).toBe('join');
        wrapper.unmount();
    });

    test('reclaiming a room from a previous page is explained while creating', async () => {
        const props = {...defaultProps(), onCreateRoom: jest.fn(() => new Promise(() => {}))};
        const wrapper = mountModal(props);
        buttonWithText(wrapper, 'Create new room').props()
            .onClick();
        wrapper.setProps({isReclaimingRoom: true});
        wrapper.update();
        expect(wrapper.text()).toContain('Reclaiming the room from your previous session');
        expect(wrapper.text()).toContain('up to a minute');
        wrapper.unmount();
    });

    test('a host who dropped out reads as waiting, not as our connection failing', () => {
        const wrapper = mountModal({
            ...defaultProps(),
            isConnected: true,
            roomId: 'abc',
            isReconnecting: true,
            reconnectReason: 'ROOM_NOT_FOUND',
            connectedUsers: [{id: 'user-1', username: 'TestUser'}, {id: 'h', username: 'Host', isHost: true}]
        });
        expect(wrapper.text()).toContain('Waiting for the host to come back');
        expect(wrapper.text()).not.toContain('Connection lost');
        wrapper.unmount();

        const project = mountModal({...defaultProps(), reconnectReason: 'ROOM_NOT_FOUND',
            projectSession: {active: true, phase: 'reconnecting', editors: [], onLeave: jest.fn()}});
        expect(project.text()).toContain('Waiting for the host to come back');
        project.unmount();
    });

    test('the room id field is labelled and errors are announced', async () => {
        const wrapper = mountModal(defaultProps());
        expect(wrapper.find('label[htmlFor="collaborationRoomId"]').exists()).toBe(true);
        expect(wrapper.find('input#collaborationRoomId').exists()).toBe(true);
        await buttonWithText(wrapper, 'Join room').props()
            .onClick();
        wrapper.update();
        expect(wrapper.find('[role="alert"]').exists()).toBe(true);
        expect(wrapper.find('input#collaborationRoomId').prop('aria-invalid')).toBe(true);
        wrapper.unmount();
    });
});
