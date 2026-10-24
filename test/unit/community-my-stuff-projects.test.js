import {
    filterProjects, getProjectShow, getProjectSort, isUntitledDraft, needsEveryProject, projectVisibility, sortProjects
} from '../../src/community/components/MyStuffProjects.jsx';
import {storageFull, storageParts} from '../../src/community/components/MyStuffStorage.jsx';
import {normalizeMyStuffParams} from '../../src/community/pages/MyStuff.jsx';

const projects = [
    {id: 'a', title: 'Project', shared: false, visibility: 'private', edited: 5, views: 0, loveCount: 0, sizeBytes: 10},
    {id: 'b', title: 'Neon Drift', shared: true, visibility: 'public', edited: 4, views: 900, loveCount: 30, sizeBytes: 50},
    {id: 'c', title: 'Untitled 2', shared: false, visibility: 'private', edited: 3, views: 0, loveCount: 0, sizeBytes: 5},
    {id: 'd', title: 'Boss rush', shared: false, visibility: 'unlisted', edited: 2, views: 40, loveCount: 2, sizeBytes: 80},
    {id: 'e', title: 'Project', shared: true, visibility: 'public', edited: 1, views: 10, loveCount: 1, sizeBytes: 1},
    {id: 'f', title: 'Hidden one', shared: true, visibility: 'public', moderationHidden: true, edited: 0}
];
const ids = list => list.map(project => project.id);

describe('My Stuff projects list', () => {
    test('names each project as shared, unlisted, draft or hidden in plain words', () => {
        expect(projects.map(projectVisibility)).toEqual(['draft', 'shared', 'draft', 'unlisted', 'shared', 'hidden']);
    });

    test('only counts unnamed drafts as untitled', () => {
        expect(ids(projects.filter(isUntitledDraft))).toEqual(['a', 'c']);
        expect(isUntitledDraft({title: 'Project (3)', visibility: 'private'})).toBe(true);
        expect(isUntitledDraft({title: 'My project', visibility: 'private'})).toBe(false);
    });

    test('filters by kind and title', () => {
        expect(ids(filterProjects(projects, {show: 'shared'}))).toEqual(['b', 'e']);
        expect(ids(filterProjects(projects, {show: 'drafts'}))).toEqual(['a', 'c']);
        expect(ids(filterProjects(projects, {show: 'unlisted'}))).toEqual(['d']);
        expect(ids(filterProjects(projects, {show: 'untitled'}))).toEqual(['a', 'c']);
        expect(ids(filterProjects(projects, {query: 'NEON'}))).toEqual(['b']);
    });

    test('sorts, falling back to the last edited', () => {
        expect(ids(sortProjects(projects, 'plays')).slice(0, 3)).toEqual(['b', 'd', 'e']);
        expect(ids(sortProjects(projects, 'size'))[0]).toBe('d');
        expect(ids(sortProjects(projects, 'title'))).toEqual(['d', 'f', 'b', 'a', 'e', 'c']);
        expect(ids(sortProjects(projects, 'edited'))).toEqual(ids(projects));
    });

    test('fetches every project only when the list is narrowed or reordered', () => {
        expect(needsEveryProject({show: 'all', sort: 'edited', query: ''})).toBe(false);
        expect(needsEveryProject({show: 'drafts', sort: 'edited', query: ''})).toBe(true);
        expect(needsEveryProject({show: 'all', sort: 'size', query: ''})).toBe(true);
        expect(needsEveryProject({show: 'all', sort: 'edited', query: ' x '})).toBe(true);
        expect(getProjectShow('nope')).toBe('all');
        expect(getProjectSort('nope')).toBe('edited');
    });

    test('keeps show and sort in the URL only for My projects', () => {
        expect(normalizeMyStuffParams(new URLSearchParams('section=projects&show=drafts&sort=size')).toString())
            .toBe('section=projects&show=drafts&sort=size');
        expect(normalizeMyStuffParams(new URLSearchParams('section=projects&show=all&sort=edited')).toString())
            .toBe('section=projects');
        expect(normalizeMyStuffParams(new URLSearchParams('section=trash&show=drafts')).toString())
            .toBe('section=trash');
    });
});

describe('My Stuff storage', () => {
    test('splits the allowance between projects, the backpack and pending uploads', () => {
        expect(storageParts({used: 100, backpack: 30, pending: 5})).toEqual([
            {key: 'projects', bytes: 70},
            {key: 'backpack', bytes: 30},
            {key: 'pending', bytes: 5}
        ]);
        expect(storageFull({used: 90, pending: 10, limit: 100})).toBe(true);
        expect(storageFull({used: 90, pending: 0, limit: 100})).toBe(false);
    });
});
