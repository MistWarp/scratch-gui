import {loadVm} from '../../helpers/code-mode-fixture.js';
import {createFractchClient} from '../../../src/lib/code-mode/fractch-client.js';
import {
    commitApply,
    computeImpact,
    prepareApply,
    redoCodeApply,
    undoCodeApply
} from '../../../src/lib/code-mode/apply-pipeline.js';
import {clearCodeHistory, latestUndo} from '../../../src/lib/code-mode/code-history.js';
import {beginProjectOperation} from '../../../src/lib/project-operation.js';
import {prepareProjectReplacement} from '../../../src/lib/project-replacement.js';

const mockCalls = [];
const mockWorkspace = {listeners_: []};

jest.mock('../../../src/lib/tw-lazy-scratch-blocks.js', () => ({
    isLoaded: () => true,
    get: () => ({
        getMainWorkspace: () => mockWorkspace,
        Events: {fireNow_: () => mockCalls.push('fireNow')}
    })
}));

jest.mock('../../../src/lib/project-replacement.js', () => ({
    prepareProjectReplacement: jest.fn(() => Promise.resolve(() => Promise.resolve()))
}));

const emitFor = async (client, vm, targetId) => client.emit(vm, targetId);

const plan = async (vm, client, targetId, edit, options = {}) => {
    const emitted = await emitFor(client, vm, targetId);
    const text = edit(emitted.text);
    return prepareApply({
        vm,
        client,
        targetId,
        text,
        previous: emitted,
        lockedScripts: emitted.lockedScripts,
        otherTexts: options.otherTexts || []
    });
};

describe('code apply pipeline', () => {
    let vm;
    let sprite;
    let client;

    beforeEach(async () => {
        mockCalls.length = 0;
        mockWorkspace.listeners_ = [];
        clearCodeHistory();
        ({vm, sprite} = await loadVm());
        client = createFractchClient();
    });

    afterEach(() => {
        client.dispose();
        vm.quit();
    });

    test('a parse error blocks apply and leaves the target untouched', async () => {
        const before = vm.getCodeStateHash(sprite.id);
        const result = await plan(vm, client, sprite.id, text => `${text}\nwhen flag {\n  say "oops";\n`);
        expect(result.status).toBe('invalid');
        expect(result.diagnostics.some(item => item.severity === 'error')).toBe(true);
        expect(vm.getCodeStateHash(sprite.id)).toBe(before);
    });

    test('collaboration refuses before anything is built', async () => {
        vm.editingCommands.handler = () => {};
        const result = await plan(vm, client, sprite.id, text => text.replace('"hi"', '"hey"'));
        expect(result.status).toBe('refused');
        expect(result.reason).toBe('collaboration');
        vm.editingCommands.handler = null;
    });

    test('deleting a declaration that another tab still names is refused', async () => {
        const stage = vm.runtime.getTargetForStage();
        const result = await plan(vm, client, stage.id, text => text.replace(/^var score.*\n/m, ''), {
            otherTexts: [{name: 'Sprite2', text: 'when flag {\n  say score;\n}\n'}]
        });
        expect(result.status).toBe('invalid');
        expect(result.diagnostics.some(item => item.message === 'score is used by Sprite2')).toBe(true);
    });

    test('removing a whole script needs confirmation and a cancelled modal changes nothing', async () => {
        const before = vm.getCodeStateHash(sprite.id);
        const result = await plan(vm, client, sprite.id, text => text.replace(/when key[\s\S]*?\n}\n/, ''));
        expect(result.status).toBe('ready');
        expect(result.impact.needsConfirm).toBe(true);
        expect(result.impact.reasons).toContain('scriptRemoved');
        expect(result.impact.counts.scripts).toBe(1);
        const confirmImpact = jest.fn(() => Promise.resolve(false));
        const outcome = await commitApply(result, {vm, confirmImpact});
        expect(confirmImpact).toHaveBeenCalled();
        expect(outcome.status).toBe('cancelled');
        expect(vm.getCodeStateHash(sprite.id)).toBe(before);
    });

    test('an edit to one script keeps every other block id', async () => {
        const result = await plan(vm, client, sprite.id, text => text.replace('"hi"', '"hello"'));
        expect(result.status).toBe('ready');
        expect(result.impact.needsConfirm).toBe(false);
        const outcome = await commitApply(result, {vm});
        expect(outcome.status).toBe('committed');
        expect(sprite.blocks.getBlock('key')).toBeTruthy();
        expect(sprite.blocks.getBlock('move')).toBeTruthy();
        expect(sprite.blocks.getBlock('hat')).toBeTruthy();
        expect(prepareProjectReplacement).toHaveBeenCalledTimes(1);
    });

    test('the final block runs flush, refusal checks, replace and the workspace update in order', async () => {
        mockWorkspace.listeners_ = [vm.blockListener];
        const replace = vm.replaceTargetScripts.bind(vm);
        vm.replaceTargetScripts = (...args) => {
            mockCalls.push('replace');
            return replace(...args);
        };
        vm.emitWorkspaceUpdate = () => mockCalls.push('workspaceUpdate');
        const result = await plan(vm, client, sprite.id, text => text.replace('"hi"', '"hello"'));
        const outcome = await commitApply(result, {vm});
        expect(outcome.status).toBe('committed');
        expect(mockCalls).toEqual(['fireNow', 'fireNow', 'replace', 'workspaceUpdate']);
    });

    test('a commit waiting behind another operation is refused when the project changes meanwhile', async () => {
        const result = await plan(vm, client, sprite.id, text => text.replace('"hi"', '"hello"'));
        const release = beginProjectOperation(vm);
        const pending = commitApply(result, {vm});
        sprite.blocks.createBlock({
            id: 'extra',
            opcode: 'motion_turnright',
            inputs: {},
            fields: {},
            next: null,
            parent: null,
            shadow: false,
            topLevel: true,
            x: 0,
            y: 400
        });
        vm.runtime.emitProjectChanged();
        release();
        const outcome = await pending;
        expect(outcome.status).toBe('refused');
        expect(outcome.reason).toBe('changed');
        expect(sprite.blocks.getBlock('say').inputs.MESSAGE).toBeTruthy();
    });

    test('collaboration starting during the wait refuses the commit', async () => {
        const result = await plan(vm, client, sprite.id, text => text.replace('"hi"', '"hello"'));
        const release = beginProjectOperation(vm);
        const pending = commitApply(result, {vm});
        vm.editingCommands.handler = () => {};
        release();
        const outcome = await pending;
        vm.editingCommands.handler = null;
        expect(outcome.reason).toBe('collaboration');
    });

    test('impact counts blocks removed from inside a changed script', async () => {
        const result = await plan(vm, client, sprite.id, text => text.replace(/\s*move 10;/, ''));
        const impact = computeImpact(vm, sprite.id, result.built, {previousText: '', text: ''});
        expect(impact.counts.blocks).toBe(1);
        expect(impact.counts.scripts).toBe(0);
    });
});

describe('code apply undo and redo', () => {
    let vm;
    let sprite;
    let client;

    beforeEach(async () => {
        clearCodeHistory();
        mockWorkspace.listeners_ = [];
        ({vm, sprite} = await loadVm());
        client = createFractchClient();
    });

    afterEach(() => {
        client.dispose();
        vm.quit();
    });

    const applyEdit = async edit => {
        const result = await plan(vm, client, sprite.id, edit);
        return commitApply(result, {vm, confirmImpact: () => Promise.resolve(true)});
    };

    test('undo restores the exact state and redo reapplies it', async () => {
        const before = vm.getCodeStateHash(sprite.id);
        await applyEdit(text => text.replace('"hi"', '"hello"'));
        const after = vm.getCodeStateHash(sprite.id);
        expect(after).not.toBe(before);
        const undone = await undoCodeApply({vm});
        expect(undone.status).toBe('committed');
        expect(vm.getCodeStateHash(sprite.id)).toBe(before);
        const redone = await redoCodeApply({vm});
        expect(redone.status).toBe('committed');
        expect(vm.getCodeStateHash(sprite.id)).toBe(after);
    });

    test('undo is refused when blocks changed after the apply', async () => {
        await applyEdit(text => text.replace('"hi"', '"hello"'));
        sprite.blocks.changeBlock({element: 'field', id: 'key', name: 'KEY_OPTION', value: 'a'});
        const hash = vm.getCodeStateHash(sprite.id);
        const result = await undoCodeApply({vm});
        expect(result.status).toBe('refused');
        expect(result.reason).toBe('blocksChanged');
        expect(vm.getCodeStateHash(sprite.id)).toBe(hash);
        expect(latestUndo()).toBeTruthy();
    });

    test('redo is refused when blocks changed after the undo', async () => {
        await applyEdit(text => text.replace('"hi"', '"hello"'));
        await undoCodeApply({vm});
        sprite.blocks.changeBlock({element: 'field', id: 'key', name: 'KEY_OPTION', value: 'a'});
        const result = await redoCodeApply({vm});
        expect(result.reason).toBe('redoChanged');
    });

    test('undo of a removed script brings back the same block ids', async () => {
        await applyEdit(text => text.replace(/when key[\s\S]*?\n}\n/, ''));
        expect(sprite.blocks.getBlock('key')).toBeFalsy();
        await undoCodeApply({vm});
        expect(sprite.blocks.getBlock('key').opcode).toBe('event_whenkeypressed');
        expect(sprite.blocks.getBlock('move').parent).toBe('key');
    });

    test('a deleted variable comes back with its value on undo', async () => {
        await applyEdit(text => text.replace(/^var lives.*\n/m, ''));
        expect(sprite.variables.v2).toBeFalsy();
        await undoCodeApply({vm});
        expect(sprite.variables.v2.value).toBe(5);
    });

    test('an undo waiting behind another operation is refused when a block moves during the wait', async () => {
        await applyEdit(text => text.replace('"hi"', '"hello"'));
        const release = beginProjectOperation(vm);
        const pending = undoCodeApply({vm});
        sprite.blocks.moveBlock({id: 'move', oldParent: 'key', newParent: 'say'});
        release();
        const result = await pending;
        expect(result.reason).toBe('blocksChanged');
        const ids = Object.keys(sprite.blocks._blocks);
        expect(new Set(ids).size).toBe(ids.length);
        expect(sprite.blocks.getBlock('move').parent).not.toBe('key');
    });

    test('undo is disabled during collaboration', async () => {
        await applyEdit(text => text.replace('"hi"', '"hello"'));
        vm.editingCommands.handler = () => {};
        const result = await undoCodeApply({vm});
        vm.editingCommands.handler = null;
        expect(result.reason).toBe('collaboration');
    });
});
