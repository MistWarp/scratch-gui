import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';
import {ContinueProjects, DeviceBackup} from '../../src/community/components/HomeWorkspace';
import {rememberEditedProject} from '../../src/lib/mw/recent-projects';
import api from '../../src/community/api';

let mockMoved = true;
jest.mock('../../src/lib/account/origins.js', () => ({
    ACCOUNT_ORIGIN: 'https://mistwarp.org',
    EDITOR_ORIGIN: 'https://editor.mistwarp.org',
    isSplitEditor: () => false,
    isEditorOrigin: () => false,
    editorMovedAway: () => mockMoved
}));
jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {
        myProjectPage: jest.fn(),
        getProject: jest.fn()
    },
    editorUrl: ({platformProject, restore} = {}) => (platformProject ? `/editor#mw-${platformProject}` :
        `/editor${restore ? `?restore=${restore}` : ''}`),
    projectUrl: id => `/project/${id}`
}));
jest.mock('../../src/lib/api/restore-points', () => ({
    getAllRestorePoints: () => Promise.resolve({restorePoints: [{id: 3, title: 'Old backup', created: 1}]})
}));

const flush = async wrapper => {
    await act(async () => {
        for (let i = 0; i < 5; i++) await Promise.resolve();
    });
    wrapper.update();
};

const render = element => mount(
    <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>{element}</MemoryRouter>
);

beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
});

test.each([[true, 0], [false, 1]])('with the editor moved away (%s) the device backup card shows %i times',
    async (moved, count) => {
        mockMoved = moved;
        const wrapper = render(<DeviceBackup />);
        await flush(wrapper);
        expect(wrapper.find('a[href="/editor?restore=3"]')).toHaveLength(count);
        await act(async () => wrapper.unmount());
    });

test('the last project edited on this site is not put first once the editor has moved', async () => {
    mockMoved = true;
    rememberEditedProject('alice', 'stale');
    api.myProjectPage.mockResolvedValue({projects: [{id: 'newest', owner: 'alice', title: 'Newest saved', edited: 10}],
        total: 1});
    const wrapper = render(<ContinueProjects username="alice" />);
    await flush(wrapper);
    expect(api.getProject).not.toHaveBeenCalled();
    expect(wrapper.find('h2').map(node => node.text())).toEqual(['Newest saved']);
    await act(async () => wrapper.unmount());
});
