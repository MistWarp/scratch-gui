import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter, Route, Routes} from 'react-router-dom';

import api from '../../src/community/api';
import {commentQuery} from '../../src/community/api/query.js';
import {
    canChangeIssue, commentIssueNumber, commentIssueState, issueThreads, issueTitle, mergeCommentUpdate
} from '../../src/community/comment-issues.js';
import CommentThread from '../../src/community/components/CommentThread.jsx';
import IssueList from '../../src/community/pages/project/IssueList.jsx';
import IssueThread from '../../src/community/pages/project/IssueThread.jsx';
import projectRealtime from '../../src/community/project-realtime.js';
import {useUser} from '../../src/community/UserContext.jsx';

jest.mock('../../src/community/UserContext.jsx', () => ({useUser: jest.fn()}));

const future = {v7_startTransition: true, v7_relativeSplatPath: true};

const settle = async wrapper => {
    for (let index = 0; index < 6; index++) {
        await act(async () => {
            await Promise.resolve();
        });
    }
    wrapper.update();
};

const openIssue = {id: 'c1', author: 'Sam', content: 'The jump is too high\nIt clips the ceiling', created: 10, issue: {number: 2, state: 'open', openedBy: 'Sam'}};
const doneIssue = {id: 'c3', author: 'Ana', content: 'Add a pause menu', created: 5, issue: {number: 1, state: 'done', closedBy: 'mist', closedAt: 20}};
const replies = [
    {id: 'r2', author: 'Sam', content: 'Still happens on level 3', parent: 'c1', created: 30},
    {id: 'r1', author: 'mist', content: 'Looking at it', parent: 'c1', created: 20}
];

describe('comment issue helpers', () => {
    test('read the state and number only for real issues', () => {
        expect(commentIssueState(openIssue)).toBe('open');
        expect(commentIssueState(doneIssue)).toBe('done');
        expect(commentIssueState({id: 'x', issue: {state: 'weird', number: 4}})).toBe('');
        expect(commentIssueState({id: 'x', issue: {state: 'none', number: 4}})).toBe('');
        expect(commentIssueNumber({id: 'x', issue: {state: 'weird', number: 4}})).toBe(0);
        expect(commentIssueNumber(openIssue)).toBe(2);
    });

    test('title an issue by the first line of its comment', () => {
        expect(issueTitle('\n  The jump is too high  \nmore')).toBe('The jump is too high');
        expect(issueTitle('a'.repeat(200), 10)).toBe(`${'a'.repeat(9)}…`);
        expect(issueTitle('')).toBe('');
    });

    test('let the author or the project team change an issue, never on replies', () => {
        expect(canChangeIssue(openIssue, {username: 'sam'}, false)).toBe(true);
        expect(canChangeIssue(openIssue, {username: 'Lee'}, false)).toBe(false);
        expect(canChangeIssue(openIssue, {username: 'Lee'}, true)).toBe(true);
        expect(canChangeIssue(replies[0], {username: 'Sam'}, true)).toBe(false);
        expect(canChangeIssue(openIssue, null, true)).toBe(false);
    });

    test('drop the issue when an update no longer has one', () => {
        expect(mergeCommentUpdate(openIssue, {id: 'c1', content: 'Edited'})).not.toHaveProperty('issue');
        expect(mergeCommentUpdate(openIssue, {id: 'c1', issue: {number: 2, state: 'done'}}).issue.state).toBe('done');
    });

    test('group replies under their issue, newest issue first, replies oldest first', () => {
        const threads = issueThreads([doneIssue, replies[0], openIssue, replies[1], {id: 'c9', author: 'x', content: 'plain'}]);
        expect(threads.map(thread => thread.root.id)).toEqual(['c1', 'c3']);
        expect(threads[0].replies.map(reply => reply.id)).toEqual(['r1', 'r2']);
    });

    test('ask the API for issue threads', () => {
        expect(commentQuery({all: true, issue: 'open'})).toBe('all=1&issue=open');
        expect(commentQuery({all: true, issue: 'any', number: 3})).toBe('all=1&issue=any&number=3');
        expect(commentQuery({all: true, issue: 'nope', number: 3})).toBe('all=1');
    });
});

describe('issue actions on comments', () => {
    afterEach(() => jest.restoreAllMocks());

    const mountThread = (user, comments, issues, issue = jest.fn()) => {
        useUser.mockReturnValue({user, login: jest.fn()});
        const source = {list: jest.fn(() => Promise.resolve({comments})), issue};
        const wrapper = mount(
            <MemoryRouter future={future}>
                <CommentThread
                    source={source}
                    issues={issues}
                />
            </MemoryRouter>
        );
        return {wrapper, source};
    };
    const openMenu = wrapper => {
        act(() => {
            wrapper.find('button[aria-label="Comment actions"]').first()
                .simulate('click');
        });
        wrapper.update();
    };
    const menuItem = (wrapper, label) => wrapper.find('button').filterWhere(button => button.text() === label);

    test('authors track their own comment as an issue and see its badge', async () => {
        const plain = {id: 'c1', author: 'Sam', content: 'Bug', created: 1};
        const issue = jest.fn(() => Promise.resolve({comment: {...plain, issue: {number: 1, state: 'open'}}}));
        const {wrapper} = mountThread({username: 'sam'}, [plain], {canTriage: false, enabled: true, href: n => `/project/p/code/issues/${n}`}, issue);
        await settle(wrapper);
        openMenu(wrapper);
        await act(async () => {
            menuItem(wrapper, 'Track as issue').simulate('click');
            await Promise.resolve();
        });
        wrapper.update();
        expect(issue).toHaveBeenCalledWith('c1', 'open');
        const badge = wrapper.find('a').filterWhere(link => link.text() === 'Issue #1');
        expect(badge.prop('href')).toBe('/project/p/code/issues/1');
        wrapper.unmount();
    });

    test('the project team can mark any issue done but others cannot', async () => {
        let mounted = mountThread({username: 'mist'}, [openIssue], {canTriage: true, enabled: true});
        await settle(mounted.wrapper);
        openMenu(mounted.wrapper);
        expect(menuItem(mounted.wrapper, 'Mark as done')).toHaveLength(1);
        expect(menuItem(mounted.wrapper, 'Stop tracking as issue')).toHaveLength(1);
        mounted.wrapper.unmount();

        mounted = mountThread({username: 'Lee'}, [openIssue], {canTriage: false, enabled: true});
        await settle(mounted.wrapper);
        openMenu(mounted.wrapper);
        expect(menuItem(mounted.wrapper, 'Mark as done')).toHaveLength(0);
        mounted.wrapper.unmount();
    });

    test('nobody can start a new issue when issues are off', async () => {
        const {wrapper} = mountThread({username: 'mist'}, [{id: 'c1', author: 'mist', content: 'x', created: 1}], {canTriage: true, enabled: false});
        await settle(wrapper);
        openMenu(wrapper);
        expect(menuItem(wrapper, 'Track as issue')).toHaveLength(0);
        wrapper.unmount();
    });

    test('with issues off, existing issues can only stop being tracked', async () => {
        const {wrapper} = mountThread({username: 'mist'}, [openIssue], {canTriage: true, enabled: false});
        await settle(wrapper);
        openMenu(wrapper);
        expect(menuItem(wrapper, 'Mark as done')).toHaveLength(0);
        expect(menuItem(wrapper, 'Stop tracking as issue')).toHaveLength(1);
        wrapper.unmount();
    });

    test('an issue that stops being tracked loses its badge', async () => {
        const issue = jest.fn(() => Promise.resolve({comment: {...openIssue, issue: {number: 2, state: 'none'}}}));
        const {wrapper} = mountThread({username: 'Sam'}, [openIssue], {canTriage: false, enabled: true}, issue);
        await settle(wrapper);
        expect(wrapper.text()).toContain('Issue #2');
        openMenu(wrapper);
        await act(async () => {
            menuItem(wrapper, 'Stop tracking as issue').simulate('click');
            await Promise.resolve();
        });
        wrapper.update();
        expect(issue).toHaveBeenCalledWith('c1', 'none');
        expect(wrapper.text()).not.toContain('Issue #2');
        wrapper.unmount();
    });

    test('pages without issues show no issue actions', async () => {
        const {wrapper} = mountThread({username: 'Sam'}, [openIssue], null);
        await settle(wrapper);
        openMenu(wrapper);
        expect(menuItem(wrapper, 'Mark as done')).toHaveLength(0);
        expect(wrapper.text()).toContain('Issue #2');
        wrapper.unmount();
    });
});

describe('developer view issues', () => {
    afterEach(() => jest.restoreAllMocks());

    const project = {id: 'p1', isOwner: false, issuesOff: false, commentsOff: false};

    test('lists each issue with its first comment and latest reply', async () => {
        useUser.mockReturnValue({user: null});
        const getComments = jest.spyOn(api, 'getComments').mockResolvedValue({
            comments: [openIssue, ...replies],
            issueCounts: {open: 1, done: 4}
        });
        const onCounts = jest.fn();
        const wrapper = mount(
            <MemoryRouter future={future}>
                <IssueList
                    id="p1"
                    baseUrl="/project/p1"
                    project={project}
                    onCounts={onCounts}
                />
            </MemoryRouter>
        );
        await settle(wrapper);
        expect(getComments).toHaveBeenCalledWith('p1', {all: true, issue: 'open'});
        expect(onCounts).toHaveBeenCalledWith({open: 1, done: 4});
        const row = wrapper.find('article');
        expect(row).toHaveLength(1);
        const title = row.find('a').filterWhere(link => link.text() === 'The jump is too high');
        expect(title.prop('href')).toBe('/project/p1/code/issues/2');
        expect(row.text()).toContain('Still happens on level 3');
        expect(row.text()).toContain('#2 opened');
        expect(wrapper.text()).toContain('4 finished issues');
        expect(wrapper.find('button').filterWhere(button => button.text() === 'New issue')).toHaveLength(0);

        await act(async () => {
            wrapper.find('button').filterWhere(button => button.text() === '4 finished issues')
                .simulate('click');
            await Promise.resolve();
        });
        expect(getComments).toHaveBeenLastCalledWith('p1', {all: true, issue: 'done'});
        wrapper.unmount();
    });

    test('signed-in people open a new issue as a tracked comment', async () => {
        useUser.mockReturnValue({user: {username: 'Lee'}});
        jest.spyOn(api, 'getComments').mockResolvedValue({comments: [], issueCounts: {open: 0, done: 0}});
        const add = jest.spyOn(api, 'addComment').mockResolvedValue({comment: {id: 'n1', author: 'Lee', content: 'Crash'}});
        const track = jest.spyOn(api, 'setCommentIssue').mockResolvedValue({comment: {id: 'n1', issue: {number: 3, state: 'open'}}});
        const wrapper = mount(
            <MemoryRouter future={future}>
                <IssueList
                    id="p1"
                    baseUrl="/project/p1"
                    project={project}
                />
            </MemoryRouter>
        );
        await settle(wrapper);
        expect(wrapper.text()).toContain('No open issues');
        act(() => {
            wrapper.find('button').filterWhere(button => button.text() === 'New issue')
                .simulate('click');
        });
        wrapper.update();
        wrapper.find('textarea').simulate('change', {target: {value: ' Crash on start '}});
        await act(async () => {
            wrapper.find('form').simulate('submit');
            await Promise.resolve();
        });
        await settle(wrapper);
        expect(add).toHaveBeenCalledWith('p1', 'Crash on start', '');
        expect(track).toHaveBeenCalledWith('p1', 'n1', 'open');
        expect(wrapper.find('textarea')).toHaveLength(0);
        wrapper.unmount();
    });

    test('retries only the tracking when it fails after the comment is posted', async () => {
        useUser.mockReturnValue({user: {username: 'Lee'}});
        jest.spyOn(api, 'getComments').mockResolvedValue({comments: [], issueCounts: {open: 0, done: 0}});
        const add = jest.spyOn(api, 'addComment').mockResolvedValue({comment: {id: 'n1', author: 'Lee', content: 'Crash'}});
        const track = jest.spyOn(api, 'setCommentIssue')
            .mockRejectedValueOnce(new Error('offline'))
            .mockResolvedValueOnce({comment: {id: 'n1', issue: {number: 3, state: 'open'}}});
        const wrapper = mount(
            <MemoryRouter future={future}>
                <IssueList
                    id="p1"
                    baseUrl="/project/p1"
                    project={project}
                />
            </MemoryRouter>
        );
        await settle(wrapper);
        act(() => {
            wrapper.find('button').filterWhere(button => button.text() === 'New issue')
                .simulate('click');
        });
        wrapper.update();
        wrapper.find('textarea').simulate('change', {target: {value: 'Crash'}});
        await act(async () => {
            wrapper.find('form').simulate('submit');
            await Promise.resolve();
        });
        await settle(wrapper);
        expect(wrapper.text()).toContain('Your comment was posted but could not be tracked as an issue.');
        await act(async () => {
            wrapper.find('form').simulate('submit');
            await Promise.resolve();
        });
        await settle(wrapper);
        expect(add).toHaveBeenCalledTimes(1);
        expect(track).toHaveBeenCalledTimes(2);
        expect(wrapper.find('textarea')).toHaveLength(0);
        wrapper.unmount();
    });

    let realtime = null;
    const mountIssue = (user, extra = {}, onChange = jest.fn()) => {
        useUser.mockReturnValue({user});
        jest.spyOn(projectRealtime, 'subscribe').mockImplementation((projectId, listener) => {
            realtime = listener;
            return () => {};
        });
        const getComments = jest.spyOn(api, 'getComments').mockResolvedValue({comments: [openIssue, ...replies]});
        const wrapper = mount(
            <MemoryRouter
                future={future}
                initialEntries={['/project/p1/code/issues/2']}
            >
                <Routes>
                    <Route
                        path="*"
                        element={<IssueThread
                            id="p1"
                            baseUrl="/project/p1"
                            number={2}
                            project={{...project, ...extra}}
                            onChange={onChange}
                        />}
                    />
                </Routes>
            </MemoryRouter>
        );
        return {wrapper, getComments};
    };

    test('shows the whole thread and lets the author mark it done', async () => {
        const onChange = jest.fn();
        const {wrapper, getComments} = mountIssue({username: 'Sam'}, {}, onChange);
        await settle(wrapper);
        expect(getComments).toHaveBeenCalledWith('p1', {all: true, issue: 'any', number: 2});
        expect(wrapper.find('h2').text()).toBe('The jump is too high #2');
        expect(wrapper.find('a').filterWhere(link => link.text() === 'See it with the other comments')
            .prop('href')).toBe('/project/p1/code/comments#comment-id-c1');
        const texts = wrapper.find('article').map(node => node.text());
        expect(texts).toHaveLength(3);
        expect(texts[0]).toContain('It clips the ceiling');
        expect(texts[1]).toContain('Looking at it');
        expect(texts[2]).toContain('Still happens on level 3');

        const setIssue = jest.spyOn(api, 'setCommentIssue').mockResolvedValue({
            comment: {...openIssue, issue: {number: 2, state: 'done', closedBy: 'Sam', closedAt: 50}}
        });
        await act(async () => {
            wrapper.find('button').filterWhere(button => button.text() === 'Mark as done')
                .simulate('click');
            await Promise.resolve();
        });
        await settle(wrapper);
        expect(setIssue).toHaveBeenCalledWith('p1', 'c1', 'done');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(wrapper.text()).toContain('Sam marked this done');
        expect(wrapper.find('button').filterWhere(button => button.text() === 'Reopen issue')).toHaveLength(1);
        wrapper.unmount();
    });

    test('replies are added to the thread', async () => {
        const {wrapper} = mountIssue({username: 'Lee'});
        await settle(wrapper);
        expect(wrapper.find('button').filterWhere(button => button.text() === 'Mark as done')).toHaveLength(0);
        const add = jest.spyOn(api, 'addComment').mockResolvedValue({comment: {id: 'r3', author: 'Lee', content: 'Same here', parent: 'c1', created: 40}});
        wrapper.find('textarea').simulate('change', {target: {value: 'Same here'}});
        await act(async () => {
            wrapper.find('form').simulate('submit');
            await Promise.resolve();
        });
        await settle(wrapper);
        expect(add).toHaveBeenCalledWith('p1', 'Same here', 'c1');
        expect(wrapper.find('article')).toHaveLength(4);
        wrapper.unmount();
    });

    test('follows replies and untracking from other people in real time', async () => {
        const {wrapper} = mountIssue(null);
        await settle(wrapper);
        await act(async () => {
            realtime({type: 'comment_created', comment: {id: 'r9', author: 'Ana', content: 'Me too', parent: 'c1', created: 60}});
            realtime({type: 'comment_created', comment: {id: 'x1', author: 'Ana', content: 'Elsewhere', parent: 'other', created: 61}});
        });
        wrapper.update();
        expect(wrapper.find('article')).toHaveLength(4);
        expect(wrapper.text()).not.toContain('Elsewhere');
        await act(async () => {
            realtime({type: 'comment_edited', comment: {...openIssue, issue: {number: 2, state: 'none'}}});
        });
        wrapper.update();
        expect(wrapper.text()).toContain('Issue not found');
        wrapper.unmount();
    });

    test('hides done and reopen when issues are off', async () => {
        const {wrapper} = mountIssue({username: 'Sam'}, {issuesOff: true});
        await settle(wrapper);
        expect(wrapper.find('button').filterWhere(button => button.text() === 'Mark as done')).toHaveLength(0);
        expect(wrapper.find('textarea')).toHaveLength(1);
        wrapper.unmount();
    });

    test('says when the issue does not exist', async () => {
        useUser.mockReturnValue({user: null});
        jest.spyOn(api, 'getComments').mockResolvedValue({comments: []});
        const wrapper = mount(
            <MemoryRouter future={future}>
                <IssueThread
                    id="p1"
                    baseUrl="/project/p1"
                    number={9}
                    project={project}
                />
            </MemoryRouter>
        );
        await settle(wrapper);
        expect(wrapper.text()).toContain('Issue not found');
        expect(wrapper.find('textarea')).toHaveLength(0);
        wrapper.unmount();
    });
});
