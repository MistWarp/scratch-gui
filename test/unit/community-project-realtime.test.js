import {ProjectRealtime, SOCKET_URL} from '../../src/community/project-realtime.js';

const mockLoadSession = jest.fn();

jest.mock('../../src/lib/community/api.js', () => ({
    loadSession: () => mockLoadSession()
}));

class FakeWebSocket {
    constructor (url) {
        this.url = url;
        this.readyState = FakeWebSocket.CONNECTING;
        this.listeners = {};
        this.sent = [];
        FakeWebSocket.instances.push(this);
    }

    addEventListener (type, listener) {
        this.listeners[type] = listener;
    }

    dispatch (type, data) {
        if (this.listeners[type]) this.listeners[type]({data});
    }

    send (raw) {
        this.sent.push(JSON.parse(raw));
    }

    close () {
        this.readyState = FakeWebSocket.CLOSED;
    }
}

FakeWebSocket.CONNECTING = 0;
FakeWebSocket.OPEN = 1;
FakeWebSocket.CLOSED = 3;
FakeWebSocket.instances = [];

describe('project realtime', () => {
    const OriginalWebSocket = global.WebSocket;

    beforeEach(() => {
        global.WebSocket = FakeWebSocket;
        FakeWebSocket.instances = [];
        mockLoadSession.mockReset();
        mockLoadSession.mockReturnValue('session-token');
    });

    afterEach(() => {
        global.WebSocket = OriginalWebSocket;
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    test('authenticates, subscribes, and forwards project events', () => {
        const client = new ProjectRealtime();
        const events = [];
        const unsubscribe = client.subscribe('project-1', event => events.push(event), 'preview-key');
        const socket = FakeWebSocket.instances[0];

        expect(socket.url).toBe(SOCKET_URL);
        socket.readyState = FakeWebSocket.OPEN;
        socket.dispatch('open');
        expect(socket.sent.slice(0, 2)).toEqual([
            {type: 'authenticate', token: 'session-token'},
            {type: 'project_subscribe', projectId: 'project-1', accessKey: 'preview-key'}
        ]);

        socket.dispatch('message', JSON.stringify({
            type: 'project_stats',
            projectId: 'project-1',
            hearts: 4,
            brokenHearts: 1,
            saves: 3
        }));
        expect(events).toHaveLength(1);

        unsubscribe();
        expect(socket.sent[socket.sent.length - 1]).toEqual({
            type: 'project_unsubscribe',
            projectId: 'project-1'
        });
        expect(socket.readyState).toBe(FakeWebSocket.OPEN);
    });

    test('queues diagnostics until the socket has subscribed', () => {
        const client = new ProjectRealtime();
        const unsubscribe = client.subscribe('project-2', () => {});
        client.diagnostic('project-2', {type: 'playtime_start'});
        const socket = FakeWebSocket.instances[0];

        expect(socket.sent).toEqual([]);
        socket.readyState = FakeWebSocket.OPEN;
        socket.dispatch('open');
        expect(socket.sent).toEqual([
            {type: 'authenticate', token: 'session-token'},
            {type: 'project_subscribe', projectId: 'project-2', accessKey: ''},
            {type: 'diagnostic', projectId: 'project-2', diagnostic: {type: 'playtime_start'}}
        ]);

        unsubscribe();
    });

    test('keeps one project subscription until its last listener leaves', () => {
        const client = new ProjectRealtime();
        const first = client.subscribe('project-3', () => {});
        const second = client.subscribe('project-3', () => {});
        const socket = FakeWebSocket.instances[0];
        socket.readyState = FakeWebSocket.OPEN;
        socket.dispatch('open');

        first();
        expect(socket.sent.some(message => message.type === 'project_unsubscribe')).toBe(false);
        second();
        expect(socket.sent.filter(message => message.type === 'project_unsubscribe')).toHaveLength(1);
    });

    test('reuses the open socket when navigation changes projects', () => {
        const client = new ProjectRealtime();
        const leaveFirst = client.subscribe('project-a', () => {});
        const socket = FakeWebSocket.instances[0];
        socket.readyState = FakeWebSocket.OPEN;
        socket.dispatch('open');

        leaveFirst();
        const leaveSecond = client.subscribe('project-b', () => {});

        expect(FakeWebSocket.instances).toHaveLength(1);
        expect(socket.sent.slice(-2)).toEqual([
            {type: 'project_unsubscribe', projectId: 'project-a'},
            {type: 'project_subscribe', projectId: 'project-b', accessKey: ''}
        ]);
        leaveSecond();
        client.disconnect();
    });

    test('refreshes authentication without replacing the socket', () => {
        const client = new ProjectRealtime();
        const unsubscribe = client.subscribe('project-auth', () => {});
        const socket = FakeWebSocket.instances[0];
        socket.readyState = FakeWebSocket.OPEN;
        socket.dispatch('open');
        mockLoadSession.mockReturnValue(null);

        client.refreshAuth();

        expect(FakeWebSocket.instances).toHaveLength(1);
        expect(socket.sent[socket.sent.length - 1]).toEqual({type: 'authenticate', token: ''});
        unsubscribe();
        client.disconnect();
    });
});
