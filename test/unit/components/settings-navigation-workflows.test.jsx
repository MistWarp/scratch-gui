import React from 'react';

jest.mock('editor-msgs', () => ({'es-419': {}}));

import {shallowWithIntl} from '../../helpers/intl-helpers.jsx';
import {SettingsModalComponent} from '../../../src/components/tw-settings-modal/settings-modal.jsx';
import {ModalSidebarItem} from '../../../src/components/modal-sidebar/modal-sidebar.jsx';

describe('settings navigation', () => {
    test('Appearance sections are sidebar destinations', () => {
        const modal = shallowWithIntl(<SettingsModalComponent onClose={jest.fn()} />);
        const labels = modal.find(ModalSidebarItem).map(item => item.prop('label'));
        for (const label of ['Appearance', 'Menu Bar', 'Blocks', 'Wallpaper', 'Fonts', 'Editor', 'Loading screen']) {
            expect(labels).toContain(label);
        }
        expect(modal.find('button[role="tab"]')).toHaveLength(0);
        modal.find(ModalSidebarItem).filterWhere(item => item.prop('label') === 'Fonts')
            .simulate('click');
        expect(modal.state('currentView')).toBe('fonts');
    });
});
