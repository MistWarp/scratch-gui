import {getPageDepth, mergeProjects, normalizeExploreParams, shouldSkipPageRestore} from '../../src/community/pages/Explore.jsx';

describe('Explore pagination state', () => {
    test('normalizes restored page depth', () => {
        expect(getPageDepth(null)).toBe(1);
        expect(getPageDepth('0')).toBe(1);
        expect(getPageDepth('2')).toBe(2);
        expect(getPageDepth('999')).toBe(10);
    });

    test('merges restored pages without duplicate projects', () => {
        expect(mergeProjects([
            [{id: 'a'}, {id: 'b'}],
            [{id: 'b'}, {id: 'c'}]
        ])).toEqual([{id: 'a'}, {id: 'b'}, {id: 'c'}]);
    });

    test('only skips the exact URL update made by load more', () => {
        expect(shouldSkipPageRestore('sort=recent&page=2', 'sort=recent&page=2')).toBe(true);
        expect(shouldSkipPageRestore('sort=recent&page=2', 'sort=recent&tag=games')).toBe(false);
    });

    test('canonicalizes fallback sort, whitespace, and restored page depth', () => {
        expect(normalizeExploreParams(new URLSearchParams('sort=unknown&q=++cats++&tag=+art+&page=999')).toString())
            .toBe('q=cats&tag=art&page=10');
        expect(normalizeExploreParams(new URLSearchParams('sort=trending&page=1')).toString()).toBe('');
    });
});
