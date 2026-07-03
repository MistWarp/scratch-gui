/**
 * Minimal in-memory stand-ins for the PeerJS Peer/DataConnection API,
 * used to unit test the collaboration transport without a network.
 */

class FakeEmitter {
    constructor () {
        this._handlers = new Map();
    }
    on (event, callback) {
        if (!this._handlers.has(event)) this._handlers.set(event, []);
        this._handlers.get(event).push(callback);
        return this;
    }
    trigger (event, ...args) {
        (this._handlers.get(event) || []).slice()
            .forEach(callback => callback(...args));
    }
}

class FakeDataConnection extends FakeEmitter {
    constructor (remotePeerId, options = {}) {
        super();
        this.peer = remotePeerId;
        this.metadata = options.metadata;
        this.label = options.label;
        this.open = false;
        this.sent = [];
        this.closed = false;
    }
    send (message) {
        if (!this.open) throw new Error('connection not open');
        this.sent.push(message);
    }
    close () {
        if (this.closed) return;
        this.closed = true;
        this.open = false;
        this.trigger('close');
    }
    // Test helpers
    simulateOpen () {
        this.open = true;
        this.trigger('open');
    }
    simulateData (message) {
        this.trigger('data', message);
    }
    simulateError (error) {
        this.trigger('error', error || new Error('fake connection error'));
    }
}

class FakePeer extends FakeEmitter {
    constructor (id, config) {
        super();
        this.id = id;
        this.config = config;
        this.destroyed = false;
        this.disconnected = false;
        this.connections = [];
        this.reconnectCalls = 0;
    }
    connect (remotePeerId, options) {
        const conn = new FakeDataConnection(remotePeerId, options);
        this.connections.push(conn);
        return conn;
    }
    reconnect () {
        this.reconnectCalls++;
        this.disconnected = false;
    }
    destroy () {
        this.destroyed = true;
    }
    // Test helpers
    simulateOpen () {
        this.trigger('open', this.id);
    }
    simulateIncomingConnection (remotePeerId, options) {
        const conn = new FakeDataConnection(remotePeerId, options);
        this.connections.push(conn);
        this.trigger('connection', conn);
        return conn;
    }
    get lastConnection () {
        return this.connections[this.connections.length - 1];
    }
}

module.exports = {FakePeer, FakeDataConnection};
