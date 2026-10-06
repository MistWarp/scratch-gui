import {ensureScopes, getRotur} from '../../src/lib/rotur/client.js';
import {
    claimDailyCredits,
    getDailyWait,
    getWallet,
    normalizeTransactions
} from '../../src/lib/rotur/wallet.js';

jest.mock('../../src/lib/rotur/client.js', () => ({
    ensureScopes: jest.fn(),
    getRotur: jest.fn()
}));

const apiError = (status, data) => Object.assign(new Error(data.error || 'error'), {status, data});

describe('Rotur wallet', () => {
    let me;

    beforeEach(() => {
        jest.clearAllMocks();
        me = {get: jest.fn(), claimDaily: jest.fn(), claimTime: jest.fn()};
        getRotur.mockReturnValue({loggedIn: true, me});
        ensureScopes.mockResolvedValue(true);
    });

    test('reads the balance and transactions from Rotur, newest first', async () => {
        me.get.mockResolvedValue({
            'sys.currency': 120.456,
            'sys.transactions': [
                {type: 'out', user: 'kit', amount: 5, note: 'Starfall', time: 1700000000000, new_total: 120.45},
                {type: 'in', user: 'rotur', amount: 3, note: 'Daily claim', time: 1700000100},
                {type: 'in', user: 'nobody', amount: 0, time: 1700000200000}
            ]
        });
        const wallet = await getWallet();
        expect(ensureScopes).toHaveBeenCalledWith(['credits:view']);
        expect(wallet.allowed).toBe(true);
        expect(wallet.balance).toBe(120.46);
        expect(wallet.transactions.map(transaction => transaction.note)).toEqual(['Daily claim', 'Starfall']);
        expect(wallet.transactions[0]).toMatchObject({incoming: true, amount: 3, user: 'rotur', time: 1700000100000});
        expect(wallet.transactions[1]).toMatchObject({incoming: false, amount: 5, total: 120.45});
    });

    test('says so without asking when this sign-in cannot see credits', async () => {
        ensureScopes.mockResolvedValue(false);
        expect(await getWallet()).toEqual({allowed: false, balance: null, transactions: []});
        expect(me.get).not.toHaveBeenCalled();
    });

    test('treats a hidden balance as not allowed', async () => {
        me.get.mockResolvedValue({username: 'sam'});
        expect((await getWallet()).allowed).toBe(false);
    });

    test('claims daily credits, asking for the permission from the click', async () => {
        me.claimDaily.mockResolvedValue({message: 'Daily claim successful'});
        expect(await claimDailyCredits()).toEqual({claimed: true});
        expect(ensureScopes).toHaveBeenCalledWith(['credits:daily'], {prompt: true});
    });

    test('reports how long to wait when today is already claimed', async () => {
        me.claimDaily.mockRejectedValue(apiError(429, {error: 'Daily claim already made', wait_time: 7200}));
        expect(await claimDailyCredits()).toEqual({claimed: false, waitMs: 7200000});
    });

    test('does not claim when the permission is refused', async () => {
        ensureScopes.mockResolvedValue(false);
        expect(await claimDailyCredits()).toEqual({claimed: false, denied: true});
        expect(me.claimDaily).not.toHaveBeenCalled();
    });

    test('reads the wait before the next claim without prompting', async () => {
        me.claimTime.mockResolvedValue({wait_time: 60});
        expect(await getDailyWait()).toBe(60000);
        expect(ensureScopes).toHaveBeenCalledWith(['credits:daily']);
        me.claimTime.mockRejectedValue(apiError(400, {error: 'No daily claim found'}));
        expect(await getDailyWait()).toBe(0);
        ensureScopes.mockResolvedValue(false);
        expect(await getDailyWait()).toBe(null);
    });

    test('ignores transactions that are not objects', () => {
        expect(normalizeTransactions(null)).toEqual([]);
        expect(normalizeTransactions([null, 'x'])).toEqual([]);
    });
});
