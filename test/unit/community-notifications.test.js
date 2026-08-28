import React from 'react';
import {act} from 'react-dom/test-utils';
import {MemoryRouter} from 'react-router-dom';
import {mount} from 'enzyme';

import Notifications, {markItemsRead, mergeNotifications} from '../../src/community/pages/Notifications.jsx';
import {useUser} from '../../src/community/UserContext.jsx';
import {
    fetchNotifications,
    markNotificationsRead,
    subscribeNotifications
} from '../../src/lib/rotur/client.js';

jest.mock('../../src/community/UserContext.jsx', () => ({useUser: jest.fn()}));
jest.mock('../../src/lib/rotur/client.js', () => ({
    fetchNotifications: jest.fn(),
    markNotificationsRead: jest.fn(),
    subscribeNotifications: jest.fn(() => () => {})
}));

jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

describe('notification list merging', () => {
    test('keeps a realtime push while merging the initial fetch', () => {
        const pushed = {id: 'new', type: 'follow'};
        const fetched = [{id: 'old', type: 'comment'}, {id: 'new', type: 'follow'}];

        expect(mergeNotifications([pushed], fetched)).toEqual([
            pushed,
            {id: 'old', type: 'comment'}
        ]);
    });

    test('marks every loaded item as read without mutating it', () => {
        const items = [{id: 'one', read: false}, {id: 'two'}];

        expect(markItemsRead(items)).toEqual([
            {id: 'one', read: true},
            {id: 'two', read: true}
        ]);
        expect(items).toEqual([{id: 'one', read: false}, {id: 'two'}]);
    });
});

describe('notification read state', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useUser.mockReturnValue({user: {username: 'viewer'}, loading: false, login: jest.fn()});
        fetchNotifications.mockResolvedValue([{
            id: 'one',
            type: 'follow',
            actor: 'alice',
            read: false,
            created: Date.now()
        }]);
    });

    const render = () => mount(
        <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
            <Notifications />
        </MemoryRouter>
    );

    test('keeps the unread badge when Rotur does not mark the inbox', async () => {
        markNotificationsRead.mockResolvedValue(false);
        const onRead = jest.fn();
        window.addEventListener('mw:notifications-read', onRead);
        const wrapper = render();

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(markNotificationsRead).toHaveBeenCalledTimes(1);
        expect(onRead).not.toHaveBeenCalled();
        wrapper.unmount();
        window.removeEventListener('mw:notifications-read', onRead);
    });

    test('clears the unread badge after Rotur confirms the update', async () => {
        markNotificationsRead.mockResolvedValue(true);
        const onRead = jest.fn();
        window.addEventListener('mw:notifications-read', onRead);
        const wrapper = render();

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(onRead).toHaveBeenCalledTimes(1);
        wrapper.unmount();
        window.removeEventListener('mw:notifications-read', onRead);
    });

    test('does not refetch or reconnect for a refreshed object from the same account', async () => {
        markNotificationsRead.mockResolvedValue(false);
        const wrapper = render();
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });

        useUser.mockReturnValue({user: {username: 'viewer'}, loading: false, login: jest.fn()});
        act(() => {
            wrapper.setProps({
                children: <Notifications hideHeading />
            });
        });
        await act(async () => {
            await Promise.resolve();
        });

        expect(fetchNotifications).toHaveBeenCalledTimes(1);
        expect(subscribeNotifications).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });
});
