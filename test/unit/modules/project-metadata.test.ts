import {beforeEach, describe, expect, test} from '@jest/globals';
import {
    getLoadedProjectMeta,
    installProjectMetadata,
    setProjectAuthor,
    type ProjectMeta,
    type ProjectMetadataHandler
} from '../../../src/modules/project-metadata';

const RESERVED = ['semver', 'vm', 'origin', 'platform'];

const fakeVm = () => {
    const handlers = new Map<string, ProjectMetadataHandler>();
    return {
        handlers,
        registerProjectMetadata: (key: string, handler: ProjectMetadataHandler) => {
            if (key === '' || RESERVED.includes(key)) throw new TypeError(key);
            if (handlers.has(key)) throw new Error(`${key} is already registered`);
            handlers.set(key, handler);
            return () => handlers.delete(key);
        },
        load: (meta: ProjectMeta) => {
            const loaded = {...meta};
            for (const [key, handler] of handlers) {
                handler.deserialize?.(Object.prototype.hasOwnProperty.call(loaded, key) ? loaded[key] : undefined,
                    loaded);
            }
        },
        save: (): ProjectMeta => {
            const meta: ProjectMeta = {semver: '3.0.0', vm: '0.2.0', agent: '', platform: {name: 'MistWarp'}};
            for (const [key, handler] of handlers) {
                const value = handler.serialize?.(meta[key], meta);
                if (typeof value !== 'undefined') meta[key] = value;
            }
            return meta;
        }
    };
};

describe('project metadata', () => {
    beforeEach(() => {
        setProjectAuthor(null);
    });

    test('carries loaded keys the VM did not write without registering a handler for each', () => {
        const vm = fakeVm();
        installProjectMetadata(vm);
        expect(Array.from(vm.handlers.keys())).toEqual(['created', 'edited', 'agent', 'author']);

        const first: ProjectMeta = {semver: '1.0.0', platform: {name: 'Old'}, extra: 1, createdAt: 'old', savedAt: 'old'};
        first[''] = 1;
        vm.load(first);
        vm.load({extra: 2, other: 3, vm: 'stale'});
        expect(Array.from(vm.handlers.keys())).toEqual(['created', 'edited', 'agent', 'author']);
        expect(() => vm.registerProjectMetadata('other', {serialize: () => 'owned'})).not.toThrow();

        const meta = vm.save();
        expect(meta).toMatchObject({extra: 2, other: 'owned', vm: '0.2.0', semver: '3.0.0'});

        vm.load({});
        const next = vm.save();
        expect(next).not.toHaveProperty('extra');
        expect(next.other).toBe('owned');
    });

    test('retired and VM keys from the loaded project are not carried', () => {
        const vm = fakeVm();
        installProjectMetadata(vm);
        const loaded: ProjectMeta = {semver: '1.0.0', platform: {name: 'Old'}, createdAt: 'old', savedAt: 'old'};
        loaded[''] = 1;
        vm.load(loaded);
        const meta = vm.save();
        expect(meta.semver).toBe('3.0.0');
        expect(meta.platform).toEqual({name: 'MistWarp'});
        expect(meta.created).toBe('old');
        expect(meta).not.toHaveProperty('createdAt');
        expect(meta).not.toHaveProperty('savedAt');
        expect(meta['']).toBe(1);
    });

    test('a project without meta reads as never saved until it is saved', () => {
        const vm = fakeVm();
        installProjectMetadata(vm);
        vm.load({});
        expect(getLoadedProjectMeta(vm)).toBeNull();
        const meta = vm.save();
        expect(getLoadedProjectMeta(vm)).toBe(meta);
    });

    test('each VM keeps its own project metadata', () => {
        const first = fakeVm();
        const second = fakeVm();
        installProjectMetadata(first);
        installProjectMetadata(second);
        expect(getLoadedProjectMeta(fakeVm())).toBeNull();
        first.load({created: 'first', extra: 'one'});
        second.load({created: 'second'});
        expect(first.save()).toMatchObject({created: 'first', extra: 'one'});
        const other = second.save();
        expect(other.created).toBe('second');
        expect(other).not.toHaveProperty('extra');
        expect(getLoadedProjectMeta(first)?.created).toBe('first');
    });

    test('the author is the signed-in account, or the one already on the project', () => {
        const vm = fakeVm();
        installProjectMetadata(vm);
        vm.load({author: {username: 'first', id: 'a'}});
        expect(vm.save().author).toEqual({username: 'first', id: 'a'});

        setProjectAuthor({username: 'second', id: ''});
        expect(vm.save().author).toEqual({username: 'second', id: null});

        setProjectAuthor({username: ''});
        expect(vm.save().author).toEqual({username: 'second', id: null});
    });
});
