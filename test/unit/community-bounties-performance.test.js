import {mapWithConcurrency} from '../../src/community/pages/Bounties.jsx';

describe('bounty project hydration', () => {
    test('limits concurrent project requests without changing result order', async () => {
        let active = 0;
        let peak = 0;
        const result = await mapWithConcurrency([1, 2, 3, 4, 5, 6], 2, async value => {
            active++;
            peak = Math.max(peak, active);
            await new Promise(resolve => setTimeout(resolve, 1));
            active--;
            return value * 2;
        });

        expect(result).toEqual([2, 4, 6, 8, 10, 12]);
        expect(peak).toBe(2);
    });
});
