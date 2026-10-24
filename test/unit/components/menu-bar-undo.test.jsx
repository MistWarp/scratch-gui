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

const {runCodeHistory} = require('../../../src/lib/code-mode/code-dialogs.js');

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
        latestUndo.mockReturnValue({kind: 'extension', extensionId: 'myExt', targetId: null});
        const menuBar = makeMenuBar({codeMode: true});
        expect(menuBar.undoLabel('undo', menuBar.resolveUndo('undo'))).toBe('Undo change to myExt');
    });

    test('in Blocks mode block edits come first and keep the plain label', () => {
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
});
