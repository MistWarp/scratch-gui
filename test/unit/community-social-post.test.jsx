import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';
import SocialPost from '../../src/community/components/SocialPost.jsx';
import {useUser} from '../../src/community/UserContext.jsx';
import rotur from '../../src/community/rotur.js';

jest.mock('../../src/community/api.js', () => ({
    __esModule: true,
    projectUrl: project => `/project/${typeof project === 'object' ? project.id : project}`,
    default: {
        checkPostMilestones: jest.fn(() => Promise.resolve()),
        getProject: jest.fn(id => Promise.resolve({project: {
            id, title: `Game ${id}`, owner: 'alice', loveCount: 3, views: 12, shared: id !== 'secret'
        }}))
    }
}));

jest.mock('../../src/community/UserContext.jsx', () => ({useUser: jest.fn()}));
jest.mock('../../src/community/rotur.js', () => ({
    likePost: jest.fn(),
    unlikePost: jest.fn(),
    pounce: jest.fn(),
    unpounce: jest.fn(),
    pounceAllowance: jest.fn(),
    reportImpressions: jest.fn(),
    bookmarks: jest.fn(() => Promise.resolve([])),
    blockedUsers: jest.fn(() => Promise.resolve({blocked: []}))
}));
jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

describe('social post list actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useUser.mockReturnValue({user: {username: 'viewer'}, login: jest.fn()});
        rotur.likePost.mockResolvedValue({});
        rotur.pounceAllowance.mockResolvedValue({left: 3, daily: 3, resets_at: Date.now() + 3600000});
    });

    test('likes a post without leaving the list', async () => {
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <SocialPost initialPost={{id: 'post-1', user: 'alice', content: 'Hello', likes: []}} />
            </MemoryRouter>
        );

        await act(async () => {
            wrapper.find('button[aria-label="Like post"]').simulate('click');
            await Promise.resolve();
        });
        wrapper.update();

        expect(rotur.likePost).toHaveBeenCalledWith('post-1');
        expect(wrapper.find('button[aria-label="Unlike post"]').text()).toContain('1');
        wrapper.unmount();
    });

    test('shows a card for the MistWarp project a post links to', async () => {
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <SocialPost
                    initialPost={{
                        id: 'post-2',
                        user: 'alice',
                        content: 'Play my game https://mistwarp.org/project/abc123!',
                        likes: []
                    }}
                />
            </MemoryRouter>
        );
        await act(async () => {
            await Promise.resolve();
        });
        wrapper.update();
        const card = wrapper.find('PostProjectCard').find('a');
        expect(card.prop('href')).toBe('/project/abc123');
        expect(card.text()).toContain('Game abc123');
        expect(card.text()).toContain('by alice');
        expect(card.text()).toContain('3 loves');
        wrapper.unmount();
    });

    test('prefers the made_with project the API returns', async () => {
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <SocialPost
                    initialPost={{
                        id: 'post-3',
                        user: 'alice',
                        content: 'New update',
                        made_with: {app: 'MistWarp', kind: 'project', ref: 'p77', url: 'https://mistwarp.org/project/p77'}
                    }}
                />
            </MemoryRouter>
        );
        await act(async () => {
            await Promise.resolve();
        });
        wrapper.update();
        expect(wrapper.find('PostProjectCard').find('a')
            .prop('href')).toBe('/project/p77');
        wrapper.unmount();
    });

    test('falls back to the plain link for projects that are not shared', async () => {
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <SocialPost
                    initialPost={{
                        id: 'post-4',
                        user: 'alice',
                        content: 'see https://mistwarp.org/project/secret',
                        made_with: {
                            app: 'MistWarp',
                            kind: 'project',
                            ref: 'secret',
                            url: 'https://mistwarp.org/project/secret',
                            image: 'https://tracker.example/pixel.png'
                        }
                    }}
                />
            </MemoryRouter>
        );
        await act(async () => {
            await Promise.resolve();
        });
        wrapper.update();
        expect(wrapper.find('PostProjectCard').find('a')).toHaveLength(0);
        expect(wrapper.html()).not.toContain('tracker.example');
        wrapper.unmount();
    });

    const mountPost = post => mount(
        <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
            <SocialPost initialPost={post} />
        </MemoryRouter>
    );
    const settle = async wrapper => {
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();
    };

    test('uses v2 counts when the post has no legacy arrays', async () => {
        const wrapper = mountPost({
            id: 'v2',
            user: 'alice',
            content: 'Hi',
            like_count: 5,
            reply_count: 2,
            pounce_count: 1,
            viewer: {liked: true, pounced: false}
        });
        await settle(wrapper);
        expect(wrapper.find('button[aria-label="Unlike post"]').text()).toContain('5');
        expect(wrapper.find('button[aria-label="Reply, 2 replies"]').exists()).toBe(true);
        expect(wrapper.find('button[aria-label="Pounce, 1 pounce"]').exists()).toBe(true);
        wrapper.unmount();
    });

    test('hides the pounce button when the API has no pounces', async () => {
        const wrapper = mountPost({id: 'old', user: 'alice', content: 'Hi', likes: []});
        await settle(wrapper);
        expect(wrapper.find('button[aria-label^="Pounce"]').exists()).toBe(false);
        expect(wrapper.find('button[aria-label^="Undo pounce"]').exists()).toBe(false);
        wrapper.unmount();
    });

    test('pounces a post and says how many are left', async () => {
        rotur.pounce.mockResolvedValue({pounced: true, pounce_count: 3, pounces_left: 2});
        const wrapper = mountPost({id: 'p', user: 'alice', content: 'Hi', pounce_count: 2, viewer: {pounced: false}});
        await settle(wrapper);
        await act(async () => {
            wrapper.find('button[aria-label="Pounce, 2 pounces"]').simulate('click');
            await Promise.resolve();
        });
        await settle(wrapper);
        expect(rotur.pounce).toHaveBeenCalledWith('p');
        const button = wrapper.find('button[aria-label="Undo pounce, 3 pounces"]');
        expect(button.prop('aria-pressed')).toBe(true);
        expect(wrapper.text()).toContain('Pounced. 2 pounces left today.');
        wrapper.unmount();
    });

    test('rolls a pounce back when none are left', async () => {
        rotur.pounce.mockRejectedValue(Object.assign(new Error('No'), {
            code: 'no_pounces_left', data: {resets_at: 0}
        }));
        const wrapper = mountPost({id: 'q', user: 'alice', content: 'Hi', pounce_count: 0});
        await settle(wrapper);
        await act(async () => {
            wrapper.find('button[aria-label="Pounce, 0 pounces"]').simulate('click');
            await Promise.resolve();
        });
        await settle(wrapper);
        expect(wrapper.find('button[aria-label="Pounce, 0 pounces"]').prop('aria-pressed')).toBe(false);
        expect(wrapper.text()).toContain('You have used all of today\'s pounces.');
        wrapper.unmount();
    });

    test('does not pounce your own post', async () => {
        useUser.mockReturnValue({user: {username: 'alice'}, login: jest.fn()});
        const wrapper = mountPost({id: 'mine', user: 'alice', content: 'Hi', pounce_count: 0});
        await settle(wrapper);
        await act(async () => {
            wrapper.find('button[aria-label="Pounce, 0 pounces"]').simulate('click');
            await Promise.resolve();
        });
        wrapper.update();
        expect(rotur.pounce).not.toHaveBeenCalled();
        expect(wrapper.text()).toContain('You cannot pounce your own post.');
        wrapper.unmount();
    });

    const whyButton = wrapper => wrapper.find('button[aria-label="Why am I seeing this post?"]');

    test('shows why a For You post is there', async () => {
        const wrapper = mountPost({
            id: 'fy',
            user: 'alice',
            content: 'Hi',
            reasons: [{type: 'pounced_by', users: ['mist']}, {type: 'fresh'}],
            pounced_by: ['mist']
        });
        await settle(wrapper);
        const why = whyButton(wrapper);
        expect(why).toHaveLength(1);
        expect(why.text()).toBe('Why?');
        expect(why.closest('header').exists()).toBe(true);
        expect(wrapper.find('li')).toHaveLength(0);
        act(() => {
            why.simulate('click');
        });
        wrapper.update();
        const items = wrapper.find('li').map(node => node.text());
        expect(items).toEqual(['Pounced by @mist', 'Posted recently']);
        expect(wrapper.find('a[href="https://pounce.rotur.dev/settings/for-you"]').exists()).toBe(true);
        wrapper.unmount();
    });

    test('only offers a why for reasons that say something', async () => {
        const weak = mountPost({
            id: 'weak',
            user: 'alice',
            content: 'Hi',
            reasons: [{type: 'fresh'}, {type: 'recent'}, {type: 'from_earlier'}]
        });
        await settle(weak);
        expect(whyButton(weak).exists()).toBe(false);
        weak.unmount();

        for (const reason of [
            {type: 'new_voice'}, {type: 'followed_author'}, {type: 'friend_replied', count: 2}, {type: 'popular'},
            {type: 'conversation', replies: 3}, {type: 'made_with', app: 'MistWarp'}, {type: 'group_match', group: 'iswt'}
        ]) {
            const wrapper = mountPost({id: `s-${reason.type}`, user: 'alice', content: 'Hi', reasons: [reason, {type: 'fresh'}]});
            await settle(wrapper);
            expect(whyButton(wrapper)).toHaveLength(1);
            wrapper.unmount();
        }
    });

    test('labels a pinned post only on its author\'s profile', async () => {
        const pinned = {id: 'pin', user: 'alice', content: 'Pinned one', pinned: true};
        const feed = mountPost(pinned);
        await settle(feed);
        expect(feed.find('p').filterWhere(node => node.text() === 'Pinned')).toHaveLength(0);
        feed.unmount();

        const profile = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <SocialPost
                    initialPost={pinned}
                    onProfile
                />
            </MemoryRouter>
        );
        await settle(profile);
        expect(profile.find('p').filterWhere(node => node.text() === 'Pinned')).toHaveLength(1);
        profile.unmount();

        const detail = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <SocialPost
                    initialPost={pinned}
                    onProfile
                    detail
                    hideReplies
                />
            </MemoryRouter>
        );
        await settle(detail);
        expect(detail.find('p').filterWhere(node => node.text() === 'Pinned')).toHaveLength(0);
        detail.unmount();
    });

    test('keeps line breaks without breaking links or mentions', async () => {
        const wrapper = mountPost({
            id: 'lines',
            user: 'alice',
            content: '\nfirst line @bob\nhttps://example.com/a\n\nlast line\n',
            like_count: 0
        });
        await settle(wrapper);
        const content = wrapper.find('RichText');
        expect(content.prop('text')).toBe('first line @bob\nhttps://example.com/a\n\nlast line');
        expect(content.text()).toBe('first line @bob\nexample.com/a\n\nlast line');
        expect(wrapper.find('a[href="/users/bob"]').text()).toBe('@bob');
        expect(wrapper.find('a[href="https://example.com/a"]').text()).toBe('example.com/a');
        wrapper.unmount();
    });

    test('shows only the icon when a count is zero', async () => {
        const wrapper = mountPost({
            id: 'zero',
            user: 'alice',
            content: 'Hi',
            like_count: 0,
            reply_count: 0,
            pounce_count: 0,
            viewer: {liked: false, pounced: false}
        });
        await settle(wrapper);
        expect(wrapper.find('button[aria-label="Like post"]').text()).toBe('');
        expect(wrapper.find('button[aria-label="Reply, 0 replies"]').text()).toBe('');
        expect(wrapper.find('button[aria-label="Pounce, 0 pounces"]').text()).toBe('');
        wrapper.unmount();

        const counted = mountPost({
            id: 'some',
            user: 'alice',
            content: 'Hi',
            like_count: 4,
            reply_count: 1,
            pounce_count: 2,
            viewer: {liked: false, pounced: false}
        });
        await settle(counted);
        expect(counted.find('button[aria-label="Like post"]').text()).toBe('4');
        expect(counted.find('button[aria-label="Reply, 1 reply"]').text()).toBe('1');
        expect(counted.find('button[aria-label="Pounce, 2 pounces"]').text()).toBe('2');
        counted.unmount();
    });

    test('shortens long links but keeps where they go', async () => {
        const url = 'https://originchats.com/message/chats.mistium.com/general/5e105412-c2bb-420f-a37e-a10ecee38c9a';
        const wrapper = mountPost({id: 'link', user: 'alice', content: `true... ${url}`});
        await settle(wrapper);
        const link = wrapper.find(`a[href="${url}"]`);
        expect(link.text()).toBe('originchats.com/message/\u2026/5e105\u2026');
        expect(link.prop('title')).toBe(url);
        wrapper.unmount();
    });

    test('labels promoted posts on the card', async () => {
        const wrapper = mountPost({
            id: 'ad',
            user: 'alice',
            content: 'Hi',
            placement: 'promoted',
            promoted_by: 'bob',
            reasons: [{type: 'promoted', by: 'bob'}]
        });
        await settle(wrapper);
        expect(wrapper.text()).toContain('Promoted by @bob');
        expect(wrapper.find('button[aria-expanded]').filterWhere(node => node.text().includes('Promoted'))).toHaveLength(0);
        wrapper.unmount();
    });

    test('says which post a reply answers', async () => {
        const wrapper = mountPost({
            id: 'r',
            user: 'alice',
            content: 'Agreed',
            reply_to: 'p1',
            root_id: 'p0',
            self_thread: true,
            reply_to_user: {username: 'alice'}
        });
        await settle(wrapper);
        expect(wrapper.find('a[href="/posts/p1"]').text()).toBe('Replying to @alice');
        expect(wrapper.find('a[href="/posts/p0"]').text()).toBe('Show this thread');
        wrapper.unmount();
    });
});
