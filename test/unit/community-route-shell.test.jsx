import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import setPageMeta, {setRouteMeta} from '../../src/community/page-meta.js';
import RouteErrorBoundary from '../../src/community/components/RouteErrorBoundary.jsx';
import {reportSiteError} from '../../src/lib/error-reporter.js';

jest.mock('../../src/lib/error-reporter.js', () => ({reportSiteError: jest.fn()}));
jest.mock('../../src/lib/utils/log.js', () => ({error: jest.fn()}));
jest.mock('../../src/community/i18n.jsx', () => ({
    useCommunityIntl: () => ({t: key => key, text: key => key})
}));

describe('community page titles', () => {
    test('keeps a page title when the route default is refreshed', () => {
        setRouteMeta({title: 'Project'}, true);
        expect(document.title).toBe('Project - MistWarp');

        setPageMeta({title: 'Cool game'});
        setRouteMeta({title: 'Projet'}, false);
        expect(document.title).toBe('Cool game - MistWarp');
    });

    test('replaces the page title after a navigation', () => {
        setPageMeta({title: 'Cool game'});
        setRouteMeta({title: 'Explore'}, true);
        expect(document.title).toBe('Explore - MistWarp');

        setRouteMeta({title: 'Explorer'}, false);
        expect(document.title).toBe('Explorer - MistWarp');
    });
});

let crash = true;
const Crashy = () => {
    if (crash) throw new Error('Broken page');
    return <p>Page works</p>;
};
let changePath = null;
const Shell = () => {
    const [path, setPath] = React.useState('/broken');
    changePath = setPath;
    return <RouteErrorBoundary resetKey={path}><Crashy /></RouteErrorBoundary>;
};

describe('community route error boundary', () => {
    beforeEach(() => {
        crash = true;
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        console.error.mockRestore();
    });

    test('shows a community message, reports the crash, and tries again', () => {
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <RouteErrorBoundary resetKey="/broken"><Crashy /></RouteErrorBoundary>
            </MemoryRouter>
        );

        expect(wrapper.text()).toContain('Something went wrong on this page.');
        expect(wrapper.text()).not.toContain('Device backups');
        expect(wrapper.find('a[href="/"]').text()).toContain('Go to home');
        expect(reportSiteError).toHaveBeenCalledWith(expect.objectContaining({message: 'Broken page', kind: 'react'}));

        crash = false;
        wrapper.find('button').filterWhere(button => button.text().includes('Try again'))
            .simulate('click');
        expect(wrapper.text()).toContain('Page works');
        wrapper.unmount();
    });

    test('clears the crash when the route changes', () => {
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <Shell />
            </MemoryRouter>
        );
        expect(wrapper.text()).toContain('Something went wrong on this page.');

        crash = false;
        act(() => changePath('/explore'));
        wrapper.update();
        expect(wrapper.text()).toContain('Page works');
        wrapper.unmount();
    });
});
