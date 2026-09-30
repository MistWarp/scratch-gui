/* eslint-disable react/jsx-no-bind */
import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter, Route, Routes} from 'react-router-dom';

import Classroom from '../../src/community/pages/Classroom.jsx';
import ClassroomAbout from '../../src/community/pages/ClassroomAbout.jsx';
import ShareWithTeacher from '../../src/community/components/classroom/ShareWithTeacher.jsx';
import api from '../../src/community/api.js';
import copyText from '../../src/community/copy-text.js';
import {useUser} from '../../src/community/UserContext.jsx';

jest.mock('../../src/community/api.js', () => ({
    __esModule: true,
    default: {
        classroom: {
            overview: jest.fn(),
            startTrial: jest.fn(),
            billingCheckout: jest.fn(),
            billingPortal: jest.fn()
        }
    }
}));
jest.mock('../../src/community/copy-text.js', () => ({__esModule: true, default: jest.fn(() => Promise.resolve())}));
jest.mock('../../src/community/UserContext.jsx', () => ({useUser: jest.fn()}));
jest.mock('../../src/community/locale', () => ({getCommunityLocale: () => 'en', formatCommunityMessage: key => key}));
jest.mock('../../src/community/i18n.jsx', () => {
    // eslint-disable-next-line global-require
    const IntlMessageFormat = require('intl-messageformat').default;
    return {
        useCommunityIntl: () => ({
            t: key => key,
            text: (key, values) => (values ? new IntlMessageFormat(key, 'en').format(values) : key)
        })
    };
});

const ROUTER_FUTURE = {v7_startTransition: true, v7_relativeSplatPath: true};

const flush = async wrapper => {
    await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
    });
    wrapper.update();
};

const renderAt = (element, path = '/classroom') => mount(
    <MemoryRouter initialEntries={[path]} future={ROUTER_FUTURE}>
        <Routes>
            <Route path="/classroom" element={element} />
            <Route path="/classroom/about" element={element} />
        </Routes>
    </MemoryRouter>
);

const texts = (wrapper, selector) => wrapper.find(selector).map(node => node.text().trim())
    .filter(Boolean);

const teacherOverview = (plan, billing) => ({
    role: 'teacher',
    plan,
    usage: {seats: 0, storageBytes: 0, classes: 0},
    billing: {available: false, canManage: false, seatPackSize: 10, ...billing},
    school: null,
    classes: []
});

describe('Classroom pitch page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('signed-out visitors to /classroom see the pitch with student and teacher sign-in', async () => {
        const login = jest.fn(() => Promise.resolve());
        useUser.mockReturnValue({user: null, loading: false, login});
        const wrapper = renderAt(<Classroom />);
        expect(wrapper.find('h1').text()).toContain('MistWarp Classroom');
        expect(texts(wrapper, 'a')).toContain('Student sign-in');
        expect(texts(wrapper, 'button')).toContain('Sign in to start a class');
        expect(texts(wrapper, 'a')).toContain('Read how Classroom handles student data');
        await act(async () => {
            wrapper.find('button').filterWhere(node => node.text().includes('Sign in to start a class'))
                .first()
                .simulate('click');
        });
        expect(login).toHaveBeenCalled();
        expect(api.classroom.overview).not.toHaveBeenCalled();
    });

    test('signed-in teachers get a direct link to start a class and no student sign-in row', () => {
        useUser.mockReturnValue({user: {username: 'teach'}, loading: false, login: jest.fn()});
        const wrapper = renderAt(<ClassroomAbout />, '/classroom/about');
        const start = wrapper.find('a').filterWhere(node => node.text().includes('Start a free class'));
        expect(start.first().prop('href')).toBe('/classroom');
        expect(texts(wrapper, 'a')).not.toContain('Student sign-in');
    });
});

describe('Share with your teacher', () => {
    const originalShare = navigator.share;

    afterEach(() => {
        navigator.share = originalShare;
        jest.clearAllMocks();
    });

    test('uses the system share sheet when there is one', async () => {
        navigator.share = jest.fn(() => Promise.resolve());
        const wrapper = mount(<ShareWithTeacher />);
        await act(async () => {
            wrapper.find('button').simulate('click');
        });
        expect(navigator.share).toHaveBeenCalledWith(expect.objectContaining({url: 'https://mistwarp.org/classroom/about'}));
        expect(copyText).not.toHaveBeenCalled();
    });

    test('copies the link when sharing is unavailable', async () => {
        navigator.share = undefined;
        const wrapper = mount(<ShareWithTeacher />);
        await act(async () => {
            wrapper.find('button').simulate('click');
        });
        wrapper.update();
        expect(copyText).toHaveBeenCalledWith('https://mistwarp.org/classroom/about');
        expect(wrapper.find('button').text()).toContain('Link copied');
    });
});

describe('Classroom trial', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useUser.mockReturnValue({user: {username: 'teach'}, loading: false, login: jest.fn()});
    });

    test('free teachers are offered the trial and starting it reloads the plan', async () => {
        const freePlan = {tier: 'free', seats: 5, maxClasses: 1, storageBytes: 1024, expiresAt: 0};
        const trialPlan = {tier: 'classroom', seats: 35, maxClasses: 12, storageBytes: 2048, expiresAt: Date.UTC(2026, 9, 30)};
        api.classroom.overview
            .mockResolvedValueOnce(teacherOverview(freePlan, {trialAvailable: true, trialDays: 30, trialEndsAt: 0}))
            .mockResolvedValueOnce(teacherOverview(trialPlan, {trialAvailable: false, trialDays: 30, trialEndsAt: trialPlan.expiresAt}));
        api.classroom.startTrial.mockResolvedValue({ok: true});
        const wrapper = renderAt(<Classroom />);
        await flush(wrapper);
        expect(wrapper.text()).toContain('Free plan');
        expect(wrapper.text()).toContain('Try the Classroom plan free for 30 days');
        await act(async () => {
            wrapper.find('button').filterWhere(node => node.text().includes('Start free trial'))
                .first()
                .simulate('click');
        });
        await flush(wrapper);
        expect(api.classroom.startTrial).toHaveBeenCalledTimes(1);
        expect(api.classroom.overview).toHaveBeenCalledTimes(2);
        expect(wrapper.text()).toContain('Classroom trial');
        expect(wrapper.text()).toContain('Your trial ends on');
        expect(wrapper.text()).not.toContain('Start free trial');
        expect(wrapper.text()).not.toContain('Renews on');
    });

    test('a failed trial start shows the reason', async () => {
        api.classroom.overview.mockResolvedValue(teacherOverview(
            {tier: 'free', seats: 5, maxClasses: 1, storageBytes: 1024},
            {trialAvailable: true, trialDays: 30}
        ));
        api.classroom.startTrial.mockRejectedValue(new Error('The free trial is for teachers who have not had a Classroom plan before.'));
        const wrapper = renderAt(<Classroom />);
        await flush(wrapper);
        await act(async () => {
            wrapper.find('button').filterWhere(node => node.text().includes('Start free trial'))
                .first()
                .simulate('click');
        });
        await flush(wrapper);
        expect(wrapper.find('[role="alert"]').text()).toContain('have not had a Classroom plan before');
    });

    test('teachers who used the trial are not offered it again', async () => {
        api.classroom.overview.mockResolvedValue(teacherOverview(
            {tier: 'free', seats: 5, maxClasses: 1, storageBytes: 1024},
            {trialAvailable: false, trialDays: 30}
        ));
        const wrapper = renderAt(<Classroom />);
        await flush(wrapper);
        expect(wrapper.text()).toContain('Free plan');
        expect(wrapper.text()).not.toContain('Start free trial');
    });
});
