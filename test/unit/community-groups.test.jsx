import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import Groups, {withGroupQuery} from '../../src/community/pages/Groups.jsx';
import {normalizeGroupTabParams} from '../../src/community/pages/Group.jsx';
import rotur from '../../src/community/rotur.js';

jest.mock('../../src/community/UserContext.jsx', () => ({
    useUser: () => ({user: null})
}));
jest.mock('../../src/community/rotur.js', () => ({
    groups: {
        search: jest.fn(),
        mine: jest.fn()
    }
}));

const deferred = () => {
    let resolve;
    const promise = new Promise(done => {
        resolve = done;
    });
    return {promise, resolve};
};

describe('community groups search', () => {
    beforeEach(() => {
        rotur.groups.search.mockReset();
        rotur.groups.mine.mockReset();
    });

    test('stores trimmed searches without dropping other URL state', () => {
        expect(withGroupQuery(new URLSearchParams('source=nav'), '  makers  ').toString()).toBe('source=nav&q=makers');
        expect(withGroupQuery(new URLSearchParams('q=old'), '  ').toString()).toBe('');
    });

    test('canonicalizes default and invalid group tabs', () => {
        expect(normalizeGroupTabParams(new URLSearchParams('tab=unknown')).toString()).toBe('');
        expect(normalizeGroupTabParams(new URLSearchParams('tab=members')).toString()).toBe('tab=members');
    });

    test('keeps the newest search results when requests finish out of order', async () => {
        const older = deferred();
        const newer = deferred();
        rotur.groups.search
            .mockResolvedValueOnce([])
            .mockReturnValueOnce(older.promise)
            .mockReturnValueOnce(newer.promise);
        let wrapper;
        await act(async () => {
            wrapper = mount(
                <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                    <Groups />
                </MemoryRouter>
            );
            await Promise.resolve();
        });

        const search = value => {
            wrapper.find('input[aria-label="Search groups"]').simulate('change', {target: {value}});
            wrapper.find('form').simulate('submit', {preventDefault: jest.fn()});
        };
        search('old');
        search('new');

        await act(async () => {
            newer.resolve([{tag: 'new', name: 'New result'}]);
            await newer.promise;
        });
        await act(async () => {
            older.resolve([{tag: 'old', name: 'Old result'}]);
            await older.promise;
        });
        wrapper.update();

        expect(wrapper.text()).toContain('New result');
        expect(wrapper.text()).not.toContain('Old result');
        wrapper.unmount();
    });

    test('offers a retry without showing the empty state after a failed load', async () => {
        rotur.groups.search
            .mockRejectedValueOnce(new Error('offline'))
            .mockResolvedValueOnce([{tag: 'makers', name: 'Makers'}]);
        let wrapper;
        await act(async () => {
            wrapper = mount(
                <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                    <Groups />
                </MemoryRouter>
            );
            await Promise.resolve();
        });
        wrapper.update();

        expect(wrapper.text()).toContain('offline');
        expect(wrapper.text()).toContain('Try again');
        expect(wrapper.text()).not.toContain('No groups found.');

        await act(async () => {
            wrapper.find('button').filterWhere(button => button.text() === 'Try again').simulate('click');
            await Promise.resolve();
        });
        wrapper.update();
        expect(wrapper.text()).toContain('Makers');
        wrapper.unmount();
    });
});
