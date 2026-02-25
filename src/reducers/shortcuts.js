const SET_SHORTCUT = 'scratch-gui/shortcuts/SET_SHORTCUT';
const RESET_SHORTCUT = 'scratch-gui/shortcuts/RESET_SHORTCUT';
const RESET_ALL_SHORTCUTS = 'scratch-gui/shortcuts/RESET_ALL_SHORTCUTS';
const ENABLE_SHORTCUTS = 'scratch-gui/shortcuts/ENABLE_SHORTCUTS';
const LOAD_SHORTCUTS = 'scratch-gui/shortcuts/LOAD_SHORTCUTS';

const initialState = {
    enabled: true,
    customShortcuts: {}
};

const loadFromStorage = () => {
    try {
        const saved = localStorage.getItem('tw:shortcuts');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.warn('Failed to load shortcuts from storage:', e);
    }
    return null;
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    
    switch (action.type) {
    case SET_SHORTCUT:
        return Object.assign({}, state, {
            customShortcuts: {
                ...state.customShortcuts,
                [action.shortcutId]: action.key
            }
        });
    case RESET_SHORTCUT:
        const newCustomShortcuts = {...state.customShortcuts};
        delete newCustomShortcuts[action.shortcutId];
        
        try {
            localStorage.setItem('tw:shortcuts', JSON.stringify(newCustomShortcuts));
        } catch (e) {
            console.warn('Failed to save shortcuts:', e);
        }
        
        return Object.assign({}, state, {
            customShortcuts: newCustomShortcuts
        });
    case RESET_ALL_SHORTCUTS:
        try {
            localStorage.removeItem('tw:shortcuts');
        } catch (e) {
            console.warn('Failed to clear shortcuts:', e);
        }
        
        return Object.assign({}, state, {
            customShortcuts: {}
        });
    case LOAD_SHORTCUTS:
        const loadedShortcuts = action.customShortcuts || {};
        try {
            localStorage.setItem('tw:shortcuts', JSON.stringify(loadedShortcuts));
        } catch (e) {
            console.warn('Failed to save shortcuts:', e);
        }
        
        return Object.assign({}, state, {
            customShortcuts: loadedShortcuts
        });
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
