import PropTypes from 'prop-types';
import React from 'react';

import NotificationsProvider from '../../lib/notifications-provider.jsx';
import TWSecurityManager from '../../containers/tw-security-manager.jsx';
import TWInvalidProjectModal from '../../containers/tw-invalid-project-modal.jsx';
import RoturSession from '../../containers/rotur-session.jsx';
import RoturExtensionHost from '../../containers/rotur-extension-host.jsx';
import MistWarpGameHost from '../../containers/mistwarp-game-host.jsx';
import SimpleDialog from '../../containers/simple-dialog.jsx';
import RoturLoginModal from '../mw-rotur-login-modal/rotur-login-modal.jsx';
import {hasRotur} from '../../lib/rotur/availability.js';
import {isStudentSession} from '../../lib/rotur/student-flag.js';
import {
    closeAssetsModal,
    closeCustomExtensionModal,
    closeFontsModal,
    closeGameItemsModal,
    closeGitModal,
    closeHelpModal,
    closeProductsModal,
    closeProjectMetadataModal,
    closeRestorePointModal,
    closeSettingsModal,
    closeUnknownPlatformModal,
    closeUsernameModal,
    closeVariableManagerModal
} from '../../reducers/modals.js';
import {closeProjectThemePrompt} from '../../reducers/mw-project-theme';
import IsolatedPanel from './isolated-panel.jsx';
import {getGuiComponents} from './gui-components';

const GuiWindows = ({
    assetsModalVisible,
    customExtensionModalVisible,
    fontsModalVisible,
    gitModalVisible,
    invalidProjectModalVisible,
    isEmbedded,
    isPlayerOnly,
    isRtl,
    projectMetadataModalVisible,
    roturLoginModalVisible,
    securityManager,
    settingsModalVisible,
    unknownPlatformModalVisible,
    usernameModalVisible,
    onClickAddonSettings,
    onClosePanel,
    onRequestCloseRoturLogin
}) => {
    const {
        TWRestorePointManager,
        ExtensionDevListener,
        TWVariableManager,
        MWProductsModal,
        MWGameItemsModal,
        MWHelpModal,
        MWProjectThemeModal,
        TWUsernameModal,
        TWSettingsModal,
        TWCustomExtensionModal,
        TWFontsModal,
        MWAssetsModal,
        MWProjectMetadataModal,
        TWUnknownPlatformModal,
        TWGitModal
    } = getGuiComponents();
    return (
        <React.Fragment>
            <RoturSession />
            {!isEmbedded && <RoturExtensionHost />}
            <MistWarpGameHost />
            <NotificationsProvider />
            <TWSecurityManager securityManager={securityManager} />
            {!isPlayerOnly && (
                <IsolatedPanel
                    name="Restore points"
                    closeAction={closeRestorePointModal}
                    onClosePanel={onClosePanel}
                >
                    <TWRestorePointManager />
                </IsolatedPanel>
            )}
            {!isPlayerOnly && (
                <IsolatedPanel name="Extension problems">
                    <ExtensionDevListener />
                </IsolatedPanel>
            )}
            {!isPlayerOnly && (
                <IsolatedPanel
                    name="Variable manager"
                    closeAction={closeVariableManagerModal}
                    onClosePanel={onClosePanel}
                >
                    <TWVariableManager />
                </IsolatedPanel>
            )}
            {!isPlayerOnly && hasRotur() && (
                <IsolatedPanel
                    name="Products"
                    closeAction={closeProductsModal}
                    onClosePanel={onClosePanel}
                >
                    <MWProductsModal />
                </IsolatedPanel>
            )}
            {!isPlayerOnly && hasRotur() && (
                <IsolatedPanel
                    name="Game items"
                    closeAction={closeGameItemsModal}
                    onClosePanel={onClosePanel}
                >
                    <MWGameItemsModal />
                </IsolatedPanel>
            )}
            {!isPlayerOnly && (
                <IsolatedPanel
                    name="Help"
                    closeAction={closeHelpModal}
                    onClosePanel={onClosePanel}
                >
                    <MWHelpModal />
                </IsolatedPanel>
            )}
            {!isPlayerOnly && (
                <IsolatedPanel
                    name="Project theme"
                    closeAction={closeProjectThemePrompt}
                    onClosePanel={onClosePanel}
                >
                    <MWProjectThemeModal />
                </IsolatedPanel>
            )}
            {usernameModalVisible && (
                <IsolatedPanel
                    name="Username"
                    closeAction={closeUsernameModal}
                    onClosePanel={onClosePanel}
                >
                    <TWUsernameModal visible={usernameModalVisible} />
                </IsolatedPanel>
            )}
            {settingsModalVisible && (
                <IsolatedPanel
                    name="Settings"
                    closeAction={closeSettingsModal}
                    onClosePanel={onClosePanel}
                >
                    <TWSettingsModal
                        isRtl={isRtl}
                        visible={settingsModalVisible}
                        onClickAddonSettings={onClickAddonSettings}
                    />
                </IsolatedPanel>
            )}
            {customExtensionModalVisible && !isStudentSession() && (
                <IsolatedPanel
                    name="Custom extension"
                    closeAction={closeCustomExtensionModal}
                    onClosePanel={onClosePanel}
                >
                    <TWCustomExtensionModal />
                </IsolatedPanel>
            )}
            {fontsModalVisible && (
                <IsolatedPanel
                    name="Fonts"
                    closeAction={closeFontsModal}
                    onClosePanel={onClosePanel}
                >
                    <TWFontsModal />
                </IsolatedPanel>
            )}
            {assetsModalVisible && (
                <IsolatedPanel
                    name="Assets"
                    closeAction={closeAssetsModal}
                    onClosePanel={onClosePanel}
                >
                    <MWAssetsModal />
                </IsolatedPanel>
            )}
            {projectMetadataModalVisible && (
                <IsolatedPanel
                    name="Project details"
                    closeAction={closeProjectMetadataModal}
                    onClosePanel={onClosePanel}
                >
                    <MWProjectMetadataModal />
                </IsolatedPanel>
            )}
            {unknownPlatformModalVisible && (
                <IsolatedPanel
                    name="Unknown platform"
                    closeAction={closeUnknownPlatformModal}
                    onClosePanel={onClosePanel}
                >
                    <TWUnknownPlatformModal />
                </IsolatedPanel>
            )}
            {gitModalVisible && (
                <IsolatedPanel
                    name="Version control"
                    closeAction={closeGitModal}
                    onClosePanel={onClosePanel}
                >
                    <TWGitModal />
                </IsolatedPanel>
            )}
            {invalidProjectModalVisible && <TWInvalidProjectModal />}
            {roturLoginModalVisible && hasRotur() && (
                <RoturLoginModal onRequestClose={onRequestCloseRoturLogin} />
            )}
            <SimpleDialog />
        </React.Fragment>
    );
};

GuiWindows.propTypes = {
    assetsModalVisible: PropTypes.bool,
    customExtensionModalVisible: PropTypes.bool,
    fontsModalVisible: PropTypes.bool,
    gitModalVisible: PropTypes.bool,
    invalidProjectModalVisible: PropTypes.bool,
    isEmbedded: PropTypes.bool,
    isPlayerOnly: PropTypes.bool,
    isRtl: PropTypes.bool,
    projectMetadataModalVisible: PropTypes.bool,
    roturLoginModalVisible: PropTypes.bool,
    securityManager: PropTypes.shape({}),
    settingsModalVisible: PropTypes.bool,
    unknownPlatformModalVisible: PropTypes.bool,
    usernameModalVisible: PropTypes.bool,
    onClickAddonSettings: PropTypes.func,
    onClosePanel: PropTypes.func,
    onRequestCloseRoturLogin: PropTypes.func
};

export default React.memo(GuiWindows);
