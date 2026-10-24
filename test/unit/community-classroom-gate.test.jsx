/* eslint-disable react/display-name, react/jsx-no-bind */
import React from 'react';
import {mount} from 'enzyme';
import {act} from 'react-dom/test-utils';
import {MemoryRouter, Routes, Route} from 'react-router-dom';

import {forgetClassroomAvailability, probeClassroom} from '../../src/community/classroom-availability.js';
import ClassroomRoute from '../../src/community/components/ClassroomRoute.jsx';
import Footer from '../../src/community/components/Footer.jsx';

const mockRequest = jest.fn();
let mockUser = null;

jest.mock('../../src/lib/community/api.js', () => ({
    request: (...args) => mockRequest(...args)
}));
jest.mock('../../src/community/UserContext.jsx', () => ({
    useUser: () => ({user: mockUser, loading: false})
}));
jest.mock('../../src/community/api.js', () => ({
    __esModule: true,
    default: {},
    editorUrl: () => '/editor'
}));
jest.mock('../../src/community/i18n.jsx', () => ({
    useCommunityIntl: () => ({t: key => key, text: key => key})
}));
jest.mock('../../src/community/page-meta.js', () => () => {});

const answer = (status, body) => Promise.resolve({
    status,
    json: () => Promise.resolve(body)
});

const flush = async wrapper => {
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });
    wrapper.update();
};

const renderAt = (path, element) => mount(
    <MemoryRouter
        initialEntries={[path]}
        future={{v7_startTransition: true, v7_relativeSplatPath: true}}
    >{element}</MemoryRouter>
);

describe('Classroom availability', () => {
    beforeEach(() => {
        forgetClassroomAvailability();
        mockRequest.mockReset();
        mockUser = null;
    });

    test('the API saying yes makes Classroom available', async () => {
        mockRequest.mockReturnValue(answer(200, {ok: true, available: true}));
        await expect(probeClassroom('')).resolves.toBe(true);
        expect(mockRequest).toHaveBeenCalledWith('/classroom/available', {raw: true, cache: false});
    });

    test('a 404, a refusal or a network error all mean unavailable', async () => {
        mockRequest.mockReturnValueOnce(answer(404, {ok: false}));
        await expect(probeClassroom('a')).resolves.toBe(false);
        mockRequest.mockReturnValueOnce(answer(200, {ok: true, available: false}));
        await expect(probeClassroom('b')).resolves.toBe(false);
        mockRequest.mockReturnValueOnce(Promise.reject(new Error('offline')));
        await expect(probeClassroom('c')).resolves.toBe(false);
    });

    test('the answer is kept for each account', async () => {
        mockRequest.mockReturnValue(answer(200, {ok: true, available: true}));
        await probeClassroom('mist');
        await probeClassroom('mist');
        expect(mockRequest).toHaveBeenCalledTimes(1);
        mockRequest.mockReturnValue(answer(404, {ok: false}));
        await expect(probeClassroom('nora')).resolves.toBe(false);
        expect(mockRequest).toHaveBeenCalledTimes(2);
    });

    test('a Classroom page shows the not found page while Classroom is off', async () => {
        mockRequest.mockReturnValue(answer(404, {ok: false}));
        const wrapper = renderAt('/classroom', (
            <Routes>
                <Route
                    path="/classroom"
                    element={<ClassroomRoute />}
                >
                    <Route
                        index
                        element={<p id="classroom">{'Classroom'}</p>}
                    />
                </Route>
            </Routes>
        ));
        await flush(wrapper);
        expect(wrapper.find('#classroom')).toHaveLength(0);
        expect(wrapper.text()).toContain('That page does not exist.');
    });

    test('a Classroom page renders once the API says it is available', async () => {
        mockRequest.mockReturnValue(answer(200, {ok: true, available: true}));
        const wrapper = renderAt('/classroom', (
            <Routes>
                <Route
                    path="/classroom"
                    element={<ClassroomRoute />}
                >
                    <Route
                        index
                        element={<p id="classroom">{'Classroom'}</p>}
                    />
                </Route>
            </Routes>
        ));
        await flush(wrapper);
        expect(wrapper.find('#classroom')).toHaveLength(1);
    });

    test('the footer names Classroom only when it is available', async () => {
        mockRequest.mockReturnValue(answer(404, {ok: false}));
        const off = renderAt('/', <Footer />);
        await flush(off);
        expect(off.find('a[href^="/classroom"]')).toHaveLength(0);
        expect(off.text()).not.toContain('Classroom');
        off.unmount();
        forgetClassroomAvailability();
        mockRequest.mockReturnValue(answer(200, {ok: true, available: true}));
        const on = renderAt('/', <Footer />);
        await flush(on);
        expect(on.find('a[href="/classroom/about"]')).toHaveLength(1);
        expect(on.find('a[href="/classroom/terms"]')).toHaveLength(1);
    });
});
