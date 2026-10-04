import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter, useNavigate} from 'react-router-dom';

import {RouteMeta} from '../../src/community/App.jsx';

jest.mock('../../src/community/i18n.jsx', () => ({
    useCommunityIntl: () => ({t: key => key, text: key => key})
}));
jest.mock('../../src/community/components/NavBar.jsx', () => () => null);
jest.mock('../../src/components/update-toast/update-toast.jsx', () => () => null);
jest.mock('../../src/lib/error-reporter.js', () => ({initSiteErrorReporting: jest.fn(), reportSiteError: jest.fn()}));

let navigate = null;
const Probe = () => {
    navigate = useNavigate();
    return null;
};

describe('community route changes', () => {
    let main;
    beforeEach(() => {
        main = document.createElement('div');
        main.id = 'mw-main-content';
        main.tabIndex = -1;
        document.body.appendChild(main);
        window.scrollTo = jest.fn();
    });

    afterEach(() => {
        main.remove();
    });

    test('scrolls to the top and moves focus to the page on a new page, but not on first load', () => {
        const wrapper = mount(
            <MemoryRouter
                initialEntries={['/explore']}
                future={{v7_startTransition: true, v7_relativeSplatPath: true}}
            >
                <Probe />
                <RouteMeta />
            </MemoryRouter>
        );
        expect(window.scrollTo).not.toHaveBeenCalled();
        expect(document.activeElement).not.toBe(main);
        expect(document.title).toBe('Explore - MistWarp');

        act(() => navigate('/themes'));
        expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
        expect(document.activeElement).toBe(main);
        expect(document.title).toBe('Themes - MistWarp');

        window.scrollTo.mockClear();
        act(() => navigate('/themes?sort=new'));
        expect(window.scrollTo).not.toHaveBeenCalled();
        wrapper.unmount();
    });

    test('returns to the saved position on Back', () => {
        const wrapper = mount(
            <MemoryRouter
                initialEntries={['/explore']}
                future={{v7_startTransition: true, v7_relativeSplatPath: true}}
            >
                <Probe />
                <RouteMeta />
            </MemoryRouter>
        );
        window.scrollY = 640;
        window.dispatchEvent(new Event('scroll'));
        act(() => navigate('/themes'));
        window.scrollY = 0;
        window.scrollTo.mockClear();

        act(() => navigate(-1));
        expect(window.scrollTo).toHaveBeenCalledWith(0, 640);
        expect(window.scrollTo).not.toHaveBeenCalledWith(0, 0);
        wrapper.unmount();
        window.dispatchEvent(new Event('mousedown'));
    });
});
