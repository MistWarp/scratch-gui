import React from 'react';
import {mount} from 'enzyme';
import PackagerWindow from '../../src/containers/packager.jsx';
import {exportProject} from '../../src/packager/export-project';

jest.mock('../../src/containers/windowed-modal.jsx', () => ({children}) => <div>{children}</div>);
jest.mock('../../src/packager/packager/large-assets', () => ({}));
jest.mock('virtual:packager-runtime', () => ({buildId: 'test'}), {virtual: true});
jest.mock('../../src/packager/packager/web/cache', () => ({}));
jest.mock('../../src/packager/export-project', () => ({exportProject: jest.fn()}));
jest.mock('../../src/packager/settings/download-url', () => jest.fn());

const makeVM = () => ({
    runtime: {getTargetForStage: () => ({variables: {}, comments: {}})},
    extensionManager: {getExtensionURLs: () => ({}), isExtensionLoaded: () => false},
    saveProjectSb3: jest.fn()
});
let wrapper;
afterEach(() => { if (wrapper) wrapper.unmount(); wrapper = null; });

test('opens the complete native form immediately without serializing a project', () => {
    const vm = makeVM();
    wrapper = mount(<PackagerWindow vm={vm} projectTitle="Instant form" onClose={() => {}} />);
    expect(wrapper.text()).not.toMatch(/Loading packager|Loading the current project/);
    expect(vm.saveProjectSb3).not.toHaveBeenCalled();
    expect(wrapper.find('input[type="radio"][name="environment"]').map(input => input.prop('value')))
        .toEqual(expect.arrayContaining(['html', 'zip', 'zip-one-asset', 'electron-win64', 'electron-mac',
            'electron-linux64', 'nwjs-win64', 'webview-mac']));
    expect(wrapper.find('input[type="file"]').length).toBe(3);
    wrapper.find('input[type="radio"][value="custom"]').simulate('change', {target: {value: 'custom'}});
    expect(wrapper.find('input[type="file"]').length).toBe(4);
});

test('native number and boolean controls change the options passed to export', async () => {
    exportProject.mockRejectedValue(new Error('Test export complete'));
    const vm = makeVM();
    wrapper = mount(<PackagerWindow vm={vm} projectTitle="Changed settings" onClose={() => {}} />);
    const framerate = wrapper.find('input[type="number"]').at(0);
    framerate.simulate('change', {target: {value: '60'}});
    wrapper.find('input[type="checkbox"]').at(0).simulate('change', {target: {checked: true}});
    await wrapper.instance().run(false);
    expect(exportProject).toHaveBeenLastCalledWith(expect.objectContaining({
        vm, options: expect.objectContaining({framerate: 60, turbo: true})
    }));
});

test('closing the native window cancels an active export', () => {
    exportProject.mockReturnValue(new Promise(() => {}));
    wrapper = mount(<PackagerWindow vm={makeVM()} projectTitle="Cancel export" onClose={() => {}} />);
    wrapper.instance().run(false);
    const {signal} = exportProject.mock.calls[exportProject.mock.calls.length - 1][0];
    expect(signal.aborted).toBe(false);
    wrapper.unmount();
    wrapper = null;
    expect(signal.aborted).toBe(true);
});
