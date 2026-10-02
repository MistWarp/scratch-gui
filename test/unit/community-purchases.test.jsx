import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import api from '../../src/community/api';
import Purchases from '../../src/community/pages/Purchases.jsx';

jest.mock('../../src/community/UserContext.jsx', () => {
    const state = {user: {username: 'buyer'}, loading: false};
    return {useUser: () => state};
});
jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {purchases: jest.fn()},
    projectUrl: id => `/project/${id}`
}));
jest.mock('../../src/lib/rotur/client.js', () => {
    throw new Error('Purchases must not need the Rotur client');
});

const render = async () => {
    const wrapper = mount(
        <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
            <Purchases />
        </MemoryRouter>
    );
    await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
    });
    wrapper.update();
    return wrapper;
};

describe('Purchases', () => {
    test('lists what you bought from MistWarp\'s own records, and sends you to Rotur for your credits', async () => {
        api.purchases.mockResolvedValue({purchases: [{projectId: 'p1', title: 'Starfall', amount: 10, at: 1700000000000}]});
        const wrapper = await render();
        const text = wrapper.text();
        expect(text).toContain('Starfall');
        expect(text).toContain('Your credits are on Rotur');
        expect(text).not.toContain('Claim daily');
        expect(text).not.toContain('Your balance');
        const rotur = wrapper.find('a[href="https://rotur.dev/me"]');
        expect(rotur.exists()).toBe(true);
        expect(rotur.prop('target')).toBe('_blank');
        expect(api.purchases).toHaveBeenCalledTimes(1);
        wrapper.unmount();
    });

    test('says so when you haven\'t bought anything', async () => {
        api.purchases.mockResolvedValue({purchases: []});
        const wrapper = await render();
        expect(wrapper.text()).toContain('No purchases yet');
        wrapper.unmount();
    });
});
