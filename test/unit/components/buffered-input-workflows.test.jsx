import React from 'react';
import {shallow} from 'enzyme';
import BufferedInputHOC from '../../../src/components/forms/buffered-input-hoc.jsx';

const PlainInput = props => <input {...props} />;
const BufferedInput = BufferedInputHOC(PlainInput);

describe('buffered input workflows', () => {
    test('reverts a blank numeric edit instead of submitting zero', () => {
        const onSubmit = jest.fn();
        const wrapper = shallow(<BufferedInput value={42} onSubmit={onSubmit} />);

        wrapper.find(PlainInput).simulate('change', {target: {value: ''}});
        wrapper.find(PlainInput).simulate('blur');

        expect(onSubmit).not.toHaveBeenCalled();
        expect(wrapper.find(PlainInput).prop('value')).toBe(42);
    });

    test('still submits an explicit numeric zero', () => {
        const onSubmit = jest.fn();
        const wrapper = shallow(<BufferedInput value={42} onSubmit={onSubmit} />);

        wrapper.find(PlainInput).simulate('change', {target: {value: '0'}});
        wrapper.find(PlainInput).simulate('blur');

        expect(onSubmit).toHaveBeenCalledWith(0);
    });
});
