import React from 'react';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';
import {
    challengeDatesValid,
    mergeSpaces,
    normalizeSpaceParams,
    spaceCreatePayload,
    withSpaceCreate,
    withSpaceQuery
} from '../../src/community/pages/Spaces.jsx';
import SpaceCard, {spaceFollowerCount, spaceProjectCount} from '../../src/community/components/SpaceCard.jsx';

const card = (space, props = {}) => mount(
    <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
        <SpaceCard
            space={space}
            to={`/spaces/${space._id}`}
            {...props}
        />
    </MemoryRouter>
);

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

    test('space cards show aggregate playtime for studios and collections', () => {
        const studio = card({_id: 's', kind: 'studio', title: 'Studio', totalPlaytimeMs: 3600000});
        const collection = card({_id: 'c', kind: 'collection', title: 'Collection', totalPlaytimeMs: 1800000});

        expect(studio.text()).toContain('1h played');
        expect(collection.text()).toContain('30m played');
    });

    test('space cards show ISO deadlines and omit malformed deadlines', () => {
        const base = {
            _id: 'challenge',
            kind: 'challenge',
            title: 'Game jam',
            projects: [],
            endsAt: '2999-01-01T00:00:00Z'
        };
        expect(card(base).text()).toContain('Ends');
        expect(card({...base, endsAt: 'bad-date'}).text()).not.toContain('Invalid Date');
        expect(card({...base, endsAt: 'bad-date'}).text()).not.toContain('Ends');
    });

    test('space cards use the shared game card, with the owner and a cover', () => {
        const wrapper = card({
            _id: 'studio-1',
            kind: 'studio',
            title: 'Platformers',
            description: 'Jump around',
            owner: 'Sophie',
            projects: [{id: '1', thumbUrl: 'https://example.com/thumb.png'}],
            projectCount: 12,
            followerCount: 1
        });
        expect(wrapper.find('article').exists()).toBe(true);
        expect(wrapper.find('img').first()
            .prop('src')).toBe('https://example.com/thumb.png');
        expect(wrapper.find('a[href="/users/Sophie"]').text()).toContain('Sophie');
        expect(wrapper.find('a[href="/spaces/studio-1"]').length).toBe(2);
        expect(wrapper.text()).toContain('Jump around');
        expect(wrapper.text()).toContain('12 projects');
        expect(wrapper.text()).toContain('1 follower');
        expect(wrapper.text()).not.toContain('Studio');
    });

    test('space cards name their kind only where kinds are mixed', () => {
        const space = {_id: 'c', kind: 'challenge', title: 'Jam', description: 'Make a game', participantCount: 4};
        expect(card(space, {showKind: true}).text()).toContain('Challenge · Make a game');
        expect(card(space).text()).not.toContain('Challenge');
        expect(card(space).text()).toContain('4 joined');
        expect(card(space).text()).toContain('0 submissions');
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
