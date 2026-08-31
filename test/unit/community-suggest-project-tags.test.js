jest.mock('../../src/lib/git/mwp.js', () => ({
    normalizeLegacySb3Snapshot: jest.fn()
}));

import {normalizeLegacySb3Snapshot} from '../../src/lib/git/mwp.js';
import {
    isFractchSource,
    loadLatestFractchSource,
    minifyFractch
} from '../../src/community/suggest-project-tags.js';

const encode = value => btoa(unescape(encodeURIComponent(value)));

describe('project tag suggestion source', () => {
    test('loads every Fractch file and commit name from the latest commit without assets', async () => {
        const files = [
            {path: 'Stage.fractch', binary: false},
            {path: 'Player/Player.fractch', binary: false},
            {path: 'Player/assets/costume.svg', binary: true},
            {path: 'assets/example.fractch', binary: false},
            {path: 'README.md', binary: false}
        ];
        const api = {
            commits: jest.fn().mockResolvedValue({
                commits: [{sha: 'abc123', message: 'Add player movement\nMore detail'}]
            }),
            commitTree: jest.fn().mockResolvedValue({files}),
            commitFile: jest.fn((id, sha, path) => Promise.resolve({
                content: encode(`// source for ${path}\nwhen flag clicked {\n  move 10;\n}`)
            }))
        };

        const result = await loadLatestFractchSource(api, {id: 'project-1', gitHead: 'abc123'});

        expect(api.commitTree).toHaveBeenCalledWith('project-1', 'abc123');
        expect(api.commitFile.mock.calls.map(call => call[2])).toEqual(['Player/Player.fractch', 'Stage.fractch']);
        expect(result.source).toContain('// File: Player/Player.fractch\nwhen flag clicked { move 10; }');
        expect(result.source).toContain('// File: Stage.fractch\nwhen flag clicked { move 10; }');
        expect(result.source).not.toContain('// source for');
        expect(result.source).not.toContain('assets/example.fractch');
        expect(result.commitName).toBe('Add player movement');
        expect(result.commitSha).toBe('abc123');
    });

    test('requires a committed Fractch tree', async () => {
        await expect(loadLatestFractchSource({}, {id: 'project-1'}))
            .rejects.toThrow('Save a commit before suggesting tags.');
    });

    test('converts a legacy SB3 commit to minified Fractch without assets', async () => {
        normalizeLegacySb3Snapshot.mockResolvedValue([
            {
                path: 'Stage/main.fractch',
                data: new TextEncoder().encode('when flag clicked {\n  // setup\n  say "hello  world";\n}')
            },
            {path: 'Stage/assets/costume.svg', data: new Uint8Array([1, 2, 3])}
        ]);
        const api = {
            commits: jest.fn().mockResolvedValue({commits: [{sha: 'legacy', message: 'Old save'}]}),
            commitTree: jest.fn().mockResolvedValue({files: [{path: 'project.sb3', binary: true}]}),
            commitFile: jest.fn().mockResolvedValue({content: encode('fake sb3')})
        };

        const result = await loadLatestFractchSource(api, {id: 'project-1', gitHead: 'legacy'});

        expect(normalizeLegacySb3Snapshot).toHaveBeenCalledWith(expect.any(Uint8Array));
        expect(result.source).toBe('// File: Stage/main.fractch\nwhen flag clicked { say "hello  world"; }');
        expect(result.source).not.toContain('costume.svg');
    });

    test('recognises source files without treating assets as code', () => {
        expect(isFractchSource({path: 'Sprite/Sprite.fractch', binary: false})).toBe(true);
        expect(isFractchSource({path: 'Sprite/assets/demo.fractch', binary: false})).toBe(false);
        expect(isFractchSource({path: 'Sprite/Sprite.fractch', binary: true})).toBe(false);
    });

    test('minifies whitespace and comments without changing strings', () => {
        expect(minifyFractch('say "https://example.com/a  b"; /* note */\nmove 10; // later'))
            .toBe('say "https://example.com/a  b"; move 10;');
    });
});
