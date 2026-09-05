import React from 'react';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import {GUI} from '../../../src/containers/gui.jsx';
import ProjectLoadError from '../../../src/components/project-load-error/project-load-error.jsx';
import GUIComponent from '../../../src/components/gui/gui.jsx';

jest.mock('../../../src/components/gui/gui.jsx', () => () => null);

test('shows a project download failure and retries without throwing into the crash boundary', () => {
    const error = new TypeError('Failed to fetch');
    const onRetry = jest.fn();
    const gui = new GUI({projectFetchError: error, onRetryProjectFetch: onRetry});
    const rendered = gui.render();
    expect(rendered.type).toBe(ProjectLoadError);
    const wrapper = mountWithIntl(rendered);
    expect(wrapper.text()).toContain('Could not load project');
    expect(wrapper.text()).toContain('Failed to fetch');
    wrapper.find('button').simulate('click');
    expect(onRetry).toHaveBeenCalledTimes(1);
    wrapper.unmount();

    gui.props = {projectFetchError: null, fetchingProject: true};
    expect(gui.render().props.children[0].type).toBe(GUIComponent);
    expect(gui.render().props.children[0].props.loading).toBe(true);
});

test('still reports fatal editor errors through the crash boundary', () => {
    const error = new Error('Editor failed');
    const gui = new GUI({isError: true, error});
    expect(() => gui.render()).toThrow(error);
});
