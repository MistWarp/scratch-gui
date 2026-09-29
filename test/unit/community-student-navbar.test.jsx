/* eslint-disable react/display-name, react/jsx-no-bind */
import React from 'react';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import NavBar from '../../src/community/components/NavBar.jsx';
import Footer from '../../src/community/components/Footer.jsx';
import AnnouncementBanner from '../../src/community/components/AnnouncementBanner.jsx';

let mockUser = null;
let mockAccountProps = null;

jest.mock('../../src/community/UserContext.jsx', () => ({
    useUser: () => ({user: mockUser, loading: false, loginOrThrow: jest.fn(), logout: jest.fn()})
}));
jest.mock('../../src/components/menu-bar/mw-rotur-account.jsx', () => ({
    RoturAccount: props => {
        mockAccountProps = props;
        return <div id="account">{props.username}</div>;
    }
}));
jest.mock('../../src/community/api.js', () => ({
    __esModule: true,
    default: {
        explore: jest.fn(() => Promise.resolve({projects: []})),
        searchUsers: jest.fn(() => Promise.resolve({users: []})),
        spaces: jest.fn(() => Promise.resolve({spaces: []}))
    },
    editorUrl: jest.fn(() => '/editor'),
    projectUrl: jest.fn(() => '/project/x')
}));
jest.mock('../../src/community/rotur.js', () => ({withGroupTags: jest.fn(users => Promise.resolve(users))}));
jest.mock('../../src/lib/rotur/client.js', () => ({fetchNotifications: jest.fn(() => Promise.resolve([]))}));
jest.mock('../../src/community/faviconBadge.js', () => jest.fn());
jest.mock('../../src/community/i18n.jsx', () => ({
    useCommunityIntl: () => ({t: key => key, text: key => key})
}));

const renderIn = element => mount(
    <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>{element}</MemoryRouter>
);

describe('student community chrome', () => {
    beforeEach(() => {
        mockUser = {username: 'adaokafor~yumrk', displayName: 'Ada Okafor', isStudent: true};
        mockAccountProps = null;
        localStorage.clear();
    });

    test('the student nav has no search, explore, random, perks, bell or folder', () => {
        const wrapper = renderIn(<NavBar />);
        expect(wrapper.find('input')).toHaveLength(0);
        expect(wrapper.find('a[href="/explore"]')).toHaveLength(0);
        expect(wrapper.find('a[href="/random"]')).toHaveLength(0);
        expect(wrapper.find('a[href="/perks"]')).toHaveLength(0);
        expect(wrapper.find('a[href="/notifications"]')).toHaveLength(0);
        expect(wrapper.find('a[href="/mystuff"]')).toHaveLength(0);
        expect(wrapper.find('a[href="/"]')).toHaveLength(0);
        expect(wrapper.find('a[aria-label="My class"]').first()
            .prop('href')).toBe('/classroom');
        expect(wrapper.find('a[aria-label="New project"]').first()
            .prop('href')).toBe('/editor');
        expect(wrapper.find('a[aria-label="MistWarp"]').prop('href')).toBe('/classroom');
        expect(mockAccountProps.studentMode).toBe(true);
        expect(mockAccountProps.extraItems).toEqual([]);
        expect(mockAccountProps.displayName).toBe('Ada Okafor');
        wrapper.unmount();
    });

    test('a teacher keeps the full nav', () => {
        mockUser = {username: 'Mist', isAdmin: false};
        const wrapper = renderIn(<NavBar />);
        expect(wrapper.find('input').length).toBeGreaterThan(0);
        expect(wrapper.find('a[href="/explore"]').length).toBeGreaterThan(0);
        expect(wrapper.find('a[aria-label="MistWarp"]').prop('href')).toBe('/');
        expect(mockAccountProps.studentMode).toBe(false);
        expect(mockAccountProps.extraItems.map(item => item.path)).toEqual(['/classroom']);
        wrapper.unmount();
    });

    test('the student footer keeps only the legal link and the banner never renders', () => {
        const footer = renderIn(<Footer />);
        const hrefs = footer.find('a').map(node => node.prop('href'));
        expect(hrefs).toEqual(['/trust']);
        expect(footer.text()).not.toContain('Discord');
        expect(footer.text()).not.toContain('Chat');
        footer.unmount();
        const banner = renderIn(<AnnouncementBanner />);
        expect(banner.html()).toBe('');
        banner.unmount();
    });
});
