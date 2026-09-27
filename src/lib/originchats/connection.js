import {ensureScopes, getRotur} from '../rotur/client.js';
import {SIGNING_CAPABILITY, requestSigningPermission, signMessage, signingStatus} from './signing.js';
import {
    CHAT_INVITE,
    CHAT_SOCKET,
    CHAT_URL,
    DISCORD_INVITE,
    DMS_SIGNING_URLS,
    DMS_SOCKET,
    DMS_URL
} from './links.js';
const CLIENT_NAME = 'mistwarp';
const HISTORY_PAGE = 50;
const MAX_MESSAGES = 400;
const TYPING_MS = 6000;
const TYPING_THROTTLE_MS = 4000;
const MAX_RETRY_MS = 30000;
const ACTIVE_CHANNEL_KEY = 'mw:chat-channel';
const ACCESS_REASONS = [
    'banned',
    'invite_required',
    'invite_invalid',
    'invite_expired',
    'password_required',
    'password_incorrect',
    'application_required',
    'application_pending',
    'not_whitelisted'
];

const initialState = (direct = false) => ({
    direct,
    status: 'idle',
    membership: 'unknown',
    denied: null,
    error: null,
    notice: null,
    server: null,
    limits: {},
    attachments: null,
    signingUrl: null,
    clockOffset: 0,
    signing: 'unknown',
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
    unread: 0,
    channelUnread: {}
});

const validatorKeyMatches = (key, urls = CHAT_URL) => [].concat(urls).some(url => {
    const prefix = `originChats-${url}-`;
    return typeof key === 'string' && key.startsWith(prefix) && key.length > prefix.length;
});

const userKey = name => String(name || '').toLowerCase();

const isChatChannel = channel => Boolean(channel) && (channel.type === 'text' || channel.type === 'chat') &&
    channel.name !== 'cmds';

const channelName = channel => (channel && (channel.display_name || channel.name)) || '';

const LOCAL_PREFIX = 'usr:local_';

const formatUsername = name => {
    const text = String(name || '');
    return text.toLowerCase().startsWith(LOCAL_PREFIX) ? text.slice(LOCAL_PREFIX.length) : text;
};

const isProviderAccount = name => /^USR:/i.test(String(name || ''));

const isBridgedAccount = name => /^USR:discord_/i.test(String(name || ''));

const providerName = name => {
    const match = /^USR:([a-z0-9]+)_/i.exec(String(name || ''));
    return match ? match[1].toLowerCase() : null;
};

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

const knownDisplayName = (state, name, fallback) => {
    const user = findUser(state, name);
    if (user && user.nickname) return user.nickname;
    if (fallback && fallback !== name) return fallback;
    return isProviderAccount(name) ? null : formatUsername(name);
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

const CHANNEL_DEFAULTS = {
    send: ['user'],
    edit_own: ['user'],
    edit: ['owner'],
    delete_own: ['user'],
    delete: ['owner', 'admin'],
    react: ['user'],
    pin: ['owner', 'admin', 'moderator']
};

const canInChannel = (state, channelId, action) => {
    const me = state.me && state.me.username;
    if (!me) return false;
    const user = findUser(state, me) || {};
    const roles = [].concat(user.roles || state.me.roles || []).map(String);
    if (roles.includes('owner')) return true;
    const channel = state.channels.find(item => item.name === channelId);
    const set = channel && channel.permissions && channel.permissions[action];
    const rules = Array.isArray(set) ? set : (CHANNEL_DEFAULTS[action] || []);
    const name = userKey(me);
    const matches = entry => roles.includes(entry) || entry.toLowerCase() === name;
    if (rules.some(entry => entry.startsWith('!') && matches(entry.slice(1)))) return false;
    const allowed = rules.filter(entry => !entry.startsWith('!'));
    return !allowed.length || allowed.some(entry => entry === 'user' || matches(entry));
};

const canDeleteMessage = (state, channelId, message) => {
    if (!message || !state.me) return false;
    const own = !message.webhook && userKey(message.user) === userKey(state.me.username);
    return canInChannel(state, channelId, 'delete') || (own && canInChannel(state, channelId, 'delete_own'));
};

const canEditMessage = (state, channelId, message) => {
    if (!message || !state.me || message.webhook) return false;
    return userKey(message.user) === userKey(state.me.username) && canInChannel(state, channelId, 'edit_own');
};

const hasCapability = (state, name) => !state.capabilities.length || state.capabilities.includes(name);

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

const pickActive = (channels, preferred, direct) => {
    const chats = channels.filter(isChatChannel);
    const match = chats.find(channel => channel.name === preferred);
    if (match) return match.name;
    if (direct) return null;
    return chats.length ? chats[0].name : null;
};

const withReaction = (message, emoji, user, add) => {
    const reactions = {...(message.reactions || {})};
    const key = userKey(user);
    const current = (reactions[emoji] || []).filter(name => userKey(name) !== key);
    if (add) current.push(user);
    if (current.length) reactions[emoji] = current;
    else delete reactions[emoji];
    return {...message, reactions};
};

const updateMessage = (state, channel, id, update) => {
    const list = state.messages[channel];
    if (!list || !id || !list.some(message => message.id === id)) return state;
    return {
        ...state,
        messages: {...state.messages, [channel]: list.map(message => (message.id === id ? update(message) : message))}
    };
};

const touchChannel = (channels, name, message) => {
    if (!channels.some(channel => channel.name === name)) return channels;
    return channels.map(channel => (channel.name === name ? {
        ...channel,
        last_message: message.timestamp || channel.last_message,
        last_message_id: message.id || channel.last_message_id
    } : channel));
};

const applyFrame = (state, frame) => {
    if (!frame || typeof frame !== 'object') return state;
    switch (frame.cmd) {
    case 'handshake': {
        const val = frame.val || {};
        const capabilities = Array.isArray(val.capabilities) ? val.capabilities : [];
        return {
            ...state,
            server: val.server || null,
            limits: val.limits || {},
            attachments: val.attachments || null,
            signingUrl: val.signing_url || null,
            clockOffset: Number.isFinite(Number(val.server_time)) ? Number(val.server_time) - (Date.now() / 1000) : 0,
            capabilities
        };
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
        return {...state, channels, active: pickActive(channels, state.active, state.direct)};
    }
    case 'channel_delete':
    case 'user_leave': {
        if (frame.cmd === 'user_leave' && !frame.left) {
            const key = userKey(frame.username);
            if (!key || !state.users[key]) return state;
            const users = {...state.users};
            delete users[key];
            return {...state, users};
        }
        const gone = typeof frame.channel === 'string' ? frame.channel : null;
        if (!gone) return state;
        return {
            ...state,
            channels: state.channels.filter(channel => channel.name !== gone),
            active: state.active === gone ? null : state.active
        };
    }
    case 'channel_create':
    case 'channel_update':
    case 'channel_kick': {
        const channel = frame.channel;
        if (!channel || typeof channel !== 'object' || !channel.name) return state;
        const channels = state.channels.some(item => item.name === channel.name) ?
            state.channels.map(item => (item.name === channel.name ? {...item, ...channel} : item)) :
            [...state.channels, channel];
        return {...state, channels};
    }
    case 'messages_get': {
        const channel = frameChannel(frame);
        let incoming = [];
        if (Array.isArray(frame.val)) incoming = frame.val;
        else if (Array.isArray(frame.messages)) incoming = frame.messages;
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
            channels: touchChannel(state.channels, channel, frame.message),
            messages: {...state.messages, [channel]: mergeMessages(state.messages[channel], [frame.message])}
        };
    }
    case 'message_edit': {
        const id = frame.id || (frame.message && frame.message.id);
        const patch = frame.message || (typeof frame.content === 'string' ? {content: frame.content} : null);
        if (!patch) return state;
        return updateMessage(state, frameChannel(frame), id, message => ({...message, ...patch, pendingEdit: false}));
    }
    case 'message_pin':
    case 'message_unpin': {
        const pinned = typeof frame.pinned === 'boolean' ? frame.pinned : frame.cmd === 'message_pin';
        const channel = frameChannel(frame) || Object.keys(state.messages)
            .find(name => state.messages[name].some(message => message.id === frame.id));
        return updateMessage(state, channel, frame.id, message => ({...message, pinned}));
    }
    case 'reaction_add':
    case 'message_react_add':
    case 'reaction_remove':
    case 'message_react_remove': {
        if (!frame.emoji || !frame.from) return state;
        const add = frame.cmd === 'reaction_add' || frame.cmd === 'message_react_add';
        return updateMessage(state, frameChannel(frame), frame.id,
            message => withReaction(message, frame.emoji, frame.from, add));
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
    case 'typing': {
        const channel = frameChannel(frame);
        const key = userKey(frame.user);
        if (!key || (state.me && userKey(state.me.username) === key)) return state;
        const current = {...state.typing[channel]};
        if (frame.duration === 0) {
            delete current[key];
        } else {
            const until = Date.now() + (frame.duration || TYPING_MS);
            current[key] = {user: frame.user, name: frame.nickname || null, until};
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
    .map(entry => ({
        user: entry.user,
        name: knownDisplayName(state, entry.user, entry.name),
        provider: providerName(entry.user)
    }));

const onlineUsers = state => Object.values(state.users)
    .filter(user => {
        if (state.online) return state.online.includes(userKey(user.username));
        return user.status && user.status.status && user.status.status !== 'offline';
    })
    .filter(user => !user.status || !['offline', 'invisible'].includes(user.status.status))
    .sort((a, b) => userKey(a.username).localeCompare(userKey(b.username)));

const readStoredChannel = key => {
    if (!key) return null;
    try {
        return localStorage.getItem(key);
    } catch (e) {
        return null;
    }
};

const storeChannel = (key, name) => {
    if (!key) return null;
    try {
        localStorage.setItem(key, name);
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

const makeListener = () => {
    const random = window.crypto && typeof window.crypto.randomUUID === 'function' ?
        window.crypto.randomUUID() :
        `${Date.now().toString(36)}-${Math.random().toString(36)
            .slice(2)}${Math.random().toString(36)
            .slice(2)}`;
    return `mw-${random}`;
};

const normalizeInvite = code => String(code || '')
    .trim()
    .toUpperCase();

const directPeer = channel => {
    if (!channel || channel.members) return null;
    const match = /^Direct message with (.+)$/i.exec(String(channel.description || ''));
    return (match && match[1]) || channel.display_name || null;
};

const isGroupChannel = channel => Boolean(channel) && (Array.isArray(channel.members) || Boolean(channel.owner));

const groupMembers = channel => (channel && Array.isArray(channel.members) ? channel.members.filter(Boolean) : []);

const findDirectChannel = (channels, name) => channels.find(channel => isChatChannel(channel) &&
    userKey(directPeer(channel)) === userKey(name));

const defaultSigner = {
    status: signingStatus,
    sign: signMessage,
    request: requestSigningPermission
};

const typeAllowed = (allowed, type) => {
    if (!Array.isArray(allowed) || !allowed.length) return true;
    const mime = String(type || '').toLowerCase();
    return allowed.some(pattern => {
        const rule = String(pattern).toLowerCase();
        if (rule === '*' || rule === '*/*') return true;
        if (rule.endsWith('/*')) return mime.startsWith(rule.slice(0, -1));
        return rule === mime;
    });
};

const uploadProblem = (state, file) => {
    const settings = state.attachments;
    if (settings && settings.enabled === false) return {code: 'disabled'};
    const max = settings && Number(settings.max_size);
    if (max > 0 && file.size > max) return {code: 'too_large', max};
    if (settings && !typeAllowed(settings.allowed_types, file.type || 'application/octet-stream')) {
        return {code: 'type'};
    }
    return null;
};

const httpOrigin = url => {
    try {
        const parsed = new URL(url);
        if (parsed.protocol === 'wss:') parsed.protocol = 'https:';
        else if (parsed.protocol === 'ws:') parsed.protocol = 'http:';
        return /^https?:$/.test(parsed.protocol) ? parsed.origin : null;
    } catch (e) {
        return null;
    }
};

const postUpload = (url, form, onProgress, signal) => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.upload.onprogress = event => {
        if (event.lengthComputable && onProgress) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
        let data = null;
        try {
            data = JSON.parse(xhr.responseText);
        } catch (e) {
            data = null;
        }
        if (xhr.status >= 200 && xhr.status < 300 && data && data.attachment) {
            resolve(data.attachment);
            return;
        }
        const error = new Error((data && data.error) || `Upload failed (${xhr.status})`);
        error.status = xhr.status;
        reject(error);
    };
    xhr.onerror = () => reject(new Error('Upload failed.'));
    xhr.onabort = () => {
        const error = new Error('Upload cancelled.');
        error.code = 'aborted';
        reject(error);
    };
    if (signal) signal.addEventListener('abort', () => xhr.abort());
    xhr.send(form);
});

class ChatConnection {
    constructor ({
        id = 'server',
        socketUrl = CHAT_SOCKET,
        serverUrl = CHAT_URL,
        signingUrls = [serverUrl],
        direct = false,
        checksMembership = false,
        storageKey = null,
        WebSocketImpl,
        fetchImpl,
        getValidator = requestValidator,
        signer = defaultSigner
    } = {}) {
        this.id = id;
        this.socketUrl = socketUrl;
        this.serverUrl = serverUrl;
        this.signingUrls = signingUrls;
        this.direct = direct;
        this.checksMembership = checksMembership;
        this.storageKey = storageKey;
        this.WebSocketImpl = WebSocketImpl;
        this.fetchImpl = fetchImpl;
        this.getValidator = getValidator;
        this.signer = signer;
        this.sendQueue = Promise.resolve();
        this.state = {...initialState(direct), active: readStoredChannel(storageKey)};
        this.listeners = new Set();
        this.socket = null;
        this.generation = 0;
        this.retries = 0;
        this.retryTimer = null;
        this.typingSentAt = 0;
        this.viewing = false;
        this.pendingReferences = new Map();
        this.pendingEdits = new Map();
        this.validatorKey = null;
        this.access = {};
        this.pendingDirect = null;
        this.pendingGroup = false;
        this.membershipFor = null;
    }

    setViewing (viewing) {
        this.viewing = viewing;
        if (!viewing) return;
        const channelUnread = this.clearedChannel(this.state.active);
        if (this.state.unread || channelUnread !== this.state.channelUnread) this.patch({unread: 0, channelUnread});
    }

    clearedChannel (name) {
        if (!name || !this.state.channelUnread[name]) return this.state.channelUnread;
        const channelUnread = {...this.state.channelUnread};
        delete channelUnread[name];
        return channelUnread;
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

    async checkMembership (username) {
        if (!this.checksMembership) {
            this.patch({membership: 'member'});
            return 'member';
        }
        const name = String(username || '');
        this.membershipFor = name.toLowerCase();
        this.patch({membership: 'checking', error: null});
        const request = this.fetchImpl || window.fetch.bind(window);
        let membership;
        try {
            const response = await request(`${this.serverUrl}/user/${encodeURIComponent(name)}`);
            if (response.status === 404) membership = 'guest';
            else if (response.ok) membership = 'member';
            else throw new Error(`Chat server unavailable (${response.status})`);
        } catch (error) {
            if (this.membershipFor !== name.toLowerCase()) return null;
            this.patch({membership: 'unknown', status: 'error', error: error.message});
            return null;
        }
        if (this.membershipFor !== name.toLowerCase()) return null;
        this.patch({membership});
        return membership;
    }

    join (access = {}) {
        this.access = {...access};
        if (this.socket) this.disconnect();
        this.patch({denied: null, error: null});
        this.connect();
    }

    connect () {
        if (this.socket) return;
        clearTimeout(this.retryTimer);
        const generation = ++this.generation;
        const Impl = this.WebSocketImpl || window.WebSocket;
        const socket = new Impl(this.socketUrl);
        this.socket = socket;
        this.patch({status: this.retries ? 'reconnecting' : 'connecting', error: null, denied: null});
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
            if (['error', 'signed_out', 'denied'].includes(this.state.status)) return;
            this.scheduleReconnect();
        };
    }

    scheduleReconnect () {
        const delay = Math.min(MAX_RETRY_MS, 1000 * (2 ** this.retries));
        this.retries += 1;
        this.patch({status: 'reconnecting'});
        this.retryTimer = setTimeout(() => this.connect(), delay);
    }

    disconnect ({keepMembership = true} = {}) {
        clearTimeout(this.retryTimer);
        this.generation += 1;
        this.retries = 0;
        this.validatorKey = null;
        const socket = this.socket;
        this.socket = null;
        if (socket) socket.close();
        const membership = keepMembership ? this.state.membership : 'unknown';
        if (!keepMembership) this.membershipFor = null;
        this.setState({...initialState(this.direct), active: this.state.active, membership});
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
        if (!validatorKeyMatches(key, this.signingUrls)) {
            this.fail('This chat server did not identify itself correctly.');
            return;
        }
        this.validatorKey = key;
        this.patch({status: 'authenticating'});
        try {
            const validator = await this.getValidator(key);
            if (generation !== this.generation) return;
            const access = {};
            if (this.access.invite) access.invite_code = normalizeInvite(this.access.invite);
            if (this.access.password) access.server_password = this.access.password;
            this.send({cmd: 'auth', validator, client: CLIENT_NAME, ...access});
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
        let counted = next;
        if (fromOther) {
            const channel = frameChannel(frame);
            const seen = this.viewing && channel === next.active;
            counted = {
                ...next,
                unread: this.viewing ? next.unread : next.unread + 1,
                channelUnread: seen ? next.channelUnread : {
                    ...next.channelUnread,
                    [channel]: (next.channelUnread[channel] || 0) + 1
                }
            };
        }
        this.setState(counted);
        switch (frame.cmd) {
        case 'handshake':
            this.authenticate(frame.val && frame.val.validator_key, generation);
            break;
        case 'auth_error':
            if (ACCESS_REASONS.includes(frame.reason)) {
                this.patch({
                    status: 'denied',
                    denied: {reason: frame.reason, text: frame.val || '', mode: frame.mode || null}
                });
                if (this.socket) this.socket.close();
                break;
            }
            this.fail(frame.val || 'Chat sign in failed.');
            break;
        case 'ready':
            this.retries = 0;
            this.access = {};
            this.patch({status: 'ready', membership: 'member', denied: null});
            this.send({cmd: 'capabilities', val: ['server_side_embeds', SIGNING_CAPABILITY]});
            this.refreshSigning(generation);
            this.send({cmd: 'channels_get'});
            this.send({cmd: 'users_list'});
            OPTIONAL_LOADS.filter(cmd => this.state.capabilities.includes(cmd)).forEach(cmd => this.send({cmd}));
            break;
        case 'channels_get': {
            const opened = this.pendingDirect && findDirectChannel(this.state.channels, this.pendingDirect);
            if (opened) {
                this.pendingDirect = null;
                this.selectChannel(opened.name);
            } else if (this.state.active) {
                this.loadHistory(this.state.active);
            }
            break;
        }
        case 'channel_create':
            if (frame.channel && frame.channel.name && (this.pendingDirect || this.pendingGroup)) {
                this.pendingDirect = null;
                this.pendingGroup = false;
                this.selectChannel(frame.channel.name);
            }
            break;
        case 'message_edit':
            this.pendingEdits.forEach((edit, listener) => {
                const id = frame.id || (frame.message && frame.message.id);
                if (listener === frame.listener || edit.id === id) this.pendingEdits.delete(listener);
            });
            break;
        case 'error':
            if (frame.src === 'message_edit') this.revertEdits(frame.listener);
            if (frame.src === 'channel_create' && this.pendingDirect) {
                this.send({cmd: 'message_new', channel: 'cmds', content: `dm add ${this.pendingDirect}`});
            } else if (frame.src === 'message_new' && this.pendingDirect) {
                this.pendingDirect = null;
            }
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
        if (name === null) {
            this.patch({active: null, notice: null});
            return;
        }
        if (!this.state.channels.some(channel => channel.name === name && isChatChannel(channel))) return;
        storeChannel(this.storageKey, name);
        this.patch({active: name, notice: null, channelUnread: this.clearedChannel(name)});
        this.loadHistory(name);
    }

    openDirect (username) {
        const name = String(username || '')
            .trim()
            .replace(/^@/, '');
        if (!name) return false;
        const existing = findDirectChannel(this.state.channels, name);
        if (existing) {
            this.selectChannel(existing.name);
            return true;
        }
        this.pendingDirect = name;
        return this.send({cmd: 'channel_create', user: name, listener: makeListener()});
    }

    async refreshSigning (generation = this.generation) {
        let signing;
        try {
            signing = await this.signer.status(this.state.capabilities);
        } catch (e) {
            signing = 'unsupported';
        }
        if (generation === this.generation) this.patch({signing});
        return signing;
    }

    async enableSigning () {
        await this.signer.request();
        return this.refreshSigning();
    }

    serverNow () {
        return (Date.now() / 1000) + (this.state.clockOffset || 0);
    }

    async signed (frame, content, attachments, minimum = 0) {
        if (this.state.signing !== 'on') return frame;
        const timestamp = Math.max(this.serverNow(), minimum);
        try {
            const proof = await this.signer.sign({
                content,
                attachments,
                timestamp,
                signingUrl: this.state.signingUrl || this.serverUrl
            });
            return {...frame, ...proof};
        } catch (error) {
            if (error && (error.name === 'NotSupportedError' || error.name === 'DataError')) {
                this.patch({signing: 'unsupported'});
                return frame;
            }
            throw error;
        }
    }

    enqueue (build, onFail) {
        const generation = this.generation;
        this.sendQueue = this.sendQueue
            .then(build)
            .then(frame => {
                if (generation === this.generation) this.send(frame);
            })
            .catch(() => {
                if (generation !== this.generation) return;
                if (onFail) onFail();
                this.patch({notice: {kind: 'sign_failed'}});
            });
        return this.sendQueue;
    }

    createGroup (name, members) {
        const title = String(name || '').trim();
        const list = [...new Set((members || []).map(member => String(member).trim()
            .replace(/^@/, ''))
            .filter(Boolean))];
        if (!title || !list.length) return false;
        this.pendingGroup = true;
        return this.send({cmd: 'channel_create', type: 'group', name: title, members: list});
    }

    renameGroup (channel, name) {
        const title = String(name || '').trim();
        if (!title) return false;
        return this.send({cmd: 'channel_update', channel, updates: {name: title}});
    }

    addGroupMember (channel, username) {
        const current = this.state.channels.find(item => item.name === channel);
        const name = String(username || '').trim()
            .replace(/^@/, '');
        if (!current || !name) return false;
        const me = userKey(this.state.me && this.state.me.username);
        const others = groupMembers(current).filter(member => userKey(member) !== me);
        if (others.some(member => userKey(member) === userKey(name))) return false;
        return this.send({cmd: 'channel_update', channel, updates: {members: [...others, name]}});
    }

    removeGroupMember (channel, username) {
        if (!channel || !username) return false;
        return this.send({cmd: 'channel_kick', channel, user: username});
    }

    leaveConversation (channel) {
        if (!channel) return false;
        return this.send({cmd: 'user_leave', channel});
    }

    deleteGroup (channel) {
        if (!channel) return false;
        return this.send({cmd: 'channel_delete', channel});
    }

    sendMessage (channel, content, {replyTo, ping = true, attachments} = {}) {
        const text = String(content || '').trim();
        const files = (attachments || []).filter(item => item && item.id);
        if (!text && !files.length) return false;
        if (!this.socket || this.socket.readyState !== 1) return false;
        this.typingSentAt = 0;
        const frame = {
            cmd: 'message_new',
            channel,
            content: text,
            ...(files.length ? {attachments: files} : {}),
            ...(replyTo ? {reply_to: replyTo} : {}),
            ...(replyTo && ping === false ? {ping: false} : {}),
            listener: makeListener()
        };
        this.enqueue(() => this.signed(frame, text, files));
        return true;
    }

    editMessage (channel, id, content) {
        const text = String(content || '').trim();
        const current = findMessage(this.state, channel, id);
        if (!current) return false;
        const attachments = current.attachments || [];
        if (!text && !attachments.length) return false;
        if (text === String(current.content || '').trim()) return true;
        if (!this.socket || this.socket.readyState !== 1) return false;
        const listener = makeListener();
        const frame = {cmd: 'message_edit', channel, id, content: text, listener};
        const minimum = (Number(current.signed_at) || 0) + 0.001;
        this.pendingEdits.set(listener, {channel, id, previous: current});
        this.setState(updateMessage(this.state, channel, id, message => ({
            ...message,
            content: text,
            edited: true,
            pendingEdit: true,
            signature: null
        })));
        this.enqueue(() => this.signed(frame, text, attachments, minimum), () => this.revertEdits(listener));
        return true;
    }

    revertEdits (listener) {
        const keys = this.pendingEdits.has(listener) ? [listener] : Array.from(this.pendingEdits.keys());
        let state = this.state;
        keys.forEach(key => {
            const edit = this.pendingEdits.get(key);
            this.pendingEdits.delete(key);
            state = updateMessage(state, edit.channel, edit.id, () => edit.previous);
        });
        this.setState(state);
    }

    pinMessage (channel, id, pinned) {
        if (!id) return false;
        return this.send({cmd: pinned ? 'message_pin' : 'message_unpin', channel, id});
    }

    deleteMessage (channel, id) {
        if (!id) return false;
        return this.send({cmd: 'message_delete', channel, id});
    }

    toggleReaction (channel, id, emoji) {
        const message = findMessage(this.state, channel, id);
        const me = this.state.me && this.state.me.username;
        if (!message || !me || !emoji) return false;
        const mine = ((message.reactions || {})[emoji] || []).some(name => userKey(name) === userKey(me));
        const sent = this.send({cmd: mine ? 'message_react_remove' : 'message_react_add', channel, id, emoji});
        if (sent) this.setState(updateMessage(this.state, channel, id, item => withReaction(item, emoji, me, !mine)));
        return sent;
    }

    uploadProblem (file) {
        return uploadProblem(this.state, file);
    }

    async upload (file, {name, onProgress, signal} = {}) {
        const key = this.validatorKey;
        if (!key || this.state.status !== 'ready') throw new Error('Chat is not connected.');
        const problem = uploadProblem(this.state, file);
        if (problem) {
            const error = new Error(problem.code);
            error.code = problem.code;
            error.max = problem.max;
            throw error;
        }
        const validator = await this.getValidator(key);
        const fileName = name || file.name || 'file';
        const form = new FormData();
        form.append('file', file, fileName);
        form.append('name', fileName);
        form.append('mime_type', file.type || 'application/octet-stream');
        form.append('validator_key', key);
        form.append('validator', validator);
        return postUpload(this.uploadUrl(), form, onProgress, signal);
    }

    uploadUrl () {
        const advertised = this.state.server && this.state.server.url;
        const origin = httpOrigin(advertised) || httpOrigin(this.socketUrl) || this.serverUrl;
        return `${origin}/attachments/upload`;
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

const checkInvite = async (serverUrl, code) => {
    const response = await fetch(`${serverUrl}/invite/${encodeURIComponent(normalizeInvite(code))}/check`);
    if (!response.ok && response.status !== 404) throw new Error(`Invite unavailable (${response.status})`);
    return response.json();
};

let shared = null;
const getChatConnection = () => {
    if (!shared) {
        shared = new ChatConnection({
            id: 'mistwarp',
            checksMembership: true,
            storageKey: ACTIVE_CHANNEL_KEY
        });
    }
    return shared;
};

let sharedDirect = null;
const getDirectConnection = () => {
    if (!sharedDirect) {
        sharedDirect = new ChatConnection({
            id: 'dms',
            socketUrl: DMS_SOCKET,
            serverUrl: DMS_URL,
            signingUrls: DMS_SIGNING_URLS,
            direct: true
        });
    }
    return sharedDirect;
};

export {
    CHAT_INVITE,
    CHAT_URL,
    DISCORD_INVITE,
    ChatConnection,
    activeTyping,
    applyFrame,
    canDeleteMessage,
    canEditMessage,
    canInChannel,
    channelName,
    checkInvite,
    directPeer,
    groupMembers,
    isGroupChannel,
    fetchServerInfo,
    findMessage,
    findUser,
    formatUsername,
    getChatConnection,
    getDirectConnection,
    hasCapability,
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
    providerName,
    roleById,
    userAvatar,
    userColor,
    userDisplayName,
    userKey,
    validatorKeyMatches
};
