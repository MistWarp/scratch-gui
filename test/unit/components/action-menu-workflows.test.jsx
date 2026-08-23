import React from 'react';
import {mount} from 'enzyme';

import ActionMenu from '../../../src/components/action-menu/action-menu.jsx';

describe('action menu file workflow', () => {
    test('keeps the file input outside its trigger and closes the menu when clicked', () => {
        jest.useFakeTimers();
        const onFileClick = jest.fn();
        const wrapper = mount(
            <ActionMenu
                moreButtons={[{
                    fileAccept: '.png',
                    fileChange: jest.fn(),
                    fileInput: jest.fn(),
                    img: () => null,
                    onClick: onFileClick,
                    title: 'Upload'
                }]}
                onClick={jest.fn()}
                title="Add"
            />
        );
        wrapper.setState({isOpen: true});

        expect(wrapper.find('button input[type="file"]')).toHaveLength(0);
        wrapper.find('button[aria-label="Upload"]').simulate('click');

        expect(onFileClick).toHaveBeenCalledTimes(1);
        expect(wrapper.state('isOpen')).toBe(false);
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        wrapper.unmount();
    });

    test('updates file actions when the parent supplies new props', () => {
        const firstAction = jest.fn();
        const secondAction = jest.fn();
        const button = onClick => ({
            fileInput: jest.fn(),
            img: () => null,
            onClick,
            title: 'Upload'
        });
        const wrapper = mount(
            <ActionMenu
                moreButtons={[button(firstAction)]}
                onClick={jest.fn()}
                title="Add"
            />
        );

        wrapper.setProps({moreButtons: [button(secondAction)]});
        wrapper.find('button[aria-label="Upload"]').simulate('click');
        expect(firstAction).not.toHaveBeenCalled();
        expect(secondAction).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });

    test('clears pending close timers when unmounted', () => {
        jest.useFakeTimers();
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
        const wrapper = mount(
            <ActionMenu
                moreButtons={[]}
                onClick={jest.fn()}
                title="Add"
            />
        );
        wrapper.instance().handleClosePopover();

        wrapper.unmount();

        expect(clearTimeoutSpy).toHaveBeenCalled();
        clearTimeoutSpy.mockRestore();
        jest.useRealTimers();
    });

    test('opens for keyboard focus and closes with Escape', () => {
        const wrapper = mount(
            <ActionMenu
                moreButtons={[{
                    img: () => null,
                    onClick: jest.fn(),
                    title: 'Upload'
                }]}
                onClick={jest.fn()}
                title="Add"
            />
        );

        expect(wrapper.find('button[aria-label="Upload"]').prop('tabIndex')).toBe(-1);
        wrapper.find('button[aria-label="Add"]').simulate('focus');
        expect(wrapper.state('isOpen')).toBe(true);
        expect(wrapper.find('button[aria-label="Upload"]').prop('tabIndex')).toBe(0);

        wrapper.find('div').first().simulate('keydown', {
            key: 'Escape',
            preventDefault: jest.fn()
        });
        expect(wrapper.state('isOpen')).toBe(false);
        wrapper.unmount();
    });

    test('disables unavailable extra actions', () => {
        const wrapper = mount(
            <ActionMenu
                moreButtons={[{
                    img: () => null,
                    title: 'Surprise me'
                }]}
                onClick={jest.fn()}
                title="Add"
            />
        );

        const unavailable = wrapper.find('button[aria-label="Surprise me"]');
        expect(unavailable.prop('disabled')).toBe(true);
        expect(unavailable.prop('type')).toBe('button');
        wrapper.unmount();
    });
});
