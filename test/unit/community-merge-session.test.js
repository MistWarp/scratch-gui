jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {
        commitTree: jest.fn(),
        commitFile: jest.fn()
    }
}));

import api from '../../src/community/api';
import {
    mapLimited,
    materializeMerge,
    resolvedMergeFiles,
    unresolvedBinaryConflict,
    unresolvedTextConflict,
    withBinaryChoice,
    withTextResolution
} from '../../src/community/merge-session.js';

const encode = value => Buffer.from(value).toString('base64');
const text = bytes => new TextDecoder().decode(bytes);
const diff3Conflict = 'one\n<<<<<<<<< this remix\nmove 5\n=========\nmove 20\n>>>>>>>>> original\nthree';

describe('merge sessions', () => {
    test('materializing applies clean changes and collects conflicts on the target tree', async () => {
        api.commitTree.mockResolvedValue({files: [{path: 'Cat/main.fractch'}, {path: 'old.txt'}, {path: 'Cat/a.svg'}]});
        api.commitFile.mockImplementation((projectId, sha, path) => Promise.resolve({content: encode(`${projectId}:${sha}:${path}`)}));
        const prepared = await materializeMerge({
            targetProjectId: 'remix',
            targetHead: 'head',
            merge: {changes: [
                {path: 'new.txt', content: encode('new')},
                {path: 'old.txt', deleted: true},
                {path: 'Cat/main.fractch', conflict: true, content: encode(diff3Conflict)},
                {path: 'Cat/a.svg', conflict: true, binary: true, ours: encode('ours'), theirs: encode('theirs')}
            ]}
        });

        expect(api.commitTree).toHaveBeenCalledWith('remix', 'head');
        expect(text(prepared.files.get('new.txt'))).toBe('new');
        expect(prepared.files.has('old.txt')).toBe(false);
        expect(text(prepared.files.get('Cat/a.svg'))).toBe('remix:head:Cat/a.svg');
        expect(prepared.conflicts).toEqual([{path: 'Cat/main.fractch', content: diff3Conflict}]);
        expect(unresolvedTextConflict(prepared)?.path).toBe('Cat/main.fractch');
        expect(prepared.binaryConflicts.map(file => [file.path, file.choice])).toEqual([['Cat/a.svg', '']]);
    });

    test('resolving uses edited text and the chosen side of each binary conflict', () => {
        let session = {
            files: new Map([['keep.txt', new Uint8Array([1])]]),
            conflicts: [{path: 'code.fractch', content: diff3Conflict}],
            binaryConflicts: [
                {path: 'a.svg', choice: '', ours: encode('ours'), theirs: encode('theirs')},
                {path: 'b.svg', choice: '', ours: encode('ours'), theirsDeleted: true}
            ]
        };
        expect(unresolvedTextConflict(session)?.path).toBe('code.fractch');
        expect(unresolvedTextConflict(withTextResolution(session, 'code.fractch', 'one\nmove 5\n>>>>>>>>> original'))?.path).toBe('code.fractch');
        expect(unresolvedTextConflict(withTextResolution(session, 'code.fractch', 'Heading\n=========\nresolved'))).toBeNull();
        expect(unresolvedBinaryConflict(session).path).toBe('a.svg');
        session = withTextResolution(session, 'code.fractch', 'resolved');
        expect(unresolvedTextConflict(session)).toBeNull();
        session = withBinaryChoice(session, 'a.svg', 'source');
        expect(unresolvedBinaryConflict(session).path).toBe('b.svg');
        session = withBinaryChoice(session, 'b.svg', 'source');
        expect(unresolvedBinaryConflict(session)).toBeNull();

        const files = resolvedMergeFiles(session);
        expect(text(files.get('code.fractch'))).toBe('resolved');
        expect(text(files.get('a.svg'))).toBe('theirs');
        expect(files.has('b.svg')).toBe(false);
        expect(files.get('keep.txt')).toEqual(new Uint8Array([1]));

        const kept = resolvedMergeFiles(withBinaryChoice(session, 'b.svg', 'target'));
        expect(text(kept.get('b.svg'))).toBe('ours');
    });

    test('file fetches run a few at a time and keep their order', async () => {
        let running = 0;
        let peak = 0;
        const results = await mapLimited([1, 2, 3, 4, 5, 6, 7], 3, async value => {
            running++;
            peak = Math.max(peak, running);
            await new Promise(resolve => setTimeout(resolve, 5 * (8 - value)));
            running--;
            return value * 2;
        });
        expect(results).toEqual([2, 4, 6, 8, 10, 12, 14]);
        expect(peak).toBe(3);
        expect(await mapLimited([], 3, async value => value)).toEqual([]);
    });
});
