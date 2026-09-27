import {
    ChatConnection,
    activeTyping,
    applyFrame,
    directPeer,
    initialState,
    mergeMessages,
    onlineUsers,
    validatorKeyMatches
} from '../../src/lib/originchats/connection.js';
import {DMS_SIGNING_URLS} from '../../src/lib/originchats/links.js';

class FakeSocket {
    constructor (url) {
        this.url = url;
        this.readyState = 1;
        this.sent = [];
        FakeSocket.last = this;
    }

    send (data) {
        this.sent.push(JSON.parse(data));
    }

    close () {
        this.readyState = 3;
        if (this.onclose) this.onclose();
    }

    receive (frame) {
        this.onmessage({data: JSON.stringify(frame)});
    }
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

const offSigner = {status: () => Promise.resolve('off'), sign: jest.fn(), request: jest.fn()};

const readyChat = (options = {}) => {
    const chat = new ChatConnection({
        WebSocketImpl: FakeSocket,
        getValidator: () => Promise.resolve('v'),
        signer: offSigner,
        ...options
    });
    chat.connect();
    const socket = FakeSocket.last;
    socket.receive({cmd: 'handshake', val: {validator_key: `originChats-${chat.signingUrls[0]}-key`}});
    return {chat, socket};
};

const response = status => Promise.resolve({status, ok: status >= 200 && status < 300});

const message = (id, timestamp, user = 'ann', content = id) => ({id, timestamp, user, content, type: 'message'});

describe('originchats reducer', () => {
    test('validator keys must name the expected server', () => {
        expect(validatorKeyMatches('originChats-https://chats.mistwarp.org-abc')).toBe(true);
        expect(validatorKeyMatches('originChats-https://evil.example-abc')).toBe(false);
        expect(validatorKeyMatches('originChats-https://chats.mistwarp.org-')).toBe(false);
        expect(validatorKeyMatches(null)).toBe(false);
    });

    test('history and live messages merge by id in time order', () => {
        const merged = mergeMessages([message('b', 2), message('a', 1)], [message('c', 3), {...message('b', 2), content: 'edited'}]);
        expect(merged.map(item => item.id)).toEqual(['a', 'b', 'c']);
        expect(merged[1].content).toBe('edited');
    });

    test('messages_get, message_new, edit and delete update the channel', () => {
        let state = applyFrame(initialState(), {cmd: 'messages_get', channel: 'general', val: [message('a', 1)], at_start: true});
        expect(state.history.general).toEqual({loaded: true, loading: false, atStart: true});
        state = applyFrame(state, {cmd: 'message_new', channel: 'general', message: message('b', 2)});
        state = applyFrame(state, {cmd: 'message_edit', channel: 'general', id: 'a', message: {...message('a', 1), content: 'hi', edited: true}});
        expect(state.messages.general.map(item => item.content)).toEqual(['hi', 'b']);
        state = applyFrame(state, {cmd: 'message_delete', channel: 'general', id: 'b'});
        expect(state.messages.general.map(item => item.id)).toEqual(['a']);
    });

    test('channels_get keeps the stored channel when it still exists', () => {
        const channels = [{name: 'rules', type: 'separator'}, {name: 'general', type: 'text'}, {name: 'help', type: 'text'}];
        expect(applyFrame({...initialState(), active: 'help'}, {cmd: 'channels_get', val: channels}).active).toBe('help');
        expect(applyFrame({...initialState(), active: 'gone'}, {cmd: 'channels_get', val: channels}).active).toBe('general');
    });

    test('presence events track who is online', () => {
        let state = applyFrame(initialState(), {cmd: 'users_list', users: [
            {username: 'Ann', status: {status: 'online'}},
            {username: 'bob', status: {status: 'offline'}}
        ]});
        state = applyFrame(state, {cmd: 'user_connect', user: {username: 'bob'}});
        expect(onlineUsers(state).map(user => user.username)).toEqual(['Ann', 'bob']);
        state = applyFrame(state, {cmd: 'user_disconnect', username: 'Ann'});
        expect(onlineUsers(state).map(user => user.username)).toEqual(['bob']);
    });

    test('typing ignores the current user and clears when they send', () => {
        let state = applyFrame(initialState(), {cmd: 'ready', user: {username: 'me'}});
        state = applyFrame(state, {cmd: 'typing', channel: 'general', user: 'me', duration: 6000});
        state = applyFrame(state, {cmd: 'typing', channel: 'general', user: 'ann', duration: 6000});
        expect(activeTyping(state, 'general').map(entry => entry.name)).toEqual(['ann']);
        state = applyFrame(state, {cmd: 'message_new', channel: 'general', message: message('a', 1, 'ann')});
        expect(activeTyping(state, 'general')).toEqual([]);
    });
});

describe('ChatConnection', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('authenticates with a validator for the handshake key and loads the channel', async () => {
        const getValidator = jest.fn(() => Promise.resolve('validator-1'));
        const chat = new ChatConnection({WebSocketImpl: FakeSocket, getValidator, signer: offSigner});
        chat.connect();
        const socket = FakeSocket.last;
        socket.receive({cmd: 'handshake', val: {validator_key: 'originChats-https://chats.mistwarp.org-key', limits: {post_content: 2000}}});
        await flush();
        expect(getValidator).toHaveBeenCalledWith('originChats-https://chats.mistwarp.org-key');
        expect(socket.sent[0]).toEqual({cmd: 'auth', validator: 'validator-1', client: 'mistwarp'});

        socket.receive({cmd: 'auth_success'});
        socket.receive({cmd: 'ready', user: {username: 'me'}});
        expect(chat.getState().status).toBe('ready');
        expect(socket.sent.map(frame => frame.cmd)).toEqual(['auth', 'capabilities', 'channels_get', 'users_list']);
        expect(socket.sent[1].val).toEqual(['server_side_embeds', 'message_signatures_v1']);

        socket.receive({cmd: 'channels_get', val: [{name: 'general', type: 'text'}]});
        expect(socket.sent[4]).toEqual({cmd: 'messages_get', channel: 'general', start: 0, limit: 50});
        chat.disconnect();
    });

    test('refuses to authenticate against a mismatched server key', async () => {
        const getValidator = jest.fn();
        const chat = new ChatConnection({WebSocketImpl: FakeSocket, getValidator});
        chat.connect();
        FakeSocket.last.receive({cmd: 'handshake', val: {validator_key: 'originChats-https://other.example-key'}});
        await flush();
        expect(getValidator).not.toHaveBeenCalled();
        expect(chat.getState().status).toBe('error');
    });

    test('counts unread messages from other people only while the pane is hidden', () => {
        const chat = new ChatConnection({WebSocketImpl: FakeSocket, getValidator: () => Promise.resolve('v')});
        chat.connect();
        const socket = FakeSocket.last;
        socket.receive({cmd: 'ready', user: {username: 'me'}});
        socket.receive({cmd: 'message_new', channel: 'general', message: message('a', 1, 'ann')});
        socket.receive({cmd: 'message_new', channel: 'general', message: message('b', 2, 'me')});
        expect(chat.getState().unread).toBe(1);
        chat.setViewing(true);
        expect(chat.getState().unread).toBe(0);
        socket.receive({cmd: 'message_new', channel: 'general', message: message('c', 3, 'ann')});
        expect(chat.getState().unread).toBe(0);
        chat.disconnect();
    });

    test('ignores frames from a socket that was replaced', () => {
        const chat = new ChatConnection({WebSocketImpl: FakeSocket, getValidator: () => Promise.resolve('v')});
        chat.connect();
        const old = FakeSocket.last;
        chat.reconnect();
        old.onmessage({data: JSON.stringify({cmd: 'ready', user: {username: 'ghost'}})});
        expect(chat.getState().me).toBe(null);
        chat.disconnect();
    });

    test('checks membership over HTTP before connecting and never opens a socket for guests', async () => {
        const fetchImpl = jest.fn(() => response(404));
        const chat = new ChatConnection({WebSocketImpl: FakeSocket, fetchImpl, checksMembership: true});
        FakeSocket.last = null;
        expect(await chat.checkMembership('New User')).toBe('guest');
        expect(fetchImpl).toHaveBeenCalledWith('https://chats.mistwarp.org/user/New%20User');
        expect(chat.getState()).toMatchObject({membership: 'guest', status: 'idle'});
        expect(FakeSocket.last).toBe(null);

        fetchImpl.mockImplementation(() => response(200));
        expect(await chat.checkMembership('mist')).toBe('member');
    });

    test('a failed membership check shows an error instead of connecting', async () => {
        const chat = new ChatConnection({fetchImpl: () => response(502), checksMembership: true});
        expect(await chat.checkMembership('mist')).toBe(null);
        expect(chat.getState()).toMatchObject({membership: 'unknown', status: 'error'});
    });

    test('joining with an invite sends the code in auth and access errors stop reconnecting', async () => {
        const chat = new ChatConnection({WebSocketImpl: FakeSocket, getValidator: () => Promise.resolve('v'), signer: offSigner});
        chat.join({invite: 'abc123def456'});
        const socket = FakeSocket.last;
        socket.receive({cmd: 'handshake', val: {validator_key: 'originChats-https://chats.mistwarp.org-key'}});
        await flush();
        expect(socket.sent[0]).toMatchObject({cmd: 'auth', invite_code: 'ABC123DEF456'});

        socket.receive({cmd: 'auth_error', val: 'Invite expired', reason: 'invite_expired', mode: 'invite'});
        expect(chat.getState()).toMatchObject({status: 'denied', denied: {reason: 'invite_expired'}});
        expect(socket.readyState).toBe(3);
        expect(FakeSocket.last).toBe(socket);
    });

    test('every sent message gets its own random listener and carries attachments', async () => {
        const {chat, socket} = readyChat();
        socket.receive({cmd: 'ready', user: {username: 'me'}});
        const attachment = {id: 'file-1', name: 'a.png', mime_type: 'image/png', size: 3, url: 'https://x/a.png'};
        chat.sendMessage('general', 'one');
        chat.sendMessage('general', '', {attachments: [attachment], replyTo: 'm1'});
        await flush();
        const sent = socket.sent.filter(frame => frame.cmd === 'message_new');
        expect(sent).toHaveLength(2);
        expect(sent[0].listener).not.toBe(sent[1].listener);
        expect(sent[0].listener).toMatch(/^mw-.{8,}/);
        expect(sent[1]).toMatchObject({content: '', attachments: [attachment], reply_to: 'm1'});
        expect(chat.sendMessage('general', '   ')).toBe(false);
    });

    test('signs messages in order when signing is on', async () => {
        const sign = jest.fn(({content, timestamp}) => new Promise(resolve => {
            setTimeout(() => resolve({timestamp, author_id: 'u1', key_id: 'rotur_sk_1', signature: `sig-${content}`}),
                content === 'first' ? 5 : 0);
        }));
        const signer = {status: () => Promise.resolve('on'), sign, request: jest.fn()};
        const {chat, socket} = readyChat({signer});
        socket.receive({cmd: 'handshake', val: {validator_key: 'originChats-https://chats.mistwarp.org-key', signing_url: 'https://chats.mistwarp.org', server_time: 1000}});
        socket.receive({cmd: 'ready', user: {username: 'me'}});
        await flush();
        expect(chat.getState().signing).toBe('on');
        chat.sendMessage('general', 'first');
        chat.sendMessage('general', 'second');
        await new Promise(resolve => setTimeout(resolve, 20));
        const sent = socket.sent.filter(frame => frame.cmd === 'message_new');
        expect(sent.map(frame => frame.content)).toEqual(['first', 'second']);
        expect(sent[0]).toMatchObject({author_id: 'u1', key_id: 'rotur_sk_1', signature: 'sig-first'});
        expect(Math.abs(sent[0].timestamp - 1000)).toBeLessThan(5);
        expect(sign.mock.calls[0][0]).toMatchObject({content: 'first', attachments: [], signingUrl: 'https://chats.mistwarp.org'});
    });

    test('signed edits are newer than the signature they replace', async () => {
        const sign = jest.fn(({timestamp}) => Promise.resolve({timestamp, author_id: 'u1', key_id: 'rotur_sk_1', signature: 's'}));
        const {chat, socket} = readyChat({signer: {status: () => Promise.resolve('on'), sign, request: jest.fn()}});
        socket.receive({cmd: 'ready', user: {username: 'me'}});
        await flush();
        const future = (Date.now() / 1000) + 100;
        socket.receive({cmd: 'messages_get', channel: 'general', val: [{...message('a', 1, 'me'), signed_at: future}]});
        expect(chat.editMessage('general', 'a', 'fixed')).toBe(true);
        await flush();
        const edit = socket.sent.find(frame => frame.cmd === 'message_edit');
        expect(edit).toMatchObject({id: 'a', content: 'fixed'});
        expect(edit.timestamp).toBeGreaterThan(future);
    });

    test('reactions toggle for the current user and follow server frames', () => {
        const {chat, socket} = readyChat();
        socket.receive({cmd: 'ready', user: {username: 'me'}});
        socket.receive({cmd: 'messages_get', channel: 'general', val: [message('a', 1, 'ann')]});
        chat.patch({active: 'general'});
        chat.toggleReaction('general', 'a', '👍');
        expect(socket.sent.pop()).toEqual({cmd: 'message_react_add', channel: 'general', id: 'a', emoji: '👍'});
        expect(chat.getState().messages.general[0].reactions).toEqual({'👍': ['me']});
        socket.receive({cmd: 'message_react_add', channel: 'general', id: 'a', emoji: '👍', from: 'ann'});
        expect(chat.getState().messages.general[0].reactions['👍']).toEqual(['me', 'ann']);
        chat.toggleReaction('general', 'a', '👍');
        expect(socket.sent.pop().cmd).toBe('message_react_remove');
        expect(chat.getState().messages.general[0].reactions['👍']).toEqual(['ann']);
    });

    test('direct messages list chat channels, open a DM and fall back to the cmds channel', () => {
        const {chat, socket} = readyChat({direct: true, signingUrls: DMS_SIGNING_URLS});
        socket.receive({cmd: 'ready', user: {username: 'me'}});
        const channels = [
            {name: 'cmds', type: 'chat'},
            {name: 'sep', type: 'separator'},
            {name: '400', type: 'chat', display_name: 'ann', description: 'Direct message with ann', last_message: 5}
        ];
        socket.receive({cmd: 'channels_get', val: channels});
        expect(chat.getState().active).toBe(null);
        expect(directPeer(chat.getState().channels[2])).toBe('ann');

        chat.openDirect('ann');
        expect(chat.getState().active).toBe('400');

        chat.selectChannel(null);
        chat.openDirect('@bob');
        expect(socket.sent.pop()).toMatchObject({cmd: 'channel_create', user: 'bob'});
        socket.receive({cmd: 'error', src: 'channel_create', val: 'Unknown command'});
        expect(socket.sent.pop()).toEqual({cmd: 'message_new', channel: 'cmds', content: 'dm add bob'});
        socket.receive({cmd: 'channels_get', val: [...channels, {name: '401', type: 'chat', display_name: 'bob', description: 'Direct message with bob'}]});
        expect(chat.getState().active).toBe('401');
    });

    test('unread counts are tracked per channel', () => {
        const {chat, socket} = readyChat();
        socket.receive({cmd: 'ready', user: {username: 'me'}});
        socket.receive({cmd: 'channels_get', val: [{name: 'general', type: 'text'}, {name: 'help', type: 'text'}]});
        chat.setViewing(true);
        socket.receive({cmd: 'message_new', channel: 'help', message: message('h', 1, 'ann')});
        socket.receive({cmd: 'message_new', channel: 'general', message: message('g', 2, 'ann')});
        expect(chat.getState().channelUnread).toEqual({help: 1});
        chat.selectChannel('help');
        expect(chat.getState().channelUnread).toEqual({});
    });

    test('upload limits from the handshake are checked before sending', () => {
        const chat = new ChatConnection();
        chat.patch({attachments: {enabled: true, max_size: 10, allowed_types: ['image/*']}});
        expect(chat.uploadProblem({size: 20, type: 'image/png'})).toEqual({code: 'too_large', max: 10});
        expect(chat.uploadProblem({size: 5, type: 'application/zip'})).toEqual({code: 'type'});
        expect(chat.uploadProblem({size: 5, type: 'image/svg+xml'})).toBe(null);
    });
});

describe('originchats typing names', () => {
    test('bridged users without a known name are not shown by their raw id', () => {
        let state = applyFrame(initialState(), {cmd: 'typing', channel: 'general', user: 'USR:discord_1430198173090975960'});
        expect(activeTyping(state, 'general')).toEqual([
            {user: 'USR:discord_1430198173090975960', name: null, provider: 'discord'}
        ]);
        state = applyFrame(state, {cmd: 'users_list', users: [{username: 'USR:discord_1430198173090975960', nickname: 'Pixel'}]});
        expect(activeTyping(state, 'general')[0].name).toBe('Pixel');
    });

    test('dm signing urls are accepted for the dm server only', () => {
        expect(validatorKeyMatches('originChats-wss://dms.mistium.com-abc', DMS_SIGNING_URLS)).toBe(true);
        expect(validatorKeyMatches('originChats-wss://dms.mistium.com-abc')).toBe(false);
    });
});

