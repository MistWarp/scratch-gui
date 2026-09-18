import React from 'react';
import {mount, shallow} from 'enzyme';

import ReactionButtons from '../../src/community/components/ReactionButtons.jsx';
import {useUser} from '../../src/community/UserContext.jsx';

jest.mock('../../src/community/UserContext.jsx', () => ({useUser: jest.fn()}));
jest.mock('../../src/community/analytics.js', () => ({track: jest.fn()}));

describe('ReactionButtons signed-out flow', () => {
    test('opens sign-in instead of presenting dead controls', () => {
        const loginOrThrow = jest.fn(() => Promise.resolve());
        useUser.mockReturnValue({user: null, loginOrThrow});
        const onReact = jest.fn();
        const wrapper = shallow(<ReactionButtons reactions={{heart: [], brokenheart: []}} onReact={onReact} />);

        expect(wrapper.find('button').first().prop('disabled')).toBe(false);
        wrapper.find('button').first().simulate('click');
        expect(loginOrThrow).toHaveBeenCalledTimes(1);
        expect(onReact).not.toHaveBeenCalled();
    });

    test('completes the reaction once sign-in succeeds', () => {
        const loginOrThrow = jest.fn(() => Promise.resolve());
        useUser.mockReturnValue({user: null, loginOrThrow});
        const onReact = jest.fn();
        const wrapper = mount(<ReactionButtons reactions={{heart: [], brokenheart: []}} onReact={onReact} />);

        wrapper.find('button').first()
            .simulate('click');
        useUser.mockReturnValue({user: {username: 'alice'}, loginOrThrow});
        wrapper.setProps({});
        expect(onReact).toHaveBeenCalledTimes(1);
        expect(onReact).toHaveBeenCalledWith('heart');
    });

    test('drops the pending reaction when sign-in fails', async () => {
        const loginOrThrow = jest.fn(() => Promise.reject(new Error('closed')));
        useUser.mockReturnValue({user: null, loginOrThrow});
        const onReact = jest.fn();
        const wrapper = mount(<ReactionButtons reactions={{heart: [], brokenheart: []}} onReact={onReact} />);

        wrapper.find('button').first()
            .simulate('click');
        await Promise.resolve();
        await Promise.resolve();
        useUser.mockReturnValue({user: {username: 'alice'}, loginOrThrow});
        wrapper.setProps({});
        expect(onReact).not.toHaveBeenCalled();
    });
});
