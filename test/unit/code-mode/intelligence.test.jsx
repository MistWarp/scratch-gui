import React from 'react';
import {CompletionContext} from '@codemirror/autocomplete';
import {EditorState} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import {CodeWorkbench} from '../../../src/containers/code-workbench.jsx';
import {extensionDevInitialState} from '../../../src/reducers/extension-dev.js';
import {block, loadVm} from '../../helpers/code-mode-fixture.js';
import {createFractchClient} from '../../../src/lib/code-mode/fractch-client.js';
import {createTextController} from '../../../src/lib/code-mode/text-controller.js';
import {clearTexts, getText} from '../../../src/lib/code-mode/text-store.js';
import {
    blockInfo,
    coreBlocks,
    editableSymbol,
    findReferences,
    fractchCompletionSource,
    hoveredOpcodes,
    procedureRenameChanges
} from '../../../src/lib/code-mode/intelligence.js';

jest.mock('../../../src/lib/extension-dev/lint-client.js', () => ({
    createLinter: () => ({lint: () => Promise.resolve([]), dispose: () => {}})
}));

if (!Range.prototype.getClientRects) {
    Range.prototype.getClientRects = () => [];
    Range.prototype.getBoundingClientRect = () => ({left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0});
}

const flush = async () => {
    for (let i = 0; i < 20; i++) await new Promise(resolve => setTimeout(resolve, 0));
};

const spriteBlocks = () => ({
    hat: block('event_whenflagclicked', {next: 'set', topLevel: true, x: 0, y: 0}),
    set: block('data_setvariableto', {
        parent: 'hat',
        next: 'add',
        inputs: {VALUE: [1, [10, '1']]},
        fields: {VARIABLE: ['score', 'v1']}
    }),
    add: block('data_addtolist', {
        parent: 'set',
        next: 'cast',
        inputs: {ITEM: [1, [10, 'x']]},
        fields: {LIST: ['inv', 'l1']}
    }),
    cast: block('event_broadcast', {parent: 'add', inputs: {BROADCAST_INPUT: [1, [11, 'go', 'b1']]}})
});

const field = (name, value, id) => ({[name]: {name, value, id}});

const receiverBlocks = () => [
    block('event_whenbroadcastreceived', {
        id: 'when',
        next: 'change',
        topLevel: true,
        x: 0,
        y: 0,
        fields: field('BROADCAST_OPTION', 'go', 'b1')
    }),
    block('data_changevariableby', {
        id: 'change',
        parent: 'when',
        inputs: {VALUE: {name: 'VALUE', block: 'one', shadow: 'one'}},
        fields: field('VARIABLE', 'score', 'v1')
    }),
    block('math_number', {id: 'one', parent: 'change', shadow: true, fields: field('NUM', '1')})
];

const setup = async () => {
    const loaded = await loadVm({spriteBlocks: spriteBlocks()});
    const stage = loaded.stage;
    stage.createVariable('l1', 'inv', 'list');
    stage.createVariable('b1', 'go', 'broadcast_msg');
    const sprite2 = loaded.vm.runtime.targets.find(target => target.getName && target.getName() === 'Sprite2');
    for (const each of receiverBlocks()) sprite2.blocks.createBlock(each);
    return {...loaded, sprite2};
};

const complete = (vm, targetId, text, pos = text.length) => {
    const state = EditorState.create({doc: text});
    return fractchCompletionSource(() => vm, () => targetId)(new CompletionContext(state, pos, false));
};

const labels = result => (result ? result.options.map(option => option.label) : []);

describe('fractch completion', () => {
    let vm;
    let sprite;
    beforeEach(async () => {
        ({vm, sprite} = await setup());
    });
    afterEach(() => vm.quit());

    test('core blocks complete by namespace with their argument names', () => {
        const result = complete(vm, sprite.id, 'when flag { motion.chan');
        const option = result.options.find(each => each.label === 'motion.changexby');
        expect(option.detail).toBe('(DX)');
        expect(labels(result)).not.toContain('looks.say');
        expect(coreBlocks().find(each => each.opcode === 'control_stop').args).toEqual([
            {name: 'STOP_OPTION', kind: 'field'}
        ]);
    });

    test('names complete in their contexts', () => {
        expect(labels(complete(vm, sprite.id, 'when flag { say sco'))).toEqual(expect.arrayContaining(['score']));
        expect(labels(complete(vm, sprite.id, 'when flag { say sco'))).toContain('say');
        expect(labels(complete(vm, sprite.id, 'when flag { append(i'))).toEqual(['inv']);
        expect(labels(complete(vm, sprite.id, 'when flag { broadcast "'))).toEqual(['go']);
        expect(labels(complete(vm, sprite.id, 'when flag { costume "'))).toEqual(['costume1']);
        expect(labels(complete(vm, sprite.id, 'when flag { clone "'))).toEqual(['Sprite1', 'Sprite2']);
        expect(labels(complete(vm, sprite.id, 'when flag { say "a'))).toEqual(
            expect.arrayContaining(['costume1', 'backdrop1', 'go', 'Sprite2']));
        const text = 'def @Jump(height) {}\nwhen flag { @J';
        expect(labels(complete(vm, sprite.id, text))).toEqual(['Jump']);
    });
});

describe('fractch hover', () => {
    afterEach(() => {
        delete window.ScratchBlocks;
    });

    test('names the block under the cursor, raw or aliased', () => {
        expect(hoveredOpcodes(null, 'motion.changexby(DX: 1);', 3).opcodes).toEqual(['motion_changexby']);
        const alias = hoveredOpcodes(null, '  setX 5;', 3);
        expect(alias.opcodes).toEqual(['motion_setx']);
        expect(alias.entries[0].name).toBe('setX');
        expect(hoveredOpcodes(null, '  score = 1;', 3)).toBeNull();
    });

    test('reads the block text and category color from scratch-blocks', () => {
        window.ScratchBlocks = {
            Colours: {motion: {primary: '#4C97FF'}},
            Blocks: {motion_changexby: {init () {
                this.jsonInit({
                    message0: 'change x by %1',
                    args0: [{type: 'input_value', name: 'DX'}],
                    extensions: ['colours_motion', 'shape_statement']
                });
            }}}
        };
        expect(blockInfo('motion_changexby')).toEqual({
            text: 'change x by (DX)',
            color: '#4C97FF',
            shape: 'statement'
        });
        expect(blockInfo('motion_movesteps')).toBeNull();
    });
});

describe('references and rename', () => {
    let vm;
    let sprite;
    let sprite2;
    beforeEach(async () => {
        clearTexts();
        ({vm, sprite, sprite2} = await setup());
    });
    afterEach(() => vm.quit());

    const text = 'when flag {\n  score = 1;\n  append(inv, "x");\n  broadcast go;\n  say inv.length;\n}\n';

    test('resolves variables, lists and broadcasts under the cursor', () => {
        const at = word => text.indexOf(word) + 1;
        expect(editableSymbol(vm, sprite.id, text, at('score'))).toEqual({kind: 'variable', name: 'score', id: 'v1'});
        expect(editableSymbol(vm, sprite.id, text, at('inv,'))).toEqual({kind: 'list', name: 'inv', id: 'l1'});
        expect(editableSymbol(vm, sprite.id, text, at('inv.length'))).toMatchObject({kind: 'list'});
        expect(editableSymbol(vm, sprite.id, text, at('go;'))).toEqual({kind: 'broadcast', name: 'go', id: 'b1'});
        expect(editableSymbol(vm, sprite.id, text, at('when'))).toBeNull();
    });

    test('finds references across sprites', () => {
        const score = findReferences(vm, sprite.id, {kind: 'variable', id: 'v1'});
        expect(score.map(ref => ref.targetId).sort()).toEqual([sprite.id, sprite2.id].sort());
        const cast = findReferences(vm, sprite.id, {kind: 'broadcast', id: 'b1'});
        expect(cast).toEqual(expect.arrayContaining([{targetId: sprite.id, blockId: 'cast'}]));
        expect(cast.some(ref => ref.targetId === sprite2.id)).toBe(true);
        const procs = findReferences(vm, sprite.id, {kind: 'procedure', name: 'go'},
            'def @go() {}\nwhen flag { @go(); @gone(); }');
        expect(procs).toHaveLength(2);
    });

    test('procedure rename edits every call and the custom label', () => {
        const source = 'def @old(n) "old %s times" {}\nwhen flag { @old(1); @older(2); }';
        const changes = procedureRenameChanges(source, 'old', 'jump');
        const state = EditorState.create({doc: source}).update({changes}).state;
        expect(state.doc.toString()).toBe('def @jump(n) "jump %s times" {}\nwhen flag { @jump(1); @older(2); }');
    });

    test('renaming a variable or broadcast updates every block and regenerates text', async () => {
        const client = createFractchClient();
        const controller = createTextController({vm, client});
        try {
            await controller.regenerate(sprite.id);
            await controller.regenerate(sprite2.id);
            expect(getText(sprite.id).doc).toContain('score');
            expect(vm.renameVariable('v1', 'lives')).toBe(false);
            expect(vm.renameVariable('v1', 'points')).toBe(true);
            expect(vm.renameBroadcast('b1', 'GO')).toBe(true);
            expect(vm.renameBroadcast('b1', 'start')).toBe(true);
            expect(sprite.blocks.getBlock('set').fields.VARIABLE.value).toBe('points');
            const receiver = Object.values(sprite2.blocks._blocks)
                .find(each => each.opcode === 'event_whenbroadcastreceived');
            expect(receiver.fields.BROADCAST_OPTION.value).toBe('start');
            expect(controller.isStale(sprite.id)).toBe(true);
            expect(controller.isStale(sprite2.id)).toBe(true);
            await controller.regenerate(sprite.id);
            await controller.regenerate(sprite2.id);
            expect(getText(sprite.id).doc).toContain('points');
            expect(getText(sprite.id).doc).not.toMatch(/\bscore\b/);
            expect(getText(sprite2.id).doc).toContain('start');
        } finally {
            controller.dispose();
            client.dispose();
        }
    });
});

describe('rename and references in the workbench', () => {
    beforeEach(() => clearTexts());

    test('F2 on a variable renames it through the VM and Shift+F12 lists its uses', async () => {
        const {vm, sprite} = await setup();
        const dispatch = jest.fn(action => {
            if (action.dialogConfig && action.dialogConfig.type === 'prompt') action.dialogConfig.onOk('points');
        });
        const wrapper = mountWithIntl(
            <CodeWorkbench
                devState={extensionDevInitialState}
                dispatch={dispatch}
                editingTarget={sprite.id}
                sprites={{[sprite.id]: {order: 0}}}
                vm={vm}
            />,
            {attachTo: document.body.appendChild(document.createElement('div'))}
        );
        await flush();
        wrapper.update();
        const instance = wrapper.find(CodeWorkbench).instance();
        const host = wrapper.getDOMNode().querySelector('[data-mw-text-tab="true"] .cm-editor');
        const view = EditorView.findFromDOM(host);
        const at = view.state.doc.toString().indexOf('score') + 1;
        expect(at).toBeGreaterThan(0);
        view.dispatch({selection: {anchor: at}});
        expect(instance.handleFindReferences()).toBe(true);
        expect(instance.state.menu.items).toHaveLength(2);
        await instance.handleRenameSymbol();
        await flush();
        expect(sprite.blocks.getBlock('set').fields.VARIABLE.value).toBe('points');
        expect(view.state.doc.toString()).toContain('points');
        expect(view.state.doc.toString()).not.toMatch(/\bscore\b/);
        wrapper.unmount();
        vm.quit();
    });
});
