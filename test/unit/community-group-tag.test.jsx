import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import GroupTag from '../../src/community/components/GroupTag.jsx';
import rotur from '../../src/community/rotur.js';

jest.mock('../../src/community/rotur.js', () => ({
    profile: jest.fn()
}));

const mountTag = username => mount(
    <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
        <GroupTag username={username} />
    </MemoryRouter>
);

describe('community GroupTag', () => {
    afterEach(() => {
        rotur.profile = jest.fn();
    });

    test('does not crash when profile lookup is unavailable', async () => {
        rotur.profile = undefined;
        let wrapper;
        await act(async () => {
            wrapper = mountTag('missing-capability');
            await Promise.resolve();
        });

        expect(wrapper.find('a')).toHaveLength(0);
        wrapper.unmount();
    });

    test('retries a failed lookup instead of caching an empty tag', async () => {
        rotur.profile
            .mockRejectedValueOnce(new Error('Temporary failure'))
            .mockResolvedValueOnce({group_tag: 'builders'});

        let first;
        await act(async () => {
            first = mountTag('retry-user');
            await Promise.resolve();
        });
        first.unmount();

        let second;
        await act(async () => {
            second = mountTag('retry-user');
            await Promise.resolve();
        });
        second.update();

        expect(rotur.profile).toHaveBeenCalledTimes(2);
        expect(second.text()).toContain('builders');
        second.unmount();
    });

    test('renders a passive badge when nested inside another control', () => {
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <GroupTag tag="builders" linked={false} />
            </MemoryRouter>
        );

        expect(wrapper.find('a')).toHaveLength(0);
        expect(wrapper.find('[role="link"]')).toHaveLength(0);
        expect(wrapper.text()).toContain('builders');
        wrapper.unmount();
    });

    test('renders a group link when used on its own', () => {
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <GroupTag tag="builders" />
            </MemoryRouter>
        );

        expect(wrapper.find('a').prop('href')).toBe('/groups/builders');
        wrapper.unmount();
    });
});
