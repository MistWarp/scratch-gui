import JSZip from '@turbowarp/jszip';

const BASE = '1111111111111111111111111111111111111111';
const HEAD = '2222222222222222222222222222222222222222';
const NEW_OBJECT = '3333333333333333333333333333333333333333';
const DETACHED = '4444444444444444444444444444444444444444';

const mockRepoExists = jest.fn();
const mockInitRepo = jest.fn();
const mockCollectReachableObjectOids = jest.fn();
const mockExportRepoToZip = jest.fn();

const mockGit = {
    currentBranch: jest.fn(() => Promise.resolve('main')),
    listBranches: jest.fn(() => Promise.resolve(['main'])),
    log: jest.fn(() => Promise.resolve([{
        oid: HEAD,
        commit: {message: 'Change remix', author: {name: 'Mist', timestamp: 100}}
    }])),
    readCommit: jest.fn(({oid}) => {
        if (oid === BASE) throw new Error('shallow base must not be read');
        return Promise.resolve({
            oid,
            commit: {
                message: 'Change remix',
                author: {name: 'Mist', timestamp: 100},
                parent: [BASE]
            }
        });
    }),
    resolveRef: jest.fn(() => Promise.resolve(HEAD))
};

jest.mock('../../../src/lib/git/browser-git.js', () => ({
    abortEditorMerge: jest.fn(),
    commitProject: jest.fn(),
    collectReachableObjectOids: (...args) => mockCollectReachableObjectOids(...args),
    completeEditorMerge: jest.fn(),
    computeCommitGraph: jest.fn(() => Promise.resolve({
        branches: ['main'],
        branchLogs: [{branch: 'main', commits: []}],
        nodes: []
    })),
    deleteRepo: jest.fn(),
    ensureParentDir: jest.fn(),
    exportRepoToZip: (...args) => mockExportRepoToZip(...args),
    getDefaultAuthor: jest.fn(() => ({name: 'Local', email: 'local@example.com'})),
    getFs: jest.fn(() => ({promises: {}})),
    git: mockGit,
    initRepo: (...args) => mockInitRepo(...args),
    readWorktreeFile: jest.fn(),
    repoExists: (...args) => mockRepoExists(...args),
    resolveEditorMergeBinary: jest.fn(),
    startEditorMerge: jest.fn(),
    writeWorktreeFile: jest.fn(),
    REPO_DIR: '/repo'
}));

jest.mock('../../../src/lib/git/fractch-tree.js', () => ({
    buildSb3FromFractchTree: jest.fn(),
    writeProjectToFractchTree: jest.fn()
}));

jest.mock('../../../src/lib/rotur/identity.js', () => ({
    getMistWarpAuthor: jest.fn(() => Promise.resolve({name: 'Mist', email: 'mist@mistwarp.local'}))
}));

jest.mock('../../../src/lib/git/git-diff.js', () => ({
    computeLineDiff: jest.fn(),
    getChangedFilesBetweenCommits: jest.fn(),
    getFileContentAtCommit: jest.fn(),
    listFilesInTree: jest.fn()
}));

const {createMwp} = require('../../../src/lib/git/mwp.js');

describe('first remix delta export', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        mockGit.readCommit.mockImplementation(({oid}) => {
            if (oid === BASE) throw new Error('shallow base must not be read');
            return Promise.resolve({
                oid,
                commit: {
                    message: 'Change remix',
                    author: {name: 'Mist', timestamp: 100},
                    parent: [BASE]
                }
            });
        });
        mockRepoExists.mockResolvedValue(false);
        mockInitRepo.mockResolvedValue({});
        mockCollectReachableObjectOids.mockResolvedValue(new Set([NEW_OBJECT]));
        const zip = new JSZip();
        zip.file(`.git/objects/${NEW_OBJECT.slice(0, 2)}/${NEW_OBJECT.slice(2)}`, new Uint8Array([1]));
        mockExportRepoToZip.mockResolvedValue(await zip.generateAsync({type: 'uint8array'}));
    });

    test('creates a shallow commit on the known base and exports only divergent objects', async () => {
        const result = await createMwp({
            sb3Files: {'project.json': new Uint8Array([1])},
            projectId: 'fork-1',
            remixParent: 'original',
            baseCommit: BASE,
            remoteHead: BASE,
            message: 'Change remix',
            baseHistory: {
                commits: [{sha: BASE, message: 'Base', author: 'Original', date: 50}],
                graph: {
                    branches: ['main'],
                    branchLogs: [{branch: 'main', oids: [BASE]}],
                    nodes: [{sha: BASE, message: 'Base', author: 'Original', date: 50, parents: []}]
                }
            }
        });

        expect(mockInitRepo).toHaveBeenCalledWith(expect.objectContaining({
            initialParent: BASE,
            initialMessage: 'Change remix'
        }));
        expect(mockCollectReachableObjectOids).toHaveBeenCalledTimes(1);
        expect(mockGit.readCommit).toHaveBeenCalledTimes(1);
        expect(mockGit.readCommit).toHaveBeenCalledWith(expect.objectContaining({oid: HEAD}));
        expect(mockCollectReachableObjectOids).toHaveBeenCalledWith(
            HEAD,
            expect.objectContaining({has: expect.any(Function)})
        );
        const known = mockCollectReachableObjectOids.mock.calls[0][1];
        expect(known.has(BASE)).toBe(true);
        expect(mockExportRepoToZip).toHaveBeenCalledWith(expect.objectContaining({
            includeObjectOids: new Set([NEW_OBJECT]),
            includeWorktree: false
        }));
        expect(result.manifest).toEqual(expect.objectContaining({
            delta: true,
            baseHead: BASE,
            baseCommit: BASE,
            head: HEAD,
            remixParent: 'original'
        }));
        expect(result.manifest.commits.map(commit => commit.sha)).toEqual([HEAD, BASE]);
    });

    test('exports a bridge commit with both detached and inherited parents treated as known', async () => {
        mockGit.readCommit.mockImplementation(({oid}) => {
            if (oid === DETACHED || oid === BASE) throw new Error('known parent must not be read');
            return Promise.resolve({
                oid,
                commit: {
                    message: 'Reconnect remix',
                    author: {name: 'Mist', timestamp: 100},
                    parent: [DETACHED, BASE]
                }
            });
        });

        const result = await createMwp({
            sb3Files: {'project.json': new Uint8Array([1])},
            projectId: 'fork-1',
            remixParent: 'original',
            baseCommit: BASE,
            remoteHead: DETACHED,
            additionalParents: [BASE],
            message: 'Reconnect remix',
            baseHistory: {
                commits: [{sha: DETACHED}, {sha: BASE}],
                graph: {
                    branches: ['main'],
                    branchLogs: [{branch: 'main', oids: [DETACHED, BASE]}],
                    nodes: [
                        {sha: DETACHED, parents: []},
                        {sha: BASE, parents: []}
                    ]
                }
            }
        });

        expect(mockInitRepo).toHaveBeenCalledWith(expect.objectContaining({
            initialParent: DETACHED,
            initialParents: [DETACHED, BASE]
        }));
        const known = mockCollectReachableObjectOids.mock.calls[0][1];
        expect(known.has(DETACHED)).toBe(true);
        expect(known.has(BASE)).toBe(true);
        expect(result.manifest.graph.nodes[0].parents).toEqual([DETACHED, BASE]);
    });

    test('keeps a new non-remix project parentless', async () => {
        await createMwp({
            sb3Files: {'project.json': new Uint8Array([1])},
            projectId: 'new-project',
            message: 'Initial version'
        });

        expect(mockInitRepo).toHaveBeenCalledWith(expect.objectContaining({initialParent: ''}));
        expect(mockCollectReachableObjectOids).not.toHaveBeenCalled();
    });
});
