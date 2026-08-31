import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';

jest.mock('../../src/community/api.js', () => ({
    __esModule: true,
    default: {
        branches: jest.fn(),
        createBranch: jest.fn().mockResolvedValue({ok: true}),
        renameBranch: jest.fn().mockResolvedValue({ok: true}),
        deleteBranch: jest.fn().mockResolvedValue({ok: true})
    }
}));

import ProjectBranches from '../../src/community/components/ProjectBranches.jsx';
import api from '../../src/community/api.js';

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
        const wrapper = mount(<ProjectBranches id="123" canManage onChange={onChange} />);
        await settle(wrapper);

        act(() => wrapper.find('input[placeholder="feature-name"]').props().onChange({target: {value: 'release'}}));
        act(() => wrapper.find('form').at(0).find('select').props().onChange({target: {value: 'feature'}}));
        wrapper.update();
        await act(async () => {
            wrapper.find('form').at(0).props().onSubmit({preventDefault: jest.fn()});
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();

        expect(api.createBranch).toHaveBeenCalledWith('123', 'release', 'feature');
        expect(onChange).toHaveBeenCalled();
        expect(wrapper.text()).toContain('Created release from feature.');
    });

    test('owners can rename and delete non-current branches', async () => {
        const wrapper = mount(<ProjectBranches id="123" canManage />);
        await settle(wrapper);

        act(() => wrapper.find('button[title="Rename feature"]').props().onClick());
        wrapper.update();
        act(() => wrapper.find('input[aria-label="New name for feature"]').props().onChange({target: {value: 'updated'}}));
        wrapper.update();
        await act(async () => {
            wrapper.find('input[aria-label="New name for feature"]').parent().props().onSubmit({preventDefault: jest.fn()});
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();
        expect(api.renameBranch).toHaveBeenCalledWith('123', 'feature', 'updated');

        act(() => wrapper.find('button[title="Delete feature"]').props().onClick());
        wrapper.update();
        await act(async () => {
            wrapper.find('button').filterWhere(button => button.text() === 'Yes').props().onClick();
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();
        expect(api.deleteBranch).toHaveBeenCalledWith('123', 'feature');
    });

    test('visitors only see the branch list', async () => {
        const wrapper = mount(<ProjectBranches id="123" canManage={false} />);
        await settle(wrapper);

        expect(wrapper.find('input[placeholder="feature-name"]')).toHaveLength(0);
        expect(wrapper.find('button[title^="Rename"]')).toHaveLength(0);
        expect(wrapper.text()).toContain('feature');
    });
});
