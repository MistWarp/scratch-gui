import React from 'react';
import {TextDecoder as NodeTextDecoder, TextEncoder as NodeTextEncoder} from 'util';
import {CompletionContext} from '@codemirror/autocomplete';
import {EditorState} from '@codemirror/state';
import AssetManager from 'scratch-vm/src/engine/mw-asset-manager';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import {CodeWorkbench} from '../../../src/containers/code-workbench.jsx';
import {extensionDevInitialState} from '../../../src/reducers/extension-dev.js';
import {
    clearAssetDrafts,
    clearTexts,
    getAssetDraft,
    hasUnappliedCode,
    unappliedFileCount
} from '../../../src/lib/code-mode/text-store.js';
import {
    assetKind,
    buildAssetTree,
    languageFor,
    moveFolder
} from '../../../src/lib/code-mode/custom-assets.js';
import {assetAt} from '../../../src/lib/code-mode/definition.js';
import {fractchCompletionSource} from '../../../src/lib/code-mode/intelligence.js';
import {executeShortcut} from '../../../src/lib/shortcuts/event-router.js';

if (typeof global.TextEncoder === 'undefined') global.TextEncoder = NodeTextEncoder;
if (typeof global.TextDecoder === 'undefined') global.TextDecoder = NodeTextDecoder;

jest.mock('../../../src/lib/code-mode/text-controller.js', () => {
    const controller = {
        configure: () => {},
        identity: () => null,
        refresh: () => Promise.resolve(null),
        edit: () => {},
        apply: () => Promise.resolve({status: 'committed'}),
        setMessage: jest.fn(),
        resolve: () => {},
        revert: () => {},
        discardDraft: () => {}
    };
    return {getTextController: () => controller};
});

const bytes = text => new NodeTextEncoder().encode(text);

let assetCounter = 0;
const storage = {
    AssetType: {CustomAsset: {name: 'CustomAsset'}},
    createAsset: (type, dataFormat, data) => ({
        assetId: `id${assetCounter++}`,
        dataFormat,
        data,
        decodeText () {
            return new NodeTextDecoder().decode(this.data);
        }
    })
};

const makeManager = files => {
    const manager = new AssetManager({storage});
    for (const [name, value, format] of files) {
        manager.createAsset(name, typeof value === 'string' ? bytes(value) : value, format || name.split('.').pop());
    }
    return manager;
};

const makeVm = manager => {
    const listeners = () => ({on: jest.fn(), off: jest.fn()});
    const stage = {
        id: 'stage',
        isOriginal: true,
        isStage: true,
        currentCostume: 0,
        getName: () => 'Stage',
        getCostumes: () => [],
        getSounds: () => [],
        variables: {},
        blocks: {getTopLevelScript: () => null}
    };
    return {
        ...listeners(),
        editingTarget: stage,
        setEditingTarget: jest.fn(),
        extensionManager: {getExtensionEntries: () => [], isCoreExtension: () => false},
        runtime: {
            ...listeners(),
            targets: [stage],
            _blockInfo: [],
            assetManager: manager,
            getTargetForStage: () => stage,
            getTargetById: id => (id === 'stage' ? stage : null)
        }
    };
};

const render = manager => mountWithIntl(
    <CodeWorkbench
        devState={extensionDevInitialState}
        dispatch={jest.fn()}
        editingTarget="stage"
        sprites={{}}
        vm={makeVm(manager)}
    />
);

const rowLabels = wrapper => {
    wrapper.update();
    return wrapper.find('[role="treeitem"]').map(node => node.text());
};

const assetRows = wrapper => wrapper.find(CodeWorkbench).instance()
    .buildRows()
    .filter(row => ['assets', 'assetFolder', 'assetFile'].includes(row.type));

describe('custom asset helpers', () => {
    test('the tree nests folders before files, sorted, and keeps empty folders', () => {
        const tree = buildAssetTree(['b.txt', 'data/z.json', 'data/a.csv', 'A.txt'], ['empty']);
        expect(tree.folders.map(folder => folder.path)).toEqual(['data', 'empty']);
        expect(tree.folders[0].files).toEqual(['data/a.csv', 'data/z.json']);
        expect(tree.files).toEqual(['A.txt', 'b.txt']);
    });

    test('kinds come from the extension, then the format, then the bytes', () => {
        const entry = (name, data, dataFormat = 'bin') => ({name, asset: {data, dataFormat}});
        expect(assetKind(entry('a.txt', bytes('hi')))).toBe('text');
        expect(assetKind(entry('logo.svg', bytes('<svg/>')))).toBe('text');
        expect(assetKind(entry('pic', new Uint8Array([1]), 'png')))
            .toBe('image');
        expect(assetKind(entry('song.mp3', new Uint8Array([0, 1])))).toBe('audio');
        expect(assetKind(entry('notes', bytes('plain words')))).toBe('text');
        expect(assetKind(entry('blob', new Uint8Array([0, 159, 146])))).toBe('binary');
        expect(languageFor('data/a.json')).toBe('json');
        expect(languageFor('x.js')).toBe('javascript');
        expect(languageFor('readme.md')).toBe('text');
    });

    test('moving a folder renames everything inside it', () => {
        const manager = makeManager([['data/a.txt', 'a'], ['data/sub/b.txt', 'b'], ['other.txt', 'c']]);
        expect(moveFolder(manager, 'data', 'levels/data')).toEqual({
            'data/a.txt': 'levels/data/a.txt',
            'data/sub/b.txt': 'levels/data/sub/b.txt'
        });
        expect(manager.assets.map(entry => entry.name)).toEqual([
            'levels/data/a.txt', 'levels/data/sub/b.txt', 'other.txt'
        ]);
    });

    test('asset strings in fractch are found and completed', () => {
        const text = 'say assets.get("data/level1.txt", "size");\nsay assets.infolder("data");';
        expect(assetAt(text, text.indexOf('level1'))).toEqual({kind: 'asset', name: 'data/level1.txt'});
        expect(assetAt(text, text.indexOf('size'))).toBe(null);
        expect(assetAt(text, text.lastIndexOf('data'))).toEqual({kind: 'assetFolder', name: 'data'});
        expect(assetAt('x = assets.get(ASSET: assets.menu("b.txt"));', 36))
            .toEqual({kind: 'asset', name: 'b.txt'});
        const manager = makeManager([['data/level1.txt', 'x'], ['logo.png', new Uint8Array([1])]]);
        const vm = makeVm(manager);
        const complete = doc => fractchCompletionSource(() => vm, () => null)(
            new CompletionContext(EditorState.create({doc}), doc.length, false));
        expect(complete('say assets.get("').options.map(option => option.label))
            .toEqual(['data/level1.txt', 'logo.png']);
        expect(complete('say assets.infolder("').options.map(option => option.label)).toEqual(['data']);
    });
});

describe('assets in the code workbench', () => {
    beforeEach(() => {
        clearTexts();
        clearAssetDrafts();
    });

    test('the Assets folder shows the asset tree and follows runtime changes', () => {
        const manager = makeManager([['data/level1.txt', 'one'], ['notes.txt', 'hi']]);
        const wrapper = render(manager);
        const labels = () => assetRows(wrapper).map(row => row.label);
        expect(labels()).toEqual(['Assets', 'data', 'notes.txt']);
        const instance = wrapper.find(CodeWorkbench).instance();
        instance.handleExplorerToggle(assetRows(wrapper).find(row => row.type === 'assetFolder'));
        wrapper.update();
        expect(labels()).toEqual(['Assets', 'data', 'level1.txt', 'notes.txt']);
        manager.createAsset('data/level2.txt', bytes('two'), 'txt');
        wrapper.update();
        expect(labels()).toEqual(['Assets', 'data', 'level1.txt', 'level2.txt', 'notes.txt']);
        expect(rowLabels(wrapper)).toEqual(expect.arrayContaining(['Assets3', 'level2.txt']));
        wrapper.unmount();
    });

    test('a text asset opens in an editor tab, edits count as unapplied, and Mod+S writes them', () => {
        const manager = makeManager([['data/level1.txt', 'one']]);
        const wrapper = render(manager);
        const instance = wrapper.find(CodeWorkbench).instance();
        instance.handleExplorerOpen({type: 'assetFile', assetName: 'data/level1.txt'}, {preview: true});
        wrapper.update();
        const tab = instance.activeTab();
        expect(tab).toEqual(expect.objectContaining({kind: 'customAsset', name: 'data/level1.txt'}));
        expect(wrapper.find('TextTab').first()
            .prop('value')).toBe('one');
        expect(wrapper.find('TextTab').first()
            .prop('language')).toBe('text');
        wrapper.find('TextTab').first()
            .prop('onChange')('one more');
        wrapper.update();
        expect(hasUnappliedCode()).toBe(true);
        expect(unappliedFileCount()).toBe(1);
        expect(wrapper.find('EditorTabs').first()
            .prop('tabs')
            .find(each => each.key === tab.key).dirty).toBe(true);
        expect(instance.activeTab().key).toBe(tab.key);
        executeShortcut({actionType: 'callback', action: 'applyAndSave'});
        expect(manager.getAsset('data/level1.txt').asset.decodeText()).toBe('one more');
        expect(getAssetDraft('data/level1.txt')).toBe(null);
        expect(hasUnappliedCode()).toBe(false);
        wrapper.unmount();
    });

    test('images open a preview, binaries an info tab, and a deleted asset closes its tab', () => {
        const manager = makeManager([['logo.png', new Uint8Array([137, 80])], ['blob.bin', new Uint8Array([0, 1, 2])]]);
        const wrapper = render(manager);
        const instance = wrapper.find(CodeWorkbench).instance();
        instance.handleExplorerOpen({type: 'assetFile', assetName: 'logo.png'}, {preview: false});
        wrapper.update();
        expect(wrapper.find('CustomAssetTab').prop('kind')).toBe('image');
        instance.handleExplorerOpen({type: 'assetFile', assetName: 'blob.bin'}, {preview: false});
        wrapper.update();
        expect(wrapper.find('CustomAssetTab').prop('kind')).toBe('binary');
        expect(wrapper.text()).toContain('Download');
        manager.deleteAssetByName('blob.bin');
        wrapper.update();
        expect(instance.state.layout.groups[0].tabs.filter(each => each.kind === 'customAsset')
            .map(each => each.name)).toEqual(['logo.png']);
        wrapper.unmount();
    });

    test('dropped files land in the folder and dragging moves an asset with its open tab', async () => {
        const manager = makeManager([['notes.txt', 'hi'], ['data/a.txt', 'a']]);
        const wrapper = render(manager);
        const instance = wrapper.find(CodeWorkbench).instance();
        const folderRow = () => assetRows(wrapper).find(row => row.type === 'assetFolder');
        const file = {name: 'level.json', arrayBuffer: () => Promise.resolve(bytes('{}').buffer)};
        instance.dropFiles([file], folderRow());
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(manager.getAsset('data/level.json')).not.toBe(null);
        instance.handleExplorerOpen({type: 'assetFile', assetName: 'notes.txt'}, {preview: false});
        const source = {type: 'assetFile', assetName: 'notes.txt'};
        expect(instance.assets.canDrop(folderRow(), source)).toBe(true);
        instance.dropInternal(source, folderRow());
        wrapper.update();
        expect(manager.getAsset('data/notes.txt')).not.toBe(null);
        expect(instance.activeTab().name).toBe('data/notes.txt');
        wrapper.unmount();
    });

    test('renaming a file keeps it in its folder and Go to definition opens an asset tab', () => {
        const manager = makeManager([['data/a.txt', 'a']]);
        const wrapper = render(manager);
        const instance = wrapper.find(CodeWorkbench).instance();
        instance.setState({renamingKey: 'customAsset:data/a.txt'});
        const row = {key: 'customAsset:data/a.txt', type: 'assetFile', label: 'a.txt', assetName: 'data/a.txt'};
        instance.handleCommitRename(row, 'b.txt');
        expect(manager.assets.map(entry => entry.name)).toEqual(['data/b.txt']);
        expect(instance.assets.goTo({kind: 'asset', name: 'DATA/B.TXT'}, 'stage')).toBe(true);
        wrapper.update();
        expect(instance.activeTab()).toEqual(expect.objectContaining({kind: 'customAsset', name: 'data/b.txt'}));
        wrapper.unmount();
    });
});
