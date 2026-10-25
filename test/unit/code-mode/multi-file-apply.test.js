import fs from 'fs';
import os from 'os';
import path from 'path';
import JSZip from 'jszip';
import {ChangeSet} from '@codemirror/state';
import {loadVm} from '../../helpers/code-mode-fixture.js';
import {createFractchClient} from '../../../src/lib/code-mode/fractch-client.js';
import {createTextController} from '../../../src/lib/code-mode/text-controller.js';
import {clearCodeHistory} from '../../../src/lib/code-mode/code-history.js';
import {clearTexts, getText, isDirty} from '../../../src/lib/code-mode/text-store.js';
import {flushDraftWrites, resetDraftStore} from '../../../src/lib/code-mode/code-drafts.js';
import {
    addFileText,
    applyEdit,
    projectFile,
    regionFiles
} from '../../../src/lib/code-mode/file-projection.js';
import {buildSb3FromFractchTree, writeProjectToFractchTree} from '../../../src/lib/git/fractch-tree.js';

jest.mock('../../../src/lib/persistence/storage', () => ({}));

jest.mock('../../../src/lib/tw-lazy-scratch-blocks.js', () => ({
    isLoaded: () => false,
    get: () => null
}));

jest.mock('../../../src/lib/project-replacement.js', () => ({
    prepareProjectReplacement: jest.fn(() => Promise.resolve(() => Promise.resolve()))
}));

const roots = [];

afterAll(() => {
    for (const root of roots) fs.rmSync(root, {recursive: true, force: true});
});

const editView = (controller, targetId, file, from, to, insert) => {
    const state = getText(targetId);
    const view = projectFile(state.doc, file);
    const changes = ChangeSet.of([{from, to, insert}], view.text.length);
    const viewText = view.text.slice(0, from) + insert + view.text.slice(to);
    const result = applyEdit(state.doc, file, viewText, changes);
    controller.edit(targetId, result.text, result.changes);
    expect(projectFile(result.text, file).text).toBe(viewText);
};

const membershipOf = target => {
    const comment = Object.values(target.comments).find(item => String(item.text).startsWith('_fractch_map_'));
    return comment ? JSON.parse(comment.text.slice('_fractch_map_'.length)) : null;
};

const listFiles = dir => {
    const out = [];
    const walk = current => {
        for (const entry of fs.readdirSync(current)) {
            const full = path.join(current, entry);
            if (fs.statSync(full).isDirectory()) walk(full);
            else out.push(path.relative(dir, full));
        }
    };
    walk(dir);
    return out.sort();
};

describe('several files in one sprite', () => {
    let vm;
    let sprite;
    let controller;

    beforeEach(async () => {
        clearTexts();
        clearCodeHistory();
        resetDraftStore();
        ({vm, sprite} = await loadVm());
        controller = createTextController({vm, client: createFractchClient()});
        controller.configure({getIdentity: () => null, confirmImpact: () => Promise.resolve(true)});
    });

    afterEach(async () => {
        await flushDraftWrites();
        clearTexts();
    });

    const moveKeyScriptIntoFile = async () => {
        await controller.regenerate(sprite.id);
        const added = addFileText(getText(sprite.id).doc, 'enemies/boss');
        controller.edit(sprite.id, added.text, added.changes);
        const main = projectFile(getText(sprite.id).doc, null).text;
        const start = main.indexOf('when key space');
        const end = main.indexOf('}', main.indexOf('move 10')) + 1;
        const script = main.slice(start, end);
        let cutFrom = start;
        while (cutFrom > 0 && /\s/.test(main[cutFrom - 1])) cutFrom--;
        editView(controller, sprite.id, null, cutFrom, end, '');
        editView(controller, sprite.id, 'enemies/boss', 0, 0, `// boss moves\n${script}`);
        return script;
    };

    test('a script moved into a new file applies and the VM records its file', async () => {
        const script = await moveKeyScriptIntoFile();
        const typed = getText(sprite.id).doc;
        expect(regionFiles(typed)).toEqual(['enemies/boss']);
        expect(projectFile(typed, 'enemies/boss').text).toBe(`// boss moves\n${script}`);
        expect(projectFile(typed, null).text).not.toContain('when key space');

        const outcome = await controller.apply(sprite.id);
        expect(outcome.status).toBe('committed');
        const state = getText(sprite.id);
        expect(state.doc).toBe(typed);
        expect(isDirty(state)).toBe(false);

        const target = vm.runtime.getTargetById(sprite.id);
        const hat = Object.keys(target.blocks._blocks)
            .find(id => target.blocks.getBlock(id).opcode === 'event_whenkeypressed');
        const flag = Object.keys(target.blocks._blocks)
            .find(id => target.blocks.getBlock(id).opcode === 'event_whenflagclicked');
        const map = membershipOf(target);
        expect(map.scripts[hat]).toBe('enemies/boss');
        expect(map.scripts[flag] || 'main').toBe('main');

        await controller.regenerate(sprite.id);
        const emitted = getText(sprite.id);
        expect(emitted.doc).toBe(typed);
        expect(projectFile(emitted.baseline.text, 'enemies/boss').text).toContain('when key space');
    });

    test('the files survive a fractch tree round trip as separate .fractch files', async () => {
        await moveKeyScriptIntoFile();
        expect((await controller.apply(sprite.id)).status).toBe('committed');

        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mistwarp-multi-file-'));
        roots.push(dir);
        await writeProjectToFractchTree({vm, fs: fs.promises, dir});
        const files = listFiles(dir).filter(name => name.endsWith('.fractch'));
        const spriteDir = files.find(name => name.endsWith(`${path.sep}main.fractch`) &&
            fs.readFileSync(path.join(dir, name), 'utf8').includes('lives'));
        expect(spriteDir).toBeTruthy();
        const folder = path.dirname(spriteDir);
        const bossFile = path.join(folder, 'enemies', 'boss.fractch');
        expect(files).toContain(bossFile);
        expect(fs.readFileSync(path.join(dir, bossFile), 'utf8')).toContain('when key space');
        expect(fs.readFileSync(path.join(dir, spriteDir), 'utf8')).not.toContain('when key space');

        const rebuilt = await buildSb3FromFractchTree({fs: fs.promises, dir});
        const zip = await JSZip.loadAsync(rebuilt);
        const project = JSON.parse(await zip.file('project.json').async('string'));
        const rebuiltSprite = project.targets.find(item => item.name === 'Sprite1');
        const map = membershipOf(rebuiltSprite);
        const hat = Object.keys(rebuiltSprite.blocks)
            .find(id => rebuiltSprite.blocks[id].opcode === 'event_whenkeypressed');
        expect(map.scripts[hat]).toBe('enemies/boss');

        await vm.loadProject(rebuilt);
        const loaded = vm.runtime.targets.find(item => item.isOriginal && item.getName() === 'Sprite1');
        const fresh = createTextController({vm, client: createFractchClient()});
        clearTexts();
        await fresh.regenerate(loaded.id);
        expect(regionFiles(getText(loaded.id).doc)).toEqual(['enemies/boss']);
        expect(projectFile(getText(loaded.id).doc, 'enemies/boss').text).toContain('when key space');
    });

    test('a compressed save, like a cloud upload or restore point, keeps the file', async () => {
        await moveKeyScriptIntoFile();
        expect((await controller.apply(sprite.id)).status).toBe('committed');

        const saved = await vm.saveProjectSb3('arraybuffer');
        await vm.loadProject(saved);
        const loaded = vm.runtime.targets.find(item => item.isOriginal && item.getName() === 'Sprite1');
        const hat = Object.keys(loaded.blocks._blocks)
            .find(id => loaded.blocks.getBlock(id).opcode === 'event_whenkeypressed');
        expect(membershipOf(loaded).scripts[hat]).toBe('enemies/boss');

        const fresh = createTextController({vm, client: createFractchClient()});
        clearTexts();
        await fresh.regenerate(loaded.id);
        expect(regionFiles(getText(loaded.id).doc)).toEqual(['enemies/boss']);
    });

    test('a free comment keeps its file, its place and its position through saves and the project history', async () => {
        await moveKeyScriptIntoFile();
        editView(controller, sprite.id, 'enemies/boss', 0, 0, '// tune the boss later\n\n');
        expect((await controller.apply(sprite.id)).status).toBe('committed');

        const live = vm.runtime.getTargetById(sprite.id);
        const hat = Object.keys(live.blocks._blocks)
            .find(id => live.blocks.getBlock(id).opcode === 'event_whenkeypressed');
        const noteId = Object.keys(live.comments).find(id => live.comments[id].text === 'tune the boss later');
        expect(live.comments[noteId].blockId).toBeNull();
        expect(membershipOf(live).comments[noteId]).toEqual({region: 'enemies/boss', before: hat});
        live.comments[noteId].x = 345;
        live.comments[noteId].y = 678;

        await vm.loadProject(await vm.saveProjectSb3('arraybuffer'));
        const loaded = vm.runtime.targets.find(item => item.isOriginal && item.getName() === 'Sprite1');
        const fresh = createTextController({vm, client: createFractchClient()});
        clearTexts();
        await fresh.regenerate(loaded.id);
        const boss = projectFile(getText(loaded.id).doc, 'enemies/boss').text;
        expect(boss.indexOf('// tune the boss later')).toBe(0);
        expect(boss.indexOf('// tune the boss later')).toBeLessThan(boss.indexOf('when key space'));
        expect(projectFile(getText(loaded.id).doc, null).text).not.toContain('tune the boss later');

        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mistwarp-free-comment-'));
        roots.push(dir);
        await writeProjectToFractchTree({vm, fs: fs.promises, dir});
        const bossFile = listFiles(dir).find(name => name.endsWith(path.join('enemies', 'boss.fractch')));
        const tree = fs.readFileSync(path.join(dir, bossFile), 'utf8');
        expect(tree).toContain('// tune the boss later');
        expect(tree).not.toContain('comment "');
        const rebuilt = JSON.parse(await (await JSZip.loadAsync(await buildSb3FromFractchTree({fs: fs.promises, dir})))
            .file('project.json').async('string'));
        const note = Object.values(rebuilt.targets.find(item => item.name === 'Sprite1').comments)
            .find(comment => comment.text === 'tune the boss later');
        expect([note.x, note.y]).toEqual([345, 678]);
    });

    test('files without scripts stay in the text after Apply and their comments stay in them', async () => {
        await controller.regenerate(sprite.id);
        let doc = addFileText(getText(sprite.id).doc, 'empty').text;
        doc = addFileText(doc, 'notes').text;
        controller.edit(sprite.id, doc, null);
        editView(controller, sprite.id, 'notes', 0, 0, '// just a note');
        const outcome = await controller.apply(sprite.id);
        expect(outcome.status).toBe('committed');
        const state = getText(sprite.id);
        expect([...regionFiles(state.doc)].sort()).toEqual(['empty', 'notes']);
        expect(projectFile(state.doc, 'empty').text).toBe('');
        expect(projectFile(state.doc, 'notes').text).toContain('// just a note');
        expect(projectFile(state.doc, null).text).not.toContain('// just a note');
        expect(isDirty(state)).toBe(false);
        expect((await controller.apply(sprite.id)).status).toBe('clean');
    });

    test('Apply all keeps a file without scripts', async () => {
        const stage = vm.runtime.getTargetForStage();
        await controller.regenerate(sprite.id);
        await controller.regenerate(stage.id);
        const added = addFileText(getText(sprite.id).doc, 'later');
        controller.edit(sprite.id, added.text, added.changes);
        const stageDoc = `${getText(stage.id).doc}\nwhen flag {\n  hide;\n}\n`;
        controller.edit(stage.id, stageDoc, null);
        expect((await controller.applyAll()).status).toBe('committed');
        expect(regionFiles(getText(sprite.id).doc)).toEqual(['later']);
        expect(isDirty(getText(sprite.id))).toBe(false);
    });
});
