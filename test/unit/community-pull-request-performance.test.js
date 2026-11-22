import {
    buildPullRequestDiff,
    canClosePullRequest,
    canMergePullRequest,
    pullAssetRefs,
    pullMergeUpload,
    readPullDiffCache,
    writePullDiffCache,
    shouldLoadPullDiff
} from '../../src/community/pages/PullRequest.jsx';

describe('pull request loading', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    test('defers the pull request diff until the files tab is opened', () => {
        const pull = {index: 7};
        expect(shouldLoadPullDiff({tab: 'conversation', pull, diff: null, diffError: ''})).toBe(false);
        expect(shouldLoadPullDiff({tab: 'commits', pull, diff: null, diffError: ''})).toBe(false);
        expect(shouldLoadPullDiff({tab: 'files', pull, diff: null, diffError: ''})).toBe(true);
        expect(shouldLoadPullDiff({tab: 'files', pull, diff: 'loaded', diffError: ''})).toBe(false);
    });

    test('lets project maintainers merge pull requests', () => {
        expect(canMergePullRequest({myRole: 'maintainer'})).toBe(true);
        expect(canMergePullRequest({myRole: 'viewer'})).toBe(false);
    });

    test('lets the fork owner and target maintainers close pull requests', () => {
        expect(canClosePullRequest({}, {sourceOwner: 'Mist'}, {username: 'mist'})).toBe(true);
        expect(canClosePullRequest({myRole: 'maintainer'}, {}, {username: 'someone'})).toBe(true);
        expect(canClosePullRequest({}, {canClose: false, sourceOwner: 'Mist'}, {username: 'mist'})).toBe(false);
    });

    test('builds the files view from server inspection without workspace downloads', async () => {
        const apiClient = {commitFile: jest.fn()};
        const diff = await buildPullRequestDiff(apiClient, {
            pull: {
                sourceProjectId: 'source',
                targetProjectId: 'target',
                headCommit: 'b'.repeat(40)
            },
            inspection: {parent: 'a'.repeat(40), files: []}
        });

        expect(diff).toBe('');
        expect(apiClient.commitFile).not.toHaveBeenCalled();
    });

    test('scopes changed-file requests to the pull request', async () => {
        const apiClient = {
            commitFile: jest.fn(projectId => Promise.resolve({
                content: btoa(projectId === 'target' ? 'old\n' : 'new\n')
            }))
        };
        await buildPullRequestDiff(apiClient, {
            pull: {
                index: 7,
                sourceProjectId: 'source',
                targetProjectId: 'target',
                baseCommit: 'a'.repeat(40),
                headCommit: 'b'.repeat(40)
            },
            inspection: {
                parent: 'a'.repeat(40),
                files: [{path: 'Stage/main.fractch', status: 'modified'}]
            }
        });

        expect(apiClient.commitFile).toHaveBeenCalledWith(
            'target', 'a'.repeat(40), 'Stage/main.fractch', 7, 'target'
        );
        expect(apiClient.commitFile).toHaveBeenCalledWith(
            'source', 'b'.repeat(40), 'Stage/main.fractch', 7, 'target'
        );
    });

    test('does not retain multi-megabyte pull request diffs in session storage', () => {
        const pull = {targetProjectId: 'target', baseCommit: 'base', headCommit: 'head'};
        writePullDiffCache(pull, 'x'.repeat((2 * 1024 * 1024 / 2) + 1));
        expect(readPullDiffCache(pull)).toBeNull();
    });

    test('reads bounded pull request diff cache entries', () => {
        const pull = {targetProjectId: 'target', baseCommit: 'base', headCommit: 'head'};
        writePullDiffCache(pull, 'small diff');
        expect(readPullDiffCache(pull)).toBe('small diff');
    });

    test('keys cached diffs on the current target head', () => {
        const pull = {targetProjectId: 'target', baseCommit: 'a', headCommit: 'b'};
        writePullDiffCache({...pull, currentTargetHead: 'one'}, 'first diff');
        expect(readPullDiffCache({...pull, currentTargetHead: 'one'})).toBe('first diff');
        expect(readPullDiffCache({...pull, currentTargetHead: 'two'})).toBe(null);
    });

    test('loads assets from the live pull heads', () => {
        expect(pullAssetRefs({
            index: 3,
            targetProjectId: 'target',
            sourceProjectId: 'fork',
            baseCommit: 'base',
            headCommit: 'head'
        }, 'target')).toEqual({
            oldProject: 'target',
            oldSha: 'base',
            newProject: 'fork',
            newSha: 'head',
            pullIndex: 3,
            pullTarget: 'target'
        });
    });

    test('sends the fork head the merge was prepared from', () => {
        expect(pullMergeUpload(
            {expectedHead: 'target-head', sourceHead: 'fork-head'},
            4,
            {sb3: 'sb3', tree: 'tree'}
        )).toEqual({
            sb3: 'sb3',
            mergeTree: 'tree',
            expectedHead: 'target-head',
            pullId: 4,
            sourceHead: 'fork-head'
        });
    });
});
