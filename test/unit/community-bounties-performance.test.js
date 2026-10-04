import {applyBountyProject, mapWithConcurrency} from '../../src/community/pages/Bounties.jsx';

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

describe('bounty project placeholders', () => {
    const entries = [
        {bounty: {id: 'b1', resource_id: 'p1'}, project: null, status: 'loading'},
        {bounty: {id: 'b2', resource_id: 'p2'}, project: null, status: 'loading'},
        {bounty: {id: 'b3', resource_id: 'p1'}, project: null, status: 'loading'}
    ];

    test('fills in every bounty on a public project', () => {
        const project = {id: 'p1', shared: true, visibility: 'public', title: 'Game'};
        expect(applyBountyProject(entries, 'p1', {project})).toEqual([
            {bounty: entries[0].bounty, project, status: 'ready'},
            entries[1],
            {bounty: entries[2].bounty, project, status: 'ready'}
        ]);
    });

    test('keeps a bounty whose project failed to load, with a placeholder', () => {
        const error = Object.assign(new Error('offline'), {code: 'network'});
        expect(applyBountyProject(entries, 'p2', {error})[1]).toEqual({
            bounty: entries[1].bounty, project: null, status: 'failed'
        });
    });

    test('drops bounties on projects that are not public', () => {
        expect(applyBountyProject(entries, 'p1', {project: {id: 'p1', shared: false}})).toEqual([entries[1]]);
        expect(applyBountyProject(entries, 'p2', {error: {status: 404}})).toHaveLength(2);
    });
});
