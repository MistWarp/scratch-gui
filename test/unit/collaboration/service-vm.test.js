import VM from 'scratch-vm';
import {CollabService} from '../../../src/lib/collaboration';
import {FakeHub} from '../../fixtures/collab-harness';
const Storage = require('@turbowarp/scratch-storage');
const Sprite = require('scratch-vm/src/sprites/sprite');
const RenderedTarget = require('scratch-vm/src/sprites/rendered-target');
const Renderer = require('scratch-vm/test/fixtures/fake-renderer');
let mockHub;
let mockPeer = 0;

jest.mock('../../../src/lib/collaboration/transport', () => {
    const {FakeCollabTransport} = require('../../fixtures/collab-harness');
    return {Transport: class extends FakeCollabTransport {
        constructor () { super(mockHub, `peer-${++mockPeer}`); }
    }};
});
jest.mock('../../../src/lib/api/restore-points', () => ({
    createRestorePoint: jest.fn(() => Promise.resolve()),
    createSafetyRestorePoint: jest.fn(() => Promise.resolve())
}));

jest.mock('../../../src/lib/git/browser-git.js', () => ({
    createRepoBackup: jest.fn(async () => jest.fn())
}));

const makeVM = () => {
    const vm = new VM();
    vm.attachStorage(new Storage());
    const renderer = new Renderer();
    renderer.destroyDrawable = () => {};
    vm.attachRenderer(renderer);
    const asset = vm.runtime.storage.get(vm.runtime.storage.defaultAssetId.ImageVector);
    for (const [name, stage] of [['Stage', true], ['Sprite', false]]) {
        const sprite = new Sprite(null, vm.runtime);
        sprite.name = name;
        sprite.costumes = [{name: 'costume', asset, assetId: asset.assetId,
            bitmapResolution: 1, rotationCenterX: 0, rotationCenterY: 0,
            dataFormat: asset.dataFormat, md5: `${asset.assetId}.${asset.dataFormat}`, skinId: 1}];
        const target = new RenderedTarget(sprite, vm.runtime);
        target.isStage = stage;
        target.isOriginal = true;
        vm.runtime.addTarget(target);
    }
    vm.editingTarget = vm.runtime.targets[1];
    vm.runtime.setEditingTarget(vm.editingTarget);
    return vm;
};

const pumpUntil = async predicate => {
    for (let i = 0; i < 500; i++) {
        await mockHub.flush();
        if (predicate()) return;
        await new Promise(resolve => setTimeout(resolve, 2));
    }
    throw new Error('Collaboration did not settle');
};

test('real facade onboards a VM and commits edits from both peers without echoing', async () => {
    mockHub = new FakeHub();
    const host = new CollabService();
    const client = new CollabService();
    const hostVM = makeVM();
    const clientVM = makeVM();
    host.init(hostVM); client.init(clientVM);
    const failures = [];
    client.on('join-denied', reason => failures.push(reason));
    client.on('connection-failed', reason => failures.push(reason));
    try {
        await host.connectToRoom('test', 'host', true);
        await client.connectToRoom('test', 'guest');
        await pumpUntil(() => client._session && client._session.lastAppliedSeq !== null);
        expect(failures).toEqual([]);
        expect(clientVM.editingCommands.snapshot()).toEqual(hostVM.editingCommands.snapshot());
        const id = clientVM.editingTarget.id;
        let done = false;
        const rename = clientVM.renameSprite(id, 'Together').then(() => { done = true; });
        await pumpUntil(() => done);
        await rename;
        expect(hostVM.runtime.getTargetById(id).getName()).toBe('Together');
        expect(clientVM.runtime.getTargetById(id).getName()).toBe('Together');
        expect(host._session.seq).toBe(1);
        done = false;
        const transform = hostVM.postSpriteInfo({x: 73}).then(() => { done = true; });
        await pumpUntil(() => done && client._session.lastAppliedSeq === 2);
        await transform;
        expect(clientVM.runtime.getTargetById(id).x).toBe(73);
        expect(failures).toEqual([]);
        expect(clientVM.editingCommands.snapshot()).toEqual(hostVM.editingCommands.snapshot());
        const spriteBytes = await clientVM.exportSprite(id, 'arraybuffer');
        done = false;
        const imported = clientVM.addSprite(spriteBytes).then(() => { done = true; });
        await pumpUntil(() => done && client._session.lastAppliedSeq === 3);
        await imported;
        expect(hostVM.runtime.targets).toHaveLength(3);
        expect(clientVM.editingCommands.snapshot()).toEqual(hostVM.editingCommands.snapshot());
        expect(failures).toEqual([]);
    } finally {
        client.disconnect(); host.disconnect(); hostVM.quit(); clientVM.quit();
    }
});
