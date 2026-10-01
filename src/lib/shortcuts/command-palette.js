import {executeShortcut, getShortcuts} from './event-router.js';
import {formatKeyCombo, getDefaultShortcuts, parseKeyCombo} from './registry.js';
import {isMac} from '../utils/browser';

const COMMAND_PALETTE_ID = 'spotlightSearch';

const getCommandPaletteShortcut = () => {
    const shortcuts = getShortcuts();
    const list = Array.isArray(shortcuts) && shortcuts.length ? shortcuts : getDefaultShortcuts();
    return list.find(shortcut => shortcut.id === COMMAND_PALETTE_ID) || null;
};

const formatShortcutKey = (key, platform = isMac ? 'mac' : 'windows') => {
    if (!key) return '';
    return formatKeyCombo(parseKeyCombo(key), platform)
        .replace(/\+([a-z])$/, (match, letter) => `+${letter.toUpperCase()}`);
};

const getCommandPaletteKey = () => {
    const shortcut = getCommandPaletteShortcut();
    return shortcut ? formatShortcutKey(shortcut.key) : '';
};

const openCommandPalette = () => {
    const shortcut = getCommandPaletteShortcut();
    if (shortcut) executeShortcut(shortcut);
};

export {
    COMMAND_PALETTE_ID,
    formatShortcutKey,
    getCommandPaletteKey,
    openCommandPalette
};
