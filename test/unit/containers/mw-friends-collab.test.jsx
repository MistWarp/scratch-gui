import React from 'react';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import Emitter from '../../../src/lib/collaboration/emitter.js';

jest.mock('../../../src/lib/notification-manager.js');
jest.mock('../../../src/lib/mw/smart-save.js', () => jest.fn(async () => true));
jest.mock('../../../src/lib/rotur/friends.js', () => {
    const mockEmitter = require('../../../src/lib/collaboration/emitter.js').default;
    const service = new mockEmitter();
    Object.assign(service, {
        getSnapshot: () => ({
            status: 'ready',
            error: '',
            visible: true,
            onlineCount: 1,
            friends: [{username: 'Bob', online: true, presence: 'online', activity: null}],
            requests: []
        }),
        subscribe: listener => {
            service.on('change', listener);
            return () => service.off('change', listener);
        },
        start: jest.fn(),
        send: jest.fn(async () => true),
        sendToOwnTabs: jest.fn(async () => true),
        isFriend: name => name.toLowerCase() === 'bob'
    });
    return {getFriendsService: () => service};
});

import {getFriendsService} from '../../../src/lib/rotur/friends.js';
import smartSave from '../../../src/lib/mw/smart-save.js';
import {FriendsCollab} from '../../../src/containers/mw-friends-collab.jsx';

class FakeCollab extends Emitter {
    constructor () {
        super();
        this.isConnected = false;
        this.isHost = false;
        this.roomId = null;
        this.keys = new Map();
        this.users = [];
    }

    getConnectedUsers () {
        return this.users;
    }

    addInviteKey (key, username, expiresAt) {
        this.keys.set(key, {username, expiresAt});
        return true;
    }

    revokeInviteKey (key) {
        this.keys.delete(key);
    }
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

const mount = (props = {}) => {
    const service = new FakeCollab();
    const onCreateRoom = jest.fn(async roomId => {
        service.isConnected = true;
        service.isHost = true;
        service.roomId = roomId;
    });
    const onJoinRoom = jest.fn(async () => {});
    const onOpen = jest.fn();
    const dialogs = [];
    const answer = {value: 'join'};
    const openSimpleDialog = jest.fn(config => {
        dialogs.push(config);
        if (answer.value) config.onOk(answer.value);
        else config.onCancel();
    });
    let tools = null;
    const wrapper = mountWithIntl(
        <FriendsCollab
            roturHandle="alice"
            service={service}
            sessionMembers={[]}
            openSimpleDialog={openSimpleDialog}
            onProjectUnchanged={jest.fn()}
            onCreateRoom={onCreateRoom}
            onJoinRoom={onJoinRoom}
            onOpen={onOpen}
            onSignIn={jest.fn()}
            {...props}
        >
            {(panel, friendTools) => {
                tools = friendTools;
                return <div>{panel}</div>;
            }}
        </FriendsCollab>
    );
    const instance = wrapper.find(FriendsCollab).instance();
    return {wrapper, instance, service, onCreateRoom, onJoinRoom, onOpen, dialogs, answer, getTools: () => tools};
};

describe('FriendsCollab', () => {
    const friends = getFriendsService();

    beforeEach(() => {
        friends.send.mockClear();
        friends.sendToOwnTabs.mockClear();
    });

    test('inviting a friend opens a private session and sends a one-time key', async () => {
        const {instance, service, onCreateRoom} = mount();
        await instance.handleInvite('Bob');
        expect(onCreateRoom).toHaveBeenCalledWith(expect.stringMatching(/^[a-f0-9]{32}$/), 'alice', 'private');
        const [to, message] = friends.send.mock.calls[0];
        expect(to).toBe('Bob');
        expect(message.t).toBe('mw.invite');
        expect(message.room).toBe(service.roomId);
        expect(service.keys.get(message.key).username).toBe('Bob');
        expect(instance.state.invites.bob.status).toBe('sent');
    });

    test('a project session host invites into the project session', async () => {
        const service = new FakeCollab();
        const onHost = jest.fn(async () => {
            service.isConnected = true;
            service.isHost = true;
            service.roomId = 'project-room';
        });
        const {instance, onCreateRoom} = mount({service, projectSession: {canHost: true, session: null, onHost}});
        await instance.handleInvite('Bob');
        expect(onHost).toHaveBeenCalled();
        expect(onCreateRoom).not.toHaveBeenCalled();
        expect(friends.send.mock.calls[0][1].room).toBe('project-room');
    });

    test('guests cannot invite', () => {
        const {service, wrapper} = mount();
        service.isConnected = true;
        service.isHost = false;
        wrapper.setProps({});
        expect(wrapper.text()).toContain('Only the host can invite people to this session.');
    });

    test('an undelivered invite revokes its key', async () => {
        friends.send.mockResolvedValueOnce(false);
        const {instance, service} = mount();
        await instance.handleInvite('Bob');
        expect(service.keys.size).toBe(0);
        expect(instance.state.invites.bob.status).toBe('unreachable');
    });

    test('a declined invite revokes its key', async () => {
        const {instance, service} = mount();
        await instance.handleInvite('Bob');
        const invite = friends.send.mock.calls[0][1];
        friends.emit('message', {from: 'Bob', message: {t: 'mw.invite.reply', v: 1, id: invite.id, answer: 'declined'}});
        expect(service.keys.size).toBe(0);
        expect(instance.state.invites.bob.status).toBe('declined');
    });

    test('accepting an invite joins with the key and tells the host and other tabs', async () => {
        const {instance, wrapper, onJoinRoom, onOpen} = mount();
        const key = 'a'.repeat(32);
        const id = 'b'.repeat(24);
        friends.emit('message', {from: 'Bob', message: {t: 'mw.invite', v: 1, id, room: 'room-1', key, title: 'Maze'}});
        wrapper.update();
        expect(wrapper.text()).toContain('invited you to edit together');
        await instance.handleAcceptInvite(instance.state.incomingInvites[0]);
        expect(onJoinRoom).toHaveBeenCalledWith('room-1', 'alice', null, key, {confirmed: true});
        expect(friends.send).toHaveBeenCalledWith('Bob', {t: 'mw.invite.reply', v: 1, id, answer: 'accepted'});
        expect(friends.sendToOwnTabs).toHaveBeenCalledWith({t: 'mw.handled', v: 1, id});
        expect(onOpen).toHaveBeenCalled();
        expect(instance.state.incomingInvites).toHaveLength(0);
    });

    const invite = id => ({from: 'Bob', message: {t: 'mw.invite', v: 1, id, room: 'r', key: 'd'.repeat(32)}});

    test('the join dialog only offers saving when there are unsaved changes', async () => {
        const clean = mount();
        friends.emit('message', invite('1'.repeat(24)));
        await clean.instance.handleAcceptInvite(clean.instance.state.incomingInvites[0]);
        expect(clean.dialogs[0].title).toBe('Join Bob?');
        expect(clean.dialogs[0].choices.map(choice => choice.value)).toEqual(['join']);

        const changed = mount({projectChanged: true});
        friends.emit('message', invite('2'.repeat(24)));
        await changed.instance.handleAcceptInvite(changed.instance.state.incomingInvites[0]);
        expect(changed.dialogs[0].choices.map(choice => choice.value)).toEqual(['join', 'save']);
        expect(changed.dialogs[0].message).toContain('unsaved changes');
    });

    test('the join dialog warns when joining would end your own session', async () => {
        const {instance, service, dialogs} = mount();
        service.isConnected = true;
        service.isHost = true;
        service.users = [{id: 'me'}, {id: 'carol'}];
        friends.emit('message', invite('3'.repeat(24)));
        await instance.handleAcceptInvite(instance.state.incomingInvites[0]);
        expect(dialogs[0].message).toContain('everyone in it will be disconnected');
    });

    test('save and join saves first, then joins', async () => {
        const {instance, answer, onJoinRoom} = mount({projectChanged: true});
        answer.value = 'save';
        smartSave.mockClear();
        friends.emit('message', invite('4'.repeat(24)));
        await instance.handleAcceptInvite(instance.state.incomingInvites[0]);
        expect(smartSave).toHaveBeenCalled();
        expect(smartSave.mock.invocationCallOrder[0]).toBeLessThan(onJoinRoom.mock.invocationCallOrder[0]);
        expect(instance.state.incomingInvites).toHaveLength(0);
    });

    test('when saving needs the save window, the invite waits', async () => {
        const {instance, answer, onJoinRoom} = mount({projectChanged: true});
        answer.value = 'save';
        smartSave.mockResolvedValueOnce(false);
        friends.emit('message', invite('5'.repeat(24)));
        await instance.handleAcceptInvite(instance.state.incomingInvites[0]);
        expect(onJoinRoom).not.toHaveBeenCalled();
        expect(instance.state.incomingInvites).toHaveLength(1);
        expect(instance.state.busyId).toBeNull();
    });

    test('a failed save does not join', async () => {
        const {instance, answer, onJoinRoom} = mount({projectChanged: true});
        answer.value = 'save';
        smartSave.mockRejectedValueOnce(new Error('disk full'));
        friends.emit('message', invite('6'.repeat(24)));
        await instance.handleAcceptInvite(instance.state.incomingInvites[0]);
        expect(onJoinRoom).not.toHaveBeenCalled();
        expect(instance.state.incomingInvites).toHaveLength(1);
    });

    test('cancelling the join dialog keeps the invite card', async () => {
        const {instance, answer, onJoinRoom} = mount();
        answer.value = null;
        friends.emit('message', invite('7'.repeat(24)));
        await instance.handleAcceptInvite(instance.state.incomingInvites[0]);
        expect(onJoinRoom).not.toHaveBeenCalled();
        expect(instance.state.incomingInvites).toHaveLength(1);
        expect(friends.send).not.toHaveBeenCalled();
    });

    test('a failed join removes the card and reports it', async () => {
        const {instance, onJoinRoom} = mount();
        onJoinRoom.mockRejectedValueOnce(new Error('Room did not respond.'));
        friends.emit('message', invite('c'.repeat(24)));
        await instance.handleAcceptInvite(instance.state.incomingInvites[0]);
        expect(instance.state.incomingInvites).toHaveLength(0);
        expect(friends.send).not.toHaveBeenCalled();
    });

    test('another tab handling an invite removes it here', async () => {
        const {instance} = mount();
        const id = 'e'.repeat(24);
        friends.emit('message', {from: 'Bob', message: {t: 'mw.invite', v: 1, id, room: 'r', key: 'f'.repeat(32)}});
        friends.emit('self-message', {t: 'mw.handled', v: 1, id});
        expect(instance.state.incomingInvites).toHaveLength(0);
    });

    test('asking to join shows a card for the host, who can answer with an invite', async () => {
        const {instance, wrapper, onCreateRoom} = mount();
        friends.emit('message', {from: 'Bob', message: {t: 'mw.ask', v: 1, id: '1'.repeat(24), title: ''}});
        wrapper.update();
        expect(wrapper.text()).toContain('wants to edit with you');
        await instance.handleAcceptAsk(instance.state.incomingAsks[0]);
        await flush();
        expect(onCreateRoom).toHaveBeenCalled();
        expect(friends.send.mock.calls.some(([, message]) => message.t === 'mw.invite')).toBe(true);
    });

    test('friends already in the session are marked instead of offered an invite', () => {
        const {wrapper} = mount({sessionMembers: ['bob']});
        expect(wrapper.text()).toContain('In this session');
        expect(wrapper.find('button').filterWhere(button => button.text() === 'Invite')).toHaveLength(0);
    });

    test('ending the session cancels pending invites', async () => {
        const {instance, service} = mount();
        await instance.handleInvite('Bob');
        const invite = friends.send.mock.calls[0][1];
        service.emit('disconnected');
        expect(friends.send).toHaveBeenLastCalledWith('Bob', {t: 'mw.invite.cancel', v: 1, id: invite.id});
    });
});
