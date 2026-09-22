import Emitter from '../collaboration/emitter.js';
import {ensureScopes, ensureSocket, getRotur, hasScopes} from './client.js';
import {formatActivityTitle, getRoturSettings, setRoturSetting, subscribeRoturSettings} from './settings.js';

const FRIEND_SCOPES = ['friends:view', 'friends:request', 'friends:accept'];
const ROOM_PREFIX = 'mistwarp.friend.';
const MAX_WATCHED_FRIENDS = 150;
const ACK_TIMEOUT = 4000;
const MESSAGE_PREFIX = 'mw.';
const SEEN_LIMIT = 200;

const normalizeName = name => String(name || '').trim()
    .toLowerCase();

const roomForUser = username => {
    const name = normalizeName(username);
    return /^[a-z0-9_.-]{1,40}$/.test(name) ? `${ROOM_PREFIX}${name}` : null;
};

const ownerOfRoom = room => (
    typeof room === 'string' && room.startsWith(ROOM_PREFIX) ? room.slice(ROOM_PREFIX.length) : null
);

const activityList = activities => {
    if (Array.isArray(activities)) return activities;
    if (activities && typeof activities === 'object') return Object.values(activities);
    return [];
};

const mistwarpActivity = activities => {
    const found = activityList(activities).find(activity => activity && activity.id === 'MistWarp');
    if (!found) return null;
    const title = typeof found.title === 'string' ? found.title : '';
    return {
        title,
        collaborating: title === formatActivityTitle({collaborating: true}),
        status: typeof found.status === 'string' ? found.status : '',
        url: typeof found.url === 'string' ? found.url : ''
    };
};

const createTabId = () => {
    const bytes = new Uint8Array(8);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(bytes);
    } else {
        for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
};

const defaultDependencies = {
    getRotur,
    ensureSocket,
    ensureScopes,
    hasScopes,
    getSettings: getRoturSettings,
    setSetting: setRoturSetting,
    subscribeSettings: subscribeRoturSettings
};

class FriendsService extends Emitter {
    constructor (dependencies = defaultDependencies) {
        super();
        this.deps = {...defaultDependencies, ...dependencies};
        this.tabId = createTabId();
        this.username = null;
        this.status = 'signed-out';
        this.error = '';
        this.friends = new Map();
        this.requests = [];
        this.online = new Map();
        this.joined = new Set();
        this.socket = null;
        this.socketOff = [];
        this.pendingAcks = new Map();
        this.seen = [];
        this.generation = 0;
        this.ackCounter = 0;
        this.snapshot = null;
        this.unsubscribeSettings = this.deps.subscribeSettings(() => this.syncRooms());
    }

    get visible () {
        return this.deps.getSettings().friendsVisible !== false;
    }

    getSnapshot () {
        if (this.snapshot) return this.snapshot;
        const onlineByName = new Map();
        for (const entry of this.online.values()) {
            onlineByName.set(normalizeName(entry.username), entry);
        }
        const friends = Array.from(this.friends.values()).map(username => {
            const entry = onlineByName.get(normalizeName(username));
            return {
                username,
                online: Boolean(entry),
                presence: entry ? entry.presence : 'offline',
                activity: entry ? entry.activity : null
            };
        })
            .sort((a, b) => (Number(b.online) - Number(a.online)) ||
                a.username.toLowerCase().localeCompare(b.username.toLowerCase()));
        this.snapshot = {
            status: this.status,
            error: this.error,
            username: this.username,
            visible: this.visible,
            friends,
            onlineCount: friends.filter(friend => friend.online).length,
            requests: this.requests.slice()
        };
        return this.snapshot;
    }

    changed () {
        this.snapshot = null;
        this.emit('change', this.getSnapshot());
    }

    subscribe (listener) {
        this.on('change', listener);
        return () => this.off('change', listener);
    }

    setStatus (status, error = '') {
        this.status = status;
        this.error = error;
        this.changed();
    }

    isFriend (username) {
        return this.friends.has(normalizeName(username));
    }

    isOnline (username) {
        const name = normalizeName(username);
        for (const entry of this.online.values()) {
            if (normalizeName(entry.username) === name) return true;
        }
        return false;
    }

    async start (username) {
        const name = username || null;
        if (name === this.username && this.status !== 'signed-out') return;
        this.stop();
        if (!name) return;
        this.username = name;
        const generation = this.generation;
        this.setStatus('checking');
        const granted = await this.deps.hasScopes(FRIEND_SCOPES);
        if (generation !== this.generation) return;
        if (!granted) {
            this.setStatus('needs-consent');
            return;
        }
        await this.load(generation);
    }

    stop () {
        this.generation++;
        this.leaveAll();
        this.detachSocket();
        for (const {resolve, timer} of this.pendingAcks.values()) {
            clearTimeout(timer);
            resolve(false);
        }
        this.pendingAcks.clear();
        this.friends.clear();
        this.online.clear();
        this.requests = [];
        this.seen = [];
        this.username = null;
        this.setStatus('signed-out');
    }

    async connect () {
        if (!this.username) return;
        const generation = this.generation;
        this.setStatus('connecting');
        try {
            await this.deps.ensureScopes(FRIEND_SCOPES);
        } catch (error) {
            if (generation === this.generation) {
                this.setStatus('needs-consent', 'Rotur did not share your friends list. Try again.');
            }
            return;
        }
        if (generation !== this.generation) return;
        if (!(await this.deps.hasScopes(FRIEND_SCOPES))) {
            if (generation === this.generation) {
                this.setStatus('needs-consent', 'Rotur did not share your friends list. Try again.');
            }
            return;
        }
        await this.load(generation);
    }

    async load (generation = this.generation) {
        const rotur = this.deps.getRotur();
        try {
            const [friendsResult, requestsResult] = await Promise.all([
                rotur.friends.list(),
                rotur.me.requests()
            ]);
            if (generation !== this.generation) return;
            if (!friendsResult || friendsResult.error) {
                throw new Error((friendsResult && friendsResult.error) || 'Could not load friends');
            }
            this.setFriends(friendsResult.friends);
            this.requests = Array.isArray(requestsResult && requestsResult.requests) ?
                requestsResult.requests.filter(name => typeof name === 'string') : [];
        } catch (error) {
            if (generation === this.generation) {
                this.setStatus('error', 'Could not load your friends. Check your connection and try again.');
            }
            return;
        }
        const connected = await this.deps.ensureSocket();
        if (generation !== this.generation) return;
        if (connected) this.attachSocket(rotur.socket);
        this.setStatus('ready');
        this.syncRooms();
    }

    setFriends (list) {
        this.friends.clear();
        for (const username of Array.isArray(list) ? list : []) {
            if (typeof username === 'string' && username) this.friends.set(normalizeName(username), username);
        }
        for (const [userId, entry] of this.online) {
            if (!this.isFriend(entry.username)) this.online.delete(userId);
        }
    }

    attachSocket (socket) {
        if (!socket || socket === this.socket) return;
        this.detachSocket();
        this.socket = socket;
        const handlers = {
            ready: () => {
                this.joined.clear();
                this.online.clear();
                this.syncRooms();
                this.changed();
            },
            join_ok: message => this.joined.add(message.room),
            leave_ok: message => this.joined.delete(message.room),
            room_state: message => this.handleRoomState(message),
            member_join: message => this.handleMemberJoin(message),
            member_leave: message => this.handleMemberLeave(message),
            status_update: message => this.handleStatusUpdate(message),
            pmsg: message => this.handlePrivateMessage(message),
            pmsg_ok: message => this.resolveAck(message.listener, true),
            key_update: message => this.handleKeyUpdate(message)
        };
        for (const [command, handler] of Object.entries(handlers)) {
            this.socketOff.push(socket.on(command, handler));
        }
    }

    detachSocket () {
        for (const off of this.socketOff) {
            if (typeof off === 'function') off();
        }
        this.socketOff = [];
        this.socket = null;
    }

    desiredRooms () {
        const rooms = [];
        if (this.visible) {
            const own = roomForUser(this.username);
            if (own) rooms.push(own);
        }
        for (const name of Array.from(this.friends.keys()).slice(0, MAX_WATCHED_FRIENDS)) {
            const room = roomForUser(name);
            if (room) rooms.push(room);
        }
        return new Set(rooms);
    }

    syncRooms () {
        const socket = this.socket;
        if (!socket || !socket.connected || this.status !== 'ready') {
            this.changed();
            return;
        }
        const desired = this.desiredRooms();
        for (const room of Array.from(this.joined)) {
            if (!desired.has(room)) {
                socket.leave(room);
                this.joined.delete(room);
                const owner = ownerOfRoom(room);
                for (const [userId, entry] of this.online) {
                    if (normalizeName(entry.username) === owner) this.online.delete(userId);
                }
            }
        }
        for (const room of desired) {
            if (!this.joined.has(room)) {
                this.joined.add(room);
                socket.join(room);
            }
        }
        this.changed();
    }

    leaveAll () {
        if (this.socket && this.socket.connected && this.joined.size) {
            for (const room of this.joined) this.socket.leave(room);
        }
        this.joined.clear();
    }

    isOwnRoom (room) {
        return ownerOfRoom(room) === normalizeName(this.username);
    }

    trackMember (room, member) {
        const owner = ownerOfRoom(room);
        if (!owner || !member || owner !== normalizeName(member.username)) return false;
        if (owner === normalizeName(this.username) || !this.isFriend(owner)) return false;
        this.online.set(String(member.user_id), {
            username: this.friends.get(owner) || member.username,
            presence: member.presence || 'online',
            status: member.status || '',
            activity: mistwarpActivity(member.activities)
        });
        return true;
    }

    handleRoomState (message) {
        if (!message || !this.joined.has(message.room) || this.isOwnRoom(message.room)) return;
        let changed = false;
        for (const member of Array.isArray(message.members) ? message.members : []) {
            changed = this.trackMember(message.room, member) || changed;
        }
        if (changed) this.changed();
    }

    handleMemberJoin (message) {
        if (message && this.joined.has(message.room) && this.trackMember(message.room, message)) this.changed();
    }

    handleMemberLeave (message) {
        if (!message || !this.joined.has(message.room)) return;
        const entry = this.online.get(String(message.user_id));
        if (entry && normalizeName(entry.username) === ownerOfRoom(message.room)) {
            this.online.delete(String(message.user_id));
            this.changed();
        }
    }

    handleStatusUpdate (message) {
        const entry = message && this.online.get(String(message.user_id));
        if (!entry) return;
        if (message.presence === 'offline' || message.presence === 'invisible') {
            this.online.delete(String(message.user_id));
        } else {
            this.online.set(String(message.user_id), {
                ...entry,
                presence: message.presence || entry.presence,
                status: typeof message.status === 'string' ? message.status : entry.status,
                activity: 'activities' in message ? mistwarpActivity(message.activities) : entry.activity
            });
        }
        this.changed();
    }

    handleKeyUpdate (message) {
        if (!message) return;
        if (message.key === 'sys.friends') {
            this.setFriends(message.value);
            this.syncRooms();
        } else if (message.key === 'sys.requests') {
            this.requests = Array.isArray(message.value) ? message.value.filter(name => typeof name === 'string') : [];
            this.changed();
        }
    }

    remember (key) {
        if (this.seen.includes(key)) return false;
        this.seen.push(key);
        if (this.seen.length > SEEN_LIMIT) this.seen.shift();
        return true;
    }

    handlePrivateMessage (message) {
        if (!message || !this.joined.has(message.room)) return;
        const value = message.val;
        const from = message.origin && message.origin.username;
        if (!value || typeof value !== 'object' || typeof value.t !== 'string' ||
            !value.t.startsWith(MESSAGE_PREFIX) || typeof from !== 'string') return;
        if (!this.remember(`${normalizeName(from)}:${value.t}:${value.id}`)) return;
        if (normalizeName(from) === normalizeName(this.username)) {
            if (value.tab !== this.tabId) this.emit('self-message', value);
            return;
        }
        if (!this.isFriend(from)) return;
        this.emit('message', {from: this.friends.get(normalizeName(from)) || from, message: value});
    }

    resolveAck (listener, delivered) {
        const pending = this.pendingAcks.get(listener);
        if (!pending) return;
        clearTimeout(pending.timer);
        this.pendingAcks.delete(listener);
        pending.resolve(delivered);
    }

    sendInRoom (room, to, message) {
        const socket = this.socket;
        if (!socket || !socket.connected || !this.joined.has(room)) return Promise.resolve(false);
        const listener = `mw-friends-${++this.ackCounter}`;
        return new Promise(resolve => {
            const timer = setTimeout(() => this.resolveAck(listener, false), ACK_TIMEOUT);
            this.pendingAcks.set(listener, {resolve, timer});
            socket.sendPrivateMessage(room, to, message, listener);
        });
    }

    async send (username, message) {
        if (!this.isFriend(username)) return false;
        const rooms = [roomForUser(username), roomForUser(this.username)]
            .filter(room => room && this.joined.has(room));
        for (const room of rooms) {
            if (await this.sendInRoom(room, username, message)) return true;
        }
        return false;
    }

    sendToOwnTabs (message) {
        const room = roomForUser(this.username);
        if (!room || !this.joined.has(room)) return Promise.resolve(false);
        return this.sendInRoom(room, this.username, {...message, tab: this.tabId});
    }

    setVisible (visible) {
        this.deps.setSetting('friendsVisible', Boolean(visible));
    }

    async runFriendAction (action, username) {
        const rotur = this.deps.getRotur();
        const result = await rotur.friends[action](username);
        if (result && result.error) throw new Error(result.error);
        await this.refresh();
        return result;
    }

    acceptRequest (username) {
        return this.runFriendAction('accept', username);
    }

    declineRequest (username) {
        return this.runFriendAction('reject', username);
    }

    addFriend (username) {
        return this.runFriendAction('request', username);
    }

    async refresh () {
        if (this.status !== 'ready' && this.status !== 'error') return;
        const generation = this.generation;
        const rotur = this.deps.getRotur();
        try {
            const [friendsResult, requestsResult] = await Promise.all([
                rotur.friends.list(),
                rotur.me.requests()
            ]);
            if (generation !== this.generation) return;
            if (friendsResult && !friendsResult.error) this.setFriends(friendsResult.friends);
            if (requestsResult && Array.isArray(requestsResult.requests)) this.requests = requestsResult.requests;
            if (this.status === 'error') {
                await this.load(generation);
                return;
            }
            this.syncRooms();
        } catch (_) {
            this.changed();
        }
    }
}

let instance = null;

const getFriendsService = () => {
    if (!instance) instance = new FriendsService();
    return instance;
};

export {
    FRIEND_SCOPES,
    FriendsService,
    getFriendsService,
    mistwarpActivity,
    roomForUser
};
