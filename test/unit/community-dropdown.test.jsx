import React from 'react';
import {mount} from 'enzyme';
import {act} from 'react-dom/test-utils';

import Dropdown, {DropdownItem} from '../../src/community/components/ui/Dropdown.jsx';

const ExampleDropdown = () => (
    <Dropdown
        className="custom-wrap"
        menuClassName="custom-menu"
        renderTrigger={({open, toggle}) => (
            <button type="button" aria-expanded={open} onClick={toggle}>Open</button>
        )}
    >
        {({close}) => (
            <React.Fragment>
                <DropdownItem onClick={close}>First</DropdownItem>
                <DropdownItem>Second</DropdownItem>
            </React.Fragment>
        )}
    </Dropdown>
);

describe('community dropdown', () => {
    let container;
    let dropdown;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        dropdown = mount(<ExampleDropdown />, {attachTo: container});
    });

    afterEach(() => {
        dropdown.unmount();
        container.remove();
    });

    test('opens, focuses the first item, and closes with Escape', () => {
        const trigger = dropdown.find('button').first();

        trigger.simulate('click');
        dropdown.update();
        expect(dropdown.find('[role="menu"]')).toHaveLength(1);
        expect(dropdown.find('div.custom-wrap')).toHaveLength(1);
        expect(dropdown.find('div.custom-menu')).toHaveLength(1);
        expect(document.activeElement.textContent).toBe('First');

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
        });
        dropdown.update();
        expect(dropdown.find('[role="menu"]')).toHaveLength(0);
        expect(document.activeElement.textContent).toBe('Open');
    });

    test('moves through enabled items with arrow keys', () => {
        dropdown.find('button').first().simulate('click');
        dropdown.update();

        dropdown.find('[role="menu"]').simulate('keydown', {key: 'ArrowDown'});
        expect(document.activeElement.textContent).toBe('Second');
        dropdown.find('[role="menu"]').simulate('keydown', {key: 'ArrowUp'});
        expect(document.activeElement.textContent).toBe('First');
    });

    test('closes after selecting an item', () => {
        dropdown.find('button').first().simulate('click');
        dropdown.find(DropdownItem).first().simulate('click');
        dropdown.update();

        expect(dropdown.find('[role="menu"]')).toHaveLength(0);
    });
});
