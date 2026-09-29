import {createRoom, DocApplier, FakeCollabTransport} from '../../fixtures/collab-harness.js';
import ClientSession from '../../../src/lib/collaboration/client-session.js';
import {OP, CTRL, KIND, ASSET, makeAsset} from '../../../src/lib/collaboration/protocol.js';

const createBlock = (targetId, blockId) => ({targetId, event: {type: 'create', blockId}});

const joinWith = async (room, username, {invite, scope} = {}) => {
    const applier = new DocApplier();
    const transport = new FakeCollabTransport(room.hub, `${username}-${Math.random().toString(36)
        .slice(2)}`);
    const session = new ClientSession({transport, applier, roomId: 'room', username, invite, scope});
    const client = {session, applier, transport, id: transport.id, username};
    room.clientsById.set(transport.id, client);
    await session.connect();
    await room.hub.flush();
    return client;
};

const userRole = (room, id) => room.host.session.getUsers().find(user => user.id === id).role;

describe('invite links', () => {
    test('someone with the link joins a private room without asking, as a watcher by default', async () => {
        const room = await createRoom({clientCount: 0, privacy: 'private'});
        const guest = await joinWith(room, 'linked', {invite: room.host.session.inviteKey});
        expect(guest.session.isApproved).toBe(true);
        expect(guest.session.role).toBe('watch');
        expect(userRole(room, guest.id)).toBe('watch');
        expect(room.host.session.getPendingJoinRequests()).toHaveLength(0);
        room.destroy();
    });

    test('a wrong invite key still has to ask', async () => {
        const room = await createRoom({clientCount: 0, privacy: 'private'});
        const guest = await joinWith(room, 'guessing', {invite: 'not-the-key'});
        expect(guest.session.isApproved).toBe(false);
        expect(room.host.session.getPendingJoinRequests()).toHaveLength(1);
        room.destroy();
    });

    test('switching the link to edit upgrades everyone who came through it', async () => {
        const room = await createRoom({clientCount: 0, privacy: 'private'});
        const linked = await joinWith(room, 'linked', {invite: room.host.session.inviteKey});
        const asked = await joinWith(room, 'asked');
        room.host.session.approveJoinRequest(asked.id, 'watch');
        await room.hub.flush();

        const changed = jest.fn();
        linked.session.on('role-changed', changed);
        room.host.session.setInviteRole('edit');
        await room.hub.flush();
        expect(changed).toHaveBeenCalledWith('edit');
        expect(linked.session.role).toBe('edit');
        expect(asked.session.role).toBe('watch');
        room.destroy();
    });

    test('project sessions let invited guests in without the project open', async () => {
        const scope = {projectId: 'p1', branch: 'main'};
        const room = await createRoom({clientCount: 0, privacy: 'private', scope});
        const invited = await joinWith(room, 'friend', {invite: room.host.session.inviteKey});
        const stranger = await joinWith(room, 'stranger');
        expect(invited.session.isApproved).toBe(true);
        expect(stranger.session.isApproved).toBe(false);
        room.destroy();
    });
});

describe('watchers', () => {
    test('the host rejects edits from a watcher and the project is unchanged', async () => {
        const room = await createRoom({clientCount: 0, privacy: 'private'});
        const watcher = await joinWith(room, 'watcher', {invite: room.host.session.inviteKey});
        const before = room.host.applier.snapshot();
        const result = watcher.session.submitCommand(OP.BLOCK_EVENT, createBlock('stage', 'nope'));
        const outcome = result.then(() => 'applied', error => error.message);
        await room.hub.flush();
        await expect(outcome).resolves.toMatch(/watch this session/);
        expect(room.host.applier.snapshot()).toEqual(before);
        room.destroy();
    });

    test('watchers still receive every edit', async () => {
        const room = await createRoom({clientCount: 0, privacy: 'private'});
        const watcher = await joinWith(room, 'watcher', {invite: room.host.session.inviteKey});
        room.edit(room.host, OP.BLOCK_EVENT, createBlock('stage', 'shared'));
        await room.hub.flush();
        expect(watcher.applier.snapshot()).toEqual(room.host.applier.snapshot());
        room.destroy();
    });

    test('asset uploads from watchers are ignored but they can still download', async () => {
        const room = await createRoom({clientCount: 0, privacy: 'private'});
        const watcher = await joinWith(room, 'watcher', {invite: room.host.session.inviteKey});
        const assets = jest.fn();
        room.host.session.on('asset-message', assets);
        const md5ext = `${'a'.repeat(32)}.png`;
        room.host.transport.emit('message', watcher.id,
            makeAsset(ASSET.BEGIN, {md5ext, totalBytes: 1, chunkCount: 1}));
        room.host.transport.emit('message', watcher.id, makeAsset(ASSET.REQUEST, {md5exts: [md5ext]}));
        expect(assets).toHaveBeenCalledTimes(1);
        expect(assets.mock.calls[0][1].type).toBe(ASSET.REQUEST);
        room.destroy();
    });

    test('the host can let a watcher edit and take it back', async () => {
        const room = await createRoom({clientCount: 0, privacy: 'private'});
        const guest = await joinWith(room, 'guest', {invite: room.host.session.inviteKey});
        expect(room.host.session.setUserRole(guest.id, 'edit')).toBe(true);
        await room.hub.flush();
        expect(guest.session.role).toBe('edit');
        room.edit(guest, OP.BLOCK_EVENT, createBlock('stage', 'allowed'));
        await room.hub.flush();
        expect(room.host.applier.snapshot()).toEqual(guest.applier.snapshot());

        room.host.session.setUserRole(guest.id, 'watch');
        room.host.session.setInviteRole('edit');
        await room.hub.flush();
        expect(guest.session.role).toBe('watch');
        room.destroy();
    });

    test('a watcher keeps their role after reconnecting', async () => {
        const room = await createRoom({clientCount: 0, privacy: 'private'});
        const guest = await joinWith(room, 'guest', {invite: room.host.session.inviteKey});
        room.hub.enqueueClose(guest.id);
        await room.hub.flush();
        const transport = new FakeCollabTransport(room.hub, `${guest.id}-again`);
        const session = new ClientSession({transport, applier: new DocApplier(), roomId: 'room', username: 'guest'});
        session._epoch = guest.session._epoch;
        session._reconnectToken = guest.session._reconnectToken;
        room.clientsById.set(transport.id, {session, applier: session.applier, transport, id: transport.id});
        await session.connect();
        await room.hub.flush();
        expect(session.isApproved).toBe(true);
        expect(session.role).toBe('watch');
        session.destroy();
        room.destroy();
    });
});

describe('approval', () => {
    test('the host chooses whether an approved request can edit', async () => {
        const room = await createRoom({clientCount: 0, privacy: 'private'});
        const editor = await joinWith(room, 'editor');
        const watcher = await joinWith(room, 'watcher');
        room.host.session.approveJoinRequest(editor.id, 'edit');
        room.host.session.approveJoinRequest(watcher.id, 'watch');
        await room.hub.flush();
        expect(editor.session.role).toBe('edit');
        expect(watcher.session.role).toBe('watch');
        room.destroy();
    });

    test('users lists carry roles and never the internal join route', async () => {
        const room = await createRoom({clientCount: 1});
        const send = jest.spyOn(room.host.transport, 'send');
        await joinWith(room, 'late');
        const lists = send.mock.calls.map(([, envelope]) => envelope)
            .filter(envelope => envelope.kind === KIND.CTRL && envelope.type === CTRL.USERS_LIST);
        expect(lists.length).toBeGreaterThan(0);
        lists[0].payload.users.forEach(user => {
            expect(['edit', 'watch']).toContain(user.role);
            expect(user).not.toHaveProperty('via');
        });
        room.destroy();
    });
});
