import Blocks from '../../containers/blocks.jsx';
import CostumeTab from '../../containers/costume-tab.jsx';
import SoundTab from '../../containers/sound-tab.jsx';
import TargetPane from '../../containers/target-pane.jsx';
import MenuBar from '../menu-bar/menu-bar.jsx';
import CostumeLibrary from '../../containers/costume-library.jsx';
import SoundLibrary from '../../containers/sound-library.jsx';
import BackdropLibrary from '../../containers/backdrop-library.jsx';
import Watermark from '../../containers/watermark.jsx';
import Backpack from '../../containers/backpack.jsx';
import BrowserModal from '../browser-modal/browser-modal.jsx';
import DragLayer from '../../containers/drag-layer.jsx';
import CollaborationContainer from '../../containers/collaboration-container.jsx';
import CollabLoader from '../collab-loader/collab-loader.jsx';
import TelemetryModal from '../telemetry-modal/telemetry-modal.jsx';
import TWRestorePointManager from '../../containers/tw-restore-point-manager.jsx';
import TWDebugger from '../../containers/tw-debugger.jsx';
import TWVariableManager from '../../containers/tw-variable-manager.jsx';
import MWExtensionManagerModal from '../../containers/mw-extension-manager-modal.jsx';
import MWHelpModal from '../../containers/mw-help-modal.jsx';
import MWProjectThemeModal from '../../containers/mw-project-theme-modal.jsx';
import MWProductsModal from '../../containers/mw-products-modal.jsx';
import MWGameItemsModal from '../../containers/mw-game-items-modal.jsx';
import {retryableLazy} from '../../lib/lazy-with-retry.js';

// Rarely used windows that only mount while open load on demand, so they stay out of the startup bundle.
// Each one must render inside a React.Suspense boundary.
const ConnectionModal = retryableLazy(() => import('../../containers/connection-modal.jsx'));
const TWUsernameModal = retryableLazy(() => import('../../containers/tw-username-modal.jsx'));
const TWSettingsModal = retryableLazy(() => import('../../containers/tw-settings-modal.jsx'));
const TWCustomExtensionModal = retryableLazy(() => import('../../containers/tw-custom-extension-modal.jsx'));
const TWFontsModal = retryableLazy(() => import('../../containers/tw-fonts-modal.jsx'));
const MWAssetsModal = retryableLazy(() => import('../../containers/mw-assets-modal.jsx'));
const MWProjectMetadataModal = retryableLazy(() => import('../../containers/mw-project-metadata-modal.jsx'));
const TWUnknownPlatformModal = retryableLazy(() => import('../../containers/tw-unknown-platform-modal.jsx'));
const TWGitModal = retryableLazy(() => import('../../containers/mw-git-modal.jsx'));
const ExtensionLibrary = retryableLazy(() => import('../../containers/extension-library.jsx'));

const components = {
    Blocks,
    CostumeTab,
    SoundTab,
    TargetPane,
    MenuBar,
    CostumeLibrary,
    SoundLibrary,
    BackdropLibrary,
    Watermark,
    Backpack,
    BrowserModal,
    DragLayer,
    ConnectionModal,
    CollaborationContainer,
    CollabLoader,
    TelemetryModal,
    TWUsernameModal,
    TWSettingsModal,
    TWCustomExtensionModal,
    TWRestorePointManager,
    TWFontsModal,
    MWAssetsModal,
    MWProjectMetadataModal,
    TWDebugger,
    TWVariableManager,
    TWUnknownPlatformModal,
    TWGitModal,
    MWExtensionManagerModal,
    MWHelpModal,
    MWProjectThemeModal,
    MWProductsModal,
    MWGameItemsModal,
    ExtensionLibrary
};

const lazyComponents = [
    ConnectionModal,
    TWUsernameModal,
    TWSettingsModal,
    TWCustomExtensionModal,
    TWFontsModal,
    MWAssetsModal,
    MWProjectMetadataModal,
    TWUnknownPlatformModal,
    TWGitModal,
    ExtensionLibrary
];

const getGuiComponents = () => components;

// Fetches the on-demand windows in the background so the first open does not wait for the network.
const preloadLazyGuiComponents = () => Promise.all(lazyComponents.map(component => component.preload()));

export {getGuiComponents, preloadLazyGuiComponents};
