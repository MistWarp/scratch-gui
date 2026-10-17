import React from 'react';
import {act} from 'react-dom/test-utils';
import {MemoryRouter} from 'react-router-dom';
import {mount} from 'enzyme';

import Notifications, {markItemsRead, mergeNotifications} from '../../src/community/pages/Notifications.jsx';
import {useUser} from '../../src/community/UserContext.jsx';
import {
    fetchFollowingFeed,
    fetchNotifications,
    markNotificationsRead,
    subscribeNotifications
} from '../../src/lib/rotur/client.js';

jest.mock('../../src/community/UserContext.jsx', () => ({useUser: jest.fn()}));
jest.mock('../../src/lib/rotur/client.js', () => ({
    fetchFollowingFeed: jest.fn(),
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
        fetchFollowingFeed.mockResolvedValue([]);
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

    test('shows followed posts in the notification timeline', async () => {
        markNotificationsRead.mockResolvedValue(false);
        fetchFollowingFeed.mockResolvedValue([{
            id: 'post-one',
            user: 'alice',
            content: 'A profile update',
            timestamp: Date.now(),
            likes: ['viewer'],
            replies: []
        }]);
        const wrapper = render();

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();

        expect(wrapper.text()).toContain('A profile update');
        expect(wrapper.find('a[href="/posts/post-one"]')).toHaveLength(1);
        wrapper.unmount();
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
        expect(fetchFollowingFeed).toHaveBeenCalledTimes(1);
        expect(subscribeNotifications).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });

    test('renders PR comment notification text and links to the pull request', async () => {
        markNotificationsRead.mockResolvedValue(false);
        fetchNotifications.mockResolvedValue([{
            id: 'pr-comment-1',
            type: 'comment',
            actor: 'bob',
            projectId: 'p178804',
            projectTitle: 'Cool Game',
            pull: 4,
            commentId: 'c999',
            created: Date.now()
        }]);
        const wrapper = render();

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();

        expect(wrapper.text()).toContain('bob commented on PR #4 in Cool Game');
        expect(wrapper.find('a[href="/project/p178804/pulls/4#comment-id-c999"]')).toHaveLength(1);
        wrapper.unmount();
    });

    test('renders PR mention and reply notification texts and links to the pull request', async () => {
        markNotificationsRead.mockResolvedValue(false);
        fetchNotifications.mockResolvedValue([
            {
                id: 'pr-reply-1',
                type: 'reply',
                actor: 'bob',
                projectId: 'p178804',
                projectTitle: 'Cool Game',
                pull: 4,
                commentId: 'c1001',
                created: Date.now()
            },
            {
                id: 'pr-mention-1',
                type: 'mention',
                actor: 'charlie',
                projectId: 'p178804',
                projectTitle: 'Cool Game',
                pull: 4,
                commentId: 'c1002',
                created: Date.now()
            }
        ]);
        const wrapper = render();

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();

        expect(wrapper.text()).toContain('bob replied to your comment on PR #4 in Cool Game');
        expect(wrapper.find('a[href="/project/p178804/pulls/4#comment-id-c1001"]')).toHaveLength(1);

        expect(wrapper.text()).toContain('charlie mentioned you on PR #4 in Cool Game');
        expect(wrapper.find('a[href="/project/p178804/pulls/4#comment-id-c1002"]')).toHaveLength(1);
        wrapper.unmount();
    });

    test('keeps unread items highlighted for the visit after marking them read', async () => {
        markNotificationsRead.mockResolvedValue(true);
        fetchNotifications.mockResolvedValue([
            {id: 'one', type: 'follow', actor: 'alice', read: false, created: Date.now()},
            {id: 'two', type: 'like', actor: 'bob', user: 'bob', post_id: 'p1', read: true, created: Date.now() - 1000}
        ]);
        const wrapper = render();

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();

        const rows = wrapper.find('li[data-notification-row]').hostNodes();
        expect(markNotificationsRead).toHaveBeenCalledTimes(1);
        expect(rows.filterWhere(node => node.hasClass('module-unread'))
            .map(node => node.text())).toEqual([
            expect.stringContaining('alice followed you')
        ]);
        expect(rows.filterWhere(node => !node.hasClass('module-unread'))
            .map(node => node.text())).toEqual([
            expect.stringContaining('bob liked your post')
        ]);
        wrapper.unmount();
    });

    test('collapses one person\'s run into a row that expands to each post', async () => {
        markNotificationsRead.mockResolvedValue(false);
        const andrew = (id, type, post, ago, extra = {}) => ({
            id, type, post_id: post, user: 'andrew', actor: 'andrew', read: true, timestamp: Date.now() - ago, ...extra
        });
        fetchNotifications.mockResolvedValue([
            andrew('a1', 'reply', 'p1', 0, {content: 'wrong'}),
            andrew('a2', 'pounce', 'p2', 60000),
            andrew('a3', 'like', 'p2', 120000)
        ]);
        const wrapper = render();

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();

        const rows = wrapper.find('li[data-notification-row]').hostNodes();
        expect(rows).toHaveLength(1);
        expect(rows.text()).toContain('andrew liked, pounced and replied to your posts');
        expect(rows.text()).toContain('wrong');
        const toggle = wrapper.find('button[aria-expanded=false]').hostNodes();
        act(() => {
            toggle.simulate('click');
        });
        wrapper.update();
        expect(wrapper.find('button[aria-expanded=true]').hostNodes()).toHaveLength(1);
        expect(wrapper.find('a[href="/posts/p1"]').hostNodes()).toHaveLength(1);
        expect(wrapper.find('a[href="/posts/p2"]').hostNodes()).toHaveLength(2);
        wrapper.unmount();
    });

    test('links space comments to the comment and news to its post', async () => {
        markNotificationsRead.mockResolvedValue(false);
        fetchNotifications.mockResolvedValue([
            {
                id: 'space-comment',
                type: 'space_comment',
                actor: 'bob',
                spaceId: 's1',
                spaceTitle: 'Game Jam',
                commentId: 'c7',
                created: Date.now()
            },
            {id: 'news', type: 'news', title: 'Release notes', newsId: 'n1', created: Date.now()}
        ]);
        const wrapper = render();

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();

        expect(wrapper.text()).toContain('bob commented on Game Jam');
        expect(wrapper.find('a[href="/spaces/s1#comment-id-c7"]')).toHaveLength(1);
        expect(wrapper.text()).toContain('New announcement: Release notes');
        expect(wrapper.find('a[href="/news/n1"]')).toHaveLength(1);
        wrapper.unmount();
    });
});
