import {ChangeSet} from '@codemirror/state';
import {loadVm} from '../../helpers/code-mode-fixture.js';
import {createFractchClient} from '../../../src/lib/code-mode/fractch-client.js';
import {createTextController} from '../../../src/lib/code-mode/text-controller.js';
import {
    otherTextReferences,
    prepareApply,
    redoCodeApply,
    undoCodeApply
} from '../../../src/lib/code-mode/apply-pipeline.js';
import {clearCodeHistory, latestRedo, latestUndo} from '../../../src/lib/code-mode/code-history.js';
import {clearTexts, getText, isDirty} from '../../../src/lib/code-mode/text-store.js';
import {textFacts} from '../../../src/lib/code-mode/text-facts.js';
import {refusalText} from '../../../src/lib/code-mode/code-dialogs.js';
import MonitorRecord from 'scratch-vm/src/engine/monitor-record';

jest.mock('../../../src/lib/tw-lazy-scratch-blocks.js', () => ({
    isLoaded: () => false,
    get: () => null
}));

jest.mock('../../../src/lib/project-replacement.js', () => ({
    prepareProjectReplacement: jest.fn(() => Promise.resolve(() => Promise.resolve()))
}));

const type = (controller, targetId, edit) => {
    const state = getText(targetId);
    const next = edit(state.doc);
    const changes = ChangeSet.of([{from: 0, to: state.doc.length, insert: next}], state.doc.length);
    controller.edit(targetId, next, changes);
};

const variableNamed = (target, name) => Object.values(target.variables).find(variable => variable.name === name);

const fieldIds = target => Object.values(target.blocks._blocks)
    .filter(block => block.fields && block.fields.VARIABLE)
    .map(block => block.fields.VARIABLE.id);

describe('apply all', () => {
    let vm;
    let sprite;
    let sprite2;
    let stage;
    let client;
    let controller;

    const hashes = () => [stage, sprite, sprite2].map(target => vm.getCodeStateHash(target.id));

    const useScore = async () => {
        for (const target of [sprite, sprite2]) {
            await controller.regenerate(target.id);
            type(controller, target.id, text => `${text}\nwhen key a at 0,300 {\n  score = score + 1;\n  say score;\n}\n`);
            const result = await controller.apply(target.id);
            expect(result.status).toBe('committed');
        }
        clearCodeHistory();
    };

    const renameScore = async () => {
        for (const target of [stage, sprite, sprite2]) await controller.regenerate(target.id);
        type(controller, stage.id, text => text.replace('var score = 3;', 'var total = 3;'));
        type(controller, sprite.id, text => text.replace(/score/g, 'total'));
        type(controller, sprite2.id, text => text.replace(/score/g, 'total'));
    };

    beforeEach(async () => {
        clearTexts();
        clearCodeHistory();
        ({vm, sprite, stage} = await loadVm());
        sprite2 = vm.runtime.targets.find(target => target.getName && target.getName() === 'Sprite2');
        client = createFractchClient();
        controller = createTextController({vm, client});
        controller.configure({
            getIdentity: () => null,
            confirmImpact: () => Promise.resolve(true)
        });
    });

    afterEach(() => {
        controller.dispose();
        client.dispose();
        vm.quit();
    });

    test('renaming a global has no working order for single applies', async () => {
        await useScore();
        await renameScore();
        const spriteFirst = await controller.apply(sprite.id);
        expect(spriteFirst.status).toBe('invalid');
        const refusal = spriteFirst.diagnostics.find(item => item.code === 'FR228');
        expect(refusal.message).toContain('sprite-only variable');
        expect(refusal.hint).toContain('Apply all');
        const stageFirst = await controller.apply(stage.id);
        expect(stageFirst.status).toBe('invalid');
        const used = stageFirst.diagnostics.find(item => item.code === 'FR220');
        expect(used.message).toBe('score is used by Sprite1, Sprite2');
        expect(used.hint).toContain('Apply all');
        expect(variableNamed(stage, 'total')).toBeFalsy();
        expect(variableNamed(sprite, 'total')).toBeFalsy();
    });

    test('one apply all renames a Stage variable across the Stage and two sprites', async () => {
        await useScore();
        const score = variableNamed(stage, 'score');
        await renameScore();
        const confirmImpactAll = jest.fn(() => Promise.resolve(true));
        controller.configure({confirmImpactAll});
        const result = await controller.applyAll();
        expect(result.status).toBe('committed');
        expect(confirmImpactAll).toHaveBeenCalledTimes(1);
        const impact = confirmImpactAll.mock.calls[0][0];
        expect(impact.files.map(file => file.name)).toEqual(['Stage']);
        expect(variableNamed(stage, 'score')).toBeFalsy();
        const total = variableNamed(stage, 'total');
        expect(total).toBeTruthy();
        expect(total.value).toBe(3);
        expect(total.id).not.toBe(score.id);
        expect(variableNamed(sprite, 'total')).toBeFalsy();
        expect(variableNamed(sprite2, 'total')).toBeFalsy();
        expect(fieldIds(sprite)).toEqual(expect.arrayContaining([total.id]));
        expect(fieldIds(sprite).every(id => id === total.id)).toBe(true);
        expect(fieldIds(sprite2).every(id => id === total.id)).toBe(true);
        for (const target of [stage, sprite, sprite2]) {
            const state = getText(target.id);
            expect(isDirty(state)).toBe(false);
            expect(state.message).toEqual({kind: 'applied'});
            expect(state.doc).not.toContain('score');
        }
        expect(getText(sprite.id).doc).toContain('total = total + 1;');
    });

    test('commits the Stage first, then sprites in pane order, then the Stage deletions', async () => {
        await useScore();
        await renameScore();
        vm.runtime.setExecutablePosition(sprite2, 1);
        const calls = [];
        const replace = vm.replaceTargetScripts.bind(vm);
        vm.replaceTargetScripts = (targetId, change) => {
            const variables = change && change.variables;
            calls.push({
                target: vm.runtime.getTargetById(targetId).getName(),
                creates: variables ? (variables.create || []).map(entry => entry.name) : [],
                deletes: variables ? (variables.delete || []).length : 0,
                scripts: Object.keys((change && change.blocks) || {}).length > 0
            });
            return replace(targetId, change);
        };
        const order = vm.runtime.targets.filter(target => !target.isStage).map(target => target.getName());
        const result = await controller.applyAll();
        expect(result.status).toBe('committed');
        expect(calls.map(call => call.target)).toEqual(['Stage', ...order, 'Stage']);
        expect(calls[0]).toMatchObject({creates: ['total'], deletes: 0});
        expect(calls[1].creates).toEqual([]);
        expect(calls[2].creates).toEqual([]);
        expect(calls[3]).toMatchObject({creates: [], deletes: 1, scripts: false});
    });

    test('a later file failing rolls back every file applied before it', async () => {
        await useScore();
        const before = hashes();
        await renameScore();
        const replace = vm.replaceTargetScripts.bind(vm);
        vm.replaceTargetScripts = (targetId, change) => {
            if (targetId === sprite2.id && !change.restore) {
                const error = new Error('Sprite2 refused this change');
                error.name = 'CodeApplyError';
                throw error;
            }
            return replace(targetId, change);
        };
        const result = await controller.applyAll();
        expect(result.status).toBe('failed');
        expect(result.fileName).toBe('Sprite2');
        expect(result.message).toBe('Sprite2 refused this change');
        expect(hashes()).toEqual(before);
        expect(variableNamed(stage, 'total')).toBeFalsy();
        expect(variableNamed(stage, 'score')).toBeTruthy();
        expect(latestUndo()).toBeNull();
        expect(getText(sprite2.id).message).toMatchObject({
            reason: 'applyAllFailedHere',
            values: {reason: 'Sprite2 refused this change'}
        });
        expect(getText(stage.id).message).toMatchObject({reason: 'applyAllFailed', values: {file: 'Sprite2'}});
        for (const target of [stage, sprite, sprite2]) expect(isDirty(getText(target.id))).toBe(true);
    });

    test('a file with errors stops apply all before anything changes', async () => {
        const before = hashes();
        for (const target of [stage, sprite]) await controller.regenerate(target.id);
        type(controller, stage.id, text => `${text}var bonus = 1;\n`);
        type(controller, sprite.id, text => `${text}\nwhen flag {\n  say "oops";\n`);
        const result = await controller.applyAll();
        expect(result.status).toBe('invalid');
        expect(hashes()).toEqual(before);
        expect(getText(sprite.id).diagnostics.some(item => item.severity === 'error')).toBe(true);
        expect(getText(stage.id).message).toMatchObject({reason: 'applyAllBlocked', values: {files: ['Sprite1']}});
        expect(getText(stage.id).applying).toBe(false);
    });

    test('a sprite without unapplied text that uses the old name stops the rename up front', async () => {
        await useScore();
        const before = hashes();
        await renameScore();
        type(controller, sprite2.id, text => text.replace(/total/g, 'score'));
        const result = await controller.applyAll();
        expect(result.status).toBe('invalid');
        expect(hashes()).toEqual(before);
        const stageProblem = getText(stage.id).diagnostics.find(item => item.code === 'FR220');
        expect(stageProblem.message).toBe('score is used by Sprite2');
    });

    test('unapplied sprite text that still reads the old name stops the rename up front', async () => {
        await useScore();
        const before = hashes();
        await renameScore();
        type(controller, sprite2.id, text => text.replace('say total;', 'say score;'));
        const result = await controller.applyAll();
        expect(result.status).toBe('invalid');
        expect(hashes()).toEqual(before);
        const stageProblem = getText(stage.id).diagnostics.find(item => item.code === 'FR220');
        expect(stageProblem.message).toBe('score is used by Sprite2');
        expect(stageProblem.hint).toContain('Apply all');
        expect(getText(sprite.id).message).toMatchObject({reason: 'applyAllBlocked'});
    });

    test('one undo reverts the whole apply all and redo applies it again', async () => {
        await useScore();
        const before = hashes();
        await renameScore();
        await controller.applyAll();
        const after = hashes();
        const entry = latestUndo();
        expect(entry.kind).toBe('group');
        expect(entry.targetIds.slice().sort()).toEqual([stage.id, sprite.id, sprite2.id].sort());
        expect(latestUndo(sprite2.id)).toBe(entry);
        const undone = await undoCodeApply({vm});
        expect(undone.status).toBe('committed');
        expect(hashes()).toEqual(before);
        expect(variableNamed(stage, 'total')).toBeFalsy();
        expect(variableNamed(stage, 'score').value).toBe(3);
        expect(latestUndo()).toBeNull();
        expect(latestRedo(sprite.id)).toBe(entry);
        for (const target of [stage, sprite, sprite2]) expect(getText(target.id).message).toEqual({kind: 'undid'});
        const redone = await redoCodeApply({vm});
        expect(redone.status).toBe('committed');
        expect(hashes()).toEqual(after);
        const again = await undoCodeApply({vm});
        expect(again.status).toBe('committed');
        expect(hashes()).toEqual(before);
    });

    test('undo is refused and names the sprite whose blocks changed since the apply all', async () => {
        await useScore();
        await renameScore();
        await controller.applyAll();
        sprite2.blocks.createBlock({
            id: 'extra',
            opcode: 'motion_turnright',
            inputs: {},
            fields: {},
            next: null,
            parent: null,
            shadow: false,
            topLevel: true,
            x: 0,
            y: 600
        });
        const changed = hashes();
        const result = await undoCodeApply({vm});
        expect(result.status).toBe('refused');
        expect(result.reason).toBe('blocksChanged');
        expect(result.targetId).toBe(sprite2.id);
        expect(hashes()).toEqual(changed);
        expect(latestUndo()).toBeTruthy();
    });

    test('a rebuild that fails partway rolls back and leaves no file stuck applying', async () => {
        await useScore();
        const before = hashes();
        await renameScore();
        client.build = () => Promise.reject(new Error('The code worker stopped. Try again.'));
        const result = await controller.applyAll();
        expect(result.status).toBe('refused');
        expect(result.message).toBe('The code worker stopped. Try again.');
        expect(hashes()).toEqual(before);
        expect(variableNamed(stage, 'total')).toBeFalsy();
        for (const target of [stage, sprite, sprite2]) {
            const state = getText(target.id);
            expect(state.applying).toBe(false);
            expect(isDirty(state)).toBe(true);
            expect(state.message).toMatchObject({kind: 'refused', text: 'The code worker stopped. Try again.'});
        }
    });

    test('turning a used Stage variable into a list of the same name applies in one apply all', async () => {
        await useScore();
        for (const target of [stage, sprite, sprite2]) await controller.regenerate(target.id);
        type(controller, stage.id, text => text.replace('var score = 3;', 'var score = [];'));
        for (const target of [sprite, sprite2]) {
            type(controller, target.id, text => text.replace('score = score + 1;\n  say score;',
                'score.add(1);\n  say score.length;'));
        }
        const result = await controller.applyAll();
        expect(result.status).toBe('committed');
        const list = Object.values(stage.variables).find(variable => variable.name === 'score');
        expect(list.type).toBe('list');
        expect(Object.values(stage.variables).filter(variable => variable.name === 'score')).toHaveLength(1);
        const listIds = target => Object.values(target.blocks._blocks)
            .filter(block => block.fields && block.fields.LIST)
            .map(block => block.fields.LIST.id);
        expect(listIds(sprite)).toEqual(expect.arrayContaining([list.id]));
        expect(fieldIds(sprite)).toEqual([]);
    });

    test('moving a Stage variable into a sprite is refused up front with the steps to do it', async () => {
        await controller.regenerate(sprite.id);
        type(controller, sprite.id, text => `${text}\nwhen key a at 0,300 {\n  say score;\n}\n`);
        await controller.apply(sprite.id);
        clearCodeHistory();
        const before = hashes();
        for (const target of [stage, sprite]) await controller.regenerate(target.id);
        type(controller, stage.id, text => text.replace('var score = 3;\n', ''));
        type(controller, sprite.id, text => `var score = 0;\n${text}`);
        const result = await controller.applyAll();
        expect(result.status).toBe('invalid');
        expect(hashes()).toEqual(before);
        const item = getText(sprite.id).diagnostics.find(entry => entry.code === 'FR229');
        expect(item.message).toBe('Apply all can\'t move score from the Stage to this sprite in one step.');
        expect(item.hint).toContain('different name');
        expect(item.line).toBe(1);
    });

    test('making a used Stage variable a cloud variable is refused with the steps to do it', async () => {
        await useScore();
        const before = hashes();
        for (const target of [stage, sprite]) await controller.regenerate(target.id);
        type(controller, stage.id, text => text.replace('var score = 3;', 'cloud score = 3;'));
        type(controller, sprite.id, text => text.replace('"hi"', '"hello"'));
        const result = await controller.applyAll();
        expect(result.status).toBe('invalid');
        expect(hashes()).toEqual(before);
        const item = getText(stage.id).diagnostics.find(entry => entry.code === 'FR220');
        expect(item.message).toMatch(/^score is used by (Sprite1, Sprite2|Sprite2, Sprite1), /);
        expect(item.message).toMatch(/, so it can't become a cloud variable in the same apply\.$/);
        expect(item.hint).toBe('Remove the uses of score and apply without it first. ' +
            'Then add cloud score and the uses back, and apply again.');
        const single = await controller.apply(stage.id);
        expect(single.status).toBe('invalid');
        expect(single.diagnostics.find(entry => entry.code === 'FR220').message).toContain('cloud variable');
    });

    test('undoing an apply all keeps created cloud variables and variables with a visible monitor', async () => {
        for (const target of [stage, sprite]) await controller.regenerate(target.id);
        type(controller, stage.id, text => `${text}cloud hiscore = 0;\nvar shown = 0;\nvar plain = 0;\n`);
        type(controller, sprite.id, text => text.replace('"hi"', '"hello"'));
        const result = await controller.applyAll();
        expect(result.status).toBe('committed');
        const hiscore = Object.values(stage.variables).find(variable => variable.name === '☁ hiscore');
        expect(hiscore.isCloud).toBe(true);
        const shown = variableNamed(stage, 'shown');
        vm.runtime.requestAddMonitor(new MonitorRecord({id: shown.id, opcode: 'data_variable', visible: true}));
        const undone = await undoCodeApply({vm});
        expect(undone.status).toBe('committed');
        expect(stage.variables[hiscore.id]).toBeTruthy();
        expect(stage.variables[shown.id]).toBeTruthy();
        expect(variableNamed(stage, 'plain')).toBeFalsy();
    });

    test('the list of files that need fixing uses the locale list format', () => {
        const intl = {locale: 'en', formatMessage: (descriptor, values) => values.files};
        expect(refusalText(intl, {reason: 'applyAllBlocked', values: {files: ['Sprite1', 'Sprite2', 'Stage']}}))
            .toBe('Sprite1, Sprite2, and Stage');
    });

    test('with one dirty file apply all is a normal apply', async () => {
        await controller.regenerate(sprite.id);
        type(controller, sprite.id, text => text.replace('"hi"', '"hello"'));
        const result = await controller.applyAll();
        expect(result.status).toBe('committed');
        expect(latestUndo().kind).toBeUndefined();
    });
});

describe('cross-file checks for a single apply', () => {
    let vm;
    let sprite;
    let stage;
    let client;

    beforeEach(async () => {
        clearCodeHistory();
        ({vm, sprite, stage} = await loadVm());
        client = createFractchClient();
    });

    afterEach(() => {
        client.dispose();
        vm.quit();
    });

    const removeScoreWith = async (replacement, otherTexts) => {
        const emitted = await client.emit(vm, stage.id);
        return prepareApply({
            vm,
            client,
            targetId: stage.id,
            text: emitted.text.replace(/^var score.*\n/m, replacement ? `${replacement}\n` : ''),
            previous: emitted,
            lockedScripts: emitted.lockedScripts,
            otherTexts
        });
    };

    const removeScore = async otherTexts => {
        const emitted = await client.emit(vm, stage.id);
        return prepareApply({
            vm,
            client,
            targetId: stage.id,
            text: emitted.text.replace(/^var score.*\n/m, ''),
            previous: emitted,
            lockedScripts: emitted.lockedScripts,
            otherTexts
        });
    };

    test.each([
        ['a string', 'when flag {\n  say "score";\n}\n'],
        ['a comment', 'when flag {\n  // score goes up here\n  say "hi";\n}\n'],
        ['a local', 'when flag {\n  local score = 1;\n  say score;\n}\n'],
        ['the file declaring its own variable', 'var score = 0;\n\nwhen flag {\n  say score;\n}\n'],
        ['sprite variable access', 'when flag {\n  say sprites["Stage"].vars["score"];\n}\n'],
        ['a motion block', 'when flag {\n  setX 10;\n  say xPosition;\n}\n'],
        ['a list of the same name', 'var score = [];\n\nwhen flag {\n  score.add(1);\n}\n']
    ])('removing a Stage variable is not refused for %s', async (label, text) => {
        const result = await removeScore([{name: 'Sprite2', text}]);
        expect(result.status).toBe('ready');
        expect(result.diagnostics.some(item => item.code === 'FR220')).toBe(false);
    });

    test('removing a Stage variable another unapplied file reads is refused with an Apply all hint', async () => {
        const result = await removeScore([{name: 'Sprite2', text: 'when flag {\n  score = score + 1;\n}\n'}]);
        expect(result.status).toBe('invalid');
        const item = result.diagnostics.find(entry => entry.code === 'FR220');
        expect(item.message).toBe('score is used by Sprite2');
        expect(item.hint).toContain('Apply all');
    });

    test('text references come from the parsed file', () => {
        const facts = textFacts('var mine = 1;\nvar items = [];\n\nwhen flag {\n  local tmp = 2;\n  ' +
            'say tmp + score;\n  say "lives";\n  mine = 3;\n  for item in items {\n    say item;\n  }\n}\n');
        expect(facts.references).toEqual(expect.arrayContaining(['score']));
        expect(facts.references).not.toEqual(expect.arrayContaining(['tmp']));
        expect(facts.references).not.toEqual(expect.arrayContaining(['lives']));
        expect(facts.references).not.toEqual(expect.arrayContaining(['mine']));
        expect(facts.references).not.toEqual(expect.arrayContaining(['item']));
        expect(facts.declared.map(decl => decl.name)).toEqual(['mine', 'items']);
    });

    test('otherTextReferences only counts names a file really reads', () => {
        const built = {removed: {variables: [{id: 'v1', name: 'score'}], lists: []}};
        const diagnostics = otherTextReferences(built, [
            {name: 'A', text: 'when flag {\n  say "score";\n}\n'},
            {name: 'B', text: 'when flag {\n  say score;\n}\n'}
        ]);
        expect(diagnostics.map(item => item.message)).toEqual(['score is used by B']);
    });

    const assignTotal = async otherTexts => {
        const emitted = await client.emit(vm, sprite.id);
        return prepareApply({
            vm,
            client,
            targetId: sprite.id,
            text: `${emitted.text}\nwhen key a at 0,300 {\n  total = 1;\n}\n`,
            previous: emitted,
            lockedScripts: emitted.lockedScripts,
            otherTexts
        });
    };

    test('a sprite apply that would make a sprite-only copy of a pending Stage variable is refused', async () => {
        const result = await assignTotal([{name: 'Stage', isStage: true, text: 'var score = 3;\nvar total = 0;\n'}]);
        expect(result.status).toBe('invalid');
        const item = result.diagnostics.find(entry => entry.code === 'FR228');
        expect(item.message).toContain('total');
        expect(item.hint).toBe('apply the Stage first, or use Apply all to apply every file together');
        expect(item.line).toBeGreaterThan(1);
        expect(variableNamed(sprite, 'total')).toBeFalsy();
    });

    test('a cloud declaration in the pending Stage text counts too', async () => {
        const result = await assignTotal([{name: 'Stage', isStage: true, text: 'var score = 3;\ncloud total = 0;\n'}]);
        expect(result.status).toBe('invalid');
    });

    test('turning a Stage variable into a list is not refused for files that use it as a list', async () => {
        const result = await removeScoreWith('var score = [];', [
            {name: 'Sprite2', text: 'when flag {\n  score.add(1);\n  say score.length;\n  say score;\n}\n'}
        ]);
        expect(result.status).toBe('ready');
        expect(result.diagnostics.some(item => item.code === 'FR220')).toBe(false);
    });

    test('turning a Stage variable into a list is refused for files that still set it as a variable', async () => {
        const result = await removeScoreWith('var score = [];', [
            {name: 'Sprite2', text: 'when flag {\n  score = 1;\n}\n'}
        ]);
        expect(result.status).toBe('invalid');
        expect(result.diagnostics.find(item => item.code === 'FR220').message).toBe('score is used by Sprite2');
    });

    test('a sprite-only variable is still created when the Stage text does not declare it', async () => {
        const result = await assignTotal([
            {name: 'Stage', isStage: true, text: 'var score = 3;\nvar other = 0;\n'},
            {name: 'Sprite2', isStage: false, text: 'var total = 0;\n'}
        ]);
        expect(result.status).toBe('ready');
        expect(result.built.created.variables.map(entry => entry.name)).toEqual(['total']);
    });
});
