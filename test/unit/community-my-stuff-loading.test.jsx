import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter, useLocation} from 'react-router-dom';

import api from '../../src/community/api.js';
import MyStuffSpaces from '../../src/community/components/MyStuffSpaces.jsx';
import Button from '../../src/community/components/ui/Button.jsx';
import Modal from '../../src/community/components/ui/Modal.jsx';
import MyStuff from '../../src/community/pages/MyStuff.jsx';

jest.mock('../../src/community/UserContext.jsx', () => {
    const user = {username: 'Sophie', featuredProject: ''};
    return {useUser: () => ({user, loading: false, login: jest.fn()})};
});
jest.mock('../../src/community/components/GroupTag.jsx', () => () => null);
jest.mock('../../src/community/api.js', () => ({
    __esModule: true,
    default: {
        perks: jest.fn(() => Promise.resolve({current: null})),
        quota: jest.fn(() => Promise.resolve({used: 0, limit: 100})),
        stats: jest.fn(),
        trash: jest.fn(),
        myProjectPage: jest.fn(),
        deleteProject: jest.fn(),
        quotaReset: jest.fn(),
        quotaResetConfirm: jest.fn(),
        mySpaces: jest.fn(),
        library: jest.fn()
    },
    editorUrl: jest.fn(() => '/editor'),
    projectUrl: jest.fn(id => `/projects/${id}`)
}));
jest.mock('../../src/lib/rotur/client.js', () => ({
    getAccountSummary: jest.fn(() => Promise.resolve(null))
}));

const stats = {
    totalViews: 0,
    totalHearts: 0,
    totalRevenue: 0,
    viewHistory: {}
};
const LocationProbe = () => <span data-location={useLocation().search} />;

describe('My Stuff load failures', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        api.perks.mockResolvedValue({current: null});
        api.quota.mockResolvedValue({used: 0, limit: 100});
        api.stats.mockResolvedValue({stats});
        api.trash.mockResolvedValue({projects: []});
        api.myProjectPage.mockResolvedValue({
            projects: [{id: 'project-1', title: 'Draft', shared: false}],
            total: 1,
            nextOffset: 1
        });
        api.deleteProject.mockResolvedValue({ok: true});
        api.quotaReset.mockResolvedValue({key: 'reset-key', payTo: 'credits', amount: 20});
        api.quotaResetConfirm.mockResolvedValue({ok: true});
        api.mySpaces.mockResolvedValue({spaces: []});
        api.library.mockResolvedValue({projects: [], total: 0, nextOffset: 0});
    });

    test('retries the Overview after stats fail', async () => {
        api.stats.mockRejectedValueOnce(new Error('Offline'));
        let wrapper;
        await act(async () => {
            wrapper = mount(
                <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                    <MyStuff />
                </MemoryRouter>
            );
            await Promise.resolve();
        });
        wrapper.update();

        expect(wrapper.text()).toContain('Could not load your overview.');
        await act(async () => {
            wrapper.find(Button).filterWhere(button => button.text() === 'Try again').simulate('click');
            await Promise.resolve();
        });
        wrapper.update();

        expect(api.stats).toHaveBeenCalledTimes(2);
        expect(wrapper.text()).toContain('Views this week');
        wrapper.unmount();
    });

    test('retries Trash without leaving an endless loading state', async () => {
        api.trash.mockRejectedValueOnce(new Error('Offline'));
        let wrapper;
        await act(async () => {
            wrapper = mount(
                <MemoryRouter
                    initialEntries={['/mystuff?section=trash']}
                    future={{v7_startTransition: true, v7_relativeSplatPath: true}}
                >
                    <MyStuff />
                </MemoryRouter>
            );
            await Promise.resolve();
        });
        wrapper.update();

        expect(wrapper.text()).toContain('Could not load Trash.');
        expect(wrapper.text()).not.toContain('Loading Trash…');
        await act(async () => {
            wrapper.find(Button).filterWhere(button => button.text() === 'Try again').simulate('click');
            await Promise.resolve();
        });
        wrapper.update();

        expect(api.trash).toHaveBeenCalledTimes(2);
        expect(wrapper.text()).toContain('Trash is empty.');
        wrapper.unmount();
    });

    test('retries upload usage after quota loading fails', async () => {
        api.quota.mockRejectedValueOnce(new Error('Offline'));
        let wrapper;
        await act(async () => {
            wrapper = mount(
                <MemoryRouter
                    initialEntries={['/mystuff?section=uploads']}
                    future={{v7_startTransition: true, v7_relativeSplatPath: true}}
                >
                    <MyStuff />
                </MemoryRouter>
            );
            await Promise.resolve();
        });
        wrapper.update();

        expect(wrapper.text()).toContain('Could not load upload usage.');
        await act(async () => {
            wrapper.find(Button).filterWhere(button => button.text() === 'Try again').simulate('click');
            await Promise.resolve();
        });
        wrapper.update();

        expect(api.quota).toHaveBeenCalledTimes(2);
        expect(wrapper.text()).toContain('Daily upload volume');
        wrapper.unmount();
    });

    test('shows quota reset failures inside the open confirmation', async () => {
        api.quotaResetConfirm.mockRejectedValueOnce(new Error('Payment failed'));
        let wrapper;
        await act(async () => {
            wrapper = mount(
                <MemoryRouter
                    initialEntries={['/mystuff?section=uploads']}
                    future={{v7_startTransition: true, v7_relativeSplatPath: true}}
                >
                    <MyStuff />
                </MemoryRouter>
            );
            await Promise.resolve();
        });
        wrapper.update();

        await act(async () => {
            wrapper.find(Button).filterWhere(button => button.text() === 'Reset quota').simulate('click');
            await Promise.resolve();
        });
        wrapper.update();
        await act(async () => {
            await wrapper.find(Modal).find(Button)
                .filterWhere(button => button.text() === 'Spend 20 credits')
                .prop('onClick')();
        });
        wrapper.update();

        expect(wrapper.find(Modal)).toHaveLength(1);
        expect(wrapper.find(Modal).text()).toContain('Payment failed');
        await act(async () => {
            await wrapper.find(Modal).find(Button)
                .filterWhere(button => button.text() === 'Spend 20 credits')
                .prop('onClick')();
        });
        wrapper.update();

        expect(api.quotaResetConfirm).toHaveBeenCalledTimes(2);
        expect(wrapper.find(Modal)).toHaveLength(0);
        expect(wrapper.text()).toContain('Quota reset successfully!');
        wrapper.unmount();
    });

    test('keeps a failed project deletion open for retry', async () => {
        api.deleteProject.mockRejectedValueOnce(new Error('Delete failed'));
        let wrapper;
        await act(async () => {
            wrapper = mount(
                <MemoryRouter
                    initialEntries={['/mystuff?section=projects']}
                    future={{v7_startTransition: true, v7_relativeSplatPath: true}}
                >
                    <MyStuff />
                </MemoryRouter>
            );
            await Promise.resolve();
        });
        wrapper.update();

        wrapper.find('button[aria-label="Actions for Draft"]').simulate('click');
        wrapper.find('button').filterWhere(button => button.text() === 'Delete').simulate('click');
        await act(async () => {
            await wrapper.find(Modal).find(Button)
                .filterWhere(button => button.text() === 'Delete project')
                .prop('onClick')();
        });
        wrapper.update();

        expect(wrapper.find(Modal)).toHaveLength(1);
        expect(wrapper.find(Modal).text()).toContain('Delete failed');
        await act(async () => {
            await wrapper.find(Modal).find(Button)
                .filterWhere(button => button.text() === 'Delete project')
                .prop('onClick')();
        });
        wrapper.update();

        expect(api.deleteProject).toHaveBeenCalledTimes(2);
        expect(wrapper.find(Modal)).toHaveLength(0);
        wrapper.unmount();
    });

    test('keeps the Collections library drill-in in the URL', async () => {
        let wrapper;
        await act(async () => {
            wrapper = mount(
                <MemoryRouter
                    initialEntries={['/mystuff?section=collections']}
                    future={{v7_startTransition: true, v7_relativeSplatPath: true}}
                >
                    <MyStuff />
                    <LocationProbe />
                </MemoryRouter>
            );
            await Promise.resolve();
        });
        wrapper.update();

        wrapper.find(MyStuffSpaces).find('button')
            .filterWhere(button => button.text().includes('Library'))
            .simulate('click');
        wrapper.update();
        expect(wrapper.find(LocationProbe).find('span').prop('data-location'))
            .toBe('?section=collections&collectionView=library');
        expect(wrapper.text()).toContain('Projects you bought or saved for later.');

        wrapper.find(MyStuffSpaces).find('button')
            .filterWhere(button => button.text().includes('Collections'))
            .simulate('click');
        wrapper.update();
        expect(wrapper.find(LocationProbe).find('span').prop('data-location')).toBe('?section=collections');
        wrapper.unmount();
    });
});
