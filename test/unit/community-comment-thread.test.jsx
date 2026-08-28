import React from 'react';
import {act} from 'react-dom/test-utils';
import {MemoryRouter} from 'react-router-dom';
import {mount, shallow} from 'enzyme';

import CommentThread, {addCreatedComment} from '../../src/community/components/CommentThread.jsx';
import {useUser} from '../../src/community/UserContext.jsx';

jest.mock('../../src/community/UserContext.jsx', () => ({useUser: jest.fn()}));

describe('CommentThread signed-out flow', () => {
    test('adds a returned comment locally and preserves known author playtime', () => {
        expect(addCreatedComment(
            [{id: 'old', author: 'Sophie', playtimeMs: 1200}],
            {id: 'new', author: 'sophie', content: 'Hello'}
        )).toEqual([
            {id: 'new', author: 'sophie', content: 'Hello', playtimeMs: 1200},
            {id: 'old', author: 'Sophie', playtimeMs: 1200}
        ]);
    });

    test('offers a working sign-in action', () => {
        const login = jest.fn();
        useUser.mockReturnValue({user: null, login});
        const source = {list: jest.fn(() => Promise.resolve({comments: []}))};
        const wrapper = shallow(<CommentThread source={source} />);
        const signIn = wrapper.find('button').filterWhere(button => button.text() === 'Sign in');

        expect(signIn).toHaveLength(1);
        signIn.simulate('click');
        expect(login).toHaveBeenCalledTimes(1);
    });

    test('hides zero playtime and shows recorded playtime', async () => {
        useUser.mockReturnValue({user: null, login: jest.fn()});
        const source = {list: jest.fn(() => Promise.resolve({comments: [
            {id: 'zero', author: 'zero', content: 'No playtime', playtimeMs: 0},
            {id: 'played', author: 'played', content: 'Played', playtimeMs: 1000}
        ]}))};
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <CommentThread source={source} />
            </MemoryRouter>
        );

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();

        expect(wrapper.text()).not.toContain('0m played');
        expect(wrapper.text()).toContain('<1m played');
        wrapper.unmount();
    });

    test('renders large discussions in top-level pages', async () => {
        useUser.mockReturnValue({user: null, login: jest.fn()});
        const comments = Array.from({length: 25}, (_, index) => ({
            id: `comment-${index}`,
            author: 'tester',
            content: `Comment ${index}`,
            created: 25 - index,
            reactions: {}
        }));
        const source = {list: jest.fn(() => Promise.resolve({comments}))};
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <CommentThread source={source} />
            </MemoryRouter>
        );

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();

        expect(wrapper.find('[id^="comment-group-"]')).toHaveLength(20);
        const showMore = wrapper.find('button').filterWhere(button => button.text() === 'Show 5 more comments');
        expect(showMore).toHaveLength(1);

        act(() => {
            showMore.simulate('click');
        });
        wrapper.update();
        expect(wrapper.find('[id^="comment-group-"]')).toHaveLength(25);
        wrapper.unmount();
    });

    test('requests the next server page instead of downloading every thread initially', async () => {
        useUser.mockReturnValue({user: null, login: jest.fn()});
        const first = Array.from({length: 20}, (_, index) => ({
            id: `comment-${index}`,
            author: 'tester',
            content: `Comment ${index}`,
            created: 25 - index
        }));
        const rest = Array.from({length: 5}, (_, index) => ({
            id: `comment-${index + 20}`,
            author: 'tester',
            content: `Comment ${index + 20}`,
            created: 5 - index
        }));
        const source = {list: jest.fn(options => Promise.resolve(options.offset ? {
            comments: rest,
            totalRoots: 25,
            nextOffset: 25
        } : {
            comments: first,
            totalRoots: 25,
            nextOffset: 20
        }))};
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <CommentThread source={source} />
            </MemoryRouter>
        );
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();

        expect(source.list).toHaveBeenCalledWith({offset: 0, limit: 20, anchor: ''});
        expect(wrapper.find('[id^="comment-group-"]')).toHaveLength(20);
        const more = wrapper.find('button').filterWhere(button => button.text() === 'Show 5 more comments');
        await act(async () => {
            more.simulate('click');
            await Promise.resolve();
        });
        wrapper.update();

        expect(source.list).toHaveBeenLastCalledWith({offset: 20, limit: 20});
        expect(wrapper.find('[id^="comment-group-"]')).toHaveLength(25);
        wrapper.unmount();
    });
});
