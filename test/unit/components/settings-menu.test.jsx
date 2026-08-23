import React from 'react';

import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import {SettingsMenu} from '../../../src/components/menu-bar/settings-menu.jsx';

describe('SettingsMenu', () => {
    test('uses a keyboard-accessible button', () => {
        const onOpenSettings = jest.fn();
        const wrapper = mountWithIntl(<SettingsMenu onOpenSettings={onOpenSettings} />);
        const button = wrapper.find('button');

        expect(button).toHaveLength(1);
        expect(button.prop('type')).toBe('button');
        expect(button.text()).toBe('Settings');

        button.simulate('click');
        expect(onOpenSettings).toHaveBeenCalledTimes(1);
    });
});
