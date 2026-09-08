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
import TipsLibrary from '../../containers/tips-library.jsx';
import Cards from '../../containers/cards.jsx';
import DragLayer from '../../containers/drag-layer.jsx';
import ConnectionModal from '../../containers/connection-modal.jsx';
import CollaborationContainer from '../../containers/collaboration-container.jsx';
import CollabLoader from '../collab-loader/collab-loader.jsx';
import TelemetryModal from '../telemetry-modal/telemetry-modal.jsx';
import TWUsernameModal from '../../containers/tw-username-modal.jsx';
import TWSettingsModal from '../../containers/tw-settings-modal.jsx';
import TWCustomExtensionModal from '../../containers/tw-custom-extension-modal.jsx';
import TWRestorePointManager from '../../containers/tw-restore-point-manager.jsx';
import TWFontsModal from '../../containers/tw-fonts-modal.jsx';
import MWAssetsModal from '../../containers/mw-assets-modal.jsx';
import MWProjectMetadataModal from '../../containers/mw-project-metadata-modal.jsx';
import TWDebugger from '../../containers/tw-debugger.jsx';
import TWVariableManager from '../../containers/tw-variable-manager.jsx';
import TWUnknownPlatformModal from '../../containers/tw-unknown-platform-modal.jsx';
import TWGitModal from '../../containers/mw-git-modal.jsx';
import MWExtensionManagerModal from '../../containers/mw-extension-manager-modal.jsx';
import MWHelpModal from '../../containers/mw-help-modal.jsx';
import MWProjectThemeModal from '../../containers/mw-project-theme-modal.jsx';
import MWProductsModal from '../../containers/mw-products-modal.jsx';
import MWGameItemsModal from '../../containers/mw-game-items-modal.jsx';
import ExtensionLibrary from '../../containers/extension-library.jsx';

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
    TipsLibrary,
    Cards,
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

const getGuiComponents = () => components;

export {getGuiComponents};
