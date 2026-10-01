import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';
import Settings from '../../src/community/pages/Settings.jsx';
import api from '../../src/community/api';
import {setMinorAccount} from '../../src/lib/minor-account.js';
import {setAnalyticsEnabled} from '../../src/community/analytics.js';

let mockUser = null;

jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {getUser: jest.fn(), updateProfile: jest.fn(), safety: jest.fn()}
}));
jest.mock('../../src/community/UserContext.jsx', () => ({
    useUser: () => ({user: mockUser, login: jest.fn(), loginOrThrow: jest.fn(), logout: jest.fn()})
}));
jest.mock('../../src/community/i18n.jsx', () => ({
    useCommunityIntl: () => ({
        t: key => key,
        text: (message, values) => String(message).replace(/\{(\w+)\}/g, (match, key) => (values && key in values ? values[key] : match))
    })
}));
jest.mock('../../src/community/components/LanguagePicker.jsx', () => () => null);
jest.mock('../../src/components/tw-settings-modal/theme-accent-panel.jsx', () => ({ThemeAccentPanel: () => null}));
jest.mock('../../src/components/tw-settings-modal/custom-themes-page.jsx', () => () => null);
jest.mock('../../src/lib/rotur/client.js', () => ({presenceSupported: jest.fn(() => Promise.resolve(false))}));
jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    CustomTheme: {},
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

const renderSettings = async section => {
    let wrapper;
    await act(async () => {
        wrapper = mount(
            <MemoryRouter
                initialEntries={[`/settings?section=${section}`]}
                future={{v7_startTransition: true, v7_relativeSplatPath: true}}
            >
                <Settings />
            </MemoryRouter>
        );
        await Promise.resolve();
    });
    await act(async () => {
        await Promise.resolve();
    });
    wrapper.update();
    return wrapper;
};

const switchRow = (wrapper, label) => wrapper.find('label').filterWhere(node => node.text().includes(label))
    .find('input[type="checkbox"]');

describe('Settings privacy for under-18 accounts', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
        api.safety.mockResolvedValue({blocked: [], muted: []});
        api.updateProfile.mockResolvedValue({ok: true});
    });

    afterEach(() => {
        setMinorAccount(false);
    });

    test('shows the minor defaults the API reports', async () => {
        mockUser = {username: 'sam', minor: true};
        setMinorAccount(true);
        api.getUser.mockResolvedValue({recentActivityVisible: false, commentsOff: true});
        const wrapper = await renderSettings('privacy');
        expect(wrapper.text()).toContain('Your Rotur account is under 18');
        expect(switchRow(wrapper, 'Show game activity and library').prop('checked')).toBe(false);
        expect(switchRow(wrapper, 'Allow comments on your profile').prop('checked')).toBe(false);
        wrapper.unmount();
    });

    test('adults see their profile settings without the notice', async () => {
        mockUser = {username: 'maya', minor: false};
        api.getUser.mockResolvedValue({recentActivityVisible: true, commentsOff: false});
        const wrapper = await renderSettings('privacy');
        expect(wrapper.text()).not.toContain('under 18');
        expect(switchRow(wrapper, 'Show game activity and library').prop('checked')).toBe(true);
        expect(switchRow(wrapper, 'Allow comments on your profile').prop('checked')).toBe(true);
        wrapper.unmount();
    });

    test('minors can turn profile comments back on themselves', async () => {
        mockUser = {username: 'sam', minor: true};
        setMinorAccount(true);
        api.getUser.mockResolvedValue({recentActivityVisible: false, commentsOff: true});
        const wrapper = await renderSettings('privacy');
        await act(async () => {
            switchRow(wrapper, 'Allow comments on your profile').simulate('change', {target: {checked: true}});
            await Promise.resolve();
        });
        wrapper.update();
        expect(api.updateProfile).toHaveBeenCalledWith({commentsOff: false});
        expect(switchRow(wrapper, 'Allow comments on your profile').prop('checked')).toBe(true);
        wrapper.unmount();
    });

    test('presence toggles show the minor defaults without a sign-in nudge', async () => {
        mockUser = {username: 'sam', minor: true};
        setMinorAccount(true);
        api.getUser.mockResolvedValue({});
        const wrapper = await renderSettings('presence');
        expect(switchRow(wrapper, 'Share editor presence').prop('checked')).toBe(false);
        expect(switchRow(wrapper, 'Include edit duration').prop('checked')).toBe(false);
        expect(wrapper.text()).not.toContain('Log in again');
        wrapper.unmount();
    });

    test('adults still get the presence sign-in prompt when the permission is missing', async () => {
        mockUser = {username: 'maya', minor: false};
        api.getUser.mockResolvedValue({});
        const wrapper = await renderSettings('presence');
        expect(switchRow(wrapper, 'Share editor presence').prop('checked')).toBe(true);
        expect(wrapper.text()).toContain('Log in again');
        wrapper.unmount();
    });

    test('anonymous analytics stay off and locked for minors', async () => {
        setAnalyticsEnabled(true);
        mockUser = {username: 'sam', minor: true};
        setMinorAccount(true);
        api.getUser.mockResolvedValue({});
        const wrapper = await renderSettings('data');
        const analytics = wrapper.find('input[aria-label="settings.analytics"]');
        expect(analytics.prop('checked')).toBe(false);
        expect(analytics.prop('disabled')).toBe(true);
        expect(wrapper.text()).toContain('Anonymous analytics stay off for accounts under 18.');
        wrapper.unmount();
    });
});
