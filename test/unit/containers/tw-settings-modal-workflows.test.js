import {normalizeCustomFramerate} from '../../../src/lib/utils/framerate';

describe('custom framerate settings', () => {
    test('accepts positive finite framerates', () => {
        expect(normalizeCustomFramerate('59.94')).toBe(59.94);
        expect(normalizeCustomFramerate(120)).toBe(120);
    });

    test('rejects values that cannot run the project', () => {
        expect(normalizeCustomFramerate('')).toBe(null);
        expect(normalizeCustomFramerate(0)).toBe(null);
        expect(normalizeCustomFramerate(-30)).toBe(null);
        expect(normalizeCustomFramerate(Infinity)).toBe(null);
        expect(normalizeCustomFramerate('fast')).toBe(null);
    });
});
