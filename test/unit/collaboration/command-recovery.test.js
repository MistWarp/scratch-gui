import {createRoom} from '../../fixtures/collab-harness';
import {OP, makePropose} from '../../../src/lib/collaboration/protocol';
import {HostSnapshotService, ClientSnapshotService} from '../../../src/lib/collaboration/snapshot';
import AssetChannel from '../../../src/lib/collaboration/assets';

const block = id => ({targetId: 'stage', event: {type: 'create', blockId: id}});
const deferred = () => {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return {promise, resolve};
};

describe('command completion and recovery', () => {
    test('the host does not acknowledge an async mutation before it finishes', async () => {
        const room = await createRoom({clientCount: 1});
        const gate = deferred();
        const apply = room.host.applier.apply.bind(room.host.applier);
        room.host.applier.apply = async (...args) => { await gate.promise; return apply(...args); };
        room.edit(room.clients[0], OP.BLOCK_EVENT, block('new'));
        await room.hub.flush();
        expect(room.host.session.seq).toBe(0);
        expect(room.clients[0].session.pendingOps).toHaveLength(1);
        gate.resolve();
        await room.hub.flush();
        expect(room.host.session.seq).toBe(1);
        room.expectConverged();
        room.destroy();
    });

    test('retrying an unacknowledged request cannot duplicate its mutation', async () => {
        const room = await createRoom({clientCount: 1});
        const client = room.clients[0];
        const apply = jest.spyOn(room.host.applier, 'apply');
        const payload = {...block('once'), requestId: 'request-once'};
        const pending = client.session.submitCommand(OP.BLOCK_EVENT, payload);
        await room.hub.flush();
        await pending;
        client.transport.sendToHost(makePropose(OP.BLOCK_EVENT, payload, 1));
        await room.hub.flush();
        expect(apply).toHaveBeenCalledTimes(1);
        expect(room.host.session.seq).toBe(1);
        room.expectConverged();
        room.destroy();
    });

    test('an unsent request is retried after reconnection', async () => {
        const room = await createRoom({clientCount: 1});
        const client = room.clients[0];
        room.hub.links.get(client.id).open = false;
        const pending = client.session.submitCommand(OP.BLOCK_EVENT, block('offline'));
        room.hub.links.get(client.id).open = true;
        client.session._onReconnected();
        await room.hub.flush();
        await pending;
        expect(room.host.applier.doc.blocks['stage:offline']).toBeTruthy();
        expect(client.session.pendingOps).toHaveLength(0);
        room.expectConverged();
        room.destroy();
    });

    test('snapshot capture waits for completed commands and blocks later mutations until captured', async () => {
        const room = await createRoom({clientCount: 0});
        const gate = deferred();
        const captured = [];
        const snapshots = new HostSnapshotService({session: room.host.session, transport: room.host.transport,
            getProjectData: async () => {
                captured.push({seq: room.host.session.seq, doc: room.host.applier.snapshot()});
                await gate.promise;
                return new ArrayBuffer(1);
            }});
        room.edit(room.host, OP.BLOCK_EVENT, block('before'));
        const transfer = snapshots.startTransfer('joining');
        const next = room.edit(room.host, OP.BLOCK_EVENT, block('after'));
        await room.hub.flush();
        expect(captured[0].seq).toBe(1);
        expect(captured[0].doc.blocks['stage:before']).toBeTruthy();
        expect(room.host.applier.doc.blocks['stage:after']).toBeUndefined();
        gate.resolve();
        await transfer;
        await next;
        const begin = snapshots._transfers.get('joining');
        expect(begin).toBeTruthy();
        snapshots.destroy();
        room.destroy();
    });

    test('snapshot timeouts retry and eventually report failure instead of leaving an endless join', async () => {
        jest.useFakeTimers();
        const room = await createRoom({clientCount: 1});
        const client = room.clients[0];
        const failed = jest.fn();
        client.session.on('connection-failed', failed);
        const snapshots = new ClientSnapshotService({session: client.session, transport: client.transport,
            applyProjectData: jest.fn()});
        snapshots.requestResync();
        jest.advanceTimersByTime(180000);
        expect(failed).toHaveBeenCalledTimes(1);
        snapshots.destroy(); room.destroy(); jest.useRealTimers();
    });

    test('missing assets retry and eventually report failure', async () => {
        jest.useFakeTimers();
        const room = await createRoom({clientCount: 1});
        const client = room.clients[0];
        const failed = jest.fn();
        client.session.on('connection-failed', failed);
        const assets = new AssetChannel({session: client.session, transport: client.transport,
            isHost: false, getAsset: () => null, storeAsset: jest.fn()});
        assets.requestFromHost([`${'a'.repeat(32)}.wav`]);
        jest.advanceTimersByTime(30000);
        expect(failed).toHaveBeenCalledTimes(1);
        assets.destroy(); room.destroy(); jest.useRealTimers();
    });
});
