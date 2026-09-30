import React from 'react';
import {LibraryItem} from '../../../src/containers/library-item.jsx';
import {shallowWithIntl} from '../../helpers/intl-helpers.jsx';

describe('library item keyboard controls', () => {
    const getProps = overrides => ({
        id: 12,
        onMouseEnter: jest.fn(),
        onMouseLeave: jest.fn(),
        onSelect: jest.fn(),
        ...overrides
    });

    test('selects an enabled item with Enter', () => {
        const props = getProps();
        const wrapper = shallowWithIntl(<LibraryItem {...props} />);
        const preventDefault = jest.fn();

        wrapper.instance().handleKeyDown({
            key: 'Enter',
            preventDefault,
            target: document.body,
            currentTarget: document.body
        });

        expect(props.onSelect).toHaveBeenCalledWith(12);
        expect(preventDefault).toHaveBeenCalled();
    });

    test('does not select a disabled item with Space', () => {
        const props = getProps({disabled: true});
        const wrapper = shallowWithIntl(<LibraryItem {...props} />);

        wrapper.instance().handleKeyDown({
            key: ' ',
            preventDefault: jest.fn(),
            target: document.body,
            currentTarget: document.body
        });

        expect(props.onSelect).not.toHaveBeenCalled();
    });

    test('leaves keys on the play and favorite buttons to those buttons', () => {
        const props = getProps();
        const wrapper = shallowWithIntl(<LibraryItem {...props} />);
        const preventDefault = jest.fn();
        const button = document.createElement('button');

        wrapper.instance().handleKeyDown({key: 'Enter', preventDefault, target: button, currentTarget: document.body});

        expect(props.onSelect).not.toHaveBeenCalled();
        expect(preventDefault).not.toHaveBeenCalled();
    });
});
