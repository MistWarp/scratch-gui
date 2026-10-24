import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import Leaderboard from '../../src/community/pages/Leaderboard.jsx';
import ListSkeleton from '../../src/community/components/ListSkeleton.jsx';
import api from '../../src/community/api';

jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));
jest.mock('../../src/community/rotur', () => ({
    __esModule: true,
    default: {followerLeaderboard: jest.fn(() => new Promise(() => {}))}
}));
jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {leaderboard: jest.fn()}
}));

const renderAt = path => mount(
    <MemoryRouter
        initialEntries={[path]}
        future={{v7_startTransition: true, v7_relativeSplatPath: true}}
    >
        <Leaderboard />
    </MemoryRouter>
);

describe('creators leaderboard', () => {
    test('shows placeholder rows while a board loads', () => {
        const wrapper = renderAt('/leaderboard');
        expect(wrapper.find(ListSkeleton).exists()).toBe(true);
        expect(wrapper.find('[role="status"]').text()).toBe('Loading the leaderboard…');
        wrapper.unmount();
    });

    test('lists creators as numbered rows with their total', async () => {
        api.leaderboard.mockResolvedValue({users: [
            {username: 'flufi', loves: 1200, projects: 8},
            {username: 'Mist', loves: 900, projects: 1},
            {username: 'fries', loves: 40, projects: 3},
            {username: 'Dominic', loves: 12, projects: 2}
        ]});
        let wrapper;
        await act(async () => {
            wrapper = renderAt('/leaderboard?board=loves');
            await Promise.resolve();
        });
        wrapper.update();
        const rows = wrapper.find('ol li');
        expect(rows.length).toBe(4);
        expect(rows.at(0).find('a')
            .prop('href')).toBe('/users/flufi');
        expect(rows.at(0).text()).toContain('1');
        expect(rows.at(0).text()).toContain('8 shared projects');
        expect(rows.at(1).text()).toContain('1 shared project');
        expect(rows.at(3).text()).toMatch(/^4/);
        expect(wrapper.find('svg.lucide-trophy').exists()).toBe(false);
        wrapper.unmount();
    });
});
