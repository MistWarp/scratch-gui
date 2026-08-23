import {SECTIONS, normalizeCollaborators} from '../../src/community/pages/ManageProject.jsx';

jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

describe('ManageProject navigation', () => {
    test('includes every implemented management page', () => {
        expect(SECTIONS.map(section => section.key)).toEqual([
            'overview',
            'buyers',
            'diagnostics',
            'feedback',
            'preview',
            'team',
            'settings'
        ]);
    });

    test('normalizes the exact team snapshot sent to the server', () => {
        expect(normalizeCollaborators([
            {username: '  Sophie  ', role: 'maintainer'},
            {username: '   ', role: 'tester'}
        ])).toEqual([
            {username: 'Sophie', role: 'maintainer'}
        ]);
    });
});
