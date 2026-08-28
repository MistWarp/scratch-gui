import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';

import ActivityCard from '../../src/community/components/ActivityCard.jsx';

describe('community activity timing', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    test('stops updating when a timed activity ends', () => {
        const now = jest.spyOn(Date, 'now').mockReturnValue(1000);
        const intervalSpy = jest.spyOn(global, 'setInterval');
        const clearSpy = jest.spyOn(global, 'clearInterval');
        const wrapper = mount(<ActivityCard activity={{
            title: 'Listening',
            timestamps: {start: 1000, end: 2500}
        }} />);

        const interval = intervalSpy.mock.results[0].value;
        expect(intervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
        now.mockReturnValue(3000);
        act(() => jest.advanceTimersByTime(1000));
        wrapper.update();

        expect(clearSpy).toHaveBeenCalledWith(interval);
        expect(wrapper.text()).toContain('0:01');
        wrapper.unmount();
    });

    test('does not start a timer for an activity that already ended', () => {
        jest.spyOn(Date, 'now').mockReturnValue(3000);
        const intervalSpy = jest.spyOn(global, 'setInterval');
        const wrapper = mount(<ActivityCard activity={{
            title: 'Listening',
            timestamps: {start: 1000, end: 2000}
        }} />);

        expect(intervalSpy).not.toHaveBeenCalled();
        expect(wrapper.text()).toContain('0:01');
        wrapper.unmount();
    });
});
