import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter, Route, Routes} from 'react-router-dom';

import Org, {normalizeOrgTabParams, safeLinks} from '../../src/community/pages/Org.jsx';
import {accountKind} from '../../src/community/pages/Account.jsx';
import OrgLabel, {isOrgOwned} from '../../src/community/components/OrgLabel.jsx';
import OrgMoveRow from '../../src/community/components/OrgMoveRow.jsx';
import {ownerOptions, publishableOrgs} from '../../src/community/use-publishable-orgs.js';
import api from '../../src/community/api';

jest.mock('../../src/community/api', () => ({
    __esModule: true,
    default: {org: jest.fn()}
}));
jest.mock('../../src/community/rotur.js', () => ({
    avatar: name => `https://avatars.rotur.dev/${name}`,
    banner: name => `https://avatars.rotur.dev/.banners/${name}`
}));
jest.mock('../../src/community/i18n.jsx', () => ({
    useCommunityIntl: () => ({text: (key, values) => (values ? `${key} ${JSON.stringify(values)}` : key)})
}));
jest.mock('../../src/community/page-meta.js', () => jest.fn());
jest.mock('../../src/community/components/ProjectCard.jsx', () => ({project}) => <div className="project">{project.title}</div>);
jest.mock('../../src/community/components/SpaceCard.jsx', () => ({space}) => <div className="space">{space.title}</div>);
jest.mock('../../src/community/components/Avatar.jsx', () => () => <div className="avatar" />);

const orgData = {
    ok: true,
    org: {username: 'studio',
        displayName: 'The Studio',
        bio: '# Hello',
        memberCount: 3,
        links: [
            {name: 'Site', url: 'https://studio.example'},
            {name: 'Bad', url: 'javascript:alert(1)'}
        ]},
    members: [{username: 'ada', displayName: 'Ada', admin: true}],
    projects: [{id: 'p1', title: 'Game', ownerType: 'org'}],
    spaces: [{_id: 's1', title: 'Jam', kind: 'challenge'}],
    isMember: false,
    canManage: false
};

const renderOrg = async (path = '/users/studio', data = orgData) => {
    api.org.mockResolvedValue(data);
    let wrapper;
    await act(async () => {
        wrapper = mount(
            <MemoryRouter
                initialEntries={[path]}
                future={{v7_startTransition: true, v7_relativeSplatPath: true}}
            >
                <Routes><Route
                    path="/users/:name"
                    element={<Org name="studio" />}
                /></Routes>
            </MemoryRouter>
        );
        await Promise.resolve();
    });
    wrapper.update();
    return wrapper;
};

describe('Rotur orgs on MistWarp', () => {
    test('an org account is told apart from a person by Rotur', () => {
        expect(accountKind({account_type: 'org'})).toBe('org');
        expect(accountKind({account_type: 'bot'})).toBe('person');
        expect(accountKind(null)).toBe('person');
    });

    test('only content marked as org-owned gets the label', () => {
        expect(isOrgOwned({ownerType: 'org'})).toBe(true);
        expect(isOrgOwned({ownerType: ''})).toBe(false);
        expect(isOrgOwned(null)).toBe(false);
        expect(mount(<OrgLabel owned={false} />).html()).toBeNull();
        expect(mount(<OrgLabel owned />).text()).toBe('Organisation');
    });

    test('canonicalizes default and invalid org tabs', () => {
        expect(normalizeOrgTabParams(new URLSearchParams('tab=unknown')).toString()).toBe('');
        expect(normalizeOrgTabParams(new URLSearchParams('tab=projects')).toString()).toBe('');
        expect(normalizeOrgTabParams(new URLSearchParams('tab=members')).toString()).toBe('tab=members');
    });

    test('only https links from the org profile are shown', () => {
        expect(safeLinks(orgData.org.links)).toEqual([{name: 'Site', url: 'https://studio.example'}]);
        expect(safeLinks(null)).toEqual([]);
    });

    test('the org page lists its projects and links to Rotur', async () => {
        const wrapper = await renderOrg();
        expect(api.org).toHaveBeenCalledWith('studio');
        expect(wrapper.find('.project').map(node => node.text())).toEqual(['Game']);
        expect(wrapper.find('a[href="https://rotur.dev/@studio"]').exists()).toBe(true);
        expect(wrapper.find('a[href="https://rotur.dev/orgs/studio/settings"]').exists()).toBe(false);
        expect(wrapper.find('a[href="https://studio.example"]').exists()).toBe(true);
        expect(wrapper.text()).not.toContain('javascript');
    });

    test('managers see creation links for the org', async () => {
        const wrapper = await renderOrg('/users/studio?tab=challenges', {...orgData, isMember: true, canManage: true});
        expect(wrapper.find('.space').map(node => node.text())).toEqual(['Jam']);
        expect(wrapper.find('a[href="/spaces?create=1&org=studio&kind=challenge"]').exists()).toBe(true);
        expect(wrapper.find('a[href="https://rotur.dev/orgs/studio/settings"]').exists()).toBe(true);
    });

    test('only orgs someone can publish for are offered as owners', () => {
        const orgs = publishableOrgs({orgs: [
            {username: 'studio', displayName: 'The Studio', canPublish: true},
            {username: 'bank', canPublish: false},
            null
        ]});
        expect(orgs.map(org => org.username)).toEqual(['studio']);
        expect(ownerOptions({selfLabel: 'You', orgs, current: ''})).toEqual([
            {value: '', label: 'You'},
            {value: 'studio', label: 'The Studio (@studio)'}
        ]);
        expect(ownerOptions({selfLabel: 'You', orgs: [], current: 'studio'}).map(choice => choice.value))
            .toEqual(['', 'studio']);
    });

    test('moving to an org skips the one that already owns it', () => {
        const onMove = jest.fn();
        const orgs = [{username: 'studio'}, {username: 'other', displayName: 'Other'}];
        const wrapper = mount(<OrgMoveRow
            orgs={orgs}
            owner="Studio"
            onMove={onMove}
        />);
        expect(wrapper.find('option').map(node => node.prop('value'))).toEqual(['', 'other']);
        wrapper.find('select').simulate('change', {target: {value: 'other'}});
        wrapper.find('button').simulate('click');
        expect(onMove).toHaveBeenCalledWith('other');
        const owned = mount(<OrgMoveRow
            orgs={[{username: 'studio'}]}
            owner="studio"
            onMove={onMove}
        />);
        expect(owned.find('a[href="https://rotur.dev/orgs/new"]').exists()).toBe(true);
        expect(owned.text()).toContain('Other organisations you can publish for will appear here.');
        const none = mount(<OrgMoveRow
            orgs={[]}
            owner="ada"
            onMove={onMove}
        />);
        expect(none.text()).toContain('Organisations you can publish for will appear here.');
        expect(none.text()).not.toContain('Other');
    });
});
