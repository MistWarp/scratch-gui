import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';
import {useUser} from '../../src/community/UserContext.jsx';
import rotur from '../../src/community/rotur.js';
import Posts from '../../src/community/pages/Posts.jsx';

jest.mock('../../src/community/api.js', () => ({
    __esModule: true,
    projectUrl: project => `/project/${project}`,
    default: {
        checkPostMilestones: jest.fn(() => Promise.resolve()),
        getProject: jest.fn(() => Promise.reject(new Error('none'))),
        loadSession: jest.fn(() => null)
    }
}));
jest.mock('../../src/community/UserContext.jsx', () => ({useUser: jest.fn()}));
jest.mock('../../src/community/rotur.js', () => ({
    forYou: jest.fn(),
    topPosts: jest.fn(),
    searchPosts: jest.fn(),
    pounceAllowance: jest.fn(),
    reportImpressions: jest.fn()
}));
jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

const post = (id, extra = {}) => ({id, user: 'mist', content: `Post ${id}`, timestamp: 1, pounce_count: 0, ...extra});

const render = (path = '/posts') => mount(
    <MemoryRouter
        initialEntries={[path]}
        future={{v7_startTransition: true, v7_relativeSplatPath: true}}
    >
        <Posts />
    </MemoryRouter>
);

const settle = async wrapper => {
    for (let i = 0; i < 5; i++) {
        await act(async () => {
            await Promise.resolve();
        });
    }
    wrapper.update();
};

const texts = wrapper => wrapper.find('article').map(node => node.find('RichText').first()
    .prop('text'));

describe('explore posts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useUser.mockReturnValue({user: {username: 'viewer'}, login: jest.fn()});
        rotur.pounceAllowance.mockResolvedValue({left: 2, daily: 3, resets_at: Date.now() + 1000});
    });

    test('opens on For You and pages through it', async () => {
        rotur.forYou
            .mockResolvedValueOnce({items: [post('a', {reasons: [{type: 'fresh'}]})], next_cursor: 'c1'})
            .mockResolvedValueOnce({items: [post('a'), post('b')], next_cursor: null});
        const wrapper = render();
        await settle(wrapper);
        expect(rotur.forYou).toHaveBeenCalledWith({limit: 20});
        expect(rotur.topPosts).not.toHaveBeenCalled();
        expect(texts(wrapper)).toEqual(['Post a']);
        expect(wrapper.find('button[aria-label="Show posts"]').text()).toBe('For you');
        expect(wrapper.text()).toContain('You have 2 pounces left today.');
        expect(wrapper.find('a[href="https://pounce.rotur.dev/creator"]').exists()).toBe(true);

        await act(async () => {
            wrapper.find('button').filterWhere(node => node.text() === 'Show more posts')
                .simulate('click');
        });
        await settle(wrapper);
        expect(rotur.forYou).toHaveBeenLastCalledWith({cursor: 'c1'});
        expect(texts(wrapper)).toEqual(['Post a', 'Post b']);
        expect(wrapper.find('button').filterWhere(node => node.text() === 'Show more posts')).toHaveLength(0);
        wrapper.unmount();
    });

    test('falls back to popular posts when the API has no For You', async () => {
        rotur.forYou.mockResolvedValue(null);
        rotur.topPosts.mockResolvedValue([post('top')]);
        rotur.pounceAllowance.mockResolvedValue(null);
        useUser.mockReturnValue({user: {username: 'someone-else'}, login: jest.fn()});
        const wrapper = render();
        await settle(wrapper);
        expect(rotur.topPosts).toHaveBeenCalledWith(40, 720);
        expect(texts(wrapper)).toEqual(['Post top']);
        expect(wrapper.find('button[aria-label="Show posts"]').text()).toBe('Popular this month');
        expect(wrapper.find('aside').exists()).toBe(false);
        wrapper.unmount();
    });

    test('a time range shows popular posts', async () => {
        rotur.topPosts.mockResolvedValue([post('week')]);
        const wrapper = render('/posts?period=168');
        await settle(wrapper);
        expect(rotur.forYou).not.toHaveBeenCalled();
        expect(rotur.topPosts).toHaveBeenCalledWith(40, 168);
        expect(wrapper.find('button[aria-label="Show posts"]').text()).toBe('Popular this week');
        wrapper.unmount();
    });
});
