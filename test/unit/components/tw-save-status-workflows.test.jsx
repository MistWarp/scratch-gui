import React from 'react';
import {mount} from 'enzyme';
import {act} from 'react-dom/test-utils';

import {TWSaveStatus} from '../../../src/components/menu-bar/tw-save-status.jsx';
import smartSave from '../../../src/lib/mw/smart-save.js';

jest.mock('../../../src/lib/community/enabled.js', () => true);
jest.mock('../../../src/lib/community/publish.js', () => ({
    getMistWarpAction: jest.fn(() => 'update'),
    getRememberedPlatformProjectState: jest.fn(() => ({id: 'project', isOwner: true}))
}));
jest.mock('../../../src/lib/mw/smart-save.js', () => jest.fn());

describe('MistWarp save status', () => {
    test('ignores another click while saving', async () => {
        let finishSave;
        smartSave.mockImplementation(() => new Promise(resolve => {
            finishSave = resolve;
        }));
        const wrapper = mount(
            <TWSaveStatus
                alertsList={[]}
                projectChanged
                projectTitle="Project"
                roturReady
                onProjectUnchanged={jest.fn()}
                vm={{}}
            />
        );

        let firstSave;
        act(() => {
            firstSave = wrapper.find('[title="Save to MistWarp"]').prop('onClick')();
        });
        wrapper.update();
        const savingButton = wrapper.find('[title="Saving…"]');
        expect(savingButton.prop('disabled')).toBe(true);
        expect(savingButton.prop('aria-busy')).toBe(true);
        await act(async () => {
            await savingButton.prop('onClick')();
        });
        expect(smartSave).toHaveBeenCalledTimes(1);

        await act(async () => {
            finishSave(true);
            await firstSave;
        });
        wrapper.update();
        expect(wrapper.find('[title="Save to MistWarp"]').exists()).toBe(true);
    });
});
