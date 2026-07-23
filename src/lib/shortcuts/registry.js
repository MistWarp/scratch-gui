export const SHORTCUT_CATEGORIES = {
    FILE: 'file',
    EDIT: 'edit',
    VIEW: 'view',
    PROJECT_CONTROLS: 'projectControls',
    EDITOR_NAVIGATION: 'editorNavigation',
    LIBRARY_ACCESS: 'libraryAccess',
    SPRITE_MANAGEMENT: 'spriteManagement',
    WINDOW_MANAGEMENT: 'windowManagement'
};

export const getCategoryLabel = category => {
    const labels = {
        [SHORTCUT_CATEGORIES.FILE]: 'File',
        [SHORTCUT_CATEGORIES.EDIT]: 'Edit',
        [SHORTCUT_CATEGORIES.VIEW]: 'View',
        [SHORTCUT_CATEGORIES.PROJECT_CONTROLS]: 'Project Controls',
        [SHORTCUT_CATEGORIES.EDITOR_NAVIGATION]: 'Editor Navigation',
        [SHORTCUT_CATEGORIES.LIBRARY_ACCESS]: 'Library Access',
        [SHORTCUT_CATEGORIES.SPRITE_MANAGEMENT]: 'Sprite Management',
        [SHORTCUT_CATEGORIES.WINDOW_MANAGEMENT]: 'Windows'
    };
    return labels[category] || category;
};

export const getDefaultShortcuts = () => [
    {
        id: 'save',
        key: 'Ctrl+S',
        defaultKey: 'Ctrl+S',
        category: SHORTCUT_CATEGORIES.FILE,
        actionType: 'callback',
        action: 'saveSmart',
        params: [],
        label: 'Save'
    },
    {
        id: 'saveAsCopy',
        key: 'Ctrl+Shift+S',
        defaultKey: 'Ctrl+Shift+S',
        category: SHORTCUT_CATEGORIES.FILE,
        actionType: 'redux',
        action: 'saveProjectAsCopy',
        params: [],
        label: 'Save As Copy'
    },
    {
        id: 'loadFromComputer',
        key: 'Ctrl+O',
        defaultKey: 'Ctrl+O',
        category: SHORTCUT_CATEGORIES.FILE,
        actionType: 'callback',
        action: 'loadFromComputer',
        params: [],
        label: 'Load from Computer'
    },
    {
        id: 'packageProject',
        key: 'Ctrl+P',
        defaultKey: 'Ctrl+P',
        category: SHORTCUT_CATEGORIES.FILE,
        actionType: 'callback',
        action: 'openPackager',
        params: [],
        label: 'Package Project'
    },
    {
        id: 'restorePoints',
        key: 'Ctrl+Shift+P',
        defaultKey: 'Ctrl+Shift+P',
        category: SHORTCUT_CATEGORIES.FILE,
        actionType: 'redux',
        action: 'openRestorePointModal',
        params: [],
        label: 'Restore Points'
    },
    {
        id: 'spotlightSearch',
        key: 'Ctrl+K',
        defaultKey: 'Ctrl+K',
        category: SHORTCUT_CATEGORIES.EDITOR_NAVIGATION,
        actionType: 'callback',
        action: 'openSpotlight',
        params: [],
        label: 'Spotlight Search'
    },
    {
        id: 'settings',
        key: 'Ctrl+,',
        defaultKey: 'Ctrl+,',
        category: SHORTCUT_CATEGORIES.VIEW,
        actionType: 'redux',
        action: 'openSettingsModal',
        params: [],
        label: 'Settings'
    },
    {
        id: 'fullScreen',
        key: 'F11',
        defaultKey: 'F11',
        category: SHORTCUT_CATEGORIES.VIEW,
        actionType: 'vm',
        action: 'setCompilerOptions',
        params: [],
        label: 'Toggle Fullscreen'
    },
    {
        id: 'blocksTab',
        key: 'Ctrl+1',
        defaultKey: 'Ctrl+1',
        category: SHORTCUT_CATEGORIES.EDITOR_NAVIGATION,
        actionType: 'redux',
        action: 'activateTab',
        params: [0],
        label: 'Blocks Tab'
    },
    {
        id: 'costumesTab',
        key: 'Ctrl+2',
        defaultKey: 'Ctrl+2',
        category: SHORTCUT_CATEGORIES.EDITOR_NAVIGATION,
        actionType: 'redux',
        action: 'activateTab',
        params: [1],
        label: 'Costumes Tab'
    },
    {
        id: 'soundsTab',
        key: 'Ctrl+3',
        defaultKey: 'Ctrl+3',
        category: SHORTCUT_CATEGORIES.EDITOR_NAVIGATION,
        actionType: 'redux',
        action: 'activateTab',
        params: [2],
        label: 'Sounds Tab'
    },
    {
        id: 'greenFlag',
        key: 'Ctrl+Enter',
        defaultKey: 'Ctrl+Enter',
        category: SHORTCUT_CATEGORIES.PROJECT_CONTROLS,
        actionType: 'vm',
        action: 'greenFlag',
        params: [],
        label: 'Start Project (Green Flag)'
    },
    {
        id: 'stopAll',
        key: 'Ctrl+Shift+Enter',
        defaultKey: 'Ctrl+Shift+Enter',
        category: SHORTCUT_CATEGORIES.PROJECT_CONTROLS,
        actionType: 'vm',
        action: 'stopAll',
        params: [],
        label: 'Stop All'
    },
    {
        id: 'spriteLibrary',
        key: 'Ctrl+Shift+A',
        defaultKey: 'Ctrl+Shift+A',
        category: SHORTCUT_CATEGORIES.LIBRARY_ACCESS,
        actionType: 'redux',
        action: 'openSpriteLibrary',
        params: [],
        label: 'Open Sprite Library'
    },
    {
        id: 'costumeLibrary',
        key: 'Ctrl+Shift+C',
        defaultKey: 'Ctrl+Shift+C',
        category: SHORTCUT_CATEGORIES.LIBRARY_ACCESS,
        actionType: 'redux',
        action: 'openCostumeLibrary',
        params: [],
        label: 'Open Costume Library'
    },
    {
        id: 'soundLibrary',
        key: 'Ctrl+Shift+M',
        defaultKey: 'Ctrl+Shift+M',
        category: SHORTCUT_CATEGORIES.LIBRARY_ACCESS,
        actionType: 'redux',
        action: 'openSoundLibrary',
        params: [],
        label: 'Open Sound Library'
    },
    {
        id: 'extensionLibrary',
        key: 'Ctrl+.',
        defaultKey: 'Ctrl+.',
        category: SHORTCUT_CATEGORIES.LIBRARY_ACCESS,
        actionType: 'redux',
        action: 'openExtensionLibrary',
        params: [],
        label: 'Open Extension Library'
    },
    {
        id: 'extensionManager',
        key: 'Ctrl+Shift+E',
        defaultKey: 'Ctrl+Shift+E',
        category: SHORTCUT_CATEGORIES.LIBRARY_ACCESS,
        actionType: 'redux',
        action: 'openExtensionManagerModal',
        params: [],
        label: 'Extension Manager'
    },
    {
        id: 'duplicateSprite',
        key: 'Ctrl+Shift+D',
        defaultKey: 'Ctrl+Shift+D',
        category: SHORTCUT_CATEGORIES.SPRITE_MANAGEMENT,
        actionType: 'vm',
        action: 'duplicateSprite',
        params: [],
        label: 'Duplicate Sprite'
    },
    {
        id: 'toggleBackpack',
        key: 'Ctrl+Shift+B',
        defaultKey: 'Ctrl+Shift+B',
        category: SHORTCUT_CATEGORIES.VIEW,
        actionType: 'callback',
        action: 'toggleBackpack',
        params: [],
        label: 'Toggle Backpack'
    },
    {
        id: 'deleteSprite',
        key: 'Ctrl+Shift+X',
        defaultKey: 'Ctrl+Shift+X',
        category: SHORTCUT_CATEGORIES.SPRITE_MANAGEMENT,
        actionType: 'vm',
        action: 'deleteSprite',
        params: [],
        label: 'Delete Sprite'
    },
    {
        id: 'stageFullScreen',
        key: 'Ctrl+Shift+F',
        defaultKey: 'Ctrl+Shift+F',
        category: SHORTCUT_CATEGORIES.VIEW,
        actionType: 'callback',
        action: 'setFullScreen',
        params: [],
        label: 'Toggle Stage Fullscreen'
    },
    {
        id: 'undo',
        key: 'Ctrl+Z',
        defaultKey: 'Ctrl+Z',
        category: SHORTCUT_CATEGORIES.EDIT,
        actionType: 'vm',
        action: 'postUndo',
        params: [],
        label: 'Undo'
    },
    {
        id: 'redo',
        key: 'Ctrl+Shift+Z',
        defaultKey: 'Ctrl+Shift+Z',
        category: SHORTCUT_CATEGORIES.EDIT,
        actionType: 'vm',
        action: 'postRedo',
        params: [],
        label: 'Redo'
    },
    {
        id: 'copy',
        key: 'Ctrl+C',
        defaultKey: 'Ctrl+C',
        category: SHORTCUT_CATEGORIES.EDIT,
        actionType: null,
        label: 'Copy'
    },
    {
        id: 'paste',
        key: 'Ctrl+V',
        defaultKey: 'Ctrl+V',
        category: SHORTCUT_CATEGORIES.EDIT,
        actionType: null,
        label: 'Paste'
    },
    {
        id: 'cut',
        key: 'Ctrl+X',
        defaultKey: 'Ctrl+X',
        category: SHORTCUT_CATEGORIES.EDIT,
        actionType: null,
        label: 'Cut'
    },
    {
        id: 'closeWindow',
        key: 'Ctrl+Shift+K',
        defaultKey: 'Ctrl+Shift+K',
        category: SHORTCUT_CATEGORIES.WINDOW_MANAGEMENT,
        actionType: 'callback',
        action: 'closeTopWindow',
        params: [],
        label: 'Close Window'
    }
];

const normalizeKey = keyCombo => {
    if (!keyCombo) return '';
    return keyCombo
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/^command/, 'ctrl')
        .replace(/^cmd/, 'ctrl')
        .replace(/^meta/, 'ctrl');
};

const parseKeyCombo = keyCombo => {
    if (!keyCombo) return {ctrl: false, alt: false, shift: false, key: ''};
    
    const normalized = normalizeKey(keyCombo);
    const parts = normalized.split('+');
    
    return {
        ctrl: parts.includes('ctrl'),
        alt: parts.includes('alt'),
        shift: parts.includes('shift'),
        key: parts[parts.length - 1] || ''
    };
};

const formatKeyCombo = (components, platform = 'windows') => {
    const parts = [];
    
    if (components.ctrl) {
        parts.push(platform === 'mac' ? 'Cmd' : 'Ctrl');
    }
    if (components.alt) {
        parts.push(platform === 'mac' ? 'Option' : 'Alt');
    }
    if (components.shift) {
        parts.push('Shift');
    }
    if (components.key) {
        parts.push(components.key);
    }
    
    return parts.join('+');
};

const findShortcutByKey = (shortcuts, keyCombo) => {
    const normalizedQuery = normalizeKey(keyCombo);
    return shortcuts.find(shortcut => normalizeKey(shortcut.key) === normalizedQuery);
};

const applyCustomShortcuts = (defaultShortcuts, customShortcuts) => {
    const customMap = {};
    Object.entries(customShortcuts || {}).forEach(([shortcutId, customKey]) => {
        customMap[shortcutId] = customKey;
    });
    
    return defaultShortcuts.map(shortcut => {
        if (customMap[shortcut.id] && customMap[shortcut.id] !== shortcut.defaultKey) {
            return {
                ...shortcut,
                key: customMap[shortcut.id]
            };
        }
        return shortcut;
    });
};

export {
    normalizeKey,
    parseKeyCombo,
    formatKeyCombo,
    findShortcutByKey,
    applyCustomShortcuts
};
