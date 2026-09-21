import {
    filterPulls,
    groupPulls,
    pullLinkValue,
    pullRepos,
    pullState,
    pullTimestamp,
    roadmapIndexForPulls,
    roadmapProgress
} from '../../src/community/development.js';

const pull = overrides => ({
    id: `${overrides.repo || 'scratch-gui'}#${overrides.number || 1}`,
    repo: 'scratch-gui',
    number: 1,
    title: 'A change',
    author: 'mist',
    state: 'open',
    updatedAt: '2026-09-10T00:00:00Z',
    mergedAt: '',
    ...overrides
});

describe('pull request state', () => {
    test('reads a known state and falls back for anything else', () => {
        expect(pullState({state: 'merged'})).toBe('merged');
        expect(pullState({state: 'draft'})).toBe('draft');
        expect(pullState({state: 'nonsense'})).toBe('unknown');
        expect(pullState({})).toBe('unknown');
        expect(pullState(null)).toBe('unknown');
    });

    test('parses GitHub timestamps and ignores junk', () => {
        expect(pullTimestamp('2026-09-10T00:00:00Z')).toBe(Date.parse('2026-09-10T00:00:00Z'));
        expect(pullTimestamp('')).toBe(0);
        expect(pullTimestamp('not a date')).toBe(0);
    });
});

describe('grouping the changes feed', () => {
    test('splits work in review from work that landed', () => {
        const groups = groupPulls([
            pull({number: 1, state: 'open'}),
            pull({number: 2, state: 'draft'}),
            pull({number: 3, state: 'merged', mergedAt: '2026-09-12T00:00:00Z'}),
            pull({number: 4, state: 'closed'})
        ]);
        expect(groups.map(group => group.key)).toEqual(['review', 'merged']);
        expect(groups[0].pulls.map(item => item.number)).toEqual([1, 2]);
        expect(groups[1].pulls.map(item => item.number)).toEqual([3]);
    });

    test('orders merged work by when it landed, not when it last changed', () => {
        const [, merged] = groupPulls([
            pull({number: 1, state: 'merged', mergedAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-20T00:00:00Z'}),
            pull({number: 2, state: 'merged', mergedAt: '2026-09-15T00:00:00Z', updatedAt: '2026-09-15T00:00:00Z'})
        ]);
        expect(merged.pulls.map(item => item.number)).toEqual([2, 1]);
    });

    test('a closed but unmerged pull request is in neither group', () => {
        const groups = groupPulls([pull({number: 9, state: 'closed'})]);
        expect(groups.flatMap(group => group.pulls)).toHaveLength(0);
    });
});

describe('filtering the changes feed', () => {
    const pulls = [
        pull({number: 1, repo: 'scratch-gui', title: 'Sprite pane redesign'}),
        pull({number: 2, repo: 'scratch-vm', title: 'Faster block execution', author: 'someone'})
    ];

    test('lists every repository represented in the feed, sorted', () => {
        expect(pullRepos(pulls)).toEqual(['scratch-gui', 'scratch-vm']);
        expect(pullRepos([])).toEqual([]);
    });

    test('narrows by repository', () => {
        expect(filterPulls(pulls, {repo: 'scratch-vm'}).map(item => item.number)).toEqual([2]);
    });

    test('searches title, repository, author and number', () => {
        expect(filterPulls(pulls, {query: 'sprite'}).map(item => item.number)).toEqual([1]);
        expect(filterPulls(pulls, {query: 'scratch-vm'}).map(item => item.number)).toEqual([2]);
        expect(filterPulls(pulls, {query: 'someone'}).map(item => item.number)).toEqual([2]);
        expect(filterPulls(pulls, {query: '#2'}).map(item => item.number)).toEqual([2]);
        expect(filterPulls(pulls, {query: '   '})).toHaveLength(2);
    });

    test('combines a repository and a search term', () => {
        expect(filterPulls(pulls, {repo: 'scratch-gui', query: 'faster'})).toHaveLength(0);
    });
});

describe('roadmap entries and their pull requests', () => {
    test('summarises what is open and what merged', () => {
        expect(roadmapProgress({pullRequests: [
            pull({number: 1, state: 'open'}),
            pull({number: 2, state: 'draft'}),
            pull({number: 3, state: 'merged'})
        ]})).toEqual({total: 3, merged: 1, open: 2});
        expect(roadmapProgress({})).toEqual({total: 0, merged: 0, open: 0});
    });

    test('indexes entries by pull request so the changes feed can link back', () => {
        const idea = {_id: 'i1', title: 'Sprite pane', pullRequests: [pull({number: 1})]};
        const index = roadmapIndexForPulls([idea, {_id: 'i2', title: 'Other'}]);
        expect(index.get('scratch-gui#1')).toBe(idea);
        expect(index.get('scratch-gui#404')).toBeUndefined();
    });

    test('keeps the first entry when two claim the same pull request', () => {
        const first = {_id: 'i1', title: 'First', pullRequests: [pull({number: 1})]};
        const second = {_id: 'i2', title: 'Second', pullRequests: [pull({number: 1})]};
        expect(roadmapIndexForPulls([first, second]).get('scratch-gui#1')).toBe(first);
    });

    test('renders a link value an admin can round-trip', () => {
        expect(pullLinkValue(pull({repo: 'scratch-vm', number: 7}))).toBe('scratch-vm#7');
    });
});
