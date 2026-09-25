import React from 'react';
import {importWithRetry} from '../../lib/lazy-with-retry';

const componentNames = [
    'Blocks',
    'CostumeTab',
    'SoundTab',
    'TargetPane',
    'MenuBar',
    'CostumeLibrary',
    'SoundLibrary',
    'BackdropLibrary',
    'Watermark',
    'Backpack',
    'BrowserModal',
    'TipsLibrary',
    'Cards',
    'DragLayer',
    'ConnectionModal',
    'CollaborationContainer',
    'CollabLoader',
    'TelemetryModal',
    'TWUsernameModal',
    'TWSettingsModal',
    'TWCustomExtensionModal',
    'TWRestorePointManager',
    'TWFontsModal',
    'MWAssetsModal',
    'MWProjectMetadataModal',
    'TWDebugger',
    'TWVariableManager',
    'TWUnknownPlatformModal',
    'TWGitModal',
    'MWExtensionManagerModal',
    'MWHelpModal',
    'MWProjectThemeModal',
    'MWProductsModal',
    'MWGameItemsModal',
    'ExtensionLibrary'
];

let loading = null;

const loadGuiComponents = () => {
    if (!loading) {
        loading = importWithRetry(() => import('./editor-components.js'))
            .then(module => module.default)
            .catch(error => {
                loading = null;
                throw error;
            });
    }
    return loading;
};

const lazyComponents = Object.fromEntries(componentNames.map(name => [
    name,
    React.lazy(() => loadGuiComponents().then(components => ({default: components[name]})))
]));

let eagerComponents = null;

const setGuiComponents = components => {
    eagerComponents = components;
};

const getGuiComponents = () => eagerComponents || lazyComponents;

export {
    getGuiComponents,
    setGuiComponents
};
