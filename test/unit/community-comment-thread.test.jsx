import React from 'react';
import {act} from 'react-dom/test-utils';
import {MemoryRouter} from 'react-router-dom';
import {mount, shallow} from 'enzyme';

import CommentThread, {
    addCreatedComment,
    commentDonationTier,
    mergeCommentPages,
    parseCommentDonation,
    postCommentDonation
} from '../../src/community/components/CommentThread.jsx';
import {useUser} from '../../src/community/UserContext.jsx';
import {sendCommercePayment} from '../../src/community/credits';

jest.mock('../../src/community/UserContext.jsx', () => ({useUser: jest.fn()}));
jest.mock('../../src/community/credits', () => ({
    sendCommercePayment: jest.fn(),
    isInsufficientFunds: jest.fn(() => false)
}));

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

    test('validates and rounds attached donation amounts', () => {
        expect(parseCommentDonation('')).toBe(0);
        expect(parseCommentDonation('1.239')).toBe(1.24);
        expect(parseCommentDonation('0')).toBeNull();
        expect(parseCommentDonation('100000.01')).toBeNull();
        expect(parseCommentDonation('not a number')).toBeNull();
    });

    test('assigns donation highlight tiers at each credit threshold', () => {
        expect(commentDonationTier(0)).toBe('');
        expect(commentDonationTier(0.01)).toBe('green');
        expect(commentDonationTier(10)).toBe('blue');
        expect(commentDonationTier(100)).toBe('purple');
        expect(commentDonationTier(1000)).toBe('gold');
    });

    test('pays the project owner before attaching the donation to a comment', async () => {
        const source = {
            donationIntent: jest.fn(() => Promise.resolve({
                key: 'intent-key',
                amount: 12.5,
                projectId: 'project-1',
                title: 'A project',
                splits: [{username: 'owner', basis_points: 10000}]
            })),
            add: jest.fn(() => Promise.resolve({comment: {id: 'comment-1'}}))
        };
        sendCommercePayment.mockResolvedValueOnce({payment: {id: 'payment-1'}});

        await expect(postCommentDonation({
            source,
            text: 'Nice work',
            kind: 'comment',
            amount: 12.5
        })).resolves.toEqual({comment: {id: 'comment-1'}});

        expect(sendCommercePayment).toHaveBeenCalledWith(expect.objectContaining({
            amount: 12.5,
            kind: 'comment_donation',
            resourceType: 'project',
            resourceId: 'project-1',
            splits: [{username: 'owner', basis_points: 10000}]
        }));
        expect(source.add).toHaveBeenCalledWith('Nice work', null, 'comment', {
            key: 'intent-key',
            paymentId: 'payment-1'
        });
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

        expect(source.list).toHaveBeenCalledWith({offset: 0, limit: 20, anchor: '', sort: 'newest'});
        expect(wrapper.find('[id^="comment-group-"]')).toHaveLength(20);
        const more = wrapper.find('button').filterWhere(button => button.text() === 'Show 5 more comments');
        await act(async () => {
            more.simulate('click');
            await Promise.resolve();
        });
        wrapper.update();

        expect(source.list).toHaveBeenLastCalledWith({offset: 20, limit: 20, sort: 'newest'});
        expect(wrapper.find('[id^="comment-group-"]')).toHaveLength(25);
        wrapper.unmount();
    });

    test('applies comment events from a project subscription', async () => {
        useUser.mockReturnValue({user: null, login: jest.fn()});
        let publish;
        const unsubscribe = jest.fn();
        const source = {
            list: jest.fn(() => Promise.resolve({comments: [], totalRoots: 0, nextOffset: 0})),
            subscribe: jest.fn(listener => {
                publish = listener;
                return unsubscribe;
            })
        };
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <CommentThread source={source} />
            </MemoryRouter>
        );
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });

        act(() => publish({
            type: 'comment_created',
            comment: {id: 'live-comment', author: 'Sophie', content: 'Arrived live', created: 10}
        }));
        wrapper.update();
        expect(wrapper.text()).toContain('Arrived live');

        act(() => publish({
            type: 'comment_edited',
            comment: {id: 'live-comment', author: 'Sophie', content: 'Edited live', edited: 11}
        }));
        wrapper.update();
        expect(wrapper.text()).toContain('Edited live');

        act(() => publish({type: 'comment_deleted', commentId: 'live-comment'}));
        wrapper.update();
        expect(wrapper.text()).not.toContain('Edited live');
        wrapper.unmount();
        expect(unsubscribe).toHaveBeenCalledTimes(1);
    });

    test('sorts pinned root comments before newer unpinned ones', () => {
        expect(mergeCommentPages(
            [{id: 'new', created: 200}],
            [{id: 'old', created: 100, pinned: true, pinnedAt: 150}]
        ).map(comment => comment.id)).toEqual(['old', 'new']);
    });
});
