import React from 'react';
import {ChangeSet} from '@codemirror/state';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import {loadVm} from '../../helpers/code-mode-fixture.js';
import {CodeWorkbench} from '../../../src/containers/code-workbench.jsx';
import {extensionDevInitialState} from '../../../src/reducers/extension-dev.js';
import {getTextController} from '../../../src/lib/code-mode/text-controller.js';
import {clearTexts, getText, isDirty} from '../../../src/lib/code-mode/text-store.js';
import {redo, undo} from '@codemirror/commands';
import {projectFile, regionFiles} from '../../../src/lib/code-mode/file-projection.js';

jest.mock('../../../src/lib/tw-lazy-scratch-blocks.js', () => ({
    isLoaded: () => false,
    get: () => null
}));

jest.mock('../../../src/lib/project-replacement.js', () => ({
    prepareProjectReplacement: jest.fn(() => Promise.resolve(() => Promise.resolve()))
}));

if (typeof Range !== 'undefined' && !Range.prototype.getClientRects) {
    Range.prototype.getClientRects = () => [];
    Range.prototype.getBoundingClientRect = () => ({left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0});
}

const settle = async () => {
    for (let i = 0; i < 20; i++) await new Promise(resolve => setTimeout(resolve, 5));
};

const answering = answers => action => {
    if (action.type !== 'scratch-gui/modals/SHOW_SIMPLE_DIALOG') return;
    const answer = answers.length ? answers.shift() : null;
    if (answer === null) action.dialogConfig.onCancel();
    else action.dialogConfig.onOk(answer);
};

const typeInto = (instance, tab, edit) => {
    const state = getText(tab.targetId);
    const view = projectFile(state.doc, tab.file || null, state.pendingRegions ?
        new Set(state.pendingRegions) : null).text;
    const {from, to = from, insert} = edit(view);
    const next = view.slice(0, from) + insert + view.slice(to);
    instance.handleTextChange('g0', tab, next, ChangeSet.of([{from, to, insert}], view.length));
    return next;
};

describe('code workbench editing several files with the real text controller', () => {
    let vm;
    let sprite;
    let wrapper;
    let instance;

    const mount = async (answers = []) => {
        clearTexts();
        ({vm, sprite} = await loadVm());
        const controller = getTextController(vm);
        controller.configure({getIdentity: () => null, confirmImpact: () => Promise.resolve(true)});
        wrapper = mountWithIntl(
            <CodeWorkbench
                devState={extensionDevInitialState}
                dispatch={answering(answers)}
                editingTarget={sprite.id}
                sprites={{[sprite.id]: {order: 0, x: 0, y: 0, size: 100, direction: 90, name: 'Sprite1'}}}
                vm={vm}
            />
        );
        instance = wrapper.find(CodeWorkbench).instance();
        await settle();
        controller.configure({confirmImpact: () => Promise.resolve(true)});
    };

    afterEach(() => {
        if (wrapper && wrapper.length) wrapper.unmount();
        clearTexts();
    });

    test('a file created, filled and applied from the workbench reaches the VM', async () => {
        await mount(['enemies']);
        await instance.newCodeFile(sprite.id);
        await settle();
        const tab = instance.activeTab();
        expect(tab.file).toBe('enemies');
        typeInto(instance, tab, () => ({from: 0, insert: 'when key a {\n  hide;\n}'}));
        const doc = getText(sprite.id).doc;
        expect(doc).toContain('region "enemies" {\n  when key a {\n    hide;\n  }\n}');
        expect(getText(sprite.id).units).toBeTruthy();
        const result = await instance.handleApply();
        expect(result.status).toBe('committed');
        expect(getText(sprite.id).doc).toBe(doc);
        const target = vm.runtime.getTargetById(sprite.id);
        const comment = Object.values(target.comments).find(item => String(item.text).startsWith('_fractch_map_'));
        expect(Object.values(JSON.parse(comment.text.slice(13)).scripts)).toContain('enemies');
    });

    test('a region typed in main stays in main until the cursor leaves it', async () => {
        await mount();
        expect(instance.activeTab().file).toBeUndefined();
        const view = instance.activeEditorView();
        expect(view).toBeTruthy();
        const end = view.state.doc.length;
        const typed = '\nregion "late" {\n  \n}\n';
        view.dispatch({changes: {from: end, insert: typed}, selection: {anchor: end + typed.indexOf('  ') + 2}});
        await settle();
        expect(getText(sprite.id).pendingRegions).toEqual(['late']);
        expect(instance.buildRows().some(row => row.file === 'late')).toBe(false);
        expect(view.state.doc.toString()).toContain('region "late"');
        view.dispatch({changes: {from: view.state.selection.main.head, insert: 'hide;'}});
        await settle();
        expect(getText(sprite.id).pendingRegions).toEqual(['late']);
        expect(getText(sprite.id).doc).toContain('region "late" {\n  hide;\n}');
        view.dispatch({changes: {from: 0, insert: '// top\n'}, selection: {anchor: 2}});
        await settle();
        expect(getText(sprite.id).pendingRegions || null).toBeNull();
        expect(instance.buildRows().some(row => row.file === 'late')).toBe(true);
        expect(view.state.doc.toString()).not.toContain('region "late"');
    });

    test('deleting a file can be undone from the message bar', async () => {
        await mount(['notes', 'delete']);
        await instance.newCodeFile(sprite.id);
        await settle();
        typeInto(instance, instance.activeTab(), () => ({from: 0, insert: '// remember this'}));
        const before = getText(sprite.id).doc;
        await instance.deleteCodeFile({type: 'script', targetId: sprite.id, file: 'notes'});
        await settle();
        expect(regionFiles(getText(sprite.id).doc)).toEqual([]);
        expect(getText(sprite.id).message.kind).toBe('fileDeleted');
        instance.undoDeleteFile(sprite.id);
        await settle();
        expect(getText(sprite.id).doc).toBe(before);
        expect(instance.activeTab().file).toBe('notes');
    });

    test('the sprite row shows unapplied text even when a file tab looks clean', async () => {
        await mount(['extra']);
        await instance.newCodeFile(sprite.id);
        await settle();
        const state = getText(sprite.id);
        const main = {key: `script:${sprite.id}`, kind: 'script', targetId: sprite.id};
        expect(isDirty(state)).toBe(true);
        expect(instance.fileDirty(instance.activeTab())).toBe(true);
        expect(instance.fileDirty(main)).toBe(false);
        const row = instance.buildRows().find(item => item.key === `target:${sprite.id}`);
        expect(row.dirty).toBe(true);
        expect(instance.textMessages(sprite.id, state, main).map(item => item.key)).toContain('otherFiles');
        expect(instance.textMessages(sprite.id, state, instance.activeTab()).map(item => item.key))
            .not.toContain('otherFiles');
    });

    test('a typed region becomes a file when the cursor leaves it and undo or redo never touch it', async () => {
        await mount();
        const view = instance.activeEditorView();
        const end = view.state.doc.length;
        const typed = '\nregion "late" {\n  hide;\n}\n';
        view.dispatch({changes: {from: end, insert: typed}, selection: {anchor: end + typed.indexOf('hide')}});
        await settle();
        expect(getText(sprite.id).pendingRegions).toEqual(['late']);
        view.dispatch({selection: {anchor: 0}});
        await settle();
        expect(getText(sprite.id).pendingRegions || null).toBeNull();
        expect(view.state.doc.toString()).not.toContain('region "late"');
        expect(instance.buildRows().some(row => row.file === 'late')).toBe(true);
        const after = getText(sprite.id).doc;
        expect(undo(view)).toBe(false);
        await settle();
        expect(getText(sprite.id).doc).toBe(after);
        view.dispatch({changes: {from: 0, insert: '// a\n'}});
        await settle();
        expect(undo(view)).toBe(true);
        await settle();
        expect(redo(view)).toBe(true);
        await settle();
        expect(undo(view)).toBe(true);
        expect(undo(view)).toBe(false);
        await settle();
        expect(getText(sprite.id).doc).toBe(after);
        expect(regionFiles(getText(sprite.id).doc)).toEqual(['late']);
        expect(projectFile(getText(sprite.id).doc, 'late').text).toBe('hide;');
    });

    test('a selection does not convert a typed region until it collapses outside it', async () => {
        await mount();
        const view = instance.activeEditorView();
        const end = view.state.doc.length;
        const typed = '\nregion "late" {\n  hide;\n}\n';
        const inside = end + typed.indexOf('hide');
        view.dispatch({changes: {from: end, insert: typed}, selection: {anchor: inside}});
        await settle();
        view.dispatch({selection: {anchor: inside, head: 0}});
        await settle();
        expect(getText(sprite.id).pendingRegions).toEqual(['late']);
        view.dispatch({selection: {anchor: 0, head: view.state.doc.length}});
        await settle();
        expect(getText(sprite.id).pendingRegions).toEqual(['late']);
        expect(view.state.doc.toString()).toContain('region "late"');
        view.dispatch({selection: {anchor: 1}});
        await settle();
        expect(getText(sprite.id).pendingRegions || null).toBeNull();
    });

    test('the code reloads after a project load that keeps the same stage', async () => {
        await mount();
        expect(getText(sprite.id).status).toBe('ready');
        instance.controller.projectLoaded();
        await settle();
        await settle();
        expect(getText(sprite.id)).toBeTruthy();
        expect(getText(sprite.id).status).toBe('ready');
        expect(instance.activeEditorView().state.doc.toString()).toContain('when flag');
    });

    test('each sprite keeps its own delete undo and the button goes when it cannot work', async () => {
        await mount(['one', 'two']);
        const stage = vm.runtime.getTargetForStage();
        await instance.newCodeFile(sprite.id);
        await settle();
        await instance.controller.refresh(stage.id);
        await instance.newCodeFile(stage.id);
        await settle();
        await instance.deleteCodeFile({type: 'script', targetId: sprite.id, file: 'one'});
        await instance.deleteCodeFile({type: 'script', targetId: stage.id, file: 'two'});
        await settle();
        const action = id => instance.textMessages(id, getText(id), null).find(item => item.key === 'fileDeleted');
        expect(action(sprite.id).action).toBeTruthy();
        expect(action(stage.id).action).toBeTruthy();
        action(sprite.id).action.onClick();
        await settle();
        expect(regionFiles(getText(sprite.id).doc)).toEqual(['one']);
        const stageState = getText(stage.id);
        require('../../../src/lib/code-mode/text-store.js').setText(stage.id, {
            ...stageState,
            doc: `${stageState.doc}// changed elsewhere\n`
        });
        expect(action(stage.id).action).toBeNull();
    });

    const typeRegionAndLeave = async (view, name = 'late') => {
        const end = view.state.doc.length;
        const typed = `\nregion "${name}" {\n  hide;\n}\n`;
        view.dispatch({changes: {from: end, insert: typed}, selection: {anchor: end + typed.indexOf('hide')}});
        await settle();
        view.dispatch({selection: {anchor: 0}});
        await settle();
        expect(getText(sprite.id).pendingRegions || null).toBeNull();
    };

    const regionCount = name => getText(sprite.id).doc.split(`region "${name}" {`).length - 1;

    test('an edit made before a conversion can still be undone and the file stays', async () => {
        await mount();
        const view = instance.activeEditorView();
        view.dispatch({changes: {from: 0, insert: '// first\n'}, userEvent: 'input.type'});
        await settle();
        view.dispatch({changes: {from: 0, insert: ''}, userEvent: 'input.type'});
        await new Promise(resolve => setTimeout(resolve, 600));
        await typeRegionAndLeave(view);
        for (let i = 0; i < 4; i++) {
            undo(view);
            await settle();
            expect(regionCount('late')).toBe(1);
            expect(regionFiles(getText(sprite.id).doc)).toEqual(['late']);
        }
        expect(getText(sprite.id).doc).not.toContain('// first');
        for (let i = 0; i < 4; i++) {
            redo(view);
            await settle();
            expect(regionCount('late')).toBe(1);
        }
        expect(getText(sprite.id).doc).toContain('// first');
        expect(projectFile(getText(sprite.id).doc, 'late').text).toBe('hide;');
    });

    test('the line break after a file in main cannot be deleted and leaves no undo step', async () => {
        await mount();
        const view = instance.activeEditorView();
        const doc = getText(sprite.id).doc;
        const withFile = `// top\nregion "mid" {\n  hide;\n}\n${doc}`;
        const controller = getTextController(vm);
        controller.edit(sprite.id, withFile, null);
        instance.handleTextsChanged();
        await settle();
        const text = view.state.doc.toString();
        expect(text.startsWith(`// top\n${doc.split('\n')[0]}`)).toBe(true);
        const at = text.indexOf('\n');
        view.dispatch({changes: {from: at, to: at + 1}, userEvent: 'delete.forward'});
        await settle();
        expect(view.state.doc.toString()).toBe(text);
        expect(getText(sprite.id).doc).toBe(withFile);
        expect(undo(view)).toBe(false);
        view.dispatch({changes: {from: at, insert: ' more'}, userEvent: 'input.type'});
        await settle();
        expect(getText(sprite.id).doc).toContain('// top more\nregion "mid" {');
        expect(regionFiles(getText(sprite.id).doc)).toEqual(['mid']);
    });

    test('a cursor on the line after a typed region counts as outside it', async () => {
        await mount();
        const view = instance.activeEditorView();
        const end = view.state.doc.length;
        const typed = '\nregion "late" {\n  hide;\n}\n';
        view.dispatch({changes: {from: end, insert: typed}, selection: {anchor: end + typed.indexOf('hide')}});
        await settle();
        view.dispatch({selection: {anchor: view.state.doc.length}});
        await settle();
        expect(getText(sprite.id).pendingRegions || null).toBeNull();
    });

    describe('undo around a file between main lines', () => {
        const setUp = async () => {
            await mount();
            const view = instance.activeEditorView();
            const doc = getText(sprite.id).doc;
            const withFile = `// top\nregion "mid" {\n  hide;\n}\n${doc}`;
            getTextController(vm).edit(sprite.id, withFile, null);
            instance.handleTextsChanged();
            await settle();
            const original = view.state.doc.toString();
            expect(original.startsWith(`// top\n${doc.split('\n')[0]}`)).toBe(true);
            return {view, original};
        };

        const expectSynced = view => {
            const state = getText(sprite.id);
            expect(projectFile(state.doc, null).text).toBe(view.state.doc.toString());
            expect(regionFiles(state.doc)).toEqual(['mid']);
            expect(projectFile(state.doc, 'mid').text).toBe('hide;');
        };

        const roundTrip = async (view, original, change, userEvent) => {
            view.dispatch({changes: change(view.state.doc), userEvent});
            await settle();
            expectSynced(view);
            const changed = view.state.doc.toString();
            expect(undo(view)).toBe(true);
            await settle();
            expect(view.state.doc.toString()).toBe(original);
            expectSynced(view);
            expect(redo(view)).toBe(true);
            await settle();
            expect(view.state.doc.toString()).toBe(changed);
            expectSynced(view);
            expect(undo(view)).toBe(true);
            await settle();
            expect(view.state.doc.toString()).toBe(original);
            expectSynced(view);
        };

        test('select all and delete, then undo and redo', async () => {
            const {view, original} = await setUp();
            await roundTrip(view, original, doc => ({from: 0, to: doc.length}), 'delete');
        });

        test('select all and paste, then undo and redo', async () => {
            const {view, original} = await setUp();
            await roundTrip(view, original, doc => ({from: 0, to: doc.length, insert: 'say hi;'}), 'input.paste');
        });

        test('delete everything after the file, then undo and redo', async () => {
            const {view, original} = await setUp();
            const at = original.indexOf('\n') + 1;
            await roundTrip(view, original, doc => ({from: at, to: doc.length}), 'delete');
        });

        test('delete everything before the file, then undo and redo', async () => {
            const {view, original} = await setUp();
            await roundTrip(view, original, () => ({from: 0, to: original.indexOf('\n')}), 'delete');
        });

        test('a delete across the line break keeps it and undo restores exactly', async () => {
            const {view, original} = await setUp();
            const at = original.indexOf('\n');
            await roundTrip(view, original, () => ({from: at - 3, to: at + 4}), 'delete');
            expect(original.slice(at, at + 1)).toBe('\n');
        });
    });
});
