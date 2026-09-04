import React from 'react';
import {mount} from 'enzyme';

import {TWSaveStatus} from '../../../src/components/menu-bar/tw-save-status.jsx';
import openMistWarpShareWindow from '../../../src/lib/mw/open-mw-share-window.jsx';

jest.mock('../../../src/lib/community/enabled.js', () => true);
jest.mock('../../../src/lib/community/publish.js', () => ({
    getMistWarpAction: jest.fn(() => 'update'),
    getRememberedPlatformProjectState: jest.fn(() => ({id: 'project', isOwner: true}))
}));
jest.mock('../../../src/lib/mw/open-mw-share-window.jsx', () => jest.fn());

describe('MistWarp save status', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('opens the update window for an existing MistWarp project', () => {
        const onProjectUnchanged = jest.fn();
        const vm = {};
        const wrapper = mount(
            <TWSaveStatus
                alertsList={[]}
                projectChanged
                projectTitle="Project"
                roturReady
                onProjectUnchanged={onProjectUnchanged}
                vm={vm}
            />
        );

        wrapper.find('[title="Save to MistWarp"]').simulate('click');

        expect(openMistWarpShareWindow).toHaveBeenCalledWith({
            vm,
            initialTitle: 'Project',
            action: 'update',
            onPublished: onProjectUnchanged
        });
    });
});
