import {formatClock, formatSeconds, parseSeconds} from '../../../src/lib/audio/sound-time';

describe('sound time formatting', () => {
    test('formats the clock with minutes and milliseconds', () => {
        expect(formatClock(0)).toEqual('0:00.000');
        expect(formatClock(1.5)).toEqual('0:01.500');
        expect(formatClock(75.25)).toEqual('1:15.250');
    });

    test('rounds up into the next minute instead of showing 60 seconds', () => {
        expect(formatClock(59.9996)).toEqual('1:00.000');
        expect(formatSeconds(59.96, 1)).toEqual('1:00.0');
    });

    test('formats ruler labels', () => {
        expect(formatSeconds(0.25, 2)).toEqual('0.25');
        expect(formatSeconds(2, 0)).toEqual('2');
        expect(formatSeconds(65, 0)).toEqual('1:05');
        expect(formatSeconds(-1, 1)).toEqual('0.0');
    });

    test('parses seconds and minutes', () => {
        expect(parseSeconds('1.5')).toEqual(1.5);
        expect(parseSeconds(' 1:02.5 ')).toEqual(62.5);
        expect(parseSeconds('')).toBeNull();
        expect(parseSeconds('abc')).toBeNull();
        expect(parseSeconds('-1')).toBeNull();
        expect(parseSeconds('1:2:3')).toBeNull();
    });
});
