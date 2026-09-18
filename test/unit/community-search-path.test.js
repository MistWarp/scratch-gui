import searchPath from '../../src/community/search-path.js';
import searchFocusIndex from '../../src/community/search-keyboard.js';
import matchScore, {rankSections} from '../../src/community/search-rank.js';

describe('community search navigation', () => {
    test('trims searches and does not create an empty query', () => {
        expect(searchPath('  platform game  ')).toBe('/search?q=platform%20game');
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

describe('community search ranking', () => {
    test('scores an exact name above a prefix, a word start, and a buried match', () => {
        expect(matchScore('Mist', 'mist')).toBe(4);
        expect(matchScore('MistWarp', 'mist')).toBe(3);
        expect(matchScore('Random_Idiot_On_Mist', 'mist')).toBe(2);
        expect(matchScore('Malwares mistwarp', 'warp')).toBe(1);
        expect(matchScore('Wonder wizard', 'mist')).toBe(0);
    });

    test('leads with the group holding the best match', () => {
        const sections = [
            {key: 'projects', match: ['Refined MistBloks Physics Demo']},
            {key: 'people', match: ['Bader_The_MistWarper', 'Mist']},
            {key: 'spaces', match: ['Malwares mistwarp']}
        ];
        expect(rankSections(sections, 'mist').map(section => section.key)).toEqual(['people', 'projects', 'spaces']);
    });

    test('keeps the given order when nothing matches better', () => {
        const sections = [{key: 'projects', match: []}, {key: 'people', match: []}];
        expect(rankSections(sections, 'mist').map(section => section.key)).toEqual(['projects', 'people']);
    });
});
