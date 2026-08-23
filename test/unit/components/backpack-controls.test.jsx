import React from 'react';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';

import Backpack from '../../../src/components/backpack/backpack.jsx';

describe('backpack controls', () => {
    test('uses a button with expanded state when the backpack can be toggled', () => {
        const onToggle = jest.fn();
        const wrapper = mountWithIntl(
            <Backpack
                error={false}
                onToggle={onToggle}
            />
        );
        const toggle = wrapper.find('button[aria-expanded=false]');

        expect(toggle.prop('type')).toBe('button');
        toggle.simulate('click');
        expect(onToggle).toHaveBeenCalledTimes(1);
    });
});
