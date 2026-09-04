import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';
import Home from '../../src/community/pages/Home';
import {ContinueProjects, StarterGallery, selectActiveChallenge} from '../../src/community/components/HomeWorkspace';
import {useUser} from '../../src/community/UserContext';
import {rememberEditedProject} from '../../src/lib/mw/recent-projects';
import api from '../../src/community/api';

jest.mock('../../src/community/UserContext', () => ({useUser: jest.fn()}));
jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {myProjectPage: jest.fn(), getProject: jest.fn(), spaces: jest.fn(), explore: jest.fn(), news: jest.fn(), roadmap: jest.fn()},
    editorUrl: ({platformProject, starter} = {}) => platformProject ? `/editor#mw-${platformProject}` : `/editor${starter ? `?starter=${starter}` : ''}`,
    projectUrl: id => `/project/${id}`
}));
jest.mock('../../src/community/rotur', () => ({following: () => Promise.resolve({following: []})}));
jest.mock('../../src/lib/rotur/client', () => ({fetchFollowingFeed: () => Promise.resolve([]), fetchNotifications: () => Promise.resolve([])}));
jest.mock('../../src/lib/api/restore-points', () => ({getAllRestorePoints: () => Promise.resolve({restorePoints: []})}));
jest.mock('../../src/lib/themes/custom-themes', () => ({customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}}));

const flush = async wrapper => {
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    wrapper.update();
};
const render = element => mount(<MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>{element}</MemoryRouter>);

beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    useUser.mockReturnValue({user: {username: 'alice'}, login: jest.fn(), loading: false});
    api.spaces.mockResolvedValue({spaces: []});
    api.explore.mockResolvedValue({projects: []});
    api.news.mockResolvedValue({news: []});
    api.roadmap.mockResolvedValue({ideas: []});
});

test.each([[3, true], [4, false], [12, false]])('an account with %i projects shows starters: %s', async (total, visible) => {
    api.myProjectPage.mockResolvedValue({projects: [], total});
    const wrapper = render(<Home />);
    expect(wrapper.find(StarterGallery)).toHaveLength(0);
    await flush(wrapper);
    expect(wrapper.find(StarterGallery)).toHaveLength(visible ? 1 : 0);
    await act(async () => wrapper.unmount());
});

test('does not flash starters while the account is restoring', async () => {
    useUser.mockReturnValue({user: null, loading: true});
    const wrapper = render(<Home />);
    await flush(wrapper);
    expect(wrapper.find(StarterGallery)).toHaveLength(0);
    await act(async () => wrapper.unmount());
});

test('puts the last edited project first and removes duplicates', async () => {
    rememberEditedProject('alice', 'last');
    api.getProject.mockResolvedValue({project: {id: 'last', owner: 'alice', title: 'Last edited', edited: 1}});
    api.myProjectPage.mockResolvedValue({projects: [
        {id: 'newest', owner: 'alice', title: 'Newest saved', edited: 10},
        {id: 'last', owner: 'alice', title: 'Last edited', edited: 1}
    ], total: 2});
    const wrapper = render(<ContinueProjects username="alice" />);
    await flush(wrapper);
    expect(wrapper.find('a[href="/editor#mw-last"]')).toHaveLength(1);
    expect(wrapper.find('h2').map(node => node.text())).toEqual(['Last edited', 'Newest saved']);
    await act(async () => wrapper.unmount());
});

test('ignores a late project response from the previous account', async () => {
    let resolveAlice;
    api.myProjectPage.mockImplementation(name => name === 'alice' ? new Promise(resolve => { resolveAlice = resolve; }) : Promise.resolve({projects: [], total: 0}));
    const Harness = ({username}) => <MemoryRouter><ContinueProjects username={username} /></MemoryRouter>;
    const wrapper = mount(<Harness username="alice" />);
    act(() => wrapper.setProps({username: 'bob'}));
    await flush(wrapper);
    resolveAlice({projects: [{id: 'secret', owner: 'alice', title: 'Private draft'}], total: 1});
    await flush(wrapper);
    expect(wrapper.text()).not.toContain('Private draft');
    await act(async () => wrapper.unmount());
});

test('only highlights a challenge that is accepting submissions', () => {
    expect(selectActiveChallenge([
        {_id: 'ended', startsAt: 1, endsAt: 10, participantCount: 100},
        {_id: 'next', startsAt: 30, endsAt: 50, participantCount: 100},
        {_id: 'open', startsAt: 1, endsAt: 50, participantCount: 2}
    ], 20)._id).toBe('open');
});
