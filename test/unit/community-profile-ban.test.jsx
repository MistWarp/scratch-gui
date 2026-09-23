import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter, Route, Routes, useNavigate} from 'react-router-dom';
import Profile from '../../src/community/pages/Profile.jsx';
import api from '../../src/community/api';
import rotur from '../../src/community/rotur';

jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {getUser: jest.fn(), userReviews: jest.fn(), themes: jest.fn()}
}));
jest.mock('../../src/community/rotur', () => ({
    profile: jest.fn(), followers: jest.fn(), avatar: () => '', banner: () => ''
}));
jest.mock('../../src/community/UserContext.jsx', () => ({
    useUser: () => ({user: null, loading: false})
}));
jest.mock('../../src/lib/rotur/client.js', () => ({payUser: jest.fn()}));
jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));
jest.mock('../../src/community/components/CommentThread.jsx', () => () => null);

const Navigation = () => {
    const navigate = useNavigate();
    const nextProfile = React.useCallback(() => navigate('/users/other'), [navigate]);
    return <button onClick={nextProfile}>Next profile</button>;
};

const renderProfile = () => mount(
    <MemoryRouter
        initialEntries={['/users/alice']}
        future={{v7_startTransition: true, v7_relativeSplatPath: true}}
    >
        <Navigation />
        <Routes><Route
            path="/users/:name"
            element={<Profile />}
        /></Routes>
    </MemoryRouter>
);

const settle = async wrapper => {
    await act(async () => {
        await Promise.resolve();
    });
    wrapper.update();
};

describe('MistWarp profile bans', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        api.getUser.mockResolvedValue({banned: true, projects: []});
        api.userReviews.mockResolvedValue({reviews: []});
        api.themes.mockResolvedValue({themes: []});
        rotur.profile.mockResolvedValue({username: 'alice', bio: 'Public Rotur bio', banned: false});
        rotur.followers.mockResolvedValue({followers: []});
    });

    test('replaces an active Rotur profile with the site ban notice', async () => {
        const wrapper = renderProfile();
        await settle(wrapper);
        expect(wrapper.find('main').text()).toBe('Banned from MistWarp by site admins.');
        expect(wrapper.find('h1')).toHaveLength(0);
        expect(wrapper.text()).not.toContain('Public Rotur bio');
        expect(document.querySelector('meta[name="description"]').content)
            .toBe('Banned from MistWarp by site admins.');
        wrapper.unmount();
    });

    test('waits for site ban status before displaying Rotur content', async () => {
        let finish;
        api.getUser.mockReturnValue(new Promise(resolve => {
            finish = resolve;
        }));
        const wrapper = renderProfile();
        await settle(wrapper);
        expect(wrapper.find('main').text()).toBe('Loading…');
        await act(async () => {
            finish({banned: true});
            await Promise.resolve();
        });
        wrapper.update();
        expect(wrapper.find('main').text()).toBe('Banned from MistWarp by site admins.');
        wrapper.unmount();
    });

    test.each(['pending', 'missing'])('shows site bans when Rotur is %s', async state => {
        rotur.profile.mockImplementation(() => (state === 'pending' ?
            new Promise(() => {}) : Promise.reject(Object.assign(new Error('Not found'), {status: 404}))));
        const wrapper = renderProfile();
        await settle(wrapper);
        expect(wrapper.find('main').text()).toBe('Banned from MistWarp by site admins.');
        wrapper.unmount();
    });

    test('clears the ban notice when navigating to an unbanned account', async () => {
        const wrapper = renderProfile();
        await settle(wrapper);
        api.getUser.mockResolvedValue({banned: false, projects: []});
        rotur.profile.mockResolvedValue({username: 'other', bio: 'An active account'});
        act(() => {
            wrapper.find(Navigation).find('button')
                .simulate('click');
        });
        expect(wrapper.find('main').text()).toBe('Loading…');
        await settle(wrapper);
        expect(wrapper.text()).not.toContain('Banned from MistWarp by site admins.');
        expect(wrapper.text()).toContain('An active account');
        wrapper.unmount();
    });
});
