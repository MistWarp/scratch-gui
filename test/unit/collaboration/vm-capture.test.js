import VM from 'scratch-vm';
import VMAdapter from '../../../src/lib/collaboration/vm-adapter';
import VMApplier, {remapTargetIds} from '../../../src/lib/collaboration/vm-applier';
import {OP} from '../../../src/lib/collaboration/protocol';
import {createStorageAsset} from '../../../src/lib/collaboration/vm-assets';
import {encodeCommand, decodeCommand} from '../../../src/lib/collaboration/command-codec';
const Sprite = require('scratch-vm/src/sprites/sprite');
const RenderedTarget = require('scratch-vm/src/sprites/rendered-target');

const makeVM = () => {
    const vm = new VM();
    for (const [id, name, isStage] of [['stage', 'Stage', true], ['sprite', 'Sprite', false]]) {
        const sprite = new Sprite(null, vm.runtime);
        sprite.name = name;
        const target = new RenderedTarget(sprite, vm.runtime);
        target.id = id;
        target.isStage = isStage;
        target.isOriginal = true;
        vm.runtime.addTarget(target);
    }
    vm.editingTarget = vm.runtime.targets[1];
    vm.runtime.setEditingTarget(vm.editingTarget);
    vm.editingCommands.snapshot();
    return vm;
};
const event = (blockId, type = 'create') => ({type, blockId,
    xml: `<block id="${blockId}" type="motion_movesteps"><value name="STEPS"><shadow id="${blockId}-n" type="math_number"><field name="NUM">10</field></shadow></value></block>`});
const command = (method, args, extra = {}) => ({method, args, targetId: 'sprite', ...extra});

describe('native VM editing commands', () => {
    let host;
    let client;
    beforeEach(() => { host = makeVM(); client = makeVM(); });
    afterEach(() => { host.quit(); client.quit(); });

    test('snapshot remaps native monitor records to the host target', async () => {
        const metadata = host.editingCommands.snapshot();
        client.editingTarget.id = 'temporary-import-id';
        client.runtime.requestAddMonitor({id: 'watcher', opcode: 'motion_xposition',
            targetId: 'temporary-import-id', spriteName: 'Sprite'});
        client.runtime.monitorBlocks.createBlock({id: 'watcher', opcode: 'motion_xposition',
            inputs: {}, fields: {}, topLevel: true, targetId: 'temporary-import-id'});
        await remapTargetIds(client, metadata);
        expect(client.runtime.getMonitorState().get('watcher').targetId).toBe('sprite');
        expect(client.runtime.monitorBlocks.getBlock('watcher').targetId).toBe('sprite');
    });

    test('snapshot extension imports bypass outbound commands', async () => {
        const engine = client.editingCommands;
        engine.extensions.loadExtensionURL = jest.fn(() => Promise.resolve());
        engine.handler = jest.fn(() => Promise.reject(new Error('snapshot in progress')));
        engine.loadingSnapshot = true;
        await client.extensionManager.loadExtensionURL('pen');
        expect(engine.extensions.loadExtensionURL).toHaveBeenCalledWith('pen');
        expect(engine.handler).not.toHaveBeenCalled();
        engine.handler = null;
    });

    test('binary command encoding preserves Buffer bytes as a browser typed array', () => {
        const Storage = require('@turbowarp/scratch-storage');
        host.attachStorage(new Storage());
        const encoded = encodeCommand(host, command('addSprite', [Buffer.from([3, 7, 11])]));
        const decoded = decodeCommand(host, encoded.command);
        expect(decoded.args[0]).toBeInstanceOf(Uint8Array);
        expect(Array.from(decoded.args[0])).toEqual([3, 7, 11]);
    });

    test('replays block edits without a Blockly workspace and preserves generated IDs', async () => {
        const result = await host.editingCommands.execute(command('blockEvent', [event('block')]));
        await client.editingCommands.apply(result, () => null);
        expect(client.editingTarget.blocks._blocks).toEqual(host.editingTarget.blocks._blocks);
        expect(client.editingTarget.blocks.getBlock('block')).toBeTruthy();
    });

    test('capture happens before the local VM mutation and is not suppressed by a refresh', async () => {
        const send = jest.fn(() => Promise.resolve({}));
        const adapter = new VMAdapter({vm: client, onLocalOp: send});
        client.emit('workspaceUpdate', {});
        const e = {...event('local'), toJson () { return event('local'); }};
        client.blockListener(e);
        expect(client.editingTarget.blocks.getBlock('local')).toBeUndefined();
        expect(send).toHaveBeenCalledWith(OP.VM_EDIT, expect.objectContaining({command: expect.objectContaining({method: 'blockEvent'})}));
        await Promise.resolve();
        adapter.destroy();
    });

    test('remote comments target the addressed sprite and clearing text persists', async () => {
        client.editingTarget = client.runtime.targets[0];
        const create = {type: 'comment_create', commentId: 'comment', blockId: null,
            text: 'hello', xy: {x: 1, y: 2}, width: 100, height: 100, minimized: false};
        await client.editingCommands.apply(await host.editingCommands.execute(command('blockEvent', [create])), () => null);
        await client.editingCommands.apply(await host.editingCommands.execute(command('blockEvent', [{
            type: 'comment_change', commentId: 'comment', newContents_: {text: ''}
        }])), () => null);
        expect(client.runtime.targets[1].comments.comment.text).toBe('');
        expect(client.editingTarget.id).toBe('stage');
    });

    test('async failures reject instead of consuming the command', async () => {
        const applier = new VMApplier({vm: host});
        await expect(applier.apply(OP.VM_EDIT, encodeCommand(host, command('notAMethod', []))))
            .rejects.toThrow('Unknown editing command');
        applier.destroy();
    });

    test('destroy cancels queued mutations', async () => {
        const applier = new VMApplier({vm: host});
        const result = applier.apply(OP.VM_EDIT, encodeCommand(host, command('blockEvent', [event('late')])));
        applier.destroy();
        await expect(result).rejects.toThrow('session ended');
        expect(host.editingTarget.blocks.getBlock('late')).toBeUndefined();
    });

    test('a selected item is resolved by its ID after another editor deletes an earlier item', async () => {
        const target = host.editingTarget;
        target.sprite.sounds = ['A', 'B', 'C'].map(name => ({name, mwEditId: name, md5: `${name}.wav`}));
        await host.editingCommands.execute(command('deleteSound', [0], {itemId: 'A'}));
        await host.editingCommands.execute(command('renameSound', [1, 'X'], {itemId: 'B'}));
        expect(target.getSounds().map(item => item.name)).toEqual(['X', 'C']);
    });
});

describe('VM assets and generated identities', () => {
    let host;
    let client;
    const Storage = require('@turbowarp/scratch-storage');
    const Renderer = require('scratch-vm/test/fixtures/fake-renderer');
    beforeEach(() => {
        host = makeVM(); client = makeVM();
        host.attachStorage(new Storage()); client.attachStorage(new Storage());
        host.attachRenderer(new Renderer()); client.attachRenderer(new Renderer());
        host.runtime.renderer.destroyDrawable = () => {};
        client.runtime.renderer.destroyDrawable = () => {};
    });
    afterEach(() => { host.quit(); client.quit(); });

    test('snapshot remaps native monitor records to the host target', async () => {
        const metadata = host.editingCommands.snapshot();
        client.editingTarget.id = 'temporary-import-id';
        client.runtime.requestAddMonitor({id: 'watcher', opcode: 'motion_xposition',
            targetId: 'temporary-import-id', spriteName: 'Sprite'});
        client.runtime.monitorBlocks.createBlock({id: 'watcher', opcode: 'motion_xposition',
            inputs: {}, fields: {}, topLevel: true, targetId: 'temporary-import-id'});
        await remapTargetIds(client, metadata);
        expect(client.runtime.getMonitorState().get('watcher').targetId).toBe('sprite');
        expect(client.runtime.monitorBlocks.getBlock('watcher').targetId).toBe('sprite');
    });

    test('binary command encoding preserves Buffer bytes as a browser typed array', () => {
        const Storage = require('@turbowarp/scratch-storage');
        host.attachStorage(new Storage());
        const encoded = encodeCommand(host, command('addSprite', [Buffer.from([3, 7, 11])]));
        const decoded = decodeCommand(host, encoded.command);
        expect(decoded.args[0]).toBeInstanceOf(Uint8Array);
        expect(Array.from(decoded.args[0])).toEqual([3, 7, 11]);
    });
    const lookup = vm => md5 => createStorageAsset(vm, md5);

    test('identical imported sounds remain separate entries on both peers', async () => {
        const storage = host.runtime.storage;
        const asset = storage.createAsset(storage.AssetType.Sound, 'wav', new Uint8Array([1, 2, 3]), null, true);
        for (let i = 0; i < 2; i++) {
            const result = await host.editingCommands.execute(command('addSound', [{
                name: 'same', asset, assetId: asset.assetId, dataFormat: 'wav', md5: `${asset.assetId}.wav`
            }, 'sprite']));
            await client.editingCommands.apply(result, lookup(host));
        }
        expect(client.editingTarget.getSounds()).toHaveLength(2);
        expect(new Set(client.editingTarget.getSounds().map(item => item.mwEditId)).size).toBe(2);
        expect(client.editingCommands.snapshot()).toEqual(host.editingCommands.snapshot());
    });

    test('received sound edits include the encoded asset used by project serialization', async () => {
        const storage = host.runtime.storage;
        const asset = storage.createAsset(storage.AssetType.Sound, 'wav', new Uint8Array([1, 2, 3]), null, true);
        const first = await host.editingCommands.execute(command('addSound', [{
            name: 'sound', asset, assetId: asset.assetId, dataFormat: 'wav', md5: `${asset.assetId}.wav`
        }, 'sprite']));
        await client.editingCommands.apply(first, lookup(host));
        const item = host.editingTarget.getSounds()[0];
        const result = await host.editingCommands.execute(command('updateSoundBuffer', [0,
            {length: 2, sampleRate: 22050}, new Uint8Array([4, 5, 6, 7])], {itemId: item.mwEditId}));
        await client.editingCommands.apply(result, lookup(host));
        const received = client.editingTarget.getSounds()[0];
        expect(Array.from(received.asset.data)).toEqual([4, 5, 6, 7]);
        expect(JSON.parse(client.toJSON('sprite', {allowOptimization: false})).sounds[0].md5ext).toBe(received.md5);
    });

    test('sharing scripts preserves host-generated block IDs and follow-up edits', async () => {
        await host.editingCommands.execute(command('blockEvent', [event('original')]));
        const source = Object.values(host.editingTarget.blocks._blocks);
        const result = await host.editingCommands.execute(command('shareBlocksToTarget', [source, 'stage', 'sprite']));
        await client.editingCommands.apply(result, lookup(host));
        const shared = host.runtime.targets[0].blocks._blocks;
        expect(client.runtime.targets[0].blocks._blocks).toEqual(shared);
        const number = Object.values(shared).find(block => block.opcode === 'math_number');
        const edit = await host.editingCommands.execute(command('blockEvent', [{type: 'change',
            blockId: number.id, element: 'field', name: 'NUM', newValue: '42'}], {targetId: 'stage'}));
        await client.editingCommands.apply(edit, lookup(host));
        expect(client.runtime.targets[0].blocks.getBlock(number.id).fields.NUM.value).toBe('42');
    });

    test('new sprites preserve the selected sprite and every block ID on the receiver', async () => {
        const result = await host.editingCommands.execute(command('addSprite', [{
            name: 'Added', isStage: false, variables: {}, lists: {}, broadcasts: {},
            blocks: {}, comments: {}, costumes: [], sounds: [], currentCostume: 0,
            volume: 100, layerOrder: 2, visible: true, x: 0, y: 0, size: 100,
            direction: 90, draggable: false, rotationStyle: 'all around'
        }]));
        await client.editingCommands.apply(result, lookup(host));
        expect(client.editingTarget.id).toBe('sprite');
        expect(host.editingTarget.id).toBe('sprite');
        expect(client.editingCommands.snapshot()).toEqual(host.editingCommands.snapshot());
    });
});
