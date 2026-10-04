import React from 'react';
import {act} from 'react-dom/test-utils';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';

import {getSaveStatus, TWSaveStatus} from '../../../src/components/menu-bar/tw-save-status.jsx';
import {beginProjectOperation} from '../../../src/lib/project-operation.js';
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
        const wrapper = mountWithIntl(
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
        const wrapper = mountWithIntl(
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
        expect(button.text()).toBe('Save to MistWarpUnsaved changes');
        // The button uploads, but Ctrl+S downloads a project not on MistWarp yet; the tooltip says so.
        expect(button.prop('title')).toBe('Unsaved changes. Uploads this project to your MistWarp account. ' +
            'Ctrl+S saves a copy to your computer instead.');
        expect(button.text()).not.toContain('Local project');
        wrapper.unmount();
    });

    test('shows visible progress and results for a download save', () => {
        const vm = {};
        const onShowAlert = jest.fn();
        const onCloseAlert = jest.fn();
        const onAlertDone = jest.fn();
        const wrapper = mountWithIntl(
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

    test('shows upload progress and the saved state next to the button', () => {
        const vm = {};
        const onShowAlert = jest.fn();
        const props = {
            alertsList: [],
            projectTitle: 'Project',
            roturReady: true,
            vm,
            onAlertDone: jest.fn(),
            onCloseAlert: jest.fn(),
            onProjectUnchanged: jest.fn(),
            onShowAlert
        };
        const wrapper = mountWithIntl(<TWSaveStatus
            projectChanged
            {...props}
        />);
        const statusText = () => wrapper.find('[role="status"]').text();
        expect(statusText()).toBe('Unsaved changes');

        act(() => setSaveFeedback(vm, 'uploading'));
        wrapper.update();
        expect(statusText()).toBe('Saving…');
        // Uploads (including background autosaves) don't flash alerts.
        expect(onShowAlert).not.toHaveBeenCalled();

        act(() => setSaveFeedback(vm, 'cloud'));
        wrapper.setProps({projectChanged: false});
        wrapper.update();
        expect(statusText()).toBe('Saved');
        wrapper.unmount();
    });

    test('ignores clicks while another save or project change runs', () => {
        const vm = {};
        const wrapper = mountWithIntl(
            <TWSaveStatus
                alertsList={[]}
                projectChanged
                projectTitle="Project"
                roturReady
                onProjectUnchanged={jest.fn()}
                vm={vm}
            />
        );
        let release;
        act(() => {
            release = beginProjectOperation(vm);
        });
        wrapper.update();
        expect(wrapper.find('button').prop('aria-disabled')).toBe(true);
        wrapper.find('button').simulate('click');
        expect(openMistWarpShareWindow).not.toHaveBeenCalled();

        act(() => release());
        wrapper.update();
        expect(wrapper.find('button').prop('aria-disabled')).toBe(false);
        wrapper.find('button').simulate('click');
        expect(openMistWarpShareWindow).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });

    test('explains why a read-only project cannot be saved', () => {
        getRememberedPlatformProjectState.mockReturnValueOnce({id: 'p', isOwner: false, canRemix: false});
        getMistWarpAction.mockReturnValueOnce('remix');
        const wrapper = mountWithIntl(
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
        expect(button.prop('aria-disabled')).toBe(true);
        expect(button.prop('title')).toContain('You can\'t save changes to this project');
        expect(wrapper.find('[role="status"]').text()).toBe('Read-only');
        button.simulate('click');
        expect(openMistWarpShareWindow).not.toHaveBeenCalled();
        wrapper.unmount();
    });
});

describe('getSaveStatus', () => {
    const base = {busy: false, downloadError: false, feedback: null, isOwner: false, projectChanged: false};

    test('prefers progress, then failures, then unsaved edits, then the last save', () => {
        expect(getSaveStatus({...base, projectChanged: true, feedback: 'uploading'})).toBe('saving');
        expect(getSaveStatus({...base, busy: true})).toBe('preparingDownload');
        expect(getSaveStatus({...base, projectChanged: true, feedback: 'cloudFailed'})).toBe('saveFailed');
        expect(getSaveStatus({...base, projectChanged: true, feedback: 'cloud'})).toBe('unsaved');
        expect(getSaveStatus({...base, feedback: 'cloud'})).toBe('saved');
        expect(getSaveStatus({...base, isOwner: true})).toBe('saved');
        expect(getSaveStatus({...base, feedback: 'downloaded'})).toBe('downloaded');
        expect(getSaveStatus({...base, readOnly: true, projectChanged: true})).toBe('readOnly');
        expect(getSaveStatus(base)).toBeNull();
    });
});
