import React from 'react';

jest.mock('editor-msgs', () => ({'es-419': {}}));

import {shallowWithIntl} from '../../helpers/intl-helpers.jsx';
import {
    SettingsModalComponent,
    ThemeSettingsPage
} from '../../../src/components/tw-settings-modal/settings-modal.jsx';
import {ModalSidebarItem} from '../../../src/components/modal-sidebar/modal-sidebar.jsx';

describe('settings navigation', () => {
    test('related appearance controls use one Theme sidebar destination', () => {
        const modal = shallowWithIntl(
            <SettingsModalComponent onClose={jest.fn()} />
        );
        const labels = modal.find(ModalSidebarItem).map(item => item.prop('label'));

        expect(labels).toContain('Theme');
        expect(labels).not.toEqual(expect.arrayContaining([
            'Block Colors',
            'Wallpaper',
            'Fonts',
            'Editor',
            'Styles',
            'Menu Bar',
            'Loading Screen'
        ]));
    });

    test('Theme opens on Appearance and switches to Menu bar without leaving the page', () => {
        const page = shallowWithIntl(
            <ThemeSettingsPage />
        );

        expect(page.find('[role="tab"][aria-selected=true]').text()).toBe('Appearance');
        page.find('[role="tab"]').filterWhere(tab => tab.text() === 'Menu bar').simulate('click');
        expect(page.find('[role="tab"][aria-selected=true]').text()).toBe('Menu bar');
    });
});
