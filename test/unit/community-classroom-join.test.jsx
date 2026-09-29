import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter, Route, Routes} from 'react-router-dom';

import ClassroomJoin from '../../src/community/pages/ClassroomJoin.jsx';
import api from '../../src/community/api.js';

const mockLoginStudent = jest.fn();

jest.mock('../../src/community/UserContext.jsx', () => ({
    useUser: () => ({user: null, loading: false, loginStudent: mockLoginStudent})
}));
jest.mock('../../src/community/api.js', () => ({
    __esModule: true,
    default: {
        classroom: {
            join: jest.fn(),
            login: jest.fn()
        }
    }
}));
jest.mock('../../src/community/locale', () => ({getCommunityLocale: () => 'en', locales: {}}));
jest.mock('../../src/community/i18n.jsx', () => {
    // eslint-disable-next-line global-require
    const IntlMessageFormat = require('intl-messageformat').default;
    return {
        useCommunityIntl: () => ({
            locale: 'en',
            t: key => key,
            text: (key, values) => (values ? new IntlMessageFormat(key, 'en').format(values) : key)
        })
    };
});

const PASSWORD_ROSTER = {
    class: {name: 'Year 7 Computing', loginMode: 'password'},
    pictures: [],
    students: [{id: 's1', displayName: 'Ada Okafor'}, {id: 's2', displayName: 'Ben Carter'}]
};

const PICTURE_ROSTER = {
    class: {name: 'Year 3 Explorers', loginMode: 'picture'},
    pictures: [
        'cat', 'dog', 'fish', 'bird', 'rabbit', 'turtle', 'squirrel', 'snail',
        'star', 'moon', 'sun', 'tree', 'apple', 'rocket', 'boat', 'car'
    ],
    students: [{id: 's3', displayName: 'Mia'}]
};

const flush = async wrapper => {
    await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
    });
    wrapper.update();
};

const renderJoin = path => mount(
    <MemoryRouter
        initialEntries={[path]}
        future={{v7_startTransition: true, v7_relativeSplatPath: true}}
    >
        <Routes>
            <Route
                path="/classroom"
                element={<p id="landed">Landed on the classroom page.</p>}
            />
            <Route
                path="/classroom/join"
                element={<ClassroomJoin />}
            />
            <Route
                path="/classroom/join/:code"
                element={<ClassroomJoin />}
            />
        </Routes>
    </MemoryRouter>
);

const clickButton = (wrapper, name) => {
    const button = wrapper.find('button').filterWhere(node => (
        node.text() === name || node.prop('aria-label') === name
    ))
        .first();
    expect(button.exists()).toBe(true);
    button.simulate('click');
};

describe('classroom student sign-in', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('normalizes the class code and moves to the roster', async () => {
        api.classroom.join.mockResolvedValue(PASSWORD_ROSTER);
        const wrapper = renderJoin('/classroom/join');
        wrapper.find('input').simulate('change', {target: {value: ' fb2h-v829 '}});
        expect(wrapper.find('input').prop('value')).toBe('FB2HV829');
        wrapper.find('form').simulate('submit');
        await flush(wrapper);
        expect(api.classroom.join).toHaveBeenCalledWith('FB2HV829');
        expect(wrapper.text()).toContain('Who are you?');
        expect(wrapper.text()).toContain('Ada Okafor');
        wrapper.unmount();
    });

    test('shows the server error for an unknown code', async () => {
        api.classroom.join.mockRejectedValue(new Error('class not found'));
        const wrapper = renderJoin('/classroom/join/NOPE');
        await flush(wrapper);
        expect(wrapper.find('[role="alert"]').text()).toContain('class not found');
        expect(wrapper.find('input').prop('value')).toBe('NOPE');
        wrapper.unmount();
    });

    test('signs a student in with a password and stores the session', async () => {
        api.classroom.join.mockResolvedValue(PASSWORD_ROSTER);
        api.classroom.login.mockResolvedValue({
            ok: true, token: 'tok', username: 'adaokafor~yumrk', displayName: 'Ada Okafor', isStudent: true
        });
        const wrapper = renderJoin('/classroom/join/FB2HV829');
        await flush(wrapper);
        clickButton(wrapper, 'Ada Okafor');
        wrapper.update();
        expect(wrapper.text()).toContain('Hi, Ada Okafor!');
        wrapper.find('input[type="password"]').simulate('change', {target: {value: 'violet-robin-75'}});
        wrapper.find('form').simulate('submit');
        await flush(wrapper);
        expect(api.classroom.login)
            .toHaveBeenCalledWith({code: 'FB2HV829', studentId: 's1', password: 'violet-robin-75'});
        expect(mockLoginStudent)
            .toHaveBeenCalledWith({token: 'tok', username: 'adaokafor~yumrk', displayName: 'Ada Okafor'});
        expect(wrapper.find('#landed').exists()).toBe(true);
        wrapper.unmount();
    });

    test('shows the server message when the password does not match', async () => {
        api.classroom.join.mockResolvedValue(PASSWORD_ROSTER);
        const error = new Error('That sign-in did not match. Check with your teacher and try again.');
        error.status = 401;
        api.classroom.login.mockRejectedValue(error);
        const wrapper = renderJoin('/classroom/join/FB2HV829');
        await flush(wrapper);
        clickButton(wrapper, 'Ben Carter');
        wrapper.update();
        wrapper.find('input[type="password"]').simulate('change', {target: {value: 'wrong'}});
        wrapper.find('form').simulate('submit');
        await flush(wrapper);
        expect(mockLoginStudent).not.toHaveBeenCalled();
        expect(wrapper.find('[role="alert"]').text()).toContain('did not match');
        expect(wrapper.find('input[type="password"]').prop('value')).toBe('');
        wrapper.unmount();
    });

    test('collects three pictures in order and allows clearing them', async () => {
        api.classroom.join.mockResolvedValue(PICTURE_ROSTER);
        const locked = new Error('Too many tries. Ask your teacher to unlock your account.');
        locked.status = 429;
        locked.code = 'login_locked';
        api.classroom.login.mockRejectedValueOnce(locked)
            .mockResolvedValueOnce({token: 'tok2', username: 'mia~jfsnb', displayName: 'Mia'});
        const wrapper = renderJoin('/classroom/join/8GXEVEFY');
        await flush(wrapper);
        clickButton(wrapper, 'Mia');
        wrapper.update();
        const submit = () => wrapper.find('button[type="submit"]').first();
        expect(submit().prop('disabled')).toBe(true);
        clickButton(wrapper, 'Snail');
        clickButton(wrapper, 'Rocket');
        wrapper.update();
        clickButton(wrapper, 'Clear');
        wrapper.update();
        expect(submit().prop('disabled')).toBe(true);
        clickButton(wrapper, 'Snail');
        clickButton(wrapper, 'Rocket');
        clickButton(wrapper, 'Tree');
        wrapper.update();
        expect(submit().prop('disabled')).toBe(false);
        expect(wrapper.find('button[aria-label="Cat"]').prop('disabled')).toBe(true);
        wrapper.find('form').simulate('submit');
        await flush(wrapper);
        expect(api.classroom.login)
            .toHaveBeenCalledWith({code: '8GXEVEFY', studentId: 's3', pictures: ['snail', 'rocket', 'tree']});
        expect(wrapper.find('[role="alert"]').text()).toContain('Too many tries');
        clickButton(wrapper, 'Snail');
        clickButton(wrapper, 'Rocket');
        clickButton(wrapper, 'Tree');
        wrapper.update();
        wrapper.find('form').simulate('submit');
        await flush(wrapper);
        expect(mockLoginStudent).toHaveBeenCalledWith({token: 'tok2', username: 'mia~jfsnb', displayName: 'Mia'});
        wrapper.unmount();
    });
});
