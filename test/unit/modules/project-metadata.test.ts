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

    test('registers its own keys and one handler per carried key, whatever the load order', () => {
        const vm = fakeVm();
        installProjectMetadata(vm);
        expect(Array.from(vm.handlers.keys())).toEqual(['created', 'edited', 'agent', 'author']);

        const first: ProjectMeta = {semver: '3.0.0', platform: {}, origin: 'x', extra: 1, createdAt: 'old'};
        first[''] = 1;
        vm.load(first);
        vm.load({extra: 2, other: 3});
        expect(Array.from(vm.handlers.keys())).toEqual(['created', 'edited', 'agent', 'author', 'extra', 'other']);
        expect(vm.save()).toMatchObject({extra: 2, other: 3});

        vm.load({});
        const meta = vm.save();
        expect(meta).not.toHaveProperty('extra');
        expect(meta).not.toHaveProperty('other');
    });

    test('a project without meta reads as never saved until it is saved', () => {
        const vm = fakeVm();
        installProjectMetadata(vm);
        vm.load({});
        expect(getLoadedProjectMeta()).toBeNull();
        const meta = vm.save();
        expect(getLoadedProjectMeta()).toBe(meta);
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
