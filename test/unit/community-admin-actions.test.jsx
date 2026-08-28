import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount, shallow} from 'enzyme';
import Modal from '../../src/community/components/ui/Modal.jsx';
import api from '../../src/community/api.js';
import {
    AdminActionDialog, AnalyticsChart, buildSeries, StatsOverview, UserManager
} from '../../src/community/pages/Admin.jsx';

jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

describe('admin action dialog', () => {
    test('keeps moderation input and confirmation inside the app', () => {
        const onChange = jest.fn();
        const onConfirm = jest.fn();
        const wrapper = shallow(
            <AdminActionDialog
                dialog={{
                    title: 'Warn user?',
                    action: 'Send warning',
                    fields: [{key: 'reason', label: 'Reason', value: '', multiline: true}]
                }}
                busy={false}
                error=""
                onChange={onChange}
                onCancel={jest.fn()}
                onConfirm={onConfirm}
            />
        );

        expect(wrapper.find(Modal).prop('title')).toBe('Warn user?');
        wrapper.find('textarea').simulate('change', {target: {value: 'Clear reason'}});
        expect(onChange).toHaveBeenCalledWith('reason', 'Clear reason');

        const actions = shallow(<div>{wrapper.find(Modal).prop('actions')}</div>);
        actions.find('button').at(1).simulate('click');
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    test('disables dismissal and actions while the request is running', () => {
        const wrapper = shallow(
            <AdminActionDialog
                dialog={{title: 'Delete project?', action: 'Delete project', danger: true}}
                busy
                error="storage unavailable"
                onChange={jest.fn()}
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
            />
        );

        expect(wrapper.find(Modal).prop('dismissDisabled')).toBe(true);
        const content = shallow(<div>{wrapper.find(Modal).prop('children')}</div>);
        expect(content.text()).toContain('storage unavailable');
    });
});

describe('admin analytics charts', () => {
    test('labels the time and value axes and exposes exact values', () => {
        const wrapper = shallow(
            <AnalyticsChart
                title="Average project load time"
                description="Completed project loads."
                yLabel="Milliseconds"
                formatValue={value => `${value} ms`}
                series={[
                    {key: '1', label: 'Aug 26', fullLabel: 'Aug 26, 2026', value: 800, samples: 2},
                    {key: '2', label: 'Aug 27', fullLabel: 'Aug 27, 2026', value: 600, samples: 3}
                ]}
            />
        );

        expect(wrapper.text()).toContain('Average project load time');
        expect(wrapper.text()).toContain('Milliseconds');
        expect(wrapper.text()).toContain('Date');
        expect(wrapper.find('title').first().text()).toContain('800 ms from 2 samples');
    });

    test('keeps missing load-time samples out of the average line', () => {
        const today = Math.floor(Date.now() / 86400000);
        const rows = buildSeries({[today]: 725}, 2, {[today]: 4});

        expect(rows[0].value).toBeNull();
        expect(rows[1].value).toBe(725);
        expect(rows[1].samples).toBe(4);
    });
});

describe('admin user directory', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('shows a retry action instead of an empty state after loading fails', async () => {
        const users = jest.spyOn(api.admin, 'users')
            .mockRejectedValueOnce(new Error('Directory unavailable'))
            .mockResolvedValueOnce({users: [{username: 'Alex', followerCount: 2, projectCount: 1}]});
        const wrapper = mount(<UserManager />);
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();

        expect(wrapper.text()).toContain('Directory unavailable');
        expect(wrapper.text()).not.toContain('No users match that filter.');
        await act(async () => {
            wrapper.find('button').filterWhere(node => node.text() === 'Try again').simulate('click');
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();
        expect(users).toHaveBeenCalledTimes(2);
        expect(wrapper.text()).toContain('@Alex');
        wrapper.unmount();
    });

    test('opens a user row with the Space key', async () => {
        jest.spyOn(api.admin, 'users').mockResolvedValue({
            users: [{username: 'Alex', followerCount: 2, projectCount: 1, quotaUsed: 0, quotaLimit: 1}]
        });
        jest.spyOn(api.admin, 'getUser').mockReturnValue(new Promise(() => {}));
        const wrapper = mount(<UserManager />);
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();
        const preventDefault = jest.fn();
        wrapper.find('[role="button"]').simulate('keydown', {key: ' ', preventDefault});

        expect(preventDefault).toHaveBeenCalledTimes(1);
        expect(api.admin.getUser).toHaveBeenCalledWith('Alex');
        wrapper.unmount();
    });
});

describe('admin payout retry', () => {
    const stats = overrides => ({
        projectsByDay: {},
        projectUpdatesByDay: {},
        usersByDay: {},
        loginsByDay: {},
        loadsByDay: {},
        averageLoadMsByDay: {},
        loadSamplesByDay: {},
        startsByDay: {},
        crashesByDay: {},
        loadsByDevice: {},
        pendingPayouts: 1,
        pendingPayoutAmount: 2,
        ...overrides
    });

    const deferred = () => {
        let resolve;
        const promise = new Promise(resolvePromise => {
            resolve = resolvePromise;
        });
        return {promise, resolve};
    };

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('refreshes the date range selected while a payout retry is running', async () => {
        const payout = deferred();
        const adminStats = jest.spyOn(api.admin, 'stats')
            .mockResolvedValueOnce(stats())
            .mockResolvedValue(stats({pendingPayouts: 0}));
        jest.spyOn(api, 'quota').mockResolvedValue({used: 0, limit: 1});
        jest.spyOn(api.admin, 'retryPayouts').mockReturnValue(payout.promise);
        const wrapper = mount(<StatsOverview />);
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();

        wrapper.find('button').filterWhere(node => node.text() === 'Retry now').simulate('click');
        wrapper.find('button').filterWhere(node => node.text() === '7 days').simulate('click');
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        await act(async () => payout.resolve({paid: 1, remaining: 0}));
        wrapper.update();

        expect(adminStats).toHaveBeenLastCalledWith(7);
        wrapper.unmount();
    });

    test('does not refresh statistics after leaving during a payout retry', async () => {
        const payout = deferred();
        const adminStats = jest.spyOn(api.admin, 'stats').mockResolvedValue(stats());
        jest.spyOn(api, 'quota').mockResolvedValue({used: 0, limit: 1});
        jest.spyOn(api.admin, 'retryPayouts').mockReturnValue(payout.promise);
        const wrapper = mount(<StatsOverview />);
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });
        wrapper.update();
        wrapper.find('button').filterWhere(node => node.text() === 'Retry now').simulate('click');
        wrapper.unmount();
        await act(async () => payout.resolve({paid: 1, remaining: 0}));

        expect(adminStats).toHaveBeenCalledTimes(1);
    });
});
