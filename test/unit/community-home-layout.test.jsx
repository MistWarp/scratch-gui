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
jest.mock('../../src/community/rotur', () => ({following: jest.fn(() => new Promise(() => {}))}));
jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {},
    editorUrl: () => '/editor',
    projectUrl: id => `/project/${id}`
}));
jest.mock('../../src/community/analytics.js', () => ({track: jest.fn()}));
jest.mock('../../src/community/components/ScratchImport.jsx', () => () => <form data-section="import" />);
jest.mock('../../src/community/components/HomeDiscovery.jsx', () => {
    const mockReact = jest.requireActual('react');
    return {
        FeaturedGames: () => {
            mockReact.useEffect(() => {
                global.featuredMounts += 1;
            }, []);
            return <div data-section="games" />;
        },
        SuggestedCreators: () => <div data-section="creators" />
    };
});
jest.mock('../../src/community/components/HomeWorkspace.jsx', () => {
    const actual = jest.requireActual('../../src/community/components/HomeWorkspace.jsx');
    const mockReact = jest.requireActual('react');
    return {
        ...actual,
        ContinueProjects: ({onProjectCount, username, welcome}) => {
            mockReact.useEffect(() => {
                onProjectCount({username, total: global.projectTotal});
            }, [onProjectCount, username]);
            return <div data-section={welcome ? 'welcome' : 'continue'} />;
        },
        DeviceBackup: () => null
    };
});
jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

const SECTIONS = '[data-section], #starters, [aria-labelledby="home-following-games-heading"], ' +
    '[aria-labelledby="home-friends-heading"], [aria-labelledby="home-notifications-heading"]';
const NAMES = {
    'starters': 'starters',
    'home-following-games-heading': 'following-games',
    'home-friends-heading': 'friends',
    'home-notifications-heading': 'notifications'
};

const sectionOrder = wrapper => Array.from(wrapper.getDOMNode().querySelectorAll(SECTIONS))
    .map(node => node.getAttribute('data-section') || NAMES[node.id] || NAMES[node.getAttribute('aria-labelledby')]);

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
        global.projectTotal = 10;
        global.featuredMounts = 0;
    });

    test('tells signed-out visitors what MistWarp is, then shows games and starters without jams', () => {
        const login = jest.fn();
        useUser.mockReturnValue({user: null, login, loading: false});
        const wrapper = render();

        expect(wrapper.find('h1').text()).toBe('Make games with blocks, and play what others make');
        expect(wrapper.find('a[href="/editor"]').first()
            .text()).toBe('Start creating');
        expect(sectionOrder(wrapper)).toEqual(['games', 'starters', 'import']);
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
        expect(sectionOrder(wrapper)).toEqual(['games']);
        wrapper.unmount();
    });

    test('puts the workspace first for signed-in creators, then games from follows, featured games, and activity', () => {
        useUser.mockReturnValue({user: {username: 'alice'}, login: jest.fn(), loading: false});
        const wrapper = render();

        expect(wrapper.find('h1').exists()).toBe(false);
        expect(sectionOrder(wrapper)).toEqual([
            'continue', 'following-games', 'games', 'friends', 'notifications'
        ]);
        expect(wrapper.text()).not.toMatch(/membership|jam/i);
        wrapper.unmount();
    });

    test('welcomes new creators and offers starters when they have few projects', () => {
        global.projectTotal = 1;
        useUser.mockReturnValue({user: {username: 'alice', isNew: true}, login: jest.fn(), loading: false});
        const wrapper = render();
        wrapper.update();

        expect(sectionOrder(wrapper)).toEqual([
            'welcome', 'starters', 'following-games', 'games', 'friends', 'notifications'
        ]);
        wrapper.unmount();
    });

    test('keeps the games loaded when a visitor signs in', () => {
        const login = jest.fn();
        useUser.mockReturnValue({user: null, login, loading: false});
        const wrapper = render();
        expect(global.featuredMounts).toBe(1);

        useUser.mockReturnValue({user: {username: 'alice'}, login, loading: false});
        wrapper.setProps({session: 1});
        wrapper.update();

        expect(sectionOrder(wrapper)).toEqual([
            'continue', 'following-games', 'games', 'friends', 'notifications'
        ]);
        expect(global.featuredMounts).toBe(1);
        wrapper.unmount();
    });
});
