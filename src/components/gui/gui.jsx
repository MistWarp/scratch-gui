import PropTypes from 'prop-types';
import React, {useMemo} from 'react';
import {injectIntl, intlShape} from 'react-intl';
import {connect} from 'react-redux';
import MediaQuery from 'react-responsive';
import VM from 'scratch-vm';

import Loader from '../loader/loader.jsx';
import Box from '../box/box.jsx';
import {getActiveWorkspace} from '../../modules/blocks-registry';
import ChatDock from '../mw-chat/chat-dock.jsx';
import PanelErrorBoundary from '../panel-error-boundary/panel-error-boundary.jsx';
import {closeChat} from '../../lib/originchats/chat-ui.js';
import {closeRoturLoginModal} from '../../reducers/modals.js';
import {STAGE_SIZE_MODES} from '../../lib/constants/layout-constants';
import {resolveStageSize} from '../../lib/utils/screen';
import {Theme} from '../../lib/themes';
import {CODE_MODE} from '../../reducers/editor-tab';
import {setStageSize} from '../../reducers/stage-size';
import {getPageMinDimensions, getStagePanelStyle, getUnconstrainedEditorWidth} from '../../modules/editor-layout';

import StarterGuide from './starter-guide.jsx';
import EditorPane from './editor-pane.jsx';
import IsolatedPanel from './isolated-panel.jsx';
import GuiWindows from './gui-windows.jsx';
import PlayerPage from './player-page.jsx';
import EditorOverlays from './editor-overlays.jsx';
import AssetLibraryWindows from './asset-library-windows.jsx';
import BlocksWorkspace from './blocks-workspace.jsx';
import StagePanelResizer from './stage-panel-resizer.jsx';
import StagePanel from './stage-panel.jsx';
import useStagePanelLayout from './use-stage-panel-layout.js';
import useMobileEditorView from './use-mobile-editor-view.js';
import useEditorViewportHeight from './use-editor-viewport-height.js';
import usePlayerStageWidth from './use-player-stage-width.js';
import usePreloadEditorWindowsWhenIdle from './use-preload-editor-windows.js';
import useShortcutCallbacks from './use-shortcut-callbacks.js';
import styles from './gui.css';
import {getGuiComponents} from './gui-components';

const handleEnableProcedureReturns = () => {
    try {
        const workspace = getActiveWorkspace();

        if (workspace && workspace.enableProcedureReturns) {
            workspace.enableProcedureReturns();

            if (workspace.refreshToolboxSelection_) {
                workspace.refreshToolboxSelection_();
            }
        }
    } catch (error) {
        console.error('Error enabling procedure returns:', error);
    }
};

const handleCloseChat = () => closeChat();

const GUIComponent = props => {
    const {
        MenuBar,
        DragLayer,
        ExtensionLibrary
    } = getGuiComponents();
    const {
        editorWrapperRef,
        handleStagePanelResizeDoubleClick,
        handleStagePanelResizeKeyDown,
        handleStagePanelResizePointerDown,
        isNarrowLayout,
        isStageHidden,
        stageAndTargetWrapperRef,
        stageContainerWidth,
        stagePanelWidth
    } = useStagePanelLayout({
        customStageSize: props.customStageSize,
        isFullScreen: props.isFullScreen,
        onSetStageSize: props.onSetStageSize,
        stageSizeMode: props.stageSizeMode,
        stageSizeRequestId: props.stageSizeRequestId
    });
    const isMobileEditor = isNarrowLayout && isStageHidden;
    const {handleSelectMobileTab, handleSelectMobileView, mobileEditorView} = useMobileEditorView({
        isMobileEditor,
        onActivateTab: props.onActivateTab
    });
    const playerStageWidth = usePlayerStageWidth(props.isPlayerOnly, props.customStageSize);
    const viewportHeight = useEditorViewportHeight(props.isPlayerOnly);
    usePreloadEditorWindowsWhenIdle(props.isPlayerOnly);

    const {
        accountNavOpen,
        activeTabIndex,
        alertsVisible,
        authorId,
        authorThumbnailUrl,
        authorUsername,
        basePath,
        backdropLibraryVisible,
        backpackHost,
        backpackVisible,
        blocksId,
        blocksTabVisible,
        canChangeLanguage,
        canChangeTheme,
        canEditTitle,
        canManageFiles,
        canSave,
        canUseCloud,
        children,
        connectionModalVisible,
        costumeLibraryVisible,
        soundLibraryVisible,
        costumesTabVisible,
        customStageSize,
        editorMode,
        enableCommunity,
        intl,
        extensionLibraryVisible,
        isCreating,
        isEmbedded,
        isFullScreen,
        isPlayerOnly,
        isRtl,
        isStudent,
        isWindowFullScreen,
        isTelemetryEnabled,
        loading,
        locale,
        logo,
        onClickAbout,
        onClickAccountNav,
        onCloseAccountNav,
        onClickAddonSettings,
        onClickDesktopSettings,
        onClickNewWindow,
        onClickPackager,
        onLogOut,
        onOpenExtensionLibrary,
        onOpenExtensionManagerModal,
        onOpenRegistration,
        onToggleLoginOpen,
        onActivateTab,
        onExtensionButtonClick,
        onOpenCustomExtensionModal,
        onProjectTelemetryEvent,
        onRequestCloseBackdropLibrary,
        onRequestCloseCostumeLibrary,
        onRequestCloseExtensionLibrary,
        onRequestCloseSoundLibrary,
        onRequestCloseTelemetryModal,
        onSetStageSize: _onSetStageSize,
        onSetFullScreen: _onSetFullScreen,
        onShowPrivacyPolicy,
        onStartSelectingFileUpload,
        onTelemetryModalCancel,
        onTelemetryModalOptIn,
        onTelemetryModalOptOut,
        securityManager,
        showOpenFilePicker,
        showSaveFilePicker,
        soundsTabVisible,
        soundRecorderVisible,
        stageSizeMode,
        stageSizeRequestId,
        targetIsStage,
        telemetryModalVisible,
        theme,
        usernameModalVisible,
        settingsModalVisible,
        customExtensionModalVisible,
        fontsModalVisible,
        assetsModalVisible,
        projectMetadataModalVisible,
        unknownPlatformModalVisible,
        invalidProjectModalVisible,
        gitModalVisible,
        roturLoginModalVisible,
        onRequestCloseRoturLogin,
        onClosePanel,
        vm,
        dispatch,
        ...componentProps
    } = props;
    const codeMode = editorMode === CODE_MODE;
    const floatingStage = codeMode && !isNarrowLayout && !isFullScreen;
    useShortcutCallbacks(
        children ? null : onStartSelectingFileUpload,
        children ? null : onClickPackager
    );
    const unconstrainedWidth = useMemo(
        () => getUnconstrainedEditorWidth(customStageSize.width),
        [customStageSize.width]
    );
    const minDimensions = useMemo(
        () => getPageMinDimensions({isNarrowLayout, isStageHidden, viewportHeight}),
        [isStageHidden, isNarrowLayout, viewportHeight]
    );
    const stagePanelStyle = useMemo(
        () => getStagePanelStyle(stagePanelWidth, isStageHidden),
        [stagePanelWidth, isStageHidden]
    );
    if (children) {
        return <Box {...componentProps}>{children}</Box>;
    }

    const windows = (
        <GuiWindows
            assetsModalVisible={assetsModalVisible}
            customExtensionModalVisible={customExtensionModalVisible}
            fontsModalVisible={fontsModalVisible}
            gitModalVisible={gitModalVisible}
            invalidProjectModalVisible={invalidProjectModalVisible}
            isEmbedded={isEmbedded}
            isPlayerOnly={isPlayerOnly}
            isRtl={isRtl}
            projectMetadataModalVisible={projectMetadataModalVisible}
            roturLoginModalVisible={roturLoginModalVisible}
            securityManager={securityManager}
            settingsModalVisible={settingsModalVisible}
            unknownPlatformModalVisible={unknownPlatformModalVisible}
            usernameModalVisible={usernameModalVisible}
            onClickAddonSettings={onClickAddonSettings}
            onClosePanel={onClosePanel}
            onRequestCloseRoturLogin={onRequestCloseRoturLogin}
        />
    );

    return (<MediaQuery minWidth={unconstrainedWidth}>{isUnconstrained => {
        const stageSize = resolveStageSize(
            stageSizeMode === STAGE_SIZE_MODES.hidden ? STAGE_SIZE_MODES.small : stageSizeMode,
            isUnconstrained
        );

        return isPlayerOnly ? (
            <PlayerPage
                alertsVisible={alertsVisible}
                isEmbedded={isEmbedded}
                isFullScreen={isFullScreen}
                isRtl={isRtl}
                isWindowFullScreen={isWindowFullScreen}
                loading={loading}
                stageContainerWidth={playerStageWidth}
                vm={vm}
            >
                {windows}
            </PlayerPage>
        ) : (
            <React.Suspense fallback={<Loader isFullScreen />}>
                <Box
                    className={styles.pageWrapper}
                    data-mobile-editor={isMobileEditor ? 'true' : null}
                    dir={isRtl ? 'rtl' : 'ltr'}
                    style={minDimensions}
                    {...componentProps}
                >
                    {windows}
                    <EditorOverlays
                        alertsVisible={alertsVisible}
                        connectionModalVisible={connectionModalVisible}
                        isCreating={isCreating}
                        isRtl={isRtl}
                        isTelemetryEnabled={isTelemetryEnabled}
                        loading={loading}
                        telemetryModalVisible={telemetryModalVisible}
                        vm={vm}
                        onClickDesktopSettings={onClickDesktopSettings}
                        onClosePanel={onClosePanel}
                        onRequestCloseTelemetryModal={onRequestCloseTelemetryModal}
                        onShowPrivacyPolicy={onShowPrivacyPolicy}
                        onTelemetryModalCancel={onTelemetryModalCancel}
                        onTelemetryModalOptIn={onTelemetryModalOptIn}
                        onTelemetryModalOptOut={onTelemetryModalOptOut}
                    />
                    <AssetLibraryWindows
                        backdropLibraryVisible={backdropLibraryVisible}
                        costumeLibraryVisible={costumeLibraryVisible}
                        soundLibraryVisible={soundLibraryVisible && !soundsTabVisible}
                        soundRecorderVisible={soundRecorderVisible}
                        vm={vm}
                        onRequestCloseBackdropLibrary={onRequestCloseBackdropLibrary}
                        onRequestCloseCostumeLibrary={onRequestCloseCostumeLibrary}
                        onRequestCloseSoundLibrary={onRequestCloseSoundLibrary}
                    />
                    <PanelErrorBoundary
                        closable={false}
                        name="Menu bar"
                        variant="inline"
                    >
                        <MenuBar
                            accountNavOpen={accountNavOpen}
                            authorId={authorId}
                            authorThumbnailUrl={authorThumbnailUrl}
                            authorUsername={authorUsername}
                            canChangeLanguage={canChangeLanguage}
                            canChangeTheme={canChangeTheme}
                            canEditTitle={canEditTitle}
                            canManageFiles={canManageFiles}
                            className={styles.menuBarPosition}
                            enableCommunity={enableCommunity}
                            logo={logo}
                            showOpenFilePicker={showOpenFilePicker}
                            showSaveFilePicker={showSaveFilePicker}
                            onClickAbout={onClickAbout}
                            onClickAccountNav={onClickAccountNav}
                            onClickAddonSettings={onClickAddonSettings}
                            onClickDesktopSettings={onClickDesktopSettings}
                            onClickNewWindow={onClickNewWindow}
                            onClickPackager={onClickPackager}
                            onCloseAccountNav={onCloseAccountNav}
                            onLogOut={onLogOut}
                            onOpenExtensionLibrary={onOpenExtensionLibrary}
                            onOpenExtensionManagerModal={onOpenExtensionManagerModal}
                            onOpenRegistration={onOpenRegistration}
                            onProjectTelemetryEvent={onProjectTelemetryEvent}
                            onStartSelectingFileUpload={onStartSelectingFileUpload}
                            onToggleLoginOpen={onToggleLoginOpen}
                        />
                    </PanelErrorBoundary>
                    <StarterGuide
                        vm={vm}
                        onImport={onStartSelectingFileUpload}
                    />
                    <Box className={styles.bodyWrapper}>
                        <Box className={styles.flexWrapper}>
                            <EditorPane
                                activeTabIndex={activeTabIndex}
                                backpackHost={backpackHost}
                                backpackVisible={backpackVisible}
                                blocksPanel={
                                    <BlocksWorkspace
                                        basePath={basePath}
                                        blocksId={blocksId}
                                        canUseCloud={canUseCloud}
                                        isVisible={blocksTabVisible}
                                        stageSize={stageSize}
                                        theme={theme}
                                        vm={vm}
                                        onExtensionButtonClick={onExtensionButtonClick}
                                        onOpenCustomExtensionModal={onOpenCustomExtensionModal}
                                        onOpenFile={onStartSelectingFileUpload}
                                    />
                                }
                                blocksTabVisible={blocksTabVisible}
                                codeMode={codeMode}
                                costumesTabVisible={costumesTabVisible}
                                floatingStage={floatingStage}
                                isFullScreen={isFullScreen}
                                isMobileEditor={isMobileEditor}
                                isPlayerOnly={isPlayerOnly}
                                isRtl={isRtl}
                                locale={locale}
                                mobileEditorView={mobileEditorView}
                                paneRef={editorWrapperRef}
                                soundsTabVisible={soundsTabVisible}
                                stageSize={stageSize}
                                targetIsStage={targetIsStage}
                                vm={vm}
                                onActivateTab={onActivateTab}
                                onSelectMobileTab={handleSelectMobileTab}
                                onSelectMobileView={handleSelectMobileView}
                            />
                            {isMobileEditor || floatingStage ? null : (
                                <React.Fragment>
                                    <StagePanelResizer
                                        onDoubleClick={handleStagePanelResizeDoubleClick}
                                        onKeyDown={handleStagePanelResizeKeyDown}
                                        onPointerDown={handleStagePanelResizePointerDown}
                                    />
                                    <StagePanel
                                        isFullScreen={isFullScreen}
                                        isRtl={isRtl}
                                        isStageHidden={isStageHidden}
                                        panelRef={stageAndTargetWrapperRef}
                                        panelStyle={stagePanelStyle}
                                        stageContainerWidth={stageContainerWidth}
                                        stageSize={stageSize}
                                        vm={vm}
                                    />
                                </React.Fragment>
                            )}
                        </Box>
                        {isStudent ? null : (
                            <IsolatedPanel
                                name="Chat"
                                onClose={handleCloseChat}
                            >
                                <ChatDock />
                            </IsolatedPanel>
                        )}
                    </Box>
                    {extensionLibraryVisible ? (
                        <IsolatedPanel
                            name="Extension library"
                            onClose={onRequestCloseExtensionLibrary}
                        >
                            <ExtensionLibrary
                                vm={vm}
                                visible={extensionLibraryVisible}
                                onRequestClose={onRequestCloseExtensionLibrary}
                                onOpenCustomExtensionModal={onOpenCustomExtensionModal}
                                onEnableProcedureReturns={handleEnableProcedureReturns}
                            />
                        </IsolatedPanel>
                    ) : null}
                    <DragLayer />
                </Box>
            </React.Suspense>
        );
    }}</MediaQuery>);
};

GUIComponent.propTypes = {
    accountNavOpen: PropTypes.bool,
    activeTabIndex: PropTypes.number,
    alertsVisible: PropTypes.bool,
    connectionModalVisible: PropTypes.bool,
    dispatch: PropTypes.func,
    isTelemetryEnabled: PropTypes.bool,
    locale: PropTypes.string,
    onClickAbout: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.arrayOf(
            PropTypes.shape({
                title: PropTypes.string,
                onClick: PropTypes.func
            })
        )
    ]),
    onProjectTelemetryEvent: PropTypes.func,
    authorId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    authorThumbnailUrl: PropTypes.string,
    authorUsername: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    backdropLibraryVisible: PropTypes.bool,
    backpackHost: PropTypes.string,
    backpackVisible: PropTypes.bool,
    basePath: PropTypes.string,
    blocksTabVisible: PropTypes.bool,
    blocksId: PropTypes.string,
    canChangeLanguage: PropTypes.bool,
    canChangeTheme: PropTypes.bool,
    canEditTitle: PropTypes.bool,
    canManageFiles: PropTypes.bool,
    canSave: PropTypes.bool,
    canUseCloud: PropTypes.bool,
    children: PropTypes.node,
    costumeLibraryVisible: PropTypes.bool,
    soundLibraryVisible: PropTypes.bool,
    costumesTabVisible: PropTypes.bool,
    customStageSize: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number
    }),
    enableCommunity: PropTypes.bool,
    extensionLibraryVisible: PropTypes.bool,
    intl: intlShape.isRequired,
    isCreating: PropTypes.bool,
    isEmbedded: PropTypes.bool,
    isStudent: PropTypes.bool,
    isFullScreen: PropTypes.bool,
    isPlayerOnly: PropTypes.bool,
    isRtl: PropTypes.bool,
    isWindowFullScreen: PropTypes.bool,
    loading: PropTypes.bool,
    logo: PropTypes.string,
    onActivateTab: PropTypes.func,
    onClickAccountNav: PropTypes.func,
    onClickAddonSettings: PropTypes.func,
    onClickDesktopSettings: PropTypes.func,
    onClickPackager: PropTypes.func,
    onClickNewWindow: PropTypes.func,
    onCloseAccountNav: PropTypes.func,
    onExtensionButtonClick: PropTypes.func,
    onOpenCustomExtensionModal: PropTypes.func,
    onLogOut: PropTypes.func,
    onOpenExtensionLibrary: PropTypes.func,
    onOpenExtensionManagerModal: PropTypes.func,
    onOpenRegistration: PropTypes.func,
    onRequestCloseBackdropLibrary: PropTypes.func,
    onRequestCloseCostumeLibrary: PropTypes.func,
    onRequestCloseSoundLibrary: PropTypes.func,
    onRequestCloseExtensionLibrary: PropTypes.func,
    onRequestCloseTelemetryModal: PropTypes.func,
    onShowPrivacyPolicy: PropTypes.func,
    onStartSelectingFileUpload: PropTypes.func,
    onTabSelect: PropTypes.func,
    onTelemetryModalCancel: PropTypes.func,
    onTelemetryModalOptIn: PropTypes.func,
    onTelemetryModalOptOut: PropTypes.func,
    onToggleLoginOpen: PropTypes.func,
    onSetStageSize: PropTypes.func,
    onSetFullScreen: PropTypes.func,
    securityManager: PropTypes.shape({}),
    showOpenFilePicker: PropTypes.func,
    showSaveFilePicker: PropTypes.func,
    soundsTabVisible: PropTypes.bool,
    stageSizeMode: PropTypes.oneOf(Object.keys(STAGE_SIZE_MODES)),
    stageSizeRequestId: PropTypes.number,
    targetIsStage: PropTypes.bool,
    telemetryModalVisible: PropTypes.bool,
    theme: PropTypes.instanceOf(Theme),
    usernameModalVisible: PropTypes.bool,
    roturLoginModalVisible: PropTypes.bool,
    onRequestCloseRoturLogin: PropTypes.func,
    onClosePanel: PropTypes.func,
    settingsModalVisible: PropTypes.bool,
    customExtensionModalVisible: PropTypes.bool,
    editorMode: PropTypes.string,
    soundRecorderVisible: PropTypes.bool,
    fontsModalVisible: PropTypes.bool,
    assetsModalVisible: PropTypes.bool,
    projectMetadataModalVisible: PropTypes.bool,
    unknownPlatformModalVisible: PropTypes.bool,
    invalidProjectModalVisible: PropTypes.bool,
    gitModalVisible: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired
};
GUIComponent.defaultProps = {
    backpackHost: null,
    backpackVisible: false,
    basePath: './',
    blocksId: 'original',
    canChangeLanguage: true,
    canChangeTheme: true,
    canEditTitle: false,
    canManageFiles: true,
    canSave: false,
    canUseCloud: false,
    enableCommunity: false,
    isCreating: false,
    loading: false,
    stageSizeMode: STAGE_SIZE_MODES.large
};

const mapStateToProps = state => ({
    isStudent: Boolean(state.scratchGui.rotur && state.scratchGui.rotur.isStudent),
    customStageSize: state.scratchGui.customStageSize,
    isWindowFullScreen: state.scratchGui.tw.isWindowFullScreen,
    blocksId: state.scratchGui.timeTravel.year.toString(),
    stageSizeMode: state.scratchGui.stageSize.stageSize,
    stageSizeRequestId: state.scratchGui.stageSize.requestId,
    theme: state.scratchGui.theme.theme,
    locale: state.locales.locale,
    roturLoginModalVisible: state.scratchGui.modals.roturLoginModal
});

const mapDispatchToProps = dispatch => ({
    onSetStageSize: stageSize => dispatch(setStageSize(stageSize)),
    onRequestCloseRoturLogin: () => dispatch(closeRoturLoginModal()),
    onClosePanel: closeAction => dispatch(closeAction())
});

export {
    GUIComponent
};

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(GUIComponent));
