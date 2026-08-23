import React from 'react';
import {shallow} from 'enzyme';

import CommentThread from '../../src/community/components/CommentThread.jsx';
import {useUser} from '../../src/community/UserContext.jsx';

jest.mock('../../src/community/UserContext.jsx', () => ({useUser: jest.fn()}));

describe('CommentThread signed-out flow', () => {
    test('offers a working sign-in action', () => {
        const login = jest.fn();
        useUser.mockReturnValue({user: null, login});
        const source = {list: jest.fn(() => Promise.resolve({comments: []}))};
        const wrapper = shallow(<CommentThread source={source} />);
        const signIn = wrapper.find('button').filterWhere(button => button.text() === 'Sign in');

        expect(signIn).toHaveLength(1);
        signIn.simulate('click');
        expect(login).toHaveBeenCalledTimes(1);
    });
});
