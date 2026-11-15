import {track} from '../../src/community/analytics';
import {depthMilestone, trackVisitDepth, trackVisitStart, visitKind} from '../../src/community/visit-analytics.js';

jest.mock('../../src/community/analytics', () => ({
    analyticsEnabled: () => global.localStorage.getItem('mw:anonymous-analytics') !== 'off',
    track: jest.fn()
}));

const sentEvents = () => track.mock.calls.map(([name, options]) => ({name, variant: options.variant}));

describe('visit analytics', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        track.mockClear();
    });

    test('a device seen on an earlier day is returning', () => {
        expect(visitKind('', '2026-11-15')).toBe('new');
        expect(visitKind('2026-11-15', '2026-11-15')).toBe('new');
        expect(visitKind('2026-11-14', '2026-11-15')).toBe('returning');
    });

    test('only listed depths are counted', () => {
        expect([1, 2, 3, 4, 5, 9, 10, 11].map(depthMilestone)).toEqual(['', '2', '3', '', '5', '', '10', '']);
    });

    test('a visit starts once per tab and remembers the first day', () => {
        trackVisitStart();
        trackVisitStart();
        expect(sentEvents()).toEqual([{name: 'visit_start', variant: 'new'}]);
        expect(localStorage.getItem('mw:first-visit-day')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('a device first seen on an earlier day starts a returning visit', () => {
        localStorage.setItem('mw:first-visit-day', '2026-01-01');
        trackVisitStart();
        expect(sentEvents()).toEqual([{name: 'visit_start', variant: 'returning'}]);
    });

    test('each depth is counted once per visit', () => {
        [1, 2, 2, 3, 4, 5].forEach(trackVisitDepth);
        expect(sentEvents().map(event => event.variant)).toEqual(['2', '3', '5']);
    });

    test('nothing is counted when analytics are off', () => {
        localStorage.setItem('mw:anonymous-analytics', 'off');
        trackVisitStart();
        trackVisitDepth(2);
        expect(track).not.toHaveBeenCalled();
        expect(localStorage.getItem('mw:first-visit-day')).toBeNull();
    });
});
