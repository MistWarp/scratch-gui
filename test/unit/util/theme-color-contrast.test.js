import {contrastRatio, ensureColorContrast, parseColor} from '../../../src/lib/themes/color-contrast';
import {ACCENT_MAP, GUI_MAP} from '../../../src/lib/themes';

describe('theme color contrast', () => {
    test('parses the color formats used by built-in themes', () => {
        expect(parseColor('#ff4c4c')).toEqual([255, 76, 76]);
        expect(parseColor('hsla(215, 100%, 65%, 1)')).not.toBe(null);
        expect(parseColor('oklab(0.37 0.01 -0.07)')).not.toBe(null);
    });

    test('keeps an accent that is already distinct from its surface', () => {
        expect(ensureColorContrast('#ff4c4c', '#ffffff')).toBe('#ff4c4c');
    });

    test('darkens a light accent on a light surface', () => {
        const adjusted = ensureColorContrast('#ffcc00', '#ffffff');

        expect(adjusted).not.toBe('#ffcc00');
        expect(contrastRatio(adjusted, '#ffffff')).toBeGreaterThanOrEqual(3);
    });

    test('lightens a dark accent on a dark surface', () => {
        const adjusted = ensureColorContrast('oklab(0.37 0.01 -0.07)', '#111111');

        expect(adjusted).not.toBe('oklab(0.37 0.01 -0.07)');
        expect(contrastRatio(adjusted, '#111111')).toBeGreaterThanOrEqual(3);
    });

    test('leaves unsupported CSS values alone', () => {
        expect(ensureColorContrast('var(--custom-accent)', '#ffffff')).toBe('var(--custom-accent)');
    });

    test('keeps every built-in accent distinct in light and dark themes', () => {
        for (const accent of Object.values(ACCENT_MAP)) {
            for (const gui of [GUI_MAP.light, GUI_MAP.dark, GUI_MAP.midnight]) {
                const color = accent.guiColors['looks-secondary'];
                const surface = gui.guiColors['ui-white'];
                const adjusted = ensureColorContrast(color, surface);

                expect(contrastRatio(adjusted, surface)).toBeGreaterThanOrEqual(3);
            }
        }
    });
});
