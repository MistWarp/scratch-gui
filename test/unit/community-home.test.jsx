import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import {fetchNotifications} from '../../src/lib/rotur/client.js';
import api from '../../src/community/api';
import {NotificationsSection, ProjectFeedRow} from '../../src/community/pages/Home.jsx';

jest.mock('../../src/lib/rotur/client.js', () => ({fetchNotifications: jest.fn()}));
jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {explore: jest.fn()},
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
