import React from 'react';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import ProjectLoadError from '../../../src/components/project-load-error/project-load-error.jsx';

describe('project load error', () => {
    test('offers a new project as well as trying again', () => {
        const onRetry = jest.fn();
        const wrapper = mountWithIntl(
            <ProjectLoadError
                error={new Error('Failed to fetch')}
                onRetry={onRetry}
            />
        );
        const newProject = wrapper.find('a');
        expect(newProject.text()).toBe('Start a new project');
        expect(newProject.prop('href')).toBeTruthy();
        // Opening a file needs the editor's file picker, so it only shows when provided.
        expect(wrapper.find('button')).toHaveLength(1);
        wrapper.find('button').simulate('click');
        expect(onRetry).toHaveBeenCalledTimes(1);
    });

    test('uses the editor\'s own actions when given', () => {
        const onNewProject = jest.fn();
        const onOpenFile = jest.fn();
        const wrapper = mountWithIntl(
            <ProjectLoadError
                error="Failed to fetch"
                onNewProject={onNewProject}
                onOpenFile={onOpenFile}
                onRetry={jest.fn()}
            />
        );
        wrapper.find('a').simulate('click');
        expect(onNewProject).toHaveBeenCalledTimes(1);
        wrapper.find('button').filterWhere(node => node.text() === 'Open a file')
            .simulate('click');
        expect(onOpenFile).toHaveBeenCalledTimes(1);
    });

    test('names a missing extension instead of offering a retry', () => {
        const wrapper = mountWithIntl(
            <ProjectLoadError error={new Error('Unknown extension: p7videosharing')} />
        );
        expect(wrapper.find('code').text()).toBe('p7videosharing');
        expect(wrapper.text()).toContain('which MistWarp does not have');
        expect(wrapper.find('button')).toHaveLength(0);
        expect(wrapper.find('a').text()).toBe('Start a new project');
    });

    test('keeps an embed on the project page', () => {
        const wrapper = mountWithIntl(
            <ProjectLoadError
                isEmbedded
                error={new Error('Failed to fetch')}
                onRetry={jest.fn()}
            />
        );
        expect(wrapper.find('a')).toHaveLength(0);
        expect(wrapper.find('button').text()).toBe('Try again');
    });
});
