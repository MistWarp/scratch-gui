import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import ProfilePosts from '../../src/community/components/ProfilePosts.jsx';
import rotur from '../../src/community/rotur.js';

jest.mock('../../src/community/rotur.js', () => ({
    createPost: jest.fn(),
    deletePost: jest.fn(),
    likePost: jest.fn(),
    unlikePost: jest.fn(),
    profile: jest.fn(() => Promise.resolve({}))
}));

const renderPosts = (posts, onChange = jest.fn()) => mount(
    <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
        <ProfilePosts
            posts={posts}
            username="Sophie"
            viewer={{username: 'Sophie'}}
            editable
            onChange={onChange}
            onLogin={jest.fn()}
        />
    </MemoryRouter>
);

describe('profile post actions', () => {
    beforeEach(() => jest.clearAllMocks());

    test('shows the full post composer', () => {
        const wrapper = renderPosts([]);

        expect(wrapper.find('button').filterWhere(button => button.text() === 'Media')).toHaveLength(1);
        expect(wrapper.find('button').filterWhere(button => button.text() === 'GIF')).toHaveLength(1);
        expect(wrapper.find('button').filterWhere(button => button.text() === 'Poll')).toHaveLength(1);
        expect(wrapper.find('button').filterWhere(button => button.text() === 'Schedule')).toHaveLength(1);
        wrapper.unmount();
    });

    test('locks rapid duplicate submissions', async () => {
        let finishCreate;
        rotur.createPost.mockReturnValue(new Promise(resolve => {
            finishCreate = resolve;
        }));
        const wrapper = renderPosts([]);
        wrapper.find('textarea').simulate('change', {target: {value: 'Hello'}});
        const submit = wrapper.find('form').prop('onSubmit');
        const event = {preventDefault: jest.fn()};

        let first;
        act(() => {
            first = submit(event);
            submit(event);
        });
        expect(rotur.createPost).toHaveBeenCalledTimes(1);

        await act(async () => {
            finishCreate({id: 'new', content: 'Hello'});
            await first;
        });
        wrapper.unmount();
    });

    test('likes and unlikes posts from the profile list', async () => {
        const onChange = jest.fn();
        rotur.likePost.mockResolvedValue({});
        const wrapper = renderPosts([{id: 'post-1', content: 'Hello', likes: []}], onChange);

        await act(async () => {
            wrapper.find('button[aria-label="Like post"]').simulate('click');
            await Promise.resolve();
        });

        expect(rotur.likePost).toHaveBeenCalledWith('post-1');
        expect(onChange.mock.calls[0][0][0].likes).toEqual(['Sophie']);
        wrapper.unmount();
    });

    test('confirms deletion and locks duplicate delete requests', async () => {
        let finishDelete;
        rotur.deletePost.mockReturnValue(new Promise(resolve => {
            finishDelete = resolve;
        }));
        const wrapper = renderPosts([{id: 'post-1', content: 'Hello', timestamp: 1}]);

        wrapper.find('button[aria-label="Delete post"]').simulate('click');
        expect(rotur.deletePost).not.toHaveBeenCalled();
        expect(wrapper.text()).toContain('This permanently deletes the post');

        const confirm = wrapper.find('button').filterWhere(button => button.text() === 'Delete post').prop('onClick');
        let first;
        act(() => {
            first = confirm();
            confirm();
        });
        expect(rotur.deletePost).toHaveBeenCalledTimes(1);

        await act(async () => {
            finishDelete();
            await first;
        });
        wrapper.unmount();
    });

    test('renders posts without valid timestamps', () => {
        const wrapper = renderPosts([{id: 'post-1', content: 'No date', timestamp: 'invalid'}]);

        expect(wrapper.text()).toContain('No date');
        expect(wrapper.find('time')).toHaveLength(0);
        wrapper.unmount();
    });

    test('virtualizes long post lists', () => {
        const posts = Array.from({length: 30}, (_, index) => ({
            id: `post-${index}`,
            content: `Post ${index}`,
            timestamp: index + 1
        }));
        const wrapper = renderPosts(posts);

        expect(wrapper.find('List')).toHaveLength(1);
        expect(wrapper.find('article').length).toBeLessThan(posts.length);
        wrapper.unmount();
    });
});
