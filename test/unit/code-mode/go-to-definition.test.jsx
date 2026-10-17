import React from 'react';
import VM from 'scratch-vm';
import {EditorView} from '@codemirror/view';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import {CodeWorkbench} from '../../../src/containers/code-workbench.jsx';
import editorTab, {REVEAL_IN_CODE} from '../../../src/reducers/editor-tab.js';
import {extensionDevInitialState} from '../../../src/reducers/extension-dev.js';
import {blockItems} from '../../../src/lib/extension-dev/workspace-menus.js';
import {broadcastReceivers, procedureDefinition, symbolAt} from '../../../src/lib/code-mode/definition.js';
import {clearTexts} from '../../../src/lib/code-mode/text-store.js';
import {resetSession} from '../../../src/lib/extension-dev/session.js';

jest.mock('../../../src/lib/extension-dev/lint-client.js', () => ({
    createLinter: () => ({lint: () => Promise.resolve([]), dispose: () => {}})
}));

if (!Range.prototype.getClientRects) {
    Range.prototype.getClientRects = () => [];
    Range.prototype.getBoundingClientRect = () => ({left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0});
}

const SOURCE = [
    '(function (Scratch) {',
    '  class MyExt {',
    '    getInfo () {',
    '      return {id: \'myext\', name: \'My Ext\', blocks: [',
    '        {opcode: \'double\', blockType: \'reporter\', text: \'double [N]\', arguments: {N: {type: \'number\'}}}',
    '      ]};',
    '    }',
    '    double (args) {',
    '      return args.N * 2;',
    '    }',
    '  }',
    '  Scratch.extensions.register(new MyExt());',
    '})(Scratch);'
].join('\n');

const toDataURL = source => `data:application/javascript,${encodeURIComponent(source)}`;

const KINDS = {
    sandboxed: {url: toDataURL(SOURCE), mode: 'iframe', service: 'extension.0.myext'},
    unsandboxed: {url: toDataURL(SOURCE), mode: 'unsandboxed', service: 'unsandboxed.0.myext'},
    url: {url: 'https://example.com/myext.js', mode: 'iframe', service: 'extension.0.myext'},
    embedded: {url: toDataURL(SOURCE), mode: 'iframe', service: 'extension.0.myext', fromProject: true}
};

const makeVm = kind => {
    const vm = new VM();
    const manager = vm.extensionManager;
    const config = KINDS[kind];
    manager._loadedExtensions.set('myext', config.service);
    manager.workerURLs[0] = config.url;
    manager._workerLoadedURLs[0] = config.url;
    manager._workerModes[0] = config.mode;
    if (kind === 'sandboxed') manager._runningSources[0] = SOURCE;
    vm.runtime._blockInfo.push({id: 'myext', name: 'My Ext', blocks: [], menuInfo: {}});
    return vm;
};

const flush = async () => {
    for (let i = 0; i < 10; i++) await new Promise(resolve => setTimeout(resolve, 0));
};

const intl = {formatMessage: message => message.defaultMessage};

describe('Go to definition', () => {
    let originalFetch;
    beforeEach(() => {
        clearTexts();
        resetSession();
        originalFetch = global.fetch;
        global.fetch = jest.fn(() => Promise.resolve({ok: true, text: () => Promise.resolve(SOURCE)}));
    });
    afterEach(() => {
        global.fetch = originalFetch;
    });

    for (const kind of Object.keys(KINDS)) {
        test(`from a ${kind} extension block opens myext.js at the method in Code mode`, async () => {
            const vm = makeVm(kind);
            const dispatched = [];
            const items = blockItems({vm, intl, dispatch: action => dispatched.push(action), runtimeProblems: {}},
                {type: 'myext_double', id: 'b1'});
            const item = items.find(each => each.text === 'Go to definition');
            expect(item).toBeTruthy();
            item.callback();
            expect(dispatched).toHaveLength(1);
            expect(dispatched[0].type).toBe(REVEAL_IN_CODE);
            const state = editorTab(undefined, dispatched[0]);
            expect(state.editorMode).toBe('code');
            expect(state.reveal).toMatchObject({kind: 'extension', id: 'myext', location: {opcode: 'double'}});

            const wrapper = mountWithIntl(
                <CodeWorkbench
                    devState={extensionDevInitialState}
                    dispatch={jest.fn()}
                    reveal={state.reveal}
                    sprites={{}}
                    vm={vm}
                />,
                {attachTo: document.body.appendChild(document.createElement('div'))}
            );
            await flush();
            wrapper.update();
            const tabs = wrapper.find('[role="tab"]').map(node => node.text());
            expect(tabs.some(text => text.includes('myext.js'))).toBe(true);
            const host = wrapper.getDOMNode().querySelector('[data-mw-text-tab="true"] .cm-editor');
            expect(host).toBeTruthy();
            const view = EditorView.findFromDOM(host);
            const {from, to} = view.state.selection.main;
            expect(view.state.sliceDoc(from, to)).toBe('double');
            expect(view.state.doc.lineAt(from).number).toBe(8);
            wrapper.unmount();
        });
    }

    test('in text finds the symbol under the cursor', () => {
        const text = 'when flag {\n  say myext.double(4);\n  @my_proc("x");\n  broadcast "spawn now";\n}\n' +
            'def @my_proc(thing) "my proc %s" {}\n';
        expect(symbolAt(text, text.indexOf('double') + 2)).toEqual({kind: 'extension', id: 'myext', member: 'double'});
        expect(symbolAt(text, text.indexOf('@my_proc') + 3)).toEqual({kind: 'procedure', name: 'my_proc'});
        expect(symbolAt(text, text.indexOf('spawn') + 1)).toEqual({kind: 'broadcast', name: 'spawn now'});
        expect(symbolAt(text, 0)).toBeNull();
        const range = procedureDefinition(text, 'my_proc');
        expect(text.slice(range.from, range.to)).toBe('@my_proc');
        expect(text.slice(0, range.from)).toContain('def ');
    });

    test('a broadcast lists every receiver, case-insensitively', () => {
        const hat = id => ({id, opcode: 'event_whenbroadcastreceived', fields: {BROADCAST_OPTION: {value: 'Spawn Now'}}});
        const target = (id, name, blocks) => ({
            id,
            isOriginal: true,
            isStage: false,
            getName: () => name,
            blocks: {_blocks: blocks}
        });
        const vm = {runtime: {targets: [
            target('a', 'Sprite1', {h1: hat('h1')}),
            target('b', 'Sprite2', {h2: hat('h2'), x: {id: 'x', opcode: 'motion_movesteps', fields: {}}})
        ]}};
        expect(broadcastReceivers(vm, 'spawn now')).toEqual([
            {targetId: 'a', targetName: 'Sprite1', blockId: 'h1'},
            {targetId: 'b', targetName: 'Sprite2', blockId: 'h2'}
        ]);
    });
});
