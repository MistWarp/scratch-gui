import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter, Route, Routes} from 'react-router-dom';

import api from '../../src/community/api';
import NewsFeed from '../../src/community/components/NewsFeed.jsx';
import NewsPost from '../../src/community/pages/NewsPost.jsx';

jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {news: jest.fn(), newsItem: jest.fn(), viewNews: jest.fn(() => Promise.resolve()), getSpace: jest.fn()}
}));
jest.mock('../../src/community/project-preview.js', () => ({
    __esModule: true,
    default: jest.fn(() => Promise.resolve({title: 'Rainy day', thumbUrl: 'https://img.test/rainy.png'}))
}));
jest.mock('../../src/community/UserContext.jsx', () => ({useUser: () => ({user: null, login: jest.fn()})}));
jest.mock('../../src/community/page-meta.js', () => jest.fn());
jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

const POSTS = Array.from({length: 12}, (_, index) => ({
    id: `n${index}`,
    title: `Post ${index}`,
    body: index === 1 ? 'Jam time https://mistwarp.org/spaces/sp1' : `Body ${index}`,
    author: 'Mist',
    category: index % 3 === 0 ? 'event' : 'update',
    created: 1000 - index
}));

const flush = async wrapper => {
    for (let i = 0; i < 3; i++) {
        await act(async () => {
            await Promise.resolve();
        });
    }
    wrapper.update();
};

const feed = (url, items = POSTS) => mount(
    <MemoryRouter
        initialEntries={[url]}
        future={{v7_startTransition: true, v7_relativeSplatPath: true}}
    >
        <Routes>
            <Route
                path="/news"
                element={<NewsFeed
                    items={items}
                    onRetry={jest.fn()}
                />}
            />
        </Routes>
    </MemoryRouter>
);

describe('news feed', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        api.getSpace.mockResolvedValue({space: {title: 'MistWarp jam', thumbnailUrl: ''}});
    });

    test('leads with the newest post, then pages through the rest', async () => {
        const wrapper = feed('/news');
        await flush(wrapper);

        expect(wrapper.find('article h2').text()).toBe('Post 0');
        expect(wrapper.find('li h3')).toHaveLength(8);
        expect(wrapper.find('a[href="/spaces/sp1"]').text()).toBe('MistWarp jam');
        wrapper.find('button').filterWhere(button => button.text() === 'Show more (3 left)')
            .simulate('click');
        expect(wrapper.find('li h3')).toHaveLength(11);
        wrapper.unmount();
    });

    test('filters by kind with links, and searches without a lead story', async () => {
        const wrapper = feed('/news?kind=event');
        await flush(wrapper);
        expect(wrapper.find('a[aria-current="page"]').text()).toBe('Events');
        expect(wrapper.find('article h2').text()).toBe('Post 0');
        expect(wrapper.find('li h3').map(node => node.text())).toEqual(['Post 3', 'Post 6', 'Post 9']);
        wrapper.unmount();

        const search = feed('/news?q=jam');
        await flush(search);
        expect(search.find('article')).toHaveLength(0);
        expect(search.find('li h3').map(node => node.text())).toEqual(['Post 1']);
        search.unmount();
    });

    test('says when nothing matches and when there is no news', async () => {
        const wrapper = feed('/news?q=nothing-like-this');
        await flush(wrapper);
        expect(wrapper.text()).toContain('No posts match.');
        wrapper.unmount();

        const empty = feed('/news', []);
        await flush(empty);
        expect(empty.text()).toContain('News from MistWarp will show up here.');
        empty.unmount();
    });
});

describe('news post page', () => {
    const post = id => mount(
        <MemoryRouter
            initialEntries={[`/news/${id}`]}
            future={{v7_startTransition: true, v7_relativeSplatPath: true}}
        >
            <Routes>
                <Route
                    path="/news/:id"
                    element={<NewsPost />}
                />
            </Routes>
        </MemoryRouter>
    );

    beforeEach(() => {
        jest.clearAllMocks();
        api.news.mockResolvedValue({news: POSTS.slice(0, 3)});
    });

    test('renders the post as markdown with links to the posts either side', async () => {
        api.newsItem.mockResolvedValue({item: {
            ...POSTS[1], body: '## Big news\n\nRead **this** and [the docs](https://docs.test)\n\n![Shot](https://img.test/a.png)'
        }});
        const wrapper = post('n1');
        await flush(wrapper);

        expect(wrapper.find('h1').text()).toBe('Post 1');
        expect(wrapper.find('article h3').text()).toBe('Big news');
        expect(wrapper.find('a[href="https://docs.test"]').prop('rel')).toBe('noopener noreferrer');
        expect(wrapper.find('img[alt="Shot"]')).toHaveLength(1);
        expect(wrapper.find('a[href="/news/n2"]').text()).toContain('Post 2');
        expect(wrapper.find('a[href="/news/n0"]').text()).toContain('Post 0');
        expect(api.viewNews).toHaveBeenCalledWith('n1');
        wrapper.unmount();
    });

    test('shows a linked project as the cover when the post has no picture of its own', async () => {
        api.newsItem.mockResolvedValue({item: {...POSTS[2], body: 'Play https://mistwarp.org/p/rainy-day'}});
        const wrapper = post('n2');
        await flush(wrapper);

        expect(wrapper.find('img[src="https://img.test/rainy.png"]')).toHaveLength(1);
        expect(wrapper.find('a[href="/news/n1"]').text()).toContain('Post 1');
        expect(wrapper.find('a[href="/news/n3"]')).toHaveLength(0);
        wrapper.unmount();
    });

    test('offers a retry when the post fails to load', async () => {
        api.newsItem.mockRejectedValueOnce(new Error('Post not found'));
        const wrapper = post('missing');
        await flush(wrapper);
        expect(wrapper.text()).toContain('Post not found');
        expect(wrapper.find('button').filterWhere(button => button.text() === 'Try again')).toHaveLength(1);
        wrapper.unmount();
    });
});
