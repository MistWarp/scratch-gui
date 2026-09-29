import {createRoom, DocApplier, FakeCollabTransport} from '../../fixtures/collab-harness.js';
import ClientSession from '../../../src/lib/collaboration/client-session.js';
import HostSession from '../../../src/lib/collaboration/host-session.js';
import {OP, CTRL, KIND, PROTOCOL_VERSION, makeCtrl, makePropose} from '../../../src/lib/collaboration/protocol.js';

const createBlock = (targetId, blockId) => ({targetId, event: {type: 'create', blockId}});

const sentTo = (spy, peerId, type) => spy.mock.calls
    .filter(([to, envelope]) => to === peerId && envelope.type === type)
    .map(([, envelope]) => envelope);

const rejoin = async (room, client, suffix = 'rejoin') => {
    const applier = new DocApplier();
    applier.loadSnapshot(client.applier.snapshot());
    const transport = new FakeCollabTransport(room.hub, `${client.id}-${suffix}`);
    const session = new ClientSession({transport, applier, roomId: 'room', username: client.username});
    session.lastAppliedSeq = client.session.lastAppliedSeq;
    session._epoch = client.session._epoch;
    session._reconnectToken = client.session._reconnectToken;
    room.clientsById.set(transport.id, {session, applier, transport, id: transport.id, username: client.username});
    await session.connect();
    await room.hub.flush();
    return {session, applier, transport, id: transport.id};
};

describe('host restarts', () => {
    test('opsSince refuses positions beyond the host log', async () => {
        const room = await createRoom({clientCount: 0});
        room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'a'));
        await room.hub.flush();
        expect(room.host.session.opsSince(room.host.session.seq + 1)).toEqual([]);
        expect(room.host.session.opsSince(room.host.session.seq + 5)).toBeNull();
        room.destroy();
    });

    test('a client that reconnects to a new host instance reloads instead of skipping ops', async () => {
        const room = await createRoom({clientCount: 1});
        const client = room.clients[0];
        for (let i = 0; i < 5; i++) room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', `old-${i}`));
        await room.hub.flush();
        expect(client.session.lastAppliedSeq).toBe(5);

        const restarted = jest.fn();
        client.session.on('host-restarted', restarted);
        room.host.session.epoch = 'a-new-host-instance';
        room.host.session.seq = 0;
        room.host.session.opLog = [];
        client.session.isApproved = false;
        client.session._sendHello();
        await room.hub.flush();

        expect(restarted).toHaveBeenCalledTimes(1);
        expect(client.session._epoch).toBe('a-new-host-instance');
        expect(client.session.lastAppliedSeq).toBeNull();
        client.applier.loadSnapshot(room.host.applier.doc);
        client.session.setBaseSeq(room.host.session.seq);
        room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'after-restart'));
        await room.hub.flush();
        expect(client.applier.snapshot()).toEqual(room.host.applier.snapshot());
        room.destroy();
    });

    test('loading another project on the host makes every client reload', async () => {
        const room = await createRoom({clientCount: 2});
        const send = jest.spyOn(room.host.transport, 'send');
        room.host.session.restartHistory();
        room.clients.forEach(client => {
            expect(sentTo(send, client.id, CTRL.RESYNC_REQUIRED)).toHaveLength(1);
        });
        expect(room.host.session.opsSince(0)).toBeNull();
        room.destroy();
    });
});

describe('private rooms', () => {
    test('the host tells a waiting guest that approval is pending', async () => {
        const room = await createRoom({clientCount: 0, privacy: 'private'});
        const client = await room.addClient('waiting');
        const pending = jest.fn();
        client.session.on('join-pending', pending);
        await room.hub.flush();
        expect(pending).toHaveBeenCalledTimes(1);
        expect(room.host.session.getPendingJoinRequests()).toHaveLength(1);
        room.destroy();
    });

    test('a guest who reconnects with its token skips approval', async () => {
        const room = await createRoom({clientCount: 0, privacy: 'private'});
        const client = await room.addClient('anna');
        await room.hub.flush();
        room.host.session.approveJoinRequest(client.id);
        await room.hub.flush();
        expect(client.session.isApproved).toBe(true);

        room.hub.enqueueClose(client.id);
        await room.hub.flush();
        const again = await rejoin(room, client);
        expect(again.session.isApproved).toBe(true);
        expect(room.host.session.getPendingJoinRequests()).toHaveLength(0);
        again.session.destroy();
        room.destroy();
    });

    test('a reconnect token only works once', async () => {
        const room = await createRoom({clientCount: 0, privacy: 'private'});
        const client = await room.addClient('anna');
        await room.hub.flush();
        room.host.session.approveJoinRequest(client.id);
        await room.hub.flush();
        room.hub.enqueueClose(client.id);
        await room.hub.flush();
        const first = await rejoin(room, client, 'first');
        const second = await rejoin(room, client, 'second');
        expect(first.session.isApproved).toBe(true);
        expect(second.session.isApproved).toBe(false);
        first.session.destroy();
        second.session.destroy();
        room.destroy();
    });
});

describe('kicking', () => {
    test('a kicked guest cannot rejoin with its token or peer id', async () => {
        const room = await createRoom({clientCount: 1});
        const client = room.clients[0];
        const token = client.session._reconnectToken;
        room.host.session.kickUser(client.id);
        await room.hub.flush();

        const denied = jest.fn();
        const transport = new FakeCollabTransport(room.hub, `${client.id}-back`);
        const session = new ClientSession({transport, applier: new DocApplier(), roomId: 'room', username: 'anna'});
        session._epoch = room.host.session.epoch;
        session._reconnectToken = token;
        session.on('join-denied', denied);
        await session.connect();
        await room.hub.flush();
        expect(denied).toHaveBeenCalledWith('The host removed you from this room.');
        expect(session.isApproved).toBe(false);
        session.destroy();
        room.destroy();
    });
});

describe('proposals and readiness', () => {
    test('a proposal from someone outside the room is rejected, not ignored', async () => {
        const room = await createRoom({clientCount: 0, privacy: 'private'});
        const client = await room.addClient('waiting');
        await room.hub.flush();
        const send = jest.spyOn(room.host.transport, 'send');
        room.host.transport.emit('message', client.id, makePropose(OP.BLOCK_EVENT, createBlock('stage', 'x'), 1));
        expect(send.mock.calls.some(([to, envelope]) => to === client.id && envelope.kind === KIND.REJECT))
            .toBe(true);
        room.destroy();
    });

    test('session-ready goes to each client when it finishes, not when everyone does', async () => {
        const room = await createRoom({clientCount: 1, autoSnapshot: false});
        const [client] = room.clients;
        const send = jest.spyOn(room.host.transport, 'send');
        room.host.session.markClientSynced(client.id);
        expect(sentTo(send, client.id, CTRL.SESSION_READY)).toHaveLength(1);
        room.destroy();
    });

    test('a slow edit is cancelled so it does not block the room', async () => {
        jest.useFakeTimers();
        try {
            const room = await createRoom({clientCount: 0});
            room.host.applier.apply = () => new Promise(() => {});
            const result = room.host.session.submitLocal(OP.BLOCK_EVENT, createBlock('stage', 'slow'));
            const outcome = result.then(() => 'applied', error => error.message);
            await Promise.resolve();
            await Promise.resolve();
            jest.advanceTimersByTime(20001);
            await expect(outcome).resolves.toMatch(/took too long/);
            room.destroy();
        } finally {
            jest.useRealTimers();
        }
    });
});

describe('onboarding under load', () => {
    test('a buffer overflow before the snapshot lands asks for a replay instead of restarting', async () => {
        const room = await createRoom({clientCount: 0, autoSnapshot: false});
        const client = await room.addClient('slow');
        await room.hub.flush();
        const resync = jest.fn();
        client.session.on('resync-needed', resync);
        const toHost = jest.spyOn(client.transport, 'sendToHost');
        for (let seq = 1; seq <= 5001; seq++) {
            client.session._onOp({kind: KIND.OP,
                type: OP.BLOCK_EVENT,
                seq,
                clientId: 'x',
                clientOpId: seq,
                payload: createBlock('stage', `b${seq}`)});
        }
        expect(resync).not.toHaveBeenCalled();
        client.session.setBaseSeq(0);
        expect(toHost.mock.calls.some(([envelope]) => envelope.type === CTRL.OPS_REQUEST &&
            envelope.payload.fromSeq === 1)).toBe(true);
        room.destroy();
    });
});

describe('versions', () => {
    test('a hello from another protocol version is answered in that version', () => {
        const transport = new FakeCollabTransport({registerHost () {}}, 'host');
        const sent = [];
        transport.send = (peerId, envelope) => {
            sent.push({peerId, envelope});
            return true;
        };
        transport.closeConnection = () => Promise.resolve();
        transport.host = () => Promise.resolve('host');
        const session = new HostSession({transport, applier: new DocApplier(), roomId: 'room', username: 'h'});
        return session.start().then(() => {
            transport.emit('version-mismatch', {peerId: 'old', version: PROTOCOL_VERSION - 1, type: CTRL.HELLO});
            expect(sent).toHaveLength(1);
            expect(sent[0].envelope.type).toBe(CTRL.JOIN_DENIED);
            expect(sent[0].envelope.v).toBe(PROTOCOL_VERSION - 1);
            session.destroy();
        });
    });

    test('a client that hears nothing back gives up with a version hint', async () => {
        jest.useFakeTimers();
        try {
            const transport = new FakeCollabTransport({registerClient () {}}, 'guest');
            transport.join = () => Promise.resolve('guest');
            transport.sendToHost = () => true;
            const session = new ClientSession({transport, applier: new DocApplier(), roomId: 'room', username: 'g'});
            const failed = jest.fn();
            session.on('connection-failed', failed);
            await session.connect();
            jest.advanceTimersByTime(15001);
            expect(failed).toHaveBeenCalledTimes(1);
            expect(failed.mock.calls[0][0].error).toMatch(/different versions/);
            session.destroy();
        } finally {
            jest.useRealTimers();
        }
    });

    test('hearing that approval is pending stops the no-answer timer', async () => {
        jest.useFakeTimers();
        try {
            const transport = new FakeCollabTransport({registerClient () {}}, 'guest');
            transport.join = () => Promise.resolve('guest');
            transport.sendToHost = () => true;
            const session = new ClientSession({transport, applier: new DocApplier(), roomId: 'room', username: 'g'});
            const failed = jest.fn();
            session.on('connection-failed', failed);
            await session.connect();
            transport.emit('message', 'host', makeCtrl(CTRL.JOIN_PENDING, {}));
            jest.advanceTimersByTime(60000);
            expect(failed).not.toHaveBeenCalled();
            session.destroy();
        } finally {
            jest.useRealTimers();
        }
    });

    test('a host that closes the room ends the session instead of reconnecting forever', () => {
        const transport = new FakeCollabTransport({registerClient () {}}, 'guest');
        transport.join = () => Promise.resolve('guest');
        transport.sendToHost = () => true;
        const session = new ClientSession({transport, applier: new DocApplier(), roomId: 'room', username: 'g'});
        const left = jest.fn();
        session.on('host-left', left);
        return session.connect().then(() => {
            const error = new Error('gone');
            error.collabCode = 'HOST_GONE';
            transport.emit('fatal', {error});
            expect(left).toHaveBeenCalledTimes(1);
            session.destroy();
        });
    });
});

describe('closing the room', () => {
    test('announceClose tells guests the room is over', async () => {
        const room = await createRoom({clientCount: 1});
        const [guest] = room.clients;
        const send = jest.spyOn(room.host.transport, 'send');
        room.host.session.announceClose();
        expect(sentTo(send, guest.id, CTRL.USER_LEFT)).toHaveLength(1);
        room.destroy();
    });

    test('announceClose turns away people still waiting for approval', async () => {
        const room = await createRoom({clientCount: 0, privacy: 'private'});
        const waiting = await room.addClient('waiting');
        await room.hub.flush();
        const send = jest.spyOn(room.host.transport, 'send');
        room.host.session.announceClose();
        expect(sentTo(send, waiting.id, CTRL.JOIN_DENIED)).toHaveLength(1);
        room.destroy();
    });
});

test('makeCtrl envelopes carry the current protocol version', () => {
    expect(makeCtrl(CTRL.PING, {}).v).toBe(PROTOCOL_VERSION);
});
