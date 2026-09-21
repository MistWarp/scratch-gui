import React from 'react';
import {mount} from 'enzyme';
import {act} from 'react-dom/test-utils';

import {TWSaveStatus} from '../../../src/components/menu-bar/tw-save-status.jsx';
import openMistWarpShareWindow from '../../../src/lib/mw/open-mw-share-window.js';
import {
    getMistWarpAction,
    getRememberedPlatformProjectState
} from '../../../src/lib/community/publish.js';

jest.mock('../../../src/lib/community/enabled.js', () => true);
jest.mock('../../../src/lib/community/publish.js', () => ({
    getMistWarpAction: jest.fn(() => 'update'),
    getRememberedPlatformProjectState: jest.fn(() => ({id: 'project', isOwner: true}))
}));
jest.mock('../../../src/lib/mw/open-mw-share-window.js', () => jest.fn());

const {setSaveFeedback} = require('../../../src/lib/mw/save-feedback.js');

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

        wrapper.find('button').simulate('click');

        expect(openMistWarpShareWindow).toHaveBeenCalledWith({
            vm,
            initialTitle: 'Project',
            action: 'update',
            onPublished: expect.any(Function)
        });
        openMistWarpShareWindow.mock.calls[0][0].onPublished();
        expect(onProjectUnchanged).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });

    test('describes how a local project will be saved', () => {
        getRememberedPlatformProjectState.mockReturnValueOnce(null);
        getMistWarpAction.mockReturnValueOnce('save');
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

        const button = wrapper.find('button');
        expect(button.text()).toBe('Save to MistWarp');
        expect(button.prop('title')).toBe('Uploads this project to your MistWarp account.');
        expect(button.text()).not.toContain('Local project');
        wrapper.unmount();
    });

    test('shows visible progress and results for a download save', () => {
        const vm = {};
        const onShowAlert = jest.fn();
        const onCloseAlert = jest.fn();
        const onAlertDone = jest.fn();
        const wrapper = mount(
            <TWSaveStatus
                alertsList={[]}
                projectChanged
                projectTitle="Project"
                roturReady
                vm={vm}
                onAlertDone={onAlertDone}
                onCloseAlert={onCloseAlert}
                onProjectUnchanged={jest.fn()}
                onShowAlert={onShowAlert}
            />
        );

        act(() => setSaveFeedback(vm, 'downloading'));
        expect(onShowAlert).toHaveBeenLastCalledWith('savingMwp');
        act(() => setSaveFeedback(vm, 'downloaded'));
        expect(onAlertDone).toHaveBeenCalledWith('twSaveToDiskSuccess');
        act(() => setSaveFeedback(vm, 'downloadFailed'));
        expect(onCloseAlert).toHaveBeenCalledWith('savingMwp');
        expect(onShowAlert).toHaveBeenLastCalledWith('savingError');
        // Another editor's saves do not show alerts here.
        onShowAlert.mockClear();
        act(() => setSaveFeedback({}, 'downloading'));
        expect(onShowAlert).not.toHaveBeenCalled();
        wrapper.unmount();
    });
});
