import {
    Transport,
    generateHostPeerId,
    generateClientPeerId
} from '../../../src/lib/collaboration/transport.js';
import {makeCtrl, makePresence, CTRL, PRESENCE, KIND} from '../../../src/lib/collaboration/protocol.js';
import {FakePeer} from '../../fixtures/fake-peerjs.js';

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
            jest.runTimersToTime(15001);
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
            jest.runTimersToTime(10000);
            expect(conn.sent.some(m => m.type === CTRL.PING)).toBe(true);
            expect(gone).not.toHaveBeenCalled();

            // No inbound data for > deadPeerTimeoutMs
            now += 31000;
            jest.runTimersToTime(31000);
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
                jest.runTimersToTime(10000);
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

    test('losing the host connection schedules a redial with backoff', async () => {
        jest.useFakeTimers();
        try {
            const {transport, peers} = await openClient();
            const reconnecting = jest.fn();
            const reconnected = jest.fn();
            transport.on('reconnecting', reconnecting);
            transport.on('reconnected', reconnected);

            peers[0].lastConnection.close();
            expect(reconnecting).toHaveBeenCalledWith({attempt: 1, delayMs: 1000});

            jest.runTimersToTime(1000);
            await flush();
            const redialConn = peers[0].lastConnection;
            expect(redialConn.peer).toBe(generateHostPeerId('room1'));
            redialConn.simulateOpen();
            await flush();
            expect(reconnected).toHaveBeenCalled();
            transport.destroy();
        } finally {
            jest.useRealTimers();
        }
    });

    test('gives up with fatal after max attempts', async () => {
        jest.useFakeTimers();
        try {
            const {transport, peers} = await openClient();
            const fatal = jest.fn();
            const reconnecting = jest.fn();
            transport.on('fatal', fatal);
            transport.on('reconnecting', reconnecting);

            peers[0].lastConnection.close();
            for (let attempt = 1; attempt <= 10; attempt++) {
                jest.runTimersToTime(16000);
                await flush();
                if (attempt < 10) {
                    peers[0].lastConnection.simulateError(new Error('still down'));
                    await flush();
                } else {
                    peers[0].lastConnection.simulateError(new Error('still down'));
                    await flush();
                }
            }
            expect(reconnecting).toHaveBeenCalledTimes(10);
            expect(fatal).toHaveBeenCalledTimes(1);
            transport.destroy();
        } finally {
            jest.useRealTimers();
        }
    });

    test('backoff delay grows exponentially and caps at 16s', async () => {
        jest.useFakeTimers();
        try {
            const {transport, peers} = await openClient();
            const delays = [];
            transport.on('reconnecting', ({delayMs}) => delays.push(delayMs));

            peers[0].lastConnection.close();
            for (let i = 0; i < 6; i++) {
                jest.runTimersToTime(16000);
                await flush();
                peers[0].lastConnection.simulateError(new Error('down'));
                await flush();
            }
            expect(delays.slice(0, 6)).toEqual([1000, 2000, 4000, 8000, 16000, 16000]);
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
            jest.runTimersToTime(60000);
            await flush();
            // No further dials happened after destroy
            expect(peers[0].connections.length).toBe(1);
        } finally {
            jest.useRealTimers();
        }
    });
});
