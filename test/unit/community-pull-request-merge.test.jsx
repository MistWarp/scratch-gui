import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter, Route, Routes} from 'react-router-dom';

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
    merge: {ok: true, changes: [{path: 'Cat/main.fractch', conflict: true, content: encode('<<<<<<< target')}]}
};

const settle = async wrapper => {
    for (let index = 0; index < 8; index++) {
        await act(async () => {
            await Promise.resolve();
        });
    }
    wrapper.update();
};

const mountPull = () => mount(
    <MemoryRouter
        initialEntries={['/project/target/pulls/2']}
        future={{v7_startTransition: true, v7_relativeSplatPath: true}}
    >
        <Routes>
            <Route
                path="/project/:id/pulls/:index"
                element={<PullRequest />}
            />
        </Routes>
    </MemoryRouter>
);

const button = (wrapper, label) => wrapper.find('button').filterWhere(item => item.text().includes(label));

const openConflicts = async () => {
    const wrapper = mountPull();
    await settle(wrapper);
    await act(async () => {
        button(wrapper, 'Merge pull request').simulate('click');
    });
    await settle(wrapper);
    return wrapper;
};

describe('pull request merges', () => {
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
        const wrapper = await openConflicts();
        expect(wrapper.text()).toContain('Resolve merge conflicts');
        expect(button(wrapper, 'Merge pull request')).toHaveLength(0);
        expect(wrapper.text()).toContain('Resolve the conflicts below to finish merging.');

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
});
