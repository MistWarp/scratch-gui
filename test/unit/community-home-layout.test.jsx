import React from 'react';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import {useUser} from '../../src/community/UserContext.jsx';
import api from '../../src/community/api';
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
jest.mock('../../src/community/components/ScratchImport.jsx', () => () => <form data-section="import" />);
jest.mock('../../src/community/components/HomeWorkspace.jsx', () => {
    const actual = jest.requireActual('../../src/community/components/HomeWorkspace.jsx');
    const mockReact = jest.requireActual('react');
    return {
        ...actual,
        ActiveChallenge: () => <div data-section="challenge" />,
        ChallengeWinner: () => <div data-section="winner" />,
        ContinueProjects: ({onProjectCount, username}) => {
            mockReact.useEffect(() => {
                onProjectCount({username, total: global.projectTotal});
            }, [onProjectCount, username]);
            return <div data-section="continue" />;
        },
        DeviceBackup: () => null
    };
});
jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

const SECTIONS = '[data-section], #starters, [id="home-projects-panel-trending"], [id="home-community-panel-news"]';
const NAMES = {'starters': 'starters', 'home-projects-panel-trending': 'projects', 'home-community-panel-news': 'community'};

const sectionOrder = wrapper => Array.from(wrapper.getDOMNode().querySelectorAll(SECTIONS))
    .map(node => node.getAttribute('data-section') || NAMES[node.id]);

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
    });

    test('leads signed-out visitors with community projects and keeps starters last', () => {
        const login = jest.fn();
        useUser.mockReturnValue({user: null, login, loading: false});
        const wrapper = render();

        expect(wrapper.find('h1').text()).toBe('See what people are making on MistWarp');
        expect(sectionOrder(wrapper)).toEqual([
            'discovery', 'projects', 'winner', 'challenge', 'community', 'starters', 'import'
        ]);
        expect(wrapper.getDOMNode().querySelector('#starters [data-section="import"]')).not.toBeNull();

        wrapper.find('button')
            .filterWhere(button => button.text() === 'Sign in')
            .simulate('click');
        expect(login).toHaveBeenCalled();
        wrapper.unmount();
    });

    test('shows community content while the session is restored', () => {
        useUser.mockReturnValue({user: null, login: jest.fn(), loading: true});
        const wrapper = render();

        expect(wrapper.text()).toContain('Loading your workspace');
        expect(wrapper.find('h1').exists()).toBe(false);
        expect(sectionOrder(wrapper)).toEqual(['discovery', 'winner', 'challenge', 'projects', 'community']);
        wrapper.unmount();
    });

    test('keeps the workspace first for signed-in creators', () => {
        useUser.mockReturnValue({user: {username: 'alice'}, login: jest.fn(), loading: false});
        const wrapper = render();

        expect(wrapper.find('h1').exists()).toBe(false);
        expect(sectionOrder(wrapper)).toEqual(['continue', 'discovery', 'winner', 'challenge', 'projects', 'community']);
        wrapper.unmount();
    });

    test('offers starters and a welcome to new creators with few projects', () => {
        global.projectTotal = 1;
        useUser.mockReturnValue({user: {username: 'alice', isNew: true}, login: jest.fn(), loading: false});
        const wrapper = render();
        wrapper.update();

        expect(wrapper.text()).toContain('Welcome to MistWarp, alice');
        expect(sectionOrder(wrapper)).toEqual([
            'continue', 'starters', 'discovery', 'winner', 'challenge', 'projects', 'community'
        ]);
        wrapper.unmount();
    });

    test('keeps the project feeds loaded when a visitor signs in', () => {
        const login = jest.fn();
        useUser.mockReturnValue({user: null, login, loading: false});
        const wrapper = render();
        expect(api.explore).toHaveBeenCalledTimes(1);

        useUser.mockReturnValue({user: {username: 'alice'}, login, loading: false});
        wrapper.setProps({session: 1});
        wrapper.update();

        expect(sectionOrder(wrapper)).toEqual(['continue', 'discovery', 'winner', 'challenge', 'projects', 'community']);
        expect(api.explore).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });
});
