import {createRoom} from '../../fixtures/collab-harness.js';
import {
    INVITE,
    INVITE_REPLY,
    makeInvite,
    makeReply,
    randomHex,
    readInvite,
    readReply
} from '../../../src/lib/collaboration/friend-invites.js';

describe('friend invite admission', () => {
    test('a valid invite key skips the approval queue and records the invited Rotur name', async () => {
        const room = await createRoom({clientCount: 0, privacy: 'private'});
        const key = randomHex(16);
        room.host.session.addInviteKey(key, 'alice', Date.now() + 60000);
        const client = await room.addClient('Alice', 'mallory', null, key);
        await room.hub.flush();
        expect(client.session.isApproved).toBe(true);
        expect(room.host.session.getPendingJoinRequests()).toHaveLength(0);
        const user = room.host.session.getUsers().find(item => item.id === client.id);
        expect(user.handle).toBe('alice');
        room.destroy();
    });

    test('an invite key admits a friend into a project session without the project scope', async () => {
        const scope = {projectId: 'project-1', branch: 'main'};
        const room = await createRoom({clientCount: 0, privacy: 'private', scope});
        const key = randomHex(16);
        room.host.session.addInviteKey(key, 'bob', Date.now() + 60000);
        const invited = await room.addClient('bob', 'bob', null, key);
        const uninvited = await room.addClient('eve', 'eve', null);
        await room.hub.flush();
        expect(invited.session.isApproved).toBe(true);
        expect(uninvited.session.isApproved).toBe(false);
        room.destroy();
    });

    test('an invite key works for one peer only', async () => {
        const room = await createRoom({clientCount: 0, privacy: 'private'});
        const key = randomHex(16);
        room.host.session.addInviteKey(key, 'alice', Date.now() + 60000);
        const first = await room.addClient('alice', 'alice', null, key);
        await room.hub.flush();
        const second = await room.addClient('copycat', 'copycat', null, key);
        await room.hub.flush();
        expect(first.session.isApproved).toBe(true);
        expect(second.session.isApproved).toBe(false);
        expect(room.host.session.getPendingJoinRequests().map(request => request.id)).toEqual([second.id]);
        room.destroy();
    });

    test('expired and revoked invite keys fall back to host approval', async () => {
        const room = await createRoom({clientCount: 0, privacy: 'private'});
        const expired = randomHex(16);
        const revoked = randomHex(16);
        room.host.session.addInviteKey(expired, 'late', Date.now() - 1);
        room.host.session.addInviteKey(revoked, 'gone', Date.now() + 60000);
        room.host.session.revokeInviteKey(revoked);
        const late = await room.addClient('late', 'late', null, expired);
        const gone = await room.addClient('gone', 'gone', null, revoked);
        await room.hub.flush();
        expect(late.session.isApproved).toBe(false);
        expect(gone.session.isApproved).toBe(false);
        expect(room.host.session.getPendingJoinRequests()).toHaveLength(2);
        room.destroy();
    });

    test('kicking an invited peer revokes their key', async () => {
        const room = await createRoom({clientCount: 0, privacy: 'private'});
        const key = randomHex(16);
        room.host.session.addInviteKey(key, 'alice', Date.now() + 60000);
        const client = await room.addClient('alice', 'alice', null, key);
        await room.hub.flush();
        room.host.session.kickUser(client.id);
        await room.hub.flush();
        expect(room.host.session.inviteKeys.size).toBe(0);
        room.destroy();
    });
});

describe('friend invite messages', () => {
    test('invites round-trip through the reader', () => {
        const invite = makeInvite({roomId: 'cool-cat-123', key: randomHex(16), projectTitle: '  My game  '});
        expect(invite.t).toBe(INVITE);
        expect(readInvite(invite)).toEqual({id: invite.id, room: 'cool-cat-123', key: invite.key, title: 'My game'});
    });

    test('malformed invites are ignored', () => {
        const invite = makeInvite({roomId: 'room', key: randomHex(16), projectTitle: ''});
        expect(readInvite({...invite, key: 'short'})).toBeNull();
        expect(readInvite({...invite, room: ''})).toBeNull();
        expect(readInvite({...invite, room: 'a\nb'})).toBeNull();
        expect(readInvite({...invite, t: 'mw.other'})).toBeNull();
        expect(readInvite(null)).toBeNull();
    });

    test('replies only accept known answers', () => {
        const id = randomHex(12);
        expect(readReply(makeReply(INVITE_REPLY, id, 'accepted'), INVITE_REPLY, ['accepted', 'declined']))
            .toEqual({id, answer: 'accepted'});
        expect(readReply(makeReply(INVITE_REPLY, id, 'maybe'), INVITE_REPLY, ['accepted', 'declined'])).toBeNull();
    });
});
