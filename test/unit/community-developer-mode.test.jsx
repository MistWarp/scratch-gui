/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://mistwarp.org/explore"}
 */
import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter, Route, Routes, useLocation} from 'react-router-dom';

import api from '../../src/community/api';
import Project from '../../src/community/pages/Project.jsx';
import {isDeveloperMode, setDeveloperMode, useDeveloperMode} from '../../src/community/developer-mode.js';
import developerViewUrl from '../../src/lib/community/developer-view-url.js';
import {setMockUserContext} from '../../src/community/UserContext.jsx';
import rotur from '../../src/community/rotur.js';

jest.mock('../../src/community/UserContext.jsx', () => {
    let state = {user: null, loading: false, login: jest.fn()};
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
    myFollowing: jest.fn()
}));
jest.mock('../../src/lib/community/cached-fetch.js', () => ({
    cachedFetchBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(0))),
    preloadContent: jest.fn(() => Promise.resolve())
}));

let currentLocation = null;
const LocationProbe = () => {
    currentLocation = useLocation();
    return null;
};

const Harness = ({path}) => (
    <MemoryRouter
        initialEntries={[path]}
        future={{v7_startTransition: true, v7_relativeSplatPath: true}}
    >
        <LocationProbe />
        <Routes>
            <Route
                path="/project/:id"
                element={<Project />}
            />
            <Route
                path="/project/:id/code/*"
                element={<p>{'developer view'}</p>}
            />
        </Routes>
    </MemoryRouter>
);

const project = overrides => ({
    id: 'project-1',
    title: 'Project',
    owner: 'Creator',
    projectJsonUrl: 'https://projects.example/project-1.sb3',
    assetsBase: 'https://assets.example/',
    hasContent: true,
    visibility: 'public',
    ...overrides
});

const mountProject = async (path, details) => {
    rotur.myFollowing.mockResolvedValue({following: []});
    jest.spyOn(api, 'getProject').mockResolvedValue({project: project(details)});
    jest.spyOn(api, 'commits').mockResolvedValue({commits: []});
    jest.spyOn(api, 'view').mockResolvedValue({});
    setMockUserContext({user: {username: 'Viewer'}, loading: false, login: jest.fn()});
    const wrapper = mount(<Harness path={path} />);
    await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
    });
    wrapper.update();
    return wrapper;
};

describe('developer view preference', () => {
    afterEach(() => {
        localStorage.removeItem('mw:developer-view');
        jest.restoreAllMocks();
    });

    test('is off until turned on and survives in storage', () => {
        expect(isDeveloperMode()).toBe(false);
        setDeveloperMode(true);
        expect(isDeveloperMode()).toBe(true);
        setDeveloperMode(false);
        expect(isDeveloperMode()).toBe(false);
    });

    test('updates components that read it when it changes', () => {
        const Probe = () => {
            const [on] = useDeveloperMode();
            return <span>{on ? 'on' : 'off'}</span>;
        };
        const wrapper = mount(<Probe />);
        expect(wrapper.text()).toBe('off');
        act(() => setDeveloperMode(true));
        expect(wrapper.text()).toBe('on');
        wrapper.unmount();
    });

    test('opens project pages in the developer view when it is on', async () => {
        setDeveloperMode(true);
        const wrapper = await mountProject('/project/project-1?k=secret');
        expect(currentLocation.pathname).toBe('/project/project-1/code');
        expect(currentLocation.search).toBe('?k=secret');
        expect(wrapper.text()).toContain('developer view');
        wrapper.unmount();
    });

    test('keeps the project page for anchors and private source', async () => {
        setDeveloperMode(true);
        let wrapper = await mountProject('/project/project-1#contribute');
        expect(currentLocation.pathname).toBe('/project/project-1');
        wrapper.unmount();
        wrapper = await mountProject('/project/project-1', {canViewSource: false});
        expect(currentLocation.pathname).toBe('/project/project-1');
        wrapper.unmount();
    });

    test('the developer view button turns it on', async () => {
        const wrapper = await mountProject('/project/project-1');
        expect(currentLocation.pathname).toBe('/project/project-1');
        const button = wrapper.find('a').filterWhere(link => link.text() === 'Developer view');
        expect(button).toHaveLength(1);
        act(() => {
            button.simulate('click', {button: 0});
        });
        expect(isDeveloperMode()).toBe(true);
        expect(currentLocation.pathname).toBe('/project/project-1/code');
        wrapper.unmount();
    });
});

describe('developerViewUrl', () => {
    test('adds the code path before any query or hash', () => {
        expect(developerViewUrl('/project/p1')).toBe('/project/p1/code');
        expect(developerViewUrl('/p/my-game/')).toBe('/p/my-game/code');
        expect(developerViewUrl('https://mistwarp.org/project/p1?k=abc#top')).toBe('https://mistwarp.org/project/p1/code?k=abc#top');
    });

    test('leaves developer view links alone', () => {
        expect(developerViewUrl('/project/p1/code')).toBe('/project/p1/code');
        expect(developerViewUrl('')).toBe('');
    });
});

describe('editor links', () => {
    test('editorUrl asks for code mode only for a project', () => {
        const {editorUrl} = require('../../src/community/api');
        expect(editorUrl({platformProject: 'pAbc', mode: 'code'})).toBe('https://editor.mistwarp.org/?mode=code#mw-pAbc');
        expect(editorUrl({mode: 'code'})).toBe('https://editor.mistwarp.org/');
    });

    test('the editor starts in the mode from the address', () => {
        const load = search => {
            window.history.replaceState(null, '', `/${search}`);
            let state;
            jest.isolateModules(() => {
                state = require('../../src/reducers/editor-tab.js').editorTabInitialState;
            });
            return state.editorMode;
        };
        localStorage.setItem('mw:editor-mode', 'blocks');
        expect(load('?mode=code')).toBe('code');
        localStorage.setItem('mw:editor-mode', 'code');
        expect(load('?mode=blocks')).toBe('blocks');
        expect(load('?mode=weird')).toBe('code');
        localStorage.removeItem('mw:editor-mode');
        expect(load('')).toBe('blocks');
        window.history.replaceState(null, '', '/explore');
    });
});
