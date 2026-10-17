import React from 'react';

jest.mock('editor-msgs', () => ({'es-419': {}}));

let mockSplit = true;
jest.mock('../../../src/lib/account/origins.js', () => ({
    ACCOUNT_ORIGIN: 'https://mistwarp.org',
    EDITOR_ORIGIN: 'https://editor.mistwarp.org',
    isSplitEditor: () => mockSplit,
    isEditorOrigin: () => false
}));

import PrivacyPage from '../../../src/components/tw-settings-modal/privacy-page.jsx';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';

const links = wrapper => wrapper.find('a').map(link => [link.text(), link.prop('href')]);

test('the split editor links to the account sections that hold Rotur blocks and presence', () => {
    mockSplit = true;
    const wrapper = mountWithIntl(<PrivacyPage />);
    expect(links(wrapper)).toEqual([
        ['Safety settings', 'https://mistwarp.org/settings?section=safety'],
        ['Presence settings', 'https://mistwarp.org/settings?section=presence']
    ]);
    wrapper.unmount();
});

test('the editor on the account origin shows no account links', () => {
    mockSplit = false;
    const wrapper = mountWithIntl(<PrivacyPage />);
    expect(links(wrapper)).toEqual([]);
    wrapper.unmount();
});
