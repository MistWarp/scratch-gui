import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import {fetchNotifications} from '../../src/lib/rotur/client.js';
import api from '../../src/community/api';
import {
    ContinuePlaying, HomeTabs, NotificationsSection, ProjectFeedRow
} from '../../src/community/pages/Home.jsx';

jest.mock('../../src/lib/rotur/client.js', () => ({
    fetchFollowingFeed: jest.fn(),
    fetchNotifications: jest.fn()
}));
jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {explore: jest.fn(), getUser: jest.fn()},
    editorUrl: () => '/editor',
    projectUrl: id => `/project/${id}`
}));
jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

const Harness = ({user}) => (
    <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
        <NotificationsSection user={user} login={jest.fn()} />
    </MemoryRouter>
);

describe('home notification preview', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.removeItem('mw:notification-preferences');
    });

    test('clears the previous account while the next account loads', async () => {
        fetchNotifications
            .mockResolvedValueOnce([{id: 'one', type: 'follow', actor: 'alice', created: Date.now()}])
            .mockReturnValueOnce(new Promise(() => {}));

        const wrapper = mount(<Harness user={{username: 'first'}} />);
        await act(async () => {
            await Promise.resolve();
        });
        wrapper.update();
        expect(wrapper.text()).toContain('alice');

        act(() => {
            wrapper.setProps({user: {username: 'second'}});
        });
        wrapper.update();

        expect(wrapper.text()).not.toContain('alice');
        wrapper.unmount();
    });

    test('does not reload when the same account object is refreshed', async () => {
        fetchNotifications.mockResolvedValue([]);
        const wrapper = mount(<Harness user={{username: 'same'}} />);
        await act(async () => {
            await Promise.resolve();
        });

        act(() => {
            wrapper.setProps({user: {username: 'same'}});
        });
        await act(async () => {
            await Promise.resolve();
        });

        expect(fetchNotifications).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });

    test('applies notification preferences and updates when they change', async () => {
        localStorage.setItem('mw:notification-preferences', JSON.stringify({social: false}));
        fetchNotifications.mockResolvedValue([
            {id: 'social', type: 'follow', actor: 'alice', created: Date.now()},
            {id: 'system', type: 'news', title: 'Release notes', created: Date.now()}
        ]);
        const wrapper = mount(<Harness user={{username: 'viewer'}} />);
        await act(async () => {
            await Promise.resolve();
        });
        wrapper.update();
        expect(wrapper.text()).not.toContain('alice');
        expect(wrapper.text()).toContain('Release notes');

        act(() => {
            localStorage.setItem('mw:notification-preferences', JSON.stringify({social: true}));
            window.dispatchEvent(new Event('mw:notification-preferences'));
        });
        wrapper.update();
        expect(wrapper.text()).toContain('alice');
        wrapper.unmount();
    });

    test('links space comments to the comment with a full sentence', async () => {
        fetchNotifications.mockResolvedValue([{
            id: 'space',
            type: 'space_comment',
            actor: 'alice',
            spaceId: 's1',
            spaceTitle: 'Game Jam',
            commentId: 'c1',
            created: Date.now()
        }]);
        const wrapper = mount(<Harness user={{username: 'viewer'}} />);
        await act(async () => {
            await Promise.resolve();
        });
        wrapper.update();

        expect(wrapper.text()).toContain('alice commented on Game Jam');
        expect(wrapper.text()).not.toContain('sent you a notification');
        expect(wrapper.find('a[href="/spaces/s1#comment-id-c1"]').text()).toBe('commented on Game Jam');
        wrapper.unmount();
    });
});

describe('home project feeds', () => {
    beforeEach(() => jest.clearAllMocks());

    test('retries only the failed project row', async () => {
        let trendingAttempts = 0;
        api.explore.mockImplementation(({sort}) => {
            if (sort === 'trending' && trendingAttempts++ === 0) return Promise.reject(new Error('offline'));
            return Promise.resolve({projects: []});
        });
        const Icon = () => null;
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <ProjectFeedRow title="Trending" icon={Icon} sort="trending" link="/explore" />
                <ProjectFeedRow title="Fresh" icon={Icon} sort="recent" link="/explore?sort=recent" />
            </MemoryRouter>
        );
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();

        await act(async () => {
            wrapper.find('button').filterWhere(button => button.text() === 'Try again').simulate('click');
            await Promise.resolve();
        });

        expect(api.explore.mock.calls.filter(([options]) => options.sort === 'trending')).toHaveLength(2);
        expect(api.explore.mock.calls.filter(([options]) => options.sort === 'recent')).toHaveLength(1);
        wrapper.unmount();
    });
});

describe('home tabs', () => {
    beforeEach(() => jest.clearAllMocks());

    const flush = async () => {
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
    };

    test('keeps visited panels mounted instead of refetching them', async () => {
        Element.prototype.scrollIntoView = jest.fn();
        api.explore.mockResolvedValue({projects: []});
        const Icon = () => null;
        const trending = (<ProjectFeedRow
            bare
            sort="trending"
        />);
        const recent = (<ProjectFeedRow
            bare
            sort="recent"
        />);
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <HomeTabs
                    id="feeds"
                    label="Projects"
                    tabs={[
                        {key: 'trending', title: 'Trending', icon: Icon, render: () => trending},
                        {key: 'recent', title: 'Recent', icon: Icon, render: () => recent}
                    ]}
                />
            </MemoryRouter>
        );
        await flush();
        wrapper.update();
        expect(api.explore).toHaveBeenCalledTimes(1);
        expect(wrapper.find('[role="tabpanel"]').hostNodes()).toHaveLength(1);

        const tabs = () => wrapper.find('button[role="tab"]');
        act(() => {
            tabs().at(1)
                .simulate('click');
        });
        await flush();
        act(() => {
            tabs().at(0)
                .simulate('click');
        });
        await flush();
        wrapper.update();

        expect(api.explore).toHaveBeenCalledTimes(2);
        const panels = wrapper.find('[role="tabpanel"]').hostNodes();
        expect(panels.map(panel => [panel.prop('id'), panel.prop('aria-labelledby'), panel.prop('hidden')])).toEqual([
            ['feeds-panel-trending', 'feeds-tab-trending', false],
            ['feeds-panel-recent', 'feeds-tab-recent', true]
        ]);
        wrapper.unmount();
        delete Element.prototype.scrollIntoView;
    });

    test('shows an error with a working retry for recently played games', async () => {
        api.getUser
            .mockRejectedValueOnce(new Error('offline'))
            .mockResolvedValueOnce({recentActivity: []});
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <ContinuePlaying username="viewer" />
            </MemoryRouter>
        );
        await flush();
        wrapper.update();
        expect(wrapper.text()).not.toContain('Nothing played yet');

        await act(async () => {
            wrapper.find('button').filterWhere(button => button.text() === 'Try again')
                .simulate('click');
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();

        expect(api.getUser).toHaveBeenCalledTimes(2);
        expect(wrapper.text()).toContain('Nothing played yet');
        wrapper.unmount();
    });
});
