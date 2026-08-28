import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';

import api from '../../src/community/api.js';
import News from '../../src/community/pages/News.jsx';

jest.mock('../../src/community/UserContext.jsx', () => ({
    useUser: () => ({user: {username: 'Sophie', isAdmin: true}})
}));
jest.mock('../../src/community/api.js', () => ({
    __esModule: true,
    default: {
        news: jest.fn(() => Promise.resolve({news: []})),
        postNews: jest.fn()
    }
}));

describe('news composer actions', () => {
    test('locks rapid duplicate submissions', async () => {
        let finishPost;
        api.postNews.mockReturnValue(new Promise(resolve => {
            finishPost = resolve;
        }));
        let wrapper;
        await act(async () => {
            wrapper = mount(<News />);
            await Promise.resolve();
        });
        wrapper.update();
        wrapper.find('input[placeholder="Update title"]').simulate('change', {target: {value: 'Release'}});
        wrapper.find('textarea[placeholder="What changed?"]').simulate('change', {target: {value: 'Details'}});
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
});
