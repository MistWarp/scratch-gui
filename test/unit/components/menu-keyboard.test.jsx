import React from 'react';
import {shallow} from 'enzyme';

import Menu, {menuFocusIndex, MenuItem} from '../../../src/components/menu/menu.jsx';
import MenuLabel from '../../../src/components/menu-bar/tw-menu-label.jsx';

describe('menu keyboard controls', () => {
    test('menu labels expose state and toggle from the keyboard', () => {
        const onOpen = jest.fn();
        const onClose = jest.fn();
        const wrapper = shallow(
            <MenuLabel
                ariaLabel="File"
                open={false}
                onOpen={onOpen}
                onClose={onClose}
            >
                File
            </MenuLabel>
        );
        const label = wrapper.find('[role="button"]');
        const target = {};

        expect(label.prop('aria-label')).toBe('File');
        expect(label.prop('aria-expanded')).toBe(false);
        expect(label.prop('tabIndex')).toBe(0);

        label.prop('onKeyDown')({
            currentTarget: target,
            target,
            key: 'Enter',
            preventDefault: jest.fn()
        });
        expect(onOpen).toHaveBeenCalledTimes(1);
        expect(onClose).not.toHaveBeenCalled();
    });

    test('menu labels close from a focused child with Escape', () => {
        const onClose = jest.fn();
        const wrapper = shallow(
            <MenuLabel
                ariaLabel="File"
                open
                onOpen={jest.fn()}
                onClose={onClose}
            >
                File
            </MenuLabel>
        );
        const focus = jest.fn();
        wrapper.instance().menuEl = {focus};
        wrapper.find('[role="button"]').prop('onKeyDown')({
            currentTarget: {},
            target: {},
            key: 'Escape',
            preventDefault: jest.fn()
        });

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(focus).toHaveBeenCalledTimes(1);
    });

    test('ArrowDown opens a menu and focuses its first enabled item', () => {
        const onOpen = jest.fn();
        const focus = jest.fn();
        const frame = jest.spyOn(global, 'requestAnimationFrame').mockImplementation(callback => {
            callback();
            return 1;
        });
        const wrapper = shallow(
            <MenuLabel
                ariaLabel="File"
                open={false}
                onOpen={onOpen}
                onClose={jest.fn()}
            >
                File
            </MenuLabel>
        );
        wrapper.instance().menuEl = {
            querySelector: jest.fn(() => ({focus}))
        };
        const target = {};
        wrapper.find('[role="button"]').prop('onKeyDown')({
            currentTarget: target,
            target,
            key: 'ArrowDown',
            preventDefault: jest.fn()
        });

        expect(onOpen).toHaveBeenCalledTimes(1);
        expect(focus).toHaveBeenCalledTimes(1);
        frame.mockRestore();
    });

    test('menu items activate with Enter', () => {
        const onClick = jest.fn();
        const wrapper = shallow(<MenuItem onClick={onClick}>New</MenuItem>);
        const item = wrapper.find('[role="menuitem"]');
        const target = {};

        expect(item.prop('tabIndex')).toBe(0);
        item.prop('onKeyDown')({
            currentTarget: target,
            target,
            key: 'Enter',
            preventDefault: jest.fn()
        });
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    test('menus expose their menu role', () => {
        const wrapper = shallow(<Menu><MenuItem>Info</MenuItem></Menu>);
        expect(wrapper.prop('role')).toBe('menu');
    });

    test('menu arrow navigation wraps and supports Home and End', () => {
        expect(menuFocusIndex('ArrowDown', -1, 3)).toBe(0);
        expect(menuFocusIndex('ArrowDown', 2, 3)).toBe(0);
        expect(menuFocusIndex('ArrowUp', -1, 3)).toBe(2);
        expect(menuFocusIndex('ArrowUp', 0, 3)).toBe(2);
        expect(menuFocusIndex('Home', 2, 3)).toBe(0);
        expect(menuFocusIndex('End', 0, 3)).toBe(2);
        expect(menuFocusIndex('Enter', 0, 3)).toBeNull();
        expect(menuFocusIndex('ArrowDown', -1, 0)).toBe(-1);
    });
});
