import React from 'react';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import RouteLoading, {getExploreSection} from '../../src/community/components/RouteLoading.jsx';
import ExploreNav from '../../src/community/components/ExploreNav.jsx';
import StatusMessage from '../../src/community/components/ui/StatusMessage.jsx';

const renderAt = path => mount(
    <MemoryRouter initialEntries={[path]} future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
        <RouteLoading />
    </MemoryRouter>
);

describe('route loading keeps the Explore shell', () => {
    test('maps each Explore section route to its tab', () => {
        expect(getExploreSection('/explore', '')).toEqual({active: 'projects', lead: null});
        expect(getExploreSection('/groups', '')).toEqual({active: 'groups', lead: 'groups'});
        expect(getExploreSection('/bounties', '')).toEqual({active: 'bounties', lead: 'bounties'});
        expect(getExploreSection('/themes', '')).toEqual({active: 'themes', lead: 'themes'});
    });

    test('maps the space kind to the right tab', () => {
        expect(getExploreSection('/spaces', '')).toEqual({active: 'studios', lead: 'studios'});
        expect(getExploreSection('/spaces', '?kind=studio')).toEqual({active: 'studios', lead: 'studios'});
        expect(getExploreSection('/spaces', '?kind=challenge')).toEqual({active: 'challenges', lead: 'challenges'});
        expect(getExploreSection('/spaces', '?kind=collection')).toEqual({active: 'collections', lead: 'collections'});
        expect(getExploreSection('/spaces', '?kind=mine')).toEqual({active: 'studios', lead: 'mine'});
    });

    test('leaves detail and unrelated routes to the generic loader', () => {
        expect(getExploreSection('/bounties/abc', '')).toBeNull();
        expect(getExploreSection('/themes/abc', '')).toBeNull();
        expect(getExploreSection('/groups/some-tag', '')).toBeNull();
        expect(getExploreSection('/p/cool-project', '')).toBeNull();
        expect(getExploreSection('/', '')).toBeNull();
    });

    test('shows the Explore tabs and content loading on an Explore section', () => {
        const wrapper = renderAt('/bounties');

        expect(wrapper.find(ExploreNav).prop('active')).toBe('bounties');
        expect(wrapper.find(StatusMessage).exists()).toBe(true);
    });

    test('keeps the generic loader on routes without an Explore shell', () => {
        const wrapper = renderAt('/p/cool-project');

        expect(wrapper.find(ExploreNav).exists()).toBe(false);
        expect(wrapper.text()).toContain('Loading page…');
    });
});
