import React from 'react';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';
import {
    buildChallengeCalendar,
    calendarDay,
    challengeCalendarWindow,
    default as ChallengeCalendar
} from '../../src/community/components/ChallengeCalendar.jsx';

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

    test('builds stable inclusive API bounds for the visible date window', () => {
        const first = challengeCalendarWindow('2026-08-26T01:00:00');
        const later = challengeCalendarWindow('2026-08-26T23:00:00');

        expect(later).toEqual(first);
        expect(new Date(first.endsAfter)).toEqual(new Date('2026-08-12T00:00:00'));
        expect(new Date(first.startsBefore)).toEqual(new Date('2026-11-24T23:59:59.999'));
    });

    test('renders numeric timestamp strings in event tooltips', () => {
        const startsAt = String(Date.now() + 86400000);
        const endsAt = String(Date.now() + (2 * 86400000));
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <ChallengeCalendar spaces={[{
                    _id: 'challenge',
                    title: 'Numeric dates',
                    startsAt,
                    endsAt,
                    projects: []
                }]} />
            </MemoryRouter>
        );
        const title = wrapper.find('a[href="/spaces/challenge"]').prop('title');
        expect(title).toContain('Numeric dates');
        expect(title).not.toContain('Invalid Date');
        wrapper.unmount();
    });
});
