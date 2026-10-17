import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import PostToClawModal from '../../src/community/components/PostToClawModal.jsx';
import api from '../../src/community/api.js';

jest.mock('../../src/community/rotur.js', () => ({createPost: jest.fn()}));
jest.mock('../../src/community/components/GifPicker.jsx', () => () => null);
jest.mock('../../src/community/api.js', () => {
    const actual = jest.requireActual('../../src/community/api.js');
    return {
        ...actual,
        __esModule: true,
        default: {...actual.default, getProject: jest.fn(), loadSession: jest.fn(), perks: jest.fn()}
    };
});

const open = async id => {
    const wrapper = mount(<PostToClawModal
        project={{id}}
        user={{username: 'me'}}
        onClose={jest.fn()}
    />);
    await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
    });
    wrapper.update();
    return wrapper;
};

describe('post to claw', () => {
    test('prefills the composer for a shared project', async () => {
        api.getProject.mockResolvedValue({project: {id: 'pub1', title: 'Game', shared: true, visibility: 'public'}});
        const wrapper = await open('pub1');
        expect(wrapper.find('textarea').prop('value')).toBe('https://mistwarp.org/project/pub1');
        wrapper.unmount();
    });

    test.each([
        ['an unshared', {id: 'priv1', shared: false}],
        ['a private', {id: 'priv2', shared: true, visibility: 'private'}],
        ['a hidden', {id: 'priv3', shared: true, moderationHidden: true}]
    ])('does not offer the composer for %s project', async (name, project) => {
        api.getProject.mockResolvedValue({project});
        const wrapper = await open(project.id);
        expect(wrapper.find('textarea')).toHaveLength(0);
        expect(wrapper.text()).toContain('Only shared projects can be posted to claw.');
        wrapper.unmount();
    });
});
