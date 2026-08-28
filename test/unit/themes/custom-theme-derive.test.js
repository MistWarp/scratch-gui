import {CustomTheme, customThemeManager} from '../../../src/lib/themes/custom-themes.js';

const gradient = {
    direction: '90',
    colors: [{color: '#123456', position: 0}, {color: '#abcdef', position: 100}]
};

test('deriving a saved gradient theme deselects it without losing its colors', () => {
    const imported = CustomTheme.import({
        uuid: 'custom-theme-test',
        name: 'Test',
        gui: 'dark',
        blocks: 'three',
        accent: gradient
    });
    customThemeManager.themes.set(imported.uuid, imported);

    const derived = imported.setAppearance({menuBarLayout: {orders: {}, hidden: ['file']}});

    expect(derived.uuid).not.toBe(imported.uuid);
    expect(customThemeManager.getTheme(derived.uuid)).toBeNull();
    expect(derived.getGuiColors()).toEqual(imported.getGuiColors());
});

test('WarpTheme source identity survives local export and import', () => {
    const imported = CustomTheme.import({
        name: 'Marketplace theme',
        gui: 'light',
        blocks: 'three',
        accent: gradient,
        sourceId: 'warptheme-1'
    });

    const restored = CustomTheme.import(imported.export());

    expect(restored.sourceId).toBe('warptheme-1');
    expect(restored.export().sourceId).toBe('warptheme-1');
});
