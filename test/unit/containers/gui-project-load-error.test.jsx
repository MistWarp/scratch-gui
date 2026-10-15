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

test.each([
    'Failed to unzip and extract project.json, with error: Error: Corrupted zip: can\'t find end of central directory',
    'SyntaxError: JSON Parse error: Unrecognized token \'�\'',
    '{"validationError":"Could not parse as a valid SB2 or SB3 project.","sb3Errors":[],"sb2Errors":[]}'
])('shows an unreadable project as a load error instead of crashing: %s', error => {
    const gui = new GUI({isError: true, error});
    const rendered = gui.render();
    expect(rendered.type).toBe(ProjectLoadError);
    const wrapper = mountWithIntl(rendered);
    expect(wrapper.text()).toContain('This file is damaged or is not a Scratch project.');
    expect(wrapper.text()).not.toContain('Check your connection');
    expect(wrapper.find('button')).toHaveLength(0);
    wrapper.unmount();
});
