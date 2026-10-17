import React from 'react';
import {FormattedMessage} from 'react-intl';
import {shallowWithIntl} from '../../helpers/intl-helpers.jsx';

import {RoturAccount} from '../../../src/components/menu-bar/mw-rotur-account.jsx';
import {getState} from '../../../src/lib/rotur/identity.js';

jest.mock('../../../src/lib/rotur/identity.js', () => ({
    getState: jest.fn(() => ({status: 'idle', user: null}))
}));

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

const clickSwitchAccount = wrapper => wrapper.find(FormattedMessage)
    .filterWhere(message => message.prop('id') === 'mw.rotur.accountMenu.switchAccount')
    .parent()
    .simulate('click');

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

    test('switching accounts signs out and opens the sign-in window without leaving the page', async () => {
        const onLogout = jest.fn();
        const onOpenLogin = jest.fn();
        const before = window.location.href;
        const wrapper = shallowWithIntl(
            <RoturAccount
                username="tester"
                onCloseMenu={() => {}}
                onLogout={onLogout}
                onOpenLogin={onOpenLogin}
                onOpenMenu={() => {}}
            />
        );
        clickSwitchAccount(wrapper);
        await flush();

        expect(onLogout).toHaveBeenCalledTimes(1);
        expect(onOpenLogin).toHaveBeenCalledTimes(1);
        expect(window.location.href).toBe(before);
    });

    test('switching accounts waits for the sign-out and stays put when it is cancelled', async () => {
        let finishSignOut = null;
        const onLogout = jest.fn(() => new Promise(resolve => {
            finishSignOut = resolve;
        }));
        const onOpenLogin = jest.fn();
        getState.mockReturnValue({status: 'ready', user: {username: 'tester'}});
        const wrapper = shallowWithIntl(
            <RoturAccount
                username="tester"
                onCloseMenu={() => {}}
                onLogout={onLogout}
                onOpenLogin={onOpenLogin}
                onOpenMenu={() => {}}
            />
        );
        clickSwitchAccount(wrapper);
        await flush();
        expect(onOpenLogin).not.toHaveBeenCalled();
        finishSignOut();
        await flush();
        expect(onOpenLogin).not.toHaveBeenCalled();
    });
});
