import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter, Route, Routes} from 'react-router-dom';

import api from '../../src/community/api.js';
import Project from '../../src/community/pages/Project.jsx';
import {setMockUserContext} from '../../src/community/UserContext.jsx';

jest.mock('../../src/community/UserContext.jsx', () => {
    let state = {user: null, loading: true, login: jest.fn()};
    return {
        useUser: () => state,
        setMockUserContext: next => {
            state = next;
        }
    };
});
jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    CustomTheme: {},
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

const Harness = ({renderVersion}) => (
    <MemoryRouter
        initialEntries={['/project/project-1']}
        future={{v7_startTransition: true, v7_relativeSplatPath: true}}
    >
        <Routes>
            <Route path="/project/:id" element={<Project renderVersion={renderVersion} />} />
        </Routes>
    </MemoryRouter>
);

describe('community project loading', () => {
    test('waits for identity restoration before loading and counting the view', async () => {
        const pending = new Promise(() => {});
        const getProject = jest.spyOn(api, 'getProject').mockReturnValue(pending);
        const commits = jest.spyOn(api, 'commits').mockReturnValue(pending);
        const view = jest.spyOn(api, 'view').mockResolvedValue({});
        setMockUserContext({user: null, loading: true, login: jest.fn()});

        const wrapper = mount(<Harness renderVersion={0} />);

        expect(getProject).not.toHaveBeenCalled();
        expect(commits).not.toHaveBeenCalled();
        expect(view).not.toHaveBeenCalled();

        setMockUserContext({user: {username: 'Sophie'}, loading: false, login: jest.fn()});
        await act(async () => {
            wrapper.setProps({renderVersion: 1});
            await Promise.resolve();
        });

        expect(getProject).toHaveBeenCalledTimes(1);
        expect(getProject).toHaveBeenCalledWith('project-1');
        expect(commits).toHaveBeenCalledTimes(1);
        expect(view).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });
});
