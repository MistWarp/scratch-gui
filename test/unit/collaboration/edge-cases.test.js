import {createRoom} from '../../fixtures/collab-harness.js';
import {
    KIND,
    OP,
    CTRL,
    SNAPSHOT,
    ASSET,
    PRESENCE,
    makeOp,
    makePropose,
    makeReject,
    makeCtrl,
    makeSnapshot,
    makeAsset,
    makePresence
} from '../../../src/lib/collaboration/protocol.js';

const blockEvent = (targetId, event) => ({targetId, event});
const createBlock = (targetId, blockId) => blockEvent(targetId, {type: 'create', blockId});
const changeField = (targetId, blockId, value) => blockEvent(targetId, {
    type: 'change', blockId, element: 'field', name: 'NUM', newValue: value
});

describe('hostile or confused peers', () => {
    test('proposals from unapproved peers are ignored', async () => {
        const room = await createRoom({clientCount: 1, privacy: 'private'});
        const client = room.clients[0];
        room.hub.flush(); // hello queued -> pending approval

        client.session.submitLocal(OP.BLOCK_EVENT, createBlock('stage', 'evil'));
        room.hub.flush();

        expect(room.host.session.seq).toBe(0);
        expect(room.host.applier.doc.blocks['stage:evil']).toBeUndefined();
        room.destroy();
    });

    test('a client sending op/reject kinds to the host is ignored', async () => {
        const room = await createRoom({clientCount: 2});
        const [clientA, clientB] = room.clients;

        // Forged already-sequenced op and a forged reject.
        clientA.transport.sendToHost(makeOp(OP.BLOCK_EVENT, createBlock('stage', 'forged'), {
            seq: 99, clientId: clientB.id, clientOpId: 1
        }));
        clientA.transport.sendToHost(makeReject(1, 'gotcha'));
        room.hub.flush();

        expect(room.host.session.seq).toBe(0);
        expect(room.host.applier.doc.blocks['stage:forged']).toBeUndefined();
        room.expectConverged();
        room.destroy();
    });

    test('semantically weird but well-formed messages never throw', async () => {
        const room = await createRoom({clientCount: 1});
        const client = room.clients[0];
        const weird = [
            makeCtrl(CTRL.OPS_REQUEST, {fromSeq: 12345}),
            makeSnapshot(SNAPSHOT.ACK, {transferId: 'nope', index: 3}),
            makeSnapshot(SNAPSHOT.COMPLETE, {transferId: 'nope'}),
            makeAsset(ASSET.CHUNK, {md5ext: `${'c'.repeat(32)}.png`, index: 0, data: new ArrayBuffer(4)}),
            makePresence(PRESENCE.CURSOR, {x: 1e9, y: -1e9}),
            makeCtrl(CTRL.USERNAME_CHANGE, {username: 'still-me'}),
            makePropose(OP.TARGET_UPDATE, {targetId: 'ghost', props: {x: 1}}, 42)
        ];
        weird.forEach(envelope => client.transport.sendToHost(envelope));
        expect(() => room.hub.flush()).not.toThrow();
        room.expectConverged();
        room.destroy();
    });

    test('duplicate hello does not duplicate the user', async () => {
        const room = await createRoom({clientCount: 1});
        const client = room.clients[0];
        client.transport.sendToHost(makeCtrl(CTRL.HELLO, {
            protocolVersion: 1, username: 'user1', roomId: 'room'
        }));
        room.hub.flush();
        expect(room.host.session.getUsers()).toHaveLength(2);
        room.destroy();
    });

    test('duplicate ops (same seq) are applied once', async () => {
        const room = await createRoom({clientCount: 1});
        const client = room.clients[0];
        room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'b1'));
        room.hub.flush();

        const applied = jest.fn();
        client.session.on('op-applied', applied);
        // Host replays the same op twice (e.g. a redundant gap replay).
        const op = room.host.session.opLog[0];
        room.host.transport.send(client.id, op);
        room.host.transport.send(client.id, op);
        room.hub.flush();

        expect(applied).not.toHaveBeenCalled(); // seq <= lastAppliedSeq
        room.expectConverged();
        room.destroy();
    });
});

describe('churn under adverse delivery', () => {
    test('heavy interleaving with reordering and per-client drops converges after recovery', async () => {
        jest.useFakeTimers();
        try {
            const room = await createRoom({clientCount: 3});
            const peers = [room.host].concat(room.clients);
            peers.forEach((peer, index) => {
                room.edit(peer, OP.BLOCK_EVENT, createBlock('stage', `b${index}`));
            });
            room.hub.flush();

            for (let round = 0; round < 6; round++) {
                peers.forEach((peer, index) => {
                    room.edit(peer, OP.BLOCK_EVENT,
                        changeField('stage', `b${(index + round) % peers.length}`, `${round}.${index}`));
                });
                if (round === 2) {
                    // Drop one broadcast to client 2 -> gap -> replay.
                    room.hub.dropNext(item =>
                        item.to === room.clients[1].id && item.envelope.kind === KIND.OP);
                }
                if (round % 2 === 0) room.hub.reorderLastToFront();
                room.hub.flush();
            }

            // Let gap recovery fire and replay.
            jest.runTimersToTime(3000);
            room.hub.flush();

            room.expectConverged();
            peers.slice(1).forEach(peer => {
                expect(peer.session.pendingOps).toHaveLength(0);
            });
            room.destroy();
        } finally {
            jest.useRealTimers();
        }
    });

    test('a kicked client stops receiving ops and the room keeps working', async () => {
        const room = await createRoom({clientCount: 2});
        const [clientA, clientB] = room.clients;
        room.host.session.kickUser(clientA.id);
        room.hub.flush();

        const seqBefore = clientA.session.lastAppliedSeq;
        room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'after-kick'));
        room.hub.flush();

        expect(clientA.session.lastAppliedSeq).toBe(seqBefore);
        expect(clientB.applier.doc.blocks['stage:after-kick']).toBeDefined();
        expect(clientB.applier.snapshot()).toEqual(room.host.applier.snapshot());
        room.destroy();
    });

    test('ops proposed while another client onboards still reach it in order', async () => {
        const room = await createRoom({clientCount: 1});
        const clientA = room.clients[0];

        room.edit(clientA, OP.BLOCK_EVENT, createBlock('stage', 'b1'));
        room.hub.flush();

        // A second client joins; ops keep flowing while it onboards.
        const clientB = await room.addClient('late');
        room.edit(clientA, OP.BLOCK_EVENT, changeField('stage', 'b1', 'while-joining'));
        room.hub.flush();

        expect(clientB.applier.snapshot()).toEqual(room.host.applier.snapshot());
        expect(clientB.applier.doc.blocks['stage:b1'].fields['field:NUM']).toBe('while-joining');
        room.destroy();
    });
});
