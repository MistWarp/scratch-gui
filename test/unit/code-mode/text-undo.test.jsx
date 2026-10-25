import {EditorState} from '@codemirror/state';
import {history} from '@codemirror/commands';
import {EditorView} from '@codemirror/view';
import {CodeWorkbench} from '../../../src/containers/code-workbench.jsx';
import {latestRedo, latestUndo} from '../../../src/lib/code-mode/code-history.js';

jest.mock('../../../src/lib/extension-dev/lint-client.js', () => ({
    createLinter: () => ({lint: () => Promise.resolve([]), dispose: () => {}})
}));
jest.mock('../../../src/lib/code-mode/code-history.js', () => ({
    ...jest.requireActual('../../../src/lib/code-mode/code-history.js'),
    latestRedo: jest.fn(() => null),
    latestUndo: jest.fn(() => null)
}));
jest.mock('../../../src/lib/code-mode/code-dialogs.js', () => ({
    ...jest.requireActual('../../../src/lib/code-mode/code-dialogs.js'),
    runCodeHistory: jest.fn(() => Promise.resolve(true))
}));

const {runCodeHistory} = require('../../../src/lib/code-mode/code-dialogs.js');

const vm = {editingCommands: null};
const makeWorkbench = (tab, textState = null) => {
    const workbench = Object.create(CodeWorkbench.prototype);
    workbench.props = {vm, dispatch: jest.fn(), intl: {formatMessage: m => m.defaultMessage}};
    workbench.activeTab = () => tab;
    workbench.textState = () => textState;
    return workbench;
};

const typedView = () => {
    const view = new EditorView({state: EditorState.create({doc: 'say [hi]', extensions: [history()]})});
    view.dispatch({changes: {from: 0, insert: 'x'}});
    return view;
};

afterEach(() => {
    latestUndo.mockReset();
    latestRedo.mockReset();
    runCodeHistory.mockClear();
});

describe('Ctrl+Z in a Code mode script tab', () => {
    test('undoes typing while there is typing to undo', () => {
        const view = typedView();
        const workbench = makeWorkbench({kind: 'script', targetId: 's1'});
        expect(workbench.handleTextHistory(view, 'undo')).toBe(true);
        expect(view.state.doc.toString()).toBe('say [hi]');
        expect(latestUndo).not.toHaveBeenCalled();
        view.destroy();
    });

    test('then undoes the last apply to the file', () => {
        const view = new EditorView({state: EditorState.create({doc: 'say [hi]', extensions: [history()]})});
        const entry = {targetId: 's1', sequence: 4};
        latestUndo.mockReturnValue(entry);
        const workbench = makeWorkbench({kind: 'script', targetId: 's1'});
        expect(workbench.handleTextHistory(view, 'undo')).toBe(true);
        expect(latestUndo).toHaveBeenCalledWith('s1');
        expect(runCodeHistory).toHaveBeenCalledWith(expect.objectContaining({direction: 'undo', entry}));
        view.destroy();
    });

    test('leaves the key alone when there is nothing to undo or during collaboration', () => {
        const view = new EditorView({state: EditorState.create({doc: '', extensions: [history()]})});
        expect(makeWorkbench({kind: 'script', targetId: 's1'}).handleTextHistory(view, 'redo')).toBe(false);
        latestUndo.mockReturnValue({targetId: 's1', sequence: 1});
        const locked = makeWorkbench({kind: 'script', targetId: 's1'});
        locked.props = {...locked.props, vm: {editingCommands: {handler: {}}}};
        expect(locked.handleTextHistory(view, 'undo')).toBe(false);
        expect(runCodeHistory).not.toHaveBeenCalled();
        view.destroy();
    });
});

test('Ctrl+Z does not undo an apply while the file has unapplied text', () => {
    const view = new EditorView({state: EditorState.create({doc: 'say [hi]', extensions: [history()]})});
    latestUndo.mockReturnValue({targetId: 's1', sequence: 2});
    const workbench = makeWorkbench({kind: 'script', targetId: 's1'},
        {status: 'ready', doc: 'say [hi]', baseline: {text: 'say [bye]'}});
    expect(workbench.handleTextHistory(view, 'undo')).toBe(false);
    expect(runCodeHistory).not.toHaveBeenCalled();
    view.destroy();
});

describe('text history resets after an apply', () => {
    test('the key changes on apply, undo and redo and holds otherwise', () => {
        const workbench = makeWorkbench(null);
        expect(workbench.historyKeyFor('s1', {message: null})).toBeNull();
        const applied = workbench.historyKeyFor('s1', {message: {kind: 'applied'}, tag: {changeKey: 'a'}});
        expect(applied).toBeTruthy();
        expect(workbench.historyKeyFor('s1', {message: {kind: 'error'}, tag: {changeKey: 'b'}})).toBe(applied);
        const undid = workbench.historyKeyFor('s1', {message: {kind: 'undid'}, tag: {changeKey: 'a'}});
        expect(undid).not.toBe(applied);
        expect(workbench.historyKeyFor('s2', {message: null})).toBeNull();
    });
});
