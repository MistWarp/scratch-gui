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
jest.mock('../../src/community/rotur', () => ({myFollowing: jest.fn(() => new Promise(() => {}))}));
jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {explore: () => new Promise(() => {})},
    editorUrl: () => '/editor',
    projectUrl: id => `/project/${id}`
}));
jest.mock('../../src/community/analytics.js', () => ({track: jest.fn()}));
jest.mock('../../src/community/components/HomeGames.jsx', () => {
    const mockReact = jest.requireActual('react');
    return () => {
        mockReact.useEffect(() => {
            global.gamesMounts += 1;
        }, []);
        return <div data-section="games" />;
    };
});
jest.mock('../../src/community/components/HomeRail.jsx', () => ({
    RailProjects: () => <div data-section="projects" />,
    RailPlaying: () => <div data-section="playing" />,
    RailFollowing: () => <div data-section="following" />,
    RailStarters: () => <div data-section="starters" />,
    RailCreators: () => <div data-section="creators" />,
    RailNews: () => <div data-section="news" />
}));
jest.mock('../../src/community/components/HomeWorkspace.jsx', () => ({
    DeviceBackup: () => null
}));
jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

const sectionOrder = wrapper => Array.from(wrapper.getDOMNode().querySelectorAll('[data-section]'))
    .map(node => node.getAttribute('data-section'));

const Harness = ({session}) => (
    <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
        <Home
            key="home"
            session={session}
        />
    </MemoryRouter>
);

const render = () => mount(<Harness session={0} />);

describe('home layout', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.gamesMounts = 0;
    });

    test('tells signed-out visitors what MistWarp is, then games beside starters, creators and news', () => {
        const login = jest.fn();
        useUser.mockReturnValue({user: null, login, loading: false});
        const wrapper = render();

        expect(wrapper.find('h1').text()).toBe('Scratch Supercharged');
        expect(wrapper.find('a[href="/editor"]').first()
            .text()).toBe('Start creating');
        expect(sectionOrder(wrapper)).toEqual(['games', 'starters', 'creators', 'news']);
        expect(wrapper.text()).not.toMatch(/membership|jam/i);

        wrapper.find('button')
            .filterWhere(button => button.text() === 'Sign in')
            .simulate('click');
        expect(login).toHaveBeenCalled();
        wrapper.unmount();
    });

    test('shows games while the session is restored', () => {
        useUser.mockReturnValue({user: null, login: jest.fn(), loading: true});
        const wrapper = render();

        expect(wrapper.find('h1').exists()).toBe(false);
        expect(sectionOrder(wrapper)).toEqual(['games', 'news']);
        wrapper.unmount();
    });

    test('welcomes signed-in visitors back, then games beside their projects, play history and people they follow', () => {
        useUser.mockReturnValue({user: {username: 'alice'}, login: jest.fn(), loading: false});
        const wrapper = render();

        expect(wrapper.find('h1').text()).toBe('Welcome back, alice');
        expect(wrapper.find('a[href="/editor"]').first()
            .text()).toBe('New project');
        expect(sectionOrder(wrapper)).toEqual(['games', 'projects', 'playing', 'following', 'news']);
        expect(wrapper.text()).not.toMatch(/membership|jam|notifications/i);
        wrapper.unmount();
    });

    test('keeps the games loaded when a visitor signs in', () => {
        const login = jest.fn();
        useUser.mockReturnValue({user: null, login, loading: false});
        const wrapper = render();
        expect(global.gamesMounts).toBe(1);

        useUser.mockReturnValue({user: {username: 'alice'}, login, loading: false});
        wrapper.setProps({session: 1});
        wrapper.update();

        expect(sectionOrder(wrapper)).toEqual(['games', 'projects', 'playing', 'following', 'news']);
        expect(global.gamesMounts).toBe(1);
        wrapper.unmount();
    });
});
