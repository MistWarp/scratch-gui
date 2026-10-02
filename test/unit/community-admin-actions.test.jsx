import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount, shallow} from 'enzyme';
import ConfirmModal from '../../src/community/components/ui/ConfirmModal.jsx';
import api from '../../src/community/api.js';
import {
    AdminActionDialog, AnalyticsChart, buildSeries, UserManager
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

        expect(wrapper.find(ConfirmModal).prop('title')).toBe('Warn user?');
        wrapper.find('textarea').simulate('change', {target: {value: 'Clear reason'}});
        expect(onChange).toHaveBeenCalledWith('reason', 'Clear reason');

        wrapper.find(ConfirmModal).prop('onConfirm')();
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

        expect(wrapper.find(ConfirmModal).prop('busy')).toBe(true);
        expect(wrapper.find(ConfirmModal).prop('error')).toBe('storage unavailable');
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

    test('marks the projected close separately from the observed value', () => {
        const wrapper = shallow(
            <AnalyticsChart
                title="Project uploads"
                description="Projects created each day."
                yLabel="Projects"
                estimateToday
                series={[
                    {key: '1', label: 'Aug 29', fullLabel: 'Aug 29, 2026', value: 12, samples: 0},
                    {key: '2', label: 'Aug 30', fullLabel: 'Aug 30, 2026', value: 4, samples: 0}
                ]}
            />
        );

        expect(wrapper.text()).toContain('Today 4');
        expect(wrapper.text()).toContain('Est. close');
        expect(wrapper.find('title').someWhere(node => node.text().startsWith('Estimated end of today:'))).toBe(true);
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
