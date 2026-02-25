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
    BLOCKS_TAB_INDEX,
    COSTUMES_TAB_INDEX,
    SOUNDS_TAB_INDEX
} from '../reducers/editor-tab';
import {STAGE_SIZE_MODES} from '../lib/constants/layout-constants';
import {setStageSize} from '../reducers/stage-size';
import {setFullScreen} from '../reducers/mode';
import collaborationService from '../lib/collaboration-service.js';

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
    openRestorePointModal,
    openShortcutManagerModal,
    openSimpleDialog
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
import {setIsScratchDesktop} from '../lib/utils/isScratchDesktop.js';
import TWFullScreenResizerHOC from '../lib/components/tw-fullscreen-resizer-hoc.jsx';
import TWThemeManagerHOC from './tw-theme-manager-hoc.jsx';
import {initialize as initializeShortcuts} from
    '../lib/shortcuts/event-router.js';

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
                activateTab: this.props.activateTab
            },
            this.props.vm,
            {
                loadFromComputer: this.props.onStartSelectingFileUpload,
                openPackager: this.props.onClickPackager,
                toggleStageSize: () => {
                    this.props.onSetStageSize(
                        this.props.stageSizeMode === STAGE_SIZE_MODES.large 
                            ? STAGE_SIZE_MODES.small 
                            : STAGE_SIZE_MODES.large
                    );
                },
                setFullScreen: () => {
                    this.props.onSetFullScreen(!this.props.isFullScreen);
                }
            }
        );
    }
    componentDidUpdate (prevProps) {
        if (this.props.projectId !== prevProps.projectId) {
            if (this.props.projectId !== null) {
                this.props.onUpdateProjectId(this.props.projectId);
            }
            setProjectIdMetadata(this.props.projectId);
        }
        if (this.props.isShowingProject && !prevProps.isShowingProject) {
            // this only notifies container when a project changes from not yet loaded to loaded
            // At this time the project view in www doesn't need to know when a project is unloaded

            // Log total loading time
            if (window.MISTWARP_LOAD_START_TIME) {
                const totalLoadTime = Date.now() - window.MISTWARP_LOAD_START_TIME;
                console.log(`🚀 MistWarp project loaded in ${totalLoadTime}ms (${(totalLoadTime / 1000).toFixed(2)}s)`);

                // Also use Performance API if available
                if (window.performance && window.performance.mark && window.performance.measure) {
                    window.performance.mark('mistwarp-load-end');
                    window.performance.measure('mistwarp-total-load', 'mistwarp-load-start', 'mistwarp-load-end');
                }
            }

            this.props.onProjectLoaded();
        }

        // Sync costume when tab changes from costumes tab
        if (prevProps.activeTabIndex === COSTUMES_TAB_INDEX &&
            this.props.activeTabIndex !== COSTUMES_TAB_INDEX) {
            if (collaborationService) {
                const serviceInstance = collaborationService.getInstance();
                if (serviceInstance) {
                    serviceInstance.syncCurrentCostume();
                }
            }
        }
    }
    render () {
        if (this.props.isError) {
            throw this.props.error;
        }
        const {
            /* eslint-disable no-unused-vars */
            activateTab,
            assetHost,
            cloudHost,
            error,
            isError,
            isScratchDesktop,
            isShowingProject,
            manualUpdateProject,
            onProjectLoaded,
            onStorageInit,
            onUpdateProjectId,
            onVmInit,
            openCostumeLibrary,
            openExtensionManagerModal,
            openRestorePointModal,
            openSettingsModal,
            openSoundLibrary,
            openSpriteLibrary,
            projectHost,
            projectId,
            requestNewProject,
            saveProjectAsCopy,
            /* eslint-enable no-unused-vars */
            children,
            fetchingProject,
            isLoading,
            loadingStateVisible,
            ...componentProps
        } = this.props;
        return (
            <GUIComponent
                loading={fetchingProject || isLoading || loadingStateVisible}
                {...componentProps}
            >
                {children}
            </GUIComponent>
        );
    }
}

GUI.propTypes = {
    assetHost: PropTypes.string,
    children: PropTypes.node,
    cloudHost: PropTypes.string,
    error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    fetchingProject: PropTypes.bool,
    intl: intlShape,
    isError: PropTypes.bool,
    isEmbedded: PropTypes.bool,
    isFullScreen: PropTypes.bool,
    isLoading: PropTypes.bool,
    isScratchDesktop: PropTypes.bool,
    isShowingProject: PropTypes.bool,
    isTotallyNormal: PropTypes.bool,
    loadingStateVisible: PropTypes.bool,
    onProjectLoaded: PropTypes.func,
    onSeeCommunity: PropTypes.func,
    onStorageInit: PropTypes.func,
    onUpdateProjectId: PropTypes.func,
    onVmInit: PropTypes.func,
    projectHost: PropTypes.string,
    projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    telemetryModalVisible: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired,
    activeTabIndex: PropTypes.number
};

GUI.defaultProps = {
    isScratchDesktop: false,
    isTotallyNormal: false,
    onStorageInit: storageInstance => storageInstance.addOfficialScratchWebStores(),
    onProjectLoaded: () => {},
    onUpdateProjectId: () => {},
    onVmInit: (/* vm */) => {}
};

const mapStateToProps = state => {
    const loadingState = state.scratchGui.projectState.loadingState;
    return {
        activeTabIndex: state.scratchGui.editorTab.activeTabIndex,
        alertsVisible: state.scratchGui.alerts.visible,
        backdropLibraryVisible: state.scratchGui.modals.backdropLibrary,
        blocksTabVisible: state.scratchGui.editorTab.activeTabIndex === BLOCKS_TAB_INDEX,
        cardsVisible: state.scratchGui.cards.visible,
        connectionModalVisible: state.scratchGui.modals.connectionModal,
        costumeLibraryVisible: state.scratchGui.modals.costumeLibrary,
        costumesTabVisible: state.scratchGui.editorTab.activeTabIndex === COSTUMES_TAB_INDEX,
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
        soundLibraryVisible: state.scratchGui.modals.soundLibrary,
        soundsTabVisible: state.scratchGui.editorTab.activeTabIndex === SOUNDS_TAB_INDEX,
        targetIsStage: (
            state.scratchGui.targets.stage &&
            state.scratchGui.targets.stage.id === state.scratchGui.targets.editingTarget
        ),
        telemetryModalVisible: state.scratchGui.modals.telemetryModal,
        tipsLibraryVisible: state.scratchGui.modals.tipsLibrary,
        usernameModalVisible: state.scratchGui.modals.usernameModal,
        settingsModalVisible: state.scratchGui.modals.settingsModal,
        customExtensionModalVisible: state.scratchGui.modals.customExtensionModal,
        fontsModalVisible: state.scratchGui.modals.fontsModal,
        unknownPlatformModalVisible: state.scratchGui.modals.unknownPlatformModal,
        invalidProjectModalVisible: state.scratchGui.modals.invalidProjectModal,
        gitModalVisible: state.scratchGui.modals.gitModal,
        vm: state.scratchGui.vm
    };
};

const mapDispatchToProps = dispatch => ({
    onExtensionButtonClick: () => dispatch(openExtensionLibrary()),
    onActivateTab: tab => dispatch(activateTab(tab)),
    onActivateCostumesTab: () => dispatch(activateTab(COSTUMES_TAB_INDEX)),
    onActivateSoundsTab: () => dispatch(activateTab(SOUNDS_TAB_INDEX)),
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
    openSpriteLibrary: () => dispatch(openSpriteLibrary()),
    openCostumeLibrary: () => dispatch(openCostumeLibrary()),
    openSoundLibrary: () => dispatch(openSoundLibrary()),
    openExtensionManagerModal: () => dispatch(openExtensionManagerModal()),
    openSettingsModal: () => dispatch(openSettingsModal()),
    openRestorePointModal: () => dispatch(openRestorePointModal())
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
export default WrappedGui;
