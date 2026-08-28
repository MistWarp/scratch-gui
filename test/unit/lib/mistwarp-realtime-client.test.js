import RealtimeClient from '../../../src/lib/mistwarp-games/realtime-client.js';

const mockRequest = jest.fn();

jest.mock('../../../src/lib/community/api.js', () => ({
    request: (...args) => mockRequest(...args)
}));

class FakeWebSocket {
    constructor (url) {
        this.url = url;
        this.readyState = 0;
        this.listeners = {};
        this.sent = [];
        FakeWebSocket.instances.push(this);
    }

    addEventListener (type, listener) {
        this.listeners[type] = listener;
    }

    dispatch (type, data) {
        this.listeners[type]({data});
    }

    send (message) {
        this.sent.push(message);
    }

    close () {}
}

FakeWebSocket.OPEN = 1;
FakeWebSocket.instances = [];

test('authenticates after opening without putting the ticket in the URL', async () => {
    const originalWebSocket = global.WebSocket;
    global.WebSocket = FakeWebSocket;
    mockRequest.mockResolvedValue({
        connectUrl: 'wss://mwapi.mistium.com/v1/connect',
        ticket: 'mwt_secret'
    });

    try {
        const client = new RealtimeClient();
        const connecting = client.connect('123', 'play', 'main');
        await Promise.resolve();
        await Promise.resolve();

        const socket = FakeWebSocket.instances[0];
        expect(socket.url).toBe('wss://mwapi.mistium.com/v1/connect');
        socket.readyState = FakeWebSocket.OPEN;
        socket.dispatch('open');
        expect(JSON.parse(socket.sent[0])).toEqual({type: 'authenticate', ticket: 'mwt_secret'});

        socket.dispatch('message', JSON.stringify({type: 'welcome', self: '42', players: []}));
        await expect(connecting).resolves.toEqual({connected: true, self: '42', players: []});

        client.sendGameEvent({name: 'your-turn', value: {turn: 3}, to: '84'});
        expect(JSON.parse(socket.sent[socket.sent.length - 1])).toEqual({
            type: 'game_event',
            name: 'your-turn',
            value: {turn: 3},
            to: '84'
        });
        client.disconnect();
    } finally {
        global.WebSocket = originalWebSocket;
        FakeWebSocket.instances = [];
    }
});

test('sends ping messages to keep the connection open and handles pong', async () => {
    const originalWebSocket = global.WebSocket;
    global.WebSocket = FakeWebSocket;
    mockRequest.mockResolvedValue({
        connectUrl: 'wss://mwapi.mistium.com/v1/connect',
        ticket: 'mwt_secret'
    });

    try {
        const client = new RealtimeClient();
        const connecting = client.connect('123', 'play', 'main');
        await Promise.resolve();
        await Promise.resolve();

        const socket = FakeWebSocket.instances[0];
        socket.readyState = FakeWebSocket.OPEN;
        socket.dispatch('open');
        socket.dispatch('message', JSON.stringify({type: 'welcome', self: '42', players: []}));
        await connecting;

        client.ping();
        expect(JSON.parse(socket.sent[socket.sent.length - 1])).toEqual({type: 'ping'});

        // Handle pong message
        const events = [];
        client.subscribe(event => events.push(event));
        socket.dispatch('message', JSON.stringify({type: 'pong', at: 123456789}));
        expect(events).toEqual([{type: 'pong', at: 123456789}]);
        client.disconnect();
    } finally {
        global.WebSocket = originalWebSocket;
        FakeWebSocket.instances = [];
    }
});

test('automatically reconnects and restores player state when socket closes unexpectedly', async () => {
    const originalWebSocket = global.WebSocket;
    global.WebSocket = FakeWebSocket;
    let ticketCounter = 1;
    mockRequest.mockImplementation(() => Promise.resolve({
        connectUrl: 'wss://mwapi.mistium.com/v1/connect',
        ticket: `mwt_secret_${ticketCounter++}`
    }));

    try {
        const client = new RealtimeClient();
        const connecting = client.connect('123', 'play', 'main');
        await Promise.resolve();
        await Promise.resolve();

        const socket1 = FakeWebSocket.instances[0];
        socket1.readyState = FakeWebSocket.OPEN;
        socket1.dispatch('open');
        socket1.dispatch('message', JSON.stringify({type: 'welcome', self: '42', players: []}));
        await connecting;

        client.setState({x: 100, y: 200});
        expect(JSON.parse(socket1.sent[socket1.sent.length - 1])).toEqual({type: 'state', value: {x: 100, y: 200}});

        // Unexpected disconnect
        socket1.readyState = 3;
        socket1.dispatch('close');

        // Wake / reconnect triggers reconnect
        client.handleWake();
        await Promise.resolve();
        await Promise.resolve();

        expect(FakeWebSocket.instances.length).toBe(2);
        const socket2 = FakeWebSocket.instances[1];
        expect(socket2.url).toBe('wss://mwapi.mistium.com/v1/connect');
        socket2.readyState = FakeWebSocket.OPEN;
        socket2.dispatch('open');
        expect(JSON.parse(socket2.sent[0])).toEqual({type: 'authenticate', ticket: 'mwt_secret_2'});

        socket2.dispatch('message', JSON.stringify({type: 'welcome', self: '42', players: []}));
        expect(JSON.parse(socket2.sent[1])).toEqual({type: 'state', value: {x: 100, y: 200}});
        client.disconnect();
    } finally {
        global.WebSocket = originalWebSocket;
        FakeWebSocket.instances = [];
    }
});

test('explicit disconnect prevents automatic reconnect', async () => {
    const originalWebSocket = global.WebSocket;
    global.WebSocket = FakeWebSocket;
    mockRequest.mockResolvedValue({
        connectUrl: 'wss://mwapi.mistium.com/v1/connect',
        ticket: 'mwt_secret'
    });

    try {
        const client = new RealtimeClient();
        const connecting = client.connect('123', 'play', 'main');
        await Promise.resolve();
        await Promise.resolve();

        const socket = FakeWebSocket.instances[0];
        socket.readyState = FakeWebSocket.OPEN;
        socket.dispatch('open');
        socket.dispatch('message', JSON.stringify({type: 'welcome', self: '42', players: []}));
        await connecting;

        client.disconnect();
        expect(client.isConnected()).toBe(false);

        // Calling handleWake after disconnect does nothing
        client.handleWake();
        await Promise.resolve();
        expect(FakeWebSocket.instances.length).toBe(1);
    } finally {
        global.WebSocket = originalWebSocket;
        FakeWebSocket.instances = [];
    }
});
