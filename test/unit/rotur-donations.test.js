import {donationTransactions} from '../../src/lib/rotur/client.js';

describe('Rotur donation transactions', () => {
    test('normalizes and sorts sent and received donations', () => {
        expect(donationTransactions([
            {id: 'sent', type: 'out', user: 'alex', amount: 2.345, note: 'MistWarp donation to alex', time: 100},
            {id: 'received', type: 'in', user: 'sam', amount: 5, note: 'MistWarp donation to me', time: 200},
            {id: 'purchase', type: 'out', user: 'shop', amount: 3, note: 'Project purchase', time: 300}
        ])).toEqual([
            {
                id: 'received',
                direction: 'received',
                amount: 5,
                user: 'sam',
                note: 'MistWarp donation to me',
                time: 200000
            },
            {
                id: 'sent',
                direction: 'given',
                amount: 2.35,
                user: 'alex',
                note: 'MistWarp donation to alex',
                time: 100000
            }
        ]);
    });

    test('ignores malformed donation transactions', () => {
        expect(donationTransactions(null)).toEqual([]);
        expect(donationTransactions([
            {type: 'other', amount: 2, note: 'donation'},
            {type: 'in', amount: 0, note: 'donation'}
        ])).toEqual([]);
    });
});
