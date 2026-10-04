import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import Search from '../../src/community/pages/Search.jsx';
import api from '../../src/community/api.js';

jest.mock('../../src/community/api.js', () => ({
    __esModule: true,
    default: {
        explore: jest.fn(() => Promise.resolve({projects: [], total: 0})),
        searchUsers: jest.fn(() => Promise.resolve({users: [], total: 0})),
        spaces: jest.fn(() => Promise.resolve({spaces: [], total: 0}))
    }
}));
jest.mock('../../src/community/rotur.js', () => ({
    withGroupTags: jest.fn(users => Promise.resolve(users))
}));
jest.mock('../../src/community/i18n.jsx', () => ({
    useCommunityIntl: () => ({t: key => key, text: key => key})
}));
jest.mock('../../src/community/components/ProjectCard.jsx', () => () => <div className="project" />);
jest.mock('../../src/community/components/SpaceCard.jsx', () => () => <div className="space" />);
jest.mock('../../src/community/components/Avatar.jsx', () => () => <div className="avatar" />);
jest.mock('../../src/community/components/GroupTag.jsx', () => () => <div className="tag" />);

const renderSearch = async (query, tab = '') => {
    let wrapper;
    await act(async () => {
        wrapper = mount(
            <MemoryRouter
                initialEntries={[`/search?q=${query}${tab ? `&tab=${tab}` : ''}`]}
                future={{v7_startTransition: true, v7_relativeSplatPath: true}}
            >
                <Search />
            </MemoryRouter>
        );
    });
    wrapper.update();
    return wrapper;
};

describe('community search page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        api.explore.mockResolvedValue({
            projects: [{id: 'p1', title: 'Refined MistBloks Physics Demo', owner: 'Twotanium'}],
            total: 12
        });
        api.searchUsers.mockResolvedValue({users: [{username: 'Mist', followers: 4, projects: 16}], total: 9});
        api.spaces.mockResolvedValue({spaces: [{_id: 's1', title: 'Malwares mistwarp', kind: 'studio', owner: 'xdmalware'}], total: 2});
    });

    test('leads with the group holding the best match and counts every result type', async () => {
        const wrapper = await renderSearch('mist');

        expect(wrapper.find('h2').map(heading => heading.text())).toEqual([
            'People',
            'Projects',
            'Spaces'
        ]);
        expect(wrapper.find('[role="tab"]').map(tab => tab.text())).toEqual([
            'All',
            'Projects 12',
            'People 9',
            'Spaces 2'
        ]);
        wrapper.unmount();
    });

    test('asks for best-match ordering and reports a search that found nothing', async () => {
        api.explore.mockResolvedValue({projects: [], total: 0});
        api.searchUsers.mockResolvedValue({users: [], total: 0});
        api.spaces.mockResolvedValue({spaces: [], total: 0});

        const wrapper = await renderSearch('zzz');

        expect(api.explore).toHaveBeenCalledWith(expect.objectContaining({q: 'zzz', sort: 'relevance'}));
        expect(wrapper.text()).toContain('Nothing matched that search');
        wrapper.unmount();
    });

    test('pages through people with a longer list and spaces with an offset', async () => {
        api.searchUsers.mockResolvedValueOnce({users: [{username: 'Mist'}], total: 2});
        const people = await renderSearch('mist', 'people');
        api.searchUsers.mockResolvedValueOnce({users: [{username: 'Mist'}, {username: 'Mistral'}], total: 2});
        await act(async () => {
            people.find('button').filterWhere(button => button.text().includes('Load more'))
                .simulate('click');
            await Promise.resolve();
        });
        people.update();

        expect(api.searchUsers).toHaveBeenLastCalledWith('mist', {limit: 25});
        expect(people.text()).toContain('Mistral');
        expect(people.find('button').filterWhere(button => button.text().includes('Load more'))).toHaveLength(0);
        people.unmount();

        const spaces = await renderSearch('mist', 'spaces');
        api.spaces.mockResolvedValueOnce({spaces: [{_id: 's2', title: 'Mist jam'}], total: 2});
        await act(async () => {
            spaces.find('button').filterWhere(button => button.text().includes('Load more'))
                .simulate('click');
            await Promise.resolve();
        });
        spaces.update();

        expect(api.spaces).toHaveBeenLastCalledWith(expect.objectContaining({q: 'mist', offset: 1}));
        expect(spaces.find('.space')).toHaveLength(2);
        spaces.unmount();
    });

    test('stops offering more people when a longer list adds nobody', async () => {
        api.searchUsers.mockResolvedValue({users: [{username: 'Mist'}], total: 9});
        const wrapper = await renderSearch('mist', 'people');
        await act(async () => {
            wrapper.find('button').filterWhere(button => button.text().includes('Load more'))
                .simulate('click');
            await Promise.resolve();
        });
        wrapper.update();

        expect(wrapper.find('button').filterWhere(button => button.text().includes('Load more'))).toHaveLength(0);
        wrapper.unmount();
    });

    test('reports a failed result type in its tab and retries just that type', async () => {
        api.searchUsers.mockRejectedValueOnce(new Error('offline'));
        const wrapper = await renderSearch('mist', 'people');

        expect(wrapper.text()).toContain('Could not load people.');
        expect(wrapper.text()).not.toContain('No people matched that search');
        expect(wrapper.find('[role="tab"]').map(tab => tab.text())).toContain('People');

        await act(async () => {
            wrapper.find('button').filterWhere(button => button.text() === 'Try again')
                .simulate('click');
            await Promise.resolve();
        });
        wrapper.update();

        expect(api.searchUsers).toHaveBeenCalledTimes(2);
        expect(api.explore).toHaveBeenCalledTimes(1);
        expect(wrapper.find('a[href="/users/Mist"]')).toHaveLength(1);
        wrapper.unmount();
    });

    test('sorts projects with a button group inside the projects tab panel', async () => {
        const wrapper = await renderSearch('mist', 'projects');

        const panel = wrapper.find('[role="tabpanel"]');
        expect(panel.prop('id')).toBe('search-panel-projects');
        expect(panel.prop('aria-labelledby')).toBe('search-tab-projects');
        expect(wrapper.find('#search-tab-projects').prop('aria-controls')).toBe('search-panel-projects');
        expect(wrapper.find('[role="tab"]')).toHaveLength(4);
        const sorts = wrapper.find('[role="group"]').find('button');
        expect(sorts.map(button => button.text())).toEqual(['Best match', 'Trending', 'Recent', 'Most loved']);
        expect(sorts.map(button => button.prop('aria-pressed'))).toEqual([true, false, false, false]);
        wrapper.unmount();
    });

    test('keeps the sort control and shows placeholder cards while projects reload', async () => {
        const wrapper = await renderSearch('mist', 'projects');
        api.explore.mockReturnValueOnce(new Promise(() => {}));
        await act(async () => {
            wrapper.find('[role="group"]').find('button')
                .filterWhere(button => button.text() === 'Recent')
                .simulate('click');
            await Promise.resolve();
        });
        wrapper.update();

        expect(api.explore).toHaveBeenLastCalledWith(expect.objectContaining({sort: 'recent'}));
        expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true);
        expect(wrapper.find('.project')).toHaveLength(0);
        const pressed = wrapper.find('[role="group"]').find('button[aria-pressed=true]');
        expect(pressed.text()).toBe('Recent');
        wrapper.unmount();
    });

    test('refines the search from the results page', async () => {
        const wrapper = await renderSearch('mist');
        const field = wrapper.find('input[type="search"]');

        expect(field.prop('value')).toBe('mist');
        field.simulate('change', {target: {value: 'warp'}});
        await act(async () => {
            wrapper.find('form[role="search"]').simulate('submit');
            await Promise.resolve();
        });
        wrapper.update();

        expect(api.explore).toHaveBeenLastCalledWith(expect.objectContaining({q: 'warp'}));
        expect(wrapper.find('input[type="search"]').prop('value')).toBe('warp');
        wrapper.unmount();
    });
});
