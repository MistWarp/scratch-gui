jest.mock('@isomorphic-git/lightning-fs', () => class MemorylessFs {
    constructor () {
        this.promises = {};
    }
});

const {
    collectReachableObjectOids,
    git
} = require('../../src/lib/git/browser-git.js');

describe('incremental project history uploads', () => {
    afterEach(() => jest.restoreAllMocks());

    test('collects only objects created after the server head', async () => {
        const baseCommit = 'a'.repeat(40);
        const baseTree = 'b'.repeat(40);
        const baseBlob = 'c'.repeat(40);
        const headCommit = 'd'.repeat(40);
        const headTree = 'e'.repeat(40);
        const headBlob = 'f'.repeat(40);

        jest.spyOn(git, 'readCommit').mockImplementation(({oid}) => Promise.resolve({
            commit: oid === headCommit ? {tree: headTree, parent: [baseCommit]} : {tree: baseTree, parent: []}
        }));
        jest.spyOn(git, 'readTree').mockImplementation(({oid}) => Promise.resolve({
            tree: [{type: 'blob', oid: oid === headTree ? headBlob : baseBlob}]
        }));

        const known = await collectReachableObjectOids(baseCommit);
        const pushed = await collectReachableObjectOids(headCommit, known);

        expect([...known].sort()).toEqual([baseCommit, baseTree, baseBlob].sort());
        expect([...pushed].sort()).toEqual([headCommit, headTree, headBlob].sort());
    });

    test('does not reuse a traversal that stopped at a known object as a full traversal', async () => {
        const baseCommit = '1'.repeat(40);
        const baseTree = '2'.repeat(40);
        const baseBlob = '3'.repeat(40);
        const headCommit = '4'.repeat(40);
        const headTree = '5'.repeat(40);
        const headBlob = '6'.repeat(40);

        jest.spyOn(git, 'readCommit').mockImplementation(({oid}) => Promise.resolve({
            commit: oid === headCommit ? {tree: headTree, parent: [baseCommit]} : {tree: baseTree, parent: []}
        }));
        jest.spyOn(git, 'readTree').mockImplementation(({oid}) => Promise.resolve({
            tree: [{type: 'blob', oid: oid === headTree ? headBlob : baseBlob}]
        }));

        const partial = await collectReachableObjectOids(headCommit, new Set([baseCommit]));
        const complete = await collectReachableObjectOids(headCommit);

        expect([...partial].sort()).toEqual([headCommit, headTree, headBlob].sort());
        expect([...complete].sort()).toEqual([
            headCommit, headTree, headBlob, baseCommit, baseTree, baseBlob
        ].sort());
    });
});
