import {dispose, executeShortcut, initialize, updateCallbacks} from '../../../src/lib/shortcuts/event-router.js';

const pressSave = () => {
    const event = new KeyboardEvent('keydown', {
        bubbles: true,
        ctrlKey: true,
        key: 's',
        metaKey: true
    });
    Object.defineProperty(event, 'keyCode', {value: 83});
    document.dispatchEvent(event);
};

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

    test('F11 uses the fullscreen callback', () => {
        const setFullScreen = jest.fn();
        initialize({}, {}, {setFullScreen});

        pressFullscreen();

        expect(setFullScreen).toHaveBeenCalledTimes(1);
    });
});
