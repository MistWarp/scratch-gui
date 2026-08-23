import 'web-audio-test-api';

import React from 'react';
import configureStore from 'redux-mock-store';
import {mountWithIntl, shallowWithIntl} from '../../helpers/intl-helpers.jsx';
import {LoadingState} from '../../../src/reducers/project-state';
import VM from 'scratch-vm';

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

    beforeEach(() => {
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
