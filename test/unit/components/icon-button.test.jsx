import React from 'react';
import {shallow} from 'enzyme';
import IconButton from '../../../src/components/icon-button/icon-button';
import renderer from 'react-test-renderer';
import {Provider} from 'react-redux';
import {defaultStore} from '../../helpers/intl-helpers.jsx';

describe('IconButtonComponent', () => {
    test('matches snapshot', () => {
        const onClick = jest.fn();
        const title = <div>Text</div>;
        const imgSrc = 'imgSrc';
        const className = 'custom-class-name';
        const component = renderer.create(
            <Provider store={defaultStore}><IconButton
                className={className}
                img={imgSrc}
                title={title}
                onClick={onClick}
            /></Provider>
        );
        expect(component.toJSON()).toMatchSnapshot();
    });

    test('triggers callback when clicked', () => {
        const onClick = jest.fn();
        const title = <div>Text</div>;
        const imgSrc = 'imgSrc';
        const componentShallowWrapper = shallow(
            <IconButton
                img={imgSrc}
                title={title}
                onClick={onClick}
            />
        );
        componentShallowWrapper.simulate('click');
        expect(onClick).toHaveBeenCalled();
    });
});
