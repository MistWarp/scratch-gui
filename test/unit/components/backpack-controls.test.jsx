import React from 'react';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';

import Backpack from '../../../src/components/backpack/backpack.jsx';

describe('backpack controls', () => {
    test('the drawer handle is a button with expanded state', () => {
        const onToggle = jest.fn();
        const wrapper = mountWithIntl(
            <Backpack
                error={false}
                layout="drawer"
                onToggle={onToggle}
            />
        );
        const toggle = wrapper.find('button[aria-expanded=false]');

        expect(toggle.prop('type')).toBe('button');
        toggle.simulate('click');
        expect(onToggle).toHaveBeenCalledTimes(1);
    });

    test('the strip header is a button with expanded state', () => {
        const onToggle = jest.fn();
        const wrapper = mountWithIntl(
            <Backpack
                error={false}
                layout="strip"
                onToggle={onToggle}
            />
        );
        const toggle = wrapper.find('button[aria-expanded=false]');

        expect(toggle.prop('type')).toBe('button');
        toggle.simulate('click');
        expect(onToggle).toHaveBeenCalledTimes(1);
    });
});
