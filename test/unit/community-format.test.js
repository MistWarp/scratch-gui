import {formatDateTime, formatPlaytime, safeDate} from '../../src/community/format';

describe('community format helpers', () => {
    describe('safeDate', () => {
        test('accepts numeric timestamp strings and rejects malformed dates', () => {
            expect(safeDate('1767225600000').getTime()).toBe(1767225600000);
            expect(safeDate('2026-01-01T00:00:00Z').toISOString()).toBe('2026-01-01T00:00:00.000Z');
            expect(safeDate('not-a-date')).toBeNull();
        });
    });

    describe('formatDateTime', () => {
        test('uses its fallback for malformed API timestamps', () => {
            expect(formatDateTime('not-a-date', 'Date unavailable')).toBe('Date unavailable');
            expect(formatDateTime('2026-01-01T12:30:00Z')).not.toBe('');
        });
    });

    describe('formatPlaytime', () => {
        test('distinguishes recorded sub-minute playtime from no playtime', () => {
            expect(formatPlaytime(0)).toBe('0m played');
            expect(formatPlaytime(1)).toBe('<1m played');
            expect(formatPlaytime(59999)).toBe('<1m played');
        });

        test('formats minutes and hours', () => {
            expect(formatPlaytime(60000)).toBe('1m played');
            expect(formatPlaytime(5400000)).toBe('1h 30m played');
            expect(formatPlaytime(7200000, false)).toBe('2h');
        });

        test('treats invalid values as no playtime', () => {
            expect(formatPlaytime(undefined)).toBe('0m played');
            expect(formatPlaytime('invalid')).toBe('0m played');
            expect(formatPlaytime(-1)).toBe('0m played');
        });
    });
});
