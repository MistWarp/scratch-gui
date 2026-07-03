import {createRoom, DocApplier, FakeCollabTransport} from '../../fixtures/collab-harness.js';
import ClientSession from '../../../src/lib/collaboration/client-session.js';
import {OP, CTRL, KIND} from '../../../src/lib/collaboration/protocol.js';

const blockEvent = (targetId, event) => ({targetId, event});
const createBlock = (targetId, blockId) => blockEvent(targetId, {type: 'create', blockId});
const changeField = (targetId, blockId, value) => blockEvent(targetId, {
    type: 'change', blockId, element: 'field', name: 'NUM', newValue: value
});
const moveBlock = (targetId, blockId, x, y) => blockEvent(targetId, {
    type: 'move', blockId, newCoordinate: {x, y}
});

describe('join flow', () => {
    test('public room: three clients join, everyone sees the same user list', async () => {
        const room = await createRoom({clientCount: 3});
        const {host, clients} = room;

        expect(host.session.getUsers()).toHaveLength(4);
        clients.forEach(client => {
            expect(client.session.isApproved).toBe(true);
            expect(client.session.getUsers().map(u => u.id).sort())
                .toEqual(host.session.getUsers().map(u => u.id).sort());
        });
        room.destroy();
    });

    test('session-ready fires once all joiners are synced', async () => {
        const room = await createRoom({clientCount: 0});
        const ready = jest.fn();
        room.host.session.on('session-ready', ready);

        await room.addClient('anna');
        await room.addClient('ben');
        room.hub.flush();

        expect(ready).toHaveBeenCalled();
        room.destroy();
    });

    test('two joiners in the same instant both get onboarded', async () => {
        const room = await createRoom({clientCount: 0});
        const snapshotRequests = [];
        room.host.session.on('snapshot-needed', ({peerId}) => snapshotRequests.push(peerId));

        // Neither hello is delivered until flush — the old engine's global
        // 1s cooldown would drop the second one.
        const clientA = await room.addClient('anna');
        const clientB = await room.addClient('ben');
        room.hub.flush();

        expect(snapshotRequests).toContain(clientA.id);
        expect(snapshotRequests).toContain(clientB.id);
        expect(clientA.session.lastAppliedSeq).not.toBeNull();
        expect(clientB.session.lastAppliedSeq).not.toBeNull();
        room.destroy();
    });

    test('private room queues joins for approval', async () => {
        const room = await createRoom({clientCount: 0, privacy: 'private'});
        const requests = [];
        room.host.session.on('join-request-received', request => requests.push(request));

        const client = await room.addClient('anna');
        const approved = jest.fn();
        const denied = jest.fn();
        client.session.on('join-approved', approved);
        client.session.on('join-denied', denied);
        room.hub.flush();

        expect(requests).toEqual([{requesterId: client.id, requesterUsername: 'anna'}]);
        expect(approved).not.toHaveBeenCalled();
        expect(room.host.session.getPendingJoinRequests()).toHaveLength(1);

        room.host.session.approveJoinRequest(client.id);
        room.hub.flush();
        expect(approved).toHaveBeenCalled();
        expect(client.session.isApproved).toBe(true);
        expect(denied).not.toHaveBeenCalled();
        room.destroy();
    });

    test('private room: denial reaches the requester', async () => {
        const room = await createRoom({clientCount: 0, privacy: 'private'});
        const client = await room.addClient('anna');
        const denied = jest.fn();
        client.session.on('join-denied', denied);
        room.hub.flush();

        room.host.session.denyJoinRequest(client.id, 'not today');
        room.hub.flush();
        expect(denied).toHaveBeenCalledWith('not today');
        expect(room.host.session.getPendingJoinRequests()).toHaveLength(0);
        room.destroy();
    });

    test('cancelling a join request removes it from the host queue', async () => {
        const room = await createRoom({clientCount: 0, privacy: 'private'});
        const cancelled = jest.fn();
        room.host.session.on('join-request-cancelled', cancelled);

        const client = await room.addClient('anna');
        room.hub.flush();
        client.session.cancelJoinRequest();
        room.hub.flush();

        expect(cancelled).toHaveBeenCalledWith({
            requesterId: client.id,
            requesterUsername: 'anna'
        });
        expect(room.host.session.getPendingJoinRequests()).toHaveLength(0);
        room.destroy();
    });

    test('switching a private room to public admits everyone waiting', async () => {
        const room = await createRoom({clientCount: 0, privacy: 'private'});
        const clientA = await room.addClient('anna');
        const clientB = await room.addClient('ben');
        room.hub.flush();
        expect(room.host.session.getPendingJoinRequests()).toHaveLength(2);

        room.host.session.changeRoomPrivacy('public');
        room.hub.flush();
        expect(clientA.session.isApproved).toBe(true);
        expect(clientB.session.isApproved).toBe(true);
        room.destroy();
    });

    test('a hello with the wrong protocol version is denied', async () => {
        const room = await createRoom({clientCount: 0});
        const applier = new DocApplier();
        const transport = new FakeCollabTransport(room.hub, 'old-client');
        const session = new ClientSession({
            transport, applier, roomId: 'room', username: 'old'
        });
        const denied = jest.fn();
        session.on('join-denied', denied);
        await session.connect();
        // Sabotage: rewrite the queued hello to claim an old version.
        const hello = room.hub.queue.find(item =>
            item.envelope && item.envelope.type === CTRL.HELLO && item.from === 'old-client');
        hello.envelope.payload.protocolVersion = 0;
        room.hub.flush();

        expect(denied).toHaveBeenCalledWith(expect.stringMatching(/version/));
        expect(room.host.session.getUsers()).toHaveLength(1);
        session.destroy();
        room.destroy();
    });
});

describe('op sequencing and convergence', () => {
    test('a client edit reaches every peer', async () => {
        const room = await createRoom({clientCount: 3});
        room.edit(room.clients[0], OP.BLOCK_EVENT, createBlock('stage', 'b1'));
        room.hub.flush();
        room.expectConverged();
        expect(room.host.session.seq).toBe(1);
        room.destroy();
    });

    test('a host edit reaches every client', async () => {
        const room = await createRoom({clientCount: 2});
        room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'b1'));
        room.hub.flush();
        room.expectConverged();
        room.destroy();
    });

    test('own echoes are confirmed, not re-applied, and pending queues drain', async () => {
        const room = await createRoom({clientCount: 2});
        const clientA = room.clients[0];
        const applied = jest.fn();
        clientA.session.on('op-applied', applied);

        room.edit(clientA, OP.BLOCK_EVENT, createBlock('stage', 'b1'));
        expect(clientA.session.pendingOps).toHaveLength(1);
        room.hub.flush();

        // Own op came back but was skipped (echo), so no op-applied event.
        expect(applied).not.toHaveBeenCalled();
        expect(clientA.session.pendingOps).toHaveLength(0);
        room.expectConverged();
        room.destroy();
    });

    test('canonical race: two clients editing the same field converge everywhere', async () => {
        const room = await createRoom({clientCount: 3});
        const [clientA, clientB, clientC] = room.clients;
        room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'b1'));
        room.hub.flush();

        // Both edits happen "simultaneously" — neither has seen the other.
        room.edit(clientA, OP.BLOCK_EVENT, changeField('stage', 'b1', '20'));
        room.edit(clientB, OP.BLOCK_EVENT, changeField('stage', 'b1', '30'));
        expect(clientA.applier.doc.blocks['stage:b1'].fields['field:NUM']).toBe('20');
        expect(clientB.applier.doc.blocks['stage:b1'].fields['field:NUM']).toBe('30');

        room.hub.flush();

        // Host received A first, then B: last write in host order wins.
        const finalValue = room.host.applier.doc.blocks['stage:b1'].fields['field:NUM'];
        expect(finalValue).toBe('30');
        room.expectConverged();
        [clientA, clientB, clientC].forEach(client => {
            expect(client.session.pendingOps).toHaveLength(0);
        });
        room.destroy();
    });

    test('reversed host arrival order also converges (B then A)', async () => {
        const room = await createRoom({clientCount: 2});
        const [clientA, clientB] = room.clients;
        room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'b1'));
        room.hub.flush();

        room.edit(clientA, OP.BLOCK_EVENT, changeField('stage', 'b1', '20'));
        room.edit(clientB, OP.BLOCK_EVENT, changeField('stage', 'b1', '30'));
        // Deliver B's proposal to the host before A's.
        room.hub.reorderLastToFront();
        room.hub.flush();

        expect(room.host.applier.doc.blocks['stage:b1'].fields['field:NUM']).toBe('20');
        room.expectConverged();
        room.destroy();
    });

    test('concurrent move and field edit on the same block both survive', async () => {
        const room = await createRoom({clientCount: 2});
        const [clientA, clientB] = room.clients;
        room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'b1'));
        room.hub.flush();

        room.edit(clientA, OP.BLOCK_EVENT, moveBlock('stage', 'b1', 100, 50));
        room.edit(clientB, OP.BLOCK_EVENT, changeField('stage', 'b1', '7'));
        room.hub.flush();

        const hostBlock = room.host.applier.doc.blocks['stage:b1'];
        expect(hostBlock.pos).toEqual({x: 100, y: 50});
        expect(hostBlock.fields['field:NUM']).toBe('7');
        room.expectConverged();
        room.destroy();
    });

    test('delete vs concurrent edit converges: the block stays deleted', async () => {
        const room = await createRoom({clientCount: 3});
        const [clientA, clientB] = room.clients;
        room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'b1'));
        room.hub.flush();

        room.edit(clientA, OP.BLOCK_EVENT, blockEvent('stage', {type: 'delete', blockId: 'b1'}));
        room.edit(clientB, OP.BLOCK_EVENT, changeField('stage', 'b1', '99'));
        room.hub.flush();

        expect(room.host.applier.doc.blocks['stage:b1']).toBeUndefined();
        room.expectConverged();
        room.destroy();
    });

    test('a long interleaved editing session converges for 4 peers', async () => {
        const room = await createRoom({clientCount: 3});
        const peers = [room.host].concat(room.clients);
        peers.forEach((peer, index) => {
            room.edit(peer, OP.BLOCK_EVENT, createBlock('stage', `b${index}`));
        });
        room.hub.flush();

        for (let round = 0; round < 10; round++) {
            peers.forEach((peer, index) => {
                room.edit(peer, OP.BLOCK_EVENT,
                    changeField('stage', `b${(index + round) % peers.length}`, `${round}-${index}`));
                room.edit(peer, OP.BLOCK_EVENT,
                    moveBlock('stage', `b${index}`, round * 10, index * 10));
            });
            if (round % 3 === 0) room.hub.reorderLastToFront();
            room.hub.flush();
        }
        room.expectConverged();
        expect(room.host.session.seq).toBe(4 + 10 * 4 * 2);
        room.destroy();
    });
});

describe('rejects', () => {
    test('an invalid proposal is rejected without consuming a seq', async () => {
        const room = await createRoom({clientCount: 2});
        const [clientA, clientB] = room.clients;
        const rejected = jest.fn();
        clientA.session.on('op-rejected', rejected);

        // Bypass room.edit so the local doc isn't corrupted: propose
        // deleting a sprite that doesn't exist.
        clientA.session.submitLocal(OP.SPRITE_DELETE, {targetId: 'ghost'});
        room.hub.flush();

        expect(rejected).toHaveBeenCalledWith({
            clientOpId: 1,
            reason: expect.stringMatching(/no such target/)
        });
        expect(clientA.session.pendingOps).toHaveLength(0);
        expect(room.host.session.seq).toBe(0);
        expect(clientB.session.lastAppliedSeq).toBe(0);
        room.expectConverged();
        room.destroy();
    });
});

describe('gap recovery', () => {
    test('a dropped op is replayed after the gap timer fires', async () => {
        jest.useFakeTimers();
        try {
            const room = await createRoom({clientCount: 2});
            const [clientA, clientB] = room.clients;

            room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'b1'));
            room.hub.flush();

            // Drop the next op broadcast to clientB only.
            room.edit(room.host, OP.BLOCK_EVENT, changeField('stage', 'b1', '5'));
            const dropped = room.hub.dropNext(item =>
                item.to === clientB.id && item.envelope.kind === KIND.OP);
            expect(dropped).not.toBeNull();
            room.hub.flush();

            // A third op arrives out of order at clientB and gets buffered.
            room.edit(room.host, OP.BLOCK_EVENT, changeField('stage', 'b1', '6'));
            room.hub.flush();
            expect(clientB.session.lastAppliedSeq).toBe(1);
            expect(clientA.session.lastAppliedSeq).toBe(3);

            // Gap timer fires -> ops-request -> host replays from its log.
            jest.runTimersToTime(3000);
            room.hub.flush();
            expect(clientB.session.lastAppliedSeq).toBe(3);
            room.expectConverged();
            room.destroy();
        } finally {
            jest.useRealTimers();
        }
    });

    test('a gap the host cannot replay triggers a resync', async () => {
        jest.useFakeTimers();
        try {
            const room = await createRoom({clientCount: 1});
            const client = room.clients[0];
            const resync = jest.fn();
            client.session.on('resync-needed', resync);

            // Age the op log far past the client's position.
            room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'b1'));
            room.hub.flush();
            for (let i = 0; i < 600; i++) {
                room.host.session.submitLocal(OP.BLOCK_EVENT, changeField('stage', 'b1', `${i}`));
            }
            // Drop everything queued for the client, then let one final op
            // through so it notices the gap.
            while (room.hub.dropNext(item => item.to === client.id)) { /* drain */ }
            room.host.session.submitLocal(OP.BLOCK_EVENT, changeField('stage', 'b1', 'last'));
            room.hub.flush();

            jest.runTimersToTime(3000);
            room.hub.flush();
            expect(resync).toHaveBeenCalledWith(expect.stringMatching(/no longer covers/));
            room.destroy();
        } finally {
            jest.useRealTimers();
        }
    });

    test('host replays exactly the missing window via opsSince', async () => {
        const room = await createRoom({clientCount: 1});
        room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'b1'));
        for (let i = 0; i < 5; i++) {
            room.host.session.submitLocal(OP.BLOCK_EVENT, changeField('stage', 'b1', `${i}`));
        }
        expect(room.host.session.opsSince(3).map(op => op.seq)).toEqual([3, 4, 5, 6]);
        expect(room.host.session.opsSince(7)).toEqual([]);
        room.destroy();
    });
});

describe('onboarding while ops are in flight', () => {
    test('ops broadcast during a snapshot are buffered and replayed from atSeq', async () => {
        const room = await createRoom({clientCount: 0, autoSnapshot: false});
        let snapshotRequest = null;
        room.host.session.on('snapshot-needed', request => {
            snapshotRequest = request;
        });

        const client = await room.addClient('anna');
        room.hub.flush();
        expect(snapshotRequest).toEqual({peerId: client.id});

        // Host keeps editing while the "snapshot streams".
        room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'b1'));
        room.edit(room.host, OP.BLOCK_EVENT, changeField('stage', 'b1', '5'));
        const atSeq = room.host.session.seq;
        room.edit(room.host, OP.BLOCK_EVENT, changeField('stage', 'b1', '6'));
        room.hub.flush();

        // Client buffered everything (no base seq yet).
        expect(client.session.lastAppliedSeq).toBeNull();

        // Snapshot taken at atSeq arrives: doc state as of seq 2.
        client.applier.loadSnapshot({
            targets: {}, blocks: {'stage:b1': {fields: {'field:NUM': '5'}, pos: {x: 0, y: 0}}}, extensions: []
        });
        client.session.setBaseSeq(atSeq);

        // Ops <= atSeq were dropped, the one after was applied.
        expect(client.session.lastAppliedSeq).toBe(atSeq + 1);
        expect(client.applier.doc.blocks['stage:b1'].fields['field:NUM']).toBe('6');
        room.destroy();
    });
});

describe('membership changes', () => {
    test('kick reaches the target and updates everyone else', async () => {
        const room = await createRoom({clientCount: 2});
        const [clientA, clientB] = room.clients;
        const kicked = jest.fn();
        const userLeft = jest.fn();
        clientA.session.on('kicked', kicked);
        clientB.session.on('user-left', userLeft);

        room.host.session.kickUser(clientA.id);
        room.hub.flush();

        expect(kicked).toHaveBeenCalledWith('You were removed from the room');
        expect(userLeft).toHaveBeenCalledWith(expect.objectContaining({id: clientA.id}));
        expect(room.host.session.getUsers().map(u => u.id)).not.toContain(clientA.id);
        room.destroy();
    });

    test('a disconnect removes the user everywhere', async () => {
        const room = await createRoom({clientCount: 2});
        const [clientA, clientB] = room.clients;
        const userLeft = jest.fn();
        clientB.session.on('user-left', userLeft);

        room.hub.enqueueClose(clientA.id);
        room.hub.flush();

        expect(userLeft).toHaveBeenCalledWith(expect.objectContaining({id: clientA.id}));
        expect(room.host.session.getUsers()).toHaveLength(2);
        room.destroy();
    });

    test('username changes propagate through the host', async () => {
        const room = await createRoom({clientCount: 2});
        const [clientA, clientB] = room.clients;
        clientA.session.changeUsername('renamed');
        room.hub.flush();

        const findUser = users => users.find(u => u.id === clientA.id);
        expect(findUser(room.host.session.getUsers()).username).toBe('renamed');
        expect(findUser(clientB.session.getUsers()).username).toBe('renamed');
        room.destroy();
    });

    test('privacy changes are announced to clients', async () => {
        const room = await createRoom({clientCount: 1});
        const changed = jest.fn();
        room.clients[0].session.on('room-privacy-changed', changed);
        room.host.session.changeRoomPrivacy('private');
        room.hub.flush();
        expect(changed).toHaveBeenCalledWith('private');
        room.destroy();
    });
});

describe('reconnection catch-up', () => {
    test('a rejoining client within the op log window skips the snapshot', async () => {
        const room = await createRoom({clientCount: 1});
        const client = room.clients[0];

        room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'b1'));
        room.edit(room.host, OP.BLOCK_EVENT, changeField('stage', 'b1', '5'));
        room.hub.flush();
        const docBeforeDrop = client.applier.snapshot();
        const seqBeforeDrop = client.session.lastAppliedSeq;

        // Client goes away; the host keeps editing.
        room.hub.enqueueClose(client.id);
        room.hub.flush();
        room.edit(room.host, OP.BLOCK_EVENT, changeField('stage', 'b1', '6'));
        room.edit(room.host, OP.BLOCK_EVENT, moveBlock('stage', 'b1', 10, 20));

        // Rejoin with the old doc and position.
        const skipped = jest.fn();
        room.host.session.on('snapshot-skipped', skipped);
        const applier = new DocApplier();
        applier.loadSnapshot(docBeforeDrop);
        const transport = new FakeCollabTransport(room.hub, `${client.id}-rejoin`);
        const session = new ClientSession({
            transport, applier, roomId: 'room', username: 'anna'
        });
        session.lastAppliedSeq = seqBeforeDrop;
        await session.connect();
        room.hub.flush();

        expect(skipped).toHaveBeenCalled();
        expect(applier.snapshot()).toEqual(room.host.applier.snapshot());
        expect(session.lastAppliedSeq).toBe(room.host.session.seq);
        session.destroy();
        room.destroy();
    });
});

describe('presence relay', () => {
    test('presence from a client is stamped and relayed to everyone else', async () => {
        const room = await createRoom({clientCount: 3});
        const [clientA, clientB, clientC] = room.clients;
        const seenByB = jest.fn();
        const seenByC = jest.fn();
        const seenByHost = jest.fn();
        const seenByA = jest.fn();
        clientB.session.on('presence', seenByB);
        clientC.session.on('presence', seenByC);
        clientA.session.on('presence', seenByA);
        room.host.session.on('presence', seenByHost);

        clientA.session.submitLocalPresence({
            v: 1, kind: 'presence', type: 'cursor', ts: Date.now(),
            payload: {x: 5, y: 6, userId: 'spoofed'}
        });
        room.hub.flush();

        // The host stamps the real sender id over anything the client wrote.
        expect(seenByB).toHaveBeenCalledWith(clientA.id, expect.objectContaining({
            payload: expect.objectContaining({x: 5, y: 6, userId: clientA.id})
        }));
        expect(seenByC).toHaveBeenCalled();
        expect(seenByHost).toHaveBeenCalled();
        expect(seenByA).not.toHaveBeenCalled();
        room.destroy();
    });
});
