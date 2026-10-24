import React from 'react';
import {mount} from 'enzyme';
import {MemoryRouter} from 'react-router-dom';

import {UploadUsage} from '../../src/community/pages/MyStuff.jsx';

jest.mock('../../src/community/UserContext.jsx', () => ({useUser: () => ({user: null, login: jest.fn()})}));
jest.mock('../../src/community/components/GroupTag.jsx', () => () => null);
jest.mock('../../src/community/api.js', () => ({
    __esModule: true,
    default: {},
    editorUrl: jest.fn(() => '/editor'),
    projectUrl: jest.fn(id => `/projects/${id}`)
}));

const perks = {tier: 'Lite', mistwarp: {maxProjectAssetsBytes: 104857600, maxProjectAssetBytes: 26214400}};
const render = quota => mount(<MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
    <UploadUsage
        quota={quota}
        perks={perks}
        onRetry={jest.fn()}
    />
</MemoryRouter>);
const text = wrapper => wrapper.text().replace(/\u00a0/g, ' ');

test('shows the one Rotur storage allowance and what MistWarp uses of it', () => {
    const wrapper = render({
        shared: true,
        known: true,
        used: 3100000000,
        limit: 5000000000,
        remaining: 1900000000,
        mistwarp: 2400000000,
        pending: 0,
        largest: [],
        membershipUrl: 'https://rotur.dev/membership'
    });
    const copy = text(wrapper);
    expect(copy).toContain('3.1 GBUsed across Rotur');
    expect(copy).toContain('2.4 GBUsed by MistWarp');
    expect(copy).toContain('5 GBLimit');
    expect(copy).toContain('1.9 GBRemaining');
    expect(copy).toContain('62% full');
    expect(copy).toContain('which your other Rotur apps share');
    expect(copy).toContain('Your Lite membership allows 100 MB of assets per project and 25 MB per asset.');
    expect(copy).not.toContain('Your Rotur storage is full');
    expect(wrapper.find('a[href="https://rotur.dev/membership"]')).toHaveLength(0);
    wrapper.unmount();
});

test('says plainly when the storage is full and where to get more', () => {
    const wrapper = render({
        shared: true,
        known: true,
        used: 1000000000,
        limit: 1000000000,
        remaining: 0,
        mistwarp: 900000000,
        pending: 0,
        largest: [],
        membershipUrl: 'https://rotur.dev/membership'
    });
    const copy = text(wrapper);
    expect(copy).toContain('Your Rotur storage is full');
    expect(copy).toContain('You can still save a project at the same size or smaller.');
    const link = wrapper.find('a[href="https://rotur.dev/membership"]');
    expect(link).toHaveLength(1);
    expect(link.text()).toBe('Rotur membership');
    expect(copy).toContain('100% full');
    wrapper.unmount();
});

test('says when Rotur could not be asked', () => {
    const wrapper = render({shared: true, known: false, used: 0, limit: 0, remaining: 0, mistwarp: 0, largest: []});
    expect(text(wrapper)).toContain('Rotur couldn’t say how much storage you have left just now.');
    expect(text(wrapper)).not.toContain('Your Rotur storage is full');
    wrapper.unmount();
});

test('keeps a classroom student on their class storage', () => {
    const wrapper = render({
        shared: false,
        used: 524288000,
        limit: 1073741824,
        remaining: 549453824,
        pending: 0,
        largest: []
    });
    const copy = text(wrapper);
    expect(copy).toContain('500 MBUsed');
    expect(copy).toContain('1 GBLimit');
    expect(copy).not.toContain('Rotur storage');
    wrapper.unmount();
});
