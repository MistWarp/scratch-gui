import bowser from 'bowser';
import {getDefaultShortcuts, applyCustomShortcuts} from './registry.js';
import WindowManager from '../../addons/window-system/window-manager.js';

let dispatch = null;
let vm = null;
let callbacks = {};
let shortcuts = [];
let isInitialized = false;

const keyCodeToKey = {
    8: 'backspace',
    9: 'tab',
    13: 'enter',
    16: 'shift',
    17: 'ctrl',
    18: 'alt',
    27: 'escape',
    32: 'space',
    33: 'pageup',
    34: 'pagedown',
    35: 'end',
    36: 'home',
    37: 'arrowleft',
    38: 'arrowup',
    39: 'arrowright',
    40: 'arrowdown',
    45: 'insert',
    46: 'delete',
    48: '0',
    49: '1',
    50: '2',
    51: '3',
    52: '4',
    53: '5',
    54: '6',
    55: '7',
    56: '8',
    57: '9',
    59: ';',
    61: '=',
    65: 'a',
    66: 'b',
    67: 'c',
    68: 'd',
    69: 'e',
    70: 'f',
    71: 'g',
    72: 'h',
    73: 'i',
    74: 'j',
    75: 'k',
    76: 'l',
    77: 'm',
    78: 'n',
    79: 'o',
    80: 'p',
    81: 'q',
    82: 'r',
    83: 's',
    84: 't',
    85: 'u',
    86: 'v',
    87: 'w',
    88: 'x',
    89: 'y',
    90: 'z',
    112: 'f1',
    113: 'f2',
    114: 'f3',
    115: 'f4',
    116: 'f5',
    117: 'f6',
    118: 'f7',
    119: 'f8',
    120: 'f9',
    121: 'f10',
    122: 'f11',
    123: 'f12',
    186: ';',
    187: '=',
    188: ',',
    189: '-',
    190: '.',
    191: '/',
    192: '`',
    219: '[',
    220: '\\',
    221: ']',
    222: "'",
    226: '\\'
};

const loadCustomShortcuts = () => {
    try {
        const saved = localStorage.getItem('tw:shortcuts');
        if (saved) {
            const customShortcuts = JSON.parse(saved);
            shortcuts = applyCustomShortcuts(getDefaultShortcuts(), customShortcuts);
        }
    } catch (e) {
        console.warn('Failed to load custom shortcuts:', e);
    }
};

const isTypingTarget = target => {
    if (!target) return false;
    
    const tagName = target.tagName;
    if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
        return true;
    }
    
    if (target.isContentEditable) {
        return true;
    }
    
    return false;
};

const shouldIgnoreEvent = event => {
    if (isTypingTarget(event.target)) return true;
    if (event.repeat) return true;
    return false;
};

const getModifierKeys = event => ({
    ctrl: bowser.mac ? event.metaKey : event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey
});

const getEventKey = event => {
    let key = '';
    const keyCode = event.keyCode;
    
    if (keyCodeToKey[keyCode]) {
        key = keyCodeToKey[keyCode];
    } else {
        key = event.key?.toLowerCase() || String.fromCharCode(keyCode).toLowerCase();
    }
    
    return key;
};

const normalizeEventKey = event => {
    const modifiers = getModifierKeys(event);
    const key = getEventKey(event);
    
    const parts = [];
    if (modifiers.ctrl) parts.push('Ctrl');
    if (modifiers.alt) parts.push('Alt');
    if (modifiers.shift) parts.push('Shift');
    parts.push(key);
    
    return parts.join('+');
};

const findMatchingShortcut = keyCombo => shortcuts.find(shortcut => {
    const shortcutKey = shortcut.key.toLowerCase().replace(/\s+/g, '');
    return shortcutKey === keyCombo.toLowerCase().replace(/\s+/g, '');
});

const executeReduxAction = shortcut => {
    if (!dispatch) return;
    
    const actionMap = {
        requestNewProject: () => {
            if (dispatch.requestNewProject) {
                dispatch.requestNewProject(false);
            } else {
                console.warn('requestNewProject not available in dispatch');
            }
        },
        manualUpdateProject: () => {
            if (dispatch.manualUpdateProject) {
                dispatch.manualUpdateProject();
            } else {
                console.warn('manualUpdateProject not available in dispatch');
            }
        },
        saveProjectAsCopy: () => {
            if (dispatch.saveProjectAsCopy) {
                dispatch.saveProjectAsCopy();
            } else {
                console.warn('saveProjectAsCopy not available in dispatch');
            }
        },
        openSettingsModal: () => {
            if (dispatch.openSettingsModal) {
                dispatch.openSettingsModal();
            } else {
                console.warn('openSettingsModal not available in dispatch');
            }
        },
        activateTab: () => {
            if (dispatch.activateTab && shortcut.params && typeof shortcut.params[0] !== 'undefined') {
                dispatch.activateTab(shortcut.params[0]);
            } else {
                console.warn('activateTab not available in dispatch');
            }
        },
        openSpriteLibrary: () => {
            if (dispatch.openSpriteLibrary) {
                dispatch.openSpriteLibrary();
            } else {
                console.warn('openSpriteLibrary not available in dispatch');
            }
        },
        openCostumeLibrary: () => {
            if (dispatch.openCostumeLibrary) {
                dispatch.openCostumeLibrary();
            } else {
                console.warn('openCostumeLibrary not available in dispatch');
            }
        },
        openSoundLibrary: () => {
            if (dispatch.openSoundLibrary) {
                dispatch.openSoundLibrary();
            } else {
                console.warn('openSoundLibrary not available in dispatch');
            }
        },
        openExtensionLibrary: () => {
            if (dispatch.openExtensionLibrary) {
                dispatch.openExtensionLibrary();
            } else {
                console.warn('openExtensionLibrary not available in dispatch');
            }
        },
        openExtensionManagerModal: () => {
            if (dispatch.openExtensionManagerModal) {
                dispatch.openExtensionManagerModal();
            } else {
                console.warn('openExtensionManagerModal not available in dispatch');
            }
        },
        openRestorePointModal: () => {
            if (dispatch.openRestorePointModal) {
                dispatch.openRestorePointModal();
            } else {
                console.warn('openRestorePointModal not available in dispatch');
            }
        }
    };
    
    const action = actionMap[shortcut.action];
    if (action) {
        action();
    } else {
        console.warn(`Unknown Redux action: ${shortcut.action}`);
    }
};

const executeVMAction = shortcut => {
    if (!vm) return;
    
    try {
        switch (shortcut.action) {
        case 'greenFlag':
            if (vm.greenFlag) vm.greenFlag();
            break;
        case 'stopAll':
            if (vm.stopAll) vm.stopAll();
            break;
        case 'setTurboMode':
            if (vm.setTurboMode) {
                vm.setTurboMode(!vm.runtime.turboMode);
            }
            break;
        case 'duplicateSprite':
            if (vm.duplicateSprite && vm.editingTarget) {
                vm.duplicateSprite(vm.editingTarget.id);
            }
            break;
        case 'emit':
            if (vm.emit && shortcut.params && shortcut.params[0]) {
                vm.emit(shortcut.params[0]);
            }
            break;
        case 'cycleNextSprite':
            if (vm.setEditingTarget && vm.runtime && vm.runtime.targets) {
                const targets = vm.runtime.targets;
                const currentIndex = targets.findIndex(t => t.id === vm.editingTarget.id);
                const nextIndex = (currentIndex + 1) % targets.length;
                vm.setEditingTarget(targets[nextIndex].id);
            }
            break;
        case 'deleteSprite':
            if (vm.deleteSprite && vm.editingTarget) {
                const spriteId = vm.editingTarget.id;
                if (window.confirm('Are you sure you want to delete this sprite?')) {
                    vm.deleteSprite(spriteId);
                }
            }
            break;
        case 'postUndo':
            if (vm.postUndo) vm.postUndo();
            break;
        case 'postRedo':
            if (vm.postRedo) vm.postRedo();
            break;
        case 'copy':
        case 'paste':
        case 'cut':
        case 'selectAll':
        case 'cleanUp':
            // These are handled by Scratch-blocks directly, don't interfere
            break;
        default:
            console.warn(`Unknown VM action: ${shortcut.action}`);
        }
    } catch (error) {
        console.warn(`Error executing VM action ${shortcut.action}:`, error);
    }
};

const executeCallbackAction = shortcut => {
    if (!callbacks) return;

    try {
        switch (shortcut.action) {
        case 'loadFromComputer':
            if (callbacks.loadFromComputer) {
                callbacks.loadFromComputer();
            }
            break;
        case 'openPackager':
            if (callbacks.openPackager) {
                callbacks.openPackager();
            }
            break;
        case 'toggleBackpack':
            if (callbacks.toggleBackpack) {
                callbacks.toggleBackpack();
            }
            break;
        case 'toggleStageSize':
            if (callbacks.toggleStageSize) {
                callbacks.toggleStageSize();
            }
            break;
        case 'setFullScreen':
            if (callbacks.setFullScreen) {
                callbacks.setFullScreen();
            }
            break;
        case 'closeTopWindow':
            if (WindowManager) {
                const top = WindowManager.getAllWindows().sort((a, b) => b.zIndex - a.zIndex)[0];
                if (top) {
                    top.close();
                }
            }
            break;
        default:
            console.warn(`Unknown callback action: ${shortcut.action}`);
        }
    } catch (error) {
        console.warn(`Error executing callback action ${shortcut.action}:`, error);
    }
};

const executeShortcut = shortcut => {
    if (shortcut.actionType === 'redux') {
        executeReduxAction(shortcut);
    } else if (shortcut.actionType === 'vm') {
        executeVMAction(shortcut);
    } else if (shortcut.actionType === 'callback') {
        executeCallbackAction(shortcut);
    } else {
        console.warn(`Unknown action type: ${shortcut.actionType}`);
    }
};

const handleKeyDown = event => {
    if (shouldIgnoreEvent(event)) return;

    const keyCombo = normalizeEventKey(event);
    const matchingShortcut = findMatchingShortcut(keyCombo);

    if (matchingShortcut) {
        if (matchingShortcut.actionType !== null) {
            event.preventDefault();
            event.stopPropagation();
        }
        executeShortcut(matchingShortcut);
    }
};

const updateShortcuts = customShortcuts => {
    shortcuts = applyCustomShortcuts(getDefaultShortcuts(), customShortcuts);
    
    try {
        localStorage.setItem('tw:shortcuts', JSON.stringify(customShortcuts));
    } catch (e) {
        console.warn('Failed to save custom shortcuts:', e);
    }
};

const getShortcuts = () => shortcuts;

const getCallbacks = () => callbacks;

const updateCallbacks = newCallbacks => {
    // Only update callbacks if they don't already exist
    const updatedCallbacks = {...callbacks};
    for (const key of Object.keys(newCallbacks)) {
        if (!(key in updatedCallbacks) || updatedCallbacks[key] === undefined || updatedCallbacks[key] === null) {
            updatedCallbacks[key] = newCallbacks[key];
        }
    }
    callbacks = updatedCallbacks;
};

const dispose = () => {
    if (isInitialized) {
        document.removeEventListener('keydown', handleKeyDown);
        isInitialized = false;
    }
};

const initialize = (dispatchFn, vmInstance, callbacksFn) => {
    dispatch = dispatchFn;
    vm = vmInstance;
    // Merge provided callbacks with existing, with existing taking precedence
    callbacks = {...callbacksFn, ...callbacks};
    shortcuts = getDefaultShortcuts();
    loadCustomShortcuts();

    if (!isInitialized) {
        document.addEventListener('keydown', handleKeyDown);
        isInitialized = true;
    }
};

export {
    initialize,
    updateShortcuts,
    updateCallbacks,
    getShortcuts,
    dispose,
    normalizeEventKey,
    findMatchingShortcut,
    executeShortcut
};
