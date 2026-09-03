import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';

import api from '../../src/community/api.js';
import {ReleaseList} from '../../src/community/pages/Project.jsx';

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

describe('project release publishing', () => {
    beforeEach(() => jest.clearAllMocks());

    test('locks duplicate creates and ignores a result after changing projects', async () => {
        let finishCreate;
        api.createRelease.mockReturnValue(new Promise(resolve => {
            finishCreate = resolve;
        }));
        const wrapper = mount(
            <ReleaseList id="project-1" isOwner viewerName="tester" />
        );
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();
        wrapper.find('input[placeholder="Version, such as 1.2.0"]')
            .simulate('change', {target: {value: '1.2.0'}});
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
            finishCreate({release: {_id: 'old-release', version: '1.2.0'}});
            await first;
            await Promise.resolve();
        });
        wrapper.update();

        expect(wrapper.find('input[placeholder="Version, such as 1.2.0"]').prop('value')).toBe('');
        expect(wrapper.find('article').length).toBe(0);
        wrapper.unmount();
    });
});
