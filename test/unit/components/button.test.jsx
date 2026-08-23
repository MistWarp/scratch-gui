import React from 'react';
import {shallow} from 'enzyme';
import ButtonComponent from '../../../src/components/button/button';
import renderer from 'react-test-renderer';
import {Provider} from 'react-redux';
import {defaultStore} from '../../helpers/intl-helpers.jsx';

describe('ButtonComponent', () => {
    test('matches snapshot', () => {
        const onClick = jest.fn();
        const component = renderer.create(
            <Provider store={defaultStore}><ButtonComponent onClick={onClick} /></Provider>
        );
        expect(component.toJSON()).toMatchSnapshot();
    });

    test('triggers callback when clicked', () => {
        const onClick = jest.fn();
        const componentShallowWrapper = shallow(
            <ButtonComponent onClick={onClick} />
        );
        componentShallowWrapper.simulate('click');
        expect(onClick).toHaveBeenCalled();
    });

    test('uses a non-submitting native button by default', () => {
        const component = shallow(<ButtonComponent />);

        expect(component.type()).toBe('button');
        expect(component.prop('type')).toBe('button');
    });

    test('passes disabled state to the native button', () => {
        const component = shallow(<ButtonComponent disabled />);

        expect(component.prop('disabled')).toBe(true);
    });

    test('renders links without nesting another interactive control', () => {
        const component = shallow(<ButtonComponent href="https://example.com">Open</ButtonComponent>);

        expect(component.type()).toBe('a');
        expect(component.prop('href')).toBe('https://example.com');
        expect(component.find('button')).toHaveLength(0);
    });
});
