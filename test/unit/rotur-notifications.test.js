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
import {fetchNotifications, isVisibleNotification} from '../../src/lib/rotur/client.js';

beforeEach(() => {
    notificationsList.mockReset();
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
