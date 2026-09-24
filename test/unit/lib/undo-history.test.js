import {
    nextUndoSource,
    trackWorkspaceUndo,
    undoLatest,
    untrackWorkspaceUndo
} from '../../../src/lib/undo-history';
import reducer, {
    removeRestore,
    restoreDeletionInitialState,
    setRestore
} from '../../../src/reducers/restore-deletion';

// Mirrors how scratch-blocks keeps its stacks: fireChangeListener pushes
// undoable events before listeners run, and undo moves whole groups of the
// same event objects between the two stacks.
const makeWorkspace = () => {
    const workspace = {
        listeners: [],
        undoStack_: [],
        redoStack_: [],
        undone: [],
        addChangeListener (listener) {
            this.listeners.push(listener);
        },
        removeChangeListener (listener) {
            this.listeners = this.listeners.filter(l => l !== listener);
        },
        fire (name) {
            const event = {name, group: name, recordUndo: true};
            this.undoStack_.push(event);
            this.redoStack_.length = 0;
            this.listeners.forEach(listener => listener(event));
        },
        undo (redo) {
            const input = redo ? this.redoStack_ : this.undoStack_;
            const output = redo ? this.undoStack_ : this.redoStack_;
            const event = input.pop();
            if (!event) return;
            output.push(event);
            this.undone.push(`${redo ? 'redo' : 'undo'} ${event.name}`);
        }
    };
    return workspace;
};

describe('single undo history', () => {
    let workspace;
    let state;
    const dispatch = action => {
        state = reducer(state, action);
    };
    const deleteItem = (name, log) => {
        dispatch(setRestore({
            restoreFun: () => {
                log.push(`restore ${name}`);
                return Promise.resolve();
            },
            deletedItem: name
        }));
    };
    const undo = () => undoLatest({
        workspace,
        deletion: state,
        onRestored: restoreFun => dispatch(removeRestore(restoreFun)),
        onRestoreError: jest.fn()
    });

    beforeEach(() => {
        workspace = makeWorkspace();
        state = restoreDeletionInitialState;
        trackWorkspaceUndo(workspace);
    });

    afterEach(() => {
        untrackWorkspaceUndo(workspace);
    });

    test('undoes block edits and deletions in the reverse of the order they happened', async () => {
        const log = workspace.undone;
        workspace.fire('move A');
        deleteItem('Sprite', log);
        workspace.fire('move B');
        deleteItem('Costume', log);
        deleteItem('Sound', log);

        for (let i = 0; i < 5; i++) await undo();

        expect(log).toEqual([
            'restore Sound',
            'restore Costume',
            'undo move B',
            'restore Sprite',
            'undo move A'
        ]);
        expect(state.entries).toEqual([]);
        expect(nextUndoSource(workspace, state)).toBeNull();
        await expect(undo()).resolves.toBe(false);
    });

    test('keeps every deletion, not just the latest', () => {
        const log = [];
        deleteItem('Sprite', log);
        deleteItem('Costume', log);

        expect(state.entries.map(entry => entry.deletedItem)).toEqual(['Sprite', 'Costume']);
        expect(state.deletedItem).toBe('Costume');

        dispatch(removeRestore(state.restoreFun));
        expect(state.deletedItem).toBe('Sprite');
    });

    test('a deletion clears block edits waiting to be redone', () => {
        workspace.fire('move A');
        workspace.undo(false);
        expect(workspace.redoStack_).toHaveLength(1);

        deleteItem('Sprite', []);

        expect(workspace.redoStack_).toHaveLength(0);
    });

    test('untracking stops numbering new block edits', () => {
        untrackWorkspaceUndo(workspace);
        expect(workspace.listeners).toEqual([]);
    });
});
