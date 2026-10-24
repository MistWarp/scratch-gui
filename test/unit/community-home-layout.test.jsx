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
        GameShelf: () => <div data-section="new" />,
        SuggestedCreators: () => <div data-section="creators" />
    };
});
jest.mock('../../src/community/components/HomeCommunity.jsx', () => () => <div data-section="updates" />);
jest.mock('../../src/community/components/HomeWorkspace.jsx', () => {
    const actual = jest.requireActual('../../src/community/components/HomeWorkspace.jsx');
    return {
        ...actual,
        ContinueProjects: () => <div data-section="continue" />,
        ContinuePlaying: () => <div data-section="playing" />,
        DeviceBackup: () => null
    };
});
jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

const SECTIONS = '[data-section], #starters, [aria-labelledby="home-following-heading"]';
const NAMES = {
    'starters': 'starters',
    'home-following-heading': 'following'
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
        global.featuredMounts = 0;
    });

    test('tells signed-out visitors what MistWarp is, then games, news, creators and starters', () => {
        const login = jest.fn();
        useUser.mockReturnValue({user: null, login, loading: false});
        const wrapper = render();

        expect(wrapper.find('h1').text()).toBe('Make games with blocks, and play what others make');
        expect(wrapper.find('a[href="/editor"]').first()
            .text()).toBe('Start creating');
        expect(sectionOrder(wrapper)).toEqual(['games', 'new', 'updates', 'creators', 'starters', 'import']);
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
        expect(sectionOrder(wrapper)).toEqual(['games', 'new', 'updates']);
        wrapper.unmount();
    });

    test('leads signed-in visitors with people they follow, then games, their projects and news', () => {
        useUser.mockReturnValue({user: {username: 'alice'}, login: jest.fn(), loading: false});
        const wrapper = render();

        expect(wrapper.find('h1').exists()).toBe(false);
        expect(sectionOrder(wrapper)).toEqual(['following', 'games', 'continue', 'playing', 'new', 'updates']);
        expect(wrapper.text()).not.toMatch(/membership|jam|notifications/i);
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

        expect(sectionOrder(wrapper)).toEqual(['following', 'games', 'continue', 'playing', 'new', 'updates']);
        expect(global.featuredMounts).toBe(1);
        wrapper.unmount();
    });
});
