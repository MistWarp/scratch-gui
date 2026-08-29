import React from 'react';
import {mount} from 'enzyme';
import {act} from 'react-dom/test-utils';

import SelectMenu from '../../../src/community/components/ui/SelectMenu.jsx';
import {
    CreatePanel,
    ListEditor
} from '../../../src/components/variable-manager/variable-manager.jsx';

const intl = {
    formatMessage: (message, values) => {
        if (!values) return message.defaultMessage;
        return Object.keys(values).reduce(
            (text, key) => text.replace(`{${key}}`, values[key]),
            message.defaultMessage
        );
    }
};

describe('native Variable Manager workflows', () => {
    test('creates a local list from the native creation form', () => {
        const onCreate = jest.fn();
        const wrapper = mount(
            <CreatePanel
                canCreateCloud
                hasLocalTarget
                intl={intl}
                onCancel={jest.fn()}
                onCreate={onCreate}
            />
        );

        expect(wrapper.find('select')).toHaveLength(0);
        expect(wrapper.find(SelectMenu)).toHaveLength(2);

        wrapper.find('input').at(0).simulate('change', {target: {value: 'inventory'}});
        act(() => wrapper.find(SelectMenu).at(0).prop('onChange')('list'));
        wrapper.update();
        wrapper.find('form').simulate('submit', {preventDefault: jest.fn()});

        expect(onCreate).toHaveBeenCalledWith({
            name: 'inventory',
            type: 'list',
            scope: 'local',
            cloud: false
        });
    });

    test('adds and removes list items without flattening the list into text', () => {
        const onChange = jest.fn();
        const wrapper = mount(
            <ListEditor
                intl={intl}
                maxLength={1000}
                record={{id: 'list', name: 'items', value: ['first']}}
                onChange={onChange}
            />
        );

        wrapper.find('button').filterWhere(node => node.text().includes('Add item')).simulate('click');
        expect(onChange).toHaveBeenLastCalledWith(['first', '']);

        const firstItem = wrapper.find('input[aria-label="Item 1"]');
        firstItem.getDOMNode().value = 'updated';
        firstItem.simulate('change');
        expect(onChange).toHaveBeenLastCalledWith(['updated', '']);

        wrapper.find('button[aria-label="Delete item 1"]').simulate('click');
        expect(onChange).toHaveBeenLastCalledWith(['']);
    });
});
