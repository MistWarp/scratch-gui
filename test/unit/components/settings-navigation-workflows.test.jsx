import React from 'react';

jest.mock('editor-msgs', () => ({'es-419': {}}));

import {shallowWithIntl} from '../../helpers/intl-helpers.jsx';
import {SettingsModalComponent} from '../../../src/components/tw-settings-modal/settings-modal.jsx';
import {ModalSidebarItem} from '../../../src/components/modal-sidebar/modal-sidebar.jsx';

describe('settings navigation', () => {
    test('Appearance sections are sidebar destinations', () => {
        const modal = shallowWithIntl(<SettingsModalComponent onClose={jest.fn()} />);
        const labels = modal.find(ModalSidebarItem).map(item => item.prop('label'));
        for (const label of ['Privacy', 'Theme', 'Custom themes', 'Styles', 'Menu Bar', 'Blocks', 'Wallpaper', 'Fonts', 'Editor', 'Loading screen']) {
            expect(labels).toContain(label);
        }
        expect(modal.find('button[role="tab"]')).toHaveLength(0);
        modal.find(ModalSidebarItem).filterWhere(item => item.prop('label') === 'Fonts')
            .simulate('click');
        expect(modal.state('currentView')).toBe('fonts');
    });
});

describe('settings search', () => {
    test('filters the sidebar by page titles and setting text', () => {
        const modal = shallowWithIntl(<SettingsModalComponent onClose={jest.fn()} />);
        modal.setState({searchQuery: 'backpack'});
        expect(modal.find(ModalSidebarItem).map(item => item.prop('label'))).toEqual(['Editor']);
        modal.find(ModalSidebarItem).simulate('click');
        expect(modal.state('currentView')).toBe('editor');

        modal.setState({searchQuery: 'no setting has this name'});
        expect(modal.find(ModalSidebarItem)).toHaveLength(0);
        expect(modal.find('p[role="status"]').text()).toBe('No settings match');
    });

    test('Addons result opens the addon settings window', () => {
        const onClose = jest.fn();
        const onClickAddonSettings = jest.fn();
        const modal = shallowWithIntl(
            <SettingsModalComponent
                onClickAddonSettings={onClickAddonSettings}
                onClose={onClose}
            />
        );
        modal.setState({searchQuery: 'addons'});
        modal.find(ModalSidebarItem).filterWhere(item => item.prop('label') === 'Addons')
            .simulate('click');
        expect(onClose).toHaveBeenCalled();
        expect(onClickAddonSettings).toHaveBeenCalled();
    });
});
