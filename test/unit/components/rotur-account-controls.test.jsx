import React from 'react';
import {FormattedMessage} from 'react-intl';
import {shallowWithIntl} from '../../helpers/intl-helpers.jsx';

import {RoturAccount} from '../../../src/components/menu-bar/mw-rotur-account.jsx';

describe('Rotur account controls', () => {
    test('uses a native login button while signed out', () => {
        const onOpenLogin = jest.fn();
        const wrapper = shallowWithIntl(
            <RoturAccount
                onCloseMenu={() => {}}
                onOpenLogin={onOpenLogin}
                onOpenMenu={() => {}}
            />
        );
        const login = wrapper.find('button');

        expect(login.prop('type')).toBe('button');
        login.simulate('click');
        expect(onOpenLogin).toHaveBeenCalledTimes(1);
    });

    test('opens the editor settings window from the editor account menu', () => {
        const onOpenSettings = jest.fn();
        const onCloseMenu = jest.fn();
        const wrapper = shallowWithIntl(
            <RoturAccount
                username="tester"
                onCloseMenu={onCloseMenu}
                onOpenLogin={() => {}}
                onOpenMenu={() => {}}
                onOpenSettings={onOpenSettings}
            />
        );
        const item = wrapper.find(FormattedMessage)
            .filterWhere(message => message.prop('id') === 'mw.rotur.accountMenu.settings')
            .parent();

        item.simulate('click');
        expect(onCloseMenu).toHaveBeenCalled();
        expect(onOpenSettings).toHaveBeenCalledTimes(1);
    });
});
