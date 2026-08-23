import {GUI, mapDispatchToProps} from '../../../src/containers/gui.jsx';

jest.mock('../../../src/lib/mw/open-fractch-terminal-window.js', () => jest.fn());
jest.mock('../../../src/components/gui/gui.jsx', () => () => null);

describe('GUI sprite shortcut actions', () => {
    test('exposes one shared tab activation dispatcher', () => {
        const actions = mapDispatchToProps(jest.fn());

        expect(actions.onActivateTab).toEqual(expect.any(Function));
        expect(actions.onActivateCostumesTab).toBeUndefined();
        expect(actions.onActivateSoundsTab).toBeUndefined();
    });

    test('duplicate failures show a visible error', async () => {
        const dispatch = jest.fn();
        const actions = mapDispatchToProps(dispatch);
        const vm = {
            duplicateSprite: jest.fn(() => Promise.reject(new Error('duplicate failed'))),
            editingTarget: {id: 'sprite', isStage: false}
        };

        await expect(actions.onDuplicateEditingSprite(vm)).resolves.toBe(false);

        expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({
            alertId: 'assetImportError'
        }));
    });

    test('delete creates the same undo action used by the sprite menu', async () => {
        const dispatch = jest.fn(action => action);
        const restoreSprite = jest.fn(() => Promise.resolve());
        const actions = mapDispatchToProps(dispatch);
        const vm = {
            deleteSprite: jest.fn(() => restoreSprite),
            editingTarget: {id: 'sprite', isStage: false}
        };

        expect(actions.onDeleteEditingSprite(vm)).toBe(true);

        const restoreAction = dispatch.mock.calls[0][0];
        expect(restoreAction.state.deletedItem).toBe('Sprite');
        await restoreAction.state.restoreFun();
        expect(restoreSprite).toHaveBeenCalledTimes(1);
    });

    test('sprite actions ignore the stage', async () => {
        const dispatch = jest.fn();
        const actions = mapDispatchToProps(dispatch);
        const vm = {
            deleteSprite: jest.fn(),
            duplicateSprite: jest.fn(),
            editingTarget: {id: 'stage', isStage: true}
        };

        await expect(actions.onDuplicateEditingSprite(vm)).resolves.toBe(false);
        expect(actions.onDeleteEditingSprite(vm)).toBe(false);
        expect(vm.duplicateSprite).not.toHaveBeenCalled();
        expect(vm.deleteSprite).not.toHaveBeenCalled();
    });
});

describe('GUI deletion undo', () => {
    const makeGui = overrides => {
        const gui = Object.create(GUI.prototype);
        gui.restoreDeletionPromise = null;
        gui.props = {
            onClearDeletionRestore: jest.fn(),
            onShowRestoreError: jest.fn(),
            restoreDeletion: {restoreFun: null},
            vm: {postUndo: jest.fn()},
            ...overrides
        };
        return gui;
    };

    test('undo restores a deleted asset before using block undo', async () => {
        const restoreFun = jest.fn(() => Promise.resolve());
        const gui = makeGui({restoreDeletion: {restoreFun, deletedItem: 'Costume'}});

        await expect(gui.handleUndo()).resolves.toBe(true);

        expect(restoreFun).toHaveBeenCalledTimes(1);
        expect(gui.props.onClearDeletionRestore).toHaveBeenCalledTimes(1);
        expect(gui.props.vm.postUndo).not.toHaveBeenCalled();
    });

    test('repeated undo presses cannot restore the same asset twice', async () => {
        let finishRestore;
        const restoreFun = jest.fn(() => new Promise(resolve => {
            finishRestore = resolve;
        }));
        const gui = makeGui({restoreDeletion: {restoreFun, deletedItem: 'Sound'}});

        const firstUndo = gui.handleUndo();
        const secondUndo = gui.handleUndo();
        await Promise.resolve();

        expect(secondUndo).toBe(firstUndo);
        expect(restoreFun).toHaveBeenCalledTimes(1);
        finishRestore();
        await firstUndo;
    });

    test('failed restoration stays available for another undo attempt', async () => {
        const restoreFun = jest.fn(() => Promise.reject(new Error('restore failed')));
        const gui = makeGui({restoreDeletion: {restoreFun, deletedItem: 'Sprite'}});

        await expect(gui.handleUndo()).resolves.toBe(false);

        expect(gui.props.onClearDeletionRestore).not.toHaveBeenCalled();
        expect(gui.props.onShowRestoreError).toHaveBeenCalledTimes(1);
    });

    test('undo falls back to the block workspace when nothing was deleted', async () => {
        const gui = makeGui();

        await gui.handleUndo();

        expect(gui.props.vm.postUndo).toHaveBeenCalledTimes(1);
    });
});
