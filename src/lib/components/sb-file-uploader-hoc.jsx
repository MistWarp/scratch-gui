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
import {adoptImportedProjectHistory, markProjectHistoryLoading, preloadProjectHistory} from '../git/project-history.js';
import {
    getRememberedPlatformProjectState
} from '../community/publish.js';
import {detachWorkspace} from '../workspace-state.js';
import {withProjectReplacement} from '../project-replacement.js';

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
            // Older browsers may not emit cancel for file inputs. Allow another
            // attempt while waiting for selection, but never interrupt a selected file.
            if (this.expectingFileUploadFinish && (!this.inputElement || this.fileToUpload)) return false;
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
                        await this.handleChange({
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
                        this.handleFileReadError(err);
                    }
                })();
            } else {
                // create <input> element and add it to DOM
                this.inputElement = document.createElement('input');
                this.inputElement.style = 'display: none;';
                this.inputElement.type = 'file';
                this.inputElement.onchange = this.handleChange; // connects to step 3
                this.inputElement.oncancel = this.handleFileSelectionCancel;
                // Focus can return before the browser delivers change/files.
                // Only the input's cancel event can reliably identify cancellation.
                document.body.appendChild(this.inputElement);
                // simulate a click to open file chooser dialog
                this.inputElement.click();
            }
        }
        // step 3: user has picked a file using the file chooser dialog.
        // We don't actually load the file here, we only decide whether to do so.
        confirmProjectReplacement (platformProject) {
            if (platformProject && platformProject.id) {
                const isMwp = /\.mwp$/i.test(this.fileToUpload.name);
                const format = (id, defaultMessage) => this.props.intl.formatMessage({id, defaultMessage});
                return new Promise(resolve => this.props.openSimpleDialog({
                    type: 'confirm',
                    title: format('gui.projectLoader.diskDestinationTitle', 'Open project from computer'),
                    message: isMwp ? format('gui.projectLoader.mwpDestinationMessage',
                        'New workspace opens this file separately. Your saved MistWarp project stays intact. ' +
                        'Replace project and history keeps the current save destination and replaces all its code, ' +
                        'commits and branches on your next manual save. A device backup keeps your current code.') :
                        format('gui.projectLoader.diskDestinationMessage',
                            'New workspace opens this file separately. Your saved MistWarp project stays intact. ' +
                            'Replace project keeps the current save destination and replaces its code on your next ' +
                            'manual save, keeping its history. A device backup keeps your current code.'),
                    choices: [
                        {value: 'new', label: format('gui.projectLoader.newWorkspace', 'Open in new workspace')},
                        {value: 'overwrite',
                            label: isMwp ? format('gui.projectLoader.replaceHistory', 'Replace project and history') :
                                format('gui.projectLoader.replaceCode', 'Replace project')}
                    ],
                    onOk: value => resolve(value),
                    onCancel: () => resolve(false)
                }));
            }
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
                const platformProject = getRememberedPlatformProjectState();
                if (platformProject || userOwnsProject || projectChanged) {
                    uploadAllowed = await this.confirmProjectReplacement(platformProject);
                }
                this.uploadDestination = uploadAllowed === 'new' ? 'new' : 'overwrite';
                if (uploadAllowed && !this.unmounted) {
                    this.pendingFileHandle = thisFileInput.handle && /\.sb3$/i.test(this.fileToUpload.name) ?
                        thisFileInput.handle : null;

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
            if (!this.fileReader) return;
            this.props.onLoadingStarted();
            const filename = this.fileToUpload && this.fileToUpload.name;
            const isMwp = /\.mwp$/i.test(filename || '');
            const platform = this.uploadDestination === 'new' ? null : getRememberedPlatformProjectState();
            let projectData = this.fileReader.result;
            let importedManifest;
            let loadingSuccess = false;
            try {
                if (/\.html$/i.test(filename || '')) {
                    // The selected file is private to this upload operation.
                    // eslint-disable-next-line require-atomic-updates
                    projectData = (await unpackage(new Blob([projectData], {type: 'text/html'}))).data;
                }
                await withProjectReplacement(this.props.vm, this.props.projectTitle || 'Before opening a file',
                    async () => {
                        markProjectHistoryLoading();
                        if (isMwp) {
                            importedManifest = await importMwp(projectData);
                            // eslint-disable-next-line require-atomic-updates
                            projectData = await (await buildSb3FromCurrentRepo()).arrayBuffer();
                        }
                        this.props.vm.quit();
                        await this.props.vm.loadProject(projectData, {
                            mwCanTrustProject: true, skipGitImport: true, mwPreserveProjectSource: true
                        });
                        // SB files replacing an online project change its code, not its history.
                        if (!isMwp && !platform) await importRepoFromSb3(projectData);
                    });
                if (!platform) {
                    detachWorkspace(this.props.vm);
                } else if (isMwp) {
                    this.props.vm._mwRequireExplicitPush = true;
                    this.props.vm._mwApprovedRemotes = new Set();
                    adoptImportedProjectHistory(this.props.vm, importedManifest, platform);
                }
                // Only an explicit save may publish the imported code/history.
                this.props.vm._mwPendingDiskOverwrite = Boolean(platform);
                this.props.onSetFileHandle(this.pendingFileHandle || null);
                if (filename) this.props.onSetProjectTitle(this.getProjectTitleFromFilename(filename));
                loadingSuccess = true;
                try {
                    this.props.vm.renderer.draw();
                } catch (error) {
                    log.error('Could not draw loaded project:', error);
                }
            } catch (error) {
                log.error(error);
                this.props.onLoadingFailed(error);
            } finally {
                try {
                    await preloadProjectHistory(this.props.vm, {force: true});
                } catch (error) {
                    log.error('Could not refresh project history:', error);
                }
                this.props.onLoadingFinished(this.props.loadingState, loadingSuccess);
                this.removeFileObjects();
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
            this.inputElement = null;
            this.fileReader = null;
            this.fileToUpload = null;
            this.uploadDestination = null;
            this.pendingFileHandle = null;
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
            _mwPendingDiskOverwrite: PropTypes.bool,
            _mwRequireExplicitPush: PropTypes.bool,
            _mwApprovedRemotes: PropTypes.object,
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
