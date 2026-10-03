import {
    Transport,
    generateHostPeerId,
    generateClientPeerId
} from '../../../src/lib/collaboration/transport.js';
import {
    makeCtrl, makePresence, makeSnapshot, CTRL, PRESENCE, SNAPSHOT, KIND
} from '../../../src/lib/collaboration/protocol.js';
import {FakePeer, FakeBroker} from '../../fixtures/fake-peerjs.js';

const flush = async (ticks = 10) => {
    for (let i = 0; i < ticks; i++) {
        await Promise.resolve();
    }
};

const makeTransport = options => {
    const peers = [];
    const transport = new Transport(Object.assign({
        createPeer: (id, config) => {
            const peer = new FakePeer(id, config);
            peers.push(peer);
            return peer;
        },
        heartbeatIntervalMs: 10000,
        deadPeerTimeoutMs: 30000,
        dialTimeoutMs: 15000
    }, options));
    return {transport, peers};
};

describe('peer id generation', () => {
    test('host id is deterministic and sanitized', () => {
        expect(generateHostPeerId('My Room!')).toBe(generateHostPeerId('myroom'));
        expect(generateHostPeerId('myroom')).toMatch(/-collab-myroom-host$/);
        expect(generateHostPeerId('myroom')).not.toMatch(/^undefined/);
    });

    test('client ids are unique per call', () => {
        expect(generateClientPeerId('room')).not.toBe(generateClientPeerId('room'));
    });
});

describe('hosting', () => {
    test('host() resolves with the deterministic host id', async () => {
        const {transport, peers} = makeTransport();
        const hostPromise = transport.host('room1');
        peers[0].simulateOpen();
        const id = await hostPromise;
        expect(id).toBe(generateHostPeerId('room1'));
        expect(transport.isHost).toBe(true);
        transport.destroy();
    });

    test('emits peer-connected with metadata when a client dials in', async () => {
        const {transport, peers} = makeTransport();
        const hostPromise = transport.host('room1');
        peers[0].simulateOpen();
        await hostPromise;

        const connected = jest.fn();
        transport.on('peer-connected', connected);
        const conn = peers[0].simulateIncomingConnection('client-1', {metadata: {username: 'ann'}});
        conn.simulateOpen();

        expect(connected).toHaveBeenCalledWith('client-1', {username: 'ann'});
        expect(transport.peers()).toEqual(['client-1']);
        transport.destroy();
    });

    test('re-registers with the broker when disconnected', async () => {
        const {transport, peers} = makeTransport();
        const hostPromise = transport.host('room1');
        peers[0].simulateOpen();
        await hostPromise;

        peers[0].trigger('disconnected');
        expect(peers[0].reconnectCalls).toBe(1);
        transport.destroy();
    });

    test('losing the broker keeps the room open and reports when it is back', async () => {
        jest.useFakeTimers();
        try {
            const {transport, peers} = makeTransport();
            const hostPromise = transport.host('room1');
            peers[0].simulateOpen();
            await hostPromise;
            const conn = peers[0].simulateIncomingConnection('client-1', {});
            conn.simulateOpen();

            const fatal = jest.fn();
            const offline = jest.fn();
            const online = jest.fn();
            transport.on('fatal', fatal);
            transport.on('broker-offline', offline);
            transport.on('broker-online', online);

            peers[0].trigger('error', Object.assign(new Error('Lost connection to server.'), {type: 'network'}));
            peers[0].trigger('disconnected');
            expect(fatal).not.toHaveBeenCalled();
            expect(offline).toHaveBeenCalledTimes(1);
            expect(peers[0].reconnectCalls).toBe(1);
            expect(transport.isOpen('client-1')).toBe(true);

            peers[0].trigger('error', Object.assign(new Error('taken'), {type: 'unavailable-id'}));
            peers[0].trigger('disconnected');
            expect(peers[0].reconnectCalls).toBe(1);
            jest.advanceTimersByTime(1000);
            expect(peers[0].reconnectCalls).toBe(2);
            expect(fatal).not.toHaveBeenCalled();

            peers[0].simulateOpen();
            expect(online).toHaveBeenCalledTimes(1);
            transport.destroy();
        } finally {
            jest.useRealTimers();
        }
    });

    test('a failed negotiation with one peer does not end the room', async () => {
        const {transport, peers} = makeTransport();
        const hostPromise = transport.host('room1');
        peers[0].simulateOpen();
        await hostPromise;
        const fatal = jest.fn();
        transport.on('fatal', fatal);
        peers[0].trigger('error', Object.assign(new Error('bad candidate'), {type: 'webrtc'}));
        peers[0].trigger('error', Object.assign(new Error('socket'), {type: 'socket-error'}));
        expect(fatal).not.toHaveBeenCalled();
        peers[0].trigger('error', Object.assign(new Error('no webrtc'), {type: 'browser-incompatible'}));
        expect(fatal).toHaveBeenCalledTimes(1);
        transport.destroy();
    });

    test('a hello from another protocol version is reported, not dropped', async () => {
        const {transport, peers} = makeTransport();
        const hostPromise = transport.host('room1');
        peers[0].simulateOpen();
        await hostPromise;
        const conn = peers[0].simulateIncomingConnection('old-client', {});
        conn.simulateOpen();
        const mismatch = jest.fn();
        const invalid = jest.fn();
        transport.on('version-mismatch', mismatch);
        transport.on('invalid-message', invalid);
        conn.simulateData({v: 2, kind: KIND.CTRL, type: CTRL.HELLO, payload: {}});
        expect(mismatch).toHaveBeenCalledWith({peerId: 'old-client', version: 2, type: CTRL.HELLO});
        expect(invalid).not.toHaveBeenCalled();
        transport.destroy();
    });

    test('a graceful close waits for queued messages to leave', async () => {
        jest.useFakeTimers();
        try {
            const {transport, peers} = makeTransport();
            const hostPromise = transport.host('room1');
            peers[0].simulateOpen();
            await hostPromise;
            const conn = peers[0].simulateIncomingConnection('client-1', {});
            conn.simulateOpen();
            conn.bufferSize = 4096;
            const closed = transport.closeConnection('client-1', {graceful: true});
            jest.advanceTimersByTime(200);
            expect(conn.closed).toBe(false);
            conn.bufferSize = 0;
            jest.advanceTimersByTime(200);
            await closed;
            expect(conn.closed).toBe(true);
            transport.destroy();
        } finally {
            jest.useRealTimers();
        }
    });
});

describe('joining', () => {
    const openClient = async options => {
        const {transport, peers} = makeTransport(options);
        const joinPromise = transport.join('room1', {username: 'bob'});
        peers[0].simulateOpen();
        await flush();
        const hostConn = peers[0].lastConnection;
        hostConn.simulateOpen();
        await joinPromise;
        return {transport, peers, hostConn};
    };

    test('join() dials the host and resolves when the channel opens', async () => {
        const {transport, hostConn} = await openClient();
        expect(hostConn.peer).toBe(generateHostPeerId('room1'));
        expect(hostConn.metadata).toEqual({username: 'bob'});
        expect(transport.isOpen(generateHostPeerId('room1'))).toBe(true);
        transport.destroy();
    });

    test('join() rejects when the dial times out', async () => {
        jest.useFakeTimers();
        try {
            const {transport, peers} = makeTransport();
            const joinPromise = transport.join('room1', {});
            peers[0].simulateOpen();
            await flush();
            jest.advanceTimersByTime(15001);
            let error = null;
            await joinPromise.catch(e => {
                error = e;
            });
            expect(error).not.toBeNull();
            expect(error.collabCode).toBe('DIAL_TIMEOUT');
            transport.destroy();
        } finally {
            jest.useRealTimers();
        }
    });

    test('join() rejects immediately when nobody hosts the room', async () => {
        jest.useFakeTimers();
        try {
            const {transport, peers} = makeTransport();
            const joinPromise = transport.join('room1', {});
            peers[0].simulateOpen();
            await flush();

            peers[0].trigger('error', Object.assign(new Error('Could not connect to peer'), {
                type: 'peer-unavailable'
            }));

            let error = null;
            await joinPromise.catch(e => {
                error = e;
            });
            expect(error).not.toBeNull();
            expect(error.collabCode).toBe('ROOM_NOT_FOUND');
            transport.destroy();
        } finally {
            jest.useRealTimers();
        }
    });

    test('join() rejects a room code with no usable characters', async () => {
        const {transport} = makeTransport();
        let error = null;
        await transport.join('!!!', {}).catch(e => {
            error = e;
        });
        expect(error).not.toBeNull();
        expect(error.collabCode).toBe('INVALID_ROOM');
        transport.destroy();
    });

    test('join() rejects on connection error', async () => {
        const {transport, peers} = makeTransport();
        const joinPromise = transport.join('room1', {});
        peers[0].simulateOpen();
        await flush();
        peers[0].lastConnection.simulateError(new Error('nope'));
        let error = null;
        await joinPromise.catch(e => {
            error = e;
        });
        expect(error).not.toBeNull();
        expect(error.message).toBe('nope');
        transport.destroy();
    });

    test('sendToHost delivers to the host connection', async () => {
        const {transport, hostConn} = await openClient();
        const envelope = makeCtrl(CTRL.JOIN_REQUEST, {username: 'bob'});
        expect(transport.sendToHost(envelope)).toBe(true);
        expect(hostConn.sent).toContainEqual(envelope);
        transport.destroy();
    });
});

describe('message handling', () => {
    let transport;
    let peers;
    let clientConn;

    beforeEach(async () => {
        ({transport, peers} = makeTransport());
        const hostPromise = transport.host('room1');
        peers[0].simulateOpen();
        await hostPromise;
        clientConn = peers[0].simulateIncomingConnection('client-1', {});
        clientConn.simulateOpen();
    });

    afterEach(() => {
        transport.destroy();
    });

    test('valid messages are emitted with the transport-level peer id', () => {
        const received = jest.fn();
        transport.on('message', received);
        const envelope = makePresence(PRESENCE.CURSOR, {x: 1, y: 2});
        clientConn.simulateData(envelope);
        expect(received).toHaveBeenCalledWith('client-1', envelope);
    });

    test('invalid messages are dropped and counted', () => {
        const received = jest.fn();
        const invalid = jest.fn();
        transport.on('message', received);
        transport.on('invalid-message', invalid);

        clientConn.simulateData({v: 99, kind: 'op', type: 'block-event', payload: {}});
        clientConn.simulateData('garbage');
        clientConn.simulateData({v: 1, kind: KIND.PRESENCE, type: PRESENCE.CURSOR, payload: {x: 'a', y: 1}});

        expect(received).not.toHaveBeenCalled();
        expect(invalid).toHaveBeenCalledTimes(3);
        expect(transport.droppedMessageCount).toBe(3);
    });

    test('pings are answered with pongs and not surfaced', () => {
        const received = jest.fn();
        transport.on('message', received);
        clientConn.simulateData(makeCtrl(CTRL.PING, {}));
        expect(received).not.toHaveBeenCalled();
        expect(clientConn.sent.some(m => m.type === CTRL.PONG)).toBe(true);
    });

    test('broadcast skips the excluded peer', () => {
        const conn2 = peers[0].simulateIncomingConnection('client-2', {});
        conn2.simulateOpen();
        const envelope = makeCtrl(CTRL.SESSION_READY, {});
        transport.broadcast(envelope, 'client-1');
        expect(clientConn.sent).not.toContainEqual(envelope);
        expect(conn2.sent).toContainEqual(envelope);
    });

    test('closeConnection removes the peer without emitting peer-disconnected', () => {
        const gone = jest.fn();
        transport.on('peer-disconnected', gone);
        transport.closeConnection('client-1');
        expect(transport.peers()).toEqual([]);
        expect(gone).not.toHaveBeenCalled();
    });

    test('a closed connection emits peer-disconnected once', () => {
        const gone = jest.fn();
        transport.on('peer-disconnected', gone);
        clientConn.close();
        expect(gone).toHaveBeenCalledTimes(1);
        expect(gone).toHaveBeenCalledWith('client-1');
    });
});

describe('heartbeat', () => {
    test('pings open connections and reaps dead ones', async () => {
        jest.useFakeTimers();
        const nowSpy = jest.spyOn(Date, 'now');
        try {
            let now = 1000000;
            nowSpy.mockImplementation(() => now);

            const {transport, peers} = makeTransport();
            const hostPromise = transport.host('room1');
            peers[0].simulateOpen();
            await hostPromise;
            const conn = peers[0].simulateIncomingConnection('client-1', {});
            conn.simulateOpen();

            const gone = jest.fn();
            transport.on('peer-disconnected', gone);

            now += 10000;
            jest.advanceTimersByTime(10000);
            expect(conn.sent.some(m => m.type === CTRL.PING)).toBe(true);
            expect(gone).not.toHaveBeenCalled();

            // No inbound data for > deadPeerTimeoutMs
            for (let i = 0; i < 4; i++) {
                now += 10000;
                jest.advanceTimersByTime(10000);
            }
            expect(gone).toHaveBeenCalledWith('client-1');
            transport.destroy();
        } finally {
            nowSpy.mockRestore();
            jest.useRealTimers();
        }
    });

    test('inbound data keeps a connection alive', async () => {
        jest.useFakeTimers();
        const nowSpy = jest.spyOn(Date, 'now');
        try {
            let now = 1000000;
            nowSpy.mockImplementation(() => now);

            const {transport, peers} = makeTransport();
            const hostPromise = transport.host('room1');
            peers[0].simulateOpen();
            await hostPromise;
            const conn = peers[0].simulateIncomingConnection('client-1', {});
            conn.simulateOpen();

            const gone = jest.fn();
            transport.on('peer-disconnected', gone);

            for (let i = 0; i < 5; i++) {
                now += 10000;
                conn.simulateData(makeCtrl(CTRL.PONG, {}));
                jest.advanceTimersByTime(10000);
            }
            expect(gone).not.toHaveBeenCalled();
            transport.destroy();
        } finally {
            nowSpy.mockRestore();
            jest.useRealTimers();
        }
    });
});

describe('client reconnection', () => {
    const openClient = async () => {
        const result = makeTransport();
        const joinPromise = result.transport.join('room1', {username: 'bob'});
        result.peers[0].simulateOpen();
        await flush();
        result.peers[0].lastConnection.simulateOpen();
        await joinPromise;
        return result;
    };
    const latest = peers => peers[peers.length - 1];
    // Runs one scheduled redial: a fresh peer registers with the broker.
    const redial = async (peers, delay) => {
        jest.advanceTimersByTime(delay);
        await flush();
        latest(peers).simulateOpen();
        await flush();
        return latest(peers);
    };

    test('losing the host connection redials with a fresh peer', async () => {
        jest.useFakeTimers();
        try {
            const {transport, peers} = await openClient();
            const reconnecting = jest.fn();
            const reconnected = jest.fn();
            transport.on('reconnecting', reconnecting);
            transport.on('reconnected', reconnected);

            peers[0].lastConnection.close();
            expect(reconnecting).toHaveBeenCalledWith({attempt: 1, delayMs: 1000, reason: 'CONNECTION_LOST'});

            const peer = await redial(peers, 1000);
            expect(peers).toHaveLength(2);
            expect(peers[0].destroyed).toBe(true);
            const redialConn = peer.lastConnection;
            expect(redialConn.peer).toBe(generateHostPeerId('room1'));
            redialConn.simulateOpen();
            await flush();
            expect(reconnected).toHaveBeenCalled();
            expect(transport.id).toBe(peer.id);
            transport.destroy();
        } finally {
            jest.useRealTimers();
        }
    });

    test('treats a host that stays unregistered as having closed the room', async () => {
        jest.useFakeTimers();
        try {
            const {transport, peers} = await openClient();
            const fatal = jest.fn();
            transport.on('fatal', fatal);
            peers[0].lastConnection.close();
            const delays = [1000, 2000, 4000, 8000, 8000];
            for (let i = 0; i < delays.length; i++) {
                const peer = await redial(peers, delays[i]);
                peer.trigger('error', Object.assign(new Error('Could not connect to peer'), {
                    type: 'peer-unavailable'
                }));
                await flush();
                // A host reloading its page gets a few seconds to come back.
                if (i < 3) expect(fatal).not.toHaveBeenCalled();
            }
            expect(fatal).toHaveBeenCalledTimes(1);
            expect(fatal.mock.calls[0][0].error.collabCode).toBe('HOST_GONE');
            transport.destroy();
        } finally {
            jest.useRealTimers();
        }
    });

    test('redials that time out keep trying instead of ending the session', async () => {
        jest.useFakeTimers();
        try {
            const {transport, peers} = await openClient();
            const fatal = jest.fn();
            const reconnecting = jest.fn();
            transport.on('fatal', fatal);
            transport.on('reconnecting', reconnecting);
            peers[0].lastConnection.close();
            for (const delay of [1000, 2000, 4000, 8000]) {
                await redial(peers, delay);
                jest.advanceTimersByTime(15000);
                await flush();
            }
            expect(fatal).not.toHaveBeenCalled();
            expect(reconnecting).toHaveBeenCalledTimes(5);
            transport.destroy();
        } finally {
            jest.useRealTimers();
        }
    });

    test('gives up after five minutes without reaching the host', async () => {
        jest.useFakeTimers();
        try {
            const {transport, peers} = await openClient();
            const fatal = jest.fn();
            transport.on('fatal', fatal);

            peers[0].lastConnection.close();
            for (let i = 0; i < 60 && !fatal.mock.calls.length; i++) {
                const peer = await redial(peers, 8000);
                peer.lastConnection.simulateError(new Error('still down'));
                await flush();
            }
            expect(fatal).toHaveBeenCalledTimes(1);
            expect(fatal.mock.calls[0][0].error.collabCode).toBe('RECONNECT_FAILED');
            transport.destroy();
        } finally {
            jest.useRealTimers();
        }
    });

    test('backoff delay grows exponentially and caps at 8s', async () => {
        jest.useFakeTimers();
        try {
            const {transport, peers} = await openClient();
            const delays = [];
            transport.on('reconnecting', ({delayMs}) => delays.push(delayMs));

            peers[0].lastConnection.close();
            for (let i = 0; i < 5; i++) {
                const peer = await redial(peers, 8000);
                peer.lastConnection.simulateError(new Error('down'));
                await flush();
            }
            expect(delays.slice(0, 6)).toEqual([1000, 2000, 4000, 8000, 8000, 8000]);
            transport.destroy();
        } finally {
            jest.useRealTimers();
        }
    });

    test('coming back online redials straight away', async () => {
        jest.useFakeTimers();
        try {
            const {transport, peers} = await openClient();
            peers[0].lastConnection.close();
            jest.advanceTimersByTime(1000);
            await flush();
            latest(peers).simulateOpen();
            await flush();
            latest(peers).lastConnection.simulateError(new Error('offline'));
            await flush();
            expect(peers).toHaveLength(2);

            window.dispatchEvent(new Event('online'));
            await flush();
            expect(peers).toHaveLength(3);
            transport.destroy();
        } finally {
            jest.useRealTimers();
        }
    });

    test('destroy() cancels pending reconnects', async () => {
        jest.useFakeTimers();
        try {
            const {transport, peers} = await openClient();
            const reconnecting = jest.fn();
            transport.on('reconnecting', reconnecting);
            peers[0].lastConnection.close();
            expect(reconnecting).toHaveBeenCalledTimes(1);
            transport.destroy();
            jest.advanceTimersByTime(60000);
            await flush();
            // No further dials happened after destroy
            expect(peers).toHaveLength(1);
            expect(peers[0].connections.length).toBe(1);
        } finally {
            jest.useRealTimers();
        }
    });
});

describe('broker relay', () => {
    const setup = async ({relayFallbackMs = 5000} = {}) => {
        const broker = new FakeBroker();
        const all = [];
        const create = (id, config) => {
            const peer = new FakePeer(id, config).enableRelay(broker);
            all.push(peer);
            return peer;
        };
        const host = new Transport({createPeer: create, relayFallbackMs});
        const hosted = host.host('room1');
        all[0].simulateOpen();
        await hosted;
        const client = new Transport({createPeer: create, relayFallbackMs});
        return {broker, all, host, client};
    };

    test('a client that cannot connect directly is relayed through the broker', async () => {
        jest.useFakeTimers();
        try {
            const {all, host, client} = await setup();
            const connected = jest.fn();
            const received = jest.fn();
            host.on('peer-connected', connected);
            host.on('message', received);
            const joined = client.join('room1', {username: 'bob'});
            all[1].simulateOpen();
            await flush();
            const direct = all[1].lastConnection;

            jest.advanceTimersByTime(5000);
            await joined;
            expect(direct.closed).toBe(true);
            expect(client.connectionPath('host')).toBe('relay');
            expect(connected).toHaveBeenCalledWith(all[1].id, {username: 'bob'});
            expect(host.connectionPath(all[1].id)).toBe('relay');

            const big = new Uint8Array(200 * 1024);
            for (let i = 0; i < big.length; i++) big[i] = i % 251;
            expect(client.sendToHost(makeCtrl(CTRL.USERNAME_CHANGE, {username: 'bob'}))).toBe(true);
            expect(host.send(all[1].id, makeCtrl(CTRL.SESSION_READY, {}))).toBe(true);
            client.sendToHost(makePresence(PRESENCE.CURSOR, {x: 1, y: 2}));
            expect(received).toHaveBeenCalledTimes(2);
            expect(received.mock.calls[0][1].type).toBe(CTRL.USERNAME_CHANGE);
            expect(received.mock.calls[1][1].type).toBe(PRESENCE.CURSOR);

            const clientReceived = jest.fn();
            client.on('message', clientReceived);
            host.send(all[1].id, makeSnapshot(SNAPSHOT.CHUNK, {transferId: 't', index: 0, data: big.buffer}));
            const chunk = clientReceived.mock.calls[0][1];
            expect(Buffer.from(chunk.payload.data).equals(Buffer.from(big))).toBe(true);
            client.destroy();
            host.destroy();
        } finally {
            jest.useRealTimers();
        }
    });

    test('a direct channel that fails falls back to the relay at once', async () => {
        jest.useFakeTimers();
        try {
            const {all, host, client} = await setup();
            const joined = client.join('room1', {});
            all[1].simulateOpen();
            await flush();
            all[1].lastConnection.simulateError(new Error('ICE failed'));
            await joined;
            expect(client.connectionPath('host')).toBe('relay');
            client.destroy();
            host.destroy();
        } finally {
            jest.useRealTimers();
        }
    });

    test('a lost relay frame closes the link so the client rejoins', async () => {
        jest.useFakeTimers();
        try {
            const {broker, all, host, client} = await setup();
            const joined = client.join('room1', {});
            all[1].simulateOpen();
            await flush();
            jest.advanceTimersByTime(5000);
            await joined;
            const reconnecting = jest.fn();
            client.on('reconnecting', reconnecting);

            broker.paused = true;
            host.send(all[1].id, makeCtrl(CTRL.SESSION_READY, {}));
            host.send(all[1].id, makeCtrl(CTRL.SESSION_READY, {}));
            broker.queue.splice(0, 1);
            broker.paused = false;
            broker.flush();
            expect(reconnecting).toHaveBeenCalledTimes(1);
            expect(host.peers()).toEqual([]);
            client.destroy();
            host.destroy();
        } finally {
            jest.useRealTimers();
        }
    });

    test('data for a link the host never accepted is refused', async () => {
        jest.useFakeTimers();
        try {
            const {all, host, client} = await setup();
            const joined = client.join('room1', {});
            all[1].simulateOpen();
            await flush();
            jest.advanceTimersByTime(5000);
            await joined;
            const reconnecting = jest.fn();
            client.on('reconnecting', reconnecting);
            // The host reloads: it forgets every relay link.
            host._relayLinks.clear();
            host._connections.clear();
            client.sendToHost(makeCtrl(CTRL.HELLO, {}));
            expect(reconnecting).toHaveBeenCalledTimes(1);
            client.destroy();
            host.destroy();
        } finally {
            jest.useRealTimers();
        }
    });

    test('a client that needed the relay uses it first when redialing', async () => {
        jest.useFakeTimers();
        try {
            const {all, host, client} = await setup();
            const joined = client.join('room1', {});
            all[1].simulateOpen();
            await flush();
            jest.advanceTimersByTime(5000);
            await joined;
            host.closeConnection(all[1].id);
            await flush();
            jest.advanceTimersByTime(1000);
            await flush();
            const fresh = all[all.length - 1];
            fresh.simulateOpen();
            await flush();
            expect(fresh.connections).toHaveLength(0);
            expect(client.connectionPath('host')).toBe('relay');
            client.destroy();
            host.destroy();
        } finally {
            jest.useRealTimers();
        }
    });

    test('a broker socket that stops echoing probes is reconnected', async () => {
        jest.useFakeTimers();
        try {
            const {broker, all, host} = await setup();
            const offline = jest.fn();
            const online = jest.fn();
            host.on('broker-offline', offline);
            host.on('broker-online', online);
            jest.advanceTimersByTime(15000);
            expect(all[0].reconnectCalls).toBe(0);

            broker.paused = true;
            jest.advanceTimersByTime(15000);
            jest.advanceTimersByTime(15000);
            expect(offline).toHaveBeenCalledTimes(1);
            expect(all[0].reconnectCalls).toBe(1);

            // The reconnected socket delivers the probe sent after it.
            broker.paused = false;
            broker.flush();
            expect(online).toHaveBeenCalledTimes(1);
            host.destroy();
        } finally {
            jest.useRealTimers();
        }
    });

    test('relay traffic keeps the broker registration alive', async () => {
        jest.useFakeTimers();
        try {
            const {all, host, client} = await setup();
            const joined = client.join('room1', {});
            all[1].simulateOpen();
            await flush();
            jest.advanceTimersByTime(5000);
            await joined;
            const heartbeats = () => all[0].socket.sent.filter(m => m.type === 'HEARTBEAT').length;
            const before = heartbeats();
            jest.advanceTimersByTime(10000);
            client.sendToHost(makeCtrl(CTRL.HELLO, {}));
            expect(heartbeats()).toBe(before + 1);
            client.destroy();
            host.destroy();
        } finally {
            jest.useRealTimers();
        }
    });
});

describe('older clients', () => {
    test('a channel using PeerJS serialization can still be told about the mismatch', async () => {
        const {transport, peers} = makeTransport();
        const hosted = transport.host('room1');
        peers[0].simulateOpen();
        await hosted;
        const conn = peers[0].simulateIncomingConnection('old', {serialization: 'binary'});
        conn.simulateOpen();
        const mismatch = jest.fn();
        transport.on('version-mismatch', mismatch);
        conn.simulateData({v: 4, kind: KIND.CTRL, type: CTRL.HELLO, payload: {}});
        expect(mismatch).toHaveBeenCalledWith({peerId: 'old', version: 4, type: CTRL.HELLO});
        const denial = makeCtrl(CTRL.JOIN_DENIED, {reason: 'old'});
        transport.send('old', denial);
        expect(conn.sent).toEqual([denial]);
        expect(conn.frames).toEqual([]);
        transport.destroy();
    });
});

describe('connection lifecycle regressions', () => {
    test('late events from a replaced channel cannot disconnect or impersonate its replacement', async () => {
        const {transport, peers} = makeTransport();
        const hosted = transport.host('room1');
        peers[0].simulateOpen();
        await hosted;
        const disconnected = jest.fn();
        const message = jest.fn();
        transport.on('peer-disconnected', disconnected);
        transport.on('message', message);
        const old = peers[0].simulateIncomingConnection('client');
        old.simulateOpen();
        const replacement = peers[0].simulateIncomingConnection('client');
        replacement.simulateOpen();
        expect(old.closed).toBe(true);
        old.trigger('close');
        old.simulateError();
        old.simulateData(makeCtrl(CTRL.PING, {}));
        expect(transport.isOpen('client')).toBe(true);
        expect(disconnected).not.toHaveBeenCalled();
        expect(message).not.toHaveBeenCalled();
        expect(replacement.sent).toHaveLength(0);
        transport.destroy();
    });

    test('an error on an open client channel starts reconnecting immediately', async () => {
        jest.useFakeTimers();
        const {transport, peers} = makeTransport();
        try {
            const joined = transport.join('room1');
            peers[0].simulateOpen();
            await flush();
            peers[0].lastConnection.simulateOpen();
            await joined;
            const reconnecting = jest.fn();
            transport.on('reconnecting', reconnecting);
            peers[0].lastConnection.simulateError();
            expect(reconnecting).toHaveBeenCalledTimes(1);
            expect(peers[0].lastConnection.closed).toBe(true);
        } finally {
            transport.destroy();
            jest.useRealTimers();
        }
    });

    test('a failed broker handshake destroys its peer and ignores late broker events', async () => {
        jest.useFakeTimers();
        const {transport, peers} = makeTransport();
        try {
            const failed = expect(transport.host('room1')).rejects.toMatchObject({collabCode: 'SERVER_UNREACHABLE'});
            jest.advanceTimersByTime(15001);
            await failed;
            expect(peers[0].destroyed).toBe(true);
            expect(transport.peer).toBeNull();
            const fatal = jest.fn();
            transport.on('fatal', fatal);
            peers[0].simulateOpen();
            peers[0].trigger('error', new Error('late error'));
            peers[0].trigger('disconnected');
            expect(fatal).not.toHaveBeenCalled();
            expect(peers[0].reconnectCalls).toBe(0);
        } finally {
            transport.destroy();
            jest.useRealTimers();
        }
    });

    test('a channel closing before open rejects the join without waiting for timeout', async () => {
        const {transport, peers} = makeTransport();
        try {
            const joined = expect(transport.join('room1')).rejects.toMatchObject({collabCode: 'CONNECTION_CLOSED'});
            peers[0].simulateOpen();
            await flush();
            peers[0].lastConnection.close();
            await joined;
        } finally {
            transport.destroy();
        }
    });
});

describe('host cleanup and background tab recovery', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    test('a host discards channels that never open and ignores late opens', async () => {
        const {transport, peers} = makeTransport();
        try {
            const hosted = transport.host('room1');
            peers[0].simulateOpen();
            await hosted;
            const connected = jest.fn();
            transport.on('peer-connected', connected);
            const pending = peers[0].simulateIncomingConnection('client');
            jest.advanceTimersByTime(15001);
            expect(pending.closed).toBe(true);
            pending.simulateOpen();
            expect(transport.isOpen('client')).toBe(false);
            expect(connected).not.toHaveBeenCalled();
        } finally {
            transport.destroy();
        }
    });

    test('waking a suspended tab allows a fresh heartbeat before disconnecting peers', async () => {
        const {transport, peers} = makeTransport();
        try {
            const hosted = transport.host('room1');
            peers[0].simulateOpen();
            await hosted;
            const client = peers[0].simulateIncomingConnection('client');
            client.simulateOpen();
            jest.setSystemTime(Date.now() + 120000);
            jest.advanceTimersByTime(10000);
            expect(transport.isOpen('client')).toBe(true);
            expect(client.sent.some(data => data.type === CTRL.PING)).toBe(true);
            jest.advanceTimersByTime(40000);
            expect(transport.isOpen('client')).toBe(false);
        } finally {
            transport.destroy();
        }
    });
});
