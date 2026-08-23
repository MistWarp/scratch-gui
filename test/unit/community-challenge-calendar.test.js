import {buildChallengeCalendar, calendarDay} from '../../src/community/components/ChallengeCalendar.jsx';

describe('Challenge calendar dates', () => {
    test('accepts ISO schedules and keeps inclusive calendar-day spans', () => {
        const calendar = buildChallengeCalendar([{
            _id: 'challenge',
            startsAt: '2026-10-24T12:00:00+01:00',
            endsAt: '2026-10-26T12:00:00Z'
        }], '2026-10-25T12:00:00Z');

        expect(calendar.events[0].span).toBe(3);
        expect(calendar.events[0].startDay).toBe(calendarDay('2026-10-24T12:00:00+01:00'));
    });

    test('drops invalid or backwards schedules', () => {
        expect(buildChallengeCalendar([{startsAt: 'bad', endsAt: 'also bad'}])).toBe(false);
        expect(buildChallengeCalendar([{startsAt: '2026-08-25', endsAt: '2026-08-24'}])).toBe(false);
    });
});
