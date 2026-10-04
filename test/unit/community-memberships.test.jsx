import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';
import api from '../../src/community/api.js';
import {useUser} from '../../src/community/UserContext.jsx';
import PaidPerks from '../../src/community/pages/PaidPerks.jsx';

jest.mock('../../src/community/api.js', () => ({__esModule: true, default: {perks: jest.fn()}}));
jest.mock('../../src/community/UserContext.jsx', () => ({useUser: jest.fn()}));

const plans = ['Free', 'Lite', 'Plus', 'Pro'].map((tier, index) => ({
    tier,
    mistwarp: {
        storageBytes: [500, 2048, 10240, 51200][index] * 1048576,
        maxProjectAssetsBytes: [50, 100, 250, 1024][index] * 1048576,
        maxProjectAssetBytes: [10, 25, 50, 100][index] * 1048576,
        maxProjects: [100, 500, 2000, 10000][index],
        maxSpaces: [25, 100, 500, 2000][index],
        maxProjectReleases: [20, 50, 100, 500][index],
        gameSaveStorageBytes: [5, 25, 100, 1000][index] * 1000000,
        maxGameInventoryItems: [1000, 5000, 20000, 100000][index],
        historyCheckpoints: index >= 1,
        recoveryDays: [7, 14, 30, 90][index],
        analyticsDays: [7, 30, 365, 0][index],
        advancedAnalytics: index >= 2,
        customProjectBranding: index >= 2,
        vanityProjectUrls: index === 3,
        salesFeeBasisPoints: [1000, 1000, 700, 500][index],
        maxProjectPrice: [100, 100, 250, 500][index]
    }
}));
const renderPage = async () => {
    let wrapper;
    await act(async () => {
        wrapper = mount(<MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
            <PaidPerks />
        </MemoryRouter>);
        await Promise.resolve();
    });
    wrapper.update();
    return wrapper;
};

beforeEach(() => {
    useUser.mockReturnValue({user: null, login: jest.fn()});
    api.perks.mockResolvedValue({plans, current: plans[0], roturMembershipUrl: 'https://rotur.dev/premium'});
});

test('shows actual plan entitlements and keeps checkout on Rotur without marking an anonymous visitor as a member',
    async () => {
        const wrapper = await renderPage();
        const cards = wrapper.find('article').filterWhere(node => node.find('h3').length > 0);
        expect(cards).toHaveLength(4);
        expect(cards.at(0).text()).not.toContain('Named history checkpoints');
        expect(cards.at(1).text()).toContain('Named history checkpoints');
        expect(cards.at(0).text()).not.toContain('Custom project branding');
        expect(cards.at(2).text()).toContain('Custom project branding');
        expect(cards.at(2).text()).not.toContain('Custom project URLs');
        expect(cards.at(3).text()).toContain('Custom project URLs');
        expect(wrapper.find('a[href="https://rotur.dev/premium"]')).toHaveLength(3);
        expect(wrapper.text()).not.toContain('Your membership');
        expect(wrapper.find('a[href="/editor"]').length).toBeGreaterThan(0);
        wrapper.unmount();
    });

test('keeps storage allowances and sales fees accessible in the comparison', async () => {
    const wrapper = await renderPage();
    wrapper.find('button[role="tab"]').at(1)
        .simulate('click');
    expect(wrapper.find('table').text()).toContain('Storage for all your projects');
    expect(wrapper.find('table').text()).toContain('500 MB2 GB10 GB50 GB');
    expect(wrapper.find('a[href="/mystuff?section=uploads"]')).toHaveLength(1);
    wrapper.find('button[role="tab"]').at(2)
        .simulate('click');
    expect(wrapper.find('table').text()).toContain('Game save storage');
    expect(wrapper.find('table').text()).toContain('5 MB25 MB100 MB1 GB');
    wrapper.find('button[role="tab"]').at(3)
        .simulate('click');
    expect(wrapper.find('table').text()).toContain('10%10%7%5%');
    expect(wrapper.text()).toContain('A membership does not include access to every project');
    wrapper.unmount();
});

test('marks only the authenticated current membership', async () => {
    useUser.mockReturnValue({user: {username: 'Member', subscription: 'Plus'}, login: jest.fn()});
    api.perks.mockResolvedValue({plans, current: plans[2], roturMembershipUrl: 'https://rotur.dev/premium'});
    const wrapper = await renderPage();
    const selected = wrapper.find('article').filterWhere(node => node.text().includes('Your membership'));
    expect(selected).toHaveLength(1);
    expect(selected.find('h3').text()).toBe('Plus');
    wrapper.unmount();
});
