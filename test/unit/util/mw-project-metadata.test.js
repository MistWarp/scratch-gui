import {
    getLoadedProjectMeta,
    installProjectMetadata,
    setProjectAuthor
} from '../../../src/lib/mw-project-metadata';

describe('project metadata', () => {
    test('keeps Scratch metadata and carries MistWarp metadata across saves', async () => {
        let source = {
            meta: {
                semver: '3.0.0',
                vm: '14.2.0',
                agent: 'Scratch'
            }
        };
        const vm = {
            toJSON: () => JSON.stringify(source),
            deserializeProject: project => Promise.resolve(project)
        };

        installProjectMetadata(vm);
        setProjectAuthor({username: 'mist', id: '1'});
        await vm.deserializeProject(source);

        const firstSave = JSON.parse(vm.toJSON());
        expect(firstSave.meta).toEqual(expect.objectContaining({
            semver: '3.0.0',
            vm: '14.2.0',
            agent: navigator.userAgent,
            author: {username: 'mist', id: '1'}
        }));
        expect(firstSave.meta.created).toEqual(expect.any(String));
        expect(firstSave.meta.edited).toEqual(expect.any(String));
        expect(getLoadedProjectMeta()).toEqual(firstSave.meta);

        source = firstSave;
        await vm.deserializeProject(source);
        expect(JSON.parse(vm.toJSON()).meta.created).toBe(firstSave.meta.created);

        setProjectAuthor(null);
        expect(JSON.parse(vm.toJSON()).meta.author).toEqual(firstSave.meta.author);
    });
});
