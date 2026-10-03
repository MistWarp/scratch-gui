/**
 * Minimal in-memory stand-ins for the PeerJS Peer/DataConnection API,
 * used to unit test the collaboration transport without a network.
 *
 * Connections default to raw serialization, like current clients. `sent`
 * holds decoded envelopes and `frames` the raw frames; `simulateData`
 * encodes a plain object the way a remote peer would.
 */
const {encodeFrames, FrameDecoder} = require('../../src/lib/collaboration/wire.js');

const FRAME_LIMIT = 64 * 1024;

const isPlainObject = value => typeof value === 'object' && value !== null && !Array.isArray(value) &&
    !(value instanceof ArrayBuffer) && !ArrayBuffer.isView(value);

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
        this.serialization = options.serialization || 'raw';
        this.open = false;
        this.sent = [];
        this.frames = [];
        this.closed = false;
        this._decoder = new FrameDecoder();
    }
    send (message) {
        if (!this.open) throw new Error('connection not open');
        if (this.serialization !== 'raw') {
            this.sent.push(message);
            return;
        }
        this.frames.push(message);
        const envelope = this._decoder.push(message);
        if (envelope !== null) this.sent.push(envelope);
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
        if (this.serialization === 'raw' && isPlainObject(message)) {
            encodeFrames(message, FRAME_LIMIT).forEach(frame => this.trigger('data', frame));
            return;
        }
        this.trigger('data', message);
    }
    simulateError (error) {
        this.trigger('error', error || new Error('fake connection error'));
    }
}

/**
 * Stands in for the broker WebSocket. Messages a peer sends land in
 * `sent`; a FakeBroker, when attached, delivers them to the destination.
 */
class FakeSocket {
    constructor (peer) {
        this.peer = peer;
        this.sent = [];
        this._socket = {readyState: 1, bufferedAmount: 0};
    }
    send (message) {
        this.sent.push(message);
        if (this.peer.broker) this.peer.broker.route(this.peer, message);
    }
}

class FakeBroker {
    constructor () {
        this.peers = new Map();
        this.paused = false;
        this.queue = [];
    }
    add (peer) {
        peer.broker = this;
        this.peers.set(peer.id, peer);
    }
    route (from, message) {
        const item = {from, message: JSON.parse(JSON.stringify(message))};
        if (this.paused) this.queue.push(item);
        else this._deliver(item);
    }
    flush () {
        const items = this.queue;
        this.queue = [];
        items.forEach(item => this._deliver(item));
    }
    _deliver ({from, message}) {
        if (message.type === 'HEARTBEAT') return;
        const target = this.peers.get(message.dst);
        if (!target || target.destroyed || target.disconnected) return;
        target._handleMessage(Object.assign({}, message, {src: from.id}));
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
        this.broker = null;
    }
    /**
     * Give this peer a broker socket, so the transport can relay.
     * @param {FakeBroker} [broker] Broker that delivers its messages.
     * @returns {FakePeer} This peer.
     */
    enableRelay (broker) {
        this.socket = new FakeSocket(this);
        this.handled = [];
        if (broker) broker.add(this);
        return this;
    }
    _handleMessage (message) {
        if (this.handled) this.handled.push(message);
        if (message.type !== 'EXPIRE') return;
        this.trigger('error', Object.assign(new Error('expired'), {type: 'peer-unavailable'}));
    }
    disconnect () {
        if (this.disconnected) return;
        this.disconnected = true;
        this.trigger('disconnected');
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

module.exports = {FakePeer, FakeDataConnection, FakeBroker};
