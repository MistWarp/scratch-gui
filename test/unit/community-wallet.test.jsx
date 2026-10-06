import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import api from '../../src/community/api';
import {allowWallet, claimDailyCredits, getDailyWait, getWallet} from '../../src/lib/rotur/wallet.js';
import Wallet from '../../src/community/pages/Wallet.jsx';

jest.mock('../../src/community/UserContext.jsx', () => {
    const state = {user: {username: 'wallet-user'}, loading: false};
    return {useUser: () => state};
});
jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {purchases: jest.fn()},
    projectUrl: id => `/project/${id}`
}));
jest.mock('../../src/lib/rotur/wallet.js', () => ({
    allowWallet: jest.fn(),
    claimDailyCredits: jest.fn(),
    getDailyWait: jest.fn(),
    getWallet: jest.fn()
}));

const flush = async wrapper => {
    await act(async () => {
        for (let i = 0; i < 4; i++) await Promise.resolve();
    });
    wrapper.update();
};

const render = async (path = '/wallet') => {
    const wrapper = mount(
        <MemoryRouter
            initialEntries={[path]}
            future={{v7_startTransition: true, v7_relativeSplatPath: true}}
        >
            <Wallet />
        </MemoryRouter>
    );
    await flush(wrapper);
    return wrapper;
};

const buttonWithText = (wrapper, text) => wrapper.find('button').filterWhere(button => button.text().includes(text));

describe('Wallet', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getWallet.mockResolvedValue({
            allowed: true,
            balance: 42.5,
            transactions: [
                {id: 't1', incoming: true, amount: 3, user: 'rotur', note: 'Daily claim', time: 1700000000000},
                {id: 't2', incoming: false, amount: 10, user: 'kit', note: '', time: 1700000100000}
            ]
        });
        getDailyWait.mockResolvedValue(0);
        api.purchases.mockResolvedValue({purchases: [{projectId: 'p1', title: 'Starfall', amount: 10, at: 1700000000000}]});
    });

    test('shows the Rotur balance and transactions', async () => {
        const wrapper = await render();
        const text = wrapper.text();
        expect(text).toContain('Your balance');
        expect(text).toContain('42.5');
        expect(text).toContain('Daily claim');
        expect(text).toContain('Sent credits');
        expect(text).toContain('@kit');
        expect(text).not.toContain('Starfall');
        wrapper.unmount();
    });

    test('lists MistWarp purchases on their own tab', async () => {
        const wrapper = await render('/wallet?tab=purchases');
        expect(wrapper.text()).toContain('Starfall');
        wrapper.unmount();
    });

    test('asks to show the balance when this sign-in cannot see credits', async () => {
        getWallet.mockResolvedValueOnce({allowed: false, balance: null, transactions: []});
        allowWallet.mockResolvedValue(true);
        const wrapper = await render();
        expect(wrapper.text()).toContain('Let MistWarp see your balance and transactions on Rotur.');
        await act(async () => {
            buttonWithText(wrapper, 'Show my balance').simulate('click');
        });
        await flush(wrapper);
        expect(allowWallet).toHaveBeenCalledTimes(1);
        expect(getWallet).toHaveBeenCalledTimes(2);
        expect(wrapper.text()).toContain('42.5');
        wrapper.unmount();
    });

    test('claims daily credits and refreshes the balance', async () => {
        claimDailyCredits.mockResolvedValue({claimed: true});
        const wrapper = await render();
        await act(async () => {
            buttonWithText(wrapper, 'Claim daily credits').simulate('click');
        });
        await flush(wrapper);
        expect(claimDailyCredits).toHaveBeenCalledTimes(1);
        expect(wrapper.text()).toContain('Daily credits claimed.');
        expect(getWallet).toHaveBeenCalledTimes(2);
        wrapper.unmount();
    });

    test('says when daily credits can be claimed again', async () => {
        getDailyWait.mockResolvedValue(5 * 60 * 60 * 1000);
        const wrapper = await render();
        expect(wrapper.text()).toContain('You can claim daily credits again in 5h.');
        expect(buttonWithText(wrapper, 'Claim daily credits').prop('disabled')).toBe(true);
        wrapper.unmount();
    });

    test('offers a retry when Rotur cannot be reached', async () => {
        getWallet.mockRejectedValueOnce(new Error('offline'));
        const wrapper = await render();
        expect(wrapper.text()).toContain('Could not load your balance from Rotur.');
        wrapper.unmount();
    });
});
