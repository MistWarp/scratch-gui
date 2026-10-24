import {ChangeSet} from '@codemirror/state';
import {loadVm} from '../../helpers/code-mode-fixture.js';
import {createFractchClient} from '../../../src/lib/code-mode/fractch-client.js';
import {createTextController} from '../../../src/lib/code-mode/text-controller.js';
import {clearCodeHistory} from '../../../src/lib/code-mode/code-history.js';
import {clearTexts, getText, hasUnappliedCode, unappliedFileCount} from '../../../src/lib/code-mode/text-store.js';
import {
    baseHash,
    classifyDraft,
    draftKey,
    flushDraftWrites,
    loadDraft,
    projectIdentity,
    resetDraftStore,
    scheduleDraftWrite
} from '../../../src/lib/code-mode/code-drafts.js';

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

const scriptIds = target => {
    const out = {};
    for (const topId of target.blocks.getScripts()) {
        const ids = [];
        let id = topId;
        while (id) {
            ids.push(id);
            id = target.blocks.getBlock(id).next;
        }
        out[topId] = ids.join(',');
    }
    return out;
};

describe('text controller', () => {
    let vm;
    let sprite;
    let client;
    let controller;
    let identity;

    beforeEach(async () => {
        clearTexts();
        clearCodeHistory();
        resetDraftStore();
        identity = null;
        ({vm, sprite} = await loadVm());
        client = createFractchClient();
        controller = createTextController({vm, client});
        controller.configure({
            getIdentity: () => identity,
            confirmImpact: () => Promise.resolve(true)
        });
    });

    afterEach(() => {
        controller.dispose();
        client.dispose();
        vm.quit();
    });

    test('a clean apply keeps the text as typed', async () => {
        await controller.regenerate(sprite.id);
        type(controller, sprite.id, text => text.replace('say "hi";', 'say   "hello"  ;'));
        expect(hasUnappliedCode()).toBe(true);
        expect(unappliedFileCount()).toBe(1);
        const outcome = await controller.apply(sprite.id);
        expect(outcome.status).toBe('committed');
        expect(outcome.kept).toBe(true);
        const state = getText(sprite.id);
        expect(state.doc).toBe(state.baseline.text);
        expect(state.doc).toContain('say   "hello"  ;');
        expect(state.canonicalBaseline.text).toContain('say "hello";');
        expect(state.message.kind).toBe('applied');
        expect(hasUnappliedCode()).toBe(false);
    });

    test('typing during an apply keeps the typed text and only rebases untouched units', async () => {
        await controller.regenerate(sprite.id);
        type(controller, sprite.id, text => text.replace('"hi"', '"hello"'));
        const pending = controller.apply(sprite.id);
        type(controller, sprite.id, text => text.replace('move 10;', 'move 25;'));
        const outcome = await pending;
        expect(outcome.status).toBe('committed');
        expect(outcome.kept).toBe(false);
        const state = getText(sprite.id);
        expect(state.doc).toContain('move 25;');
        expect(state.doc).toContain('"hello"');
        expect(state.doc).not.toBe(state.baseline.text);
        const before = scriptIds(sprite);
        const sayShadow = sprite.blocks.getBlock('say').inputs.MESSAGE.block;
        const second = await controller.apply(sprite.id);
        expect(second.status).toBe('committed');
        expect(scriptIds(sprite).hat).toBe(before.hat);
        expect(sprite.blocks.getBlock('say').inputs.MESSAGE.block).toBe(sayShadow);
        const moveShadow = sprite.blocks.getBlock(sprite.blocks.getBlock('move').inputs.STEPS.block);
        expect(String(moveShadow.fields.NUM.value)).toBe('25');
    });

    test('a live value change during editing is left alone by the next apply', async () => {
        await controller.regenerate(sprite.id);
        type(controller, sprite.id, text => text.replace('"hi"', '"hello"'));
        sprite.variables.v2.value = 42;
        const confirmImpact = jest.fn(() => Promise.resolve(true));
        controller.configure({confirmImpact});
        const outcome = await controller.apply(sprite.id);
        expect(outcome.status).toBe('committed');
        expect(confirmImpact).not.toHaveBeenCalled();
        expect(sprite.variables.v2.value).toBe(42);
    });

    test('blocks changes while the text is dirty rebase per unit', async () => {
        await controller.regenerate(sprite.id);
        type(controller, sprite.id, text => text.replace('"hi"', '"mine"'));
        sprite.blocks.changeBlock({element: 'field', id: 'key', name: 'KEY_OPTION', value: 'a'});
        expect(controller.isStale(sprite.id)).toBe(true);
        await controller.refresh(sprite.id);
        const state = getText(sprite.id);
        expect(state.conflicts).toEqual([]);
        expect(state.doc).toContain('"mine"');
        expect(state.doc).toContain('when key a');
    });

    test('a conflict blocks apply until it is resolved', async () => {
        await controller.regenerate(sprite.id);
        type(controller, sprite.id, text => text.replace('move 10;', 'move 99;'));
        sprite.blocks.changeBlock({element: 'field', id: 'key', name: 'KEY_OPTION', value: 'a'});
        await controller.refresh(sprite.id);
        const state = getText(sprite.id);
        expect(state.conflicts.length).toBe(1);
        expect((await controller.apply(sprite.id)).status).toBe('conflict');
        controller.resolve(sprite.id, state.conflicts[0].key, 'theirs');
        const resolved = getText(sprite.id);
        expect(resolved.conflicts).toEqual([]);
        expect(resolved.doc).toContain('when key a');
        expect(resolved.doc).not.toContain('move 99');
    });

    test('collaboration refuses apply with the lock message', async () => {
        await controller.regenerate(sprite.id);
        type(controller, sprite.id, text => text.replace('"hi"', '"x"'));
        vm.editingCommands.handler = () => {};
        const outcome = await controller.apply(sprite.id);
        vm.editingCommands.handler = null;
        expect(outcome.reason).toBe('collaboration');
        expect(getText(sprite.id).message.text).toBe('Editing code is unavailable during collaboration');
    });

    test('drafts restore as dirty text when the base still matches', async () => {
        identity = 'project:42';
        await controller.regenerate(sprite.id);
        type(controller, sprite.id, text => text.replace('"hi"', '"draft"'));
        await flushDraftWrites();
        clearTexts();
        await controller.regenerate(sprite.id);
        const state = getText(sprite.id);
        expect(state.doc).toContain('"draft"');
        expect(state.message.kind).toBe('restored');
    });

    test('drafts whose base changed open read-only', async () => {
        identity = 'project:42';
        await controller.regenerate(sprite.id);
        type(controller, sprite.id, text => text.replace('"hi"', '"draft"'));
        await flushDraftWrites();
        clearTexts();
        sprite.blocks.changeBlock({element: 'field', id: 'key', name: 'KEY_OPTION', value: 'a'});
        await controller.regenerate(sprite.id);
        const state = getText(sprite.id);
        expect(state.draft.kind).toBe('stale');
        expect(state.doc).toBe(state.baseline.text);
        expect(hasUnappliedCode()).toBe(true);
        controller.discardDraft(sprite.id);
        expect(hasUnappliedCode()).toBe(false);
    });

    test('dirty text survives a project load as a read-only draft', async () => {
        await controller.regenerate(sprite.id);
        type(controller, sprite.id, text => text.replace('"hi"', '"kept"'));
        vm.editingCommands.handler = () => {};
        controller.projectLoaded();
        vm.editingCommands.handler = null;
        expect(hasUnappliedCode()).toBe(false);
        await controller.regenerate(sprite.id);
        expect(getText(sprite.id).draft.text).toContain('"kept"');
    });
});

describe('draft keys', () => {
    beforeEach(() => resetDraftStore());

    test('script drafts key by identity, target name and stage flag', () => {
        expect(draftKey('project:1', {targetName: 'Sprite1', isStage: false}))
            .not.toBe(draftKey('project:1', {targetName: 'Sprite2', isStage: false}));
        expect(draftKey('project:1', {targetName: 'Stage', isStage: true}))
            .toBe(draftKey('project:1', {targetName: 'Renamed', isStage: true}));
        expect(draftKey('project:1', {extensionId: 'myext'})).toContain('myext');
    });

    test('only projects with a stable identity persist drafts', async () => {
        expect(projectIdentity({projectId: '0'})).toBeNull();
        expect(projectIdentity({projectId: null})).toBeNull();
        expect(projectIdentity({projectId: '123'})).toBe('project:123');
        expect(projectIdentity({isScratchDesktop: true, fileHandle: {name: 'game.sb3'}})).toBe('file:game.sb3');
        scheduleDraftWrite(null, {targetName: 'Sprite1'}, {text: 'x', baseHash: 'y'});
        await flushDraftWrites();
        expect(await loadDraft(null, {targetName: 'Sprite1'})).toBeNull();
    });

    test('a draft is restored only when its base hash matches the emitted text', () => {
        const draft = {text: 'edited', baseHash: baseHash('base')};
        expect(classifyDraft(draft, 'base')).toBe('restore');
        expect(classifyDraft(draft, 'other')).toBe('stale');
        expect(classifyDraft({text: 'base', baseHash: baseHash('base')}, 'base')).toBeNull();
    });
});
