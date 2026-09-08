import React from 'react';

jest.mock('editor-msgs', () => ({'es-419': {}}));

import {shallowWithIntl} from '../../helpers/intl-helpers.jsx';
import {SettingsModalComponent} from '../../../src/components/tw-settings-modal/settings-modal.jsx';
import {ModalSidebarItem} from '../../../src/components/modal-sidebar/modal-sidebar.jsx';

describe('settings navigation', () => {
    test('Theme is one sidebar destination with tabs for its sections', () => {
        const modal = shallowWithIntl(<SettingsModalComponent onClose={jest.fn()} />);
        const labels = modal.find(ModalSidebarItem).map(item => item.prop('label'));
        expect(labels).toContain('Theme');
        expect(labels).not.toContain('Menu bar');
        expect(labels).not.toContain('Fonts');
        modal.find(ModalSidebarItem).filterWhere(item => item.prop('label') === 'Theme').simulate('click');
        expect(modal.state('currentView')).toBe('appearance');
        const tabs = modal.find('button[role="tab"]');
        expect(tabs).toHaveLength(6);
        tabs.at(1).simulate('click');
        expect(modal.state('currentView')).toBe('blocks');
        expect(modal.find(ModalSidebarItem).filterWhere(item => item.prop('label') === 'Theme').prop('selected'))
            .toBe(true);
    });
});
