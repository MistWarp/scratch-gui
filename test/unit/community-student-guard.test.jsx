/* eslint-disable react/display-name, react/jsx-no-bind */
import React from 'react';
import {mount} from 'enzyme';
import {MemoryRouter, Route, Routes, useLocation} from 'react-router-dom';

import {StudentGuard, studentAllowed} from '../../src/community/App.jsx';

let mockUser = null;

jest.mock('../../src/community/UserContext.jsx', () => ({
    UserProvider: ({children}) => children,
    useUser: () => ({user: mockUser, loading: false})
}));
jest.mock('../../src/community/components/NavBar.jsx', () => () => null);
jest.mock('../../src/community/components/AnnouncementBanner.jsx', () => () => null);
jest.mock('../../src/community/components/StandingBanner.jsx', () => () => null);
jest.mock('../../src/community/components/UpgradeCelebration.jsx', () => () => null);
jest.mock('../../src/community/components/Footer.jsx', () => () => null);
jest.mock('../../src/components/update-toast/update-toast.jsx', () => () => null);
jest.mock('../../src/lib/error-reporter.js', () => ({initSiteErrorReporting: () => {}}));
jest.mock('../../src/community/page-meta.js', () => () => {});
jest.mock('../../src/community/i18n.jsx', () => ({
    useCommunityIntl: () => ({t: key => key, text: key => key})
}));

const Where = () => {
    const {pathname} = useLocation();
    return <p id="where">{pathname}</p>;
};

const render = path => mount(
    <MemoryRouter
        initialEntries={[path]}
        future={{v7_startTransition: true, v7_relativeSplatPath: true}}
    >
        <StudentGuard>
            <Routes>
                <Route
                    path="*"
                    element={<Where />}
                />
            </Routes>
        </StudentGuard>
    </MemoryRouter>
);

describe('student route guard', () => {
    afterEach(() => {
        mockUser = null;
    });

    test('lists exactly the routes a student may visit', () => {
        expect(studentAllowed('/classroom')).toBe(true);
        expect(studentAllowed('/classroom/join')).toBe(true);
        expect(studentAllowed('/classroom/join/FB2HV829')).toBe(true);
        expect(studentAllowed('/classroom/claim/ABC')).toBe(true);
        expect(studentAllowed('/trust')).toBe(true);
        ['/', '/explore', '/project/x', '/users/mist', '/settings', '/mystuff', '/notifications', '/support',
            '/classroom/clsOq8MjmrdUY', '/classroom/school'].forEach(path => {
            expect(studentAllowed(path)).toBe(false);
        });
    });

    test('redirects a signed-in student from community routes to the classroom', () => {
        mockUser = {username: 'adaokafor~yumrk', isStudent: true};
        ['/', '/explore', '/project/x'].forEach(path => {
            const wrapper = render(path);
            expect(wrapper.find('#where').text()).toBe('/classroom');
            wrapper.unmount();
        });
    });

    test('leaves the student sign-in and claim pages and the classroom alone', () => {
        mockUser = {username: 'adaokafor~yumrk', isStudent: true};
        ['/classroom', '/classroom/join/FB2HV829', '/classroom/claim/ABC'].forEach(path => {
            const wrapper = render(path);
            expect(wrapper.find('#where').text()).toBe(path);
            wrapper.unmount();
        });
    });

    test('does not touch teachers or signed-out visitors', () => {
        mockUser = {username: 'Mist', isStudent: false};
        let wrapper = render('/explore');
        expect(wrapper.find('#where').text()).toBe('/explore');
        wrapper.unmount();
        mockUser = null;
        wrapper = render('/project/x');
        expect(wrapper.find('#where').text()).toBe('/project/x');
        wrapper.unmount();
    });
});
