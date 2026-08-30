import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';
import SocialPost from '../../src/community/components/SocialPost.jsx';
import {useUser} from '../../src/community/UserContext.jsx';
import rotur from '../../src/community/rotur.js';

jest.mock('../../src/community/UserContext.jsx', () => ({useUser: jest.fn()}));
jest.mock('../../src/community/rotur.js', () => ({
    likePost: jest.fn(),
    unlikePost: jest.fn()
}));
jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

describe('social post list actions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useUser.mockReturnValue({user: {username: 'viewer'}, login: jest.fn()});
        rotur.likePost.mockResolvedValue({});
    });

    test('likes a post without leaving the list', async () => {
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <SocialPost initialPost={{id: 'post-1', user: 'alice', content: 'Hello', likes: []}} />
            </MemoryRouter>
        );

        await act(async () => {
            wrapper.find('button[aria-label="Like post"]').simulate('click');
            await Promise.resolve();
        });
        wrapper.update();

        expect(rotur.likePost).toHaveBeenCalledWith('post-1');
        expect(wrapper.find('button[aria-label="Unlike post"]').text()).toContain('1');
        wrapper.unmount();
    });
});
