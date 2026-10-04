import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';

import PostComposer, {localDateTimeValue} from '../../src/community/components/PostComposer.jsx';
import rotur from '../../src/community/rotur.js';

jest.mock('../../src/community/rotur.js', () => ({createPost: jest.fn()}));
jest.mock('../../src/community/components/GifPicker.jsx', () => () => null);

const user = {username: 'me'};
const DRAFT = 'mw-community-draft:post:me:profile';

describe('PostComposer', () => {
    beforeEach(() => {
        sessionStorage.clear();
        rotur.createPost.mockReset();
    });

    test('keeps the draft for the tab and clears it once posted', async () => {
        sessionStorage.setItem(DRAFT, 'From before');
        rotur.createPost.mockResolvedValue({id: 'p1'});
        const onPosted = jest.fn();
        const wrapper = mount(<PostComposer user={user} profileOnly onPosted={onPosted} />);
        expect(wrapper.find('textarea').prop('value')).toBe('From before');

        wrapper.find('textarea').simulate('change', {target: {value: 'Hello there'}});
        expect(sessionStorage.getItem(DRAFT)).toBe('Hello there');

        await act(async () => {
            wrapper.find('form').simulate('submit');
            await Promise.resolve();
        });
        wrapper.update();
        expect(onPosted).toHaveBeenCalledWith({id: 'p1', user: 'me'});
        expect(sessionStorage.getItem(DRAFT)).toBeNull();
        expect(wrapper.find('textarea').prop('value')).toBe('');
        wrapper.unmount();
    });

    test('explains why a poll cannot be posted yet and labels its options', () => {
        const wrapper = mount(<PostComposer user={user} onPosted={() => {}} />);
        wrapper.find('button[title="Add a poll"]').simulate('click');

        expect(wrapper.text()).toContain('Add at least 2 options');
        expect(wrapper.find('input[aria-label="Option 1"]')).toHaveLength(1);
        wrapper.find('input[aria-label="Option 1"]').simulate('change', {target: {value: 'Yes'}});
        wrapper.find('input[aria-label="Option 2"]').simulate('change', {target: {value: 'No'}});
        expect(wrapper.text()).not.toContain('Add at least 2 options');
        wrapper.unmount();
    });

    test('confirms a scheduled post and does not allow past times', async () => {
        rotur.createPost.mockResolvedValue({id: 'p2', scheduled: true});
        const onPosted = jest.fn();
        const wrapper = mount(<PostComposer user={user} onPosted={onPosted} />);
        wrapper.find('textarea').simulate('change', {target: {value: 'Later'}});
        wrapper.find('button[title="Schedule post"]').simulate('click');
        const input = wrapper.find('input[type="datetime-local"]');
        expect(input.prop('min') <= input.prop('value')).toBe(true);
        expect(input.prop('min')).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d$/);

        await act(async () => {
            wrapper.find('form').simulate('submit');
            await Promise.resolve();
        });
        wrapper.update();
        expect(onPosted).not.toHaveBeenCalled();
        expect(wrapper.find('[role="status"]').text()).toContain('Scheduled for');
        wrapper.unmount();
    });

    test('formats times for datetime-local inputs in local time', () => {
        const time = new Date(2026, 0, 2, 3, 4, 59).getTime();
        expect(localDateTimeValue(time)).toBe('2026-01-02T03:04');
    });
});
