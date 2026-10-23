import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import Profile from '../../src/community/pages/Profile.jsx';
import Following from '../../src/community/pages/Following.jsx';
import api from '../../src/community/api';
import rotur from '../../src/community/rotur';
import {setMockUser} from '../../src/community/UserContext.jsx';

jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {getUser: jest.fn(), userReviews: jest.fn(), themes: jest.fn()}
}));
jest.mock('../../src/community/rotur', () => ({
    profile: jest.fn(), myFollowing: jest.fn(), avatar: () => '', banner: () => ''
}));
jest.mock('../../src/community/UserContext.jsx', () => {
    let user = null;
    return {
        useUser: () => ({user, loading: false}),
        setMockUser: next => {
            user = next;
        }
    };
});
jest.mock('../../src/lib/rotur/client.js', () => ({}));
jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));
jest.mock('../../src/community/components/CommentThread.jsx', () => () => null);

const render = path => mount(
    <MemoryRouter
        initialEntries={[path]}
        future={{v7_startTransition: true, v7_relativeSplatPath: true}}
    >
        <Routes>
            <Route
                path="/users/:name"
                element={<Profile />}
            />
            <Route
                path="/users/:name/following"
                element={<Following />}
            />
        </Routes>
    </MemoryRouter>
);

const settle = async wrapper => {
    for (let i = 0; i < 4; i++) {
        await act(async () => {
            await Promise.resolve();
        });
    }
    wrapper.update();
};

const links = wrapper => wrapper.find('a').map(link => link.prop('href'));

describe('follower and following counts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        setMockUser(null);
        api.getUser.mockResolvedValue({banned: false, projects: []});
        api.userReviews.mockResolvedValue({reviews: []});
        api.themes.mockResolvedValue({themes: []});
        rotur.profile.mockResolvedValue({username: 'alice', followers: 97, following: 31});
        rotur.myFollowing.mockResolvedValue({following: ['bob', 'cat']});
    });

    test("someone else's profile shows both counts and no lists", async () => {
        setMockUser({username: 'viewer'});
        const wrapper = render('/users/alice');
        await settle(wrapper);
        expect(wrapper.text()).toContain('97followers');
        expect(wrapper.text()).toContain('31following');
        expect(links(wrapper).filter(href => /\/(followers|following)$/.test(href))).toEqual([]);
        expect(rotur.myFollowing).not.toHaveBeenCalled();
        wrapper.unmount();
    });

    test('your own following count opens your own list', async () => {
        setMockUser({username: 'alice'});
        const wrapper = render('/users/alice');
        await settle(wrapper);
        expect(links(wrapper)).toContain('/users/alice/following');
        expect(links(wrapper)).not.toContain('/users/alice/followers');
        wrapper.unmount();
    });

    test('the following page lists only your own following', async () => {
        setMockUser({username: 'alice'});
        const own = render('/users/alice/following');
        await settle(own);
        expect(links(own)).toEqual(expect.arrayContaining(['/users/bob', '/users/cat']));
        own.unmount();

        setMockUser({username: 'viewer'});
        const theirs = render('/users/alice/following');
        await settle(theirs);
        expect(rotur.myFollowing).toHaveBeenCalledTimes(1);
        expect(theirs.text()).toContain('31following');
        theirs.unmount();
    });
});
