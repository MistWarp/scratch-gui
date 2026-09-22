import {FriendsService, mistwarpActivity, roomForUser} from '../../../src/lib/rotur/friends.js';

class FakeSocket {
    constructor () {
        this.connected = true;
        this.handlers = new Map();
        this.sent = [];
    }

    on (command, handler) {
        if (!this.handlers.has(command)) this.handlers.set(command, new Set());
        this.handlers.get(command).add(handler);
        return () => this.handlers.get(command).delete(handler);
    }

    emit (command, message) {
        (this.handlers.get(command) || []).forEach(handler => handler({cmd: command, ...message}));
    }

    join (room) {
        this.sent.push({cmd: 'join', room});
    }

    leave (room) {
        this.sent.push({cmd: 'leave', room});
    }

    sendPrivateMessage (room, to, val, listener) {
        this.sent.push({cmd: 'pmsg', room, to, val, listener});
    }

    joinedRooms () {
        const rooms = new Set();
        for (const packet of this.sent) {
            if (packet.cmd === 'join') rooms.add(packet.room);
            if (packet.cmd === 'leave') rooms.delete(packet.room);
        }
        return rooms;
    }
}

const setup = ({granted = true, friends = ['Bob', 'carol'], visible = true} = {}) => {
    const socket = new FakeSocket();
    let settings = {friendsVisible: visible};
    const settingsListeners = new Set();
    const rotur = {
        socket,
        friends: {
            list: jest.fn(async () => ({friends})),
            request: jest.fn(async () => ({message: 'sent'})),
            accept: jest.fn(async () => ({message: 'ok'})),
            reject: jest.fn(async () => ({message: 'ok'}))
        },
        me: {requests: jest.fn(async () => ({requests: ['dave']}))}
    };
    const service = new FriendsService({
        getRotur: () => rotur,
        ensureSocket: async () => true,
        ensureScopes: jest.fn(async () => {
            granted = true;
        }),
        hasScopes: async () => granted,
        getSettings: () => settings,
        setSetting: (key, value) => {
            settings = {...settings, [key]: value};
            settingsListeners.forEach(listener => listener(settings));
        },
        subscribeSettings: listener => {
            settingsListeners.add(listener);
            return () => settingsListeners.delete(listener);
        }
    });
    return {service, socket, rotur};
};

const member = (username, extra = {}) => ({
    user_id: `id-${username.toLowerCase()}`,
    username,
    presence: 'online',
    status: '',
    activities: [],
    ...extra
});

describe('FriendsService', () => {
    test('asks for consent before touching the friends list', async () => {
        const {service, rotur} = setup({granted: false});
        await service.start('Alice');
        expect(service.getSnapshot().status).toBe('needs-consent');
        expect(rotur.friends.list).not.toHaveBeenCalled();
        await service.connect();
        expect(service.getSnapshot().status).toBe('ready');
        expect(service.getSnapshot().friends.map(friend => friend.username)).toEqual(['Bob', 'carol']);
    });

    test('joins its own room and one room per friend', async () => {
        const {service, socket} = setup();
        await service.start('Alice');
        expect(Array.from(socket.joinedRooms()).sort()).toEqual([
            roomForUser('alice'), roomForUser('bob'), roomForUser('carol')
        ].sort());
        expect(service.getSnapshot().requests).toEqual(['dave']);
    });

    test('hiding from friends leaves the own room but keeps watching friends', async () => {
        const {service, socket} = setup();
        await service.start('Alice');
        service.setVisible(false);
        expect(socket.joinedRooms().has(roomForUser('alice'))).toBe(false);
        expect(socket.joinedRooms().has(roomForUser('bob'))).toBe(true);
        expect(service.getSnapshot().visible).toBe(false);
    });

    test('tracks a friend as online only when they are in their own room', async () => {
        const {service, socket} = setup();
        await service.start('Alice');
        socket.emit('room_state', {room: roomForUser('bob'), members: [member('carol')]});
        expect(service.getSnapshot().onlineCount).toBe(0);
        socket.emit('member_join', {
            room: roomForUser('bob'),
            ...member('bob', {activities: [{id: 'MistWarp', title: 'Editing In MistWarp', status: 'Working on Maze'}]})
        });
        const bob = service.getSnapshot().friends.find(friend => friend.username === 'Bob');
        expect(bob.online).toBe(true);
        expect(bob.activity.status).toBe('Working on Maze');
        socket.emit('status_update', {user_id: 'id-bob', presence: 'idle'});
        expect(service.getSnapshot().friends[0].presence).toBe('idle');
        socket.emit('member_leave', {room: roomForUser('bob'), user_id: 'id-bob'});
        expect(service.getSnapshot().onlineCount).toBe(0);
    });

    test('rejoins every room after the socket reconnects', async () => {
        const {service, socket} = setup();
        await service.start('Alice');
        socket.emit('member_join', {room: roomForUser('bob'), ...member('bob')});
        socket.sent = [];
        socket.emit('ready', {});
        expect(socket.joinedRooms().size).toBe(3);
        expect(service.getSnapshot().onlineCount).toBe(0);
    });

    test('delivers messages from friends and drops everyone else', async () => {
        const {service, socket} = setup();
        await service.start('Alice');
        const received = jest.fn();
        service.on('message', received);
        const packet = (username, id) => ({
            room: roomForUser('alice'),
            val: {t: 'mw.invite', id},
            origin: {user_id: `id-${username}`, username}
        });
        socket.emit('pmsg', packet('bob', 'a1'));
        socket.emit('pmsg', packet('bob', 'a1'));
        socket.emit('pmsg', packet('mallory', 'a2'));
        socket.emit('pmsg', {...packet('bob', 'a3'), room: 'somewhere-else'});
        expect(received).toHaveBeenCalledTimes(1);
        expect(received.mock.calls[0][0].from).toBe('Bob');
    });

    test('messages from another tab of the same account are reported separately', async () => {
        const {service, socket} = setup();
        await service.start('Alice');
        const self = jest.fn();
        service.on('self-message', self);
        const packet = tab => ({
            room: roomForUser('alice'),
            val: {t: 'mw.handled', id: `x-${tab}`, tab},
            origin: {user_id: 'id-alice', username: 'alice'}
        });
        socket.emit('pmsg', packet(service.tabId));
        socket.emit('pmsg', packet('other-tab'));
        expect(self).toHaveBeenCalledTimes(1);
    });

    test('send resolves once Rotur acknowledges delivery', async () => {
        const {service, socket} = setup();
        await service.start('Alice');
        const pending = service.send('bob', {t: 'mw.invite', id: 'abc'});
        const packet = socket.sent.find(item => item.cmd === 'pmsg');
        expect(packet.room).toBe(roomForUser('bob'));
        expect(packet.to).toBe('bob');
        socket.emit('pmsg_ok', {listener: packet.listener});
        await expect(pending).resolves.toBe(true);
    });

    test('send gives up when Rotur never acknowledges', async () => {
        jest.useFakeTimers();
        const {service} = setup();
        await service.start('Alice');
        const pending = service.send('bob', {t: 'mw.invite', id: 'abc'});
        jest.advanceTimersByTime(5000);
        await Promise.resolve();
        jest.advanceTimersByTime(5000);
        await expect(pending).resolves.toBe(false);
        jest.useRealTimers();
    });

    test('refuses to message people who are not friends', async () => {
        const {service, socket} = setup();
        await service.start('Alice');
        await expect(service.send('mallory', {t: 'mw.invite'})).resolves.toBe(false);
        expect(socket.sent.some(item => item.cmd === 'pmsg')).toBe(false);
    });

    test('friend list changes from Rotur update the watched rooms', async () => {
        const {service, socket} = setup();
        await service.start('Alice');
        socket.emit('key_update', {key: 'sys.friends', value: ['Bob', 'erin']});
        const rooms = socket.joinedRooms();
        expect(rooms.has(roomForUser('carol'))).toBe(false);
        expect(rooms.has(roomForUser('erin'))).toBe(true);
    });

    test('signing out leaves every room', async () => {
        const {service, socket} = setup();
        await service.start('Alice');
        service.stop();
        expect(socket.joinedRooms().size).toBe(0);
        expect(service.getSnapshot().status).toBe('signed-out');
    });
});

describe('mistwarpActivity', () => {
    test('reads the MistWarp activity from array and map shapes', () => {
        const activity = {id: 'MistWarp', title: 'Editing In MistWarp', status: 'Working on Maze', url: 'u'};
        expect(mistwarpActivity([activity]).status).toBe('Working on Maze');
        expect(mistwarpActivity({MistWarp: activity}).title).toBe('Editing In MistWarp');
        expect(mistwarpActivity([{id: 'Spotify'}])).toBeNull();
    });
});
