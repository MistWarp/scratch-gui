import {challengeDatesValid, spaceCreatePayload, withSpaceQuery} from '../../src/community/pages/Spaces.jsx';

jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

describe('Spaces browsing and creation', () => {
    test('stores a trimmed search without dropping the selected kind', () => {
        const params = withSpaceQuery(new URLSearchParams('kind=challenge'), '  game jam  ');
        expect(params.toString()).toBe('kind=challenge&q=game+jam');
    });

    test('removes an empty search from the URL', () => {
        const params = withSpaceQuery(new URLSearchParams('kind=studio&q=old'), '  ');
        expect(params.toString()).toBe('kind=studio');
    });

    test('requires a challenge to close after it opens', () => {
        expect(challengeDatesValid('2026-08-23T10:00', '2026-08-23T11:00')).toBe(true);
        expect(challengeDatesValid('2026-08-23T11:00', '2026-08-23T10:00')).toBe(false);
        expect(challengeDatesValid('', '')).toBe(false);
    });

    test('trims space fields and drops a stale challenge schedule for other types', () => {
        expect(spaceCreatePayload({
            title: '  Art club  ',
            description: '  Weekly projects  ',
            kind: 'studio',
            visibility: 'public',
            startsAt: '2026-08-23T10:00',
            endsAt: '2026-08-23T11:00'
        })).toMatchObject({
            title: 'Art club',
            description: 'Weekly projects',
            startsAt: 0,
            endsAt: 0,
            openSubmissions: true
        });
    });
});
