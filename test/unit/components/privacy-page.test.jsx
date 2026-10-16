import React from 'react';

jest.mock('editor-msgs', () => ({'es-419': {}}));

import PrivacyPage from '../../../src/components/tw-settings-modal/privacy-page.jsx';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';

describe('editor privacy settings', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('there is no analytics setting', () => {
        const wrapper = mountWithIntl(<PrivacyPage />);
        expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false);
        expect(wrapper.text()).not.toMatch(/analytics/i);
        expect(wrapper.text()).toContain('Blocked projects');
        wrapper.unmount();
    });
});
