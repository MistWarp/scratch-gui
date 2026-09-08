describe('system contrast preferences', () => {
    const originalMatchMedia = window.matchMedia;
    afterEach(() => {
        window.matchMedia = originalMatchMedia;
        localStorage.clear();
    });

    test.each([false, true])('high contrast with dark mode %s returns a usable theme', dark => {
        jest.resetModules();
        window.matchMedia = query => ({matches: query.includes('contrast') || dark});
        const {detectTheme, applyThemeVisuals} = require('../../../src/lib/themes/themePersistance');
        const theme = detectTheme();
        expect(theme.gui).toBe(dark ? 'dark' : 'light');
        expect(theme.blocks).toBe('high-contrast');
        expect(() => applyThemeVisuals(theme)).not.toThrow();
    });
});
