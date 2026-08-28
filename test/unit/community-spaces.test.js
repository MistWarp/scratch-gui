import React from 'react';
import {shallow} from 'enzyme';
import {
    challengeDatesValid,
    mergeSpaces,
    normalizeSpaceParams,
    spaceCreatePayload,
    withSpaceCreate,
    withSpaceQuery
} from '../../src/community/pages/Spaces.jsx';
import SpaceCard, {spaceFollowerCount, spaceProjectCount} from '../../src/community/components/SpaceCard.jsx';

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

    test('canonicalizes fallback space filters and creation state', () => {
        expect(normalizeSpaceParams(new URLSearchParams('kind=unknown&q=++club++&group=+makers+&create=yes')).toString())
            .toBe('q=club&group=makers');
        expect(normalizeSpaceParams(new URLSearchParams('kind=studio&create=1')).toString()).toBe('create=1');
    });

    test('opens and closes the creation panel through URL state', () => {
        expect(withSpaceCreate(new URLSearchParams('kind=challenge'), true).toString()).toBe('kind=challenge&create=1');
        expect(withSpaceCreate(new URLSearchParams('kind=challenge&create=1&group=makers'), false).toString())
            .toBe('kind=challenge');
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

    test('space cards use lightweight list counts without full member or project arrays', () => {
        const space = {projectCount: 17, followerCount: 9, projects: [], followers: []};
        expect(spaceProjectCount(space)).toBe(17);
        expect(spaceFollowerCount(space)).toBe(9);
    });

    test('space cards still accept full detail responses', () => {
        const space = {projects: [{id: 'a'}, {id: 'b'}], followers: ['one']};
        expect(spaceProjectCount(space)).toBe(2);
        expect(spaceFollowerCount(space)).toBe(1);
    });

    test('space cards show ISO deadlines and omit malformed deadlines', () => {
        const base = {
            _id: 'challenge',
            kind: 'challenge',
            title: 'Game jam',
            projects: [],
            endsAt: '2999-01-01T00:00:00Z'
        };
        expect(shallow(<SpaceCard space={base} />).text()).toContain('Ends');
        expect(shallow(<SpaceCard space={{...base, endsAt: 'bad-date'}} />).text()).not.toContain('Invalid Date');
    });

    test('later pages replace duplicate space rows without changing order', () => {
        expect(mergeSpaces(
            [{_id: 'a', title: 'A'}, {_id: 'b', title: 'Old B'}],
            [{_id: 'b', title: 'New B'}, {_id: 'c', title: 'C'}]
        )).toEqual([
            {_id: 'a', title: 'A'},
            {_id: 'b', title: 'New B'},
            {_id: 'c', title: 'C'}
        ]);
    });
});
