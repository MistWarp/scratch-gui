import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter, Routes, Route} from 'react-router-dom';
import Commit from '../../src/community/pages/Commit';
import ProjectFiles from '../../src/community/components/ProjectFiles';
import api from '../../src/community/api';
import {canViewProjectSource} from '../../src/community/project-source-access';

jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {getProject: jest.fn(), commitInspection: jest.fn(), commitCoAuthors: jest.fn(), commitTree: jest.fn(), commitFile: jest.fn()},
    projectUrl: id => `/project/${id}`
}));
jest.mock('../../src/community/UserContext', () => ({useUser: () => ({user: null})}));

beforeEach(() => jest.clearAllMocks());

test.each([
    [{price: 0, seeInside: true}, true],
    [{price: 5, bought: true, seeInside: true}, false],
    [{price: 0, seeInside: false}, false],
    [{price: 5, isOwner: true, myRole: 'maintainer'}, false],
    [{price: 5, seeInside: false, myRole: 'owner'}, true],
    [{canViewSource: false, isOwner: true}, false],
    [{canViewSource: true, price: 5}, true]
])('source access for %j is %s', (project, allowed) => {
    expect(canViewProjectSource(project)).toBe(allowed);
});

test.each([{price: 5, bought: true}, {price: 0, seeInside: false}])('direct commit links check project permissions before reading source: %j', async restricted => {
    api.getProject.mockResolvedValue({project: {id: 'p1', ...restricted}});
    let wrapper;
    await act(async () => {
        wrapper = mount(<MemoryRouter initialEntries={['/project/p1/commits/abc']} future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
            <Routes><Route path="/project/:id/commits/:sha" element={<Commit />} /></Routes>
        </MemoryRouter>);
    });
    wrapper.update();
    expect(wrapper.text()).toContain('Only the owner can view commits');
    expect(api.commitInspection).not.toHaveBeenCalled();
    expect(api.commitCoAuthors).not.toHaveBeenCalled();
    await act(async () => wrapper.unmount());
});

test('the file browser does not request a restricted snapshot', async () => {
    let wrapper;
    await act(async () => {
        wrapper = mount(<ProjectFiles project={{id: 'p1', gitHead: 'abc', price: 5, bought: true}} />);
    });
    expect(wrapper.text()).toContain('Only the owner can view files');
    expect(api.commitTree).not.toHaveBeenCalled();
    expect(api.commitFile).not.toHaveBeenCalled();
    await act(async () => wrapper.unmount());
});
