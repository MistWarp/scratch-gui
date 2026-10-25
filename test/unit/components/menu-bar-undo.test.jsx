import {MenuBar} from '../../../src/components/menu-bar/menu-bar.jsx';
import {setTextUndoProvider} from '../../../src/lib/code-mode/undo-scope.js';
import {latestRedo, latestUndo} from '../../../src/lib/code-mode/code-history.js';

jest.mock('../../../src/lib/code-mode/code-history.js', () => ({
    latestRedo: jest.fn(() => null),
    latestUndo: jest.fn(() => null),
    subscribeCodeHistory: jest.fn(() => () => {})
}));
jest.mock('../../../src/lib/code-mode/code-dialogs.js', () => ({
    runCodeHistory: jest.fn(() => Promise.resolve(true))
}));

jest.mock('../../../src/lib/tw-lazy-scratch-blocks', () => ({
    isLoaded: jest.fn(() => false),
    get: jest.fn()
}));
jest.mock('../../../src/lib/extension-dev/session.js', () => ({
    getEntries: jest.fn(() => [{id: 'myExt', name: 'My Extension'}])
}));

const {runCodeHistory} = require('../../../src/lib/code-mode/code-dialogs.js');
const LazyScratchBlocks = require('../../../src/lib/tw-lazy-scratch-blocks');
const {nextUndoSource} = require('../../../src/lib/undo-history');

const withWorkspace = undoStack => {
    const workspace = {undoStack_: undoStack.map(sequence => ({_mwUndoSequence: sequence}))};
    LazyScratchBlocks.isLoaded.mockReturnValue(true);
    LazyScratchBlocks.get.mockReturnValue({getMainWorkspace: () => workspace});
    return workspace;
};
const deletionAt = sequence => ({sequence, restoreFun: jest.fn(() => Promise.resolve())});

const intl = {
    formatMessage: (message, values = {}) => message.defaultMessage
        .replace(/\{(\w+)\}/g, (match, name) => (name in values ? values[name] : match))
};

const target = (id, name, isStage = false) => ({id, isStage, getName: () => name});
const targets = {s1: target('s1', 'Sprite1'), s2: target('s2', 'Sprite2'), stage: target('stage', 'Stage', true)};
const vm = {
    editingTarget: targets.s1,
    editingCommands: null,
    runtime: {getTargetById: id => targets[id] || null}
};

const makeMenuBar = (props, state = {canUndo: false, canRedo: false}) => {
    const menuBar = Object.create(MenuBar.prototype);
    menuBar.props = {intl, vm, isPlayerOnly: false, ...props};
    menuBar.state = state;
    return menuBar;
};

let release = null;
afterEach(() => {
    if (release) release();
    release = null;
    latestUndo.mockReset();
    latestRedo.mockReset();
    latestUndo.mockReturnValue(null);
    latestRedo.mockReturnValue(null);
    runCodeHistory.mockClear();
    LazyScratchBlocks.isLoaded.mockReturnValue(false);
});

describe('one Undo and Redo in the Edit menu', () => {
    test('in a Code mode script tab with typing to undo, it undoes typing', () => {
        const undo = jest.fn();
        release = setTextUndoProvider(() => ({targetId: 's1', canUndo: true, canRedo: false, undo, redo: jest.fn()}));
        const menuBar = makeMenuBar({codeMode: true});
        const action = menuBar.resolveUndo('undo');
        expect(menuBar.undoLabel('undo', action)).toBe('Undo typing');
        menuBar.handleClickUndo();
        expect(undo).toHaveBeenCalled();
        expect(latestUndo).not.toHaveBeenCalled();
    });

    test('with no typing left it undoes the last apply to that file and names it', () => {
        release = setTextUndoProvider(() => ({targetId: 's1', canUndo: false, canRedo: false}));
        const entry = {targetId: 's1', sequence: 3};
        latestUndo.mockReturnValue(entry);
        const menuBar = makeMenuBar({codeMode: true});
        const action = menuBar.resolveUndo('undo');
        expect(latestUndo).toHaveBeenCalledWith('s1');
        expect(menuBar.undoLabel('undo', action)).toBe('Undo apply to Sprite1');
        menuBar.handleClickUndo();
        expect(runCodeHistory).toHaveBeenCalledWith(expect.objectContaining({direction: 'undo', entry}));
    });

    test('an Apply all is named by how many files it changed', () => {
        latestRedo.mockReturnValue({targetId: 's1', targetIds: ['stage', 's1', 's2'], redo: {clock: 1}});
        const menuBar = makeMenuBar({codeMode: true});
        expect(menuBar.undoLabel('redo', menuBar.resolveUndo('redo'))).toBe('Redo apply to 3 files');
    });

    test('an extension change is named by its extension', () => {
        latestUndo.mockReturnValue({kind: 'extension', extensionId: 'myExt', targetId: null, sequence: 1});
        const menuBar = makeMenuBar({codeMode: true});
        expect(menuBar.undoLabel('undo', menuBar.resolveUndo('undo'))).toBe('Undo change to My Extension');
    });

    test('in Blocks mode a block edit newer than the last apply comes first and keeps the plain label', () => {
        withWorkspace([2]);
        latestUndo.mockReturnValue({targetId: 's1', sequence: 1});
        const menuBar = makeMenuBar({codeMode: false, blocksTabVisible: true}, {canUndo: true, canRedo: false});
        const action = menuBar.resolveUndo('undo');
        expect(action.kind).toBe('blocks');
        expect(menuBar.undoLabel('undo', action)).toBe('Undo');
    });

    test('in Blocks mode with no block edits it undoes the last apply for the selected sprite', () => {
        latestUndo.mockReturnValue({targetId: 's1', sequence: 1});
        const menuBar = makeMenuBar({codeMode: false, blocksTabVisible: true});
        const action = menuBar.resolveUndo('undo');
        expect(latestUndo).toHaveBeenCalledWith('s1');
        expect(menuBar.undoLabel('undo', action)).toBe('Undo apply to Sprite1');
    });

    test('nothing to undo leaves the item disabled with the plain label', () => {
        const menuBar = makeMenuBar({codeMode: true});
        expect(menuBar.resolveUndo('undo')).toBeNull();
        expect(menuBar.undoLabel('undo', null)).toBe('Undo');
        expect(menuBar.undoLabel('redo', null)).toBe('Redo');
    });

    test('applies cannot be undone during collaboration', () => {
        latestUndo.mockReturnValue({targetId: 's1', sequence: 1});
        const menuBar = makeMenuBar({codeMode: true, vm: {...vm, editingCommands: {handler: {}}}});
        expect(menuBar.resolveUndo('undo')).toBeNull();
    });

    test('in Blocks mode an apply newer than the last block edit comes first, like Ctrl+Z', () => {
        const workspace = withWorkspace([1]);
        const entry = {targetId: 's1', sequence: 2};
        latestUndo.mockReturnValue(entry);
        const menuBar = makeMenuBar({codeMode: false, blocksTabVisible: true}, {canUndo: true, canRedo: false});
        const action = menuBar.resolveUndo('undo');
        expect(action.kind).toBe('code');
        expect(nextUndoSource(workspace, null, entry)).toBe('code');
    });

    test('a deletion older than the last apply waits behind it in both the menu and Ctrl+Z', () => {
        const workspace = withWorkspace([]);
        const deletion = deletionAt(1);
        const entry = {targetId: 's1', sequence: 2};
        latestUndo.mockReturnValue(entry);
        const menuBar = makeMenuBar({codeMode: false, blocksTabVisible: true, restoreDeletion: deletion},
            {canUndo: true, canRedo: false});
        expect(menuBar.resolveUndo('undo').kind).toBe('code');
        expect(nextUndoSource(workspace, deletion, entry)).toBe('code');
        menuBar.handleClickUndo();
        expect(runCodeHistory).toHaveBeenCalled();
        expect(deletion.restoreFun).not.toHaveBeenCalled();
    });

    test('in Code mode a deletion newer than the last apply is restored first', () => {
        release = setTextUndoProvider(() => ({targetId: 's1', canUndo: false, canRedo: false}));
        const deletion = deletionAt(3);
        latestUndo.mockReturnValue({targetId: 's1', sequence: 2});
        const onDeletionRestored = jest.fn();
        const menuBar = makeMenuBar({codeMode: true, restoreDeletion: deletion, onDeletionRestored});
        const action = menuBar.resolveUndo('undo');
        expect(action.kind).toBe('deletion');
        expect(menuBar.undoLabel('undo', action)).toBe('Undo');
        return action.run().then(() => {
            expect(deletion.restoreFun).toHaveBeenCalled();
            expect(onDeletionRestored).toHaveBeenCalled();
            expect(runCodeHistory).not.toHaveBeenCalled();
        });
    });

    test('an apply to a sprite that no longer exists keeps the plain label', () => {
        latestUndo.mockReturnValue({targetId: 'gone', sequence: 1});
        const menuBar = makeMenuBar({codeMode: true});
        expect(menuBar.undoLabel('undo', menuBar.resolveUndo('undo'))).toBe('Undo');
    });

    test('an Apply all counts every file even when one was deleted since', () => {
        latestUndo.mockReturnValue({targetId: 's1', targetIds: ['s1', 'gone'], sequence: 1});
        const menuBar = makeMenuBar({codeMode: true});
        expect(menuBar.undoLabel('undo', menuBar.resolveUndo('undo'))).toBe('Undo apply to 2 files');
    });

    test('the Stage is named with the translated label', () => {
        latestUndo.mockReturnValue({targetId: 'stage', sequence: 1});
        const translated = {formatMessage: (message, values) => (message.id === 'mw.menuBar.stageName' ?
            'Scène' : intl.formatMessage(message, values))};
        const menuBar = makeMenuBar({codeMode: true, intl: translated});
        expect(menuBar.undoLabel('undo', menuBar.resolveUndo('undo'))).toBe('Undo apply to Scène');
    });

    test('the player has nothing to undo', () => {
        latestUndo.mockReturnValue({targetId: 's1', sequence: 1});
        const menuBar = makeMenuBar({isPlayerOnly: true, blocksTabVisible: true}, {canUndo: true, canRedo: true});
        expect(menuBar.resolveUndo('undo')).toBeNull();
        expect(menuBar.resolveUndo('redo')).toBeNull();
    });

    test('with unapplied text and no typing left it does not undo the last apply', () => {
        release = setTextUndoProvider(() => ({targetId: 's1', dirty: true, canUndo: false, canRedo: false}));
        latestUndo.mockReturnValue({targetId: 's1', sequence: 3});
        latestRedo.mockReturnValue({targetId: 's1', redo: {clock: 1}});
        const menuBar = makeMenuBar({codeMode: true});
        expect(menuBar.resolveUndo('undo')).toBeNull();
        expect(menuBar.resolveUndo('redo')).toBeNull();
    });
});
