import {
    getDefaultShortcuts,
    getOverriddenShortcut,
    getShortcutConflict,
    matchShortcut,
    contextOf,
    normalizeKey
} from '../../../src/lib/shortcuts/registry.js';
import {dispose, initialize} from '../../../src/lib/shortcuts/event-router.js';

const press = (target, key, keyCode, modifiers = {}, altGraph = false) => {
    const event = new KeyboardEvent('keydown', {bubbles: true, cancelable: true, key, ...modifiers});
    Object.defineProperty(event, 'keyCode', {value: keyCode});
    event.getModifierState = state => state === 'AltGraph' && altGraph;
    target.dispatchEvent(event);
    return event;
};

describe('shortcut registry contexts', () => {
    const shortcuts = getDefaultShortcuts();

    test('the default registry has zero conflicts', () => {
        const seen = new Map();
        const conflicts = [];
        for (const shortcut of shortcuts) {
            if (!shortcut.key) continue;
            const key = `${contextOf(shortcut)}:${normalizeKey(shortcut.key)}`;
            if (seen.has(key)) conflicts.push(`${seen.get(key)} and ${shortcut.id}`);
            seen.set(key, shortcut.id);
            expect(getShortcutConflict(shortcuts, shortcut.key, shortcut.id)).toBeNull();
        }
        expect(conflicts).toEqual([]);
    });

    test('ids are unique', () => {
        const ids = shortcuts.map(shortcut => shortcut.id);
        expect(new Set(ids).size).toBe(ids.length);
    });

    test('code mode commands use the planned defaults', () => {
        const byId = Object.fromEntries(shortcuts.map(shortcut => [shortcut.id, shortcut]));
        expect(byId.toggleEditorMode.key).toBe('Ctrl+Shift+Y');
        expect(byId.toggleExplorer.key).toBe('Ctrl+B');
        expect(byId.togglePanel.key).toBe('Ctrl+J');
        expect(byId.quickOpen.key).toBe('Ctrl+E');
        expect(byId.applyFile).toMatchObject({key: 'Ctrl+Enter', context: 'textTab'});
        expect(byId.applyFileAlt).toMatchObject({
            key: 'Ctrl+S',
            context: 'textTab',
            action: 'applyFile'
        });
        expect([byId.closeTab.key, byId.nextTab.key, byId.previousTab.key]).toEqual(['', '', '']);
    });

    test('a textTab entry wins inside a text tab and never matches outside', () => {
        expect(matchShortcut(shortcuts, 'Ctrl+Enter').id).toBe('greenFlag');
        expect(matchShortcut(shortcuts, 'Ctrl+Enter', {context: 'textTab'}).id).toBe('applyFile');
        expect(matchShortcut(shortcuts, 'Ctrl+s').id).toBe('save');
        expect(matchShortcut(shortcuts, 'Ctrl+s', {context: 'textTab'}).id).toBe('applyFileAlt');
        expect(matchShortcut(shortcuts, 'Ctrl+e', {context: 'textTab'}).id).toBe('quickOpen');
    });

    test('unbound entries never match', () => {
        expect(matchShortcut(shortcuts, '')).toBeNull();
    });

    test('AltGraph only matches bindings without Ctrl or Alt', () => {
        expect(matchShortcut(shortcuts, 'Ctrl+Alt+q', {altGraph: true})).toBeNull();
        expect(matchShortcut(shortcuts, 'Ctrl+e', {altGraph: true})).toBeNull();
        expect(matchShortcut(shortcuts, 'f11', {altGraph: true}).id).toBe('fullScreen');
    });

    test('conflicts count only within the same context', () => {
        expect(getShortcutConflict(shortcuts, 'Ctrl+S', 'applyFileAlt')).toBeNull();
        expect(getShortcutConflict(shortcuts, 'Ctrl+S', 'quickOpen').id).toBe('save');
        expect(getShortcutConflict(shortcuts, 'Ctrl+Enter', 'applyFileAlt').id).toBe('applyFile');
    });

    test('a textTab entry sharing a global key is shown as an override', () => {
        const applyFileAlt = shortcuts.find(shortcut => shortcut.id === 'applyFileAlt');
        expect(getOverriddenShortcut(shortcuts, applyFileAlt).id).toBe('save');
        const save = shortcuts.find(shortcut => shortcut.id === 'save');
        expect(getOverriddenShortcut(shortcuts, save)).toBeNull();
    });
});

describe('shortcut router in text tabs', () => {
    let host;
    let editor;

    beforeEach(() => {
        dispose();
        localStorage.removeItem('tw:shortcuts');
        host = document.createElement('div');
        host.setAttribute('data-mw-text-tab', 'true');
        editor = document.createElement('div');
        editor.setAttribute('data-mw-code-editor', 'true');
        editor.contentEditable = 'true';
        host.appendChild(editor);
        document.body.appendChild(host);
    });

    afterEach(() => {
        dispose();
        host.remove();
    });

    test('Mod+Enter applies in a text tab and starts the project elsewhere', () => {
        const applyFile = jest.fn(() => true);
        const vm = {greenFlag: jest.fn()};
        initialize({}, vm, {applyFile});
        const inside = press(editor, 'Enter', 13, {ctrlKey: true, metaKey: true});
        expect(applyFile).toHaveBeenCalledTimes(1);
        expect(vm.greenFlag).not.toHaveBeenCalled();
        expect(inside.defaultPrevented).toBe(true);
        press(document.body, 'Enter', 13, {ctrlKey: true, metaKey: true});
        expect(vm.greenFlag).toHaveBeenCalledTimes(1);
    });

    test('Mod+S in a text tab applies the file and does not save', () => {
        const applyFile = jest.fn(() => true);
        const saveSmart = jest.fn();
        initialize({}, {}, {applyFile, saveSmart});
        editor.focus();
        const event = press(editor, 's', 83, {ctrlKey: true, metaKey: true});
        expect(applyFile).toHaveBeenCalledTimes(1);
        expect(saveSmart).not.toHaveBeenCalled();
        expect(event.defaultPrevented).toBe(true);
    });

    test('global code mode commands run without blurring the editor', () => {
        const quickOpen = jest.fn(() => true);
        initialize({}, {}, {quickOpen});
        editor.focus();
        const event = press(editor, 'e', 69, {ctrlKey: true, metaKey: true});
        expect(quickOpen).toHaveBeenCalledTimes(1);
        expect(event.defaultPrevented).toBe(true);
    });

    test('other keys fall through to CodeMirror', () => {
        const undo = jest.fn(() => true);
        initialize({}, {}, {undo});
        const event = press(editor, 'z', 90, {ctrlKey: true, metaKey: true});
        expect(undo).not.toHaveBeenCalled();
        expect(event.defaultPrevented).toBe(false);
    });

    test('a plain code editor host keeps its old behavior', () => {
        const other = document.createElement('div');
        other.setAttribute('data-mw-code-editor', 'true');
        document.body.appendChild(other);
        const applyFile = jest.fn(() => true);
        const vm = {greenFlag: jest.fn()};
        initialize({}, vm, {applyFile});
        press(other, 'Enter', 13, {ctrlKey: true, metaKey: true});
        expect(applyFile).not.toHaveBeenCalled();
        expect(vm.greenFlag).not.toHaveBeenCalled();
        other.remove();
    });

    test('AltGraph characters never fire shortcuts', () => {
        const toggleEditorMode = jest.fn(() => true);
        initialize({}, {}, {toggleEditorMode});
        press(document.body, 'y', 89, {ctrlKey: true, metaKey: true, shiftKey: true}, true);
        expect(toggleEditorMode).not.toHaveBeenCalled();
        press(document.body, 'y', 89, {ctrlKey: true, metaKey: true, shiftKey: true});
        expect(toggleEditorMode).toHaveBeenCalledTimes(1);
    });

    test('the mode toggle stops the event so the Mod+Y redo alias never runs', () => {
        initialize({}, {}, {toggleEditorMode: () => true});
        const later = jest.fn();
        document.addEventListener('keydown', later);
        press(document.body, 'y', 89, {ctrlKey: true, metaKey: true, shiftKey: true});
        document.removeEventListener('keydown', later);
        expect(later).not.toHaveBeenCalled();
    });
});
