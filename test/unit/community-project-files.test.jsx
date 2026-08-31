import {
    buildProjectFileTree,
    canCacheProjectSnapshot,
    canLoadProjectSnapshot,
    highlightFractch,
    initiallyOpenFolders,
    projectSnapshotCacheKey
} from '../../src/community/components/ProjectFiles.jsx';

describe('ProjectFiles', () => {
    test('keys historical snapshots by commit without changing the workspace URL', () => {
        const project = {workspaceUrl: 'https://example.com/workspace.mwp', gitHead: 'abc123'};

        expect(projectSnapshotCacheKey(project)).toBe(
            'https://example.com/workspace.mwp:abc123:https://example.com/workspace.mwp'
        );
        expect(project.workspaceUrl).toBe('https://example.com/workspace.mwp');
    });

    test('loads server-side commit trees without requiring a workspace archive', () => {
        expect(canLoadProjectSnapshot({id: 'project-1', gitHead: 'abc123'})).toBe(true);
        expect(canLoadProjectSnapshot({workspaceUrl: 'https://example.com/workspace.mwp'})).toBe(false);
        expect(canLoadProjectSnapshot({id: 'project-1'})).toBe(false);
    });

    test('only retains file data from free public projects', () => {
        expect(canCacheProjectSnapshot({shared: true, visibility: 'public', price: 0})).toBe(true);
        expect(canCacheProjectSnapshot({shared: true, visibility: 'unlisted', price: 0})).toBe(false);
        expect(canCacheProjectSnapshot({shared: true, visibility: 'public', price: 5})).toBe(false);
        expect(canCacheProjectSnapshot({shared: false, visibility: 'private', price: 0})).toBe(false);
    });

    test('starts sprite source folders open and asset folders closed', () => {
        const tree = buildProjectFileTree([
            {path: 'Cat/main.fractch'},
            {path: 'Cat/assets/costume.svg'},
            {path: 'Stage/main.fractch'},
            {path: 'Stage/assets/backdrop.svg'}
        ]);

        expect(initiallyOpenFolders(tree)).toEqual(['Cat', 'Stage']);
    });

    test('highlights Fractch keywords, strings, numbers, and comments', () => {
        const lines = highlightFractch('sprite "Cat" at 12; // hello\nforever { wait 1; }');
        const kinds = lines.flat().filter(token => token.kind).map(token => [token.value, token.kind]);

        expect(kinds).toEqual(expect.arrayContaining([
            ['sprite', 'keyword'],
            ['"Cat"', 'string'],
            ['12', 'number'],
            ['// hello', 'comment'],
            ['forever', 'keyword'],
            ['wait', 'keyword']
        ]));
    });
});
