import React from 'react';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';

import SpriteInfo from '../../../src/components/sprite-info/sprite-info.jsx';
import DirectionPicker from '../../../src/containers/direction-picker.jsx';
import ToggleButtons from '../../../src/components/toggle-buttons/toggle-buttons.jsx';
import {STAGE_DISPLAY_SIZES} from '../../../src/lib/constants/layout-constants.js';

describe('SpriteInfo', () => {
    const mount = overrides => {
        const props = {
            direction: 90,
            disabled: false,
            name: 'Cat',
            rotationStyle: 'all around',
            size: 100,
            stageSize: STAGE_DISPLAY_SIZES.small,
            visible: true,
            x: 10,
            y: 20,
            onChangeDirection: jest.fn(),
            onChangeName: jest.fn(),
            onChangeRotationStyle: jest.fn(),
            onChangeSize: jest.fn(),
            onChangeX: jest.fn(),
            onChangeY: jest.fn(),
            onClickNotVisible: jest.fn(),
            onClickVisible: jest.fn(),
            ...overrides
        };
        return {props, wrapper: mountWithIntl(<SpriteInfo {...props} />)};
    };
    const values = wrapper => wrapper.find('input').map(input => input.prop('value'));

    test('the small layout has every sprite control', () => {
        const {props, wrapper} = mount();
        expect(values(wrapper)).toEqual(['Cat', 10, 20, 100, 90]);
        expect(wrapper.find(ToggleButtons).exists()).toBe(true);
        wrapper.find('button[aria-label="Hide sprite"]').simulate('click');
        expect(props.onClickNotVisible).toHaveBeenCalledTimes(1);
        wrapper.find('button[aria-label="Show sprite"]').simulate('click');
        expect(props.onClickVisible).toHaveBeenCalledTimes(1);
    });

    test('the small layout submits a new size', () => {
        const {props, wrapper} = mount();
        const size = wrapper.find('input').at(3);
        size.simulate('change', {target: {value: '150'}});
        size.simulate('keypress', {key: 'Enter'});
        expect(props.onChangeSize).toHaveBeenCalledWith(150);
    });

    test('the large layout has the same controls', () => {
        const {wrapper} = mount({stageSize: STAGE_DISPLAY_SIZES.large});
        expect(values(wrapper)).toEqual(['Cat', 10, 20, 100, 90]);
        expect(wrapper.find(ToggleButtons).exists()).toBe(true);
    });

    test('with no sprite selected the fields are empty and the dial still gets a real direction', () => {
        for (const stageSize of [STAGE_DISPLAY_SIZES.small, STAGE_DISPLAY_SIZES.large]) {
            const {wrapper} = mount({
                direction: undefined, // eslint-disable-line no-undefined
                disabled: true,
                name: undefined, // eslint-disable-line no-undefined
                size: undefined, // eslint-disable-line no-undefined
                stageSize,
                x: undefined, // eslint-disable-line no-undefined
                y: undefined // eslint-disable-line no-undefined
            });
            expect(values(wrapper)).toEqual(['', '', '', '', '']);
            expect(wrapper.find('input').everyWhere(input => input.prop('disabled'))).toBe(true);
            expect(wrapper.find(DirectionPicker).prop('direction')).toBe(90);
        }
    });
});
