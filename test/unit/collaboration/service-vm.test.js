import VM from 'scratch-vm';
import {CollabService} from '../../../src/lib/collaboration';
import {FakeHub} from '../../fixtures/collab-harness';
const Storage = require('@turbowarp/scratch-storage');
const Sprite = require('scratch-vm/src/sprites/sprite');
const RenderedTarget = require('scratch-vm/src/sprites/rendered-target');
const Renderer = require('../../fixtures/fake-renderer');
let mockHub;
let mockPeer = 0;

jest.mock('../../../src/lib/collaboration/transport', () => {
    const {FakeCollabTransport} = require('../../fixtures/collab-harness');
    return {Transport: class extends FakeCollabTransport {
        constructor () {
            super(mockHub, `peer-${++mockPeer}`);
        }
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
        sprite.costumes = [{name: 'costume',
            asset,
            assetId: asset.assetId,
            bitmapResolution: 1,
            rotationCenterX: 0,
            rotationCenterY: 0,
            dataFormat: asset.dataFormat,
            md5: `${asset.assetId}.${asset.dataFormat}`,
            skinId: 1}];
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
        const rename = clientVM.renameSprite(id, 'Together').then(() => {
            done = true;
        });
        await pumpUntil(() => done);
        await rename;
        expect(hostVM.runtime.getTargetById(id).getName()).toBe('Together');
        expect(clientVM.runtime.getTargetById(id).getName()).toBe('Together');
        expect(host._session.seq).toBe(1);
        done = false;
        const transform = hostVM.postSpriteInfo({x: 73}).then(() => {
            done = true;
        });
        await pumpUntil(() => done && client._session.lastAppliedSeq === 2);
        await transform;
        expect(clientVM.runtime.getTargetById(id).x).toBe(73);
        expect(failures).toEqual([]);
        expect(clientVM.editingCommands.snapshot()).toEqual(hostVM.editingCommands.snapshot());
        const spriteBytes = await clientVM.exportSprite(id, 'arraybuffer');
        done = false;
        const imported = clientVM.addSprite(spriteBytes).then(() => {
            done = true;
        });
        await pumpUntil(() => done && client._session.lastAppliedSeq === 3);
        await imported;
        expect(hostVM.runtime.targets).toHaveLength(3);
        expect(clientVM.editingCommands.snapshot()).toEqual(hostVM.editingCommands.snapshot());
        expect(failures).toEqual([]);
    } finally {
        client.disconnect(); host.disconnect(); hostVM.quit(); clientVM.quit();
    }
});

const joinPair = async () => {
    mockHub = new FakeHub();
    const host = new CollabService();
    const client = new CollabService();
    const hostVM = makeVM();
    const clientVM = makeVM();
    host.init(hostVM); client.init(clientVM);
    await host.connectToRoom('test', 'host', true);
    await client.connectToRoom('test', 'guest');
    await pumpUntil(() => client._session && client._session.lastAppliedSeq !== null);
    return {host, client, hostVM, clientVM};
};

test('a guest who opens another project leaves the session first', async () => {
    const {host, client, hostVM, clientVM} = await joinPair();
    try {
        const project = await hostVM.saveProjectSb3('arraybuffer');
        const left = jest.fn();
        client.on('left-for-other-project', left);
        await clientVM.loadProject(project);
        expect(left).toHaveBeenCalledTimes(1);
        expect(client.isConnected).toBe(false);
        expect(clientVM.editingCommands.handler).toBeNull();
    } finally {
        client.disconnect(); host.disconnect(); hostVM.quit(); clientVM.quit();
    }
});

test('a host who opens another project sends it to everyone', async () => {
    const {host, client, hostVM, clientVM} = await joinPair();
    try {
        const other = makeVM();
        other.runtime.targets[1].sprite.name = 'Replacement';
        const project = await other.saveProjectSb3('arraybuffer');
        other.quit();
        await hostVM.loadProject(project);
        expect(host.isConnected).toBe(true);
        await pumpUntil(() => clientVM.runtime.targets.some(target => target.getName() === 'Replacement') &&
            client._session.lastAppliedSeq !== null);
        expect(clientVM.editingCommands.snapshot()).toEqual(hostVM.editingCommands.snapshot());
    } finally {
        client.disconnect(); host.disconnect(); hostVM.quit(); clientVM.quit();
    }
});

test('ending the session restores the original loadProject', async () => {
    const {host, client, hostVM, clientVM} = await joinPair();
    const wrapped = hostVM.loadProject;
    host.disconnect();
    expect(hostVM.loadProject).not.toBe(wrapped);
    expect(Object.prototype.hasOwnProperty.call(hostVM, 'loadProject')).toBe(false);
    client.disconnect(); hostVM.quit(); clientVM.quit();
});

test('a guest who joins through the invite link watches until the host lets them edit', async () => {
    mockHub = new FakeHub();
    const host = new CollabService();
    const client = new CollabService();
    const hostVM = makeVM();
    const clientVM = makeVM();
    host.init(hostVM); client.init(clientVM);
    try {
        await host.connectToRoom('test', 'host', true, 'private', null, null, {inviteRole: 'watch'});
        const link = new URL(host.getInviteLink());
        expect(link.searchParams.get('room')).toBe('test');
        const invite = link.searchParams.get('invite');
        expect(invite).toBe(host._session.inviteKey);
        await client.connectToRoom('test', 'guest', false, 'private', null, null, {invite});
        await pumpUntil(() => client._session && client._session.lastAppliedSeq !== null);
        expect(client.getMyRole()).toBe('watch');

        const id = clientVM.editingTarget.id;
        await expect(clientVM.renameSprite(id, 'Nope')).rejects.toThrow(/watching/);
        await mockHub.flush();
        expect(hostVM.runtime.getTargetById(id).getName()).toBe('Sprite');

        host.setInviteRole('edit');
        await pumpUntil(() => client.getMyRole() === 'edit');
        let done = false;
        clientVM.renameSprite(id, 'Allowed').then(() => {
            done = true;
        });
        await pumpUntil(() => done);
        expect(hostVM.runtime.getTargetById(id).getName()).toBe('Allowed');
    } finally {
        client.disconnect(); host.disconnect(); hostVM.quit(); clientVM.quit();
    }
});

test('an edit made while reconnecting commits once the guest is back', async () => {
    const {host, client, hostVM, clientVM} = await joinPair();
    try {
        const clientId = client.getCurrentUserId();
        mockHub.enqueueClose(clientId);
        await mockHub.flush();
        const id = clientVM.editingTarget.id;
        let done = false;
        let error = null;
        clientVM.renameSprite(id, 'Made offline').then(() => {
            done = true;
        }, e => {
            error = e;
        });
        await mockHub.flush();
        expect(hostVM.runtime.getTargetById(id).getName()).toBe('Sprite');

        mockHub.links.get(clientId).open = true;
        client._transport.emit('reconnected');
        await pumpUntil(() => done || error);
        expect(error).toBeNull();
        expect(hostVM.runtime.getTargetById(id).getName()).toBe('Made offline');
        expect(clientVM.runtime.getTargetById(id).getName()).toBe('Made offline');
    } finally {
        client.disconnect(); host.disconnect(); hostVM.quit(); clientVM.quit();
    }
});

test('a sprite import whose upload is cut off is sent again once the guest is back', async () => {
    const {host, client, hostVM, clientVM} = await joinPair();
    try {
        const bytes = await clientVM.exportSprite(clientVM.editingTarget.id, 'arraybuffer');
        const clientId = client.getCurrentUserId();
        // The link dies before anyone notices.
        mockHub.links.get(clientId).open = false;
        let done = false;
        let error = null;
        clientVM.addSprite(bytes).then(() => {
            done = true;
        }, e => {
            error = e;
        });
        for (let i = 0; i < 10; i++) await new Promise(resolve => setTimeout(resolve, 2));
        expect(error).toBeNull();
        expect(hostVM.runtime.targets).toHaveLength(2);

        mockHub.links.get(clientId).open = true;
        client._transport.emit('reconnected');
        await pumpUntil(() => done || error);
        expect(error).toBeNull();
        expect(hostVM.runtime.targets).toHaveLength(3);
        await pumpUntil(() => clientVM.runtime.targets.length === 3);
        expect(clientVM.editingCommands.snapshot()).toEqual(hostVM.editingCommands.snapshot());
    } finally {
        client.disconnect(); host.disconnect(); hostVM.quit(); clientVM.quit();
    }
});

test('an abandoned connection attempt rejects as cancelled', async () => {
    mockHub = new FakeHub();
    const host = new CollabService();
    const hostVM = makeVM();
    host.init(hostVM);
    const attempt = host.connectToRoom('test', 'host', true);
    host.disconnect();
    await expect(attempt).rejects.toMatchObject({cancelled: true});
    hostVM.quit();
});
