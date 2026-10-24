import PropTypes from 'prop-types';
import React from 'react';
import {compose} from 'redux';
import {connect} from 'react-redux';
import ReactModal from 'react-modal';
import VM from 'scratch-vm';
import {injectIntl, intlShape} from 'react-intl';

import ErrorBoundaryHOC from '../lib/components/error-boundary-hoc.jsx';
import {
    getIsError,
    getIsShowingProject,
    requestNewProject,
    manualUpdateProject,
    saveProjectAsCopy
} from '../reducers/project-state';
import {
    activateTab,
    showBlocksTab,
    storeEditorMode,
    BLOCKS_TAB_INDEX,
    CODE_MODE
} from '../reducers/editor-tab';
import {
    isBlocksEditorVisible,
    isCostumesTabVisible,
    isSoundsTabVisible,
    getActiveAssetEditor
} from '../lib/editor-visibility.js';
import {toggleEditorMode} from '../lib/code-mode/mode-switch.js';
import {isAssetEditorActive} from '../lib/code-mode/key-scope.js';
import {STAGE_SIZE_MODES} from '../lib/constants/layout-constants';
import {setStageSize} from '../reducers/stage-size';
import {setProjectUnchanged} from '../reducers/project-changed';
import {setFullScreen} from '../reducers/mode';
import {removeRestore, setRestore} from '../reducers/restore-deletion';
import {showStandardAlert} from '../reducers/alerts';

import {
    closeCostumeLibrary,
    closeBackdropLibrary,
    closeSoundLibrary,
    closeTelemetryModal,
    openExtensionLibrary,
    closeExtensionLibrary,
    openCustomExtensionModal,
    openExtensionManagerModal,
    openSpriteLibrary,
    openCostumeLibrary,
    openSoundLibrary,
    openSettingsModal,
    openRestorePointModal
} from '../reducers/modals';

import FontLoaderHOC from '../lib/components/font-loader-hoc.jsx';
import LocalizationHOC from '../lib/components/localization-hoc.jsx';
import SBFileUploaderHOC from '../lib/components/sb-file-uploader-hoc.jsx';
import SB3PostMessageHOC from '../lib/components/sb3-postmessage-hoc.jsx';
import ProjectFetcherHOC from '../lib/components/project-fetcher-hoc.jsx';
import TitledHOC from '../lib/components/titled-hoc.jsx';
import ProjectSaverHOC from '../lib/components/project-saver-hoc.jsx';
import storage from '../lib/persistence/storage';
import vmListenerHOC from '../lib/components/vm-listener-hoc.jsx';
import vmManagerHOC from '../lib/components/vm-manager-hoc.jsx';
import cloudManagerHOC from '../lib/components/cloud-manager-hoc.jsx';

import GUIComponent from '../components/gui/gui.jsx';
import ProjectLoadError, {isProjectLoadError} from '../components/project-load-error/project-load-error.jsx';
import {setIsScratchDesktop} from '../lib/utils/isScratchDesktop.js';
import TWFullScreenResizerHOC from '../lib/components/tw-fullscreen-resizer-hoc.jsx';
import TWThemeManagerHOC from './tw-theme-manager-hoc.jsx';
import {dispose as disposeShortcuts, initialize as initializeShortcuts} from
    '../lib/shortcuts/event-router.js';
import startFractchLiveReload from '../lib/fractch-live';
import LazyScratchBlocks from '../lib/tw-lazy-scratch-blocks.js';
import {undoLatest} from '../lib/undo-history';
import {attachCodeMode} from '../lib/code-mode/text-controller.js';
import {projectIdentity} from '../lib/code-mode/code-drafts.js';
import {latestRedo, latestUndo} from '../lib/code-mode/code-history.js';
import {flushBlockly, isCollaborating as isCodeLocked} from '../lib/code-mode/apply-pipeline.js';
import {runCodeHistory} from '../lib/code-mode/code-dialogs.js';
import smartSave from '../lib/mw/smart-save.js';
import MwAutosave from './mw-autosave.jsx';
import MwCreatorSession from './mw-creator-session.jsx';

const {RequestMetadata, setMetadata, unsetMetadata} = storage.scratchFetch;

const setProjectIdMetadata = projectId => {
    // If project ID is '0' or zero, it's not a real project ID. In that case, remove the project ID metadata.
    // Same if it's null undefined.
    if (projectId && projectId !== '0') {
        setMetadata(RequestMetadata.ProjectId, projectId);
    } else {
        unsetMetadata(RequestMetadata.ProjectId);
    }
};

class GUI extends React.Component {
    componentDidMount () {
        setIsScratchDesktop(this.props.isScratchDesktop);
        this.props.onStorageInit(storage);
        this.props.onVmInit(this.props.vm);
        setProjectIdMetadata(this.props.projectId);
        this.detachCodeMode = attachCodeMode(this.props.vm, {
            getIdentity: () => projectIdentity({
                projectId: this.props.projectId,
                fileHandle: this.props.fileHandle,
                isScratchDesktop: this.props.isScratchDesktop
            })
        });

        initializeShortcuts(
            {
                requestNewProject: this.props.requestNewProject,
                manualUpdateProject: this.props.manualUpdateProject,
                saveProjectAsCopy: this.props.saveProjectAsCopy,
                openSettingsModal: this.props.openSettingsModal,
                openSpriteLibrary: this.props.openSpriteLibrary,
                openCostumeLibrary: this.props.openCostumeLibrary,
                openSoundLibrary: this.props.openSoundLibrary,
                openExtensionLibrary: this.props.onOpenExtensionLibrary,
                openExtensionManagerModal: this.props.openExtensionManagerModal,
                openRestorePointModal: this.props.openRestorePointModal,
                activateTab: this.props.showBlocksTab
            },
            this.props.vm,
            {
                saveSmart: () => smartSave({
                    vm: this.props.vm,
                    title: this.props.projectTitle,
                    onSaved: this.props.onProjectUnchanged
                }),
                loadFromComputer: this.props.onStartSelectingFileUpload,
                openPackager: this.props.onClickPackager,
                duplicateSprite: () => this.props.onDuplicateEditingSprite(this.props.vm),
                deleteSprite: () => this.props.onDeleteEditingSprite(this.props.vm),
                undo: () => this.handleUndo(),
                redo: () => this.handleRedo(),
                toggleEditorMode: () => {
                    toggleEditorMode({
                        dispatch: this.props.dispatchAction,
                        vm: this.props.vm,
                        isCode: this.props.editorMode === CODE_MODE,
                        blocksVisible: this.props.blocksTabVisible
                    });
                    return true;
                },
                toggleStageSize: () => {
                    this.props.onSetStageSize(
                        this.props.stageSizeMode === STAGE_SIZE_MODES.large ?
                            STAGE_SIZE_MODES.small :
                            STAGE_SIZE_MODES.large
                    );
                },
                setFullScreen: () => {
                    this.props.onSetFullScreen(!this.props.isFullScreen);
                },
                getMode: () => ({
                    isEmbedded: this.props.isEmbedded,
                    isPlayerOnly: this.props.isPlayerOnly
                })
            }
        );

        this.fractchLiveReloadDispose = startFractchLiveReload(this.props.vm, {
            dispatch: this.props.dispatchAction,
            intl: this.props.intl
        });
    }
    componentDidUpdate (prevProps) {
        if (this.props.editorMode !== prevProps.editorMode && !this.props.isPlayerOnly) {
            storeEditorMode(this.props.editorMode);
        }
        if (this.props.projectId !== prevProps.projectId) {
            if (this.props.projectId !== null) {
                this.props.onUpdateProjectId(this.props.projectId);
            }
            setProjectIdMetadata(this.props.projectId);
        }
        if (this.props.isShowingProject && !prevProps.isShowingProject) {
            // this only notifies container when a project changes from not yet loaded to loaded
            // At this time the project view in www doesn't need to know when a project is unloaded

            if (window.MISTWARP_LOAD_START_TIME) {
                if (window.performance && window.performance.mark && window.performance.measure) {
                    window.performance.mark('mistwarp-load-end');
                    window.performance.measure('mistwarp-total-load', 'mistwarp-load-start', 'mistwarp-load-end');
                }
            }

            this.props.onProjectLoaded();
        }

    }
    componentWillUnmount () {
        disposeShortcuts();
        if (this.detachCodeMode) this.detachCodeMode();
        if (this.fractchLiveReloadDispose) {
            this.fractchLiveReloadDispose();
            this.fractchLiveReloadDispose = null;
        }
    }
    getMainWorkspace () {
        if (!LazyScratchBlocks.isLoaded()) return null;
        const workspace = LazyScratchBlocks.get().getMainWorkspace();
        if (!workspace || typeof workspace.undo !== 'function') return null;
        return workspace;
    }
    blocksWorkspace () {
        if (this.props.editorMode === CODE_MODE || !this.props.blocksTabVisible) return null;
        return this.getMainWorkspace();
    }
    assetEditorOwnsKeys () {
        if (this.props.editorMode !== CODE_MODE) return !this.props.blocksTabVisible;
        return Boolean(this.props.activeAssetEditor) && isAssetEditorActive();
    }
    codeHistoryTarget () {
        if (this.props.editorMode === CODE_MODE) return null;
        return this.props.vm.editingTarget ? this.props.vm.editingTarget.id : null;
    }
    runCode (direction, entry) {
        return runCodeHistory({
            vm: this.props.vm,
            dispatch: this.props.dispatchAction,
            intl: this.props.intl,
            direction,
            entry
        });
    }
    handleRedo () {
        if (this.assetEditorOwnsKeys()) return false;
        const workspace = this.blocksWorkspace();
        const hasWorkspaceRedo = Boolean(workspace) && (workspace.redoStack_ ? workspace.redoStack_.length > 0 : true);
        if (hasWorkspaceRedo) {
            workspace.undo(true);
            return true;
        }
        const entry = isCodeLocked(this.props.vm) ? null : latestRedo(this.codeHistoryTarget());
        if (!entry) return false;
        this.runCode('redo', entry);
        return true;
    }
    handleUndo () {
        if (this.assetEditorOwnsKeys()) return false;
        flushBlockly(this.props.vm);
        const entry = isCodeLocked(this.props.vm) ? null : latestUndo(this.codeHistoryTarget());
        return undoLatest({
            workspace: this.blocksWorkspace(),
            deletion: this.props.restoreDeletion,
            code: entry ? {sequence: entry.sequence, undo: () => this.runCode('undo', entry)} : null,
            onRestored: this.props.onClearDeletionRestore,
            onRestoreError: this.props.onShowRestoreError
        });
    }
    render () {
        if (this.props.isError) {
            if (isProjectLoadError(this.props.error)) {
                return (
                    <ProjectLoadError
                        error={this.props.error}
                        isEmbedded={this.props.isEmbedded}
                    />
                );
            }
            throw this.props.error;
        }
        if (this.props.projectFetchError) {
            return (
                <ProjectLoadError
                    error={this.props.projectFetchError}
                    isEmbedded={this.props.isEmbedded}
                    onRetry={this.props.onRetryProjectFetch}
                />
            );
        }
        const {
            /* eslint-disable no-unused-vars */
            activateTab: _activateTab,
            activeAssetEditor,
            dispatchAction,
            showBlocksTab: _showBlocksTab,
            assetHost,
            cloudHost,
            error,
            fileHandle,
            isError,
            isScratchDesktop,
            isShowingProject,
            manualUpdateProject: _manualUpdateProject,
            onClearDeletionRestore,
            onDeleteEditingSprite,
            onDuplicateEditingSprite,
            onProjectLoaded,
            onRetryProjectFetch,
            onShowRestoreError,
            onStorageInit,
            onUpdateProjectId,
            onVmInit,
            openCostumeLibrary: _openCostumeLibrary,
            openExtensionManagerModal: _openExtensionManagerModal,
            openRestorePointModal: _openRestorePointModal,
            openSettingsModal: _openSettingsModal,
            openSoundLibrary: _openSoundLibrary,
            openSpriteLibrary: _openSpriteLibrary,
            projectHost,
            projectFetchError,
            projectId,
            projectTitle,
            requestNewProject: _requestNewProject,
            restoreDeletion,
            saveProjectAsCopy: _saveProjectAsCopy,
            onProjectUnchanged,
            /* eslint-enable no-unused-vars */
            children,
            fetchingProject,
            isLoading,
            loadingStateVisible,
            ...componentProps
        } = this.props;
        return (
            <React.Fragment>
                <GUIComponent
                    loading={fetchingProject || isLoading || loadingStateVisible}
                    {...componentProps}
                >
                    {children}
                </GUIComponent>
                <MwAutosave />
                <MwCreatorSession />
            </React.Fragment>
        );
    }
}

GUI.propTypes = {
    activateTab: PropTypes.func,
    assetHost: PropTypes.string,
    children: PropTypes.node,
    cloudHost: PropTypes.string,
    error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    fetchingProject: PropTypes.bool,
    intl: intlShape,
    isPlayerOnly: PropTypes.bool,
    isError: PropTypes.bool,
    isEmbedded: PropTypes.bool,
    isFullScreen: PropTypes.bool,
    isLoading: PropTypes.bool,
    fileHandle: PropTypes.object,
    isScratchDesktop: PropTypes.bool,
    isShowingProject: PropTypes.bool,
    loadingStateVisible: PropTypes.bool,
    manualUpdateProject: PropTypes.func,
    onClickPackager: PropTypes.func,
    onOpenExtensionLibrary: PropTypes.func,
    onProjectLoaded: PropTypes.func,
    onSetFullScreen: PropTypes.func,
    onSetStageSize: PropTypes.func,
    onStartSelectingFileUpload: PropTypes.func,
    onRetryProjectFetch: PropTypes.func,
    projectFetchError: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    onDeleteEditingSprite: PropTypes.func,
    onDuplicateEditingSprite: PropTypes.func,
    onClearDeletionRestore: PropTypes.func,
    onShowRestoreError: PropTypes.func,
    onStorageInit: PropTypes.func,
    onUpdateProjectId: PropTypes.func,
    onVmInit: PropTypes.func,
    openCostumeLibrary: PropTypes.func,
    openExtensionManagerModal: PropTypes.func,
    openRestorePointModal: PropTypes.func,
    openSettingsModal: PropTypes.func,
    openSoundLibrary: PropTypes.func,
    openSpriteLibrary: PropTypes.func,
    projectHost: PropTypes.string,
    projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    projectTitle: PropTypes.string,
    requestNewProject: PropTypes.func,
    restoreDeletion: PropTypes.shape({
        deletedItem: PropTypes.string,
        restoreFun: PropTypes.func,
        sequence: PropTypes.number
    }),
    onProjectUnchanged: PropTypes.func,
    saveProjectAsCopy: PropTypes.func,
    stageSizeMode: PropTypes.oneOf(Object.keys(STAGE_SIZE_MODES)),
    telemetryModalVisible: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired,
    activeTabIndex: PropTypes.number,
    activeAssetEditor: PropTypes.object,
    blocksTabVisible: PropTypes.bool,
    dispatchAction: PropTypes.func,
    editorMode: PropTypes.string,
    showBlocksTab: PropTypes.func
};

GUI.defaultProps = {
    isScratchDesktop: false,
    onStorageInit: storageInstance => storageInstance.addOfficialScratchWebStores(),
    onProjectLoaded: () => {},
    onUpdateProjectId: () => {},
    onVmInit: (/* vm */) => {}
};

const mapStateToProps = state => {
    const loadingState = state.scratchGui.projectState.loadingState;
    return {
        activeTabIndex: state.scratchGui.editorTab.activeTabIndex,
        activeAssetEditor: getActiveAssetEditor(state),
        alertsVisible: state.scratchGui.alerts.visible,
        backdropLibraryVisible: state.scratchGui.modals.backdropLibrary,
        blocksTabVisible: isBlocksEditorVisible(state),
        connectionModalVisible: state.scratchGui.modals.connectionModal,
        costumeLibraryVisible: state.scratchGui.modals.costumeLibrary,
        costumesTabVisible: isCostumesTabVisible(state),
        editorMode: state.scratchGui.editorTab.editorMode,
        error: state.scratchGui.projectState.error,
        extensionLibraryVisible: state.scratchGui.modals.extensionLibrary,
        isError: getIsError(loadingState),
        isEmbedded: state.scratchGui.mode.isEmbedded,
        isFullScreen: state.scratchGui.mode.isFullScreen || state.scratchGui.mode.isEmbedded,
        isPlayerOnly: state.scratchGui.mode.isPlayerOnly,
        isRtl: state.locales.isRtl,
        isShowingProject: getIsShowingProject(loadingState),
        loadingStateVisible: state.scratchGui.modals.loadingProject,
        projectId: state.scratchGui.projectState.projectId,
        fileHandle: state.scratchGui.tw.fileHandle,
        projectTitle: state.scratchGui.projectTitle,
        restoreDeletion: state.scratchGui.restoreDeletion,
        soundLibraryVisible: state.scratchGui.modals.soundLibrary,
        soundRecorderVisible: state.scratchGui.modals.soundRecorder,
        soundsTabVisible: isSoundsTabVisible(state),
        // The toggle-stage-size shortcut needs the current size to pick the other one.
        stageSizeMode: state.scratchGui.stageSize.stageSize,
        targetIsStage: (
            state.scratchGui.targets.stage &&
            state.scratchGui.targets.stage.id === state.scratchGui.targets.editingTarget
        ),
        telemetryModalVisible: state.scratchGui.modals.telemetryModal,
        usernameModalVisible: state.scratchGui.modals.usernameModal,
        settingsModalVisible: state.scratchGui.modals.settingsModal,
        customExtensionModalVisible: state.scratchGui.modals.customExtensionModal,
        fontsModalVisible: state.scratchGui.modals.fontsModal,
        assetsModalVisible: state.scratchGui.modals.assetsModal,
        unknownPlatformModalVisible: state.scratchGui.modals.unknownPlatformModal,
        invalidProjectModalVisible: state.scratchGui.modals.invalidProjectModal,
        gitModalVisible: state.scratchGui.modals.gitModal,
        projectMetadataModalVisible: state.scratchGui.modals.projectMetadataModal,
        vm: state.scratchGui.vm
    };
};

export const mapDispatchToProps = dispatch => ({
    onExtensionButtonClick: () => dispatch(openExtensionLibrary()),
    onActivateTab: tab => dispatch(showBlocksTab(tab)),
    dispatchAction: action => dispatch(action),
    showBlocksTab: tab => dispatch(showBlocksTab(tab)),
    onOpenExtensionLibrary: () => dispatch(openExtensionLibrary()),
    onOpenExtensionManagerModal: () => dispatch(openExtensionManagerModal()),
    onOpenCustomExtensionModal: () => dispatch(openCustomExtensionModal()),
    onRequestCloseBackdropLibrary: () => dispatch(closeBackdropLibrary()),
    onRequestCloseCostumeLibrary: () => dispatch(closeCostumeLibrary()),
    onRequestCloseSoundLibrary: () => dispatch(closeSoundLibrary()),
    onRequestCloseExtensionLibrary: () => dispatch(closeExtensionLibrary()),
    onRequestCloseTelemetryModal: () => dispatch(closeTelemetryModal()),
    activateTab: tab => dispatch(activateTab(tab)),
    onSetStageSize: stageSize => dispatch(setStageSize(stageSize)),
    onSetFullScreen: isOpen => dispatch(setFullScreen(isOpen)),
    requestNewProject: needSave => dispatch(requestNewProject(needSave)),
    manualUpdateProject: () => dispatch(manualUpdateProject()),
    saveProjectAsCopy: () => dispatch(saveProjectAsCopy()),
    onProjectUnchanged: () => dispatch(setProjectUnchanged()),
    openSpriteLibrary: () => dispatch(openSpriteLibrary()),
    openCostumeLibrary: () => dispatch(openCostumeLibrary()),
    openSoundLibrary: () => dispatch(openSoundLibrary()),
    openExtensionManagerModal: () => dispatch(openExtensionManagerModal()),
    openSettingsModal: () => dispatch(openSettingsModal()),
    openRestorePointModal: () => dispatch(openRestorePointModal()),
    onClearDeletionRestore: restoreFun => dispatch(removeRestore(restoreFun)),
    onShowRestoreError: () => dispatch(showStandardAlert('assetRestoreError')),
    onDuplicateEditingSprite: vm => {
        const target = vm && vm.editingTarget;
        if (!target || target.isStage || typeof vm.duplicateSprite !== 'function') return Promise.resolve(false);
        return Promise.resolve()
            .then(() => vm.duplicateSprite(target.id))
            .then(() => true)
            .catch(() => {
                dispatch(showStandardAlert('assetImportError'));
                return false;
            });
    },
    onDeleteEditingSprite: vm => {
        const target = vm && vm.editingTarget;
        if (!target || target.isStage || typeof vm.deleteSprite !== 'function') return false;
        try {
            const restoreSprite = vm.deleteSprite(target.id);
            if (typeof restoreSprite !== 'function') return false;
            dispatch(setRestore({
                restoreFun: () => Promise.resolve()
                    .then(() => restoreSprite())
                    .then(() => dispatch(activateTab(BLOCKS_TAB_INDEX))),
                deletedItem: 'Sprite'
            }));
            return true;
        } catch (error) {
            dispatch(showStandardAlert('assetDeleteError'));
            return false;
        }
    }
});

const ConnectedGUI = injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(GUI));

// note that redux's 'compose' function is just being used as a general utility to make
// the hierarchy of HOC constructor calls clearer here; it has nothing to do with redux's
// ability to compose reducers.
const WrappedGui = compose(
    LocalizationHOC,
    ErrorBoundaryHOC('Top Level App'),
    TWThemeManagerHOC, // componentDidUpdate() needs to run very early for icons to update immediately
    TWFullScreenResizerHOC,
    FontLoaderHOC,
    // QueryParserHOC, // tw: HOC is unused
    ProjectFetcherHOC,
    SB3PostMessageHOC, // Handle postMessage events for SB3 loading
    TitledHOC,
    ProjectSaverHOC,
    vmListenerHOC,
    vmManagerHOC,
    SBFileUploaderHOC,
    cloudManagerHOC
)(ConnectedGUI);

WrappedGui.setAppElement = ReactModal.setAppElement;
export {GUI};
export default WrappedGui;
