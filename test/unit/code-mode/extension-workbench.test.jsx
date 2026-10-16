import React from 'react';
import EventEmitter from 'events';
import {createStore} from 'redux';
import {EditorState} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {CompletionContext} from '@codemirror/autocomplete';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import {CodeWorkbench} from '../../../src/containers/code-workbench.jsx';
import {ExtensionDevListener} from '../../../src/containers/extension-dev-listener.jsx';
import modalsReducer, {openExtensionManagerModal} from '../../../src/reducers/modals.js';
import {REVEAL_IN_CODE} from '../../../src/reducers/editor-tab.js';
import extensionDev, {
    addExtensionOutput,
    addRuntimeProblems,
    addScriptProblems,
    clearRuntimeProblems,
    clearScriptProblemsFor,
    extensionDevInitialState,
    resetExtensionDev
} from '../../../src/reducers/extension-dev.js';
import {openExtension, openExtensionAt, openNewExtension, openRemoveExtensions} from
    '../../../src/lib/extension-dev/actions.js';
import {extensionCompletionSource, referenceGroups} from '../../../src/lib/code-mode/extension-completion.js';
import {codeUnitsExtension, setRunning, setUnits} from '../../../src/lib/code-mode/editor-units.js';
import {clearTexts, setText} from '../../../src/lib/code-mode/text-store.js';
import {TWSecurityManagerComponent} from '../../../src/containers/tw-security-manager.jsx';
import SecurityModals from '../../../src/lib/constants/security-manager.js';
import {previewOf} from '../../../src/components/tw-security-manager-modal/unsandboxed-from-file.jsx';
import {clearBlockedProjectPrompts} from '../../../src/lib/project-prompt-blocking.js';

jest.mock('../../../src/lib/code-mode/text-controller.js', () => {
    const controller = {
        configure: () => {},
        refresh: () => Promise.resolve(null),
        edit: () => {},
        apply: () => Promise.resolve({status: 'committed'}),
        setMessage: () => {},
        identity: () => null
    };
    return {getTextController: () => controller};
});

jest.mock('../../../src/lib/extension-dev/lint-client.js', () => ({
    createLinter: () => ({lint: () => Promise.resolve([]), dispose: () => {}})
}));

const signatures = {
    myext: {
        blocks: [
            {opcode: 'double',
                blockType: 'reporter',
                text: 'double [N]',
                arguments: [{name: 'N', type: 'number', menu: null}]},
            {opcode: 'shout',
                blockType: 'command',
                text: 'shout [TEXT] times [N]',
                arguments: [{name: 'TEXT', type: 'string', menu: null}, {name: 'N', type: 'number', menu: null}]}
        ],
        menus: {}
    }
};

jest.mock('scratch-vm/src/serialization/fractch-context', () => {
    const actual = jest.requireActual('scratch-vm/src/serialization/fractch-context');
    return {...actual, getExtensionSignatures: runtime => runtime.mockSignatures || {}};
});

const makeTarget = (id, name, isStage, blocks = {}) => ({
    id,
    isOriginal: true,
    isStage,
    currentCostume: 0,
    getName: () => name,
    getCostumes: () => [],
    getSounds: () => [],
    blocks: {_blocks: blocks, getTopLevelScript: () => 'hat', getBlock: () => null}
});

const makeVm = (entries = []) => {
    const stage = makeTarget('stage', 'Stage', true);
    const sprite = makeTarget('sprite', 'Sprite1', false);
    const listeners = () => ({on: jest.fn(), off: jest.fn()});
    const vm = {
        ...listeners(),
        editingTarget: sprite,
        setEditingTarget: jest.fn(),
        extensionManager: {
            getExtensionEntries: () => entries,
            isCoreExtension: id => id === 'motion',
            isExtensionLoaded: id => id === 'myext',
            createExtension: jest.fn(() => Promise.resolve(['dropped'])),
            requestUnsandboxedAllowance: jest.fn()
        },
        runtime: {
            ...listeners(),
            targets: [stage, sprite],
            threads: [],
            _blockInfo: [],
            mockSignatures: signatures,
            getTargetForStage: () => stage,
            getTargetById: id => [stage, sprite].find(target => target.id === id),
            emitProjectChanged: jest.fn()
        }
    };
    return vm;
};

const render = (props = {}) => mountWithIntl(
    <CodeWorkbench
        devState={extensionDevInitialState}
        dispatch={jest.fn()}
        editingTarget="sprite"
        sprites={{sprite: {order: 0}}}
        vm={makeVm()}
        {...props}
    />
);

const flush = async () => {
    for (let i = 0; i < 6; i++) await new Promise(resolve => setTimeout(resolve, 0));
};

beforeEach(() => clearTexts());

describe('Manage Extensions window removal', () => {
    test('openExtensionManagerModal returns the plain REVEAL_IN_CODE action and no modal key exists', () => {
        expect(openExtensionManagerModal()).toEqual({type: REVEAL_IN_CODE, request: {kind: 'extensions'}});
        expect(Object.keys(modalsReducer(undefined, {type: 'init'}))).not.toContain('extensionManagerModal');
    });

    test('every actions.js helper dispatches REVEAL_IN_CODE', () => {
        const dispatched = [];
        const dispatch = action => dispatched.push(action);
        openExtension(dispatch, 'myext');
        openExtensionAt(dispatch, 'myext', {line: 3});
        openNewExtension(dispatch, 'source');
        openRemoveExtensions(dispatch, ['myext']);
        expect(dispatched.map(action => action.type)).toEqual(new Array(4).fill(REVEAL_IN_CODE));
        expect(dispatched.map(action => action.request)).toEqual([
            {kind: 'extension', id: 'myext'},
            {kind: 'extension', id: 'myext', location: {line: 3}},
            {kind: 'newExtension', source: 'source'},
            {kind: 'removeExtensions', ids: ['myext']}
        ]);
    });

    test('new and remove requests open as editor tabs in the workbench', async () => {
        const entry = {id: 'myext', name: 'My Ext', kind: 'embedded', status: 'loaded', mode: 'iframe', url: 'data:,'};
        const vm = makeVm([entry]);
        vm.getExtensionUsage = () => ({targets: [], totalBlocks: 0, totalHatScripts: 0, totalMonitors: 0});
        const wrapper = render({vm, reveal: {kind: 'newExtension', nonce: 1}});
        await flush();
        wrapper.update();
        expect(wrapper.find('[role="tab"]').map(node => node.text())
            .some(text => text.includes('New extension'))).toBe(true);
        wrapper.setProps({reveal: {kind: 'removeExtensions', ids: ['myext'], nonce: 2}});
        await flush();
        wrapper.update();
        expect(wrapper.find('[role="tab"]').map(node => node.text())
            .some(text => text.includes('Remove extensions'))).toBe(true);
        wrapper.unmount();
    });

    test('a dropped .js file loads sandboxed and never asks for the unsandboxed allowance', async () => {
        const vm = makeVm();
        const wrapper = render({vm});
        const file = {name: 'thing.js', type: 'text/javascript', text: () => Promise.resolve('source')};
        wrapper.find(CodeWorkbench).instance()
            .dropFiles([file], {type: 'extensions'});
        await flush();
        expect(vm.extensionManager.createExtension).toHaveBeenCalledWith('source', {unsandboxed: false});
        expect(vm.extensionManager.requestUnsandboxedAllowance).not.toHaveBeenCalled();
        wrapper.unmount();
    });
});

describe('unsandboxedFromFile prompt', () => {
    beforeEach(() => clearBlockedProjectPrompts());

    test('shows the file name and the first 40 lines, and only allows on Run', async () => {
        const component = new TWSecurityManagerComponent({vm: {runtime: {projectName: 'p'}}, securityManager: {}});
        component.setState = update => Object.assign(component.state,
            typeof update === 'function' ? update(component.state) : update);
        const source = Array.from({length: 60}, (_, index) => `line ${index + 1}`).join('\n');
        const pending = component.canRunUnsandboxedFromFile('thing.js', source, 'thing');
        await flush();
        expect(component.state.type).toBe(SecurityModals.UnsandboxedFromFile);
        expect(component.state.data).toEqual({fileName: 'thing.js', source});
        expect(previewOf(source).split('\n')).toHaveLength(40);
        component.handleAllowed();
        expect(await pending).toBe(true);
        const denied = component.canRunUnsandboxedFromFile('thing.js', source, 'thing');
        await flush();
        component.handleDenied();
        expect(await denied).toBe(false);
    });

    test('is never bypassed by trusted projects or the allow-all switch', () => {
        const component = new TWSecurityManagerComponent({
            vm: {runtime: {projectName: 'p', _mwProjectTrusted: true}},
            securityManager: {}
        });
        window.__mwAllowAllSecurity = true;
        try {
            expect(component.isSecurityBypassed('canRunUnsandboxedFromFile', [])).toBe(false);
        } finally {
            delete window.__mwAllowAllSecurity;
        }
    });
});

describe('extension completion and block reference', () => {
    const vm = {runtime: {mockSignatures: signatures}, extensionManager: {isCoreExtension: () => false}};
    const complete = text => {
        const state = EditorState.create({doc: text});
        return extensionCompletionSource(() => vm)(new CompletionContext(state, text.length, false));
    };

    test('offers loaded extension blocks with their argument names', () => {
        const result = complete('when flag { say myext.d');
        expect(result.options.map(option => [option.label, option.detail])).toEqual([
            ['myext.double', '(N)'],
            ['myext.shout', '(TEXT, N)']
        ]);
        expect(complete('when flag { say mye').options.length).toBe(2);
        expect(complete('when flag { say zz')).toBeNull();
    });

    test('the reference lists core aliases and extension blocks', () => {
        const groups = referenceGroups(vm);
        const extension = groups.find(group => group.kind === 'myext');
        expect(extension.items.map(item => item.insert)).toEqual(['myext.double(N)', 'myext.shout(TEXT, N);']);
        expect(groups.some(group => group.kind === 'keyword' && group.items.some(item => item.name === 'say')))
            .toBe(true);
    });
});

describe('runtime errors in Problems and Output', () => {
    const devState = {
        ...extensionDevInitialState,
        runtimeProblems: {myext: [{
            key: 'block:say1r',
            kind: 'block',
            extensionId: 'myext',
            opcode: 'myext_double',
            blockId: 'r',
            targetId: 'sprite',
            message: 'boom',
            line: 12,
            column: 3,
            severity: 'error',
            count: 1,
            text: 'boom'
        }]},
        scriptProblems: {sprite: [{key: 'thread:hat2', targetId: 'sprite', topId: 'hat2', message: 'oops', count: 1}]}
    };
    const entry = {id: 'myext', name: 'My Ext', kind: 'embedded', status: 'loaded', mode: 'iframe', url: 'data:,'};

    test('extension errors show the JS line and the calling script line; script errors show their script', () => {
        const text = 'when flag at 0,0 {\n  say myext.double(4);\n}\n\nwhen flag at 0,200 {\n  x;\n}\n';
        setText('sprite', {
            targetId: 'sprite',
            status: 'ready',
            doc: text,
            baseline: {text,
                sourceMap: {blocks: {
                    r: {from: 25, to: 40, line: 2},
                    say1: {from: 21, to: 41, line: 2},
                    hat2: {from: 45, to: 70, line: 5}
                }}},
            units: {},
            diagnostics: []
        });
        const wrapper = render({devState, vm: makeVm([entry])});
        const groups = wrapper.find(CodeWorkbench).instance()
            .problemGroups();
        const script = groups.find(group => group.key === 'script:sprite');
        expect(script.problems.map(problem => [problem.line, problem.message])).toEqual([
            [5, 'Runtime error: oops'],
            [2, 'myext.double threw: boom (myext.js:12)']
        ]);
        const extension = groups.find(group => group.key === 'extension:myext');
        expect(extension.problems[0]).toMatchObject({line: 12, message: 'boom (called from Sprite1/scripts.fractch:2)'});
        const instance = wrapper.find(CodeWorkbench).instance();
        expect(instance.outputLocation({extensionId: 'myext', line: 12})).toBe('myext.js:12');
        expect(instance.outputLocation({targetId: 'sprite', blockId: 'r'})).toBe('Sprite1/scripts.fractch:2');
        wrapper.unmount();
    });

    test('the listener records errors and console output and clears them by the plan rules', async () => {
        const store = createStore(extensionDev);
        const runtime = new EventEmitter();
        const vm = {runtime, editingTarget: null};
        const target = {id: 'sprite', sprite: {clones: []}};
        const props = () => ({
            intl: {formatMessage: message => message.defaultMessage},
            vm,
            runtimeProblems: store.getState().runtimeProblems,
            scriptProblems: store.getState().scriptProblems,
            onAddOutput: entries => store.dispatch(addExtensionOutput(entries)),
            onAddRuntimeProblems: problems => store.dispatch(addRuntimeProblems(problems)),
            onAddScriptProblems: problems => store.dispatch(addScriptProblems(problems)),
            onClearRuntimeProblems: id => store.dispatch(clearRuntimeProblems(id)),
            onClearScriptProblems: (targetId, topId) => store.dispatch(clearScriptProblemsFor(targetId, topId)),
            onReset: () => store.dispatch(resetExtensionDev())
        });
        const wrapper = mountWithIntl(<ExtensionDevListener {...props()} />);
        const rerender = () => wrapper.setProps(props());
        const wait = () => new Promise(resolve => setTimeout(resolve, 300));

        runtime.emit('THREAD_ERROR', {thread: {target, topBlock: 'hat'}, error: new Error('oops')});
        runtime.emit('EXTENSION_ERROR', {extensionId: 'myext',
            blockId: 'r',
            targetId: 'sprite',
            message: 'boom',
            line: 12});
        runtime.emit('EXTENSION_CONSOLE', {extensionId: 'myext', level: 'warn', message: 'hi', line: 9});
        await wait();
        rerender();
        let state = store.getState();
        expect(state.scriptProblems.sprite).toHaveLength(1);
        expect(state.runtimeProblems.myext).toHaveLength(1);
        expect(state.output.map(item => [item.source, item.level, item.text])).toEqual([
            ['runtime', 'error', 'boom'],
            ['runtime', 'error', 'oops'],
            ['console', 'warning', 'hi']
        ]);

        runtime.emit('THREAD_STARTED', {target, topBlock: 'other'});
        expect(store.getState().scriptProblems.sprite).toHaveLength(1);
        runtime.emit('THREAD_STARTED', {target, topBlock: 'hat'});
        expect(store.getState().scriptProblems.sprite).toBeUndefined();

        runtime.emit('EXTENSION_ERROR', {extensionId: 'myext', blockId: 'r2', message: 'late'});
        runtime.emit('EXTENSION_RELOADED', {id: 'myext', added: [], changed: [], removed: []});
        await wait();
        state = store.getState();
        expect(state.runtimeProblems.myext).toBeUndefined();
        expect(state.output.some(item => item.text === 'late')).toBe(false);

        store.dispatch(addScriptProblems([{targetId: 'sprite', topId: 'hat', message: 'again'}]));
        rerender();
        runtime.emit('TARGET_SCRIPTS_REPLACED', 'sprite');
        expect(store.getState().scriptProblems.sprite).toBeUndefined();
        wrapper.unmount();
    });
});

describe('extension tabs in the workbench', () => {
    const entry = {id: 'myext', name: 'My Ext', kind: 'embedded', status: 'loaded', mode: 'iframe', url: 'data:,'};

    test('Mod+Enter in an extension tab applies the edited source', async () => {
        const vm = makeVm([entry]);
        Object.assign(vm.extensionManager, {
            getExtensionSource: jest.fn(() => Promise.resolve('v1')),
            getExtensionMode: () => 'iframe',
            reloadExtension: jest.fn(() => Promise.resolve({ids: ['myext'], removed: [], added: [], changed: []}))
        });
        const session = require('../../../src/lib/extension-dev/session.js');
        session.resetSession();
        session.markAuthored('myext');
        const wrapper = render({vm, reveal: {kind: 'extension', id: 'myext', nonce: 3}});
        await flush();
        const instance = wrapper.find(CodeWorkbench).instance();
        expect(instance.activeTab()).toMatchObject({kind: 'extension', extensionId: 'myext'});
        const view = EditorView.findFromDOM(wrapper.getDOMNode().querySelector('[data-mw-text-tab] .cm-editor'));
        view.dispatch({changes: {from: 2, insert: '!'}});
        expect(session.getDraft('myext')).toBe('v1!');
        const {executeShortcut} = require('../../../src/lib/shortcuts/event-router.js');
        executeShortcut({actionType: 'callback', action: 'applyFile'});
        await flush();
        expect(vm.extensionManager.reloadExtension).toHaveBeenCalledWith('myext', 'v1!',
            expect.objectContaining({confirm: expect.any(Function)}));
        expect(session.getDraft('myext')).toBeNull();
        wrapper.unmount();
    });

    test('Go to definition on myext.double in text opens myext.js at the method', () => {
        const wrapper = render({vm: makeVm([entry])});
        const instance = wrapper.find(CodeWorkbench).instance();
        const doc = 'when flag {\n  say myext.double(4);\n}\n';
        const view = new EditorView({state: EditorState.create({doc})});
        instance.activeTab = () => ({kind: 'script', targetId: 'sprite', key: 'script:sprite'});
        instance.activeEditorView = () => view;
        const reveal = jest.spyOn(instance, 'handleReveal').mockImplementation(() => {});
        expect(instance.handleGoToDefinition(doc.indexOf('double') + 1)).toBe(true);
        expect(reveal).toHaveBeenCalledWith({kind: 'extension', id: 'myext', location: {opcode: 'double'}});
        expect(instance.handleGoToDefinition(0)).toBe(false);
        view.destroy();
        wrapper.unmount();
    });

    test('the running marker follows the threads of the open target, clones included', () => {
        const vm = makeVm();
        const wrapper = render({vm});
        const instance = wrapper.find(CodeWorkbench).instance();
        const sprite = vm.runtime.getTargetById('sprite');
        const clone = {id: 'clone', sprite: {clones: [sprite]}};
        vm.runtime.threads = [
            {target: clone, topBlock: 'a', status: 0},
            {target: sprite, topBlock: 'done', status: 4},
            {target: vm.runtime.getTargetById('stage'), topBlock: 'stage', status: 0}
        ];
        const calls = [];
        const view = {state: {field: () => new Set()}, dispatch: tr => calls.push(Array.from(tr.effects.value))};
        instance.activeTab = () => ({kind: 'script', targetId: 'sprite'});
        instance.activeEditorView = () => view;
        instance.pollRunning();
        expect(calls).toEqual([['a']]);
        wrapper.unmount();
    });
});

describe('running script markers', () => {
    test('a script with a live thread gets the running marker on its first line', () => {
        const parent = document.body.appendChild(document.createElement('div'));
        const options = {
            callbacks: {current: {onRun: () => {}, onShowBlock: () => {}}},
            classes: {run: 'run', running: 'running'},
            labels: {run: 'Run', running: 'Running', showBlock: 'Show', lockedReason: 'Locked'}
        };
        const view = new EditorView({
            parent,
            state: EditorState.create({doc: 'when flag {\n}\nwhen flag {\n}\n', extensions: codeUnitsExtension(options)})
        });
        setUnits(view, {locked: [], runs: [{topId: 'a', from: 0, to: 13}, {topId: 'b', from: 14, to: 27}]});
        setRunning(view, ['b']);
        const running = Array.from(parent.querySelectorAll('button.running'));
        expect(running).toHaveLength(1);
        expect(running[0].dataset.running).toBe('true');
        expect(running[0].title).toBe('Running. Run');
        setRunning(view, []);
        expect(parent.querySelectorAll('button.running')).toHaveLength(0);
        view.destroy();
    });
});
