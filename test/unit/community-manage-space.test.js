import {
    buildSpacePatch,
    scheduleIsValid,
    spaceConfirmationDetails,
    spaceTimestamp
} from '../../src/community/pages/ManageSpace.jsx';

jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

describe('ManageSpace schedule validation', () => {
    test('requires open, close, and judging dates in order', () => {
        expect(scheduleIsValid({startsAt: 100, endsAt: 200, judgingEndsAt: 300})).toBe(true);
        expect(scheduleIsValid({startsAt: 200, endsAt: 100, judgingEndsAt: 300})).toBe(false);
        expect(scheduleIsValid({startsAt: 100, endsAt: 300, judgingEndsAt: 200})).toBe(false);
        expect(scheduleIsValid({startsAt: 0, endsAt: 200, judgingEndsAt: 300})).toBe(false);
    });

    test('normalizes ISO schedule values before comparing or editing', () => {
        expect(scheduleIsValid({
            startsAt: '2026-08-23T10:00:00Z',
            endsAt: '2026-08-23T11:00:00Z',
            judgingEndsAt: '2026-08-24T11:00:00Z'
        })).toBe(true);
        expect(spaceTimestamp('not a date')).toBe(0);
    });
});

describe('ManageSpace confirmations', () => {
    const space = {title: 'Animation Club'};

    test('explains that removing a project does not delete it', () => {
        expect(spaceConfirmationDetails({
            type: 'remove-project',
            project: {title: 'Walk Cycle'}
        }, space)).toEqual({
            title: 'Remove project?',
            body: 'Remove Walk Cycle from Animation Club? The project itself will not be deleted.',
            action: 'Remove project'
        });
    });

    test('makes irreversible results and space actions clear', () => {
        expect(spaceConfirmationDetails({type: 'publish-results'}, space).body)
            .toContain('cannot hide');
        expect(spaceConfirmationDetails({type: 'delete-space'}, space)).toEqual({
            title: 'Delete Animation Club?',
            body: 'This permanently deletes the space. Its projects will not be deleted.',
            action: 'Delete space'
        });
    });
});

describe('ManageSpace save snapshots', () => {
    const form = {
        title: 'Animation Club',
        description: 'A space',
        visibility: 'public',
        openSubmissions: true,
        theme: 'Movement',
        rules: 'Be kind',
        startsAt: 100,
        endsAt: 200,
        judgingEndsAt: 300,
        communityVoting: true,
        criteria: [{id: 'story', name: 'Story', weight: 2}]
    };

    test('includes the current schedule in one save payload', () => {
        expect(buildSpacePatch(form, 'schedule', false)).toMatchObject({
            startsAt: 100,
            endsAt: 200,
            judgingEndsAt: 300
        });
    });

    test('does not overwrite criteria after scoring has started', () => {
        expect(buildSpacePatch(form, 'judging', true)).toMatchObject({communityVoting: true});
        expect(buildSpacePatch(form, 'judging', true)).not.toHaveProperty('criteria');
        expect(buildSpacePatch(form, 'judging', false).criteria).toEqual(form.criteria);
    });
});
