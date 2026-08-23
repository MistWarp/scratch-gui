import React from 'react';
import {shallow} from 'enzyme';

import Filter from '../../../src/components/filter/filter.jsx';

describe('library search filter', () => {
    test('uses a disabled clear button until there is a query', () => {
        const onClear = jest.fn();
        const wrapper = shallow(
            <Filter
                filterQuery=""
                onChange={() => {}}
                onClear={onClear}
            />
        );
        const clear = wrapper.find('button[aria-label="Clear search"]');

        expect(clear.prop('type')).toBe('button');
        expect(clear.prop('disabled')).toBe(true);

        wrapper.setProps({filterQuery: 'cat'});
        wrapper.find('button[aria-label="Clear search"]').simulate('click');
        expect(onClear).toHaveBeenCalledTimes(1);
    });
});
