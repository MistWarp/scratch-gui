import {
    getProjectThemeMode,
    matchesDeleteConfirmation,
    settingsSection,
    settingsThemeTab
} from '../../src/community/pages/Settings.jsx';

jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    CustomTheme: {},
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

describe('community Settings URL state', () => {
    test('normalizes settings sections', () => {
        expect(settingsSection('notifications')).toBe('notifications');
        expect(settingsSection('unknown')).toBe('theme');
    });

    test('normalizes Theme tabs', () => {
        expect(settingsThemeTab('custom')).toBe('custom');
        expect(settingsThemeTab('unknown')).toBe('appearance');
    });

    test('recovers from an invalid saved project theme mode', () => {
        localStorage.setItem('mw:project-theme-mode', 'old-mode');
        expect(getProjectThemeMode()).toBe('all');
        localStorage.setItem('mw:project-theme-mode', 'hearted');
        expect(getProjectThemeMode()).toBe('hearted');
    });

    test('accepts a pasted deletion username with surrounding spaces', () => {
        expect(matchesDeleteConfirmation('  Sophie  ', 'sophie')).toBe(true);
        expect(matchesDeleteConfirmation('someone-else', 'sophie')).toBe(false);
    });
});
