import {challengePhase, challengeRatingsReady, challengeScore} from '../../src/community/pages/Challenge.jsx';

describe('Challenge state', () => {
    test('calculates phases from numeric or ISO dates', () => {
        const now = Date.parse('2026-08-23T12:00:00Z');
        expect(challengePhase({startsAt: '2026-08-24T12:00:00Z'}, now)).toBe('upcoming');
        expect(challengePhase({startsAt: now - 1000, endsAt: now + 1000}, now)).toBe('submissions');
        expect(challengePhase({endsAt: now - 1000, judgingEndsAt: now + 1000}, now)).toBe('judging');
        expect(challengePhase({resultsPublishedAt: now}, now)).toBe('results');
        expect(challengePhase({resultsPublishedAt: '0'}, now)).toBe('awaiting-results');
    });

    test('requires every judging score to be between 1 and 10', () => {
        const criteria = [{id: 'design'}, {id: 'code'}];
        expect(challengeRatingsReady(criteria, {design: 8, code: 10})).toBe(true);
        expect(challengeRatingsReady(criteria, {design: 8, code: ''})).toBe(false);
        expect(challengeRatingsReady(criteria, {design: 11, code: 5})).toBe(false);
    });

    test('formats numeric and serialized scores without crashing', () => {
        expect(challengeScore('8.25')).toBe('8.3');
        expect(challengeScore(null)).toBe('No score');
        expect(challengeScore('invalid')).toBe('No score');
    });
});
