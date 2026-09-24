import {ensureScopes, getRotur} from '../rotur/client.js';
import {CHAT_INVITE, CHAT_SOCKET, CHAT_URL, DISCORD_INVITE} from './links.js';
const CLIENT_NAME = 'mistwarp';
const HISTORY_PAGE = 50;
const MAX_MESSAGES = 400;
const TYPING_MS = 6000;
const TYPING_THROTTLE_MS = 4000;
const MAX_RETRY_MS = 30000;
const ACTIVE_CHANNEL_KEY = 'mw:chat-channel';

const initialState = () => ({
    status: 'idle',
    error: null,
    notice: null,
    server: null,
    limits: {},
    me: null,
    channels: [],
    active: null,
    messages: {},
    history: {},
    users: {},
    online: null,
    roles: {},
    emojis: {},
    referenced: {},
    capabilities: [],
    typing: {},
    unread: 0
});

const validatorKeyMatches = (key, url = CHAT_URL) => {
    const prefix = `originChats-${url}-`;
    return typeof key === 'string' && key.startsWith(prefix) && key.length > prefix.length;
};

const userKey = name => String(name || '').toLowerCase();

const isChatChannel = channel => Boolean(channel) && channel.type === 'text';

const channelName = channel => (channel && (channel.display_name || channel.name)) || '';

const LOCAL_PREFIX = 'usr:local_';

const formatUsername = name => {
    const text = String(name || '');
    return text.toLowerCase().startsWith(LOCAL_PREFIX) ? text.slice(LOCAL_PREFIX.length) : text;
};

const isProviderAccount = name => /^USR:/i.test(String(name || ''));

const isBridgedAccount = name => /^USR:discord_/i.test(String(name || ''));

const findUser = (state, name) => state.users[userKey(name)] || null;

const isRoturUser = (state, name) => {
    if (!name || isProviderAccount(name)) return false;
    const user = findUser(state, name);
    return !(user && user.cracked);
};

const userDisplayName = (state, name) => {
    const user = findUser(state, name);
    return (user && user.nickname) || formatUsername(name);
};

const messageAuthor = (state, message) => {
    if (!message) return '';
    if (message.alias && message.alias.name) return message.alias.name;
    if (message.webhook && message.webhook.name) return message.webhook.name;
    return userDisplayName(state, message.user);
};

const messageAuthorKey = message => {
    const user = userKey(message && message.user);
    if (message && message.alias && message.alias.name) return `${user}:alias:${message.alias.name}`;
    if (message && message.webhook) return `webhook:${message.webhook.id}`;
    return user;
};

const userAvatar = (state, name, serverUrl = CHAT_URL) => {
    const user = findUser(state, name);
    const stored = user && (user.pfp || user.pfp_url || (user.account && user.account.pfp));
    if (stored) return String(stored).replace(/\/+$/, '');
    if ((user && user.cracked) || isProviderAccount(name)) {
        return `${serverUrl}/avatar/${encodeURIComponent(name)}`;
    }
    return null;
};

const messageAvatar = (state, message, serverUrl = CHAT_URL) => {
    if (!message) return null;
    if (message.alias && message.alias.avatar) return message.alias.avatar;
    if (message.webhook && message.webhook.avatar) return message.webhook.avatar;
    return userAvatar(state, message.user, serverUrl);
};

const userColor = (state, name) => {
    const user = findUser(state, name);
    return (user && user.color) || null;
};

const roleById = (state, id) => Object.keys(state.roles || {})
    .map(name => ({name, ...state.roles[name]}))
    .find(role => role.id === id) || null;

const pingsMe = (state, message) => {
    const me = state.me && userKey(state.me.username);
    if (!me || !message) return null;
    const pings = message.pings || {};
    const lower = list => (Array.isArray(list) ? list : []).map(userKey);
    if (lower(pings.users).includes(me)) return 'user';
    if (Array.isArray(pings.roles) && pings.roles.length) {
        const mine = findUser(state, me);
        const myRoleIds = ((mine && mine.roles) || [])
            .map(name => state.roles[name] || state.roles[String(name).toLowerCase()])
            .filter(Boolean)
            .map(role => role.id);
        if (pings.roles.some(id => myRoleIds.includes(id))) return 'role';
    }
    if (lower(pings.replies).includes(me)) return 'reply';
    if (message.ping !== false && message.reply_to && userKey(message.reply_to.user) === me) return 'reply';
    return null;
};

const findMessage = (state, channel, id) => {
    const list = state.messages[channel] || [];
    const found = list.find(message => message.id === id);
    if (found) return found;
    const referenced = state.referenced[channel];
    return (referenced && referenced[id]) || null;
};

const parseEmojiList = value => {
    const emojis = {};
    const put = (id, item) => {
        if (!id || !item) return;
        emojis[String(id)] = {
            id: String(id),
            name: item.name || String(id),
            fileName: item.fileName || item.filename || String(id),
            assetServerUrl: item.assetServerUrl || null
        };
    };
    if (Array.isArray(value)) {
        value.forEach(item => put(item && item.id, item));
    } else if (value && typeof value === 'object') {
        Object.keys(value).forEach(id => put(id, value[id]));
    }
    return emojis;
};

const sortMessages = list => list.slice().sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

const mergeMessages = (current, incoming) => {
    const byId = new Map();
    (current || []).forEach(message => byId.set(message.id, message));
    (incoming || []).forEach(message => {
        if (message && message.id) byId.set(message.id, {...byId.get(message.id), ...message});
    });
    const merged = sortMessages(Array.from(byId.values()));
    return merged.length > MAX_MESSAGES ? merged.slice(merged.length - MAX_MESSAGES) : merged;
};

const withUser = (users, user, patch = {}) => {
    const key = userKey(user && user.username);
    if (!key) return users;
    return {...users, [key]: {...users[key], ...user, ...patch}};
};

const frameChannel = frame => frame.thread_id || frame.channel || '';

const QUIET_ERRORS = ['roles_list', 'emoji_list', 'users_online', 'message_get'];
const OPTIONAL_LOADS = ['roles_list', 'emoji_list', 'users_online'];
const REFERENCE_TTL_MS = 15000;

const pickActive = (channels, preferred) => {
    const chats = channels.filter(isChatChannel);
    const match = chats.find(channel => channel.name === preferred);
    if (match) return match.name;
    return chats.length ? chats[0].name : null;
};

const applyFrame = (state, frame) => {
    if (!frame || typeof frame !== 'object') return state;
    switch (frame.cmd) {
    case 'handshake': {
        const val = frame.val || {};
        const capabilities = Array.isArray(val.capabilities) ? val.capabilities : [];
        return {...state, server: val.server || null, limits: val.limits || {}, capabilities};
    }
    case 'roles_list':
        return {...state, roles: frame.roles || frame.val || {}};
    case 'emoji_list':
        return {...state, emojis: parseEmojiList(frame.emojis || frame.val)};
    case 'message_get': {
        if (!frame.message || !frame.message.id) return state;
        const channel = frameChannel(frame);
        const current = state.referenced[channel] || {};
        const referenced = {...current, [frame.message.id]: frame.message};
        return {...state, referenced: {...state.referenced, [channel]: referenced}};
    }
    case 'nickname_update':
    case 'nickname_remove':
    case 'user_update': {
        const name = frame.username || frame.user;
        if (!name || !state.users[userKey(name)]) return state;
        const patch = {nickname: frame.cmd === 'nickname_remove' ? null : (frame.nickname || null)};
        if (frame.pfp) patch.pfp = frame.pfp;
        return {...state, users: withUser(state.users, {username: name}, patch)};
    }
    case 'users_online': {
        const list = Array.isArray(frame.users) ? frame.users : [];
        let users = state.users;
        list.forEach(user => {
            if (!user || !user.username) return;
            const status = user.status || {};
            users = withUser(users, user, {status: {...status, status: status.status || 'online'}});
        });
        return {...state, users, online: list.map(user => userKey(user && user.username)).filter(Boolean)};
    }
    case 'ready':
        return frame.user ? {...state, me: frame.user, users: withUser(state.users, frame.user)} : state;
    case 'channels_get': {
        const channels = Array.isArray(frame.val) ? frame.val : [];
        return {...state, channels, active: pickActive(channels, state.active)};
    }
    case 'messages_get': {
        const channel = frameChannel(frame);
        const incoming = Array.isArray(frame.val) ? frame.val : [];
        return {
            ...state,
            messages: {...state.messages, [channel]: mergeMessages(state.messages[channel], incoming)},
            history: {
                ...state.history,
                [channel]: {loaded: true, loading: false, atStart: Boolean(frame.at_start) || !incoming.length}
            }
        };
    }
    case 'message_new': {
        const channel = frameChannel(frame);
        if (!frame.message) return state;
        const author = userKey(frame.message.user);
        const typing = state.typing[channel];
        let nextTyping = state.typing;
        if (typing && typing[author]) {
            const remaining = {...typing};
            delete remaining[author];
            nextTyping = {...state.typing, [channel]: remaining};
        }
        return {
            ...state,
            typing: nextTyping,
            messages: {...state.messages, [channel]: mergeMessages(state.messages[channel], [frame.message])}
        };
    }
    case 'message_edit': {
        const channel = frameChannel(frame);
        const list = state.messages[channel];
        const id = frame.id || (frame.message && frame.message.id);
        if (!list || !id || !list.some(message => message.id === id)) return state;
        return {
            ...state,
            messages: {
                ...state.messages,
                [channel]: list.map(message => (message.id === id ? {...message, ...frame.message} : message))
            }
        };
    }
    case 'message_delete': {
        const channel = frameChannel(frame);
        const list = state.messages[channel];
        if (!list) return state;
        const remaining = list.filter(message => message.id !== frame.id);
        return {...state, messages: {...state.messages, [channel]: remaining}};
    }
    case 'users_list': {
        const list = Array.isArray(frame.users) ? frame.users : [];
        const users = {};
        list.forEach(user => {
            if (user && user.username) users[userKey(user.username)] = user;
        });
        return {...state, users};
    }
    case 'user_join':
    case 'user_connect': {
        if (!frame.user) return state;
        const status = frame.user.status || {};
        const users = withUser(state.users, frame.user, {status: {...status, status: status.status || 'online'}});
        const key = userKey(frame.user.username);
        const online = state.online && !state.online.includes(key) ? [...state.online, key] : state.online;
        return {...state, users, online};
    }
    case 'user_disconnect': {
        const user = frame.user || (frame.username ? {username: frame.username} : null);
        if (!user) return state;
        const key = userKey(user.username);
        const online = state.online ? state.online.filter(name => name !== key) : null;
        return {...state, online, users: withUser(state.users, user, {status: {status: 'offline'}})};
    }
    case 'user_leave': {
        const key = userKey(frame.username);
        if (!key || !state.users[key]) return state;
        const users = {...state.users};
        delete users[key];
        return {...state, users};
    }
    case 'typing': {
        const channel = frameChannel(frame);
        const key = userKey(frame.user);
        if (!key || (state.me && userKey(state.me.username) === key)) return state;
        const current = {...state.typing[channel]};
        if (frame.duration === 0) {
            delete current[key];
        } else {
            current[key] = {name: frame.nickname || frame.user, until: Date.now() + (frame.duration || TYPING_MS)};
        }
        return {...state, typing: {...state.typing, [channel]: current}};
    }
    case 'rate_limit':
        return {...state, notice: {kind: 'rate_limit', length: frame.length || 0, cooldown: frame.cooldown || 0}};
    case 'error':
        if (frame.src === 'messages_get') {
            const channel = frameChannel(frame) || state.active;
            return {
                ...state,
                history: {...state.history, [channel]: {...state.history[channel], loading: false}},
                notice: {kind: 'error', text: frame.val}
            };
        }
        if (QUIET_ERRORS.includes(frame.src)) return state;
        return frame.src && frame.src !== 'typing' ? {...state, notice: {kind: 'error', text: frame.val}} : state;
    default:
        return state;
    }
};

const activeTyping = (state, channel, now = Date.now()) => Object.values(state.typing[channel] || {})
    .filter(entry => entry.until > now)
    .map(entry => entry.name);

const onlineUsers = state => Object.values(state.users)
    .filter(user => {
        if (state.online) return state.online.includes(userKey(user.username));
        return user.status && user.status.status && user.status.status !== 'offline';
    })
    .filter(user => !user.status || !['offline', 'invisible'].includes(user.status.status))
    .sort((a, b) => userKey(a.username).localeCompare(userKey(b.username)));

const readStoredChannel = () => {
    try {
        return localStorage.getItem(ACTIVE_CHANNEL_KEY);
    } catch (e) {
        return null;
    }
};

const storeChannel = name => {
    try {
        localStorage.setItem(ACTIVE_CHANNEL_KEY, name);
    } catch (e) {
        return null;
    }
};

const requestValidator = async key => {
    await ensureScopes(['validators:generate']);
    const client = getRotur();
    if (!client.loggedIn) {
        const error = new Error('Sign in with Rotur to chat.');
        error.code = 'signed_out';
        throw error;
    }
    const data = await client.validators.generate(key);
    if (!data || !data.validator) {
        throw new Error((data && data.error) || 'Could not verify your Rotur account for chat.');
    }
    return data.validator;
};

class ChatConnection {
    constructor ({socketUrl = CHAT_SOCKET, serverUrl = CHAT_URL, WebSocketImpl, getValidator = requestValidator} = {}) {
        this.socketUrl = socketUrl;
        this.serverUrl = serverUrl;
        this.WebSocketImpl = WebSocketImpl;
        this.getValidator = getValidator;
        this.state = {...initialState(), active: readStoredChannel()};
        this.listeners = new Set();
        this.socket = null;
        this.generation = 0;
        this.retries = 0;
        this.retryTimer = null;
        this.typingSentAt = 0;
        this.listenerId = 0;
        this.viewing = false;
        this.pendingReferences = new Map();
    }

    setViewing (viewing) {
        this.viewing = viewing;
        if (viewing && this.state.unread) this.patch({unread: 0});
    }

    subscribe (listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    getState () {
        return this.state;
    }

    setState (next) {
        if (next === this.state) return;
        this.state = next;
        this.listeners.forEach(listener => listener(next));
    }

    patch (values) {
        this.setState({...this.state, ...values});
    }

    connect () {
        if (this.socket) return;
        clearTimeout(this.retryTimer);
        const generation = ++this.generation;
        const Impl = this.WebSocketImpl || window.WebSocket;
        const socket = new Impl(this.socketUrl);
        this.socket = socket;
        this.patch({status: this.retries ? 'reconnecting' : 'connecting', error: null});
        socket.onmessage = event => {
            if (generation !== this.generation) return;
            let frame;
            try {
                frame = JSON.parse(event.data);
            } catch (e) {
                return;
            }
            this.handleFrame(frame, generation);
        };
        socket.onclose = () => {
            if (generation !== this.generation) return;
            this.socket = null;
            if (this.state.status === 'error' || this.state.status === 'signed_out') return;
            this.scheduleReconnect();
        };
    }

    scheduleReconnect () {
        const delay = Math.min(MAX_RETRY_MS, 1000 * (2 ** this.retries));
        this.retries += 1;
        this.patch({status: 'reconnecting'});
        this.retryTimer = setTimeout(() => this.connect(), delay);
    }

    disconnect () {
        clearTimeout(this.retryTimer);
        this.generation += 1;
        this.retries = 0;
        const socket = this.socket;
        this.socket = null;
        if (socket) socket.close();
        this.setState({...initialState(), active: this.state.active});
    }

    reconnect () {
        this.disconnect();
        this.connect();
    }

    send (frame) {
        if (!this.socket || this.socket.readyState !== 1) return false;
        this.socket.send(JSON.stringify(frame));
        return true;
    }

    async authenticate (key, generation) {
        if (!validatorKeyMatches(key, this.serverUrl)) {
            this.fail('This chat server did not identify itself correctly.');
            return;
        }
        this.patch({status: 'authenticating'});
        try {
            const validator = await this.getValidator(key);
            if (generation !== this.generation) return;
            this.send({cmd: 'auth', validator, client: CLIENT_NAME});
        } catch (error) {
            if (generation !== this.generation) return;
            if (error.code === 'signed_out') {
                this.patch({status: 'signed_out'});
                if (this.socket) this.socket.close();
                return;
            }
            this.fail(error.message);
        }
    }

    fail (message) {
        this.patch({status: 'error', error: message});
        if (this.socket) this.socket.close();
    }

    handleFrame (frame, generation) {
        const next = applyFrame(this.state, frame);
        const fromOther = frame.cmd === 'message_new' && !frame.listener && frame.message &&
            !(next.me && userKey(next.me.username) === userKey(frame.message.user));
        this.setState(fromOther && !this.viewing ? {...next, unread: next.unread + 1} : next);
        switch (frame.cmd) {
        case 'handshake':
            this.authenticate(frame.val && frame.val.validator_key, generation);
            break;
        case 'auth_error':
            this.fail(frame.val || 'Chat sign in failed.');
            break;
        case 'ready':
            this.retries = 0;
            this.patch({status: 'ready'});
            this.send({cmd: 'channels_get'});
            this.send({cmd: 'users_list'});
            OPTIONAL_LOADS.filter(cmd => this.state.capabilities.includes(cmd)).forEach(cmd => this.send({cmd}));
            break;
        case 'channels_get':
            if (this.state.active) this.loadHistory(this.state.active);
            break;
        default:
            break;
        }
    }

    loadHistory (channel) {
        const history = this.state.history[channel];
        if (history && (history.loaded || history.loading)) return;
        this.requestHistory(channel, 0);
    }

    loadOlder (channel) {
        const history = this.state.history[channel];
        const list = this.state.messages[channel];
        if (!history || history.loading || history.atStart || !list || !list.length) return;
        this.requestHistory(channel, list[0].id);
    }

    requestHistory (channel, start) {
        this.patch({history: {...this.state.history, [channel]: {...this.state.history[channel], loading: true}}});
        this.send({cmd: 'messages_get', channel, start, limit: HISTORY_PAGE});
    }

    fetchMessage (channel, id) {
        if (!channel || !id || findMessage(this.state, channel, id)) return false;
        if (this.state.capabilities.length && !this.state.capabilities.includes('message_get')) return false;
        const key = `${channel}/${id}`;
        const now = Date.now();
        const requested = this.pendingReferences.get(key);
        if (requested && now - requested < REFERENCE_TTL_MS) return false;
        this.pendingReferences.set(key, now);
        return this.send({cmd: 'message_get', channel, id});
    }

    selectChannel (name) {
        if (!this.state.channels.some(channel => channel.name === name && isChatChannel(channel))) return;
        storeChannel(name);
        this.patch({active: name, notice: null});
        this.loadHistory(name);
    }

    sendMessage (channel, content, replyTo) {
        const text = String(content || '').trim();
        if (!text) return false;
        this.typingSentAt = 0;
        this.listenerId += 1;
        return this.send({
            cmd: 'message_new',
            channel,
            content: text,
            ...(replyTo ? {reply_to: replyTo} : {}),
            listener: `mw-send-${this.listenerId}`
        });
    }

    sendTyping (channel) {
        const now = Date.now();
        if (now - this.typingSentAt < TYPING_THROTTLE_MS) return;
        this.typingSentAt = now;
        this.send({cmd: 'typing', channel, duration: TYPING_MS});
    }

    clearNotice () {
        if (this.state.notice) this.patch({notice: null});
    }
}

const fetchServerInfo = async (url = CHAT_URL) => {
    const response = await fetch(`${url}/info`);
    if (!response.ok) throw new Error(`Chat server unavailable (${response.status})`);
    return response.json();
};

let shared = null;
const getChatConnection = () => {
    if (!shared) shared = new ChatConnection();
    return shared;
};

export {
    CHAT_INVITE,
    CHAT_URL,
    DISCORD_INVITE,
    ChatConnection,
    activeTyping,
    applyFrame,
    channelName,
    fetchServerInfo,
    findMessage,
    findUser,
    formatUsername,
    getChatConnection,
    initialState,
    isBridgedAccount,
    isChatChannel,
    isProviderAccount,
    isRoturUser,
    mergeMessages,
    messageAuthor,
    messageAuthorKey,
    messageAvatar,
    onlineUsers,
    pingsMe,
    roleById,
    userAvatar,
    userColor,
    userDisplayName,
    userKey,
    validatorKeyMatches
};
