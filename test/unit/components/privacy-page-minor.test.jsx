import React from 'react';

jest.mock('editor-msgs', () => ({'es-419': {}}));

import PrivacyPage from '../../../src/components/tw-settings-modal/privacy-page.jsx';
import {setAnalyticsEnabled} from '../../../src/community/analytics.js';
import {setMinorAccount} from '../../../src/lib/minor-account.js';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';

const analyticsInput = wrapper => wrapper.find('input[type="checkbox"]').last();

describe('editor privacy settings for under-18 accounts', () => {
    beforeEach(() => {
        localStorage.clear();
        setMinorAccount(false);
        setAnalyticsEnabled(true);
    });

    test('adults can change anonymous analytics', () => {
        const wrapper = mountWithIntl(<PrivacyPage />);
        expect(analyticsInput(wrapper).prop('checked')).toBe(true);
        expect(analyticsInput(wrapper).prop('disabled')).toBeFalsy();
        wrapper.unmount();
    });

    test('analytics show as off and locked for minors', () => {
        setMinorAccount(true);
        const wrapper = mountWithIntl(<PrivacyPage />);
        expect(analyticsInput(wrapper).prop('checked')).toBe(false);
        expect(analyticsInput(wrapper).prop('disabled')).toBe(true);
        wrapper.unmount();
    });

    test('the toggle follows the account when the minor flag arrives later', () => {
        const wrapper = mountWithIntl(<PrivacyPage />);
        setMinorAccount(true);
        wrapper.update();
        expect(analyticsInput(wrapper).prop('checked')).toBe(false);
        expect(analyticsInput(wrapper).prop('disabled')).toBe(true);
        wrapper.unmount();
    });
});
