import VM from 'scratch-vm';
import {projectJson} from '../../helpers/code-mode-fixture.js';
import {
    getLoadedProjectMeta,
    installProjectMetadata,
    setProjectAuthor
} from '../../../src/modules/project-metadata';

const makeVm = () => {
    const vm = new VM();
    vm.runtime.storage = null;
    installProjectMetadata(vm);
    return vm;
};

const withMeta = meta => ({...projectJson(), meta});

describe('project metadata on a real VM', () => {
    let vm;

    beforeEach(() => {
        setProjectAuthor(null);
        vm = makeVm();
    });

    afterEach(() => vm.quit());

    test('leaves loadProject and deserializeProject alone and keeps the load cancellation check', async () => {
        expect(Object.prototype.hasOwnProperty.call(vm, 'deserializeProject')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(vm, 'toJSON')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(vm, 'loadProject')).toBe(false);

        await expect(vm.loadProject(withMeta({semver: '3.0.0', created: 'never'}), {
            editSessionActive: () => false
        })).rejects.toThrow('Project load cancelled');
        expect(vm.runtime.targets).toHaveLength(0);
    });

    test('keeps Scratch metadata and carries MistWarp metadata across saves', async () => {
        setProjectAuthor({username: 'mist', id: '1'});
        await vm.loadProject(withMeta({semver: '3.0.0', vm: '14.2.0', agent: 'Scratch'}));

        const firstSave = JSON.parse(vm.toJSON());
        expect(firstSave.meta).toEqual(expect.objectContaining({
            semver: '3.0.0',
            agent: navigator.userAgent,
            author: {username: 'mist', id: '1'}
        }));
        expect(firstSave.meta.created).toEqual(expect.any(String));
        expect(firstSave.meta.edited).toEqual(expect.any(String));
        expect({...getLoadedProjectMeta(vm)}).toEqual(firstSave.meta);

        await vm.loadProject(firstSave);
        expect(JSON.parse(vm.toJSON()).meta.created).toBe(firstSave.meta.created);

        setProjectAuthor(null);
        expect(JSON.parse(vm.toJSON()).meta.author).toEqual(firstSave.meta.author);
    });

    test('meta keys MistWarp does not know survive a save, and leave with their project', async () => {
        await vm.loadProject(withMeta({
            semver: '3.0.0',
            agent: 'Other editor',
            created: '2026-01-01T00:00:00.000Z',
            createdAt: 'retired',
            savedAt: 'retired',
            platform: {name: 'PenguinMod', url: 'https://penguinmod.com/'},
            otherEditor: {theme: 'dark', revision: 7},
            flag: false
        }));
        expect(getLoadedProjectMeta(vm).platform.name).toBe('PenguinMod');

        const meta = JSON.parse(vm.toJSON()).meta;
        expect(meta.otherEditor).toEqual({theme: 'dark', revision: 7});
        expect(meta.flag).toBe(false);
        expect(meta.created).toBe('2026-01-01T00:00:00.000Z');
        expect(meta.agent).toBe(navigator.userAgent);
        expect(meta).not.toHaveProperty('createdAt');
        expect(meta).not.toHaveProperty('savedAt');
        expect(meta.platform.name).not.toBe('PenguinMod');

        await vm.loadProject(JSON.stringify({...projectJson(), meta}));
        expect(JSON.parse(vm.toJSON()).meta.otherEditor).toEqual({theme: 'dark', revision: 7});

        await vm.loadProject(withMeta({semver: '3.0.0'}));
        const next = JSON.parse(vm.toJSON()).meta;
        expect(next).not.toHaveProperty('otherEditor');
        expect(next).not.toHaveProperty('flag');
        expect(next.created).not.toBe('2026-01-01T00:00:00.000Z');
    });

    test('projects saved by the metadata draft keep their birthday', async () => {
        await vm.loadProject(withMeta({semver: '3.0.0', createdAt: '2025-05-05T00:00:00.000Z'}));
        expect(JSON.parse(vm.toJSON()).meta.created).toBe('2025-05-05T00:00:00.000Z');
    });

    test('sprite exports carry no project metadata', async () => {
        await vm.loadProject(withMeta({semver: '3.0.0', otherEditor: 1}));
        const sprite = vm.runtime.targets.find(target => !target.isStage);
        expect(JSON.parse(vm.toJSON(sprite.id)).meta).toBeUndefined();
    });

    test('installing twice registers nothing twice', () => {
        expect(() => installProjectMetadata(vm)).not.toThrow();
    });
});
