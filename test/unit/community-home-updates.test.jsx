import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import api from '../../src/community/api';
import CommunityUpdates from '../../src/community/components/HomeCommunity.jsx';

jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {news: jest.fn(), roadmap: jest.fn()}
}));
jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

const flush = async wrapper => {
    await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
    });
    wrapper.update();
};

const render = () => mount(
    <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
        <CommunityUpdates />
    </MemoryRouter>
);

describe('home news and roadmap', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('lists the latest news as plain text and the top open suggestions', async () => {
        api.news.mockResolvedValue({news: [
            {id: 'n1', title: 'Archived', body: 'old', archived: true, created: 1},
            {id: 'n2', title: 'Storage', body: '**More** space, see [the post](https://x.test)', author: 'Mist', created: 2}
        ]});
        api.roadmap.mockResolvedValue({ideas: [
            {_id: 'a', title: 'Low', status: 'open', score: 1},
            {_id: 'b', title: 'Done', status: 'shipped', score: 9},
            {_id: 'c', title: 'High', status: 'planned', score: 6}
        ]});
        const wrapper = render();
        await flush(wrapper);

        expect(wrapper.find('h3').map(node => node.text())).toEqual(['Storage', 'High', 'Low']);
        expect(wrapper.text()).toContain('More space, see the post');
        expect(wrapper.find('a[href="/news/n2"]')).toHaveLength(1);
        expect(wrapper.find('a[href="/roadmap#idea-c"]')).toHaveLength(1);
        wrapper.unmount();
    });

    test('retries each list on its own when it fails', async () => {
        api.news.mockRejectedValueOnce(new Error('offline')).mockResolvedValue({news: []});
        api.roadmap.mockResolvedValue({ideas: []});
        const wrapper = render();
        await flush(wrapper);
        expect(wrapper.text()).toContain("Couldn't load news.");
        expect(wrapper.text()).toContain('No active suggestions');

        wrapper.find('button').filterWhere(button => button.text() === 'Try again')
            .simulate('click');
        await flush(wrapper);
        expect(wrapper.text()).toContain('News from MistWarp will show up here.');
        expect(api.roadmap).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });
});
