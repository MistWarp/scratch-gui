import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import api from '../../src/community/api';
import Explore from '../../src/community/pages/Explore.jsx';

jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {explore: jest.fn()},
    projectUrl: project => `/project/${project.id || project}`
}));
jest.mock('../../src/community/UserContext.jsx', () => ({useUser: () => ({user: null})}));
jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

const flush = async wrapper => {
    await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
    });
    wrapper.update();
};

const render = (url = '/explore') => mount(
    <MemoryRouter
        initialEntries={[url]}
        future={{v7_startTransition: true, v7_relativeSplatPath: true}}
    >
        <Explore />
    </MemoryRouter>
);

describe('explore page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('browses with links that keep the other choice', async () => {
        api.explore.mockResolvedValue({projects: [{id: 'a', title: 'Alpha', owner: 'alice'}], total: 1});
        const wrapper = render('/explore?tag=games');
        await flush(wrapper);

        expect(api.explore).toHaveBeenCalledWith(expect.objectContaining({sort: 'trending', tag: 'games'}));
        expect(wrapper.find('h3').map(node => node.text())).toEqual(['Alpha']);
        expect(wrapper.find('a[aria-current="page"]').map(node => node.text())).toEqual(['Games', 'Trending', 'Games']);
        expect(wrapper.find('a[href="/explore?tag=games&sort=recent"]').text()).toBe('New');
        expect(wrapper.find('a[href="/explore"]').map(node => node.text())).toContain('Everything');
        wrapper.unmount();
    });

    test('says when a filter has nothing and offers everything instead', async () => {
        api.explore.mockResolvedValue({projects: [], total: 0});
        const wrapper = render('/explore?tag=music');
        await flush(wrapper);

        expect(wrapper.text()).toContain('Nothing here yet.');
        expect(wrapper.find('a').filterWhere(link => link.text() === 'See everything')
            .prop('href')).toBe('/explore');
        wrapper.unmount();
    });

    test('retries after an error', async () => {
        api.explore.mockRejectedValueOnce(new Error('offline'))
            .mockResolvedValue({projects: [{id: 'b', title: 'Beta', owner: 'bob'}], total: 1});
        const wrapper = render();
        await flush(wrapper);
        expect(wrapper.text()).toContain('Could not load projects.');

        wrapper.find('button').filterWhere(button => button.text() === 'Try again')
            .simulate('click');
        await flush(wrapper);
        expect(wrapper.find('h3').map(node => node.text())).toEqual(['Beta']);
        wrapper.unmount();
    });
});
