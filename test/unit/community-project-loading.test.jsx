import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter, Route, Routes} from 'react-router-dom';

import api from '../../src/community/api.js';
import Project from '../../src/community/pages/Project.jsx';
import {setMockUserContext} from '../../src/community/UserContext.jsx';
import rotur from '../../src/community/rotur.js';

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
jest.mock('../../src/community/rotur.js', () => ({
    following: jest.fn()
}));
jest.mock('../../src/lib/rotur/client.js', () => ({
    getBalance: jest.fn(() => Promise.resolve(0))
}));
jest.mock('../../src/lib/community/cached-fetch.js', () => ({
    cachedFetchBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(0))),
    preloadContent: jest.fn(() => Promise.resolve())
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
    afterEach(() => {
        localStorage.removeItem('mw:project-theme-mode');
        jest.restoreAllMocks();
    });

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
        expect(commits).not.toHaveBeenCalled();
        expect(view).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });

    test('waits for the followed-creator theme decision before mounting the player', async () => {
        let resolveFollowing;
        rotur.following.mockReturnValue(new Promise(resolve => {
            resolveFollowing = resolve;
        }));
        jest.spyOn(api, 'getProject').mockResolvedValue({
            project: {
                id: 'project-1',
                title: 'Project',
                owner: 'Creator',
                projectJsonUrl: 'https://projects.example/project-1.sb3',
                assetsBase: 'https://assets.example/',
                hasContent: true,
                visibility: 'public'
            }
        });
        jest.spyOn(api, 'commits').mockResolvedValue({commits: []});
        jest.spyOn(api, 'view').mockResolvedValue({});
        localStorage.setItem('mw:project-theme-mode', 'followed');
        setMockUserContext({user: {username: 'Viewer'}, loading: false, login: jest.fn()});

        const wrapper = mount(<Harness renderVersion={0} />);
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();

        expect(wrapper.find('iframe')).toHaveLength(0);
        expect(wrapper.text()).toContain('Loading project…');

        await act(async () => {
            resolveFollowing({following: ['Creator']});
            await Promise.resolve();
        });
        wrapper.update();

        expect(wrapper.find('iframe')).toHaveLength(1);
        expect(wrapper.find('iframe').prop('src')).not.toContain('apply_project_theme=0');
        wrapper.unmount();
    });

    test('does not reload the player when project storage changes during startup', async () => {
        jest.spyOn(api, 'getProject').mockResolvedValue({
            project: {
                id: 'project-1',
                title: 'Project',
                owner: 'Creator',
                projectJsonUrl: 'https://projects.example/project-1.sb3',
                assetsBase: 'https://assets.example/',
                hasContent: true,
                visibility: 'public'
            }
        });
        jest.spyOn(api, 'commits').mockResolvedValue({commits: []});
        jest.spyOn(api, 'view').mockResolvedValue({});
        setMockUserContext({user: {username: 'Viewer'}, loading: false, login: jest.fn()});

        const wrapper = mount(<Harness renderVersion={0} />);
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();
        const initialSource = wrapper.find('iframe').prop('src');

        localStorage.setItem('mw:embed-storage:project-1:score', '1');
        await act(async () => {
            wrapper.setProps({renderVersion: 1});
            await Promise.resolve();
        });
        wrapper.update();

        expect(wrapper.find('iframe').prop('src')).toBe(initialSource);
        expect(initialSource).not.toContain('score');
        wrapper.unmount();
        localStorage.removeItem('mw:embed-storage:project-1:score');
    });
});
