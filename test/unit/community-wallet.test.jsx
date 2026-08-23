import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import {consumeBillingResult} from '../../src/community/credits.js';
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
    getAccountSummary: jest.fn().mockResolvedValue({balance: 10, donationsReceived: 0, donationsGiven: 0})
}));
jest.mock('../../src/community/credits.js', () => ({
    CREDIT_PACKS: [],
    consumeBillingResult: jest.fn(() => 'success'),
    getBillingStatus: jest.fn().mockResolvedValue({billing_configured: true}),
    openBillingPortal: jest.fn(),
    openCreditCheckout: jest.fn()
}));

describe('Wallet billing result', () => {
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
});
