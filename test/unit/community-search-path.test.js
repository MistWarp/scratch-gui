import searchPath from '../../src/community/search-path.js';
import searchFocusIndex from '../../src/community/search-keyboard.js';

describe('community search navigation', () => {
    test('trims searches and does not create an empty query', () => {
        expect(searchPath('  platform game  ')).toBe('/explore?q=platform%20game');
        expect(searchPath('   ')).toBe('/explore');
    });
});

describe('community search keyboard navigation', () => {
    test('enters, wraps, and jumps through quick results', () => {
        expect(searchFocusIndex('ArrowDown', -1, 3)).toBe(0);
        expect(searchFocusIndex('ArrowDown', 2, 3)).toBe(0);
        expect(searchFocusIndex('ArrowUp', -1, 3)).toBe(2);
        expect(searchFocusIndex('ArrowUp', 0, 3)).toBe(2);
        expect(searchFocusIndex('Home', 2, 3)).toBe(0);
        expect(searchFocusIndex('End', 0, 3)).toBe(2);
    });

    test('ignores unrelated keys and empty result sets', () => {
        expect(searchFocusIndex('Enter', 0, 3)).toBeNull();
        expect(searchFocusIndex('ArrowDown', -1, 0)).toBe(-1);
    });
});
