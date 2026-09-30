import {dispose, executeShortcut, initialize, updateCallbacks} from '../../../src/lib/shortcuts/event-router.js';

const press = (target, key, keyCode, modifiers = {}) => {
    const event = new KeyboardEvent('keydown', {bubbles: true, cancelable: true, key, ...modifiers});
    Object.defineProperty(event, 'keyCode', {value: keyCode});
    target.dispatchEvent(event);
    return event;
};

const pressSave = (target = document) => press(target, 's', 83, {ctrlKey: true, metaKey: true});

const pressUndo = () => {
    const event = new KeyboardEvent('keydown', {
        bubbles: true,
        ctrlKey: true,
        key: 'z',
        metaKey: true
    });
    Object.defineProperty(event, 'keyCode', {value: 90});
    document.dispatchEvent(event);
};

const pressRedo = () => {
    const event = new KeyboardEvent('keydown', {
        bubbles: true,
        ctrlKey: true,
        key: 'z',
        metaKey: true,
        shiftKey: true
    });
    Object.defineProperty(event, 'keyCode', {value: 90});
    document.dispatchEvent(event);
};

const pressFullscreen = () => {
    const event = new KeyboardEvent('keydown', {
        bubbles: true,
        key: 'F11'
    });
    Object.defineProperty(event, 'keyCode', {value: 122});
    document.dispatchEvent(event);
};

describe('shortcut router lifecycle', () => {
    beforeEach(() => {
        dispose();
        localStorage.removeItem('tw:shortcuts');
    });

    afterEach(() => {
        dispose();
    });

    test('reinitialization replaces stale callbacks without adding another listener', () => {
        const oldSave = jest.fn();
        const newSave = jest.fn();
        initialize({}, {}, {saveSmart: oldSave});
        initialize({}, {}, {saveSmart: newSave});

        pressSave();

        expect(oldSave).not.toHaveBeenCalled();
        expect(newSave).toHaveBeenCalledTimes(1);
    });

    test('dispose removes the listener and callbacks', () => {
        const save = jest.fn();
        initialize({}, {}, {saveSmart: save});
        dispose();

        pressSave();

        expect(save).not.toHaveBeenCalled();
    });

    test('feature callback updates replace stale component handlers', () => {
        const oldToggle = jest.fn();
        const newToggle = jest.fn();
        initialize({}, {}, {toggleBackpack: oldToggle});
        updateCallbacks({toggleBackpack: newToggle});

        executeShortcut({action: 'toggleBackpack', actionType: 'callback'});

        expect(oldToggle).not.toHaveBeenCalled();
        expect(newToggle).toHaveBeenCalledTimes(1);
    });

    test('sprite shortcuts use the undo-aware component callbacks', () => {
        const duplicateSprite = jest.fn();
        const deleteSprite = jest.fn();
        const vm = {
            deleteSprite: jest.fn(),
            duplicateSprite: jest.fn(),
            editingTarget: {id: 'sprite'}
        };
        initialize({}, vm, {deleteSprite, duplicateSprite});

        executeShortcut({action: 'duplicateSprite', actionType: 'callback'});
        executeShortcut({action: 'deleteSprite', actionType: 'callback'});

        expect(duplicateSprite).toHaveBeenCalledTimes(1);
        expect(deleteSprite).toHaveBeenCalledTimes(1);
        expect(vm.duplicateSprite).not.toHaveBeenCalled();
        expect(vm.deleteSprite).not.toHaveBeenCalled();
    });

    test('undo uses the deletion-aware callback instead of going directly to the VM', () => {
        const undo = jest.fn();
        const vm = {postUndo: jest.fn()};
        initialize({}, vm, {undo});

        pressUndo();

        expect(undo).toHaveBeenCalledTimes(1);
        expect(vm.postUndo).not.toHaveBeenCalled();
    });

    test('redo goes through the workspace callback', () => {
        const redo = jest.fn();
        initialize({}, {}, {redo});

        pressRedo();

        expect(redo).toHaveBeenCalledTimes(1);
    });

    test('a handled shortcut is not also delivered to later document listeners', () => {
        const undo = jest.fn();
        const later = jest.fn();
        initialize({}, {}, {undo});
        document.addEventListener('keydown', later);
        try {
            pressUndo();
        } finally {
            document.removeEventListener('keydown', later);
        }

        expect(undo).toHaveBeenCalledTimes(1);
        expect(later).not.toHaveBeenCalled();
    });

    test('unbound keys still reach later document listeners', () => {
        const later = jest.fn();
        initialize({}, {}, {});
        document.addEventListener('keydown', later);
        try {
            const event = new KeyboardEvent('keydown', {bubbles: true, key: 'q'});
            Object.defineProperty(event, 'keyCode', {value: 81});
            document.dispatchEvent(event);
        } finally {
            document.removeEventListener('keydown', later);
        }

        expect(later).toHaveBeenCalledTimes(1);
    });

    test('F11 uses the fullscreen callback', () => {
        const setFullScreen = jest.fn();
        initialize({}, {}, {setFullScreen});

        pressFullscreen();

        expect(setFullScreen).toHaveBeenCalledTimes(1);
    });

    test('Ctrl+S in a text field commits the field, then saves', () => {
        jest.useFakeTimers();
        const saveSmart = jest.fn();
        initialize({}, {}, {saveSmart});
        const input = document.createElement('input');
        document.body.appendChild(input);
        input.focus();
        try {
            const event = pressSave(input);

            expect(event.defaultPrevented).toBe(true);
            expect(document.activeElement).not.toBe(input);
            expect(saveSmart).not.toHaveBeenCalled();
            jest.runOnlyPendingTimers();
            expect(saveSmart).toHaveBeenCalledTimes(1);
        } finally {
            input.remove();
            jest.useRealTimers();
        }
    });

    test('other shortcuts are left alone while typing', () => {
        const undo = jest.fn();
        initialize({}, {}, {undo});
        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        try {
            const event = press(textarea, 'z', 90, {ctrlKey: true, metaKey: true});

            expect(undo).not.toHaveBeenCalled();
            expect(event.defaultPrevented).toBe(false);
        } finally {
            textarea.remove();
        }
    });

    test('the player only runs player shortcuts', () => {
        const deleteSprite = jest.fn();
        const setFullScreen = jest.fn();
        initialize({}, {}, {
            deleteSprite,
            setFullScreen,
            getMode: () => ({isEmbedded: false, isPlayerOnly: true})
        });

        press(document, 'x', 88, {ctrlKey: true, metaKey: true, shiftKey: true});
        press(document, 'F11', 122);

        expect(deleteSprite).not.toHaveBeenCalled();
        expect(setFullScreen).toHaveBeenCalledTimes(1);
    });

    test('embeds ignore editor shortcuts', () => {
        const saveSmart = jest.fn();
        initialize({}, {}, {
            saveSmart,
            getMode: () => ({isEmbedded: true, isPlayerOnly: true})
        });

        const event = pressSave();

        expect(saveSmart).not.toHaveBeenCalled();
        expect(event.defaultPrevented).toBe(false);
    });
});
