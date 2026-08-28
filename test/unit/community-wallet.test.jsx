import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import {consumeBillingResult, getCommerceEarnings} from '../../src/community/credits.js';
import {getAccountSummary} from '../../src/lib/rotur/client.js';
import api from '../../src/community/api';
import Wallet from '../../src/community/pages/Wallet.jsx';

jest.mock('../../src/community/UserContext.jsx', () => {
    const state = {user: {username: 'wallet-user'}, loading: false};
    return {useUser: () => state};
});
jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {purchases: jest.fn().mockResolvedValue({purchases: []})},
    projectUrl: id => `/project/${id}`
}));
jest.mock('../../src/lib/rotur/client.js', () => ({
    claimDaily: jest.fn(),
    getAccountSummary: jest.fn().mockResolvedValue({
        balance: 10,
        donationsReceived: 0,
        donationsGiven: 0,
        donations: []
    })
}));
jest.mock('../../src/community/credits.js', () => ({
    CREDIT_PACKS: [],
    consumeBillingResult: jest.fn(() => 'success'),
    getCommerceEarnings: jest.fn().mockResolvedValue({
        totals: {today: 0, last_30_days: 0, lifetime: 0},
        history: []
    }),
    getBillingStatus: jest.fn().mockResolvedValue({billing_configured: true}),
    openBillingPortal: jest.fn(),
    openCreditCheckout: jest.fn()
}));

describe('Wallet billing result', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getAccountSummary.mockResolvedValue({
            balance: 10,
            donationsReceived: 0,
            donationsGiven: 0,
            donations: []
        });
        api.purchases.mockResolvedValue({purchases: []});
        getCommerceEarnings.mockResolvedValue({
            totals: {today: 0, last_30_days: 0, lifetime: 0},
            history: []
        });
    });

    test('keeps the checkout result through later state updates', async () => {
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <Wallet />
            </MemoryRouter>
        );
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();

        expect(wrapper.text()).toContain('Payment successful');
        expect(consumeBillingResult).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });

    test('renders a donation with a malformed timestamp', async () => {
        getAccountSummary.mockResolvedValue({
            balance: 10,
            donationsReceived: 1,
            donationsGiven: 0,
            donations: [{id: 'donation-1', direction: 'received', user: 'Alex', amount: 1, time: 'invalid'}]
        });
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <Wallet />
            </MemoryRouter>
        );
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();

        expect(wrapper.text()).toContain('From Alex');
        expect(wrapper.find('time')).toHaveLength(0);
        wrapper.unmount();
    });

    test('retries wallet data without claiming the failed load was an empty donation history', async () => {
        getAccountSummary
            .mockRejectedValueOnce(new Error('offline'))
            .mockResolvedValueOnce({balance: 12, donationsReceived: 0, donationsGiven: 0, donations: []});
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <Wallet />
            </MemoryRouter>
        );
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();

        expect(wrapper.text()).toContain('Donation history is unavailable.');
        expect(wrapper.text()).not.toContain('No profile donations yet.');

        await act(async () => {
            wrapper.find('button').filterWhere(button => button.text() === 'Try again').first().simulate('click');
            await Promise.resolve();
        });
        wrapper.update();
        expect(wrapper.text()).toContain('12credits');
        wrapper.unmount();
    });

    test('retries purchase history without reloading wallet data', async () => {
        api.purchases.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({purchases: []});
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <Wallet />
            </MemoryRouter>
        );
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();

        await act(async () => {
            wrapper.find('button').filterWhere(button => button.text() === 'Try again').simulate('click');
            await Promise.resolve();
        });
        expect(api.purchases).toHaveBeenCalledTimes(2);
        expect(getAccountSummary).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });
});
