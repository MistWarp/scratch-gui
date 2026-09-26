import {
    ChatConnection,
    activeTyping,
    applyFrame,
    initialState,
    mergeMessages,
    onlineUsers,
    validatorKeyMatches
} from '../../src/lib/originchats/connection.js';

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
        expect(activeTyping(state, 'general')).toEqual(['ann']);
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
        const chat = new ChatConnection({WebSocketImpl: FakeSocket, getValidator});
        chat.connect();
        const socket = FakeSocket.last;
        socket.receive({cmd: 'handshake', val: {validator_key: 'originChats-https://chats.mistwarp.org-key', limits: {post_content: 2000}}});
        await flush();
        expect(getValidator).toHaveBeenCalledWith('originChats-https://chats.mistwarp.org-key');
        expect(socket.sent[0]).toEqual({cmd: 'auth', validator: 'validator-1', client: 'mistwarp'});

        socket.receive({cmd: 'auth_success'});
        socket.receive({cmd: 'ready', user: {username: 'me'}});
        expect(chat.getState().status).toBe('ready');
        expect(socket.sent.map(frame => frame.cmd)).toEqual(['auth', 'channels_get', 'users_list']);

        socket.receive({cmd: 'channels_get', val: [{name: 'general', type: 'text'}]});
        expect(socket.sent[3]).toEqual({cmd: 'messages_get', channel: 'general', start: 0, limit: 50});
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
});
