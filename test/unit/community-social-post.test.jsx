import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';
import SocialPost from '../../src/community/components/SocialPost.jsx';
import {useUser} from '../../src/community/UserContext.jsx';
import rotur from '../../src/community/rotur.js';

jest.mock('../../src/community/api.js', () => ({
    __esModule: true,
    projectUrl: project => `/project/${typeof project === 'object' ? project.id : project}`,
    default: {
        checkPostMilestones: jest.fn(() => Promise.resolve()),
        getProject: jest.fn(id => Promise.resolve({project: {
            id, title: `Game ${id}`, owner: 'alice', loveCount: 3, views: 12
        }}))
    }
}));

jest.mock('../../src/community/UserContext.jsx', () => ({useUser: jest.fn()}));
jest.mock('../../src/community/rotur.js', () => ({
    likePost: jest.fn(),
    unlikePost: jest.fn()
}));
jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

describe('social post list actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useUser.mockReturnValue({user: {username: 'viewer'}, login: jest.fn()});
        rotur.likePost.mockResolvedValue({});
    });

    test('likes a post without leaving the list', async () => {
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <SocialPost initialPost={{id: 'post-1', user: 'alice', content: 'Hello', likes: []}} />
            </MemoryRouter>
        );

        await act(async () => {
            wrapper.find('button[aria-label="Like post"]').simulate('click');
            await Promise.resolve();
        });
        wrapper.update();

        expect(rotur.likePost).toHaveBeenCalledWith('post-1');
        expect(wrapper.find('button[aria-label="Unlike post"]').text()).toContain('1');
        wrapper.unmount();
    });

    test('shows a card for the MistWarp project a post links to', async () => {
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <SocialPost
                    initialPost={{
                        id: 'post-2',
                        user: 'alice',
                        content: 'Play my game https://mistwarp.org/project/abc123!',
                        likes: []
                    }}
                />
            </MemoryRouter>
        );
        await act(async () => {
            await Promise.resolve();
        });
        wrapper.update();
        const card = wrapper.find('PostProjectCard').find('a');
        expect(card.prop('href')).toBe('/project/abc123');
        expect(card.text()).toContain('Game abc123');
        expect(card.text()).toContain('by alice');
        expect(card.text()).toContain('3 loves');
        wrapper.unmount();
    });

    test('prefers the made_with project the API returns', async () => {
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <SocialPost
                    initialPost={{
                        id: 'post-3',
                        user: 'alice',
                        content: 'New update',
                        made_with: {app: 'MistWarp', kind: 'project', ref: 'p77', url: 'https://mistwarp.org/project/p77'}
                    }}
                />
            </MemoryRouter>
        );
        await act(async () => {
            await Promise.resolve();
        });
        wrapper.update();
        expect(wrapper.find('PostProjectCard').find('a')
            .prop('href')).toBe('/project/p77');
        wrapper.unmount();
    });
});
