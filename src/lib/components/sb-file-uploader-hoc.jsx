import bindAll from 'lodash.bindall';
import React from 'react';
import PropTypes from 'prop-types';
import {intlShape, injectIntl} from 'react-intl';
import {connect} from 'react-redux';
import log from '../utils/log';
import sharedMessages from '../constants/shared-messages';
import {setFileHandle, setProjectError} from '../../reducers/tw';
import unpackage from '../unpackager';
import {importRepoFromSb3} from '../git/browser-git';
import {buildSb3FromCurrentRepo, importMwp} from '../git/mwp.js';
import {markProjectHistoryLoading, preloadProjectHistory} from '../git/project-history.js';
import RestorePointAPI from '../api/restore-points';

import {
    LoadingStates,
    getIsLoadingUpload,
    getIsShowingWithoutId,
    onLoadedProject,
    requestProjectUpload,
    getIsShowingProject
} from '../../reducers/project-state';
import {setProjectTitle} from '../../reducers/project-title';
import {
    openLoadingProject,
    closeLoadingProject,
    openInvalidProjectModal,
    openSimpleDialog
} from '../../reducers/modals';
import {
    closeFileMenu
} from '../../reducers/menus';

/**
 * Higher Order Component to provide behavior for loading local project files into editor.
 * @param {React.Component} WrappedComponent the component to add project file loading functionality to
 * @returns {React.Component} WrappedComponent with project file loading functionality added
 *
 * <SBFileUploaderHOC>
 *     <WrappedComponent />
 * </SBFileUploaderHOC>
 */
const SBFileUploaderHOC = function (WrappedComponent) {
    class SBFileUploaderComponent extends React.Component {
        constructor (props) {
            super(props);
            bindAll(this, [
                'createFileObjects',
                'getProjectTitleFromFilename',
                'handleFinishedLoadingUpload',
                'handleStartSelectingFileUpload',
                'handleFileReadError',
                'handleFileSelectionCancel',
                'handleChange',
                'confirmProjectReplacement',
                'onload',
                'removeFileObjects'
            ]);
            // tw: We have multiple instances of this HOC alive at a time. This flag fixes issues that arise from that.
            this.expectingFileUploadFinish = false;
            this.unmounted = false;
        }
        componentDidMount () {
            this.unmounted = false;
        }
        componentDidUpdate (prevProps) {
            if (this.props.isLoadingUpload && !prevProps.isLoadingUpload && this.expectingFileUploadFinish) {
                this.handleFinishedLoadingUpload(); // cue step 5 below
            }
        }
        componentWillUnmount () {
            this.unmounted = true;
            this.removeFileObjects();
        }
        // step 1: this is where the upload process begins
        handleStartSelectingFileUpload () {
            if (this.expectingFileUploadFinish) return false;
            this.expectingFileUploadFinish = true;
            this.createFileObjects(); // go to step 2
            return true;
        }
        // step 2: create a FileReader and an <input> element, and issue a
        // pseudo-click to it. That will open the file chooser dialog.
        createFileObjects () {
            // redo step 7, in case it got skipped last time and its objects are
            // still in memory
            this.removeFileObjects();
            // create fileReader
            this.fileReader = new FileReader();
            this.fileReader.onload = this.onload;
            this.fileReader.onerror = () => this.handleFileReadError(
                this.fileReader && this.fileReader.error ?
                    this.fileReader.error : new Error('Could not read project file')
            );
            this.fileReader.onabort = () => this.handleFileReadError(new Error('Project file read was cancelled'));
            // tw: Use FS API when available
            if (this.props.showOpenFilePicker) {
                (async () => {
                    try {
                        const [handle] = await this.props.showOpenFilePicker({
                            multiple: false
                        });
                        const file = await handle.getFile();
                        this.handleChange({
                            target: {
                                files: [file],
                                handle: handle
                            }
                        });
                    } catch (err) {
                        // If the user aborted it, that's not an error.
                        if (err && err.name === 'AbortError') {
                            this.handleFileSelectionCancel();
                            return;
                        }
                        // eslint-disable-next-line no-console
                        console.error(err);
                        this.handleFileSelectionCancel();
                    }
                })();
            } else {
                // create <input> element and add it to DOM
                this.inputElement = document.createElement('input');
                this.inputElement.style = 'display: none;';
                this.inputElement.type = 'file';
                this.inputElement.onchange = this.handleChange; // connects to step 3
                this.inputElement.oncancel = this.handleFileSelectionCancel;
                this.handleWindowFocus = () => {
                    setTimeout(() => {
                        if (this.expectingFileUploadFinish && this.inputElement &&
                            (!this.inputElement.files || this.inputElement.files.length === 0)) {
                            this.handleFileSelectionCancel();
                        }
                    }, 0);
                };
                window.addEventListener('focus', this.handleWindowFocus);
                document.body.appendChild(this.inputElement);
                // simulate a click to open file chooser dialog
                this.inputElement.click();
            }
        }
        // step 3: user has picked a file using the file chooser dialog.
        // We don't actually load the file here, we only decide whether to do so.
        confirmProjectReplacement () {
            return new Promise(resolve => {
                this.props.openSimpleDialog({
                    type: 'confirm',
                    title: this.props.intl.formatMessage({
                        id: 'gui.projectLoader.replaceProjectTitle',
                        defaultMessage: 'Replace this project?'
                    }),
                    message: this.props.intl.formatMessage(sharedMessages.replaceProjectWarning),
                    onOk: () => resolve(true),
                    onCancel: () => resolve(false)
                });
            });
        }
        async handleChange (e) {
            const {
                loadingState,
                projectChanged,
                userOwnsProject
            } = this.props;
            const thisFileInput = e.target;
            if (thisFileInput.files && thisFileInput.files.length > 0) {
                this.fileToUpload = thisFileInput.files[0];
                this.props.closeFileMenu();

                // If user owns the project, or user has changed the project,
                // we must confirm with the user that they really intend to
                // replace it. (If they don't own the project and haven't
                // changed it, no need to confirm.)
                let uploadAllowed = true;
                if (userOwnsProject || projectChanged) {
                    uploadAllowed = await this.confirmProjectReplacement();
                }
                if (uploadAllowed && !this.unmounted) {
                    // Don't update file handle until after confirming replace.
                    const handle = thisFileInput.handle;
                    if (handle) {
                        if (this.fileToUpload.name.endsWith('.sb3')) {
                            this.props.onSetFileHandle(handle);
                        } else {
                            this.props.onSetFileHandle(null);
                        }
                    }

                    // cues step 4
                    this.props.requestProjectUpload(loadingState);
                } else {
                    // skips ahead to step 7
                    this.expectingFileUploadFinish = false;
                    this.removeFileObjects();
                }
            } else {
                this.handleFileSelectionCancel();
            }
        }
        handleFileSelectionCancel () {
            this.expectingFileUploadFinish = false;
            this.removeFileObjects();
            this.props.closeFileMenu();
        }
        handleFileReadError (error) {
            this.expectingFileUploadFinish = false;
            this.props.onLoadingFailed(error);
            this.props.onLoadingFinished(this.props.loadingState, false);
            this.removeFileObjects();
        }
        // step 4 is below, in mapDispatchToProps

        // step 5: called from componentDidUpdate when project state shows
        // that project data has finished "uploading" into the browser
        handleFinishedLoadingUpload () {
            this.expectingFileUploadFinish = false;
            if (this.fileToUpload && this.fileReader) {
                // begin to read data from the file. When finished,
                // cues step 6 using the reader's onload callback
                try {
                    this.fileReader.readAsArrayBuffer(this.fileToUpload);
                } catch (error) {
                    this.handleFileReadError(error);
                }
            } else {
                this.props.cancelFileUpload(this.props.loadingState);
                // skip ahead to step 7
                this.removeFileObjects();
            }
        }
        // used in step 6 below
        getProjectTitleFromFilename (fileInputFilename) {
            if (!fileInputFilename) return '';
            // only parse title with valid scratch project extensions
            // (.sb, .sb2, .sb3, .mwp, or .html)
            const matches = fileInputFilename.match(/^(.*)\.(?:sb[23]?|mwp|html)$/i);
            if (!matches) return '';
            return matches[1].substring(0, 100); // truncate project title to max 100 chars
        }
        // step 6: attached as a handler on our FileReader object; called when
        // file upload raw data is available in the reader
        async onload () {
            if (this.fileReader) {
                this.props.onLoadingStarted();
                const filename = this.fileToUpload && this.fileToUpload.name;
                let loadingSuccess = false;
                if (this.props.projectChanged) {
                    try {
                        await RestorePointAPI.createSafetyRestorePoint(this.props.vm, this.props.projectTitle);
                    } catch (restoreError) {
                        log.error('Failed to create safety restore point:', restoreError);
                    }
                }
                // tw: stop when loading new project
                this.props.vm.quit();
                let projectData = this.fileReader.result;
                const isMwp = filename && filename.toLowerCase().endsWith('.mwp');
                markProjectHistoryLoading();

                if (isMwp) {
                    try {
                        await importMwp(projectData);
                        projectData = await buildSb3FromCurrentRepo();
                        projectData = await projectData.arrayBuffer();
                    } catch (mwpError) {
                        log.error('Failed to open MistWarp project:', mwpError);
                        this.props.onLoadingFailed(mwpError);
                        this.props.onLoadingFinished(this.props.loadingState, false);
                        this.removeFileObjects();
                        return;
                    }
                }

                if (filename && filename.toLowerCase().endsWith('.html')) {
                    try {
                        const blob = new Blob([projectData], {type: 'text/html'});
                        const unpackaged = await unpackage(blob);
                        projectData = unpackaged.data;
                    } catch (error) {
                        log.error('Failed to unpackage HTML file:', error);
                        this.props.onLoadingFailed(error);
                        this.props.onLoadingFinished(this.props.loadingState, false);
                        this.removeFileObjects();
                        return;
                    }
                }

                // Snapshot the resolved bytes so the async handler below reads a
                // stable value (projectData may have been reassigned for .html).
                const loadedBytes = projectData;
                Promise.resolve()
                    .then(() => this.props.vm.loadProject(loadedBytes, {mwCanTrustProject: true}))
                    .then(async () => {
                        loadingSuccess = true;
                        if (filename) {
                            const uploadedProjectTitle = this.getProjectTitleFromFilename(filename);
                            this.props.onSetProjectTitle(uploadedProjectTitle);
                        }
                        try {
                            this.props.vm.renderer.draw();
                        } catch (drawError) {
                            log.error('Failed to draw loaded project:', drawError);
                        }
                        // Restore any git history embedded in the .sb3 (fractch tree + .git),
                        // or clear a stale repo if the loaded project has none.
                        try {
                            if (!isMwp) await importRepoFromSb3(loadedBytes);
                            await preloadProjectHistory(this.props.vm, {force: true});
                        } catch (gitError) {
                            log.error('Failed to restore embedded git history:', gitError);
                        }
                    })
                    .catch(error => {
                        log.error(error);
                        this.props.onLoadingFailed(error);
                    })
                    .then(() => {
                        this.props.onLoadingFinished(this.props.loadingState, loadingSuccess);
                        // go back to step 7: whether project loading succeeded
                        // or failed, reset file objects
                        this.removeFileObjects();
                    });
            }
        }
        // step 7: remove the <input> element from the DOM and clear reader and
        // fileToUpload reference, so those objects can be garbage collected
        removeFileObjects () {
            if (this.inputElement) {
                this.inputElement.value = null;
                this.inputElement.onchange = null;
                this.inputElement.oncancel = null;
                if (this.inputElement.parentNode) {
                    this.inputElement.parentNode.removeChild(this.inputElement);
                }
            }
            window.removeEventListener('focus', this.handleWindowFocus);
            this.handleWindowFocus = null;
            this.inputElement = null;
            this.fileReader = null;
            this.fileToUpload = null;
        }
        render () {
            const {
                /* eslint-disable no-unused-vars */
                cancelFileUpload,
                closeFileMenu: closeFileMenuProp,
                isLoadingUpload,
                isShowingWithoutId,
                loadingState,
                onLoadingFailed,
                onLoadingFinished,
                onLoadingStarted,
                openSimpleDialog: openSimpleDialogProp,
                onSetFileHandle,
                onSetProjectTitle,
                projectChanged,
                projectTitle,
                requestProjectUpload: requestProjectUploadProp,
                userOwnsProject,
                /* eslint-enable no-unused-vars */
                ...componentProps
            } = this.props;
            return (
                <React.Fragment>
                    <WrappedComponent
                        onStartSelectingFileUpload={this.handleStartSelectingFileUpload}
                        {...componentProps}
                    />
                </React.Fragment>
            );
        }
    }

    SBFileUploaderComponent.propTypes = {
        canSave: PropTypes.bool,
        cancelFileUpload: PropTypes.func,
        closeFileMenu: PropTypes.func,
        intl: intlShape.isRequired,
        isLoadingUpload: PropTypes.bool,
        isShowingProject: PropTypes.bool,
        isShowingWithoutId: PropTypes.bool,
        loadingState: PropTypes.oneOf(LoadingStates),
        onLoadingFailed: PropTypes.func,
        onLoadingFinished: PropTypes.func,
        onLoadingStarted: PropTypes.func,
        openSimpleDialog: PropTypes.func.isRequired,
        onSetProjectTitle: PropTypes.func,
        projectChanged: PropTypes.bool,
        projectTitle: PropTypes.string,
        requestProjectUpload: PropTypes.func,
        showOpenFilePicker: PropTypes.func,
        userOwnsProject: PropTypes.bool,
        vm: PropTypes.shape({
            loadProject: PropTypes.func,
            quit: PropTypes.func,
            renderer: PropTypes.shape({
                draw: PropTypes.func
            })
        }),
        onSetFileHandle: PropTypes.func
    };
    SBFileUploaderComponent.defaultProps = {
        showOpenFilePicker: typeof showOpenFilePicker === 'function' && !navigator.userAgent.includes('Android') ?
            window.showOpenFilePicker.bind(window) :
            null
    };
    const mapStateToProps = (state, ownProps) => {
        const loadingState = state.scratchGui.projectState.loadingState;
        const user = state.session && state.session.session && state.session.session.user;
        return {
            isLoadingUpload: getIsLoadingUpload(loadingState),
            isShowingProject: getIsShowingProject(loadingState),
            isShowingWithoutId: getIsShowingWithoutId(loadingState),
            loadingState: loadingState,
            projectChanged: state.scratchGui.projectChanged,
            projectTitle: state.scratchGui.projectTitle,
            userOwnsProject: ownProps.authorUsername && user &&
                (ownProps.authorUsername === user.username),
            vm: state.scratchGui.vm
        };
    };
    const mapDispatchToProps = (dispatch, ownProps) => ({
        cancelFileUpload: loadingState => dispatch(onLoadedProject(loadingState, false, false)),
        closeFileMenu: () => dispatch(closeFileMenu()),
        onLoadingFailed: error => {
            dispatch(setProjectError(error));
            dispatch(openInvalidProjectModal());
        },
        // transition project state from loading to regular, and close
        // loading screen and file menu
        onLoadingFinished: (loadingState, success) => {
            dispatch(onLoadedProject(loadingState, ownProps.canSave, success));
            dispatch(closeLoadingProject());
            dispatch(closeFileMenu());
        },
        // show project loading screen
        onLoadingStarted: () => dispatch(openLoadingProject()),
        openSimpleDialog: config => dispatch(openSimpleDialog(config)),
        onSetProjectTitle: title => dispatch(setProjectTitle(title)),
        // step 4: transition the project state so we're ready to handle the new
        // project data. When this is done, the project state transition will be
        // noticed by componentDidUpdate()
        requestProjectUpload: loadingState => dispatch(requestProjectUpload(loadingState)),
        onSetFileHandle: fileHandle => dispatch(setFileHandle(fileHandle))
    });
    // Allow incoming props to override redux-provided props. Used to mock in tests.
    const mergeProps = (stateProps, dispatchProps, ownProps) => Object.assign(
        {}, stateProps, dispatchProps, ownProps
    );
    return injectIntl(connect(
        mapStateToProps,
        mapDispatchToProps,
        mergeProps
    )(SBFileUploaderComponent));
};

export {
    SBFileUploaderHOC as default
};
