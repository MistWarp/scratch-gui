import {
    buildCommitDiffFromInspection,
    compareCommitTrees,
    loadCommitFileTexts,
    loadCommitInspection
} from '../../src/community/commit-diff.js';
import {parseDiff} from '../../src/community/components/DiffView.jsx';

const encode = value => btoa(unescape(encodeURIComponent(value)));
const toBytes = value => Uint8Array.from(unescape(encodeURIComponent(value)), char => char.charCodeAt(0));

describe('server commit diff', () => {
    test('uses text content embedded by the server without file requests', async () => {
        const apiClient = {commitFile: jest.fn()};
        const diff = await buildCommitDiffFromInspection({
            apiClient,
            projectId: 'project-1',
            sha: 'b'.repeat(40),
            inspection: {
                parent: 'a'.repeat(40),
                files: [{
                    path: 'Sprite/main.fractch',
                    status: 'modified',
                    oldData: encode('say "old";\n'),
                    newData: encode('say "new";\n')
                }]
            }
        });

        expect(diff).toContain('-say "old";');
        expect(diff).toContain('+say "new";');
        expect(apiClient.commitFile).not.toHaveBeenCalled();
    });

    test('does not refetch empty text embedded by the server', async () => {
        const apiClient = {commitFile: jest.fn()};
        await buildCommitDiffFromInspection({
            apiClient,
            projectId: 'project-1',
            sha: 'b'.repeat(40),
            inspection: {
                parent: 'a'.repeat(40),
                files: [{path: 'empty.txt', status: 'added', newData: ''}]
            }
        });

        expect(apiClient.commitFile).not.toHaveBeenCalled();
    });

    test('renders every root file as added and does not fetch binary assets', async () => {
        const apiClient = {
            commitFile: jest.fn().mockResolvedValue({content: encode('say "hello";')})
        };
        const diff = await buildCommitDiffFromInspection({
            apiClient,
            projectId: 'project-1',
            sha: 'a'.repeat(40),
            inspection: {
                parent: '',
                files: [
                    {path: 'Sprite/main.fractch', status: 'added'},
                    {path: 'Sprite/assets/costume.svg', status: 'added'}
                ]
            }
        });
        const files = parseDiff(diff);

        expect(files).toEqual([
            expect.objectContaining({path: 'Sprite/main.fractch', status: 'Added', additions: 1}),
            expect.objectContaining({path: 'Sprite/assets/costume.svg', status: 'Added', binary: true})
        ]);
        expect(apiClient.commitFile).toHaveBeenCalledTimes(1);
        expect(apiClient.commitFile).toHaveBeenCalledWith('project-1', 'a'.repeat(40), 'Sprite/main.fractch');
    });

    test('fetches both sides of modified text and only the parent side of deleted text', async () => {
        const parent = 'b'.repeat(40);
        const head = 'c'.repeat(40);
        const apiClient = {
            commitFile: jest.fn((project, commit, path) => Promise.resolve({
                content: encode(commit === parent ? `${path} old` : `${path} new`)
            }))
        };
        const diff = await buildCommitDiffFromInspection({
            apiClient,
            projectId: 'project-1',
            sha: head,
            inspection: {
                parent,
                files: [
                    {path: 'main.fractch', status: 'modified'},
                    {path: 'removed.txt', status: 'removed'}
                ]
            }
        });
        const files = parseDiff(diff);

        expect(files[0]).toEqual(expect.objectContaining({status: 'Modified', additions: 1, deletions: 1}));
        expect(files[1]).toEqual(expect.objectContaining({status: 'Deleted', additions: 0, deletions: 1}));
        expect(apiClient.commitFile).toHaveBeenCalledTimes(3);
        expect(apiClient.commitFile).not.toHaveBeenCalledWith('project-1', head, 'removed.txt');
    });

    test('compares file trees by object id', () => {
        expect(compareCommitTrees(
            {files: [
                {path: 'same.txt', oid: 'same', size: 4},
                {path: 'changed.txt', oid: 'old', size: 3},
                {path: 'removed.txt', oid: 'gone', size: 8}
            ]},
            {files: [
                {path: 'same.txt', oid: 'same', size: 4},
                {path: 'changed.txt', oid: 'new', size: 5},
                {path: 'added.txt', oid: 'added', size: 6}
            ]}
        )).toEqual([
            expect.objectContaining({path: 'added.txt', status: 'added'}),
            expect.objectContaining({path: 'changed.txt', status: 'modified'}),
            expect.objectContaining({path: 'removed.txt', status: 'removed'})
        ]);
    });

    test('recovers a newest remix bootstrap commit using server trees and blobs', async () => {
        const sha = '1'.repeat(40);
        const copiedParent = '2'.repeat(40);
        const remixBaseSha = '3'.repeat(40);
        const apiClient = {
            commitInspection: jest.fn().mockResolvedValue({
                sha,
                parent: copiedParent,
                tree: 'copied-tree',
                parentTree: 'copied-tree',
                files: []
            }),
            commitTree: jest.fn((projectId, commit) => Promise.resolve(projectId === 'original' ? {
                files: [{path: 'Sprite/main.fractch', oid: 'old', size: 3}]
            } : {
                files: [
                    {path: 'Sprite/main.fractch', oid: 'new', size: 3},
                    {path: 'Sprite/assets/costume.svg', oid: 'asset', size: 20}
                ]
            })),
            commitFile: jest.fn((projectId, commit) => Promise.resolve({
                content: encode(projectId === 'original' && commit === remixBaseSha ? 'old' : 'new')
            }))
        };

        const result = await loadCommitInspection({
            apiClient,
            projectId: 'remix',
            sha,
            fallback: jest.fn(),
            remixBase: {
                enabled: true,
                projectId: 'original',
                sha: remixBaseSha,
                currentHead: sha
            }
        });

        expect(result.remixBootstrap).toBe(true);
        expect(parseDiff(result.diff)).toEqual([
            expect.objectContaining({path: 'Sprite/assets/costume.svg', status: 'Added', binary: true}),
            expect.objectContaining({path: 'Sprite/main.fractch', status: 'Modified', additions: 1, deletions: 1})
        ]);
        expect(apiClient.commitTree).toHaveBeenCalledWith('original', remixBaseSha);
        expect(apiClient.commitTree).toHaveBeenCalledWith('remix', sha);
        expect(apiClient.commitFile).toHaveBeenCalledWith('original', remixBaseSha, 'Sprite/main.fractch');
        expect(apiClient.commitFile).toHaveBeenCalledWith('remix', sha, 'Sprite/main.fractch');
        expect(apiClient.commitFile).toHaveBeenCalledTimes(2);
    });

    test('does not reinterpret an earlier empty remix commit', async () => {
        const sha = '4'.repeat(40);
        const apiClient = {
            commitInspection: jest.fn().mockResolvedValue({
                sha,
                parent: '5'.repeat(40),
                tree: 'same-tree',
                parentTree: 'same-tree',
                files: []
            }),
            commitTree: jest.fn(),
            commitFile: jest.fn()
        };

        const result = await loadCommitInspection({
            apiClient,
            projectId: 'remix',
            sha,
            fallback: jest.fn(),
            remixBase: {enabled: false, projectId: 'original', sha: '6'.repeat(40)}
        });

        expect(result.diff).toBe('');
        expect(apiClient.commitTree).not.toHaveBeenCalled();
        expect(apiClient.commitFile).not.toHaveBeenCalled();
    });

    test('uses the inspection endpoint without invoking the full-workspace fallback', async () => {
        const sha = 'd'.repeat(40);
        const fallback = jest.fn();
        const apiClient = {
            commitInspection: jest.fn().mockResolvedValue({sha, parent: '', files: []}),
            commitFile: jest.fn()
        };

        await expect(loadCommitInspection({apiClient, projectId: 'project-1', sha}))
            .resolves.toEqual(expect.objectContaining({oid: sha, diff: ''}));
        expect(fallback).not.toHaveBeenCalled();
    });

    test('uses a prefetched inspection without requesting it a second time', async () => {
        const sha = '9'.repeat(40);
        const progress = jest.fn();
        const apiClient = {
            commitInspection: jest.fn(),
            commitFile: jest.fn()
        };

        await expect(loadCommitInspection({
            apiClient,
            projectId: 'project-1',
            sha,
            inspection: {sha, parent: '', files: []},
            onProgress: progress
        })).resolves.toEqual(expect.objectContaining({oid: sha, diff: ''}));

        expect(apiClient.commitInspection).not.toHaveBeenCalled();
        expect(progress).toHaveBeenLastCalledWith({progress: 92, label: 'Drawing changes'});
    });

    test('does not download a workspace when remote inspection fails', async () => {
        const error = new Error('Commit inspection failed');
        const fallback = jest.fn();
        const apiClient = {
            commitInspection: jest.fn().mockRejectedValue(error),
            commitFile: jest.fn()
        };

        await expect(loadCommitInspection({
            apiClient,
            projectId: 'project-1',
            sha: 'e'.repeat(40)
        })).rejects.toBe(error);
        expect(fallback).not.toHaveBeenCalled();
    });

    test('renders legacy project archives as server-side binary changes', async () => {
        const sha = 'f'.repeat(40);
        const apiClient = {
            commitInspection: jest.fn().mockResolvedValue({
                sha,
                parent: '',
                legacy: true,
                files: [{path: 'project.sb3', status: 'added'}]
            }),
            commitFile: jest.fn()
        };

        await expect(loadCommitInspection({
            apiClient,
            projectId: 'project-1',
            sha
        })).resolves.toEqual(expect.objectContaining({
            oid: sha,
            diff: expect.stringContaining('Binary file changed')
        }));
        expect(apiClient.commitFile).not.toHaveBeenCalled();
    });

    test('loads summary texts inline and fetches tree-compare sides', async () => {
        const apiClient = {
            commitFile: jest.fn((projectId, sha, path) => Promise.resolve({content: encode(`${path} fetched`)}))
        };
        const texts = await loadCommitFileTexts({
            apiClient,
            projectId: 'fork',
            sha: 'b'.repeat(40),
            parentProjectId: 'original',
            inspection: {
                parent: 'a'.repeat(40),
                files: [
                    {path: 'Sprite/main.fractch', status: 'modified', oldData: encode('old inline'), newData: encode('new inline')},
                    {path: 'Stage/main.fractch', status: 'modified', oldData: toBytes('old tree'), newData: null},
                    {path: 'Other/main.fractch', status: 'modified', oldData: null, newData: null},
                    {path: 'Sprite/assets/a.svg', status: 'added'},
                    {path: 'Gone/main.fractch', status: 'removed', oldData: encode('gone'), newData: null}
                ]
            }
        });

        expect(texts['Sprite/main.fractch']).toEqual({before: 'old inline', after: 'new inline'});
        expect(texts['Stage/main.fractch']).toEqual({before: 'old tree', after: 'Stage/main.fractch fetched'});
        expect(texts['Other/main.fractch']).toEqual({before: 'Other/main.fractch fetched', after: 'Other/main.fractch fetched'});
        expect(texts['Gone/main.fractch']).toEqual({before: 'gone', after: ''});
        expect(texts).not.toHaveProperty('Sprite/assets/a.svg');
        expect(apiClient.commitFile).not.toHaveBeenCalledWith('original', expect.anything(), 'Stage/main.fractch');
        expect(apiClient.commitFile).toHaveBeenCalledWith('original', 'a'.repeat(40), 'Other/main.fractch');
        expect(apiClient.commitFile).toHaveBeenCalledWith('fork', 'b'.repeat(40), 'Stage/main.fractch');
    });

    test('skips summary texts that fail to load', async () => {
        const apiClient = {commitFile: jest.fn().mockRejectedValue(new Error('gone'))};
        const texts = await loadCommitFileTexts({
            apiClient,
            projectId: 'fork',
            sha: 'b'.repeat(40),
            inspection: {parent: 'a'.repeat(40), files: [{path: 'Stage/main.fractch', status: 'modified'}]}
        });

        expect(texts).toEqual({});
    });
});
