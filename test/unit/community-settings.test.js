import {
    getProjectThemeMode,
    matchesDeleteConfirmation,
    normalizeSettingsParams,
    settingsLoadState,
    settingsParamsForSection,
    settingsSection,
    settingsThemeTab
} from '../../src/community/pages/Settings.jsx';
import {customThemesTab} from '../../src/components/tw-settings-modal/custom-themes-page.jsx';

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

    test('opens valid custom-theme deep links on the requested inner tab', () => {
        expect(customThemesTab('create')).toBe('create');
        expect(customThemesTab('import')).toBe('import');
        expect(customThemesTab('missing')).toBe('library');
    });

    test('canonicalizes tabs for the active Settings section', () => {
        expect(normalizeSettingsParams(new URLSearchParams('section=data&tab=custom&themeAction=create')).toString())
            .toBe('section=data');
        expect(normalizeSettingsParams(new URLSearchParams('section=theme&tab=games')).toString()).toBe('');
        expect(normalizeSettingsParams(new URLSearchParams('tab=custom&themeAction=create')).toString())
            .toBe('tab=custom&themeAction=create');
        expect(normalizeSettingsParams(new URLSearchParams('tab=custom&themeAction=import')).toString())
            .toBe('tab=custom&themeAction=import');
        expect(normalizeSettingsParams(new URLSearchParams('tab=custom&themeAction=missing')).toString())
            .toBe('tab=custom');
    });

    test('clears section-specific state when the sidebar destination changes', () => {
        expect(settingsParamsForSection(
            new URLSearchParams('tab=custom&themeAction=create&keep=value'),
            'data'
        ).toString()).toBe('keep=value&section=data');
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

    test('does not treat failed settings data as a ready empty dataset', () => {
        expect(settingsLoadState(true, '')).toBe('loading');
        expect(settingsLoadState(false, 'Could not load.')).toBe('error');
        expect(settingsLoadState(false, '')).toBe('ready');
    });
});
