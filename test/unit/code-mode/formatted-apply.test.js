import {ChangeSet} from '@codemirror/state';
import {block, loadVm, spriteBlocks} from '../../helpers/code-mode-fixture.js';
import {createFractchClient} from '../../../src/lib/code-mode/fractch-client.js';
import {createTextController} from '../../../src/lib/code-mode/text-controller.js';
import {redoCodeApply, undoCodeApply} from '../../../src/lib/code-mode/apply-pipeline.js';
import {clearCodeHistory, latestUndo} from '../../../src/lib/code-mode/code-history.js';
import {clearTexts, getText, isDirty} from '../../../src/lib/code-mode/text-store.js';
import {flushDraftWrites, resetDraftStore} from '../../../src/lib/code-mode/code-drafts.js';

jest.mock('../../../src/lib/tw-lazy-scratch-blocks.js', () => ({
    isLoaded: () => false,
    get: () => null
}));

jest.mock('../../../src/lib/project-replacement.js', () => ({
    prepareProjectReplacement: jest.fn(() => Promise.resolve(() => Promise.resolve()))
}));

const type = (controller, targetId, edit) => {
    const state = getText(targetId);
    const next = typeof edit === 'string' ? edit : edit(state.doc);
    let start = 0;
    while (start < state.doc.length && state.doc[start] === next[start]) start++;
    let end = 0;
    while (end < state.doc.length - start && end < next.length - start &&
        state.doc[state.doc.length - 1 - end] === next[next.length - 1 - end]) end++;
    const changes = ChangeSet.of([{from: start,
        to: state.doc.length - end,
        insert: next.slice(start, next.length - end)}], state.doc.length);
    controller.edit(targetId, next, changes);
};

const sliceOf = (text, range) => text.slice(range.from, range.to);

const HAT = 'when flag at 10,20 {\n\n      say   "hello"  ;   // greet\n}';
const KEY = 'when key space at 300,40 {\n    move 10;\n}';

const FORMATTED = [
    '// Sprite1 setup\n',
    'var lives   = 5 ;\n',
    '\n\n',
    HAT,
    '\n\n\n\n',
    KEY,
    '\n\n'
].join('');

const CANONICAL_KEY_A = 'when key a at 300,40 {\n  move 10;\n}';

const stepsOf = (target, blockId) => {
    const shadow = target.blocks.getBlock(target.blocks.getBlock(blockId).inputs.STEPS.block);
    return String(shadow.fields.NUM.value);
};

const sayBlock = target => Object.values(target.blocks._blocks).find(item => item.opcode === 'looks_say');

const messageOf = target => {
    const shadow = target.blocks.getBlock(sayBlock(target).inputs.MESSAGE.block);
    return String(shadow.fields.TEXT.value);
};

describe('formatted applies', () => {
    let vm;
    let sprite;
    let stage;
    let client;
    let controller;
    let identity;

    const setUp = async overrides => {
        ({vm, sprite, stage} = await loadVm(overrides));
        client = createFractchClient();
        controller = createTextController({vm, client});
        controller.configure({
            getIdentity: () => identity,
            confirmImpact: () => Promise.resolve(true)
        });
    };

    const applyFormatted = async (text = FORMATTED) => {
        await controller.regenerate(sprite.id);
        type(controller, sprite.id, text);
        const outcome = await controller.apply(sprite.id);
        expect(outcome.status).toBe('committed');
        return outcome;
    };

    const expectUnitsLineUp = state => {
        for (const key of Object.keys(state.units)) {
            const [kind, ...rest] = key.split(':');
            const id = rest.join(':');
            const field = {script: 'scripts', decl: 'declarations', comment: 'comments'}[kind];
            const range = state.baseline.sourceMap[field][id];
            expect(sliceOf(state.doc, state.units[key])).toBe(sliceOf(state.baseline.text, range));
        }
    };

    beforeEach(() => {
        clearTexts();
        clearCodeHistory();
        resetDraftStore();
        identity = null;
    });

    afterEach(() => {
        controller.dispose();
        client.dispose();
        vm.quit();
    });

    test('a formatted apply keeps blank lines, indentation, comments and spacing exactly', async () => {
        await setUp();
        const outcome = await applyFormatted();
        expect(outcome.kept).toBe(true);
        const state = getText(sprite.id);
        expect(state.doc).toBe(FORMATTED);
        expect(state.baseline.text).toBe(FORMATTED);
        expect(isDirty(state)).toBe(false);
        expect(state.canonicalBaseline.text).toContain('say "hello";');
        expect(messageOf(sprite)).toBe('hello');
        expect(sliceOf(state.doc, state.units['script:hat'])).toBe(HAT);
        expect(sliceOf(state.doc, state.units['script:key'])).toBe(KEY);
        expect(sliceOf(state.doc, state.units['decl:var:lives'])).toBe('var lives   = 5 ;');
        const note = Object.keys(state.units).find(key => key.startsWith('comment:'));
        expect(sliceOf(state.doc, state.units[note])).toBe('// Sprite1 setup');
        expect(sliceOf(state.doc, state.baseline.sourceMap.blocks[sayBlock(sprite).id])).toMatch(/^say {3}"hello"/);
        expect(sliceOf(state.doc, state.baseline.sourceMap.blocks.move)).toBe('move 10;');
        expect(latestUndo(sprite.id).afterText).toBe(FORMATTED);
        expect((await controller.apply(sprite.id)).status).toBe('clean');
        expect(getText(sprite.id).doc).toBe(FORMATTED);
    });

    test('apply all keeps the formatting of every file', async () => {
        await setUp();
        await controller.regenerate(sprite.id);
        await controller.regenerate(stage.id);
        const stageText = '// globals\nvar score = 3 ;\n\n\nwhen flag at 0,0 {\n      hide ;\n}\n';
        type(controller, sprite.id, FORMATTED);
        type(controller, stage.id, stageText);
        const outcome = await controller.applyAll();
        expect(outcome.status).toBe('committed');
        expect(getText(sprite.id).doc).toBe(FORMATTED);
        expect(getText(stage.id).doc).toBe(stageText);
        expect(isDirty(getText(sprite.id))).toBe(false);
        expect(isDirty(getText(stage.id))).toBe(false);
        expect(outcome.entry.afterTexts[sprite.id]).toBe(FORMATTED);
        expect(outcome.entry.afterTexts[stage.id]).toBe(stageText);
        expectUnitsLineUp(getText(stage.id));
    });

    test('a Blocks mode change to one script rewrites only that script', async () => {
        await setUp();
        await applyFormatted();
        sprite.blocks.changeBlock({element: 'field', id: 'key', name: 'KEY_OPTION', value: 'a'});
        expect(controller.isStale(sprite.id)).toBe(true);
        await controller.refresh(sprite.id);
        const state = getText(sprite.id);
        expect(state.doc).toBe(FORMATTED.replace(KEY, CANONICAL_KEY_A));
        expect(isDirty(state)).toBe(false);
        expect(state.baseline.text).toBe(state.doc);
        expect(sliceOf(state.doc, state.units['script:key'])).toBe(CANONICAL_KEY_A);
        expect(sliceOf(state.doc, state.units['script:hat'])).toBe(HAT);
        expect(sliceOf(state.doc, state.baseline.sourceMap.blocks[sayBlock(sprite).id])).toMatch(/^say {3}"hello"/);
        expect(sliceOf(state.doc, state.baseline.sourceMap.blocks.move)).toBe('move 10;');
        expect(state.canonicalBaseline.text).toContain('when key a at 300,40');
        const line = state.doc.slice(0, state.baseline.sourceMap.blocks.move.from).split('\n').length;
        expect(state.baseline.sourceMap.blocks.move.line).toBe(line);
    });

    test('a Blocks mode change keeps unapplied edits and formatting in the other scripts', async () => {
        await setUp();
        await applyFormatted();
        type(controller, sprite.id, text => text.replace('"hello"', '"hey"'));
        sprite.blocks.changeBlock({element: 'field', id: 'key', name: 'KEY_OPTION', value: 'a'});
        await controller.refresh(sprite.id);
        const state = getText(sprite.id);
        expect(state.conflicts).toEqual([]);
        expect(state.doc).toBe(FORMATTED.replace('"hello"', '"hey"').replace(KEY, CANONICAL_KEY_A));
        expect(isDirty(state)).toBe(true);
        const outcome = await controller.apply(sprite.id);
        expect(outcome.status).toBe('committed');
        expect(getText(sprite.id).doc).toBe(FORMATTED.replace('"hello"', '"hey"').replace(KEY, CANONICAL_KEY_A));
        expect(messageOf(sprite)).toBe('hey');
    });

    test('locked scripts line up with the formatted text after an apply and a Blocks mode change', async () => {
        await setUp({spriteBlocks: {
            ...spriteBlocks(),
            hat2: block('event_whenflagclicked', {next: 'say', topLevel: true, x: 500, y: 20})
        }});
        await controller.regenerate(sprite.id);
        const before = getText(sprite.id);
        expect(before.lockedScripts.map(item => item.topId).sort()).toEqual(['hat', 'hat2']);
        const lockedText = id => sliceOf(before.doc, before.units[`script:${id}`]);
        const formatted = before.doc
            .replace('\n\nwhen key space', '\n\n\n\n\nwhen key space')
            .replace('  move 10;', '        move   20 ;');
        type(controller, sprite.id, formatted);
        expect((await controller.apply(sprite.id)).status).toBe('committed');
        const check = () => {
            const state = getText(sprite.id);
            expect(state.lockedScripts.map(item => item.topId).sort()).toEqual(['hat', 'hat2']);
            for (const item of state.lockedScripts) {
                expect(sliceOf(state.doc, item)).toBe(lockedText(item.topId));
                expect(sliceOf(state.doc, state.units[`script:${item.topId}`])).toBe(lockedText(item.topId));
            }
            return state;
        };
        expect(check().doc).toBe(formatted);
        expect(stepsOf(sprite, 'move')).toBe('20');
        sprite.blocks.changeBlock({element: 'field', id: 'key', name: 'KEY_OPTION', value: 'a'});
        await controller.refresh(sprite.id);
        const state = check();
        expect(state.doc).toContain('\n\n\n\n\nwhen key a at 300,40 {\n  move 20;\n}');
    });

    test('diagnostics from an apply line up with the formatted text', async () => {
        await setUp();
        await applyFormatted();
        const broken = FORMATTED.replace('    move 10;', '    move (10;');
        type(controller, sprite.id, broken);
        const outcome = await controller.apply(sprite.id);
        expect(outcome.status).toBe('invalid');
        const error = outcome.diagnostics.find(item => item.severity === 'error');
        expect(error.line).toBe(broken.slice(0, broken.indexOf('move (10;')).split('\n').length);
        expect(getText(sprite.id).doc).toBe(broken);
    });

    test('typing during a formatted apply keeps the typed text and maps notes onto it', async () => {
        await setUp();
        await controller.regenerate(sprite.id);
        const text = FORMATTED.replace('var lives   = 5 ;\n', 'var lives   = 5 ;\nvar  fresh = 1;\n');
        type(controller, sprite.id, text);
        const pending = controller.apply(sprite.id);
        type(controller, sprite.id, current => `// typed while applying\n${current}`);
        const outcome = await pending;
        expect(outcome.status).toBe('committed');
        expect(outcome.kept).toBe(false);
        const state = getText(sprite.id);
        expect(state.doc).toBe(`// typed while applying\n${text}`);
        expect(state.baseline.text).toBe(text);
        expect(isDirty(state)).toBe(true);
        const note = state.diagnostics.find(item => item.code === 'FR222');
        expect(sliceOf(state.doc, note)).toBe('var  fresh = 1;');
        expect(sliceOf(state.doc, state.units['script:hat'])).toBe(HAT);
    });

    test('undo and redo of a formatted apply keep the formatting of untouched scripts', async () => {
        await setUp();
        await applyFormatted();
        const undone = await undoCodeApply({vm});
        expect(undone.status).toBe('committed');
        expect(messageOf(sprite)).toBe('hi');
        await controller.refresh(sprite.id);
        let state = getText(sprite.id);
        expect(isDirty(state)).toBe(false);
        expect(sliceOf(state.doc, state.units['script:key'])).toBe(KEY);
        expect(state.doc).toBe(`var lives   = 5 ;\n\n\nwhen flag at 10,20 {\n  say "hi";\n}\n\n\n\n${KEY}\n\n`);
        const redone = await redoCodeApply({vm});
        expect(redone.status).toBe('committed');
        expect(messageOf(sprite)).toBe('hello');
        await controller.refresh(sprite.id);
        state = getText(sprite.id);
        expect(isDirty(state)).toBe(false);
        expect(sliceOf(state.doc, state.units['script:key'])).toBe(KEY);
        expect(sliceOf(state.doc, state.units['script:hat'])).toBe('when flag at 10,20 {\n  // greet\n  say "hello";\n}');
        expect(state.doc.indexOf('var lives   = 5 ;')).toBeLessThan(state.doc.indexOf('// Sprite1 setup'));
        expect(state.doc.indexOf('when flag')).toBeLessThan(state.doc.indexOf('when key space'));
        expectUnitsLineUp(state);
    });

    test('a script typed without a position keeps its place when it is edited again', async () => {
        await setUp();
        const text = `${FORMATTED}when clicked {\n   turn 15 ;\n}\n`;
        await applyFormatted(text);
        const top = sprite.blocks.getScripts().find(id => sprite.blocks.getBlock(id).opcode === 'event_whenthisspriteclicked');
        const {x, y} = sprite.blocks.getBlock(top);
        expect(getText(sprite.id).doc).toBe(text);
        type(controller, sprite.id, current => current.replace('turn 15 ;', 'turn 30 ;'));
        expect((await controller.apply(sprite.id)).status).toBe('committed');
        const moved = sprite.blocks.getBlock(top);
        expect([moved.x, moved.y]).toEqual([x, y]);
        expect(getText(sprite.id).doc).toBe(text.replace('turn 15 ;', 'turn 30 ;'));
    });

    test('a script typed without a position keeps its place when its hat changes', async () => {
        await setUp();
        const text = `${FORMATTED}when clicked {\n   turn 15 ;\n}\n`;
        await applyFormatted(text);
        const top = sprite.blocks.getScripts().find(id => sprite.blocks.getBlock(id).opcode === 'event_whenthisspriteclicked');
        const {x, y} = sprite.blocks.getBlock(top);
        type(controller, sprite.id, current => current.replace('when clicked {', 'when key a {'));
        expect((await controller.apply(sprite.id)).status).toBe('committed');
        const keyA = sprite.blocks.getScripts().find(id => {
            const hat = sprite.blocks.getBlock(id);
            return hat.opcode === 'event_whenkeypressed' && hat.fields.KEY_OPTION.value === 'a';
        });
        const moved = sprite.blocks.getBlock(keyA);
        expect([moved.x, moved.y]).toEqual([x, y]);
    });

    test('a draft written after a formatted apply restores with its units', async () => {
        identity = 'project:7';
        await setUp();
        await applyFormatted();
        type(controller, sprite.id, text => text.replace('    move 10;', '    move 11;'));
        await flushDraftWrites();
        clearTexts();
        await controller.regenerate(sprite.id);
        const state = getText(sprite.id);
        expect(state.message.kind).toBe('restored');
        expect(state.doc).toBe(FORMATTED.replace('    move 10;', '    move 11;'));
        expect(sliceOf(state.doc, state.units['script:hat'])).toBe(HAT);
        expect(isDirty(state)).toBe(true);
    });

    test('reverting after a formatted apply returns to the applied text', async () => {
        await setUp();
        await applyFormatted();
        type(controller, sprite.id, text => text.replace('"hello"', '"bye"'));
        controller.revert(sprite.id);
        expect(getText(sprite.id).doc).toBe(FORMATTED);
        expect(isDirty(getText(sprite.id))).toBe(false);
    });
});
