import React from 'react';
import {shallow} from 'enzyme';

import ReactionButtons from '../../src/community/components/ReactionButtons.jsx';
import {useUser} from '../../src/community/UserContext.jsx';

jest.mock('../../src/community/UserContext.jsx', () => ({useUser: jest.fn()}));

describe('ReactionButtons signed-out flow', () => {
    test('opens sign-in instead of presenting dead controls', () => {
        const login = jest.fn();
        useUser.mockReturnValue({user: null, login});
        const onReact = jest.fn();
        const wrapper = shallow(<ReactionButtons reactions={{heart: [], brokenheart: []}} onReact={onReact} />);

        expect(wrapper.find('button').first().prop('disabled')).toBe(false);
        wrapper.find('button').first().simulate('click');
        expect(login).toHaveBeenCalledTimes(1);
        expect(onReact).not.toHaveBeenCalled();
    });
});
