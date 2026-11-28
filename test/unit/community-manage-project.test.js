import {
    SECTIONS,
    normalizeCollaborators,
    normalizeProjectSectionParam,
    projectNavigationState,
    projectTransferConfirmation,
    transferKind
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
            'products',
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
        expect(projectTransferConfirmation({title: 'Orbit', ownerType: 'org'}, 'Alex').body)
            .toBe('Transfer "Orbit" to @Alex? The organisation will no longer own it.');
    });

    test('moving a project into or out of an organisation is not a hand-off', () => {
        expect(projectTransferConfirmation({title: 'Orbit'}, 'studio', 'org')).toEqual({
            title: 'Move project to an organisation?',
            body: 'Move "Orbit" to @studio? Members who can publish for the organisation will manage it.',
            action: 'Move to @studio'
        });
        expect(projectTransferConfirmation({title: 'Orbit'}, 'ada', 'self').action).toBe('Move to your account');
        const orgs = [{username: 'Studio'}];
        expect(transferKind({project: {ownerType: ''}, nextOwner: 'studio', viewerName: 'ada', orgs})).toBe('org');
        expect(transferKind({project: {ownerType: 'org'}, nextOwner: 'Ada', viewerName: 'ada', orgs})).toBe('self');
        expect(transferKind({project: {ownerType: ''}, nextOwner: 'ada', viewerName: 'ada', orgs})).toBe('person');
        expect(transferKind({project: {ownerType: 'org'}, nextOwner: 'bob', viewerName: 'ada', orgs})).toBe('person');
    });

    test('normalizes old routes and preserves subtab routes', () => {
        expect(normalizeProjectSectionParam('settings')).toBe('page');
        expect(normalizeProjectSectionParam('preview')).toBe('publishing');
        expect(normalizeProjectSectionParam('sales')).toBe('products');
        expect(normalizeProjectSectionParam('buyers')).toBe('products');
        expect(normalizeProjectSectionParam('products')).toBe('products');
        expect(normalizeProjectSectionParam('bounties')).toBe('bounties');
        expect(normalizeProjectSectionParam('unknown')).toBe('');
    });

    test('restores sidebar and subtab state from navigation history', () => {
        expect(projectNavigationState('sales')).toEqual({
            section: 'products',
            collaborationTab: 'team',
            activityTab: 'feedback'
        });
        expect(projectNavigationState('bounties')).toEqual({
            section: 'collaboration',
            collaborationTab: 'bounties',
            activityTab: 'feedback'
        });
        expect(projectNavigationState('diagnostics')).toEqual({
            section: 'activity',
            collaborationTab: 'team',
            activityTab: 'diagnostics'
        });
    });
});
