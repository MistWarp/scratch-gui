import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import api from '../../src/community/api';
import rotur from '../../src/community/rotur';
import loadProjectPreview from '../../src/community/project-preview.js';
import {fetchFollowingFeed} from '../../src/lib/rotur/client.js';
import {FollowingSection} from '../../src/community/pages/Home.jsx';

jest.mock('../../src/lib/rotur/client.js', () => ({fetchFollowingFeed: jest.fn()}));
jest.mock('../../src/community/rotur', () => ({__esModule: true, default: {myFollowing: jest.fn()}}));
jest.mock('../../src/community/project-preview.js', () => ({__esModule: true, default: jest.fn()}));
jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {activity: jest.fn(), leaderboard: jest.fn(() => Promise.resolve({users: []}))},
    editorUrl: () => '/editor',
    projectUrl: project => `/project/${project.id || project}`
}));
jest.mock('../../src/community/components/HomeDiscovery.jsx', () => ({
    SuggestedCreators: () => <div data-section="creators" />
}));
jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

const now = Date.now();

const flush = async wrapper => {
    for (let i = 0; i < 4; i++) {
        await act(async () => {
            await Promise.resolve();
        });
    }
    wrapper.update();
};

const render = (viewerName = 'viewer') => mount(
    <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
        <FollowingSection viewerName={viewerName} />
    </MemoryRouter>
);

describe('home following section', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        rotur.myFollowing.mockResolvedValue({following: ['alice', 'bob']});
        fetchFollowingFeed.mockResolvedValue([]);
        api.activity.mockResolvedValue({activity: []});
        loadProjectPreview.mockImplementation(({id}) => Promise.resolve({id, title: `Game ${id}`, owner: 'alice'}));
    });

    test('shows new games and the latest posts and activity, newest first', async () => {
        api.activity.mockResolvedValue({activity: [
            {type: 'share', actor: 'alice', projectId: 'g1', projectTitle: 'Game g1', created: now - 5000},
            {type: 'share', actor: 'alice', projectId: 'g1', projectTitle: 'Game g1', created: now - 6000},
            {type: 'love', actor: 'bob', projectId: 'g2', projectTitle: 'Other', created: now - 1000}
        ]});
        fetchFollowingFeed.mockResolvedValue([{id: 'post1', user: 'alice', content: 'hello there', timestamp: now - 3000}]);
        const wrapper = render();
        await flush(wrapper);

        expect(loadProjectPreview).toHaveBeenCalledTimes(1);
        expect(wrapper.find('h3').map(node => node.text())).toEqual(['Game g1']);
        expect(wrapper.find('li p').map(node => node.text())).toEqual(['bob loved Other', 'alice posted: hello there']);
        wrapper.unmount();
    });

    test('suggests creators to people who follow nobody', async () => {
        rotur.myFollowing.mockResolvedValue({following: []});
        const wrapper = render();
        await flush(wrapper);

        expect(wrapper.find('h2').text()).toBe('Creators to follow');
        expect(wrapper.find('[data-section="creators"]').exists()).toBe(true);
        expect(api.activity).not.toHaveBeenCalled();
        wrapper.unmount();
    });

    test('says when people you follow have been quiet', async () => {
        const wrapper = render();
        await flush(wrapper);

        expect(wrapper.text()).toContain('Nothing new from people you follow lately.');
        wrapper.unmount();
    });

    test('offers a retry when nothing could be loaded', async () => {
        api.activity.mockRejectedValueOnce(new Error('offline'));
        fetchFollowingFeed.mockRejectedValueOnce(new Error('offline'));
        const wrapper = render();
        await flush(wrapper);
        expect(wrapper.text()).toContain("Couldn't load activity.");

        wrapper.find('button').filterWhere(button => button.text() === 'Try again')
            .simulate('click');
        await flush(wrapper);
        expect(wrapper.text()).not.toContain("Couldn't load activity.");
        expect(rotur.myFollowing).toHaveBeenCalledTimes(2);
        wrapper.unmount();
    });

    test('drops the previous account while the next account loads', async () => {
        fetchFollowingFeed.mockResolvedValueOnce([{id: 'p', user: 'alice', content: 'secret', timestamp: now}]);
        const Harness = ({viewerName}) => (
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <FollowingSection viewerName={viewerName} />
            </MemoryRouter>
        );
        const wrapper = mount(<Harness viewerName="first" />);
        await flush(wrapper);
        expect(wrapper.text()).toContain('secret');

        rotur.myFollowing.mockReturnValue(new Promise(() => {}));
        act(() => {
            wrapper.setProps({viewerName: 'second'});
        });
        wrapper.update();
        expect(wrapper.text()).not.toContain('secret');
        wrapper.unmount();
    });
});
