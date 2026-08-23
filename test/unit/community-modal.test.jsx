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
    });

    test('keeps normal close controls active when unlocked', () => {
        const onClose = jest.fn();
        const wrapper = mount(<Modal title="Ready" onClose={onClose}>Done</Modal>);

        wrapper.find('button[aria-label="Close"]').simulate('click');
        expect(onClose).toHaveBeenCalledTimes(1);
        const titleId = wrapper.find('[role="dialog"]').prop('aria-labelledby');
        expect(wrapper.find(`#${titleId}`).text()).toBe('Ready');
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
});
