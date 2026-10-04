import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import NavBar from '../../src/community/components/NavBar.jsx';
import Button from '../../src/community/components/ui/Button.jsx';
import api from '../../src/community/api.js';
import rotur from '../../src/community/rotur.js';
import {loginOrThrow} from '../../src/community/UserContext.jsx';

let mockUser = null;

jest.mock('../../src/community/UserContext.jsx', () => {
    const login = jest.fn();
    return {
        loginOrThrow: login,
        useUser: () => ({user: mockUser, loading: false, loginOrThrow: login, logout: jest.fn()})
    };
});
jest.mock('../../src/components/menu-bar/mw-rotur-account.jsx', () => ({
    RoturAccount: () => <div>Account</div>
}));
jest.mock('../../src/community/api.js', () => ({
    __esModule: true,
    default: {
        explore: jest.fn(() => Promise.resolve({projects: []})),
        searchUsers: jest.fn(() => Promise.resolve({users: [{username: 'Alex'}]})),
        spaces: jest.fn(() => Promise.resolve({spaces: []}))
    },
    editorUrl: jest.fn(() => '/editor')
}));
jest.mock('../../src/community/rotur.js', () => ({
    withGroupTags: jest.fn(users => Promise.resolve(users))
}));
jest.mock('../../src/lib/rotur/client.js', () => ({
    fetchNotifications: jest.fn(() => Promise.resolve([]))
}));
jest.mock('../../src/community/faviconBadge.js', () => jest.fn());
jest.mock('../../src/community/i18n.jsx', () => ({
    useCommunityIntl: () => ({t: key => key, text: key => key})
}));

const renderNav = (path = '/') => mount(
    <MemoryRouter
        initialEntries={[path]}
        future={{v7_startTransition: true, v7_relativeSplatPath: true}}
    >
        <NavBar />
    </MemoryRouter>
);

describe('community navigation actions', () => {
    beforeEach(() => {
        mockUser = null;
        jest.clearAllMocks();
        api.explore.mockResolvedValue({projects: []});
        api.searchUsers.mockResolvedValue({users: [{username: 'Alex'}]});
        api.spaces.mockResolvedValue({spaces: []});
        rotur.withGroupTags.mockImplementation(users => Promise.resolve(users));
    });

    test('shows notifications in the signed-in mobile dock', () => {
        mockUser = {username: 'Sophie', isAdmin: false};
        const wrapper = renderNav();
        const notificationLinks = wrapper
            .find('nav[aria-label="Mobile navigation"]')
            .find('a[aria-label="Notifications"]');

        expect(notificationLinks).toHaveLength(1);
        expect(notificationLinks.prop('href')).toBe('/notifications');
        wrapper.unmount();
    });

    test('shows notifications in the signed-in desktop menu bar', () => {
        mockUser = {username: 'Sophie', isAdmin: false};
        const wrapper = renderNav();
        const notificationLinks = wrapper.find('a[aria-label="Notifications"]');

        expect(notificationLinks).toHaveLength(2);
        expect(notificationLinks.everyWhere(link => link.prop('href') === '/notifications')).toBe(true);
        wrapper.unmount();
    });

    test('keeps two actions to the right of create when signed out', () => {
        const wrapper = renderNav();
        const dockItems = wrapper.find('nav[aria-label="Mobile navigation"]').children();

        expect(dockItems).toHaveLength(5);
        expect(dockItems.at(3).prop('aria-label')).toBe('Notifications');
        expect(dockItems.at(4).prop('aria-label')).toBe('Sign in');
        wrapper.unmount();
    });

    test('locks rapid sign-in attempts across navigation controls', async () => {
        let finishLogin;
        loginOrThrow.mockReturnValue(new Promise(resolve => {
            finishLogin = resolve;
        }));
        const wrapper = renderNav();
        const signIn = wrapper.find(Button).filterWhere(button => button.text().includes('Sign in'))
            .prop('onClick');

        let first;
        act(() => {
            first = signIn();
            signIn();
        });
        expect(loginOrThrow).toHaveBeenCalledTimes(1);

        await act(async () => {
            finishLogin();
            await first;
        });
        wrapper.unmount();
    });

    test('ends quick-search loading when group tags fail', async () => {
        jest.useFakeTimers();
        rotur.withGroupTags.mockRejectedValue(new Error('Rotur unavailable'));
        const wrapper = renderNav();
        const desktopSearch = wrapper.find('input[role="combobox"]').first();

        desktopSearch.simulate('focus');
        desktopSearch.simulate('change', {target: {value: 'al'}});
        await act(async () => {
            jest.advanceTimersByTime(200);
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();

        expect(wrapper.text()).toContain('Could not load quick results. Press Enter to search.');
        expect(wrapper.text()).not.toContain('Searching…');
        wrapper.unmount();
        jest.useRealTimers();
    });

    test('moves through every quick result kind with the arrow keys', async () => {
        jest.useFakeTimers();
        api.explore.mockResolvedValue({projects: [{id: 'p1', title: 'Alpine', owner: 'Sophie'}]});
        api.spaces.mockResolvedValue({spaces: [{_id: 's1', title: 'Alps studio', kind: 'studio', owner: 'Sophie'}]});
        const wrapper = renderNav();
        const input = () => wrapper.find('input[role="combobox"]').first();

        input().simulate('focus');
        input().simulate('change', {target: {value: 'al'}});
        await act(async () => {
            jest.advanceTimersByTime(200);
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();

        const listbox = wrapper.find('#mw-search-suggestions-desktop[role="listbox"]');
        const options = listbox.find('[role="option"]');
        expect(options).toHaveLength(4);
        expect(listbox.find('[role="group"]')).toHaveLength(3);
        expect(listbox.find('button')).toHaveLength(0);
        expect(input().prop('aria-expanded')).toBe(true);

        const highlighted = [];
        for (let step = 0; step < 4; step++) {
            input().simulate('keydown', {key: 'ArrowDown'});
            wrapper.update();
            highlighted.push(input().prop('aria-activedescendant'));
        }
        expect(new Set(highlighted).size).toBe(4);
        expect(wrapper.find(`#${highlighted[3]}`).text()).toContain('See all results');

        input().simulate('keydown', {key: 'Home'});
        wrapper.update();
        expect(input().prop('aria-activedescendant')).toBe(highlighted[0]);
        input().simulate('keydown', {key: 'End'});
        wrapper.update();
        expect(input().prop('aria-activedescendant')).toBe(highlighted[3]);
        wrapper.unmount();
        jest.useRealTimers();
    });

    test('opens the highlighted quick result with Enter', async () => {
        jest.useFakeTimers();
        const wrapper = renderNav();
        const input = () => wrapper.find('input[role="combobox"]').first();

        input().simulate('focus');
        input().simulate('change', {target: {value: 'al'}});
        await act(async () => {
            jest.advanceTimersByTime(200);
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();
        input().simulate('keydown', {key: 'ArrowDown'});
        wrapper.update();
        expect(wrapper.find(`#${input().prop('aria-activedescendant')}`).text()).toContain('Alex');
        input().simulate('keydown', {key: 'Enter'});
        wrapper.update();

        // Leaving the page clears the box.
        expect(input().prop('value')).toBe('');
        wrapper.unmount();
        jest.useRealTimers();
    });

    test('keeps the query in the box on the results page without looking it up again', () => {
        const wrapper = renderNav('/search?q=platform%20game');

        expect(wrapper.find('input[role="combobox"]').first()
            .prop('value')).toBe('platform game');
        expect(api.searchUsers).not.toHaveBeenCalled();
        wrapper.unmount();
    });

    test('marks the current main section in the desktop links', () => {
        const wrapper = renderNav('/spaces?kind=studio');
        const main = wrapper.find('nav[aria-label="nav.main"]');

        expect(main.find('a[aria-label="nav.explore"]').prop('aria-current')).toBe('page');
        expect(main.find('a[aria-label="nav.random"]')
            .prop('aria-current')).toBeFalsy();
        expect(main.find('a[aria-label="nav.random"]').prop('title')).toBe('nav.random');
        wrapper.unmount();
    });
});
