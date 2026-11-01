import {local} from '../modules/storage';

const SET_SHORTCUT = 'scratch-gui/shortcuts/SET_SHORTCUT';
const RESET_SHORTCUT = 'scratch-gui/shortcuts/RESET_SHORTCUT';
const RESET_ALL_SHORTCUTS = 'scratch-gui/shortcuts/RESET_ALL_SHORTCUTS';
const ENABLE_SHORTCUTS = 'scratch-gui/shortcuts/ENABLE_SHORTCUTS';
const LOAD_SHORTCUTS = 'scratch-gui/shortcuts/LOAD_SHORTCUTS';

// Sandboxed frames always reject storage access; that is expected and should
// not fill the console. Other failures are still worth reporting.
const reportStorageError = (message, error) => {
    if (error && error.name === 'SecurityError') return;
    console.warn(message, error);
};

const reportStorageFailure = message => {
    if (local.isAvailable()) console.warn(message);
};

const loadFromStorage = () => {
    const saved = local.readString('tw:shortcuts');
    if (!saved) return null;
    try {
        return JSON.parse(saved);
    } catch (e) {
        reportStorageError('Failed to load shortcuts from storage:', e);
    }
    return null;
};

const persistToStorage = customShortcuts => {
    if (!local.writeJSON('tw:shortcuts', customShortcuts)) reportStorageFailure('Failed to save shortcuts');
};

const initialState = {
    enabled: true,
    customShortcuts: loadFromStorage() || {}
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    
    switch (action.type) {
    case SET_SHORTCUT: {
        const updated = {
            ...state.customShortcuts,
            [action.shortcutId]: action.key
        };
        persistToStorage(updated);
        return Object.assign({}, state, {
            customShortcuts: updated
        });
    }
    case RESET_SHORTCUT: {
        const newCustomShortcuts = {...state.customShortcuts};
        delete newCustomShortcuts[action.shortcutId];

        persistToStorage(newCustomShortcuts);

        return Object.assign({}, state, {
            customShortcuts: newCustomShortcuts
        });
    }
    case RESET_ALL_SHORTCUTS:
        if (!local.remove('tw:shortcuts')) reportStorageFailure('Failed to clear shortcuts');
        
        return Object.assign({}, state, {
            customShortcuts: {}
        });
    case LOAD_SHORTCUTS: {
        const loadedShortcuts = action.customShortcuts || {};
        persistToStorage(loadedShortcuts);

        return Object.assign({}, state, {
            customShortcuts: loadedShortcuts
        });
    }
    case ENABLE_SHORTCUTS:
        return Object.assign({}, state, {
            enabled: action.enabled
        });
    default:
        return state;
    }
};

const setShortcut = (shortcutId, key) => ({
    type: SET_SHORTCUT,
    shortcutId,
    key
});

const resetShortcut = shortcutId => ({
    type: RESET_SHORTCUT,
    shortcutId
});

const resetAllShortcuts = () => ({
    type: RESET_ALL_SHORTCUTS
});

const setShortcutsEnabled = enabled => ({
    type: ENABLE_SHORTCUTS,
    enabled
});

const loadShortcuts = customShortcuts => ({
    type: LOAD_SHORTCUTS,
    customShortcuts
});

export {
    reducer as default,
    initialState as shortcutsInitialState,
    setShortcut,
    resetShortcut,
    resetAllShortcuts,
    setShortcutsEnabled,
    loadShortcuts
};
