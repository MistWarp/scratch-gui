import {Transport, generateHostPeerId} from '../../../src/lib/collaboration/transport.js';
import {makeCtrl, CTRL} from '../../../src/lib/collaboration/protocol.js';
import {FakePeer, FakeBroker} from '../../fixtures/fake-peerjs.js';

const flush = async (ticks = 10) => {
    for (let i = 0; i < ticks; i++) {
        await Promise.resolve();
    }
};

const setup = async () => {
    const broker = new FakeBroker();
    const all = [];
    const create = (id, config) => {
        const peer = new FakePeer(id, config).enableRelay(broker);
        all.push(peer);
        return peer;
    };
    const host = new Transport({createPeer: create, relayFallbackMs: 5000});
    const hosted = host.host('room1');
    all[0].simulateOpen();
    await hosted;
    const client = new Transport({createPeer: create, relayFallbackMs: 5000});
    return {broker, all, host, client};
};

// Joins over the relay: the direct channel never opens.
const joinRelayed = async ({all, client}) => {
    const joined = client.join('room1', {username: 'bob'});
    all[1].simulateOpen();
    await flush();
    const direct = all[1].lastConnection;
    jest.advanceTimersByTime(5000);
    await joined;
    return direct;
};

describe('transport reconnection', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    test('an abandoned direct channel that opens late does not replace the relay', async () => {
        const {all, host, client} = await setup();
        await joinRelayed({all, client});
        const clientId = all[1].id;
        expect(host.connectionPath(clientId)).toBe('relay');
        const disconnected = jest.fn();
        host.on('peer-disconnected', disconnected);

        // The host side of the direct attempt opens after the client
        // gave up on it.
        const late = all[0].simulateIncomingConnection(clientId, {metadata: {username: 'bob'}});
        late.simulateOpen();

        expect(late.closed).toBe(true);
        expect(host.connectionPath(clientId)).toBe('relay');
        expect(client.connectionPath('host')).toBe('relay');
        expect(disconnected).not.toHaveBeenCalled();
        const received = jest.fn();
        host.on('message', received);
        client.sendToHost(makeCtrl(CTRL.USERNAME_CHANGE, {username: 'bob'}));
        expect(received).toHaveBeenCalledTimes(1);
        client.destroy();
        host.destroy();
    });

    test('a redial whose relay is refused tries a direct channel next', async () => {
        const {all, host, client} = await setup();
        await joinRelayed({all, client});
        const reasons = [];
        client.on('reconnecting', ({reason}) => reasons.push(reason));

        // The host forgets the client and refuses the next relay link.
        host.closeConnection(all[1].id);
        const accept = host._acceptRelay;
        host._acceptRelay = (peer, src, linkId) => host._signal(peer, src, {op: 'close', link: linkId});

        jest.advanceTimersByTime(1000);
        await flush();
        const relayOnly = all[all.length - 1];
        relayOnly.simulateOpen();
        await flush();
        // Relay first, so no direct attempt.
        expect(relayOnly.connections).toHaveLength(0);
        await flush();
        expect(reasons).toEqual(['CONNECTION_LOST', 'CONNECTION_CLOSED']);

        host._acceptRelay = accept;
        jest.advanceTimersByTime(2000);
        await flush();
        const retry = all[all.length - 1];
        expect(retry).not.toBe(relayOnly);
        retry.simulateOpen();
        await flush();
        expect(retry.connections).toHaveLength(1);
        retry.lastConnection.simulateOpen();
        await flush();
        expect(client.connectionPath('host')).toBe('direct');
        client.destroy();
        host.destroy();
    });

    test('reconnecting reports when the broker says the host is missing', async () => {
        const peers = [];
        const transport = new Transport({
            createPeer: (id, config) => {
                const peer = new FakePeer(id, config);
                peers.push(peer);
                return peer;
            }
        });
        const joined = transport.join('room1', {});
        peers[0].simulateOpen();
        await flush();
        peers[0].lastConnection.simulateOpen();
        await joined;
        const events = [];
        transport.on('reconnecting', info => events.push(info));
        peers[0].lastConnection.close();
        jest.advanceTimersByTime(1000);
        await flush();
        peers[1].simulateOpen();
        await flush();
        peers[1].trigger('error', Object.assign(new Error('Could not connect to peer'), {type: 'peer-unavailable'}));
        await flush();
        expect(events).toEqual([
            {attempt: 1, delayMs: 1000, reason: 'CONNECTION_LOST'},
            {attempt: 2, delayMs: 2000, reason: 'ROOM_NOT_FOUND'}
        ]);
        expect(peers[1].lastConnection.peer).toBe(generateHostPeerId('room1'));
        transport.destroy();
    });

    test('time spent asleep does not count towards giving up', async () => {
        const peers = [];
        const transport = new Transport({
            createPeer: (id, config) => {
                const peer = new FakePeer(id, config);
                peers.push(peer);
                return peer;
            }
        });
        const joined = transport.join('room1', {});
        peers[0].simulateOpen();
        await flush();
        peers[0].lastConnection.simulateOpen();
        await joined;
        const fatal = jest.fn();
        const reconnecting = jest.fn();
        transport.on('fatal', fatal);
        transport.on('reconnecting', reconnecting);
        peers[0].lastConnection.close();

        // The laptop lid closes for ten minutes while the first redial waits.
        jest.setSystemTime(Date.now() + (10 * 60 * 1000));
        jest.advanceTimersByTime(1000);
        await flush();
        peers[1].simulateOpen();
        await flush();
        peers[1].lastConnection.simulateError(new Error('still waking up'));
        await flush();
        expect(fatal).not.toHaveBeenCalled();
        expect(reconnecting).toHaveBeenCalledTimes(2);
        transport.destroy();
    });

    test('a broker retry left over from the old peer does not block the new one', async () => {
        const {all, host, client} = await setup();
        const joined = client.join('room1', {});
        all[1].simulateOpen();
        await flush();
        all[1].lastConnection.simulateOpen();
        await joined;

        // The old peer keeps losing the broker, so a retry is waiting.
        for (const delay of [0, 0, 1000]) {
            jest.advanceTimersByTime(delay);
            all[1].disconnected = true;
            all[1].trigger('disconnected');
        }
        expect(all[1].reconnectCalls).toBe(2);

        all[1].lastConnection.close();
        jest.advanceTimersByTime(1000);
        await flush();
        const fresh = all[all.length - 1];
        fresh.simulateOpen();
        await flush();
        fresh.trigger('disconnected');
        expect(fresh.reconnectCalls).toBe(1);
        client.destroy();
        host.destroy();
    });
});

describe('hosting a room whose id the broker still holds', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    const makeHost = () => {
        const peers = [];
        const transport = new Transport({
            createPeer: (id, config) => {
                const peer = new FakePeer(id, config);
                peers.push(peer);
                return peer;
            }
        });
        return {transport, peers};
    };
    const taken = peer => peer.trigger('error', Object.assign(new Error('taken'), {type: 'unavailable-id'}));

    test('registers once the old registration expires', async () => {
        const {transport, peers} = makeHost();
        const waits = [];
        transport.on('host-id-taken', info => waits.push(info));
        const hosted = transport.host('room1');
        taken(peers[0]);
        await flush();
        expect(peers[0].destroyed).toBe(true);
        expect(waits).toEqual([{attempt: 1, delayMs: 2000}]);
        jest.advanceTimersByTime(2000);
        await flush();
        expect(peers).toHaveLength(2);
        expect(peers[1].id).toBe(generateHostPeerId('room1'));
        taken(peers[1]);
        await flush();
        jest.advanceTimersByTime(4000);
        await flush();
        peers[2].simulateOpen();
        await expect(hosted).resolves.toBe(generateHostPeerId('room1'));
        expect(waits.map(info => info.delayMs)).toEqual([2000, 4000]);
        transport.destroy();
    });

    test('reports the room as taken after about a minute', async () => {
        const {transport, peers} = makeHost();
        const start = Date.now();
        const hosted = transport.host('room1');
        const outcome = {error: null};
        hosted.catch(e => {
            outcome.error = e;
        });
        for (let i = 0; i < 20 && !outcome.error; i++) {
            taken(peers[peers.length - 1]);
            await flush();
            jest.advanceTimersByTime(10000);
            await flush();
        }
        expect(outcome.error).not.toBeNull();
        expect(outcome.error.collabCode).toBe('ROOM_TAKEN');
        expect(Date.now() - start).toBeGreaterThanOrEqual(70000);
        expect(peers.length).toBeLessThan(15);
        transport.destroy();
    });

    test('closing while waiting stops the retries', async () => {
        const {transport, peers} = makeHost();
        const hosted = transport.host('room1');
        taken(peers[0]);
        await flush();
        transport.destroy();
        await expect(hosted).rejects.toMatchObject({collabCode: 'CONNECTION_CANCELLED'});
        jest.advanceTimersByTime(100000);
        await flush();
        expect(peers).toHaveLength(1);
    });
});
