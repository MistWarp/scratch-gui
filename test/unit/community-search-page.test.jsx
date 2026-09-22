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

const renderSearch = async query => {
    let wrapper;
    await act(async () => {
        wrapper = mount(
            <MemoryRouter initialEntries={[`/search?q=${query}`]} future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
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
            'Studios and challenges'
        ]);
        expect(wrapper.find('[role="tab"]').map(tab => tab.text())).toEqual([
            'All',
            'Projects 12',
            'People 9',
            'Studios 2'
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
});
