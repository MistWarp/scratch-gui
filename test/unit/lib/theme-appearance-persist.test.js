import {Theme} from '../../../src/lib/themes/index.js';
import {applyTheme, applyThemeVisuals} from '../../../src/lib/themes/themePersistance.js';
import {getMenuBarLayout} from '../../../src/lib/mw-menu-bar-layout.js';
import {getStyleSetting} from '../../../src/lib/mw-style-settings.js';

const savedLayout = {orders: {left: ['edit', 'file']}, hidden: ['feedback']};
const normalizedSavedLayout = {orders: {left: ['edit', 'file'], right: []}, hidden: ['feedback']};

const withAppearance = appearance => new Theme(
    Theme.defaults.dark.accent,
    Theme.defaults.dark.gui,
    Theme.defaults.dark.blocks,
    Theme.defaults.dark.menuBarAlign,
    Theme.defaults.dark.wallpaper,
    Theme.defaults.dark.fonts,
    null,
    appearance
);

beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('mw:menu-bar-order-v7', JSON.stringify(savedLayout.orders));
    localStorage.setItem('mw:menu-bar-hidden', JSON.stringify(savedLayout.hidden));
    localStorage.setItem('mw:style-tab-style', 'turbowarp');
});

const layoutCss = () => document.getElementById('mw-menu-bar-layout').textContent;

test('previewing a theme without an appearance leaves the saved layout alone', () => {
    applyThemeVisuals(withAppearance({}));

    expect(getMenuBarLayout()).toEqual(normalizedSavedLayout);
    expect(getStyleSetting('tab-style')).toBe('turbowarp');
    expect(layoutCss()).toBe('');
});

test('previewing a theme with its own appearance renders it without saving it', () => {
    applyThemeVisuals(withAppearance({
        menuBarLayout: {orders: {left: ['tools']}, hidden: ['share']},
        styles: {'tab-style': 'scratchbox'}
    }));

    expect(getMenuBarLayout()).toEqual(normalizedSavedLayout);
    expect(getStyleSetting('tab-style')).toBe('turbowarp');
    expect(layoutCss()).toContain('[data-mw-item="share"]{display:none !important;}');
    expect(layoutCss()).toContain('[data-mw-item="tools"]{order:0;}');
});

test('choosing a theme persists its appearance', () => {
    applyTheme(withAppearance({
        menuBarLayout: {orders: {left: ['tools']}, hidden: ['share']},
        styles: {'tab-style': 'scratchbox'}
    }));

    expect(getMenuBarLayout()).toEqual({
        orders: {left: ['tools'], right: []},
        hidden: ['share']
    });
    expect(getStyleSetting('tab-style')).toBe('scratchbox');
});
