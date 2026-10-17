import React from 'react';
import TestRenderer from 'react-test-renderer';
import {IntlProvider} from 'react-intl';

import EditorPane from '../../../src/components/extension-dev/editor-pane.jsx';

jest.mock('../../../src/components/extension-dev/code-editor.jsx', () => {
    const MockReact = require('react');
    return {
        __esModule: true,
        default: props => {
            global.__editorProps.push(props);
            return MockReact.createElement('div');
        }
    };
});

jest.mock('../../../src/lib/extension-dev/lint-client.js', () => ({
    createLinter: () => ({
        lint: source => Promise.resolve(source.includes('SYNTAX') ?
            [{severity: 'error', code: 'syntax', message: 'Unexpected token', line: 1, column: 1}] : []),
        dispose: () => {}
    })
}));

jest.mock('../../../src/lib/api/restore-points.js', () => ({
    __esModule: true,
    default: {createSafetyRestorePoint: () => Promise.resolve()}
}));

const SOURCE = [
    'class X {',
    '    getInfo () {',
    '        return {id: \'foo\', blocks: [{opcode: \'bar\', func: \'doBar\'}]};',
    '    }',
    '    doBar () {',
    '        return 1;',
    '    }',
    '}',
    'Scratch.extensions.register(new X());'
].join('\r\n');

const flush = async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
};

const render = (vm, extra = {}) => {
    const props = {
        dispatch: () => {},
        entry: {id: 'foo', name: 'Foo', kind: 'embedded', status: 'loaded', mode: 'iframe', url: 'data:,'},
        focus: null,
        loadProblems: [],
        output: [],
        runtimeProblems: [],
        vm,
        onApplied: () => {},
        onClearOutput: () => {},
        onDismissProblem: () => {},
        onEntriesChanged: () => {},
        onFocusHandled: () => {},
        onRemove: () => {},
        onSetLoadProblems: () => {},
        onSetStaticProblems: () => {},
        onShowBlock: () => {},
        ...extra
    };
    let renderer;
    TestRenderer.act(() => {
        renderer = TestRenderer.create(
            <IntlProvider locale="en">
                <EditorPane {...props} />
            </IntlProvider>
        );
    });
    return renderer;
};

const lastEditor = () => global.__editorProps[global.__editorProps.length - 1];

beforeEach(() => {
    global.__editorProps = [];
    jest.useFakeTimers();
});

afterEach(() => {
    jest.useRealTimers();
});

test('Go to definition lands on the method when the pane opens on it', async () => {
    const vm = {extensionManager: {getExtensionSource: () => Promise.resolve(SOURCE)}, runtime: {}};
    const handled = [];
    render(vm, {focus: {opcode: 'bar', at: 7}, onFocusHandled: at => handled.push(at)});
    await TestRenderer.act(flush);
    const editor = lastEditor();
    expect(editor.value.includes('\r')).toBe(false);
    expect(editor.focus).not.toBeNull();
    expect(editor.value.slice(editor.focus.from, editor.focus.to)).toBe('doBar');
    expect(handled).toEqual([7]);
});

test('an edit typed while an apply is running is applied afterwards', async () => {
    let finishFirst;
    const applied = [];
    const vm = {
        extensionManager: {
            getExtensionSource: () => Promise.resolve('a'),
            getExtensionMode: () => 'iframe',
            reloadExtension: (id, source) => {
                applied.push(source);
                if (applied.length === 1) {
                    return new Promise(resolve => {
                        finishFirst = () => resolve({removed: [], added: [], changed: []});
                    });
                }
                return Promise.resolve({removed: [], added: [], changed: []});
            }
        },
        runtime: {emitProjectChanged: () => {}}
    };
    const {isAuthored, markAuthored} = require('../../../src/lib/extension-dev/session.js');
    if (!isAuthored('foo')) markAuthored('foo');
    const applyRef = {current: null};
    render(vm, {applyRef});
    await TestRenderer.act(flush);
    await TestRenderer.act(async () => {
        lastEditor().onChange('ab');
        applyRef.current();
        await flush();
    });
    await TestRenderer.act(async () => {
        lastEditor().onChange('abc');
        applyRef.current();
        await flush();
    });
    expect(applied).toEqual(['ab']);
    await TestRenderer.act(async () => {
        finishFirst();
        await flush();
    });
    expect(applied).toEqual(['ab', 'abc']);
});

test('reloading keeps unapplied edits as a draft', async () => {
    const session = require('../../../src/lib/extension-dev/session.js');
    session.resetSession();
    session.markAuthored('foo');
    const vm = {
        extensionManager: {
            getExtensionSource: () => Promise.resolve('a'),
            reloadExtension: () => Promise.resolve({removed: [], added: [], changed: []})
        },
        runtime: {emitProjectChanged: () => {}}
    };
    const {reloadEntry} = require('../../../src/lib/extension-dev/actions.js');
    render(vm);
    await TestRenderer.act(flush);
    await TestRenderer.act(async () => {
        lastEditor().onChange('a edited');
        await flush();
    });
    await TestRenderer.act(async () => {
        await reloadEntry({
            vm,
            dispatch: () => {},
            entry: {id: 'foo', name: 'Foo', kind: 'embedded', status: 'loaded'},
            intl: {formatMessage: message => message.defaultMessage},
            messages: require('../../../src/components/extension-dev/messages.js').default
        });
        await flush();
    });
    expect(session.getDraft('foo')).toBe('a edited');
    expect(session.hasUnappliedEdits()).toBe(true);
});

test('a reload that replaces the document resets undo history', () => {
    const {EditorState, Transaction} = require('@codemirror/state');
    const {history, undo} = require('@codemirror/commands');
    let state = EditorState.create({doc: 'old', extensions: [history()]});
    state = state.update({changes: {from: 0, to: 3, insert: 'new'}, annotations: Transaction.addToHistory.of(false)}).state;
    let undone = state;
    undo({state,
        dispatch: tr => {
            undone = tr.state;
        }});
    expect(undone.doc.toString()).toBe('new');
});

test('a syntax error blocks apply and shows the reason', async () => {
    const reloadExtension = jest.fn(() => Promise.resolve({removed: [], added: [], changed: []}));
    const vm = {
        extensionManager: {getExtensionSource: () => Promise.resolve('a'),
            getExtensionMode: () => 'iframe',
            reloadExtension},
        runtime: {emitProjectChanged: () => {}}
    };
    const session = require('../../../src/lib/extension-dev/session.js');
    session.resetSession();
    session.markAuthored('foo');
    const applyRef = {current: null};
    const shown = [];
    render(vm, {applyRef, onShowProblems: () => shown.push(true)});
    await TestRenderer.act(flush);
    let result;
    await TestRenderer.act(async () => {
        lastEditor().onChange('a SYNTAX');
        result = await applyRef.current();
        await flush();
    });
    expect(result).toEqual({status: 'invalid'});
    expect(reloadExtension).not.toHaveBeenCalled();
    expect(shown).toEqual([true]);
});

test('an undo that reloads the extension turns a dirty tab into a read-only diff draft', async () => {
    const EventEmitter = require('events');
    const DiffView = require('../../../src/components/code-mode/diff-view.jsx').default;
    let source = 'a';
    const runtime = new EventEmitter();
    runtime.emitProjectChanged = () => {};
    const vm = {extensionManager: {getExtensionSource: () => Promise.resolve(source)}, runtime};
    const session = require('../../../src/lib/extension-dev/session.js');
    session.resetSession();
    session.markAuthored('foo');
    const renderer = render(vm);
    await TestRenderer.act(flush);
    await TestRenderer.act(async () => {
        lastEditor().onChange('a edited');
        await flush();
    });
    await TestRenderer.act(async () => {
        source = 'from undo';
        runtime.emit('EXTENSION_RELOADED', {id: 'foo'});
        await flush();
    });
    const diff = renderer.root.findByType(DiffView);
    expect(diff.props.sections[0]).toMatchObject({before: 'from undo', after: 'a edited'});
    expect(session.getDraft('foo')).toBeNull();
});
