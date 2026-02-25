import {normalizeKey, findShortcutByKey} from './registry.js';

const detectConflicts = (shortcuts, shortcutId, newKey) => {
    const conflicts = [];
    
    if (!newKey) return conflicts;
    
    const normalizedNewKey = normalizeKey(newKey);
    
    shortcuts.forEach(shortcut => {
        if (shortcut.id === shortcutId) return;
        
        if (normalizeKey(shortcut.key) === normalizedNewKey) {
            conflicts.push(shortcut);
        }
    });
    
    return conflicts;
};

const getConflictInfo = conflicts => {
    if (conflicts.length === 0) return null;
    
    return {
        count: conflicts.length,
        shortcuts: conflicts,
        message: `This combination is already used by${conflicts.length > 1 ? ':' : ':'}`
    };
};

const validateKeyCombo = keyCombo => {
    if (!keyCombo) return {valid: false, error: 'Key combination cannot be empty'};
    
    const trimmed = keyCombo.trim();
    if (trimmed.length === 0) {
        return {valid: false, error: 'Key combination cannot be empty'};
    }
    
    const parts = trimmed.toLowerCase().split('+')
        .map(p => p.trim());
    const validModifiers = ['ctrl', 'cmd', 'command', 'meta', 'alt', 'option', 'shift'];
    
    const modifiers = parts.slice(0, -1);
    const key = parts[parts.length - 1];
    
    for (const mod of modifiers) {
        if (!validModifiers.includes(mod)) {
            return {valid: false, error: `Invalid modifier: ${mod}`};
        }
    }
    
    if (key.length !== 1 && !/^[a-z0-9]{1,2}$/.test(key) &&
        !['enter', 'escape', 'space', 'tab', 'backspace', 'delete', 'insert',
            'home', 'end', 'pageup', 'pagedown', 'arrowup', 'arrowdown',
            'arrowleft', 'arrowright', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6',
            'f7', 'f8', 'f9', 'f10', 'f11', 'f12'].includes(key)) {
        return {valid: false, error: `Invalid key: ${key}`};
    }
    
    return {valid: true};
};

const formatConflictMessage = conflicts => {
    if (conflicts.length === 0) return '';
    
    const label = conflicts.length === 1 ? 'shortcut' : 'shortcuts';
    const items = conflicts.map(c => c.label).join(', ');
    
    return `This combination is already used for ${label}: ${items}`;
};

export {
    detectConflicts,
    getConflictInfo,
    validateKeyCombo,
    formatConflictMessage
};
