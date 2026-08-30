import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import api from '../../src/community/api.js';
import News from '../../src/community/pages/News.jsx';

jest.mock('../../src/community/UserContext.jsx', () => ({
    useUser: () => ({user: {username: 'Sophie', isAdmin: true}})
}));
jest.mock('../../src/community/api.js', () => ({
    __esModule: true,
    default: {
        news: jest.fn(() => Promise.resolve({news: []})),
        postNews: jest.fn(),
        updateNews: jest.fn()
    }
}));

describe('news composer actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        api.news.mockResolvedValue({news: []});
        window.scrollTo = jest.fn();
    });

    test('locks rapid duplicate submissions', async () => {
        let finishPost;
        api.postNews.mockReturnValue(new Promise(resolve => {
            finishPost = resolve;
        }));
        let wrapper;
        await act(async () => {
            wrapper = mount(<MemoryRouter><News manager /></MemoryRouter>);
            await Promise.resolve();
        });
        wrapper.update();
        wrapper.find('button').filterWhere(button => button.text().includes('New post')).simulate('click');
        wrapper.find('input[placeholder="Update title"]').simulate('change', {target: {value: 'Release'}});
        wrapper.find('textarea[placeholder="Write in Markdown…"]').simulate('change', {target: {value: 'Details'}});
        const submit = wrapper.find('form').prop('onSubmit');
        const event = {preventDefault: jest.fn()};

        let first;
        act(() => {
            first = submit(event);
            submit(event);
        });
        expect(api.postNews).toHaveBeenCalledTimes(1);

        await act(async () => {
            finishPost();
            await first;
        });
        wrapper.unmount();
    });

    test('loads an existing post into the composer and saves it', async () => {
        const item = {
            id: 'post-1',
            title: 'Old title',
            body: 'Old body',
            category: 'release',
            created: Date.now()
        };
        api.news.mockResolvedValueOnce({news: [item]});
        api.updateNews.mockResolvedValue({});
        let wrapper;
        await act(async () => {
            wrapper = mount(<MemoryRouter><News manager /></MemoryRouter>);
            await Promise.resolve();
        });
        wrapper.update();

        wrapper.find('button[aria-label="Edit Old title"]').simulate('click');
        wrapper.find('input[placeholder="Update title"]').simulate('change', {
            target: {value: 'New title'}
        });
        wrapper.find('textarea[placeholder="Write in Markdown…"]').simulate('change', {
            target: {value: '# New body'}
        });
        await act(async () => {
            await wrapper.find('form').prop('onSubmit')({preventDefault: jest.fn()});
        });

        expect(api.updateNews).toHaveBeenCalledWith('post-1', expect.objectContaining({
            title: 'New title',
            body: '# New body',
            category: 'release'
        }));
        wrapper.unmount();
    });
});
