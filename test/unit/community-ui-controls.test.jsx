import React from 'react';
import {mount, shallow} from 'enzyme';

import Button from '../../src/community/components/ui/Button.jsx';
import IconButton from '../../src/community/components/ui/IconButton.jsx';
import {Switch, SwitchRow} from '../../src/community/components/ui/Switch.jsx';

const translatePage = node => {
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    texts.forEach(text => {
        const font = document.createElement('font');
        font.textContent = text.textContent;
        text.parentNode.replaceChild(font, text);
    });
};

describe('community UI controls', () => {
    test('button disables itself and shows its busy label while working', () => {
        const button = shallow(
            <Button
                busy
                busyLabel="Saving…"
            >Save</Button>
        );

        const visible = button.find('span').filterWhere(span => !/idle/.test(span.prop('className')));

        expect(button.prop('disabled')).toBe(true);
        expect(button.prop('aria-busy')).toBe(true);
        expect(visible.map(span => span.text()).join('')).toBe('Saving…');
    });

    test('button survives a page translator replacing its label text', () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const button = mount(
            <Button busyLabel="Loading…">Load more</Button>,
            {attachTo: container}
        );
        translatePage(button.getDOMNode());

        expect(() => button.setProps({busy: true})).not.toThrow();
        expect(() => button.setProps({busy: false})).not.toThrow();
        button.unmount();
        container.remove();
    });

    test('button with an icon survives a page translator while it swaps to its busy label', () => {
        const container = document.createElement('div');
        document.body.appendChild(container);
        const button = mount(
            <Button busyLabel="Sending…"><svg />Send request</Button>,
            {attachTo: container}
        );
        translatePage(button.getDOMNode());

        expect(() => button.setProps({busy: true})).not.toThrow();
        expect(() => button.setProps({busy: false})).not.toThrow();
        button.unmount();
        container.remove();
    });

    test('button keeps an explicit submit type', () => {
        const button = shallow(<Button type="submit">Save</Button>);

        expect(button.prop('type')).toBe('submit');
    });

    test('icon button shares button behavior without repeating its visible label', () => {
        const button = shallow(
            <IconButton label="Remove teammate"><span>icon</span></IconButton>
        );

        expect(button.type()).toBe(Button);
        expect(button.prop('aria-label')).toBe('Remove teammate');
        expect(button.prop('title')).toBe('Remove teammate');
    });

    test('switch reports the next boolean value', () => {
        const onChange = jest.fn();
        const control = mount(
            <Switch
                ariaLabel="Share analytics"
                checked={false}
                onChange={onChange}
            />
        );

        control.find('input').simulate('change', {target: {checked: true}});
        expect(onChange).toHaveBeenCalledWith(true);
    });

    test('switch row makes its visible label part of the click target', () => {
        const row = mount(
            <SwitchRow
                checked
                label="Project notifications"
                onChange={() => {}}
            />
        );

        expect(row.find('label')).toHaveLength(1);
        expect(row.find('label').text()).toContain('Project notifications');
        expect(row.find('input').prop('checked')).toBe(true);
    });
});
