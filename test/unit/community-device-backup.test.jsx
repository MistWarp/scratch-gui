import React from 'react';
import {mount} from 'enzyme';
import {act} from 'react-dom/test-utils';

import {DeviceBackup} from '../../src/community/components/HomeWorkspace.jsx';
import restorePoints from '../../src/lib/api/restore-points';

jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {},
    editorUrl: ({restore} = {}) => `/editor?restore=${restore}`,
    projectUrl: id => `/project/${id}`
}));
jest.mock('../../src/lib/api/restore-points', () => ({
    __esModule: true,
    default: {getAllRestorePoints: jest.fn()}
}));

const render = async () => {
    let wrapper;
    await act(async () => {
        wrapper = mount(<DeviceBackup />);
        await new Promise(resolve => setTimeout(resolve, 0));
    });
    wrapper.update();
    return wrapper;
};

beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    restorePoints.getAllRestorePoints.mockResolvedValue({
        restorePoints: [{id: 4, title: 'Platformer', created: 1700000000}]
    });
});

test('Home offers the newest device backup on this site', async () => {
    const wrapper = await render();
    expect(wrapper.find('a').prop('href')).toBe('/editor?restore=4');
});

test('Home stops offering backups here once they moved to the editor site', async () => {
    localStorage.setItem('mw:editor-data-moved', '1');
    const wrapper = await render();
    expect(wrapper.html()).toBeNull();
    expect(restorePoints.getAllRestorePoints).not.toHaveBeenCalled();
});
