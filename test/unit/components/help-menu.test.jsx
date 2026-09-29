import React from 'react';

import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import {HelpMenu} from '../../../src/components/menu-bar/help-menu.jsx';
import {validateHelpRegistry} from '../../../src/lib/help/index.js';

jest.mock('../../../src/lib/shortcuts/command-palette.js', () => ({
    getCommandPaletteKey: () => 'Ctrl+K',
    openCommandPalette: jest.fn()
}));

const renderMenu = props => mountWithIntl(
    <HelpMenu
        open
        onOpenHelp={jest.fn()}
        onOpenShortcuts={jest.fn()}
        onRequestClose={jest.fn()}
        onRequestOpen={jest.fn()}
        {...props}
    />
);

describe('HelpMenu', () => {
    test('lists help, documentation, shortcuts, the command palette, and feedback', () => {
        const wrapper = renderMenu();
        const items = wrapper.find('[role="menuitem"]').map(item => item.text());
        expect(items).toEqual([
            'Open help',
            'Documentation',
            'Keyboard shortcuts',
            'Command paletteCtrl+K',
            'Send feedback'
        ]);
        expect(wrapper.find('[data-mw-item="help"]').first()
            .prop('aria-label')).toBe('Help');
    });

    test('closes the menu before opening help or the shortcuts page', () => {
        const onOpenHelp = jest.fn();
        const onOpenShortcuts = jest.fn();
        const onRequestClose = jest.fn();
        const wrapper = renderMenu({onOpenHelp, onOpenShortcuts, onRequestClose});
        wrapper.find('[role="menuitem"]').at(0)
            .simulate('click');
        wrapper.find('[role="menuitem"]').at(2)
            .simulate('click');
        expect(onRequestClose).toHaveBeenCalledTimes(2);
        expect(onOpenHelp).toHaveBeenCalledTimes(1);
        expect(onOpenShortcuts).toHaveBeenCalledTimes(1);
    });

    test('opens the documentation and feedback pages in a new tab', () => {
        const open = jest.spyOn(window, 'open').mockImplementation(() => null);
        const wrapper = renderMenu();
        wrapper.find('[role="menuitem"]').at(1)
            .simulate('click');
        wrapper.find('[role="menuitem"]').at(4)
            .simulate('click');
        expect(open.mock.calls.map(call => call[0])).toEqual(['/docs/', '/roadmap']);
        open.mockRestore();
    });
});

test('help registry entries stay valid', () => {
    expect(validateHelpRegistry()).toBe(true);
});
