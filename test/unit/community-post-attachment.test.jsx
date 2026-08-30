import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import PostAttachment from '../../src/community/components/PostAttachment.jsx';

describe('post attachments', () => {
    test('notifies virtualized lists when media finishes loading', () => {
        const onPreviewChange = jest.fn();
        const wrapper = mount(
            <PostAttachment url="https://chats.mistium.com/attachment/123.png" onPreviewChange={onPreviewChange} />
        );

        onPreviewChange.mockClear();
        wrapper.find('img').simulate('load');

        expect(onPreviewChange).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });

    test('tries video when an extensionless attachment is not an image', () => {
        const wrapper = mount(<PostAttachment url="https://chats.mistium.com/attachment/123" />);

        act(() => {
            wrapper.find('img').simulate('error');
        });
        wrapper.update();

        expect(wrapper.find('video').prop('src')).toBe('https://chats.mistium.com/attachment/123');
        wrapper.unmount();
    });

    test('falls back to an attachment link when media preview fails', () => {
        const wrapper = mount(<PostAttachment url="https://chats.mistium.com/attachment/123" />);

        act(() => {
            wrapper.find('img').simulate('error');
        });
        wrapper.update();
        act(() => {
            wrapper.find('video').simulate('error');
        });
        wrapper.update();

        expect(wrapper.find('a').text()).toBe('Open attachment');
        expect(wrapper.find('a').prop('href')).toBe('https://chats.mistium.com/attachment/123');
        wrapper.unmount();
    });
});
