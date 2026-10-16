import React from 'react';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import {useUser} from '../../src/community/UserContext.jsx';
import Home from '../../src/community/pages/Home.jsx';

jest.mock('../../src/community/UserContext.jsx', () => ({useUser: jest.fn()}));
jest.mock('../../src/lib/rotur/client.js', () => ({
    fetchFollowingFeed: jest.fn(() => new Promise(() => {})),
    fetchNotifications: jest.fn(() => new Promise(() => {}))
}));
jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {
        explore: jest.fn(() => new Promise(() => {})),
        news: jest.fn(() => new Promise(() => {})),
        roadmap: jest.fn(() => new Promise(() => {}))
    },
    editorUrl: () => '/editor',
    projectUrl: id => `/project/${id}`
}));
jest.mock('../../src/community/analytics.js', () => ({track: jest.fn()}));
jest.mock('../../src/community/components/HomeDiscovery.jsx', () => () => <div data-section="discovery" />);
jest.mock('../../src/community/components/ChallengeCalendar.jsx', () => () => <div />);
jest.mock('../../src/community/components/ScratchImport.jsx', () => () => <div data-section="import" />);
jest.mock('../../src/community/components/HomeWorkspace.jsx', () => ({
    ActiveChallenge: () => <div data-section="challenge" />,
    ChallengeWinner: () => <div data-section="winner" />,
    ContinueProjects: () => <div data-section="continue" />,
    DeviceBackup: () => null,
    StarterGallery: ({children}) => <div data-section="starters">{children}</div>
}));
jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

const sectionOrder = wrapper => wrapper.find('[data-section]').map(node => node.prop('data-section'));

const render = () => mount(
    <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
        <Home />
    </MemoryRouter>
);

describe('home layout', () => {
    test('leads signed-out visitors with community projects and keeps starters last', () => {
        const login = jest.fn();
        useUser.mockReturnValue({user: null, login, loading: false});
        const wrapper = render();

        expect(wrapper.find('h1').text()).toBe('See what people are making on MistWarp');
        expect(sectionOrder(wrapper)).toEqual(['discovery', 'winner', 'challenge', 'starters', 'import']);
        const html = wrapper.html();
        expect(html.indexOf('id="home-projects')).toBeLessThan(html.indexOf('data-section="winner"'));
        expect(wrapper.find('[data-section="continue"]').exists()).toBe(false);

        wrapper.find('button').filterWhere(button => button.text() === 'Sign in').simulate('click');
        expect(login).toHaveBeenCalled();
        wrapper.unmount();
    });

    test('keeps the workspace first for signed-in creators', () => {
        useUser.mockReturnValue({user: {username: 'alice'}, login: jest.fn(), loading: false});
        const wrapper = render();

        expect(wrapper.find('h1').exists()).toBe(false);
        expect(sectionOrder(wrapper)).toEqual(['continue', 'discovery', 'winner', 'challenge']);
        wrapper.unmount();
    });
});
