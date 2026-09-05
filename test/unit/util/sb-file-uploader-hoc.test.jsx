import 'web-audio-test-api';

import React from 'react';
import configureStore from 'redux-mock-store';
import {shallowWithIntl} from '../../helpers/intl-helpers.jsx';
import {LoadingState} from '../../../src/reducers/project-state';
import VM from 'scratch-vm';
import * as mwp from '../../../src/lib/git/mwp.js';
import * as history from '../../../src/lib/git/project-history.js';

import {rememberPlatformProject, getRememberedPlatformProjectState} from '../../../src/lib/community/publish.js';

import RestorePointAPI from '../../../src/lib/api/restore-points.js';
import * as browserGit from '../../../src/lib/git/browser-git.js';

import SBFileUploaderHOC from '../../../src/lib/components/sb-file-uploader-hoc.jsx';

describe('SBFileUploaderHOC', () => {
    const mockStore = configureStore();
    let store;
    let vm;

    // Wrap this in a function so it gets test specific states and can be reused.
    const getContainer = function () {
        const Component = () => <div />;
        return SBFileUploaderHOC(Component);
    };

    const shallowMountWithContext = component => (
        shallowWithIntl(component, {context: {store}})
    );

    const unwrappedInstance = (overrides = {}) => {
        const WrappedComponent = getContainer();
        // default starting state: looking at a project you created, not logged in
        const wrapper = shallowMountWithContext(
            <WrappedComponent
                projectChanged
                canSave={false}
                cancelFileUpload={jest.fn()}
                closeFileMenu={jest.fn()}
                openSimpleDialog={jest.fn()}
                requestProjectUpload={jest.fn()}
                userOwnsProject={false}
                vm={vm}
                onLoadingFinished={jest.fn()}
                onLoadingStarted={jest.fn()}
                onUpdateProjectTitle={jest.fn()}
                {...overrides}
            />
        );
        return wrapper
            .dive() // unwrap intl
            .dive() // unwrap redux Connect(SBFileUploaderComponent)
            .instance(); // SBFileUploaderComponent
    };

    afterEach(() => jest.restoreAllMocks());

    beforeEach(() => {
        rememberPlatformProject(null);
        vm = new VM();
        store = mockStore({
            scratchGui: {
                projectState: {
                    loadingState: LoadingState.SHOWING_WITHOUT_ID
                },
                vm: {}
            },
            locales: {
                locale: 'en'
            }
        });
    });

    test.each(['new', 'overwrite'])('loads an MWP into the chosen destination: %s', async destination => {
        jest.spyOn(RestorePointAPI, 'createSafetyRestorePoint').mockResolvedValue(42);
        jest.spyOn(browserGit, 'createRepoBackup').mockResolvedValue(jest.fn());
        const manifest = {head: 'imported', branch: 'custom'};
        const importSpy = jest.spyOn(mwp, 'importMwp').mockResolvedValue(manifest);
        const buildSpy = jest.spyOn(mwp, 'buildSb3FromCurrentRepo').mockResolvedValue({
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(1))
        });
        const preloadSpy = jest.spyOn(history, 'preloadProjectHistory').mockResolvedValue(null);
        rememberPlatformProject({id: 'saved', isOwner: true});
        window.history.replaceState(null, '', '#mw-saved');
        const loadedVm = {loadProject: jest.fn().mockResolvedValue(), quit: jest.fn(), renderer: {draw: jest.fn()}};
        const instance = unwrappedInstance({
            vm: loadedVm, projectChanged: false, onSetProjectTitle: jest.fn()
        });
        instance.fileReader = {result: new ArrayBuffer(1)};
        instance.fileToUpload = {name: 'imported.mwp'};
        instance.uploadDestination = destination;
        await instance.onload();
        expect(loadedVm.loadProject).toHaveBeenCalled();
        if (destination === 'new') {
            expect(getRememberedPlatformProjectState()).toBeNull();
            expect(window.location.hash).toBe('');
            expect(loadedVm._mwHistoryHydration).toBeNull();
        } else {
            expect(getRememberedPlatformProjectState().id).toBe('saved');
            expect(loadedVm._mwHistoryHydration).toEqual(expect.objectContaining({
                manifest, ready: true, replaceHistory: true, projectId: 'saved'
            }));
        }
        expect(instance.props.onLoadingFinished).toHaveBeenCalledWith(instance.props.loadingState, true);
        importSpy.mockRestore();
        buildSpy.mockRestore();
        preloadSpy.mockRestore();
    });

    test.each(['new', 'overwrite'])('asks for a destination for an unchanged saved project: %s', async choice => {
        rememberPlatformProject({id: 'saved', isOwner: true});
        const openSimpleDialog = jest.fn(config => config.onOk(choice));
        const instance = unwrappedInstance({openSimpleDialog, projectChanged: false});
        await instance.handleChange({target: {files: [{name: 'imported.mwp'}]}});
        expect(openSimpleDialog).toHaveBeenCalledWith(expect.objectContaining({
            choices: [
                {value: 'new', label: 'Open in new workspace'},
                {value: 'overwrite', label: 'Replace project and history'}
            ],
            message: expect.stringContaining('commits and branches')
        }));
        expect(instance.uploadDestination).toBe(choice);
        expect(instance.props.requestProjectUpload).toHaveBeenCalled();
        // The old destination remains intact until the file has loaded successfully.
        expect(getRememberedPlatformProjectState().id).toBe('saved');
    });

    test('cancelling a saved project import preserves its destination', async () => {
        rememberPlatformProject({id: 'saved', isOwner: true});
        const instance = unwrappedInstance({
            projectChanged: false,
            openSimpleDialog: config => config.onCancel()
        });
        await instance.handleChange({target: {files: [{name: 'imported.sb3'}]}});
        expect(instance.props.requestProjectUpload).not.toHaveBeenCalled();
        expect(getRememberedPlatformProjectState().id).toBe('saved');
    });

    test('correctly sets title with .sb3 filename', () => {
        const projectName = unwrappedInstance().getProjectTitleFromFilename('my project is great.sb3');
        expect(projectName).toBe('my project is great');
    });

    test('correctly sets title with .sb2 filename', () => {
        const projectName = unwrappedInstance().getProjectTitleFromFilename('my project is great.sb2');
        expect(projectName).toBe('my project is great');
    });

    test('correctly sets title with .sb filename', () => {
        const projectName = unwrappedInstance().getProjectTitleFromFilename('my project is great.sb');
        expect(projectName).toBe('my project is great');
    });

    test('correctly sets title with uppercase project extension', () => {
        const projectName = unwrappedInstance().getProjectTitleFromFilename('MY PROJECT.HTML');
        expect(projectName).toBe('MY PROJECT');
    });

    test('cleans up without requesting a load when file selection is cancelled', () => {
        const instance = unwrappedInstance();
        instance.expectingFileUploadFinish = true;

        instance.handleChange({target: {files: []}});

        expect(instance.expectingFileUploadFinish).toBe(false);
        expect(instance.props.requestProjectUpload).not.toHaveBeenCalled();
        expect(instance.props.closeFileMenu).toHaveBeenCalledTimes(1);
    });

    test('does not open two file pickers for the same request', () => {
        const instance = unwrappedInstance();
        instance.createFileObjects = jest.fn();

        expect(instance.handleStartSelectingFileUpload()).toBe(true);
        expect(instance.handleStartSelectingFileUpload()).toBe(false);

        expect(instance.createFileObjects).toHaveBeenCalledTimes(1);
    });

    test('loads a file delivered after window focus returns', async () => {
        jest.useFakeTimers();
        const instance = unwrappedInstance({projectChanged: false, showOpenFilePicker: null});
        try {
            instance.handleStartSelectingFileUpload();
            const input = instance.inputElement;
            window.dispatchEvent(new Event('focus'));
            jest.runOnlyPendingTimers();

            expect(instance.inputElement).toBe(input);
            const file = new File(['project'], 'project.sb3');
            Object.defineProperty(input, 'files', {value: [file]});
            input.dispatchEvent(new Event('change'));
            await Promise.resolve();
            expect(instance.props.requestProjectUpload).toHaveBeenCalledWith(instance.props.loadingState);
            const read = jest.spyOn(instance.fileReader, 'readAsArrayBuffer').mockImplementation(() => {});
            instance.handleFinishedLoadingUpload();
            expect(read).toHaveBeenCalledWith(file);
        } finally {
            instance.removeFileObjects();
            jest.useRealTimers();
        }
    });

    test('cleans up on the input cancel event and allows retrying', () => {
        const instance = unwrappedInstance({showOpenFilePicker: null});
        try {
            instance.handleStartSelectingFileUpload();
            instance.inputElement.dispatchEvent(new Event('cancel'));
            expect(instance.inputElement).toBeNull();
            expect(instance.expectingFileUploadFinish).toBe(false);
            expect(instance.handleStartSelectingFileUpload()).toBe(true);
        } finally {
            instance.removeFileObjects();
        }
    });

    test('allows retrying when a browser does not emit an input cancel event', () => {
        const instance = unwrappedInstance({showOpenFilePicker: null});
        try {
            instance.handleStartSelectingFileUpload();
            const previousInput = instance.inputElement;
            expect(instance.handleStartSelectingFileUpload()).toBe(true);
            expect(previousInput.isConnected).toBe(false);
            expect(instance.inputElement).not.toBe(previousInput);
        } finally {
            instance.removeFileObjects();
        }
    });

    test('shows an error when the native picker cannot read the selected file', async () => {
        const error = new Error('Permission denied');
        const onLoadingFailed = jest.fn();
        const instance = unwrappedInstance({
            showOpenFilePicker: jest.fn().mockResolvedValue([{
                getFile: jest.fn().mockRejectedValue(error)
            }]),
            onLoadingFailed
        });
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        try {
            instance.handleStartSelectingFileUpload();
            await Promise.resolve();
            await Promise.resolve();
            await Promise.resolve();
            expect(onLoadingFailed).toHaveBeenCalledWith(error);
            expect(instance.expectingFileUploadFinish).toBe(false);
            expect(instance.fileReader).toBeNull();
        } finally {
            instance.removeFileObjects();
            consoleError.mockRestore();
        }
    });

    test('clears the pending upload when project replacement is declined', async () => {
        const openSimpleDialog = jest.fn(config => config.onCancel());
        const instance = unwrappedInstance({openSimpleDialog});
        instance.expectingFileUploadFinish = true;

        await instance.handleChange({target: {files: [{name: 'replacement.sb3'}]}});

        expect(openSimpleDialog).toHaveBeenCalledWith(expect.objectContaining({type: 'confirm'}));
        expect(instance.expectingFileUploadFinish).toBe(false);
        expect(instance.props.requestProjectUpload).not.toHaveBeenCalled();
    });

    test('loads the selected file when project replacement is accepted', async () => {
        const requestProjectUpload = jest.fn();
        const openSimpleDialog = jest.fn(config => config.onOk());
        const instance = unwrappedInstance({openSimpleDialog, requestProjectUpload});
        instance.expectingFileUploadFinish = true;

        await instance.handleChange({target: {files: [{name: 'replacement.sb3'}]}});

        expect(requestProjectUpload).toHaveBeenCalledWith(instance.props.loadingState);
    });

    test('finishes the loading state when reading the selected file fails', () => {
        const onLoadingFailed = jest.fn();
        const onLoadingFinished = jest.fn();
        const instance = unwrappedInstance({onLoadingFailed, onLoadingFinished});
        instance.fileReader = {};
        instance.fileToUpload = {name: 'broken.sb3'};
        const error = new Error('read failed');

        instance.handleFileReadError(error);

        expect(onLoadingFailed).toHaveBeenCalledWith(error);
        expect(onLoadingFinished).toHaveBeenCalledWith(instance.props.loadingState, false);
        expect(instance.fileReader).toBeNull();
        expect(instance.fileToUpload).toBeNull();
    });

    test('sets blank title with filename with no extension', () => {
        const projectName = unwrappedInstance().getProjectTitleFromFilename('my project is great');
        expect(projectName).toBe('');
    });

    /* tw: test is broken by flag required to fix issues with multiple instances
    test('if isLoadingUpload becomes true, without fileToUpload set, will call cancelFileUpload', () => {
        const mockedCancelFileUpload = jest.fn();
        const WrappedComponent = getContainer();
        const mounted = mountWithIntl(
            <WrappedComponent
                projectChanged
                canSave={false}
                cancelFileUpload={mockedCancelFileUpload}
                closeFileMenu={jest.fn()}
                isLoadingUpload={false}
                requestProjectUpload={jest.fn()}
                store={store}
                userOwnsProject={false}
                vm={vm}
                onLoadingFinished={jest.fn()}
                onLoadingStarted={jest.fn()}
                onUpdateProjectTitle={jest.fn()}
            />
        );
        mounted.setProps({
            isLoadingUpload: true
        });
        expect(mockedCancelFileUpload).toHaveBeenCalled();
    });
    */
});
