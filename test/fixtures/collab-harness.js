/**
 * In-process multi-peer harness for the collaboration engine.
 *
 * A FakeHub replaces the WebRTC network: transports enqueue envelopes into
 * a single FIFO queue and nothing is delivered until the test pumps the
 * queue (flush/deliverOne), so message interleaving is fully controllable.
 * Envelopes are deep-cloned on enqueue like a real serializing network.
 *
 * DocApplier applies ops to a plain-JS document so convergence can be
 * asserted with deep equality across any number of peers.
 */
import Emitter from '../../src/lib/collaboration/emitter';
import {OpApplier} from '../../src/lib/collaboration/op-applier';
import HostSession from '../../src/lib/collaboration/host-session';
import ClientSession from '../../src/lib/collaboration/client-session';
import {validateEnvelope, makeSnapshot, OP, SNAPSHOT} from '../../src/lib/collaboration/protocol';

// Deep clone like a serializing network would; binary passes through as a copy.
const clone = value => {
    if (value instanceof ArrayBuffer) return value.slice(0);
    if (ArrayBuffer.isView(value)) {
        return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
    }
    if (Array.isArray(value)) return value.map(clone);
    if (value !== null && typeof value === 'object') {
        const out = {};
        Object.keys(value).forEach(key => {
            out[key] = clone(value[key]);
        });
        return out;
    }
    return value;
};

class FakeHub {
    constructor () {
        this.queue = [];
        this.transports = new Map();
        this.links = new Map(); // clientId -> {open}
        this.hostId = null;
        this.invalidMessages = [];
    }

    registerHost (transport) {
        this.hostId = transport.id;
        this.transports.set(transport.id, transport);
    }

    registerClient (transport) {
        this.transports.set(transport.id, transport);
        this.links.set(transport.id, {open: true});
    }

    enqueue (from, to, envelope) {
        const clientId = from === this.hostId ? to : from;
        const link = this.links.get(clientId);
        if (!link || !link.open) return false;
        this.queue.push({from, to, envelope: clone(envelope)});
        return true;
    }

    enqueueClose (clientId) {
        const link = this.links.get(clientId);
        if (!link || !link.open) return;
        link.open = false;
        this.queue.push({closeLink: clientId});
    }

    deliverOne () {
        const item = this.queue.shift();
        if (!item) return false;
        if (item.closeLink) {
            const clientTransport = this.transports.get(item.closeLink);
            const hostTransport = this.transports.get(this.hostId);
            if (hostTransport) hostTransport.emit('peer-disconnected', item.closeLink);
            if (clientTransport) clientTransport.emit('peer-disconnected', this.hostId);
            return true;
        }
        const target = this.transports.get(item.to);
        if (!target || target.destroyed) return true;
        const error = validateEnvelope(item.envelope);
        if (error) {
            this.invalidMessages.push({from: item.from, to: item.to, error});
            return true;
        }
        target.emit('message', item.from, item.envelope);
        return true;
    }

    /**
     * Deliver everything, including messages produced by deliveries.
     * @returns {number} How many queue items were processed.
     */
    flush () {
        let delivered = 0;
        while (this.deliverOne()) {
            delivered++;
            if (delivered > 100000) throw new Error('hub flush did not quiesce');
        }
        return delivered;
    }

    /** Drop the next queued message matching a predicate. */
    dropNext (predicate) {
        const index = this.queue.findIndex(item =>
            item.envelope && (!predicate || predicate(item)));
        if (index === -1) return null;
        return this.queue.splice(index, 1)[0];
    }

    /** Move the last queued message to the front (reordering). */
    reorderLastToFront () {
        if (this.queue.length < 2) return;
        this.queue.unshift(this.queue.pop());
    }
}

class FakeCollabTransport extends Emitter {
    constructor (hub, id) {
        super();
        this.hub = hub;
        this._id = id;
        this.isHost = false;
        this.roomId = null;
        this.hostPeerId = null;
        this.destroyed = false;
    }

    get id () {
        return this._id;
    }

    host (roomId) {
        this.isHost = true;
        this.roomId = roomId;
        this.hostPeerId = this._id;
        this.hub.registerHost(this);
        return Promise.resolve(this._id);
    }

    join (roomId, metadata) {
        this.roomId = roomId;
        this.hostPeerId = this.hub.hostId;
        this.metadata = metadata;
        this.hub.registerClient(this);
        return Promise.resolve(this._id);
    }

    send (peerId, envelope) {
        return this.hub.enqueue(this._id, peerId, envelope);
    }

    sendToHost (envelope) {
        if (this.isHost) return false;
        return this.send(this.hostPeerId, envelope);
    }

    broadcast (envelope, exceptPeerId) {
        if (this.isHost) {
            this.hub.links.forEach((link, clientId) => {
                if (clientId === exceptPeerId) return;
                this.send(clientId, envelope);
            });
        } else {
            this.sendToHost(envelope);
        }
    }

    closeConnection (peerId) {
        this.hub.enqueueClose(this.isHost ? peerId : this._id);
    }

    destroy () {
        this.destroyed = true;
    }
}

/**
 * Applies collaboration ops to a plain JS document.
 * Deletes of missing entities throw (the host turns that into a reject);
 * edits of missing entities no-op (identical outcome on every peer).
 */
class DocApplier extends OpApplier {
    constructor () {
        super();
        this.doc = {
            targets: {},
            blocks: {},
            extensions: []
        };
    }

    snapshot () {
        return clone(this.doc);
    }

    loadSnapshot (docSnapshot) {
        this.doc = clone(docSnapshot);
    }

    _apply (type, payload) {
        const doc = this.doc;
        switch (type) {
        case OP.BLOCK_EVENT: {
            const event = payload.event;
            const key = `${payload.targetId}:${event.blockId}`;
            switch (event.type) {
            case 'create':
                doc.blocks[key] = {fields: {}, pos: {x: 0, y: 0}};
                break;
            case 'delete':
                delete doc.blocks[key];
                break;
            case 'change':
                if (doc.blocks[key]) {
                    doc.blocks[key].fields[`${event.element}:${event.name}`] = event.newValue;
                }
                break;
            case 'move':
                if (doc.blocks[key] && event.newCoordinate) {
                    doc.blocks[key].pos = {x: event.newCoordinate.x, y: event.newCoordinate.y};
                }
                break;
            default:
                break;
            }
            break;
        }
        case OP.TARGET_UPDATE: {
            const target = doc.targets[payload.targetId];
            if (target) Object.assign(target, payload.props);
            break;
        }
        case OP.SPRITE_ADD:
            doc.targets[payload.targetId] = Object.assign(
                {costumes: [], sounds: [], currentCostume: 0},
                clone(payload.spriteJson)
            );
            break;
        case OP.SPRITE_DELETE:
            if (!doc.targets[payload.targetId]) {
                throw new Error(`no such target: ${payload.targetId}`);
            }
            delete doc.targets[payload.targetId];
            break;
        case OP.SPRITE_RENAME:
            if (!doc.targets[payload.targetId]) {
                throw new Error(`no such target: ${payload.targetId}`);
            }
            doc.targets[payload.targetId].name = payload.name;
            break;
        case OP.COSTUME_ADD:
            if (doc.targets[payload.targetId]) {
                doc.targets[payload.targetId].costumes.push(clone(payload.costume));
            }
            break;
        case OP.COSTUME_SELECT:
            if (doc.targets[payload.targetId]) {
                doc.targets[payload.targetId].currentCostume = payload.index;
            }
            break;
        case OP.EXTENSION_LOAD:
            if (doc.extensions.indexOf(payload.extensionId) === -1) {
                doc.extensions.push(payload.extensionId);
            }
            break;
        default:
            break;
        }
    }
}

let peerCounter = 0;
const nextPeerId = prefix => `${prefix}-${++peerCounter}`;

/**
 * Create a host plus N clients, all joined and snapshot-synced.
 *
 * The snapshot machinery (phase 3) is stubbed: when the host session asks
 * for a snapshot, the harness copies the host doc into the client applier,
 * sets the client's base seq, and completes the sync handshake.
 * @param {object} [options] Options.
 * @param {number} [options.clientCount] Number of clients (default 2).
 * @param {string} [options.privacy] Room privacy (default public).
 * @param {boolean} [options.autoSnapshot] Auto-serve snapshots (default true).
 * @returns {Promise<object>} {hub, host, clients, quiesce, edit, allDocs, expectConverged}
 */
const createRoom = async ({clientCount = 2, privacy = 'public', autoSnapshot = true} = {}) => {
    const hub = new FakeHub();
    const clientsById = new Map();

    const hostApplier = new DocApplier();
    const hostTransport = new FakeCollabTransport(hub, nextPeerId('host'));
    const hostSession = new HostSession({
        transport: hostTransport,
        applier: hostApplier,
        roomId: 'room',
        username: 'host',
        privacy
    });
    await hostSession.start();

    if (autoSnapshot) {
        hostSession.on('snapshot-needed', ({peerId}) => {
            const client = clientsById.get(peerId);
            if (!client) return;
            client.applier.loadSnapshot(hostApplier.doc);
            client.session.setBaseSeq(hostSession.seq);
            client.transport.sendToHost(makeSnapshot(SNAPSHOT.COMPLETE, {transferId: 'harness'}));
        });
    }

    const host = {session: hostSession, applier: hostApplier, transport: hostTransport, id: hostTransport.id};

    const addClient = async (username, handle) => {
        const applier = new DocApplier();
        const transport = new FakeCollabTransport(hub, nextPeerId('client'));
        const session = new ClientSession({
            transport,
            applier,
            roomId: 'room',
            username,
            handle
        });
        const client = {session, applier, transport, id: transport.id, username};
        clientsById.set(transport.id, client);
        await session.connect();
        return client;
    };

    const clients = [];
    for (let i = 0; i < clientCount; i++) {
        clients.push(await addClient(`user${i + 1}`));
    }
    hub.flush();

    /**
     * Simulate a user edit on a peer: mutate the local doc directly
     * (capture is post-hoc) and submit the op.
     * @param {object} peer Host or client harness entry.
     * @param {string} type Op type.
     * @param {object} payload Op payload.
     * @returns {number|object} clientOpId (client) or op envelope (host).
     */
    const edit = (peer, type, payload) => {
        try {
            peer.applier._apply(type, payload, {});
        } catch (error) {
            // Local UI wouldn't allow an invalid edit; tests may force one.
        }
        return peer.session.submitLocal(type, payload);
    };

    const allDocs = () => [host.applier.snapshot()].concat(clients.map(c => c.applier.snapshot()));

    const expectConverged = () => {
        const docs = allDocs();
        for (let i = 1; i < docs.length; i++) {
            expect(docs[i]).toEqual(docs[0]);
        }
    };

    const destroy = () => {
        clientsById.forEach(client => client.session.destroy());
        hostSession.destroy();
    };

    return {hub, host, clients, clientsById, addClient, edit, allDocs, expectConverged, destroy};
};

module.exports = {
    FakeHub,
    FakeCollabTransport,
    DocApplier,
    createRoom
};
