import {createRoom} from '../../fixtures/collab-harness.js';
import PresenceChannel from '../../../src/lib/collaboration/presence.js';
import VMAdapter, {READ_ONLY_MESSAGE} from '../../../src/lib/collaboration/vm-adapter.js';
import {
    KIND, OP, PRESENCE, PROTOCOL_VERSION, validateEnvelope, makePresence
} from '../../../src/lib/collaboration/protocol.js';

const createBlock = (targetId, blockId) => ({targetId, event: {type: 'create', blockId}});

describe('presentation viewport presence', () => {
    test('accepts a finite viewport and rejects junk', () => {
        expect(validateEnvelope(makePresence(PRESENCE.VIEWPORT, {scrollX: 10, scrollY: -20, scale: 0.75}))).toBeNull();
        expect(validateEnvelope(makePresence(PRESENCE.VIEWPORT, {
            scrollX: 10, scrollY: -20, scale: 1, targetId: 'sprite-1'
        }))).toBeNull();
        expect(validateEnvelope(makePresence(PRESENCE.VIEWPORT, {scrollX: 10, scale: 1}))).toMatch(/scrollX/);
        expect(validateEnvelope(makePresence(PRESENCE.VIEWPORT, {scrollX: Infinity, scrollY: 0, scale: 1})))
            .toMatch(/scrollX/);
        expect(validateEnvelope(makePresence(PRESENCE.VIEWPORT, {scrollX: 0, scrollY: 0, scale: 0}))).toMatch(/scale/);
        expect(validateEnvelope(makePresence(PRESENCE.VIEWPORT, {scrollX: 0, scrollY: 0, scale: 99}))).toMatch(/scale/);
        expect(validateEnvelope(makePresence(PRESENCE.VIEWPORT, {scrollX: 0, scrollY: 0, scale: 1, targetId: 7})))
            .toMatch(/targetId/);
    });

    test('a viewport from the host reaches viewers as a presence event', async () => {
        const room = await createRoom({clientCount: 1});
        const viewerChannel = new PresenceChannel({session: room.clients[0].session, silent: true});
        const seen = jest.fn();
        viewerChannel.on('viewport', seen);
        const hostChannel = new PresenceChannel({session: room.host.session});
        hostChannel.sendViewport({scrollX: 5, scrollY: 6, scale: 1.25, targetId: 'sprite-1'});
        await room.hub.flush();
        expect(seen).toHaveBeenCalledWith(room.host.id, {scrollX: 5, scrollY: 6, scale: 1.25, targetId: 'sprite-1'});
        hostChannel.destroy();
        viewerChannel.destroy();
        room.destroy();
    });

    test('a silent channel never sends presence', async () => {
        const room = await createRoom({clientCount: 1});
        const client = room.clients[0];
        const send = jest.spyOn(client.transport, 'sendToHost');
        const channel = new PresenceChannel({session: client.session, silent: true});
        channel.sendCursor({x: 1, y: 2});
        channel.sendCursorChat('hello');
        channel.sendActivity({targetId: 'sprite-1', tab: 0, assetIndex: 0});
        channel.sendViewport({scrollX: 0, scrollY: 0, scale: 1});
        await room.hub.flush();
        expect(send.mock.calls.filter(([envelope]) => envelope.kind === KIND.PRESENCE)).toHaveLength(0);
        channel.destroy();
        room.destroy();
    });
});

describe('viewer peers on the host', () => {
    test('a proposal from a viewer is rejected without consuming a sequence number', async () => {
        const room = await createRoom({clientCount: 2});
        const [viewer, editor] = room.clients;
        room.host.session.setViewerPeers([viewer.id]);
        const rejected = jest.fn();
        viewer.session.on('op-rejected', rejected);
        const seqBefore = room.host.session.seq;
        room.edit(viewer, OP.BLOCK_EVENT, createBlock('stage', 'viewer-block'));
        await room.hub.flush();
        expect(rejected).toHaveBeenCalledTimes(1);
        expect(rejected.mock.calls[0][0].reason).toMatch(/watching/);
        expect(room.host.session.seq).toBe(seqBefore);
        expect(viewer.session.pendingOps).toHaveLength(0);
        room.edit(editor, OP.BLOCK_EVENT, createBlock('stage', 'editor-block'));
        await room.hub.flush();
        expect(room.host.session.seq).toBe(seqBefore + 1);
        room.expectConverged();
        room.destroy();
    });

    test('presence from a viewer is dropped, presence from an editor is relayed', async () => {
        const room = await createRoom({clientCount: 3});
        const [viewer, editor, other] = room.clients;
        room.host.session.setViewerPeers([viewer.id]);
        const seenByOther = jest.fn();
        other.session.on('presence', seenByOther);
        const cursor = () => ({v: PROTOCOL_VERSION,
            kind: KIND.PRESENCE,
            type: PRESENCE.CURSOR,
            ts: Date.now(),
            payload: {x: 1, y: 2}});
        viewer.session.submitLocalPresence(cursor());
        editor.session.submitLocalPresence(cursor());
        await room.hub.flush();
        expect(seenByOther).toHaveBeenCalledTimes(1);
        expect(seenByOther.mock.calls[0][0]).toBe(editor.id);
        room.destroy();
    });

    test('the viewer set can be replaced on every directory tick', async () => {
        const room = await createRoom({clientCount: 1});
        const client = room.clients[0];
        room.host.session.setViewerPeers([client.id]);
        expect(room.host.session.isViewer(client.id)).toBe(true);
        room.host.session.setViewerPeers([]);
        expect(room.host.session.isViewer(client.id)).toBe(false);
        const seqBefore = room.host.session.seq;
        room.edit(client, OP.BLOCK_EVENT, createBlock('stage', 'allowed-block'));
        await room.hub.flush();
        expect(room.host.session.seq).toBe(seqBefore + 1);
        room.destroy();
    });
});

describe('read-only VM adapter', () => {
    const fakeVm = () => {
        const listeners = {};
        return {
            editingCommands: {snapshot: () => [], request: jest.fn()},
            editingTarget: {id: 'sprite-1'},
            runtime: {getTargetById: () => null, getTargetForStage: () => null},
            on: (name, fn) => {
                listeners[name] = fn;
            },
            emit: jest.fn(),
            setEditingTarget: jest.fn(),
            emitWorkspaceUpdate: jest.fn(),
            listeners
        };
    };

    test('refuses local edit commands at the VM boundary', async () => {
        const vm = fakeVm();
        const onLocalOp = jest.fn();
        const adapter = new VMAdapter({vm, onLocalOp, readOnly: true});
        await expect(vm.editingCommands.handler({method: 'blockEvent', args: []})).rejects.toThrow(READ_ONLY_MESSAGE);
        expect(onLocalOp).not.toHaveBeenCalled();
        expect(adapter.isReadOnly()).toBe(true);
        adapter.destroy();
    });

    test('swallows captured block events instead of requesting them', () => {
        const vm = fakeVm();
        const adapter = new VMAdapter({vm, onLocalOp: jest.fn(), readOnly: true});
        const handled = vm.editingCommands.captureEvent({type: 'create', blockId: 'b1', recordUndo: true}, false);
        expect(handled).toBe(true);
        expect(vm.editingCommands.request).not.toHaveBeenCalled();
        expect(vm.emit).toHaveBeenCalledWith('EDIT_COMMAND_ERROR', expect.any(Error));
        adapter.destroy();
    });
});
