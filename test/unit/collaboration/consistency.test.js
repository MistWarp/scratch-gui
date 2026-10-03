import VM from 'scratch-vm';
import {createRoom, DocApplier, FakeCollabTransport} from '../../fixtures/collab-harness.js';
import VMApplier, {remapTargetIds} from '../../../src/lib/collaboration/vm-applier.js';
import {encodeCommand} from '../../../src/lib/collaboration/command-codec.js';
import ClientSession from '../../../src/lib/collaboration/client-session.js';
import {HostSnapshotService, ClientSnapshotService} from '../../../src/lib/collaboration/snapshot.js';
import {OP, CTRL, KIND, SNAPSHOT} from '../../../src/lib/collaboration/protocol.js';
const Sprite = require('scratch-vm/src/sprites/sprite');
const RenderedTarget = require('scratch-vm/src/sprites/rendered-target');

const createBlock = (targetId, blockId) => ({targetId, event: {type: 'create', blockId}});
const changeField = (targetId, blockId, value) => ({targetId,
    event: {type: 'change', blockId, element: 'field', name: 'NUM', newValue: value}});

const deferred = () => {
    let resolve;
    const promise = new Promise(done => {
        resolve = done;
    });
    return {promise, resolve};
};

const settle = async hub => {
    for (let i = 0; i < 50; i++) {
        await hub.flush();
        await Promise.resolve();
    }
};

const rejoin = async (room, client, {snapshots = null} = {}) => {
    const applier = new DocApplier();
    applier.loadSnapshot(client.applier.snapshot());
    const transport = new FakeCollabTransport(room.hub, `${client.id}-rejoin`);
    const session = new ClientSession({transport, applier, roomId: 'room', username: client.username});
    session.lastAppliedSeq = client.session.lastAppliedSeq;
    session._epoch = client.session._epoch;
    session._reconnectToken = client.session._reconnectToken;
    const entry = {session, applier, transport, id: transport.id, username: client.username};
    room.clientsById.set(transport.id, entry);
    if (snapshots) entry.snapshots = snapshots(entry);
    await session.connect();
    return entry;
};

describe('host project reloads', () => {
    test('a guest who missed the reload gets the new project instead of a replay', async () => {
        const room = await createRoom({clientCount: 1});
        const client = room.clients[0];
        room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'old'));
        await room.hub.flush();
        room.hub.enqueueClose(client.id);
        await room.hub.flush();

        // The host opens another project while the guest is away.
        room.host.applier.loadSnapshot({targets: {},
            blocks: {fresh: {fields: {}, pos: {x: 0, y: 0}}},
            extensions: []});
        room.host.session.restartHistory();
        const skipped = jest.fn();
        room.host.session.on('snapshot-skipped', skipped);

        const back = await rejoin(room, client);
        await room.hub.flush();
        expect(skipped).not.toHaveBeenCalled();
        expect(back.applier.snapshot()).toEqual(room.host.applier.snapshot());
        expect(back.session.lastAppliedSeq).toBe(room.host.session.seq);
        room.destroy();
    });

    test('a guest who loaded the new project can still catch up from the log', async () => {
        const room = await createRoom({clientCount: 0});
        room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'old'));
        await room.hub.flush();
        room.host.session.restartHistory();
        const client = await room.addClient('anna');
        await room.hub.flush();
        room.hub.enqueueClose(client.id);
        await room.hub.flush();
        room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'new'));
        await room.hub.flush();

        const skipped = jest.fn();
        room.host.session.on('snapshot-skipped', skipped);
        const back = await rejoin(room, client);
        await room.hub.flush();
        expect(skipped).toHaveBeenCalled();
        expect(back.applier.snapshot()).toEqual(room.host.applier.snapshot());
        room.destroy();
    });
});

describe('slow edits', () => {
    test('an edit that finishes after its timeout still reaches every guest', async () => {
        jest.useFakeTimers();
        try {
            const room = await createRoom({clientCount: 1});
            const client = room.clients[0];
            const gate = deferred();
            const apply = room.host.applier.apply.bind(room.host.applier);
            room.host.applier.apply = async (...args) => {
                await gate.promise;
                return apply(...args);
            };
            const outcome = client.session.submitCommand(OP.BLOCK_EVENT, createBlock('stage', 'slow'))
                .then(() => 'applied', error => error.message);
            await room.hub.flush();
            jest.advanceTimersByTime(20001);
            await room.hub.flush();
            await expect(outcome).resolves.toMatch(/took too long/);

            gate.resolve();
            await room.hub.flush();
            expect(room.host.applier.doc.blocks['stage:slow']).toBeTruthy();
            expect(client.session.lastAppliedSeq).toBe(room.host.session.seq);
            room.expectConverged();
            room.destroy();
        } finally {
            jest.useRealTimers();
        }
    });
});

describe('gap recovery', () => {
    test('a closed gap does not force a resync while later ops are still applying', async () => {
        jest.useFakeTimers();
        try {
            const room = await createRoom({clientCount: 1});
            const client = room.clients[0];
            const resync = jest.fn();
            client.session.on('resync-needed', resync);

            await room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'b1'));
            await room.hub.flush();
            await room.edit(room.host, OP.BLOCK_EVENT, changeField('stage', 'b1', '2'));
            expect(room.hub.dropNext(item => item.to === client.id && item.envelope.kind === KIND.OP))
                .not.toBeNull();
            await room.edit(room.host, OP.BLOCK_EVENT, changeField('stage', 'b1', '3'));
            await room.hub.flush();
            expect(client.session.lastAppliedSeq).toBe(1);

            // The replay is requested. Before it lands, a slow op arrives that
            // keeps the buffer busy long after the gap has closed.
            jest.advanceTimersByTime(3000);
            const gate = deferred();
            const apply = client.applier.apply.bind(client.applier);
            client.applier.apply = async (type, payload, meta) => {
                if (payload.event.blockId === 'slow') await gate.promise;
                return apply(type, payload, meta);
            };
            room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'slow'));
            room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'after'));
            await room.hub.flush();
            expect(client.session.lastAppliedSeq).toBe(3);

            jest.advanceTimersByTime(15000);
            await room.hub.flush();
            expect(resync).not.toHaveBeenCalled();
            gate.resolve();
            await room.hub.flush();
            room.expectConverged();
            room.destroy();
        } finally {
            jest.useRealTimers();
        }
    });
});

describe('unrequested snapshots', () => {
    test('a guest who rejoins past the log window waits for the snapshot instead of chasing the gap', async () => {
        jest.useFakeTimers();
        try {
            const room = await createRoom({clientCount: 0, autoSnapshot: false});
            const encode = doc => new Uint8Array(Buffer.from(JSON.stringify(doc))).buffer;
            const hostService = new HostSnapshotService({session: room.host.session,
                transport: room.host.transport,
                getProjectData: () => Promise.resolve(encode(room.host.applier.doc))});
            const wire = entry => new ClientSnapshotService({session: entry.session,
                transport: entry.transport,
                applyProjectData: buffer => {
                    entry.applier.loadSnapshot(JSON.parse(Buffer.from(buffer).toString()));
                    return Promise.resolve();
                }});
            const client = await room.addClient('anna');
            const first = wire(client);
            await settle(room.hub);
            expect(client.session.lastAppliedSeq).toBe(0);

            room.hub.enqueueClose(client.id);
            await room.hub.flush();
            room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'missed'));
            await room.hub.flush();
            // The log no longer reaches back to the guest's position.
            room.host.session.opLog = [];

            const back = await rejoin(room, client, {snapshots: wire});
            const toHost = jest.spyOn(back.transport, 'sendToHost');
            // Deliver until the snapshot starts streaming, but no further.
            for (let i = 0; i < 50 && !room.hub.queue.some(item => item.to === back.id &&
                item.envelope && item.envelope.type === SNAPSHOT.BEGIN); i++) {
                room.hub.deliverOne();
                await Promise.resolve();
            }
            while (room.hub.queue.length && room.hub.queue[0].envelope.type !== SNAPSHOT.CHUNK) {
                room.hub.deliverOne();
            }
            expect(back.session.lastAppliedSeq).toBeNull();

            // An edit lands mid-download; it must wait for the snapshot.
            room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'during'));
            jest.advanceTimersByTime(5000);
            await settle(room.hub);
            expect(toHost.mock.calls.some(([envelope]) => envelope.type === CTRL.OPS_REQUEST)).toBe(false);
            expect(toHost.mock.calls.filter(([envelope]) => envelope.type === SNAPSHOT.REQUEST)).toHaveLength(0);
            expect(back.applier.snapshot()).toEqual(room.host.applier.snapshot());
            expect(back.session.lastAppliedSeq).toBe(room.host.session.seq);

            first.destroy();
            back.snapshots.destroy();
            hostService.destroy();
            back.session.destroy();
            room.destroy();
        } finally {
            jest.useRealTimers();
        }
    });
});

describe('applying ops during a resync', () => {
    test('an apply cancelled by a resync does not ask for yet another snapshot', async () => {
        const room = await createRoom({clientCount: 1});
        const client = room.clients[0];
        const resync = jest.fn();
        client.session.on('resync-needed', resync);
        const gate = deferred();
        client.applier.apply = async () => {
            await gate.promise;
            throw new Error('Editing session ended');
        };
        room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'slow'));
        await room.hub.flush();
        client.session.beginResync();
        gate.resolve();
        await room.hub.flush();
        expect(resync).not.toHaveBeenCalled();
        room.destroy();
    });
});

describe('snapshot target ids', () => {
    const makeVM = ids => {
        const vm = new VM();
        for (const [id, name, isStage] of ids) {
            const sprite = new Sprite(null, vm.runtime);
            sprite.name = name;
            const target = new RenderedTarget(sprite, vm.runtime);
            target.id = id;
            target.isStage = isStage;
            target.isOriginal = true;
            vm.runtime.addTarget(target);
        }
        vm.editingTarget = vm.runtime.targets[1];
        vm.runtime.setEditingTarget(vm.editingTarget);
        return vm;
    };
    const hostIds = [{id: 'host-stage', name: 'Stage', isStage: true},
        {id: 'host-sprite', name: 'Sprite', isStage: false},
        {id: 'host-other', name: 'Other', isStage: false}];

    test('sprite-specific monitors follow the host id so the palette checkbox still matches', async () => {
        const vm = makeVM([['stage', 'Stage', true], ['local', 'Sprite', false], ['local-2', 'Other', false]]);
        vm.runtime.requestAddMonitor({id: 'local_xposition',
            opcode: 'motion_xposition',
            targetId: 'local',
            spriteName: 'Sprite',
            visible: true});
        vm.runtime.monitorBlocks.createBlock({id: 'local_xposition',
            opcode: 'motion_xposition',
            inputs: {},
            fields: {},
            topLevel: true,
            targetId: 'local'});
        await remapTargetIds(vm, hostIds);
        const monitors = vm.runtime.getMonitorState();
        expect(monitors.has('local_xposition')).toBe(false);
        expect(monitors.get('host-sprite_xposition').targetId).toBe('host-sprite');
        expect(monitors.get('host-sprite_xposition').id).toBe('host-sprite_xposition');
        expect(vm.runtime.monitorBlocks.getBlock('local_xposition')).toBeUndefined();
        expect(vm.runtime.monitorBlocks.getBlock('host-sprite_xposition').targetId).toBe('host-sprite');
        expect(vm.runtime.monitorBlocks.getScripts()).toEqual(['host-sprite_xposition']);
        vm.quit();
    });

    test('a resync keeps the sprite that was being edited', async () => {
        const vm = makeVM([['stage', 'Stage', true], ['local', 'Sprite', false], ['local-2', 'Other', false]]);
        await remapTargetIds(vm, hostIds, () => true, 'host-other');
        expect(vm.editingTarget.id).toBe('host-other');
        expect(vm.runtime.getEditingTarget().id).toBe('host-other');
        await remapTargetIds(vm, hostIds, () => true, 'deleted-meanwhile');
        expect(vm.editingTarget.id).toBe('host-other');
        vm.quit();
    });
});

describe('deleting the sprite someone is editing', () => {
    const makeVM = () => {
        const vm = new VM();
        for (const [id, name, isStage] of [['stage', 'Stage', true], ['sprite', 'Sprite', false]]) {
            const sprite = new Sprite(null, vm.runtime);
            sprite.name = name;
            const target = new RenderedTarget(sprite, vm.runtime);
            target.id = id;
            target.isStage = isStage;
            target.isOriginal = true;
            sprite.clones.push(target);
            vm.runtime.addTarget(target);
        }
        vm.editingTarget = vm.runtime.targets[1];
        vm.runtime.setEditingTarget(vm.editingTarget);
        vm.editingCommands.snapshot();
        // Deleting keeps a zipped copy for undo; skip the zip in tests.
        vm.exportSprite = () => Promise.resolve(new Uint8Array(0));
        return vm;
    };

    test('the workspace switches to the new selection on every peer', async () => {
        const host = makeVM();
        const client = makeVM();
        const hostApplier = new VMApplier({vm: host});
        const clientApplier = new VMApplier({vm: client});
        const hostUpdates = jest.fn();
        const clientUpdates = jest.fn();
        host.on('workspaceUpdate', hostUpdates);
        client.on('workspaceUpdate', clientUpdates);

        const op = await hostApplier.apply(OP.VM_EDIT, encodeCommand(host,
            {method: 'deleteSprite', args: ['sprite'], targetId: 'sprite'}));
        await clientApplier.apply(OP.VM_EDIT, op);
        for (const vm of [host, client]) {
            expect(vm.runtime.getTargetById('sprite')).toBeUndefined();
            expect(vm.editingTarget.id).toBe('stage');
        }
        expect(hostUpdates).toHaveBeenCalled();
        expect(clientUpdates).toHaveBeenCalled();
        hostApplier.destroy(); clientApplier.destroy();
        host.quit(); client.quit();
    });
});

describe('reconnect events', () => {
    test('a guest whose host restarted hears reconnected once the new project loads', async () => {
        const room = await createRoom({clientCount: 1});
        const client = room.clients[0];
        const events = [];
        for (const name of ['awaiting-approval', 'host-restarted', 'reconnected']) {
            client.session.on(name, () => events.push(name));
        }
        room.host.session.epoch = 'a-new-host-instance';
        room.host.session.seq = 0;
        room.host.session.opLog = [];
        client.session._onReconnected();
        await room.hub.flush();
        expect(events).toEqual(['host-restarted']);
        // The new host's snapshot finishes loading.
        client.session.setBaseSeq(room.host.session.seq);
        await room.hub.flush();
        expect(events).toEqual(['host-restarted', 'reconnected']);
        room.destroy();
    });

    test('connection failures carry the transport code', async () => {
        const room = await createRoom({clientCount: 1});
        const client = room.clients[0];
        const failed = jest.fn();
        client.session.on('connection-failed', failed);
        const missing = Object.assign(new Error('No such room'), {collabCode: 'ROOM_NOT_FOUND'});
        client.transport.emit('fatal', {error: missing});
        client.transport.emit('fatal', {error: new Error('Something else')});
        expect(failed.mock.calls.map(([payload]) => payload)).toEqual([
            {error: 'No such room', code: 'ROOM_NOT_FOUND'},
            {error: 'Something else', code: null}
        ]);
        room.destroy();
    });
});
