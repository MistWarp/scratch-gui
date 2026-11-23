import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';

jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {
        branches: jest.fn(),
        createBranch: jest.fn().mockResolvedValue({ok: true}),
        renameBranch: jest.fn().mockResolvedValue({ok: true}),
        deleteBranch: jest.fn().mockResolvedValue({ok: true}),
        mergeBranches: jest.fn(),
        uploadBranchMerge: jest.fn(),
        commitTree: jest.fn(),
        commitFile: jest.fn()
    }
}));
jest.mock('../../src/lib/git/mwp.js', () => ({
    buildProjectArtifactsFromFileEntries: jest.fn(entries => Promise.resolve({sb3: 'sb3', tree: 'tree', entries}))
}));

import ProjectBranches from '../../src/community/components/ProjectBranches.jsx';
import api from '../../src/community/api';
import {buildProjectArtifactsFromFileEntries} from '../../src/lib/git/mwp.js';

const encode = value => Buffer.from(value).toString('base64');

const branchResponse = {
    ok: true,
    current: 'main',
    branches: [
        {name: 'main', head: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', current: true},
        {name: 'feature', head: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', current: false}
    ]
};

const settle = async wrapper => {
    await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
    });
    wrapper.update();
};

describe('project branch management', () => {
    beforeEach(() => {
        api.branches.mockReset().mockResolvedValue(branchResponse);
        api.createBranch.mockClear();
        api.renameBranch.mockClear();
        api.deleteBranch.mockClear();
    });

    test('owners can create a branch from a selected branch', async () => {
        const onChange = jest.fn().mockResolvedValue();
        const wrapper = mount(<ProjectBranches
            id="123"
            canManage
            onChange={onChange}
        />);
        await settle(wrapper);

        act(() => wrapper.find('input[placeholder="feature-name"]').props()
            .onChange({target: {value: 'release'}}));
        act(() => wrapper.find('form').at(0)
            .find('select')
            .props()
            .onChange({target: {value: 'feature'}}));
        wrapper.update();
        await act(async () => {
            wrapper.find('form').at(0)
                .props()
                .onSubmit({preventDefault: jest.fn()});
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();

        expect(api.createBranch).toHaveBeenCalledWith('123', 'release', 'feature');
        expect(onChange).toHaveBeenCalled();
        expect(wrapper.text()).toContain('Created release from feature.');
    });

    test('owners can rename and delete non-current branches', async () => {
        const wrapper = mount(<ProjectBranches
            id="123"
            canManage
        />);
        await settle(wrapper);

        act(() => wrapper.find('button[title="Rename feature"]').props()
            .onClick());
        wrapper.update();
        act(() => wrapper.find('input[aria-label="New name for feature"]').props()
            .onChange({target: {value: 'updated'}}));
        wrapper.update();
        await act(async () => {
            wrapper.find('input[aria-label="New name for feature"]').parent()
                .props()
                .onSubmit({preventDefault: jest.fn()});
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();
        expect(api.renameBranch).toHaveBeenCalledWith('123', 'feature', 'updated');

        act(() => wrapper.find('button[title="Delete feature"]').props()
            .onClick());
        wrapper.update();
        await act(async () => {
            wrapper.find('button').filterWhere(button => button.text() === 'Yes')
                .props()
                .onClick();
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();
        expect(api.deleteBranch).toHaveBeenCalledWith('123', 'feature');
    });

    test('visitors only see the branch list', async () => {
        const wrapper = mount(<ProjectBranches
            id="123"
            canManage={false}
        />);
        await settle(wrapper);

        expect(wrapper.find('input[placeholder="feature-name"]')).toHaveLength(0);
        expect(wrapper.find('button[title^="Rename"]')).toHaveLength(0);
        expect(wrapper.text()).toContain('feature');
    });

    test('branch merge conflicts are resolved before the merge uploads', async () => {
        const mainHead = 'a'.repeat(40);
        const featureHead = 'b'.repeat(40);
        api.mergeBranches.mockResolvedValue({
            ok: true,
            targetProjectId: '123',
            targetHead: mainHead,
            sourceHead: featureHead,
            sourceBranch: 'feature',
            targetBranch: 'main',
            merge: {changes: [
                {path: 'Cat/main.fractch', conflict: true, content: encode('<<<<<<< main')},
                {path: 'Cat/a.svg', conflict: true, binary: true, ours: encode('main art'), theirs: encode('feature art')}
            ]}
        });
        api.uploadBranchMerge.mockReset().mockResolvedValue({ok: true});
        api.commitTree.mockResolvedValue({files: [{path: 'Cat/main.fractch'}, {path: 'Cat/a.svg'}]});
        api.commitFile.mockResolvedValue({content: encode('main')});
        buildProjectArtifactsFromFileEntries.mockClear();
        const wrapper = mount(<ProjectBranches
            id="123"
            canManage
        />);
        await settle(wrapper);

        await act(async () => {
            wrapper.find('button').filterWhere(button => button.text().includes('Merge branches'))
                .simulate('click');
        });
        await settle(wrapper);
        await settle(wrapper);
        expect(api.mergeBranches).toHaveBeenCalledWith('123', 'feature', 'main');
        expect(wrapper.text()).toContain('Resolve merge conflicts');
        expect(api.uploadBranchMerge).not.toHaveBeenCalled();
        expect(wrapper.find('button').filterWhere(button => button.text().includes('Merge branches'))).toHaveLength(0);

        act(() => {
            wrapper.find('textarea').props()
                .onChange({target: {value: 'merged code'}});
        });
        wrapper.update();
        act(() => {
            wrapper.find('button').filterWhere(button => button.text() === 'Use feature')
                .simulate('click');
        });
        wrapper.update();
        await act(async () => {
            wrapper.find('button').filterWhere(button => button.text().includes('Save resolutions and merge'))
                .simulate('click');
        });
        await settle(wrapper);
        await settle(wrapper);

        const uploaded = buildProjectArtifactsFromFileEntries.mock.calls[0][0];
        const entries = new Map(uploaded.map(entry => [entry.path, entry.data]));
        expect(new TextDecoder().decode(entries.get('Cat/main.fractch'))).toBe('merged code');
        expect(new TextDecoder().decode(entries.get('Cat/a.svg'))).toBe('feature art');
        expect(api.uploadBranchMerge).toHaveBeenCalledWith('123', expect.objectContaining({
            sourceBranch: 'feature',
            targetBranch: 'main',
            sourceHead: featureHead,
            targetHead: mainHead
        }));
        expect(wrapper.text()).toContain('Merged feature into main.');
    });

    test('a branch that moved during the merge closes the session and reloads the branches', async () => {
        api.mergeBranches.mockResolvedValue({
            ok: true,
            targetProjectId: '123',
            targetHead: 'a'.repeat(40),
            sourceHead: 'b'.repeat(40),
            sourceBranch: 'feature',
            targetBranch: 'main',
            merge: {changes: [{path: 'Cat/main.fractch', conflict: true, content: encode('<<<<<<< main')}]}
        });
        api.uploadBranchMerge.mockReset().mockRejectedValue(
            Object.assign(new Error('a branch changed while this merge was processing'), {code: 'branch_head_changed', status: 409})
        );
        api.commitTree.mockResolvedValue({files: [{path: 'Cat/main.fractch'}]});
        api.commitFile.mockResolvedValue({content: encode('main')});
        const onChange = jest.fn().mockResolvedValue();
        const wrapper = mount(<ProjectBranches
            id="123"
            canManage
            onChange={onChange}
        />);
        await settle(wrapper);
        await act(async () => {
            wrapper.find('button').filterWhere(button => button.text().includes('Merge branches'))
                .simulate('click');
        });
        await settle(wrapper);
        await settle(wrapper);
        const loadsBefore = api.branches.mock.calls.length;
        await act(async () => {
            wrapper.find('button').filterWhere(button => button.text().includes('Save resolutions and merge'))
                .simulate('click');
        });
        await settle(wrapper);
        await settle(wrapper);

        expect(wrapper.text()).not.toContain('Resolve merge conflicts');
        expect(wrapper.text()).toContain('A branch changed while you were merging. Merge again to include the latest changes.');
        expect(api.branches.mock.calls.length).toBeGreaterThan(loadsBefore);
        expect(onChange).toHaveBeenCalled();
    });

    test('branch management is locked while a merge session is open', async () => {
        api.mergeBranches.mockResolvedValue({
            ok: true,
            targetProjectId: '123',
            targetHead: 'a'.repeat(40),
            sourceHead: 'b'.repeat(40),
            sourceBranch: 'feature',
            targetBranch: 'main',
            merge: {changes: [{path: 'Cat/main.fractch', conflict: true, content: encode('<<<<<<< main')}]}
        });
        api.commitTree.mockResolvedValue({files: [{path: 'Cat/main.fractch'}]});
        api.commitFile.mockResolvedValue({content: encode('main')});
        api.createBranch.mockClear();
        const wrapper = mount(<ProjectBranches
            id="123"
            canManage
        />);
        await settle(wrapper);
        await act(async () => {
            wrapper.find('button').filterWhere(button => button.text().includes('Merge branches'))
                .simulate('click');
        });
        await settle(wrapper);
        await settle(wrapper);
        expect(wrapper.text()).toContain('Resolve merge conflicts');
        expect(wrapper.find('input[placeholder="feature-name"]').prop('disabled')).toBe(true);
        expect(wrapper.find('button[title="Rename feature"]').prop('disabled')).toBe(true);
        expect(wrapper.find('button[title="Delete feature"]').prop('disabled')).toBe(true);
        act(() => wrapper.find('input[placeholder="feature-name"]').props()
            .onChange({target: {value: 'other'}}));
        wrapper.update();
        await act(async () => {
            wrapper.find('form').at(0)
                .props()
                .onSubmit({preventDefault: jest.fn()});
        });
        await settle(wrapper);
        expect(api.createBranch).not.toHaveBeenCalled();
        expect(wrapper.text()).toContain('Resolve merge conflicts');
    });
});
