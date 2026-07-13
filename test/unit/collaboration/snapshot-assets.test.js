import {createRoom, DocApplier} from '../../fixtures/collab-harness.js';
import {HostSnapshotService, ClientSnapshotService, CHUNK_SIZE} from '../../../src/lib/collaboration/snapshot.js';
import AssetChannel from '../../../src/lib/collaboration/assets.js';
import {OP} from '../../../src/lib/collaboration/protocol.js';

// The fake hub is synchronous but snapshot/asset finish paths are async;
// alternate flushing and yielding until everything settles.
const settle = async hub => {
    for (let i = 0; i < 50; i++) {
        hub.flush();
        await Promise.resolve();
        await Promise.resolve();
    }
};

const encodeDoc = doc => {
    const bytes = Buffer.from(JSON.stringify(doc));
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
};
const decodeDoc = arrayBuffer => JSON.parse(Buffer.from(arrayBuffer).toString());

const wireSnapshots = room => {
    const hostService = new HostSnapshotService({
        session: room.host.session,
        transport: room.host.transport,
        getProjectData: () => Promise.resolve(encodeDoc(room.host.applier.doc))
    });
    const clientServices = new Map();
    const wireClient = client => {
        const service = new ClientSnapshotService({
            session: client.session,
            transport: client.transport,
            applyProjectData: arrayBuffer => {
                client.applier.loadSnapshot(decodeDoc(arrayBuffer));
                return Promise.resolve();
            }
        });
        clientServices.set(client.id, service);
        return service;
    };
    return {hostService, clientServices, wireClient};
};

const blockEvent = (targetId, event) => ({targetId, event});
const createBlock = (targetId, blockId) => blockEvent(targetId, {type: 'create', blockId});
const changeField = (targetId, blockId, value) => blockEvent(targetId, {
    type: 'change', blockId, element: 'field', name: 'NUM', newValue: value
});

describe('snapshot streaming', () => {
    test('a joiner receives the project in chunks and converges', async () => {
        const room = await createRoom({clientCount: 0, autoSnapshot: false});
        const {hostService, wireClient} = wireSnapshots(room);

        // Give the host a doc bigger than several chunks.
        room.host.applier.doc.blocks.big = {
            fields: {pad: 'x'.repeat(CHUNK_SIZE * 4 + 123)},
            pos: {x: 0, y: 0}
        };
        room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'b1'));

        const client = await room.addClient('anna');
        const service = wireClient(client);
        const progress = jest.fn();
        const complete = jest.fn();
        service.on('download-progress', progress);
        service.on('download-complete', complete);

        await settle(room.hub);

        expect(complete).toHaveBeenCalled();
        expect(progress.mock.calls.length).toBeGreaterThan(4);
        expect(client.applier.snapshot()).toEqual(room.host.applier.snapshot());
        expect(client.session.lastAppliedSeq).toBe(room.host.session.seq);

        hostService.destroy();
        service.destroy();
        room.destroy();
    });

    test('download-complete fires before the project is applied, not after', async () => {
        const room = await createRoom({clientCount: 0, autoSnapshot: false});
        const hostService = new HostSnapshotService({
            session: room.host.session,
            transport: room.host.transport,
            getProjectData: () => Promise.resolve(encodeDoc(room.host.applier.doc))
        });
        room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'b1'));

        const client = await room.addClient('anna');
        const order = [];
        const service = new ClientSnapshotService({
            session: client.session,
            transport: client.transport,
            applyProjectData: arrayBuffer => {
                order.push('apply');
                client.applier.loadSnapshot(decodeDoc(arrayBuffer));
                return Promise.resolve();
            }
        });
        service.on('download-complete', () => order.push('download-complete'));

        await settle(room.hub);

        expect(order).toEqual(['download-complete', 'apply']);

        hostService.destroy();
        service.destroy();
        room.destroy();
    });

    test('two concurrent joiners both get complete transfers', async () => {
        const room = await createRoom({clientCount: 0, autoSnapshot: false});
        const {hostService, wireClient} = wireSnapshots(room);
        room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'b1'));

        const ready = jest.fn();
        room.host.session.on('session-ready', ready);

        const clientA = await room.addClient('anna');
        const clientB = await room.addClient('ben');
        const serviceA = wireClient(clientA);
        const serviceB = wireClient(clientB);
        await settle(room.hub);

        expect(clientA.applier.snapshot()).toEqual(room.host.applier.snapshot());
        expect(clientB.applier.snapshot()).toEqual(room.host.applier.snapshot());
        expect(ready).toHaveBeenCalled();

        hostService.destroy();
        serviceA.destroy();
        serviceB.destroy();
        room.destroy();
    });

    test('ops landing during the transfer replay from atSeq', async () => {
        const room = await createRoom({clientCount: 0, autoSnapshot: false});
        const {hostService, wireClient} = wireSnapshots(room);
        room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'b1'));

        const client = await room.addClient('anna');
        const service = wireClient(client);
        // Hello is queued but nothing has been delivered yet; interleave
        // edits with the snapshot handshake as the hub pumps.
        room.hub.flush(); // hello -> approved -> snapshot begins
        room.edit(room.host, OP.BLOCK_EVENT, changeField('stage', 'b1', 'during-transfer'));
        await settle(room.hub);

        expect(client.applier.snapshot()).toEqual(room.host.applier.snapshot());
        expect(client.applier.doc.blocks['stage:b1'].fields['field:NUM']).toBe('during-transfer');

        hostService.destroy();
        service.destroy();
        room.destroy();
    });

    test('a resync re-onboards the client from a fresh snapshot', async () => {
        const room = await createRoom({clientCount: 0, autoSnapshot: false});
        const {hostService, wireClient} = wireSnapshots(room);
        const client = await room.addClient('anna');
        const service = wireClient(client);
        await settle(room.hub);

        // Corrupt the client and keep editing on the host.
        client.applier.doc.blocks.corrupted = {fields: {}, pos: {x: 1, y: 1}};
        room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'b2'));
        await settle(room.hub);

        // The session detects breakage elsewhere; here we trigger directly.
        client.session.emit('resync-needed', 'test');
        await settle(room.hub);

        expect(client.applier.snapshot()).toEqual(room.host.applier.snapshot());
        expect(client.applier.doc.blocks.corrupted).toBeUndefined();

        hostService.destroy();
        service.destroy();
        room.destroy();
    });

    test('a restarted transfer supersedes the old one', async () => {
        const room = await createRoom({clientCount: 0, autoSnapshot: false});
        const {hostService, wireClient} = wireSnapshots(room);
        const client = await room.addClient('anna');
        const service = wireClient(client);
        room.hub.flush(); // approval + first BEGIN/chunks queued

        // Request again before the first transfer completes.
        await hostService.startTransfer(client.id);
        await settle(room.hub);

        expect(client.applier.snapshot()).toEqual(room.host.applier.snapshot());
        expect(client.session.lastAppliedSeq).toBe(room.host.session.seq);

        hostService.destroy();
        service.destroy();
        room.destroy();
    });
});

describe('asset channel', () => {
    const md5A = `${'a'.repeat(32)}.png`;
    const assetBytes = new Uint8Array([1, 2, 3, 4, 5]);

    const wireAssets = (room, stores) => {
        const hostStore = new Map();
        stores.set(room.host.id, hostStore);
        const hostChannel = new AssetChannel({
            isHost: true,
            session: room.host.session,
            transport: room.host.transport,
            getAsset: md5ext => hostStore.get(md5ext) || null,
            storeAsset: (md5ext, bytes) => {
                hostStore.set(md5ext, bytes);
            }
        });
        const wireClient = client => {
            const store = new Map();
            stores.set(client.id, store);
            const channel = new AssetChannel({
                isHost: false,
                session: client.session,
                transport: client.transport,
                getAsset: md5ext => store.get(md5ext) || null,
                storeAsset: (md5ext, bytes) => {
                    store.set(md5ext, bytes);
                }
            });
            // The facade wiring: blocked session asks the channel; the
            // channel unblocks the session.
            client.session.on('assets-needed', md5exts => channel.requestFromHost(md5exts));
            channel.on('asset-received', () => client.session.resumeApply());
            return channel;
        };
        return {hostChannel, wireClient};
    };

    test('asset-bearing ops block, fetch from the host, then apply', async () => {
        const stores = new Map();
        const room = await createRoom({clientCount: 0});
        const {hostChannel, wireClient} = wireAssets(room, stores);

        // Both clients check their own store before applying asset ops.
        const clientA = await room.addClient('anna');
        const clientB = await room.addClient('ben');
        clientA.session._hasAsset = md5ext => stores.get(clientA.id).has(md5ext);
        clientB.session._hasAsset = md5ext => stores.get(clientB.id).has(md5ext);
        const channelA = wireClient(clientA);
        const channelB = wireClient(clientB);
        room.hub.flush();

        room.edit(room.host, OP.SPRITE_ADD, {targetId: 'sprite1', spriteJson: {name: 'Cat'}});
        room.hub.flush();

        // Client A "imports a costume": bytes exist locally, are pushed to
        // the host first, then the op is proposed.
        stores.get(clientA.id).set(md5A, assetBytes);
        channelA.sendAsset('host', md5A);
        room.edit(clientA, OP.COSTUME_ADD, {
            targetId: 'sprite1',
            costume: {name: 'costume1', md5ext: md5A},
            assetRefs: [md5A]
        });
        await settle(room.hub);

        // Host stored the pushed bytes; B blocked, requested, received, applied.
        expect(stores.get(room.host.id).has(md5A)).toBe(true);
        expect(Array.from(stores.get(clientB.id).get(md5A))).toEqual(Array.from(assetBytes));
        room.expectConverged();
        expect(clientB.applier.doc.targets.sprite1.costumes).toHaveLength(1);

        hostChannel.destroy();
        channelA.destroy();
        channelB.destroy();
        room.destroy();
    });

    test('the host reports assets it cannot serve', async () => {
        const stores = new Map();
        const room = await createRoom({clientCount: 0});
        const {hostChannel, wireClient} = wireAssets(room, stores);
        const client = await room.addClient('anna');
        const channel = wireClient(client);
        room.hub.flush();

        const unavailable = jest.fn();
        hostChannel.on('asset-unavailable', unavailable);
        channel.requestFromHost([md5A]);
        await settle(room.hub);

        expect(unavailable).toHaveBeenCalledWith({peerId: client.id, md5ext: md5A});

        hostChannel.destroy();
        channel.destroy();
        room.destroy();
    });

    test('duplicate requests for the same asset are coalesced', async () => {
        const stores = new Map();
        const room = await createRoom({clientCount: 0});
        const {hostChannel, wireClient} = wireAssets(room, stores);
        const client = await room.addClient('anna');
        const channel = wireClient(client);
        room.hub.flush();

        channel.requestFromHost([md5A]);
        channel.requestFromHost([md5A]);
        const requests = room.hub.queue.filter(item =>
            item.envelope && item.envelope.type === 'asset-request');
        expect(requests).toHaveLength(1);

        hostChannel.destroy();
        channel.destroy();
        room.destroy();
    });
});
