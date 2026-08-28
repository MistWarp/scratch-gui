import {normalizeRoadmapParams, roadmapPayload, withRoadmapParam} from '../../src/community/pages/Roadmap.jsx';
import {roadmapStatusMatches} from '../../src/community/roadmap-filters';

jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

describe('Roadmap composer', () => {
    test('trims bug report text before submission', () => {
        expect(roadmapPayload({kind: 'bug', title: '  Crash  ', description: '  Steps  ', category: 'Editor'})).toEqual({
            kind: 'bug',
            title: 'Crash',
            description: 'Steps',
            category: 'Editor'
        });
    });

    test('stores composer and filter state in canonical URL parameters', () => {
        expect(normalizeRoadmapParams(new URLSearchParams('new=bug&q=++crash++&kind=bug&source=mistwarp&area=+Editor+')).toString())
            .toBe('new=bug&q=crash&kind=bug&source=mistwarp&area=Editor');
        expect(normalizeRoadmapParams(new URLSearchParams('new=other&kind=all&source=any&area=+')).toString())
            .toBe('');
    });

    test('updates one roadmap parameter without dropping the rest', () => {
        expect(withRoadmapParam(new URLSearchParams('kind=idea&source=community'), 'q', '  blocks  ').toString())
            .toBe('kind=idea&source=community&q=blocks');
        expect(withRoadmapParam(new URLSearchParams('kind=idea&q=old'), 'q', ' ').toString())
            .toBe('kind=idea');
    });
});

describe('Roadmap status filters', () => {
    test.each(['open', 'planned', 'building'])('shows %s entries by default', status => {
        expect(roadmapStatusMatches(status, '')).toBe(true);
    });

    test.each(['shipped', 'declined'])('hides %s entries by default', status => {
        expect(roadmapStatusMatches(status, '')).toBe(false);
    });

    test.each(['shipped', 'declined'])('shows %s entries when explicitly filtered', status => {
        expect(roadmapStatusMatches(status, status)).toBe(true);
    });
});
