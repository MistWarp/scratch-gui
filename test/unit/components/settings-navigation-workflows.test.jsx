import React from 'react';

jest.mock('editor-msgs', () => ({'es-419': {}}));

import {shallowWithIntl} from '../../helpers/intl-helpers.jsx';
import {SettingsModalComponent} from '../../../src/components/tw-settings-modal/settings-modal.jsx';
import {ModalSidebarItem} from '../../../src/components/modal-sidebar/modal-sidebar.jsx';

describe('settings navigation', () => {
    test('theme sections are sidebar destinations', () => {
        const modal = shallowWithIntl(
            <SettingsModalComponent onClose={jest.fn()} />
        );
        const labels = modal.find(ModalSidebarItem).map(item => item.prop('label'));

        expect(labels).toEqual(expect.arrayContaining([
            'Appearance',
            'Blocks',
            'Wallpaper',
            'Fonts',
            'Editor',
            'Menu bar',
            'Loading screen'
        ]));
        expect(labels).not.toContain('Theme');
    });

    test('sidebar navigates between theme sections', () => {
        const modal = shallowWithIntl(
            <SettingsModalComponent onClose={jest.fn()} />
        );
        modal.find(ModalSidebarItem)
            .filterWhere(item => item.prop('label') === 'Menu bar')
            .simulate('click');
        expect(modal.state('currentView')).toBe('menuBar');

        modal.find(ModalSidebarItem)
            .filterWhere(item => item.prop('label') === 'Blocks')
            .simulate('click');
        expect(modal.state('currentView')).toBe('blocks');
    });
});
