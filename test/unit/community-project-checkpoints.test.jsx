import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';

import api from '../../src/community/api.js';
import {HistoryList} from '../../src/community/pages/Project.jsx';

jest.mock('../../src/community/api.js', () => ({
    __esModule: true,
    default: {
        createRelease: jest.fn(),
        perks: jest.fn(() => Promise.resolve({current: {mistwarp: {historyCheckpoints: true}}})),
        releases: jest.fn(() => Promise.resolve({releases: []}))
    },
    embedUrl: jest.fn(() => '/embed'),
    editorUrl: jest.fn(() => '/editor'),
    projectUrl: jest.fn(id => `/project/${id}`)
}));

describe('project history checkpoints', () => {
    test('locks duplicate creates and ignores a result after changing projects', async () => {
        let finishCreate;
        api.createRelease.mockReturnValue(new Promise(resolve => {
            finishCreate = resolve;
        }));
        const wrapper = mount(
            <HistoryList id="project-1" history={{commits: []}} canRestore onChange={jest.fn()} />
        );
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();
        wrapper.find('input[placeholder="Checkpoint name"]').simulate('change', {target: {value: 'Before change'}});
        const submit = wrapper.find('form').prop('onSubmit');
        const event = {preventDefault: jest.fn()};

        let first;
        act(() => {
            first = submit(event);
            submit(event);
        });
        expect(api.createRelease).toHaveBeenCalledTimes(1);

        wrapper.setProps({id: 'project-2'});
        await act(async () => {
            finishCreate({release: {_id: 'old-release', version: 'Before change'}});
            await first;
            await Promise.resolve();
        });
        wrapper.update();

        expect(wrapper.find('input[placeholder="Checkpoint name"]').prop('value')).toBe('');
        expect(wrapper.text()).not.toContain('Before change');
        wrapper.unmount();
    });
});
