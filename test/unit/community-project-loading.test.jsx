import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter, Route, Routes, useLocation, useNavigate} from 'react-router-dom';

import api from '../../src/community/api.js';
import Project, {activityHash, activityTabForHash} from '../../src/community/pages/Project.jsx';
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

const Harness = ({renderVersion, path = '/project/project-1'}) => (
    <MemoryRouter
        initialEntries={[path]}
        future={{v7_startTransition: true, v7_relativeSplatPath: true}}
    >
        <LocationProbe />
        <Routes>
            <Route
                path="/project/:id"
                element={<Project renderVersion={renderVersion} />}
            />
        </Routes>
    </MemoryRouter>
);

describe('community project loading', () => {
    afterEach(() => {
        localStorage.removeItem('mw:project-theme-mode');
        jest.restoreAllMocks();
    });

    test('loads the project during sign-in and counts the view once sign-in settles', async () => {
        const pending = new Promise(() => {});
        const getProject = jest.spyOn(api, 'getProject').mockReturnValue(pending);
        const commits = jest.spyOn(api, 'commits').mockReturnValue(pending);
        const pulls = jest.spyOn(api, 'pulls').mockReturnValue(pending);
        const view = jest.spyOn(api, 'view').mockResolvedValue({});
        setMockUserContext({user: null, loading: true, login: jest.fn()});

        const wrapper = mount(<Harness renderVersion={0} />);

        expect(getProject).toHaveBeenCalledTimes(1);
        expect(getProject).toHaveBeenCalledWith('project-1');
        expect(view).not.toHaveBeenCalled();

        setMockUserContext({user: {username: 'Sophie'}, loading: false, login: jest.fn()});
        await act(async () => {
            wrapper.setProps({renderVersion: 1});
            await Promise.resolve();
        });

        // The stored session did not change, so the project is not fetched again.
        expect(getProject).toHaveBeenCalledTimes(1);
        expect(commits).not.toHaveBeenCalled();
        expect(pulls).not.toHaveBeenCalled();
        expect(view).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });

    test('loads again when sign-in changes the session', async () => {
        const getProject = jest.spyOn(api, 'getProject').mockReturnValue(new Promise(() => {}));
        jest.spyOn(api, 'view').mockResolvedValue({});
        const session = jest.spyOn(api, 'loadSession').mockReturnValue(null);
        setMockUserContext({user: null, loading: true, login: jest.fn()});

        const wrapper = mount(<Harness renderVersion={0} />);
        expect(getProject).toHaveBeenCalledTimes(1);

        session.mockReturnValue('new-session');
        setMockUserContext({user: {username: 'Sophie'}, loading: false, login: jest.fn()});
        await act(async () => {
            wrapper.setProps({renderVersion: 1});
            await Promise.resolve();
        });

        expect(getProject).toHaveBeenCalledTimes(2);
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

    test('shows save to library as a primary project action', async () => {
        rotur.following.mockResolvedValue({following: []});
        jest.spyOn(api, 'getProject').mockResolvedValue({
            project: {
                id: 'project-1',
                title: 'Project',
                owner: 'Creator',
                hasContent: true,
                visibility: 'public',
                saved: false,
                myPlaytimeMs: 5400000,
                canSeeInside: false,
                canRemix: false
            }
        });
        jest.spyOn(api, 'commits').mockResolvedValue({commits: []});
        jest.spyOn(api, 'view').mockResolvedValue({});
        const saveProject = jest.spyOn(api, 'saveProject').mockResolvedValue({saved: true});
        setMockUserContext({user: {username: 'Viewer'}, loading: false, login: jest.fn()});

        const wrapper = mount(<Harness renderVersion={0} />);
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();

        const saveButton = wrapper.find('button')
            .filterWhere(button => button.text() === 'Save to library');
        expect(saveButton).toHaveLength(1);
        expect(wrapper.text()).toContain('1h 30m played');
        await act(async () => {
            saveButton.simulate('click');
            await Promise.resolve();
        });
        wrapper.update();

        expect(saveProject).toHaveBeenCalledWith('project-1');
        expect(wrapper.find('button').filterWhere(button => button.text() === 'Remove from library')).toHaveLength(1);
        wrapper.unmount();
    });

    test('maps activity tabs to address hashes and back', () => {
        expect(activityHash('Comments', 'history')).toBe('');
        expect(activityHash('Reviews', 'history')).toBe('#reviews');
        expect(activityHash('Version control', 'pulls')).toBe('#pull-requests');
        expect(activityTabForHash('#pull-requests')).toBe('Version control');
        expect(activityTabForHash('#bounties')).toBe('Bounties');
        expect(activityTabForHash('#comment-12')).toBe('Comments');
        expect(activityTabForHash('')).toBe('Comments');
    });

    test('writes the chosen activity tab to the address and follows hash changes', async () => {
        rotur.following.mockResolvedValue({following: []});
        jest.spyOn(api, 'getProject').mockResolvedValue({
            project: {id: 'project-1', title: 'Project', owner: 'Creator', hasContent: true, visibility: 'public'}
        });
        jest.spyOn(api, 'view').mockResolvedValue({});
        jest.spyOn(api, 'reviews').mockReturnValue(new Promise(() => {}));
        setMockUserContext({user: {username: 'Viewer'}, loading: false, login: jest.fn()});

        const wrapper = mount(<Harness
            renderVersion={0}
            path="/project/project-1?k=key"
        />);
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();

        const reviewsTab = wrapper.find('[role="tab"]').filterWhere(tab => tab.text() === 'Reviews');
        act(() => {
            reviewsTab.simulate('click');
        });
        wrapper.update();
        expect(currentLocation.hash).toBe('#reviews');
        expect(currentLocation.search).toBe('?k=key');

        const commentsTab = wrapper.find('[role="tab"]').filterWhere(tab => tab.text() === 'Comments');
        act(() => {
            commentsTab.simulate('click');
        });
        wrapper.update();
        expect(currentLocation.hash).toBe('');
        const selected = name => wrapper.find('[role="tab"]').hostNodes()
            .filterWhere(tab => tab.text() === name)
            .prop('aria-selected');
        expect(selected('Comments')).toBe(true);

        act(() => {
            navigateTo({hash: '#reviews'});
        });
        wrapper.update();
        expect(selected('Reviews')).toBe(true);

        // The active tab and the panel it shows point at each other.
        const reviewsButton = wrapper.find('[role="tab"]').hostNodes()
            .filterWhere(tab => tab.text() === 'Reviews');
        const panel = wrapper.find('[role="tabpanel"]').hostNodes()
            .filterWhere(node => node.prop('id').startsWith('project-activity-'));
        expect(panel).toHaveLength(1);
        expect(reviewsButton.prop('aria-controls')).toBe(panel.prop('id'));
        expect(panel.prop('aria-labelledby')).toBe(reviewsButton.prop('id'));
        expect(panel.prop('id')).toBe('project-activity-panel-reviews');
        wrapper.unmount();
    });
});
