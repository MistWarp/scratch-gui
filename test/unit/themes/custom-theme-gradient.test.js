import {CustomTheme, GradientUtils, customThemeManager} from '../../../src/lib/themes/custom-themes.js';
import {Theme} from '../../../src/lib/themes/index.js';

const stops = [{color: '#123456', position: 0}, {color: '#abcdef', position: 100}];

afterEach(() => {
    customThemeManager.themes.clear();
});

test('a 0 degree gradient keeps its direction', () => {
    const accent = GradientUtils.createGradientAccent(stops, '#123456', {direction: 0});
    expect(accent.guiColors['menu-bar-background-image']).toMatch(/^linear-gradient\(0deg/);

    const imported = CustomTheme.import({
        name: 'Upward',
        gui: 'light',
        blocks: 'three',
        accent: {colors: stops, direction: '0'}
    });
    expect(imported.getGuiColors()['menu-bar-background-image']).toMatch(/^linear-gradient\(0deg/);
});

test('a gradient accent color survives export and import', () => {
    const theme = customThemeManager.createGradientTheme(
        'Accented',
        '',
        stops,
        '#00aa00',
        {direction: 45},
        Theme.defaults.light
    );
    const exported = theme.export();
    expect(exported.accent.primaryColor).toBe('#00aa00');

    const reloaded = CustomTheme.import(exported);
    expect(reloaded.getGuiColors()['looks-secondary']).toBe('#00aa00');
    customThemeManager.themes.set(reloaded.uuid, reloaded);
    expect(customThemeManager.getThemeGradientInfo(reloaded.uuid).primaryColor).toBe('#00aa00');
});

test('renaming an imported gradient theme keeps its accent and menu bar text color', () => {
    const imported = CustomTheme.import({
        uuid: 'custom-theme-rename',
        name: 'Original',
        gui: 'light',
        blocks: 'three',
        accent: {colors: stops, direction: '90', primaryColor: '#00aa00'},
        menuBarForeground: '#111111'
    });
    customThemeManager.themes.set(imported.uuid, imported);

    const renamed = customThemeManager.updateTheme(imported.uuid, {name: 'Renamed', description: ''});
    const exported = renamed.export();

    expect(renamed.uuid).toBe(imported.uuid);
    expect(exported.accent.primaryColor).toBe('#00aa00');
    expect(exported.accent.colors.map(stop => stop.color)).toEqual(['#123456', '#abcdef']);
    expect(exported.menuBarForeground).toBe('#111111');
});

test('saving the current look from a gradient theme keeps the gradient', () => {
    const current = CustomTheme.import({
        name: 'Active gradient',
        gui: 'dark',
        blocks: 'three',
        accent: {colors: stops, direction: '135'}
    });

    const saved = customThemeManager.createFromCurrentTheme(current, 'Snapshot');

    expect(saved.getGuiColors()['menu-bar-background-image'])
        .toBe(current.getGuiColors()['menu-bar-background-image']);
    expect(saved.export().accent.direction).toBe('135');
});
