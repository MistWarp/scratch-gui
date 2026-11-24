import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter, Route, Routes, useNavigate} from 'react-router-dom';

jest.mock('../../src/community/UserContext.jsx', () => ({
    useUser: () => ({user: {username: 'sam'}, loading: false, login: jest.fn()})
}));
jest.mock('../../src/community/use-resolved-project-id.js', () => ({
    useResolvedProjectId: () => ({projectId: 'target', resolving: false, resolveError: ''}),
    projectBaseUrl: () => '/project/target'
}));
jest.mock('../../src/community/api', () => ({
    __esModule: true,
    projectUrl: () => '/project/target',
    default: {
        getProject: jest.fn(),
        getPull: jest.fn(),
        pullTimeline: jest.fn(),
        pullChanges: jest.fn(),
        pullDiff: jest.fn(),
        mergePull: jest.fn(),
        closePull: jest.fn(),
        uploadPullMerge: jest.fn(),
        commitTree: jest.fn(),
        commitFile: jest.fn(),
        loadSession: jest.fn(() => 'session')
    }
}));
jest.mock('../../src/lib/git/mwp.js', () => ({
    buildProjectArtifactsFromFileEntries: jest.fn(() => Promise.resolve({sb3: 'sb3', tree: 'tree'}))
}));

import api from '../../src/community/api';
import PullRequest from '../../src/community/pages/PullRequest.jsx';

const sha = letter => letter.repeat(40);
const encode = value => Buffer.from(value).toString('base64');
const pull = {
    index: 2,
    title: 'Slow the cat down',
    body: '',
    state: 'open',
    user: 'mist',
    sourceOwner: 'mist',
    sourceProjectId: 'fork',
    targetProjectId: 'target',
    baseCommit: sha('a'),
    headCommit: sha('b'),
    created: 1790000000000,
    canInspect: true,
    canMerge: true,
    canClose: true
};
const conflictMerge = {
    ok: true,
    merged: false,
    pull,
    expectedHead: sha('c'),
    sourceHead: sha('b'),
    targetProjectId: 'target',
    sourceProjectId: 'fork',
    merge: {ok: true, changes: [{path: 'Cat/main.fractch', conflict: true, content: encode('<<<<<<<<< target\nmove 5\n=========\nmove 20\n>>>>>>>>> pull request')}]}
};

const settle = async wrapper => {
    for (let index = 0; index < 8; index++) {
        await act(async () => {
            await Promise.resolve();
        });
    }
    wrapper.update();
};

const navigation = {go: null};
const Navigator = () => {
    navigation.go = useNavigate();
    return null;
};

const mounted = [];
const mountPullPage = options => mount(
    <MemoryRouter
        initialEntries={['/project/target/pulls/2']}
        future={{v7_startTransition: true, v7_relativeSplatPath: true}}
    >
        <Navigator />
        <Routes>
            <Route
                path="/project/:id/pulls/:index"
                element={<PullRequest />}
            />
        </Routes>
    </MemoryRouter>,
    options
);
const mountPull = (options = {}) => {
    const wrapper = mountPullPage(options);
    mounted.push(wrapper);
    return wrapper;
};

const button = (wrapper, label) => wrapper.find('button').filterWhere(item => item.text().includes(label));

const openConflicts = async () => {
    const wrapper = mountPull();
    await settle(wrapper);
    await act(async () => {
        button(wrapper, 'Merge pull request').simulate('click');
    });
    await settle(wrapper);
    act(() => {
        wrapper.find('MergeConflicts').find('textarea')
            .props()
            .onChange({target: {value: 'resolved'}});
    });
    wrapper.update();
    return wrapper;
};

describe('pull request merges', () => {
    afterEach(() => {
        while (mounted.length) {
            const wrapper = mounted.pop();
            act(() => {
                wrapper.unmount();
            });
        }
    });

    beforeEach(() => {
        sessionStorage.clear();
        api.getProject.mockReset().mockImplementation(id => Promise.resolve({
            project: {id, title: id, owner: 'sam', isOwner: id === 'target', canViewSource: true, gitHead: sha('c')}
        }));
        api.getPull.mockReset().mockResolvedValue({pull});
        api.pullTimeline.mockReset().mockResolvedValue({comments: [], commits: [], targetCommits: []});
        api.mergePull.mockReset().mockResolvedValue(conflictMerge);
        api.uploadPullMerge.mockReset();
        api.commitTree.mockReset().mockResolvedValue({files: [{path: 'Cat/main.fractch'}]});
        api.commitFile.mockReset().mockResolvedValue({content: encode('cat')});
    });

    test('an open conflict session replaces the merge button until it is cancelled', async () => {
        const wrapper = mountPull();
        await settle(wrapper);
        await act(async () => {
            button(wrapper, 'Merge pull request').simulate('click');
        });
        await settle(wrapper);
        expect(wrapper.text()).toContain('Resolve merge conflicts');
        expect(button(wrapper, 'Merge pull request')).toHaveLength(0);
        expect(wrapper.text()).toContain('Resolve the conflicts below to finish merging.');

        await act(async () => {
            button(wrapper, 'Save resolutions and merge').simulate('click');
        });
        await settle(wrapper);
        expect(wrapper.find('MergeConflicts').text()).toContain('Resolve the conflict in Cat/main.fractch.');
        expect(api.uploadPullMerge).not.toHaveBeenCalled();

        act(() => {
            button(wrapper, 'Cancel').simulate('click');
        });
        wrapper.update();
        expect(wrapper.text()).not.toContain('Resolve merge conflicts');
        expect(button(wrapper, 'Merge pull request')).toHaveLength(1);
    });

    test('a remix that moved during the merge closes the session and reloads the pull request', async () => {
        const moved = Object.assign(new Error('the remix changed'), {code: 'pull_head_changed', status: 409});
        api.uploadPullMerge.mockRejectedValue(moved);
        const wrapper = await openConflicts();
        expect(api.getPull).toHaveBeenCalledTimes(1);

        await act(async () => {
            button(wrapper, 'Save resolutions and merge').simulate('click');
        });
        await settle(wrapper);

        expect(api.uploadPullMerge).toHaveBeenCalledWith('target', expect.objectContaining({
            expectedHead: sha('c'),
            sourceHead: sha('b'),
            pullId: 2
        }));
        expect(wrapper.text()).not.toContain('Resolve merge conflicts');
        expect(api.getPull).toHaveBeenCalledTimes(2);
        expect(wrapper.text()).toContain('The remix changed while you were merging. Review the new changes, then merge again.');
        expect(button(wrapper, 'Merge pull request')).toHaveLength(1);
    });

    test('a refusal that needs no reload keeps the resolutions open with the reason beside them', async () => {
        const dirty = Object.assign(new Error('raw'), {code: 'uncommitted_changes', status: 409});
        api.uploadPullMerge.mockRejectedValue(dirty);
        const wrapper = await openConflicts();
        await act(async () => {
            button(wrapper, 'Save resolutions and merge').simulate('click');
        });
        await settle(wrapper);

        expect(wrapper.text()).toContain('Resolve merge conflicts');
        expect(wrapper.find('MergeConflicts').text()).toContain('Commit the changes saved in this project before merging this pull request.');
        expect(api.getPull).toHaveBeenCalledTimes(1);
    });

    test('a file view still loading when the merge restarts is replaced by the new head', async () => {
        let answerOld;
        api.pullChanges.mockReset()
            .mockReturnValueOnce(new Promise(resolve => {
                answerOld = resolve;
            }))
            .mockResolvedValue({inspection: {ok: true, targets: []}, pull: {...pull, headCommit: sha('d')}});
        api.mergePull.mockRejectedValue(Object.assign(new Error('moved'), {code: 'pull_head_changed', status: 409}));
        const wrapper = mountPull();
        await settle(wrapper);
        const tab = label => wrapper.find('[role="tab"]').filterWhere(item => item.text().includes(label));
        await act(async () => {
            tab('Files changed').simulate('click');
        });
        await settle(wrapper);
        expect(api.pullChanges).toHaveBeenCalledTimes(1);
        await act(async () => {
            tab('Conversation').simulate('click');
        });
        await settle(wrapper);
        api.getPull.mockResolvedValue({pull: {...pull, headCommit: sha('d')}});
        await act(async () => {
            button(wrapper, 'Merge pull request').simulate('click');
        });
        await settle(wrapper);
        await act(async () => {
            answerOld({inspection: {ok: true, targets: []}, pull});
        });
        await settle(wrapper);
        await act(async () => {
            tab('Files changed').simulate('click');
        });
        await settle(wrapper);
        expect(api.pullChanges).toHaveBeenCalledTimes(2);
    });

    test('a project that moved during the upload closes the session with a sentence', async () => {
        api.uploadPullMerge.mockRejectedValue(Object.assign(new Error('raw'), {code: 'head_changed', status: 409}));
        const wrapper = await openConflicts();
        await act(async () => {
            button(wrapper, 'Save resolutions and merge').simulate('click');
        });
        await settle(wrapper);
        expect(wrapper.text()).not.toContain('Resolve merge conflicts');
        expect(wrapper.text()).toContain('This project changed while you were merging. Merge again to include the latest changes.');
    });

    test('closing or merging a pull that someone else already closed reloads it with a sentence', async () => {
        api.closePull.mockRejectedValue(Object.assign(new Error('open pull request not found'), {status: 404}));
        const wrapper = mountPull();
        await settle(wrapper);
        act(() => {
            button(wrapper, 'Close pull request').first()
                .simulate('click');
        });
        wrapper.update();
        api.getPull.mockResolvedValue({pull: {...pull, state: 'merged'}});
        await act(async () => {
            wrapper.find('ConfirmModal').prop('onConfirm')();
        });
        await settle(wrapper);
        expect(wrapper.find('ConfirmModal')).toHaveLength(0);
        expect(wrapper.text()).toContain('This pull request was already closed or merged.');
        expect(wrapper.text()).not.toContain('open pull request not found');
        expect(api.getPull).toHaveBeenCalledTimes(2);

        api.getPull.mockReset()
            .mockResolvedValueOnce({pull})
            .mockResolvedValueOnce({pull: {...pull, state: 'merged'}});
        api.mergePull.mockRejectedValue(Object.assign(new Error('open pull request not found'), {status: 404}));
        const merging = mountPull();
        await settle(merging);
        await act(async () => {
            button(merging, 'Merge pull request').simulate('click');
        });
        await settle(merging);
        expect(merging.text()).toContain('This pull request was closed or merged while you were merging.');
        expect(merging.text()).not.toContain('open pull request not found');
        expect(api.getPull).toHaveBeenCalledTimes(2);
    });

    test('a stale file view from before a restart cannot overwrite the reloaded one for the same head', async () => {
        let answerOld;
        let answerNew;
        api.pullChanges.mockReset()
            .mockReturnValueOnce(new Promise(resolve => {
                answerOld = resolve;
            }))
            .mockReturnValueOnce(new Promise(resolve => {
                answerNew = resolve;
            }));
        api.mergePull.mockRejectedValue(Object.assign(new Error('closed'), {code: 'pull_not_open', status: 409}));
        const wrapper = mountPull();
        await settle(wrapper);
        const tab = label => wrapper.find('[role="tab"]').filterWhere(item => item.text().includes(label));
        await act(async () => {
            tab('Files changed').simulate('click');
        });
        await settle(wrapper);
        await act(async () => {
            tab('Conversation').simulate('click');
        });
        await settle(wrapper);
        await act(async () => {
            button(wrapper, 'Merge pull request').simulate('click');
        });
        await settle(wrapper);
        await act(async () => {
            tab('Files changed').simulate('click');
        });
        await settle(wrapper);
        expect(api.pullChanges).toHaveBeenCalledTimes(2);
        await act(async () => {
            answerOld({inspection: {ok: true, targets: [{path: 'Stale'}]}, pull});
        });
        await settle(wrapper);
        await act(async () => {
            answerNew({inspection: {ok: true, targets: [{path: 'Fresh'}]}, pull});
        });
        await settle(wrapper);
        const changesView = wrapper.find('ChangesView');
        expect(changesView.exists()).toBe(true);
        expect(changesView.prop('analysis').targets.map(entry => entry.dir)).toEqual(['Fresh']);
    });

    test('explains why a pull cannot be merged while the project is on another branch', async () => {
        api.getProject.mockImplementation(id => Promise.resolve({
            project: {id, title: id, owner: 'sam', isOwner: id === 'target', canViewSource: true, gitHead: sha('c'), gitBranch: 'feature'}
        }));
        api.getPull.mockResolvedValue({pull: {...pull, baseBranch: 'main'}});
        const wrapper = mountPull();
        await settle(wrapper);
        expect(button(wrapper, 'Merge pull request')).toHaveLength(0);
        expect(wrapper.text()).toContain('This pull request targets the main branch, and this project is on feature. It can be merged once the project is back on main.');
    });

    test('a pull whose target branch was deleted says so instead of offering a merge', async () => {
        api.getPull.mockResolvedValue({pull: {...pull, baseBranch: 'old', baseBranchMissing: true}});
        const wrapper = mountPull();
        await settle(wrapper);
        expect(button(wrapper, 'Merge pull request')).toHaveLength(0);
        expect(wrapper.text()).toContain('This pull request targets the old branch, which no longer exists. Close it and open a new one.');
        expect(wrapper.find('Notice')).toHaveLength(0);
    });

    test('a merge, close or comment started on one pull request never locks or lands on the next one', async () => {
        let answer;
        api.mergePull.mockReturnValue(new Promise(resolve => {
            answer = resolve;
        }));
        api.closePull.mockReturnValue(new Promise(() => {}));
        api.addPullComment = jest.fn(() => new Promise(() => {}));
        api.getPull.mockImplementation((id, index) => Promise.resolve({pull: {...pull, index: Number(index), title: `Pull ${index}`}}));
        const wrapper = mountPull();
        await settle(wrapper);
        act(() => {
            wrapper.find('textarea').props()
                .onChange({target: {value: 'hello'}});
        });
        wrapper.update();
        await act(async () => {
            wrapper.find('form').simulate('submit', {preventDefault: () => {}});
            button(wrapper, 'Close pull request').first()
                .simulate('click');
        });
        wrapper.update();
        await act(async () => {
            wrapper.find('ConfirmModal').prop('onConfirm')();
            button(wrapper, 'Merge pull request').simulate('click');
        });
        await act(async () => {
            navigation.go('/project/target/pulls/3');
        });
        await settle(wrapper);
        await act(async () => {
            answer(conflictMerge);
        });
        await settle(wrapper);
        expect(wrapper.text()).toContain('Pull 3');
        expect(wrapper.text()).not.toContain('Resolve merge conflicts');
        expect(wrapper.find('ConfirmModal')).toHaveLength(0);
        expect(button(wrapper, 'Merge pull request')).toHaveLength(1);
        expect(button(wrapper, 'Merge pull request').prop('disabled')).toBeFalsy();
        expect(button(wrapper, 'Close pull request').prop('disabled')).toBeFalsy();
        expect(button(wrapper, 'Comment').prop('busy')).toBeFalsy();
        expect(api.uploadPullMerge).not.toHaveBeenCalled();
    });

    test('a merge refused because the target branch is gone shows the sentence once', async () => {
        api.getPull.mockResolvedValueOnce({pull: {...pull, baseBranch: 'old'}})
            .mockResolvedValue({pull: {...pull, baseBranch: 'old', baseBranchMissing: true}});
        api.mergePull.mockRejectedValue(Object.assign(new Error('raw server text'), {
            code: 'target_branch_missing', status: 409, data: {branch: 'old'}
        }));
        const wrapper = mountPull();
        await settle(wrapper);
        await act(async () => {
            button(wrapper, 'Merge pull request').simulate('click');
        });
        await settle(wrapper);
        const sentence = 'This pull request targets the old branch, which no longer exists. Close it and open a new one.';
        expect(wrapper.text().split(sentence)).toHaveLength(2);
        expect(button(wrapper, 'Merge pull request')).toHaveLength(0);
        expect(wrapper.text()).not.toContain('raw server text');

        api.closePull.mockReset().mockResolvedValue({pull: {...pull, baseBranch: 'old', state: 'closed'}});
        await act(async () => {
            button(wrapper, 'Close pull request').simulate('click');
        });
        wrapper.update();
        const confirm = wrapper.find('button')
            .filterWhere(item => item.text() === 'Close pull request')
            .last();
        await act(async () => {
            confirm.simulate('click');
        });
        await settle(wrapper);
        expect(wrapper.text()).toContain('Pull request closed');
        expect(wrapper.text()).not.toContain('which no longer exists');
    });

    test('a blocked merge comes back when the viewer returns and the branch is there again', async () => {
        api.getPull.mockResolvedValueOnce({pull: {...pull, baseBranch: 'old', baseBranchMissing: true}})
            .mockResolvedValue({pull: {...pull, baseBranch: 'old'}});
        const wrapper = mountPull();
        await settle(wrapper);
        expect(button(wrapper, 'Merge pull request')).toHaveLength(0);
        await act(async () => {
            window.dispatchEvent(new Event('focus'));
        });
        await settle(wrapper);
        expect(button(wrapper, 'Merge pull request')).toHaveLength(1);
        expect(wrapper.text()).not.toContain('which no longer exists');
    });

    test('a project that returns to the pull branch in another tab can be merged after refocusing', async () => {
        api.getProject.mockImplementation(id => Promise.resolve({
            project: {id, title: id, owner: 'sam', isOwner: id === 'target', canViewSource: true, gitHead: sha('c'), gitBranch: 'feature'}
        }));
        api.getPull.mockResolvedValue({pull: {...pull, baseBranch: 'main'}});
        const wrapper = mountPull();
        await settle(wrapper);
        expect(button(wrapper, 'Merge pull request')).toHaveLength(0);
        api.getProject.mockImplementation(id => Promise.resolve({
            project: {id, title: id, owner: 'sam', isOwner: id === 'target', canViewSource: true, gitHead: sha('c'), gitBranch: 'main'}
        }));
        await act(async () => {
            window.dispatchEvent(new Event('focus'));
        });
        await settle(wrapper);
        expect(button(wrapper, 'Merge pull request')).toHaveLength(1);
    });

    test('a merge refused because the project switched branch hides the button and says so once', async () => {
        api.getPull.mockResolvedValue({pull: {...pull, baseBranch: 'main'}});
        api.mergePull.mockRejectedValue(Object.assign(new Error('raw server text'), {
            code: 'target_branch_changed', status: 409, data: {branch: 'main'}
        }));
        const wrapper = mountPull();
        await settle(wrapper);
        api.getProject.mockImplementation(id => Promise.resolve({
            project: {id, title: id, owner: 'sam', isOwner: id === 'target', canViewSource: true, gitHead: sha('c'), gitBranch: 'feature'}
        }));
        await act(async () => {
            button(wrapper, 'Merge pull request').simulate('click');
        });
        await settle(wrapper);
        expect(button(wrapper, 'Merge pull request')).toHaveLength(0);
        expect(wrapper.text()).toContain('This pull request targets the main branch, and this project is on feature.');
        expect(wrapper.text()).not.toContain('Switch this project to the main branch');
        expect(wrapper.text()).not.toContain('raw server text');

        api.getProject.mockImplementation(id => Promise.resolve({
            project: {id, title: id, owner: 'sam', isOwner: id === 'target', canViewSource: true, gitHead: sha('c'), gitBranch: 'main'}
        }));
        await act(async () => {
            window.dispatchEvent(new Event('focus'));
        });
        await settle(wrapper);
        expect(button(wrapper, 'Merge pull request')).toHaveLength(1);
        expect(wrapper.text()).not.toContain('Switch this project to the main branch');
    });

    test('the reason a merge button disappeared is focused and announced', async () => {
        api.getPull.mockResolvedValueOnce({pull: {...pull, baseBranch: 'old'}})
            .mockResolvedValue({pull: {...pull, baseBranch: 'old', baseBranchMissing: true}});
        api.mergePull.mockRejectedValue(Object.assign(new Error('raw'), {code: 'target_branch_missing', status: 409, data: {branch: 'old'}}));
        const host = document.createElement('div');
        document.body.appendChild(host);
        const wrapper = mountPull({attachTo: host});
        await settle(wrapper);
        await act(async () => {
            button(wrapper, 'Merge pull request').simulate('click');
        });
        await settle(wrapper);
        expect(document.activeElement.textContent).toContain('which no longer exists');
        expect(document.activeElement.getAttribute('role')).toBe('status');
        mounted.splice(mounted.indexOf(wrapper), 1);
        wrapper.detach();
        host.remove();
    });

    test('returning to a blocked pull refreshes quietly, once, and keeps the page on a failure', async () => {
        api.getPull.mockResolvedValue({pull: {...pull, baseBranch: 'old', baseBranchMissing: true}});
        const wrapper = mountPull();
        await settle(wrapper);
        api.getPull.mockClear().mockRejectedValue(new Error('Network request failed'));
        await act(async () => {
            window.dispatchEvent(new Event('focus'));
            document.dispatchEvent(new Event('visibilitychange'));
        });
        await settle(wrapper);
        expect(api.getPull).toHaveBeenCalledTimes(1);
        expect(wrapper.text()).toContain('Slow the cat down');
        expect(wrapper.text()).not.toContain('Network request failed');
        expect(wrapper.text()).toContain('which no longer exists');
    });

    test('a diff that cannot be compared explains itself and can be retried', async () => {
        api.pullChanges.mockReset().mockResolvedValue({inspection: {legacy: true}});
        api.pullDiff.mockReset()
            .mockRejectedValueOnce(Object.assign(new Error('raw server text'), {code: 'pull_history_unavailable', status: 409}))
            .mockReturnValue(new Promise(() => {}));
        const wrapper = mountPull();
        await settle(wrapper);
        await act(async () => {
            wrapper.find('[role="tab"]').filterWhere(item => item.text().includes('Files changed'))
                .simulate('click');
        });
        await settle(wrapper);
        expect(wrapper.text()).toContain('The changes in this pull request could not be compared with the project.');
        expect(wrapper.text()).not.toContain('raw server text');
        await act(async () => {
            wrapper.find('button').filterWhere(item => item.text().includes('Retry') || item.text().includes('Try again'))
                .first()
                .simulate('click');
        });
        await settle(wrapper);
        expect(api.pullDiff).toHaveBeenCalledTimes(2);
    });

    test('a restart from the file diff brings the summary back', async () => {
        api.pullChanges.mockReset().mockResolvedValue({inspection: {ok: true, targets: [{path: 'Cat'}]}, pull});
        api.pullDiff.mockReset().mockReturnValue(new Promise(() => {}));
        api.mergePull.mockRejectedValue(Object.assign(new Error('moved'), {code: 'pull_head_changed', status: 409}));
        const wrapper = mountPull();
        await settle(wrapper);
        const tab = label => wrapper.find('[role="tab"]').filterWhere(item => item.text().includes(label));
        await act(async () => {
            tab('Files changed').simulate('click');
        });
        await settle(wrapper);
        await act(async () => {
            button(wrapper, 'Show file diff').simulate('click');
        });
        await settle(wrapper);
        await act(async () => {
            tab('Conversation').simulate('click');
        });
        await settle(wrapper);
        await act(async () => {
            button(wrapper, 'Merge pull request').simulate('click');
        });
        await settle(wrapper);
        await act(async () => {
            tab('Files changed').simulate('click');
        });
        await settle(wrapper);
        expect(wrapper.find('ChangesView').exists()).toBe(true);
        expect(api.pullChanges).toHaveBeenCalledTimes(2);
    });

    test('loads sprite source text from the live fork head reported by pullChanges', async () => {
        api.getPull.mockResolvedValue({pull: {...pull, headCommit: sha('b')}});
        api.pullChanges.mockReset().mockResolvedValue({
            inspection: {
                ok: true,
                targets: [{path: 'Cat', name: 'Cat', scripts: [{status: 'added', after: 'when flag clicked\n  move (10)'}]}]
            },
            pull: {...pull, headCommit: sha('e')}
        });
        api.pullDiff.mockReset().mockResolvedValue({
            files: [{path: 'Cat/main.fractch', status: 'modified', additions: 1, deletions: 0, patch: ''}],
            pull: {...pull, headCommit: sha('e')}
        });
        const wrapper = mountPull();
        await settle(wrapper);
        const tab = label => wrapper.find('[role="tab"]').filterWhere(item => item.text().includes(label));
        expect(tab('Files changed').text()).toContain('…');
        await act(async () => {
            tab('Files changed').simulate('click');
        });
        await settle(wrapper);
        expect(api.commitFile).toHaveBeenCalledWith('fork', sha('e'), 'Cat/main.fractch', 2, 'target');
    });

    test('target_branch_changed during an open conflict session shows the branch gate and explains why in the conflict card', async () => {
        api.getPull.mockResolvedValue({pull: {...pull, baseBranch: 'main'}});
        api.uploadPullMerge.mockRejectedValue(Object.assign(new Error('raw server text'), {
            code: 'target_branch_changed', status: 409, data: {branch: 'main'}
        }));
        const wrapper = await openConflicts();
        api.getProject.mockImplementation(id => Promise.resolve({
            project: {id, title: id, owner: 'sam', isOwner: id === 'target', canViewSource: true, gitHead: sha('c'), gitBranch: 'feature'}
        }));
        await act(async () => {
            button(wrapper, 'Save resolutions and merge').simulate('click');
        });
        await settle(wrapper);
        expect(wrapper.text()).toContain('Resolve merge conflicts');
        expect(wrapper.text()).toContain('This pull request targets the main branch, and this project is on feature. It can be merged once the project is back on main.');
        expect(wrapper.find('MergeConflicts').text()).toContain('Switch this project to the main branch before merging this pull request.');
        expect(wrapper.text()).not.toContain('raw server text');
    });

    test('a 403 merge refusal reloads the pull request with a translated sentence instead of raw server text', async () => {
        api.mergePull.mockRejectedValue(Object.assign(new Error('source code is not visible'), {status: 403}));
        const wrapper = mountPull();
        await settle(wrapper);
        await act(async () => {
            button(wrapper, 'Merge pull request').simulate('click');
        });
        await settle(wrapper);
        expect(wrapper.text()).toContain('Only project owners and maintainers can merge this pull request, and only while they can see inside the remix.');
        expect(wrapper.text()).not.toContain('source code is not visible');
        expect(api.getPull).toHaveBeenCalledTimes(2);
    });
});
