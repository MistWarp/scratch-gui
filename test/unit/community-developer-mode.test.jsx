import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter, Route, Routes, useLocation, useNavigate} from 'react-router-dom';

import api from '../../src/community/api';
import Project from '../../src/community/pages/Project.jsx';
import {isDeveloperMode, setDeveloperMode, useDeveloperMode, withShareKey} from '../../src/community/developer-mode.js';
import developerViewUrl, {projectPageUrl} from '../../src/lib/community/developer-view-url.js';
import {local} from '../../src/modules/storage';
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
let navigateTo = null;
const LocationProbe = () => {
    currentLocation = useLocation();
    navigateTo = useNavigate();
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
                path="/p/:slug"
                element={<Project />}
            />
            <Route
                path="/p/:slug/code/*"
                element={<p>{'developer view'}</p>}
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

    test('opens vanity links in the developer view', async () => {
        setDeveloperMode(true);
        jest.spyOn(api, 'resolveVanity').mockResolvedValue({id: 'project-1'});
        const wrapper = await mountProject('/p/space-game', {vanitySlug: 'space-game'});
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        expect(currentLocation.pathname).toBe('/p/space-game/code');
        wrapper.unmount();
    });

    test('sends version control anchors to the matching developer view tab', async () => {
        setDeveloperMode(true);
        let wrapper = await mountProject('/project/project-1#history');
        expect(currentLocation.pathname).toBe('/project/project-1/code/commits');
        wrapper.unmount();
        wrapper = await mountProject('/project/project-1#pull-requests');
        expect(currentLocation.pathname).toBe('/project/project-1/code/pulls');
        wrapper.unmount();
    });

    test('sends comment links to the developer view comments tab', async () => {
        setDeveloperMode(true);
        const wrapper = await mountProject('/project/project-1#comment-id-c1');
        expect(currentLocation.pathname).toBe('/project/project-1/code/comments');
        expect(currentLocation.hash).toBe('#comment-id-c1');
        wrapper.unmount();
    });

    test('keeps the share key and the comment anchor when it redirects', async () => {
        setDeveloperMode(true);
        const wrapper = await mountProject('/project/project-1?k=secret#comment-id-c1');
        expect(currentLocation.pathname).toBe('/project/project-1/code/comments');
        expect(currentLocation.search).toBe('?k=secret');
        expect(currentLocation.hash).toBe('#comment-id-c1');
        wrapper.unmount();
    });

    test('the view switch keeps the share key', async () => {
        setDeveloperMode(false);
        const wrapper = await mountProject('/project/project-1?k=secret');
        const link = wrapper.find('a[aria-label="Developer view"]');
        expect(link).toHaveLength(1);
        expect(link.prop('href')).toBe('/project/project-1/code?k=secret');
        wrapper.unmount();
    });

    test('keeps the project page for other anchors and private source', async () => {
        setDeveloperMode(true);
        let wrapper = await mountProject('/project/project-1#contribute');
        expect(currentLocation.pathname).toBe('/project/project-1');
        wrapper.unmount();
        wrapper = await mountProject('/project/project-1', {canViewSource: false});
        expect(currentLocation.pathname).toBe('/project/project-1');
        wrapper.unmount();
    });

    test('only redirects when the page opens, not when its tabs change the anchor', async () => {
        setDeveloperMode(true);
        const wrapper = await mountProject('/project/project-1#contribute');
        expect(currentLocation.pathname).toBe('/project/project-1');
        await act(async () => {
            navigateTo('/project/project-1');
            await Promise.resolve();
        });
        expect(currentLocation.pathname).toBe('/project/project-1');
        wrapper.unmount();
    });

    test('keeps working in memory when storage refuses writes', () => {
        const write = jest.spyOn(local, 'writeString').mockReturnValue(false);
        setDeveloperMode(true);
        expect(isDeveloperMode()).toBe(true);
        setDeveloperMode(false);
        expect(isDeveloperMode()).toBe(false);
        write.mockRestore();
    });

    test('opening the developer view in a new tab leaves the mode alone', async () => {
        const wrapper = await mountProject('/project/project-1');
        const button = wrapper.find('a[aria-label="Developer view"]');
        act(() => {
            button.simulate('click', {button: 0, ctrlKey: true});
        });
        expect(isDeveloperMode()).toBe(false);
        wrapper.unmount();
    });

    test('the developer view button turns it on', async () => {
        const wrapper = await mountProject('/project/project-1');
        expect(currentLocation.pathname).toBe('/project/project-1');
        const button = wrapper.find('a[aria-label="Developer view"]');
        expect(button).toHaveLength(1);
        act(() => {
            button.simulate('click', {button: 0});
        });
        expect(isDeveloperMode()).toBe(true);
        expect(currentLocation.pathname).toBe('/project/project-1/code');
        wrapper.unmount();
    });

    test('shows remix origin and ahead/behind indicator in the project header', async () => {
        setDeveloperMode(false);
        const wrapper = await mountProject('/project/project-1', {
            remixFrom: {
                id: 'parent-1',
                owner: 'Alice',
                title: 'Base Game',
                vanitySlug: 'base-game',
                ahead: 2,
                behind: 1
            }
        });
        expect(wrapper.text()).toContain('Remixed from');
        const parentLink = wrapper.find('a').filterWhere(link => link.text() === 'Alice / Base Game');
        expect(parentLink.prop('href')).toBe('/p/base-game');
        const deltaLink = wrapper.find('a').filterWhere(link => link.text() === '2 ahead, 1 behind');
        expect(deltaLink.prop('href')).toBe('/project/project-1/code/commits');
        wrapper.unmount();
    });
});

describe('withShareKey', () => {
    test('adds the key before the anchor and leaves keyless paths alone', () => {
        expect(withShareKey('/project/p1/code', '')).toBe('/project/p1/code');
        expect(withShareKey('/project/p1/code', 'a b')).toBe('/project/p1/code?k=a%20b');
        expect(withShareKey('/project/p1#reviews', 'abc')).toBe('/project/p1?k=abc#reviews');
        expect(withShareKey('/project/p1/code?branch=dev', 'abc')).toBe('/project/p1/code?branch=dev&k=abc');
    });
});

describe('developerViewUrl', () => {
    test('adds the code path before any query or hash', () => {
        expect(developerViewUrl('/project/p1')).toBe('/project/p1/code');
        expect(developerViewUrl('/p/my-game/')).toBe('/p/my-game/code');
        expect(developerViewUrl('https://mistwarp.org/project/p1?k=abc#top')).toBe('https://mistwarp.org/project/p1/code?k=abc#top');
    });

    test('only the editor in code mode goes to the developer view', () => {
        expect(projectPageUrl('/p/my-game', true)).toBe('/p/my-game/code');
        expect(projectPageUrl('/p/my-game', false)).toBe('/p/my-game');
        expect(projectPageUrl('https://mistwarp.org/project/p1#comments', true)).toBe('https://mistwarp.org/project/p1/code#comments');
    });

    test('leaves developer view links alone', () => {
        expect(developerViewUrl('/project/p1/code')).toBe('/project/p1/code');
        expect(developerViewUrl('')).toBe('');
    });
});

describe('editor links', () => {
    test('editorUrl asks for code mode only for a project', () => {
        const {editorUrl} = require('../../src/community/api');
        expect(editorUrl({platformProject: 'pAbc', mode: 'code'})).toMatch(/\?mode=code#mw-pAbc$/);
        expect(editorUrl({mode: 'code'})).not.toContain('mode=');
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
        window.history.replaceState(null, '', '/?mode=code&project_url=x#mw-p1');
        let state;
        jest.isolateModules(() => {
            state = require('../../src/reducers/editor-tab.js').editorTabInitialState;
        });
        expect(state.editorMode).toBe('code');
        expect(window.location.search).toBe('?project_url=x');
        expect(window.location.hash).toBe('#mw-p1');
        expect(load('')).toBe('blocks');
        expect(load('?mode=code')).toBe('code');
        localStorage.setItem('mw:editor-mode', 'code');
        expect(load('?mode=blocks')).toBe('blocks');
        expect(load('?mode=weird')).toBe('code');
        localStorage.removeItem('mw:editor-mode');
        expect(load('')).toBe('blocks');
        window.history.replaceState(null, '', '/explore');
    });
});
