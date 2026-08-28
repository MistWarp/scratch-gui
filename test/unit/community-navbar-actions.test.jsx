import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import NavBar from '../../src/community/components/NavBar.jsx';
import Button from '../../src/community/components/ui/Button.jsx';
import api from '../../src/community/api.js';
import rotur from '../../src/community/rotur.js';
import {loginOrThrow} from '../../src/community/UserContext.jsx';

jest.mock('../../src/community/UserContext.jsx', () => {
    const login = jest.fn();
    return {
        loginOrThrow: login,
        useUser: () => ({user: null, loading: false, loginOrThrow: login, logout: jest.fn()})
    };
});
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
    useCommunityIntl: () => ({t: key => key})
}));

const renderNav = () => mount(
    <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
        <NavBar />
    </MemoryRouter>
);

describe('community navigation actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        api.explore.mockResolvedValue({projects: []});
        api.searchUsers.mockResolvedValue({users: [{username: 'Alex'}]});
        api.spaces.mockResolvedValue({spaces: []});
        rotur.withGroupTags.mockImplementation(users => Promise.resolve(users));
    });

    test('locks rapid sign-in attempts across navigation controls', async () => {
        let finishLogin;
        loginOrThrow.mockReturnValue(new Promise(resolve => {
            finishLogin = resolve;
        }));
        const wrapper = renderNav();
        const signIn = wrapper.find(Button).filterWhere(button => button.text().includes('Sign in')).prop('onClick');

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
});
