import React from 'react';
import {act} from 'react-dom/test-utils';
import {MemoryRouter} from 'react-router-dom';
import {mount, shallow} from 'enzyme';

import CommentThread, {
    addCreatedComment,
    applyCommentReaction,
    commentDonationTier,
    mergeCommentPages,
    parseCommentDonation,
    postCommentDonation
} from '../../src/community/components/CommentThread.jsx';
import {useUser} from '../../src/community/UserContext.jsx';
import {payWithRotur} from '../../src/lib/rotur/payment-window.js';

jest.mock('../../src/community/UserContext.jsx', () => ({useUser: jest.fn()}));
jest.mock('../../src/lib/rotur/payment-window.js', () => ({
    payWithRotur: jest.fn(async ({start, confirm}) => {
        const intent = await start('https://mistwarp.org/projects/project-1');
        return {intent, result: await confirm(intent)};
    })
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

    test('pays on Rotur before attaching the donation to a comment', async () => {
        const source = {
            donationIntent: jest.fn(() => Promise.resolve({
                key: 'mwdonate_1',
                requestId: 'pr_1',
                approveUrl: 'https://rotur.dev/pay/approve/pr_1',
                amount: 12.5
            })),
            add: jest.fn(() => Promise.resolve({comment: {id: 'comment-1'}}))
        };

        await expect(postCommentDonation({
            source,
            text: 'Nice work',
            kind: 'comment',
            amount: 12.5
        })).resolves.toEqual({comment: {id: 'comment-1'}});

        expect(payWithRotur).toHaveBeenCalledTimes(1);
        expect(source.donationIntent).toHaveBeenCalledWith(12.5, 'https://mistwarp.org/projects/project-1');
        expect(source.add).toHaveBeenCalledWith('Nice work', null, 'comment', {key: 'mwdonate_1'});
    });

    test('lets a signed-out visitor write first and asks for sign-in on submit', () => {
        const loginOrThrow = jest.fn(() => Promise.resolve());
        useUser.mockReturnValue({user: null, loginOrThrow});
        const source = {list: jest.fn(() => Promise.resolve({comments: []})), add: jest.fn()};
        const wrapper = shallow(<CommentThread source={source} />);
        const composer = () => wrapper.findWhere(node => node.prop('placeholder') === 'Add a comment');

        expect(composer()).toHaveLength(1);
        composer().prop('onChange')('Nice project');
        wrapper.update();
        composer().prop('onSubmit')();
        expect(loginOrThrow).toHaveBeenCalledTimes(1);
        expect(source.add).not.toHaveBeenCalled();
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

    test('toggles and switches reactions locally', () => {
        const comment = {id: 'c', reactionCounts: {heart: 2, brokenheart: 1}, myReaction: 'heart'};
        expect(applyCommentReaction(comment, 'heart')).toMatchObject({
            reactionCounts: {heart: 1, brokenheart: 1}, myReaction: ''
        });
        expect(applyCommentReaction(comment, 'brokenheart')).toMatchObject({
            reactionCounts: {heart: 1, brokenheart: 2}, myReaction: 'brokenheart'
        });
        expect(applyCommentReaction({id: 'c'}, 'heart')).toMatchObject({
            reactionCounts: {heart: 1}, myReaction: 'heart'
        });
    });
});

const flush = async () => {
    await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
    });
};
const mountThread = props => mount(
    <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
        <CommentThread {...props} />
    </MemoryRouter>
);
const manyComments = Array.from({length: 8}, (_, index) => ({
    id: `c${index}`,
    author: 'other',
    content: `Comment ${index}`,
    created: 10 - index,
    reactionCounts: {heart: 1},
    myReaction: ''
}));

describe('CommentThread drafts and reactions', () => {
    beforeEach(() => {
        sessionStorage.clear();
        useUser.mockReturnValue({user: {username: 'me'}, loginOrThrow: jest.fn()});
    });

    test('keeps the draft and filters when the sort order changes', async () => {
        const source = {list: jest.fn(() => Promise.resolve({comments: manyComments}))};
        const wrapper = mountThread({source, projectComments: true, draftKey: 'project-1'});
        await flush();
        wrapper.update();

        const composer = () => wrapper.find('textarea[aria-label="Add a comment"]');
        composer().simulate('change', {target: {value: 'Half written'}});
        wrapper.find('input[type="search"]').simulate('change', {target: {value: 'Comment'}});
        expect(sessionStorage.getItem('mw-community-draft:comment:project-1')).toBe('Half written');

        const sortMenu = wrapper.find('SelectMenu').filterWhere(menu => menu.prop('ariaLabel') === 'Sort comments');
        act(() => sortMenu.prop('onChange')('donations'));
        await flush();
        wrapper.update();

        expect(source.list).toHaveBeenLastCalledWith(expect.objectContaining({sort: 'donations'}));
        expect(composer().prop('value')).toBe('Half written');
        expect(wrapper.find('input[type="search"]').prop('value')).toBe('Comment');
        wrapper.unmount();
    });

    test('restores a saved draft and clears it once posted', async () => {
        sessionStorage.setItem('mw-community-draft:comment:project-2', 'Saved earlier');
        const source = {
            list: jest.fn(() => Promise.resolve({comments: []})),
            add: jest.fn(() => Promise.resolve({comment: {id: 'new', author: 'me', content: 'Saved earlier'}}))
        };
        const wrapper = mountThread({source, draftKey: 'project-2'});
        await flush();
        wrapper.update();
        const composer = () => wrapper.find('textarea[aria-label="Add a comment"]');
        expect(composer().prop('value')).toBe('Saved earlier');

        await act(async () => {
            wrapper.find('button').filterWhere(button => button.text() === 'Post')
                .simulate('click');
            await Promise.resolve();
        });
        wrapper.update();

        expect(source.add).toHaveBeenCalledWith('Saved earlier', null, 'comment');
        expect(composer().prop('value')).toBe('');
        expect(sessionStorage.getItem('mw-community-draft:comment:project-2')).toBeNull();
        wrapper.unmount();
    });

    test('shows a reaction at once, locks only that comment and rolls back on failure', async () => {
        let reject;
        const source = {
            list: jest.fn(() => Promise.resolve({comments: manyComments.slice(0, 2)})),
            react: jest.fn(() => new Promise((_, fail) => {
                reject = fail;
            }))
        };
        const wrapper = mountThread({source});
        await flush();
        wrapper.update();
        const like = id => wrapper.find(`#comment-id-${id} button[aria-label="Like"]`);

        act(() => {
            like('c0').simulate('click');
        });
        wrapper.update();
        expect(source.react).toHaveBeenCalledWith('c0', 'heart');
        expect(like('c0').prop('aria-pressed')).toBe(true);
        expect(like('c0').text()).toBe('2');
        expect(like('c0').prop('disabled')).toBe(true);
        expect(like('c1').prop('disabled')).toBe(false);

        await act(async () => {
            reject(new Error('Offline'));
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();
        expect(like('c0').prop('aria-pressed')).toBe(false);
        expect(like('c0').text()).toBe('1');
        expect(like('c0').prop('disabled')).toBe(false);
        expect(wrapper.text()).toContain('Offline');
        wrapper.unmount();
    });
});
