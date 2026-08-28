import React from 'react';

const loadExtensionLibrary = () => import('../../containers/extension-library.jsx');

let components = {
    FractchWorkspace: React.lazy(() => import('../mw-fractch-workspace/fractch-workspace.jsx')),
    Blocks: React.lazy(() => import('../../containers/blocks.jsx')),
    CostumeTab: React.lazy(() => import('../../containers/costume-tab.jsx')),
    SoundTab: React.lazy(() => import('../../containers/sound-tab.jsx')),
    ExtensionLibrary: React.lazy(loadExtensionLibrary),
    TargetPane: React.lazy(() => import('../../containers/target-pane.jsx')),
    MenuBar: React.lazy(() => import('../menu-bar/menu-bar.jsx')),
    CostumeLibrary: React.lazy(() => import('../../containers/costume-library.jsx')),
    SoundLibrary: React.lazy(() => import('../../containers/sound-library.jsx')),
    BackdropLibrary: React.lazy(() => import('../../containers/backdrop-library.jsx')),
    Watermark: React.lazy(() => import('../../containers/watermark.jsx')),
    Backpack: React.lazy(() => import('../../containers/backpack.jsx')),
    BrowserModal: React.lazy(() => import('../browser-modal/browser-modal.jsx')),
    TipsLibrary: React.lazy(() => import('../../containers/tips-library.jsx')),
    Cards: React.lazy(() => import('../../containers/cards.jsx')),
    DragLayer: React.lazy(() => import('../../containers/drag-layer.jsx')),
    ConnectionModal: React.lazy(() => import('../../containers/connection-modal.jsx')),
    CollaborationContainer: React.lazy(() => import('../../containers/collaboration-container.jsx')),
    CollabLoader: React.lazy(() => import('../collab-loader/collab-loader.jsx')),
    TelemetryModal: React.lazy(() => import('../telemetry-modal/telemetry-modal.jsx')),
    TWUsernameModal: React.lazy(() => import('../../containers/tw-username-modal.jsx')),
    TWSettingsModal: React.lazy(() => import('../../containers/tw-settings-modal.jsx')),
    TWCustomExtensionModal: React.lazy(() => import('../../containers/tw-custom-extension-modal.jsx')),
    TWRestorePointManager: React.lazy(() => import('../../containers/tw-restore-point-manager.jsx')),
    TWFontsModal: React.lazy(() => import('../../containers/tw-fonts-modal.jsx')),
    MWAssetsModal: React.lazy(() => import('../../containers/mw-assets-modal.jsx')),
    MWProjectMetadataModal: React.lazy(() => import('../../containers/mw-project-metadata-modal.jsx')),
    TWDebugger: React.lazy(() => import('../../containers/tw-debugger.jsx')),
    TWUnknownPlatformModal: React.lazy(() => import('../../containers/tw-unknown-platform-modal.jsx')),
    TWGitModal: React.lazy(() => import('../../containers/mw-git-modal.jsx')),
    MWExtensionManagerModal: React.lazy(() => import('../../containers/mw-extension-manager-modal.jsx')),
    MWHelpModal: React.lazy(() => import('../../containers/mw-help-modal.jsx')),
    MWProjectThemeModal: React.lazy(() => import('../../containers/mw-project-theme-modal.jsx')),
    loadExtensionLibrary
};

const getGuiComponents = () => components;

const setGuiComponents = eagerComponents => {
    components = eagerComponents;
};

export {
    getGuiComponents,
    setGuiComponents
};
