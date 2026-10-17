jest.mock('../../src/lib/community/api.js', () => ({loadSession: jest.fn(() => null)}));
jest.mock('../../src/community/api.js', () => ({
    __esModule: true,
    default: {loadSession: jest.fn(() => null), notifications: jest.fn(), readNotifications: jest.fn()}
}));

jest.mock('rotur-sdk', () => {
    const notificationsList = jest.fn();
    return {
        Rotur: jest.fn(() => ({
            loggedIn: true,
            notifications: {list: notificationsList}
        })),
        resolvePermissions: jest.fn(() => []),
        notificationsList
    };
});

import {notificationsList} from 'rotur-sdk';
import {loadSession} from '../../src/lib/community/api.js';
import communityApi from '../../src/community/api.js';
import {fetchNotifications, isVisibleNotification} from '../../src/lib/rotur/client.js';

beforeEach(() => {
    notificationsList.mockReset();
    loadSession.mockReturnValue(null);
    communityApi.notifications.mockReset();
});

describe('Rotur notification visibility', () => {
    test('shows account follow notifications', () => {
        expect(isVisibleNotification({type: 'follow', actor: 'someone'})).toBe(true);
    });

    test('shows MistWarp platform notifications', () => {
        expect(isVisibleNotification({
            type: 'notification',
            platform: 'MistWarp',
            source: 'someone'
        })).toBe(true);
        expect(isVisibleNotification({
            type: 'notification',
            platform_data: {source: 'mistwarp'}
        })).toBe(true);
    });

    test('hides OriginChats notifications', () => {
        expect(isVisibleNotification({
            type: 'notification',
            platform: 'originChats',
            source: 'originchats'
        })).toBe(false);
    });

    test('shows claw activity on your posts', () => {
        expect(isVisibleNotification({type: 'like', post_id: 'p1', user: 'alice', actor: 'alice'})).toBe(true);
        expect(isVisibleNotification({type: 'reply', post_id: 'p1', reply_id: 'r1', user: 'alice'})).toBe(true);
        expect(isVisibleNotification({type: 'repost', original_post_id: 'p1', repost_id: 'p2', user: 'a'})).toBe(true);
        expect(isVisibleNotification({type: 'mention', post_id: 'p1', user: 'alice', platform: 'rotur'})).toBe(true);
        expect(isVisibleNotification({type: 'pounce', post_id: 'p1', user: 'alice'})).toBe(true);
    });

    test('hides claw-shaped activity that belongs to another app or has no post', () => {
        expect(isVisibleNotification({type: 'like', post_id: 'p1', platform: 'originChats'})).toBe(false);
        expect(isVisibleNotification({type: 'like', user: 'alice'})).toBe(false);
        expect(isVisibleNotification({type: 'gift_claimed', post_id: 'p1'})).toBe(false);
    });

    test('hides unrelated app and Rotur activity', () => {
        expect(isVisibleNotification({type: 'group_invite', actor: 'someone'})).toBe(false);
        expect(isVisibleNotification({
            type: 'notification',
            source: 'another-app'
        })).toBe(false);
    });
});

describe('Rotur notification loading', () => {
    test('coalesces concurrent inbox requests', async () => {
        let resolveList;
        notificationsList.mockReturnValue(new Promise(resolve => {
            resolveList = resolve;
        }));

        const first = fetchNotifications();
        const second = fetchNotifications();
        await Promise.resolve();
        expect(notificationsList).toHaveBeenCalledTimes(1);

        resolveList([{id: 'one', type: 'follow', actor: 'alice'}]);
        await expect(Promise.all([first, second])).resolves.toEqual([
            [{id: 'one', type: 'follow', actor: 'alice'}],
            [{id: 'one', type: 'follow', actor: 'alice'}]
        ]);
    });

    test('reports inbox request failures to callers', async () => {
        notificationsList.mockRejectedValue(new Error('offline'));

        await expect(fetchNotifications()).rejects.toThrow('offline');
    });
});

test('includes locally stored milestone notifications when the shared inbox is unavailable', async () => {
    loadSession.mockReturnValue('alice-session');
    communityApi.notifications.mockResolvedValue({notifications: [{
        id: 'local',
        type: 'like_milestone',
        platform: 'mistwarp',
        platform_data: {milestone: 25, contentKind: 'project', path: '/project/p1'},
        read: false
    }]});
    notificationsList.mockRejectedValue(new Error('offline'));
    await expect(fetchNotifications()).resolves.toEqual([expect.objectContaining({
        id: 'local', milestone: 25, path: '/project/p1'
    })]);
});

test('does not show milestone notifications belonging to another app', () => {
    expect(isVisibleNotification({type: 'like_milestone', platform: 'other-app'})).toBe(false);
    expect(isVisibleNotification({type: 'follower_milestone', platform: 'mistwarp'})).toBe(true);
});
