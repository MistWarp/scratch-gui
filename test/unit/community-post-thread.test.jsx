import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import Post from '../../src/community/pages/Post.jsx';
import {useUser} from '../../src/community/UserContext.jsx';
import rotur from '../../src/community/rotur.js';

jest.mock('../../src/community/api.js', () => ({
    __esModule: true,
    projectUrl: project => `/project/${project}`,
    default: {
        checkPostMilestones: jest.fn(() => Promise.resolve()),
        getProject: jest.fn(() => Promise.reject(new Error('none'))),
        loadSession: jest.fn(() => null)
    }
}));
jest.mock('../../src/community/UserContext.jsx', () => ({useUser: jest.fn()}));
jest.mock('../../src/community/page-meta.js', () => jest.fn());
jest.mock('../../src/community/rotur.js', () => ({
    thread: jest.fn(),
    threadReplies: jest.fn(),
    post: jest.fn(),
    viewPost: jest.fn(() => Promise.resolve({views: 9})),
    replyToPost: jest.fn(),
    pounceAllowance: jest.fn(() => Promise.resolve(null)),
    reportImpressions: jest.fn(),
    likePost: jest.fn(),
    unlikePost: jest.fn(),
    bookmarks: jest.fn(() => Promise.resolve([])),
    blockedUsers: jest.fn(() => Promise.resolve({blocked: []}))
}));
jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

const render = () => mount(
    <MemoryRouter
        initialEntries={['/posts/p1']}
        future={{v7_startTransition: true, v7_relativeSplatPath: true}}
    >
        <Routes>
            <Route
                path="/posts/:id"
                element={<Post />}
            />
        </Routes>
    </MemoryRouter>
);

const settle = async wrapper => {
    for (let i = 0; i < 5; i++) {
        await act(async () => {
            await Promise.resolve();
        });
    }
    wrapper.update();
};

const post = (id, extra = {}) => ({id, user: 'mist', content: `Post ${id}`, timestamp: 1, pounce_count: 0, ...extra});

describe('post page threads', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useUser.mockReturnValue({user: {username: 'viewer'}, login: jest.fn()});
    });

    test('shows the chain above the post and its replies with previews', async () => {
        rotur.thread.mockResolvedValue({
            ancestors: [post('root'), {id: 'gone', deleted: true}],
            post: post('p1', {reply_to: 'gone', reply_count: 2}),
            replies: {
                items: [
                    post('r1', {reply_count: 3, reply_preview: [post('r1a'), post('r1b')]}),
                    post('r2', {user: 'flufi'})
                ],
                next_cursor: 'next'
            },
            sort: 'relevant'
        });
        rotur.threadReplies.mockResolvedValue({items: [post('r3')], next_cursor: null});
        const wrapper = render();
        await settle(wrapper);

        const texts = wrapper.find('article').map(node => node.find('RichText').first()
            .prop('text'));
        expect(texts).toEqual(['Post root', 'Post p1', 'Post r1', 'Post r1a', 'Post r1b', 'Post r2']);
        expect(wrapper.text()).toContain('This post was deleted.');
        expect(wrapper.find('a[href="/posts/r1"]').filterWhere(node => node.text() === 'Show 1 more reply'))
            .toHaveLength(1);
        expect(rotur.post).not.toHaveBeenCalled();

        await act(async () => {
            wrapper.find('button').filterWhere(node => node.text() === 'Show more replies')
                .simulate('click');
        });
        await settle(wrapper);
        expect(rotur.threadReplies).toHaveBeenCalledWith('p1', {sort: 'relevant', cursor: 'next'});
        expect(wrapper.find('article').last()
            .find('RichText')
            .prop('text')).toBe('Post r3');
        wrapper.unmount();
    });

    test('adds a new reply to the top of the list', async () => {
        rotur.thread.mockResolvedValue({
            ancestors: [], post: post('p1'), replies: {items: [], next_cursor: null}, sort: 'relevant'
        });
        rotur.replyToPost.mockResolvedValue({id: 'new', user: 'viewer', content: 'Nice'});
        const wrapper = render();
        await settle(wrapper);
        expect(wrapper.text()).toContain('No replies yet');
        act(() => {
            wrapper.find('textarea[aria-label="Post your reply"]').simulate('change', {target: {value: 'Nice'}});
        });
        await act(async () => {
            wrapper.find('form').last()
                .simulate('submit');
        });
        await settle(wrapper);
        expect(rotur.replyToPost).toHaveBeenCalledWith('p1', 'Nice');
        expect(wrapper.find('article').map(node => node.find('RichText').first()
            .prop('text'))).toEqual(['Post p1', 'Nice']);
        wrapper.unmount();
    });

    test('falls back to the flat replies when the API has no threads', async () => {
        rotur.thread.mockResolvedValue(null);
        rotur.post.mockResolvedValue(post('p1', {replies: [{id: 'old', user: 'flufi', content: 'old reply', timestamp: 1}]}));
        const wrapper = render();
        await settle(wrapper);
        expect(rotur.post).toHaveBeenCalledWith('p1');
        expect(wrapper.text()).toContain('old reply');
        expect(wrapper.find('ThreadReplies').exists()).toBe(false);
        wrapper.unmount();
    });

    test('says when the post does not exist', async () => {
        rotur.thread.mockRejectedValue(Object.assign(new Error('Post not found'), {status: 404, code: 'post_not_found'}));
        const wrapper = render();
        await settle(wrapper);
        expect(wrapper.text()).toContain('Post not found');
        expect(rotur.post).not.toHaveBeenCalled();
        wrapper.unmount();
    });
});
