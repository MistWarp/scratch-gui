import {track} from '../../src/community/analytics';
import {
    depthMilestone, rememberVisitProject, touchVisit, trackVisitDepth, trackVisitStart, visitKind, visitProjects
} from '../../src/community/visit-analytics.js';

jest.mock('../../src/community/analytics', () => ({
    analyticsEnabled: () => global.localStorage.getItem('mw:anonymous-analytics') !== 'off',
    track: jest.fn()
}));

const MINUTE = 60 * 1000;

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

    test('a visit starts once across tabs and remembers the first day', () => {
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
        [1, 2, 2, 3, 4, 5].forEach(count => trackVisitDepth(count));
        expect(sentEvents().filter(event => event.name === 'visit_depth')
            .map(event => event.variant)).toEqual(['2', '3', '5']);
    });

    test('half an hour without activity starts a new visit', () => {
        const start = Date.UTC(2026, 10, 15, 12);
        trackVisitStart(start);
        trackVisitStart(start + (20 * MINUTE));
        trackVisitStart(start + (40 * MINUTE));
        expect(sentEvents()).toHaveLength(1);
        trackVisitStart(start + (71 * MINUTE));
        expect(sentEvents()).toHaveLength(2);
    });

    test('a clock moved far back starts a new visit', () => {
        const start = Date.UTC(2026, 10, 15, 12);
        trackVisitStart(start);
        trackVisitStart(start - (60 * MINUTE));
        expect(sentEvents()).toHaveLength(2);
    });

    test('visit depth counts distinct projects across the visit', () => {
        const start = Date.UTC(2026, 10, 15, 12);
        expect(rememberVisitProject('a', start)).toBe(1);
        expect(rememberVisitProject('b', start + MINUTE)).toBe(2);
        expect(rememberVisitProject('a', start + (2 * MINUTE))).toBe(2);
        expect(visitProjects(start + (3 * MINUTE))).toEqual(['b', 'a']);
        expect(rememberVisitProject('c', start + (40 * MINUTE))).toBe(1);
    });

    test('a project opened after the visit expired starts and counts a new visit', () => {
        const start = Date.UTC(2026, 10, 15, 12);
        trackVisitStart(start);
        rememberVisitProject('a', start);
        rememberVisitProject('b', start + (45 * MINUTE));
        trackVisitDepth(rememberVisitProject('c', start + (46 * MINUTE)), start + (46 * MINUTE));
        expect(sentEvents().map(event => event.name)).toEqual(['visit_start', 'visit_start', 'visit_depth']);
    });

    test('playing keeps the visit going', () => {
        const start = Date.UTC(2026, 10, 15, 12);
        rememberVisitProject('a', start);
        touchVisit(start + (25 * MINUTE));
        touchVisit(start + (50 * MINUTE));
        expect(rememberVisitProject('b', start + (60 * MINUTE))).toBe(2);
        expect(sentEvents()).toHaveLength(1);
    });

    test('broken visit storage starts a fresh visit', () => {
        localStorage.setItem('mw:visit', '{"last": "soon", "seen": 4}');
        expect(rememberVisitProject('a')).toBe(1);
    });

    test('nothing is counted when analytics are off', () => {
        localStorage.setItem('mw:anonymous-analytics', 'off');
        trackVisitStart();
        trackVisitDepth(2);
        expect(track).not.toHaveBeenCalled();
        expect(localStorage.getItem('mw:first-visit-day')).toBeNull();
    });
});
