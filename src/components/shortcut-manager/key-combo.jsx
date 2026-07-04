import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

import {parseKeyCombo} from '../../lib/shortcuts/registry.js';

import styles from './shortcut-manager.css';

const isMac = typeof navigator !== 'undefined' &&
    navigator.platform.toUpperCase().includes('MAC');

const SPECIAL_KEY_LABELS = {
    enter: isMac ? '↩' : 'Enter',
    space: 'Space',
    escape: 'Esc',
    esc: 'Esc',
    backspace: isMac ? '⌫' : 'Backspace',
    delete: isMac ? '⌦' : 'Delete',
    del: isMac ? '⌦' : 'Delete',
    insert: 'Ins',
    tab: isMac ? '⇥' : 'Tab',
    home: 'Home',
    end: 'End',
    pageup: 'Page Up',
    pagedown: 'Page Down',
    arrowup: '↑',
    arrowdown: '↓',
    arrowleft: '←',
    arrowright: '→',
    up: '↑',
    down: '↓',
    left: '←',
    right: '→'
};

const formatBaseKey = key => {
    if (!key) return '';
    const lower = key.toLowerCase();
    if (SPECIAL_KEY_LABELS[lower]) {
        return SPECIAL_KEY_LABELS[lower];
    }
    if (lower.length === 1) {
        return lower.toUpperCase();
    }
    if (/^f\d{1,2}$/.test(lower)) {
        return lower.toUpperCase();
    }
    return key.charAt(0).toUpperCase() + key.slice(1);
};

const CODE_TO_KEY = {
    Space: 'space',
    Enter: 'enter',
    NumpadEnter: 'enter',
    Escape: 'escape',
    Tab: 'tab',
    Backspace: 'backspace',
    Delete: 'delete',
    Insert: 'insert',
    Home: 'home',
    End: 'end',
    PageUp: 'pageup',
    PageDown: 'pagedown',
    ArrowUp: 'arrowup',
    ArrowDown: 'arrowdown',
    ArrowLeft: 'arrowleft',
    ArrowRight: 'arrowright',
    Minus: '-',
    Equal: '=',
    BracketLeft: '[',
    BracketRight: ']',
    Backslash: '\\',
    Semicolon: ';',
    Quote: '\'',
    Comma: ',',
    Period: '.',
    Slash: '/',
    Backquote: '`'
};

const codeToKey = code => {
    if (!code) return null;
    if (CODE_TO_KEY[code]) return CODE_TO_KEY[code];
    if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase();
    if (/^Digit[0-9]$/.test(code)) return code.slice(5);
    if (/^F([1-9]|1[0-2])$/.test(code)) return code.toLowerCase();
    return null;
};

const eventToCombo = event => {
    const base = codeToKey(event.code);
    if (!base) return null;

    const ctrl = isMac ? event.metaKey : event.ctrlKey;
    const parts = [];
    if (ctrl) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');

    if (base.length === 1 && /[a-z]/.test(base)) {
        parts.push(base.toUpperCase());
    } else if (/^f\d{1,2}$/.test(base)) {
        parts.push(base.toUpperCase());
    } else {
        parts.push(base);
    }

    return parts.join('+');
};

const getKeyParts = keyCombo => {
    const {ctrl, alt, shift, key} = parseKeyCombo(keyCombo);
    const parts = [];

    if (isMac) {
        if (alt) parts.push({label: '⌥', modifier: true});
        if (shift) parts.push({label: '⇧', modifier: true});
        if (ctrl) parts.push({label: '⌘', modifier: true});
    } else {
        if (ctrl) parts.push({label: 'Ctrl', modifier: true});
        if (alt) parts.push({label: 'Alt', modifier: true});
        if (shift) parts.push({label: 'Shift', modifier: true});
    }

    if (key) {
        parts.push({label: formatBaseKey(key), modifier: false});
    }

    return parts;
};

const KeyCombo = ({keyCombo}) => {
    const parts = getKeyParts(keyCombo);

    if (parts.length === 0) {
        return null;
    }

    return (
        <span className={styles.shortcutKeys}>
            {parts.map((part, index) => (
                <kbd
                    key={index}
                    className={classNames(styles.keycap, {
                        [styles.modifier]: part.modifier
                    })}
                >
                    {part.label}
                </kbd>
            ))}
        </span>
    );
};

KeyCombo.propTypes = {
    keyCombo: PropTypes.string
};

export {
    KeyCombo as default,
    getKeyParts,
    eventToCombo,
    isMac
};
