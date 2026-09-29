import fs from 'fs';
import path from 'path';
import {getDefaultShortcuts, getShortcutKey} from '../../../src/lib/shortcuts/registry.js';

describe('menu shortcut hints', () => {
    test('uses the registry default when there is no custom binding', () => {
        expect(getShortcutKey('restorePoints', {})).toBe('Ctrl+Shift+P');
        expect(getShortcutKey('extensionManager')).toBe('Ctrl+Shift+E');
    });

    test('follows a custom binding', () => {
        expect(getShortcutKey('restorePoints', {restorePoints: 'Alt+B'})).toBe('Alt+B');
        expect(getShortcutKey('save', {restorePoints: 'Alt+B'})).toBe('Ctrl+S');
    });

    test('returns nothing for an unknown shortcut', () => {
        expect(getShortcutKey('notAShortcut', {notAShortcut: 'Ctrl+Q'})).toBe('');
    });

    test('every hint in the menu bar names a registered shortcut', () => {
        const source = fs.readFileSync(
            path.join(__dirname, '../../../src/components/menu-bar/menu-bar.jsx'),
            'utf8'
        );
        const ids = Array.from(source.matchAll(/shortcutHint\(\s*'([^']+)'/g), match => match[1]);
        const registered = new Set(getDefaultShortcuts().map(shortcut => shortcut.id));
        expect(ids.length).toBeGreaterThan(5);
        expect(ids.filter(id => !registered.has(id))).toEqual([]);
        expect(source).not.toMatch(/formatShortcutDisplay\('/);
    });
});
