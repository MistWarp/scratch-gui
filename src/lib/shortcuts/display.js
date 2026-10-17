import {isMac} from '../utils/browser';

const formatShortcutDisplay = keyCombo => {
    if (!keyCombo) return '';
    const platform = isMac ? 'mac' : 'windows';
    return keyCombo
        .replace(/Ctrl/g, platform === 'mac' ? '⌘' : 'Ctrl')
        .replace(/Cmd/g, '⌘')
        .replace(/Alt/g, platform === 'mac' ? '⌥' : 'Alt')
        .replace(/Shift/g, '⇧')
        .replace(/Space/g, '␣')
        .replace(/Enter/g, '↵')
        .replace(/ /g, '');
};

export default formatShortcutDisplay;
