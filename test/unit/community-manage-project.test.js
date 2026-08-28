import {
    SECTIONS,
    normalizeCollaborators,
    normalizeProjectSectionParam,
    projectNavigationState,
    projectTransferConfirmation
} from '../../src/community/pages/ManageProject.jsx';

jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

describe('ManageProject navigation', () => {
    test('includes every implemented management page', () => {
        expect(SECTIONS.map(section => section.key)).toEqual([
            'overview',
            'page',
            'publishing',
            'sales',
            'collaboration',
            'activity',
            'ownership'
        ]);
    });

    test('normalizes the exact team snapshot sent to the server', () => {
        expect(normalizeCollaborators([
            {username: '  Sophie  ', role: 'maintainer'},
            {username: '   ', role: 'tester'}
        ])).toEqual([
            {username: 'Sophie', role: 'maintainer', share: 0}
        ]);
    });

    test('states the ownership loss before a project transfer', () => {
        expect(projectTransferConfirmation({title: 'Orbit'}, 'Alex')).toEqual({
            title: 'Transfer project?',
            body: 'Transfer "Orbit" to @Alex? You will lose owner access.',
            action: 'Transfer to @Alex'
        });
    });

    test('normalizes old routes and preserves subtab routes', () => {
        expect(normalizeProjectSectionParam('settings')).toBe('page');
        expect(normalizeProjectSectionParam('preview')).toBe('publishing');
        expect(normalizeProjectSectionParam('buyers')).toBe('buyers');
        expect(normalizeProjectSectionParam('bounties')).toBe('bounties');
        expect(normalizeProjectSectionParam('unknown')).toBe('');
    });

    test('restores sidebar and subtab state from navigation history', () => {
        expect(projectNavigationState('buyers')).toEqual({
            section: 'sales',
            salesTab: 'buyers',
            collaborationTab: 'team',
            activityTab: 'feedback'
        });
        expect(projectNavigationState('bounties')).toEqual({
            section: 'collaboration',
            salesTab: 'pricing',
            collaborationTab: 'bounties',
            activityTab: 'feedback'
        });
        expect(projectNavigationState('diagnostics')).toEqual({
            section: 'activity',
            salesTab: 'pricing',
            collaborationTab: 'team',
            activityTab: 'diagnostics'
        });
    });
});
