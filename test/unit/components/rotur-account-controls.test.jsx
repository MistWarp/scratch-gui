import React from 'react';
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
});
