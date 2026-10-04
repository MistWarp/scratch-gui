import {formatBytes} from '../../../src/lib/utils/bytes';

describe('formatBytes', () => {
    test('shows whole bytes below 1 KB', () => {
        expect(formatBytes(0)).toBe('0 B');
        expect(formatBytes(512)).toBe('512 B');
        expect(formatBytes(1023)).toBe('1023 B');
    });

    test('uses binary units with at most one decimal place', () => {
        expect(formatBytes(1024)).toBe('1 KB');
        expect(formatBytes(1536)).toBe('1.5 KB');
        expect(formatBytes(1.5 * 1024 * 1024)).toBe('1.5 MB');
        expect(formatBytes(500 * 1024 * 1024)).toBe('500 MB');
        expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
        expect(formatBytes(2.25 * 1024 * 1024 * 1024)).toBe('2.3 GB');
    });

    test('moves up a unit when rounding reaches the next one', () => {
        expect(formatBytes(1023.6)).toBe('1 KB');
        expect(formatBytes((1024 * 1024) - 1)).toBe('1 MB');
    });

    test('can use decimal units', () => {
        expect(formatBytes(5e6, {decimal: true})).toBe('5 MB');
        expect(formatBytes(1e9, {decimal: true})).toBe('1 GB');
        expect(formatBytes(5e6)).toBe('4.8 MB');
    });

    test('treats invalid values as zero and keeps the sign of negative sizes', () => {
        expect(formatBytes(void 0)).toBe('0 B');
        expect(formatBytes('not a number')).toBe('0 B');
        expect(formatBytes('2048')).toBe('2 KB');
        expect(formatBytes(-2048)).toBe('-2 KB');
        expect(formatBytes(-0.2)).toBe('0 B');
    });
});
