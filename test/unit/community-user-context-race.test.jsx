import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';

import api from '../../src/community/api';
import {onRoturLogin} from '../../src/lib/rotur/cloud-sync.js';
import * as identity from '../../src/lib/rotur/identity.js';
import {UserProvider, useUser} from '../../src/community/UserContext.jsx';
import rotur from '../../src/community/rotur.js';

jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {me: jest.fn()}
}));
jest.mock('../../src/lib/rotur/cloud-sync.js', () => ({onRoturLogin: jest.fn()}));
jest.mock('../../src/community/rotur.js', () => ({profile: jest.fn()}));
jest.mock('../../src/lib/rotur/identity.js', () => ({
    subscribe: jest.fn(() => jest.fn()),
    restore: jest.fn(),
    login: jest.fn(),
    logout: jest.fn()
}));
jest.mock('../../src/lib/rotur/client.js', () => ({
    subscribeNotifications: jest.fn(() => jest.fn()),
    subscribeNotificationRemovals: jest.fn(() => jest.fn())
}));
jest.mock('../../src/lib/themes/themePersistance.js', () => ({
    applyThemeVisuals: jest.fn(),
    detectTheme: jest.fn(() => ({}))
}));
jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

let observedContext;
const Probe = () => {
    observedContext = useUser();
    const {user, loading} = observedContext;
    return <span>{loading ? 'loading' : user ? user.username : 'signed-out'}</span>;
};

describe('UserProvider identity races', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        onRoturLogin.mockResolvedValue({applied: false});
        rotur.profile.mockResolvedValue({});
    });

    test('ignores a previous login response after logout', async () => {
        let resolveMe;
        api.me.mockReturnValue(new Promise(resolve => {
            resolveMe = resolve;
        }));
        rotur.profile.mockImplementation(() => {
            throw new Error('Profile client unavailable');
        });

        const wrapper = mount(<UserProvider><Probe /></UserProvider>);
        const handleIdentity = identity.subscribe.mock.calls[0][0];

        act(() => handleIdentity({user: {username: 'old-user'}, status: 'ready'}));
        act(() => handleIdentity({user: null, status: 'ready'}));
        await act(async () => {
            resolveMe({username: 'old-user'});
            await Promise.resolve();
        });
        wrapper.update();

        expect(wrapper.text()).toBe('signed-out');
        expect(onRoturLogin).not.toHaveBeenCalled();
        wrapper.unmount();
    });

    test('ignores a user refresh completed after logout', async () => {
        api.me.mockResolvedValue({username: 'old-user'});
        const wrapper = mount(<UserProvider><Probe /></UserProvider>);
        const handleIdentity = identity.subscribe.mock.calls[0][0];

        await act(async () => {
            handleIdentity({user: {username: 'old-user'}, status: 'ready'});
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();
        expect(wrapper.text()).toBe('old-user');

        let resolveRefresh;
        api.me.mockReturnValue(new Promise(resolve => {
            resolveRefresh = resolve;
        }));
        let refresh;
        await act(async () => {
            refresh = observedContext.refreshUser();
            await Promise.resolve();
        });
        act(() => handleIdentity({user: null, status: 'ready'}));
        await act(async () => {
            resolveRefresh({username: 'old-user'});
            await refresh;
        });
        wrapper.update();

        expect(wrapper.text()).toBe('signed-out');
        wrapper.unmount();
    });
});
