import ScratchBlocks from 'scratch-blocks';
import * as ScratchPaint from 'scratch-paint';

import FractchWorkspace from '../components/mw-fractch-workspace/fractch-workspace.jsx';
import BrowserModal from '../components/browser-modal/browser-modal.jsx';
import CollabLoader from '../components/collab-loader/collab-loader.jsx';
import MenuBar from '../components/menu-bar/menu-bar.jsx';
import TelemetryModal from '../components/telemetry-modal/telemetry-modal.jsx';
import Backpack from '../containers/backpack.jsx';
import BackdropLibrary from '../containers/backdrop-library.jsx';
import Blocks from '../containers/blocks.jsx';
import Cards from '../containers/cards.jsx';
import CollaborationContainer from '../containers/collaboration-container.jsx';
import ConnectionModal from '../containers/connection-modal.jsx';
import CostumeLibrary from '../containers/costume-library.jsx';
import CostumeTab from '../containers/costume-tab.jsx';
import DragLayer from '../containers/drag-layer.jsx';
import ExtensionLibrary from '../containers/extension-library.jsx';
import MWAssetsModal from '../containers/mw-assets-modal.jsx';
import MWExtensionManagerModal from '../containers/mw-extension-manager-modal.jsx';
import MWHelpModal from '../containers/mw-help-modal.jsx';
import MWProjectMetadataModal from '../containers/mw-project-metadata-modal.jsx';
import MWProjectThemeModal from '../containers/mw-project-theme-modal.jsx';
import SoundLibrary from '../containers/sound-library.jsx';
import SoundTab from '../containers/sound-tab.jsx';
import TargetPane from '../containers/target-pane.jsx';
import TipsLibrary from '../containers/tips-library.jsx';
import TWCustomExtensionModal from '../containers/tw-custom-extension-modal.jsx';
import TWDebugger from '../containers/tw-debugger.jsx';
import TWFontsModal from '../containers/tw-fonts-modal.jsx';
import TWGitModal from '../containers/mw-git-modal.jsx';
import TWRestorePointManager from '../containers/tw-restore-point-manager.jsx';
import TWSettingsModal from '../containers/tw-settings-modal.jsx';
import TWUnknownPlatformModal from '../containers/tw-unknown-platform-modal.jsx';
import TWUsernameModal from '../containers/tw-username-modal.jsx';
import Watermark from '../containers/watermark.jsx';
import backdropLibrary from '../lib/libraries/backdrops.json';
import costumeLibrary from '../lib/libraries/costumes.json';
import soundLibrary from '../lib/libraries/sounds.json';
import spriteLibrary from '../lib/libraries/sprites.json';
import {setGuiComponents} from '../components/gui/gui-components';
import {setLibraryData} from '../lib/libraries/tw-async-libraries';
import {setScratchPaint} from '../lib/tw-scratch-paint';
import LazyScratchBlocks from '../lib/tw-lazy-scratch-blocks';

setGuiComponents({
    FractchWorkspace,
    Blocks,
    CostumeTab,
    SoundTab,
    ExtensionLibrary,
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
    TWUnknownPlatformModal,
    TWGitModal,
    MWExtensionManagerModal,
    MWHelpModal,
    MWProjectThemeModal,
    loadExtensionLibrary: () => Promise.resolve({default: ExtensionLibrary})
});

setScratchPaint(ScratchPaint);
LazyScratchBlocks.set(ScratchBlocks);
setLibraryData({
    backdrops: backdropLibrary,
    costumes: costumeLibrary,
    sounds: soundLibrary,
    sprites: spriteLibrary
});
