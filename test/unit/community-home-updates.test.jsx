import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import api from '../../src/community/api';
import {useUser} from '../../src/community/UserContext.jsx';
import CommunityUpdates from '../../src/community/components/HomeCommunity.jsx';

jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {news: jest.fn(), roadmap: jest.fn(), voteIdea: jest.fn(), getSpace: jest.fn()}
}));
jest.mock('../../src/community/project-preview.js', () => ({__esModule: true, default: jest.fn(() => Promise.resolve(null))}));
jest.mock('../../src/community/UserContext.jsx', () => ({useUser: jest.fn()}));
jest.mock('../../src/community/analytics.js', () => ({track: jest.fn()}));
jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

const flush = async wrapper => {
    for (let i = 0; i < 3; i++) {
        await act(async () => {
            await Promise.resolve();
        });
    }
    wrapper.update();
};

const render = () => mount(
    <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
        <CommunityUpdates />
    </MemoryRouter>
);

const IDEAS = [
    {_id: 'low', title: 'Low', status: 'open', score: 1, myVote: ''},
    {_id: 'done', title: 'Done', status: 'shipped', score: 9},
    {_id: 'next', title: 'Next', status: 'planned', score: 6},
    {_id: 'now', title: 'Now', status: 'building', score: 2},
    {_id: 'high', title: 'High', status: 'open', score: 5, myVote: ''}
];

describe('home news and roadmap', () => {
    let login;
    beforeEach(() => {
        jest.clearAllMocks();
        login = jest.fn(() => Promise.resolve());
        useUser.mockReturnValue({user: {username: 'viewer'}, loginOrThrow: login});
        api.news.mockResolvedValue({news: []});
        api.roadmap.mockResolvedValue({ideas: IDEAS});
        api.getSpace.mockResolvedValue({space: {title: 'MistWarp jam', thumbnailUrl: ''}});
    });

    test('leads with the newest post and names the places it links to', async () => {
        api.news.mockResolvedValue({news: [
            {id: 'n1', title: 'Jam', body: 'The theme is **rainy**\n\nhttps://mistwarp.org/spaces/sp1', author: 'Mist', created: 2},
            {id: 'n0', title: 'Old', body: 'old', archived: true, created: 1},
            {id: 'n2', title: 'Storage', body: 'More space', author: 'Mist', created: 1}
        ]});
        const wrapper = render();
        await flush(wrapper);

        const news = wrapper.find('section[aria-labelledby="home-news-heading"]');
        expect(news.find('h3').map(node => node.text())).toEqual(['Jam', 'Storage']);
        expect(news.find('article').text()).toContain('The theme is rainy. MistWarp jam');
        expect(news.find('a[href="/spaces/sp1"]').text()).toBe('MistWarp jam');
        expect(news.text()).not.toContain('https://');
        wrapper.unmount();
    });

    test('puts work in progress first, then the most wanted ideas', async () => {
        const wrapper = render();
        await flush(wrapper);

        const titles = wrapper.find('section[aria-labelledby="home-roadmap-heading"] li h3').map(node => node.text());
        expect(titles).toEqual(['Now', 'Next', 'High', 'Low']);
        expect(wrapper.text()).toContain('In progress');
        expect(wrapper.text()).not.toContain('Done');
        wrapper.unmount();
    });

    test('upvotes at once and takes it back if saving fails', async () => {
        let reject;
        api.voteIdea.mockReturnValue(new Promise((resolve, fail) => {
            reject = fail;
        }));
        const wrapper = render();
        await flush(wrapper);
        const button = () => wrapper.find('button[aria-label="Upvote High"]');

        await act(async () => {
            button().simulate('click');
        });
        wrapper.update();
        expect(api.voteIdea).toHaveBeenCalledWith('high', 'like');
        expect(button().prop('aria-pressed')).toBe(true);
        expect(button().text()).toBe('6');

        await act(async () => {
            reject(new Error('offline'));
        });
        await flush(wrapper);
        expect(button().prop('aria-pressed')).toBe(false);
        expect(button().text()).toBe('5');
        expect(wrapper.text()).toContain('Could not save your vote.');
        wrapper.unmount();
    });

    test('asks signed-out visitors to sign in before voting', async () => {
        useUser.mockReturnValue({user: null, loginOrThrow: login});
        const wrapper = render();
        await flush(wrapper);

        await act(async () => {
            wrapper.find('button[aria-label="Upvote High"]').simulate('click');
        });
        expect(login).toHaveBeenCalled();
        expect(api.voteIdea).not.toHaveBeenCalled();
        wrapper.unmount();
    });

    test('retries each list on its own when it fails', async () => {
        api.news.mockRejectedValueOnce(new Error('offline'));
        const wrapper = render();
        await flush(wrapper);
        expect(wrapper.text()).toContain("Couldn't load news.");

        wrapper.find('button').filterWhere(button => button.text() === 'Try again')
            .simulate('click');
        await flush(wrapper);
        expect(wrapper.text()).toContain('News from MistWarp will show up here.');
        expect(api.roadmap).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });
});
