import React from 'react';
import {mount} from 'enzyme';

import Modal from '../../src/community/components/ui/Modal.jsx';

describe('community Modal dismissal', () => {
    test('disables close controls while dismissal is locked', () => {
        const onClose = jest.fn();
        const wrapper = mount(
            <Modal title="Saving" onClose={onClose} dismissDisabled>Working…</Modal>
        );

        expect(wrapper.find('button[aria-label="Close"]').prop('disabled')).toBe(true);
        expect(wrapper.find('div').at(0).prop('onClick')).toBeNull();
        wrapper.unmount();
    });

    test('keeps normal close controls active when unlocked', () => {
        const onClose = jest.fn();
        const wrapper = mount(<Modal title="Ready" onClose={onClose}>Done</Modal>);

        wrapper.find('button[aria-label="Close"]').simulate('click');
        expect(onClose).toHaveBeenCalledTimes(1);
        const titleId = wrapper.find('[role="dialog"]').prop('aria-labelledby');
        expect(wrapper.find(`#${titleId}`).text()).toBe('Ready');
        wrapper.unmount();
    });

    test('moves focus into the modal and restores the opener on unmount', () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const opener = document.createElement('button');
        document.body.appendChild(opener);
        opener.focus();

        const wrapper = mount(
            <Modal title="Ready" onClose={() => {}}>Done</Modal>,
            {attachTo: host}
        );

        expect(document.activeElement).toBe(wrapper.find('button[aria-label="Close"]').getDOMNode());
        expect(wrapper.find('button[aria-label="Close"]').prop('type')).toBe('button');

        wrapper.unmount();
        expect(document.activeElement).toBe(opener);
        host.remove();
        opener.remove();
    });

    test('focuses the first form control before the close button', () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const wrapper = mount(
            <Modal title="Edit" onClose={() => {}}><input aria-label="Project name" /></Modal>,
            {attachTo: host}
        );

        expect(document.activeElement).toBe(wrapper.find('input').getDOMNode());

        wrapper.unmount();
        host.remove();
    });

    test('wraps keyboard focus within the modal', () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const wrapper = mount(
            <Modal title="Choose" onClose={() => {}}>
                <button type="button">First choice</button>
                <button type="button">Last choice</button>
            </Modal>,
            {attachTo: host}
        );
        const close = wrapper.find('button[aria-label="Close"]').getDOMNode();
        const last = wrapper.find('button').last().getDOMNode();

        last.focus();
        wrapper.find('[role="dialog"]').simulate('keydown', {key: 'Tab', shiftKey: false});
        expect(document.activeElement).toBe(close);

        close.focus();
        wrapper.find('[role="dialog"]').simulate('keydown', {key: 'Tab', shiftKey: true});
        expect(document.activeElement).toBe(last);

        wrapper.unmount();
        host.remove();
    });

    test('keeps focus on a locked modal with no enabled controls', () => {
        const host = document.createElement('div');
        document.body.appendChild(host);
        const wrapper = mount(
            <Modal title="Saving" onClose={() => {}} dismissDisabled>Working…</Modal>,
            {attachTo: host}
        );
        const dialog = wrapper.find('[role="dialog"]');

        expect(document.activeElement).toBe(dialog.getDOMNode());
        dialog.simulate('keydown', {key: 'Tab', shiftKey: false});
        expect(document.activeElement).toBe(dialog.getDOMNode());

        wrapper.unmount();
        host.remove();
    });

    test('locks background scrolling and restores the previous style', () => {
        document.body.style.overflow = 'scroll';
        const wrapper = mount(<Modal title="Ready" onClose={() => {}}>Done</Modal>);

        expect(document.body.style.overflow).toBe('hidden');
        wrapper.unmount();
        expect(document.body.style.overflow).toBe('scroll');
        document.body.style.overflow = '';
    });
});
