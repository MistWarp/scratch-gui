import {
    challengeAudienceJudged,
    challengePhase,
    challengeWinner,
    challengeRating,
    challengeRatingsReady,
    challengeScore,
    challengeWeightedScore,
    nextUnscoredEntry
} from '../../src/community/pages/Challenge.jsx';
import {confettiPieces} from '../../src/community/components/Confetti.jsx';
import {selectRecentWinner, WINNER_SHOWCASE_MS} from '../../src/community/components/HomeWorkspace.jsx';

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

    test('only treats explicit audience mode as audience-voted', () => {
        expect(challengeAudienceJudged({votingMode: 'audience'})).toBe(true);
        expect(challengeAudienceJudged({votingMode: 'judges', communityVoting: true})).toBe(false);
        expect(challengeAudienceJudged({})).toBe(false);
        expect(challengeAudienceJudged(null)).toBe(false);
    });

    test('clamps audience averages for the star display', () => {
        expect(challengeRating('4.25')).toBe(4.25);
        expect(challengeRating(7)).toBe(5);
        expect(challengeRating(null)).toBe(0);
        expect(challengeRating('invalid')).toBe(0);
    });

    test('weights the overall judge score like the server', () => {
        const criteria = [{id: 'design', weight: 1}, {id: 'code', weight: 3}];
        expect(challengeWeightedScore(criteria, {design: 4, code: 8})).toBe(7);
        expect(challengeWeightedScore(criteria, {design: 4})).toBe(0);
    });

    test('moves to the next entry the judge has not scored', () => {
        const projects = [
            {id: 'a', myScore: {edited: 1}},
            {id: 'b'},
            {id: 'c', myScore: {edited: 1}},
            {id: 'd'}
        ];
        expect(nextUnscoredEntry(projects, '').id).toBe('b');
        expect(nextUnscoredEntry(projects, 'b').id).toBe('d');
        expect(nextUnscoredEntry(projects, 'd').id).toBe('b');
        expect(nextUnscoredEntry([{id: 'a'}], 'a')).toBe(null);
    });

    test('only names a winner once results are published', () => {
        const projects = [{id: 'b', place: 2, judgeScore: 6}, {id: 'a', place: 1, owner: 'ann', judgeScore: 8, audienceScore: 4, audienceVoteCount: 3}];
        expect(challengeWinner({projects})).toBe(null);
        expect(challengeWinner({resultsPublishedAt: 5, projects})).toMatchObject({id: 'a', score: 8, scoreOutOf: 10});
        expect(challengeWinner({resultsPublishedAt: 5, votingMode: 'audience', projects})).toMatchObject({id: 'a', score: 4, scoreOutOf: 5, voteCount: 3});
        expect(challengeWinner({resultsPublishedAt: 5, winner: {id: 'z', owner: 'zed'}, projects})).toMatchObject({id: 'z'});
    });

    test('shows the most recent winner from the last two weeks on the home page', () => {
        const now = 100 * 86400000;
        const spaces = [
            {_id: 'old', resultsPublishedAt: now - WINNER_SHOWCASE_MS - 1, winner: {id: 'p1'}},
            {_id: 'recent', resultsPublishedAt: now - 1000, winner: {id: 'p2'}},
            {_id: 'older', resultsPublishedAt: now - 86400000, winner: {id: 'p3'}},
            {_id: 'none', resultsPublishedAt: now, winner: {}}
        ];
        expect(selectRecentWinner(spaces, now)._id).toBe('recent');
        expect(selectRecentWinner([spaces[0]], now)).toBeUndefined();
    });

    test('generates confetti inside the viewport', () => {
        let seed = 0;
        const random = () => {
            seed = (seed + 0.37) % 1;
            return seed;
        };
        const pieces = confettiPieces(20, random);
        expect(pieces).toHaveLength(20);
        pieces.forEach(piece => {
            expect(piece.left).toBeGreaterThanOrEqual(0);
            expect(piece.left).toBeLessThanOrEqual(100);
            expect(piece.duration).toBeGreaterThan(2);
        });
    });
});
