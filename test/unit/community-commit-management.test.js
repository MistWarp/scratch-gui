import {
    canManageCommit,
    commitMutationSha,
    normalizeCommitCoAuthors
} from '../../src/community/pages/Commit.jsx';

describe('commit management', () => {
    test('allows only project owners and maintainers to manage commit co-authors', () => {
        expect(canManageCommit({isOwner: true, myRole: 'owner'})).toBe(true);
        expect(canManageCommit({isOwner: false, myRole: 'maintainer'})).toBe(true);
        expect(canManageCommit({isOwner: false, myRole: 'contributor'})).toBe(false);
        expect(canManageCommit({isOwner: false, myRole: 'tester'})).toBe(false);
        expect(canManageCommit({isOwner: false, myRole: ''})).toBe(false);
    });

    test('normalizes commit co-authors and accepts legacy collaborator responses', () => {
        expect(normalizeCommitCoAuthors({
            coAuthors: [' Sophie ', {username: 'Alex'}, 'sophie', '', null]
        })).toEqual(['Sophie', 'Alex']);
        expect(normalizeCommitCoAuthors({
            collaborators: [' Sophie ', {username: 'Alex'}, 'sophie', '', null]
        })).toEqual(['Sophie', 'Alex']);
        expect(normalizeCommitCoAuthors({
            commit: {collaborators: [{username: 'Milo'}]}
        })).toEqual(['Milo']);
    });

    test('uses the rewritten commit hash returned by the update endpoint', () => {
        expect(commitMutationSha({commit: {sha: 'commit-sha'}, sha: 'top-level'}, 'old')).toBe('commit-sha');
        expect(commitMutationSha({sha: 'top-level'}, 'old')).toBe('top-level');
        expect(commitMutationSha({rewrittenSha: 'rewritten'}, 'old')).toBe('rewritten');
        expect(commitMutationSha({}, 'old')).toBe('old');
    });
});
