import React from 'react';
import {ChangeSet} from '@codemirror/state';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import {CodeWorkbench} from '../../../src/containers/code-workbench.jsx';
import {extensionDevInitialState} from '../../../src/reducers/extension-dev.js';
import {clearTexts, getText} from '../../../src/lib/code-mode/text-store.js';
import {projectFile, regionFiles} from '../../../src/lib/code-mode/file-projection.js';

const MAIN = 'var lives = 5;\n\nwhen flag at 0,0 {\n  say "hi";\n}';
const TEXT = `${MAIN}\n\nregion "enemies" {\n  when key space {\n    move 10;\n  }\n}\n\n` +
    'region "ui/hud" {\n  when flag {\n    show;\n  }\n}\n';

jest.mock('../../../src/lib/code-mode/text-controller.js', () => {
    const store = require('../../../src/lib/code-mode/text-store.js');
    const controller = {
        configure: () => {},
        refresh: targetId => {
            if (!store.getText(targetId)) {
                const text = global.mockInitialText;
                store.setText(targetId, {
                    targetId,
                    status: 'ready',
                    doc: text,
                    baseline: {text, sourceMap: {scripts: {}, blocks: {}}},
                    units: {},
                    unitsVersion: 1,
                    lockedScripts: [],
                    diagnostics: []
                });
            }
            return Promise.resolve(store.getText(targetId));
        },
        edit: (targetId, doc) => store.updateText(targetId, {doc}),
        apply: () => Promise.resolve({status: 'committed'}),
        setMessage: () => {},
        resolve: () => {},
        revert: () => {},
        discardDraft: () => {},
        isStale: () => false
    };
    return {getTextController: () => controller};
});

const makeTarget = (id, name, isStage) => ({
    id,
    isOriginal: true,
    isStage,
    currentCostume: 0,
    getName: () => name,
    getCostumes: () => [{name: `${name} costume`, asset: null}],
    getSounds: () => [],
    setCostume: jest.fn(),
    blocks: {getTopLevelScript: () => null}
});

const makeVm = () => {
    const stage = makeTarget('stage', 'Stage', true);
    const sprite = makeTarget('sprite', 'Sprite1', false);
    const listeners = () => ({on: jest.fn(), off: jest.fn()});
    return {
        ...listeners(),
        editingTarget: sprite,
        setEditingTarget: jest.fn(),
        extensionManager: {getExtensionEntries: () => [], isCoreExtension: () => false},
        runtime: {
            ...listeners(),
            targets: [stage, sprite],
            threads: [],
            _blockInfo: [],
            getTargetForStage: () => stage,
            getTargetById: id => [stage, sprite].find(target => target.id === id)
        }
    };
};

const flush = async () => {
    for (let i = 0; i < 6; i++) await Promise.resolve();
};

const dialogs = answers => jest.fn(action => {
    if (action.type !== 'scratch-gui/modals/SHOW_SIMPLE_DIALOG') return;
    const config = action.dialogConfig;
    const answer = answers.length ? answers.shift() : null;
    dialogs.seen.push(config);
    if (answer === null) config.onCancel();
    else config.onOk(answer);
});

const mounted = [];

const render = dispatch => mounted[mounted.push(mountWithIntl(
    <CodeWorkbench
        devState={extensionDevInitialState}
        dispatch={dispatch}
        editingTarget="sprite"
        sprites={{sprite: {order: 0, name: 'Sprite1', x: 0, y: 0, size: 100, direction: 90}}}
        vm={makeVm()}
    />
)) - 1];

const spriteRows = wrapper => {
    const rows = wrapper.find(CodeWorkbench).instance()
        .buildRows();
    const start = rows.findIndex(row => row.key === 'target:sprite');
    return rows.slice(start + 1).filter(row => row.type === 'script' || row.type === 'scriptFolder');
};

describe('code workbench with several files per sprite', () => {
    beforeEach(() => {
        clearTexts();
        global.mockInitialText = TEXT;
        dialogs.seen = [];
    });

    afterEach(() => {
        while (mounted.length) {
            const wrapper = mounted.pop();
            if (wrapper.length) wrapper.unmount();
        }
    });

    test('the explorer lists scripts.fractch, then folders and files in order', async () => {
        const wrapper = render(jest.fn());
        await flush();
        wrapper.update();
        const rows = spriteRows(wrapper);
        expect(rows.map(row => [row.label, row.depth])).toEqual([
            ['scripts.fractch', 1],
            ['ui', 1],
            ['hud.fractch', 2],
            ['enemies.fractch', 1]
        ]);
        expect(rows[2].file).toBe('ui/hud');
        expect(rows[2].key).toBe('script:sprite:ui%2Fhud');
    });

    test('a file tab shows only its scripts and edits land in the sprite text', async () => {
        const wrapper = render(jest.fn());
        await flush();
        const instance = wrapper.find(CodeWorkbench).instance();
        const row = spriteRows(wrapper).find(item => item.file === 'enemies');
        instance.handleExplorerOpen(row, {preview: false});
        await flush();
        wrapper.update();
        const tab = wrapper.find('TextTab').first();
        expect(tab.prop('value')).toBe('when key space {\n  move 10;\n}');
        const value = tab.prop('value');
        const at = value.indexOf('move 10;') + 'move 10;'.length;
        const next = `${value.slice(0, at)}\nturn 15;${value.slice(at)}`;
        instance.handleTextChange('g0', instance.activeTab(), next,
            ChangeSet.of([{from: at, insert: '\nturn 15;'}], value.length));
        expect(getText('sprite').doc).toContain('    move 10;\n  turn 15;\n');
        wrapper.update();
        const tabs = wrapper.find('EditorTabs').first()
            .prop('tabs');
        expect(tabs.find(item => item.key === 'script:sprite:enemies').dirty).toBe(true);
        expect(instance.fileDirty({kind: 'script', targetId: 'sprite', key: 'script:sprite'})).toBe(false);
    });

    test('New file rejects bad names, then adds a region and opens it', async () => {
        const dispatch = dialogs(['main', 'Enemies', 'player/move']);
        const wrapper = render(dispatch);
        await flush();
        const instance = wrapper.find(CodeWorkbench).instance();
        await instance.newCodeFile('sprite');
        await flush();
        expect(dialogs.seen.map(config => config.message)).toEqual([
            expect.stringContaining('Name the new file'),
            expect.stringContaining('cannot be used'),
            expect.stringContaining('already has a file called Enemies')
        ]);
        expect(regionFiles(getText('sprite').doc)).toEqual(['enemies', 'ui/hud', 'player/move']);
        expect(instance.activeTab().key).toBe('script:sprite:player%2Fmove');
        wrapper.update();
        expect(spriteRows(wrapper).map(row => row.label)).toContain('move.fractch');
    });

    test('rename rewrites the region header and moves the open tab', async () => {
        const wrapper = render(dialogs([]));
        await flush();
        const instance = wrapper.find(CodeWorkbench).instance();
        const row = spriteRows(wrapper).find(item => item.file === 'ui/hud');
        instance.handleExplorerOpen(row, {preview: false});
        instance.setState({renamingKey: row.key});
        instance.handleCommitRename(row, 'overlay.fractch');
        await flush();
        expect(regionFiles(getText('sprite').doc)).toEqual(['enemies', 'ui/overlay']);
        expect(projectFile(getText('sprite').doc, 'ui/overlay').text).toBe('when flag {\n  show;\n}');
        expect(instance.activeTab().key).toBe('script:sprite:ui%2Foverlay');
    });

    test('an invalid rename shows a dialog and changes nothing', async () => {
        const dispatch = dialogs([true]);
        const wrapper = render(dispatch);
        await flush();
        const instance = wrapper.find(CodeWorkbench).instance();
        const row = spriteRows(wrapper).find(item => item.file === 'enemies');
        instance.setState({renamingKey: row.key});
        instance.handleCommitRename(row, '.secret');
        await flush();
        expect(dialogs.seen[0].type).toBe('alert');
        expect(getText('sprite').doc).toBe(TEXT);
    });

    test('delete asks first when the file has scripts and removes them from the text', async () => {
        const dispatch = dialogs([null, 'delete']);
        const wrapper = render(dispatch);
        await flush();
        const instance = wrapper.find(CodeWorkbench).instance();
        const row = spriteRows(wrapper).find(item => item.file === 'enemies');
        await instance.deleteCodeFile(row);
        expect(getText('sprite').doc).toBe(TEXT);
        await instance.deleteCodeFile(row);
        expect(regionFiles(getText('sprite').doc)).toEqual(['ui/hud']);
        expect(getText('sprite').doc).not.toContain('move 10');
        expect(projectFile(getText('sprite').doc, null).text).toBe(`${MAIN}\n`);
        expect(dialogs.seen.map(config => config.type)).toEqual(['confirm', 'confirm']);
    });

    test('deleting an empty file does not ask', async () => {
        global.mockInitialText = `${MAIN}\n\nregion "empty" {\n}\n`;
        const dispatch = dialogs([]);
        const wrapper = render(dispatch);
        await flush();
        const instance = wrapper.find(CodeWorkbench).instance();
        await instance.deleteCodeFile({type: 'script', targetId: 'sprite', file: 'empty'});
        expect(dialogs.seen).toEqual([]);
        expect(getText('sprite').doc).toBe(`${MAIN}\n`);
    });

    test('problems are grouped per file with file line numbers', async () => {
        const wrapper = render(jest.fn());
        await flush();
        const state = getText('sprite');
        const from = state.doc.indexOf('move 10');
        require('../../../src/lib/code-mode/text-store.js').updateText('sprite', {
            diagnostics: [{severity: 'error', message: 'Bad move', from, to: from + 4, line: 9, column: 5}]
        });
        const instance = wrapper.find(CodeWorkbench).instance();
        const groups = instance.problemGroups().filter(group => group.targetId === 'sprite');
        expect(groups.map(group => group.title)).toEqual(['enemies.fractch']);
        expect(groups[0].problems[0].line).toBe(2);
        expect(groups[0].problems[0].column).toBe(3);
        const rows = spriteRows(wrapper);
        expect(rows.find(row => row.file === 'enemies').problems.errors).toBe(1);
        expect(rows.find(row => row.file === null).problems).toBeNull();
    });
});
