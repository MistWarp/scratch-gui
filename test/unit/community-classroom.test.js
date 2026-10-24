import IntlMessageFormat from 'intl-messageformat';
import {
    auditSentence,
    freeSeats,
    fromLocalInputs,
    initials,
    isOverdue,
    joinUrl,
    normalizeClassCode,
    parseStudentNames,
    percentOf,
    relativeTime,
    submissionLabel,
    submissionState,
    toLocalInputs
} from '../../src/community/classroom.js';

jest.mock('../../src/community/locale', () => ({getCommunityLocale: () => 'en'}));

const text = (key, values = {}) => new IntlMessageFormat(key, 'en').format(values);

describe('classroom helpers', () => {
    test('class codes are uppercased and forgiving about spaces and dashes', () => {
        expect(normalizeClassCode(' fb2h-v829 ')).toBe('FB2HV829');
        expect(normalizeClassCode('8gx ev efy')).toBe('8GXEVEFY');
        expect(normalizeClassCode(null)).toBe('');
        expect(joinUrl('fb2hv829')).toBe('https://mistwarp.org/classroom/join/FB2HV829');
    });

    test('student names are trimmed, deduplicated, and limited to 40 characters', () => {
        const names = parseStudentNames(`  Ada   Okafor \n\nben carter\nBen Carter\n${'x'.repeat(50)}`);
        expect(names).toEqual(['Ada Okafor', 'ben carter', 'x'.repeat(40)]);
    });

    test('submission states map to badges including late turn-ins', () => {
        expect(submissionState(null)).toBe('not_started');
        expect(submissionState({state: 'started'})).toBe('started');
        expect(submissionState({state: 'turned_in', late: false})).toBe('turned_in');
        expect(submissionState({state: 'turned_in', late: true})).toBe('late');
        expect(submissionState({state: 'returned', late: true})).toBe('returned');
        expect(submissionLabel('late')).toBe('Turned in late');
        expect(submissionLabel('unknown')).toBe('Not started');
    });

    test('seat and usage maths never go negative', () => {
        expect(freeSeats({seats: 40}, {seats: 13})).toBe(27);
        expect(freeSeats({seats: 10}, {seats: 12})).toBe(0);
        expect(percentOf(50, 200)).toBe(25);
        expect(percentOf(5, 0)).toBe(0);
        expect(percentOf(300, 200)).toBe(100);
    });

    test('due dates round-trip through the date and time inputs', () => {
        const due = new Date(2026, 9, 2, 10, 30).getTime();
        expect(toLocalInputs(due)).toEqual({date: '2026-10-02', time: '10:30'});
        expect(fromLocalInputs('2026-10-02', '10:30')).toBe(due);
        expect(fromLocalInputs('', '10:30')).toBe(0);
        expect(toLocalInputs(0)).toEqual({date: '', time: ''});
        expect(isOverdue(Date.now() - 1000)).toBe(true);
        expect(isOverdue(Date.now() + 100000)).toBe(false);
        expect(isOverdue(0)).toBe(false);
    });

    test('relative times read naturally', () => {
        const now = Date.now();
        expect(relativeTime(now - (2 * 3600 * 1000), now)).toBe('2 hours ago');
        expect(relativeTime(now - (26 * 3600 * 1000), now)).toBe('yesterday');
        expect(relativeTime(0)).toBe('');
        expect(initials('Ada Okafor')).toBe('AO');
        expect(initials('mia')).toBe('M');
    });

    test('audit events become readable sentences', () => {
        const options = {
            text,
            studentName: id => (id === 's1' ? 'Ada Okafor' : 'a student'),
            assignmentTitle: id => (id === 'a1' ? 'Maze game' : 'an assignment')
        };
        expect(auditSentence({
            action: 'students_created', actor: 'Mist', detail: {count: 8}
        }, options))
            .toBe('Mist added 8 students.');
        expect(auditSentence({
            action: 'student_updated', actor: 'Mist', detail: {disabled: true, studentId: 's1'}
        }, options))
            .toBe('Mist disabled Ada Okafor.');
        expect(auditSentence({
            action: 'submission_reviewed', actor: 'Mist', detail: {returned: true, studentId: 's1'}
        }, options))
            .toBe('Mist returned the work of Ada Okafor.');
        expect(auditSentence({
            action: 'assignment_created', actor: 'Mist', detail: {assignmentId: 'a1'}
        }, options))
            .toBe('Mist created the assignment Maze game.');
        expect(auditSentence({
            action: 'something_new', actor: 'Mist', detail: {}
        }, options))
            .toBe('Mist updated the class settings.');
    });
});
