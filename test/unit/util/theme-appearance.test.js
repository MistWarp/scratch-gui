import {Theme} from '../../../src/lib/themes';
import {CustomTheme} from '../../../src/lib/themes/custom-themes';

describe('theme appearance', () => {
    const appearance = {
        menuBarLayout: {
            orders: {left: ['file', 'edit'], right: ['about']},
            hidden: ['tools']
        },
        styles: {
            'tab-style': 'scratchbox',
            'tab-looks': 'icon-only',
            'window-style': 'macos'
        }
    };

    test('updates appearance without dropping core theme options', () => {
        const original = new Theme('blue', 'dark', 'dark', 'right');
        const updated = original.setAppearance(appearance);

        expect(updated.appearance).toEqual(appearance);
        expect(updated.gui).toBe(original.gui);
        expect(updated.blocks).toBe(original.blocks);
        expect(updated.menuBarAlign).toBe(original.menuBarAlign);
    });

    test('round-trips appearance through custom theme export', () => {
        const original = new CustomTheme(
            'Chrome test',
            '',
            'blue',
            'dark',
            'three',
            'left',
            null,
            null,
            'User',
            appearance
        );
        const updated = original.setAppearance(appearance);
        const imported = CustomTheme.import(updated.export());

        expect(updated).toBeInstanceOf(CustomTheme);
        expect(imported.appearance).toEqual(appearance);
    });
});
