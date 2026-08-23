import React from 'react';
import {shallow} from 'enzyme';

import {FontListItem} from '../../../src/components/mw-fonts-window/mw-fonts-window.jsx';

describe('font list item controls', () => {
    test('uses a native button for choosing a font', () => {
        const onClick = jest.fn();
        const wrapper = shallow(<FontListItem family="Inter" onClick={onClick} />);

        expect(wrapper.type()).toBe('button');
        expect(wrapper.prop('type')).toBe('button');
        wrapper.simulate('click');
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
