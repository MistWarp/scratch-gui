import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import Roadmap from '../../src/community/pages/Roadmap.jsx';
import api from '../../src/community/api.js';

jest.mock('../../src/community/api.js', () => ({
    __esModule: true,
    default: {developmentPulls: jest.fn(), roadmap: jest.fn(), updateIdea: jest.fn(), voteIdea: jest.fn()}
}));
jest.mock('../../src/community/UserContext.jsx', () => ({
    useUser: () => ({user: {username: 'Mist', isAdmin: true}, login: jest.fn()})
}));
jest.mock('../../src/community/components/Avatar.jsx', () => () => <span />);
jest.mock('../../src/community/components/RichText.jsx', () => ({text}) => <span>{text}</span>);
jest.mock('../../src/community/components/CommentThread.jsx', () => () => <div>Entry discussion</div>);
jest.mock('../../src/lib/themes/custom-themes.js', () => ({
    customThemeManager: {themes: {clear: jest.fn()}, loadCustomThemes: jest.fn()}
}));

const entry = (status, index) => ({
    _id: `${status}-${index}`,
    status,
    title: `${status} entry ${index}`,
    description: `Full details for ${status} entry ${index}`,
    category: 'Editor',
    kind: 'idea',
    author: 'Mist',
    created: Date.now(),
    score: 0
});

const render = async (url = '/roadmap') => {
    let wrapper;
    await act(async () => {
        wrapper = mount(
            <MemoryRouter initialEntries={[url]} future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <Routes>
                    <Route path="/roadmap" element={<Roadmap />} />
                    <Route path="/roadmap/changes" element={<Roadmap changes />} />
                    <Route path="/roadmap/entry/:entryId" element={<Roadmap />} />
                    <Route path="/roadmap/:status" element={<Roadmap />} />
                </Routes>
            </MemoryRouter>
        );
    });
    wrapper.update();
    return wrapper;
};

const pull = overrides => ({
    id: `${overrides.repo || 'scratch-gui'}#${overrides.number}`,
    repo: 'scratch-gui',
    title: `Pull ${overrides.number}`,
    url: `https://github.com/MistWarp/scratch-gui/pull/${overrides.number}`,
    state: 'open',
    author: 'Mistium',
    authorUrl: 'https://github.com/Mistium',
    authorAvatar: '',
    comments: 0,
    labels: [],
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-10T00:00:00Z',
    mergedAt: '',
    ...overrides
});

const clickLink = async (wrapper, selector) => {
    await act(async () => wrapper.find(selector).simulate('click', {button: 0}));
    wrapper.update();
};

describe('roadmap overview and detail pages', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        api.roadmap.mockResolvedValue({ideas: ['building', 'shipped', 'planned', 'open', 'declined']
            .flatMap(status => Array.from({length: 25}, (_, index) => entry(status, index)))});
        api.developmentPulls.mockResolvedValue({pulls: []});
    });

    test('caps every overview preview and links to separate stage pages', async () => {
        const wrapper = await render();
        expect(wrapper.find('section')).toHaveLength(4);
        expect(wrapper.find('article')).toHaveLength(12);
        expect(wrapper.find('h2').map(node => node.text())).toEqual([
            'In progress25', 'Done25', 'Planned25', 'Suggested25'
        ]);
        expect(wrapper.find('a[href="/roadmap/shipped"]').exists()).toBe(true);
        expect(wrapper.find('a[href="/roadmap/declined"]').exists()).toBe(true);
        expect(wrapper.find('article').first().text()).toContain('Full details for building entry 0');
        expect(wrapper.find('article').first().text()).toContain('Mist');
        expect(wrapper.text()).not.toContain('Entry discussion');
        wrapper.unmount();
    });

    test('paginates a stage without appending entries', async () => {
        const wrapper = await render('/roadmap/shipped');
        expect(wrapper.find('article')).toHaveLength(10);
        expect(wrapper.text()).toContain('Page 1 of 3');
        act(() => {
            wrapper.find('button').filterWhere(node => node.text() === 'Next').simulate('click');
        });
        wrapper.update();
        expect(wrapper.find('article')).toHaveLength(10);
        expect(wrapper.find('article').first().text()).toContain('shipped entry 10');
        expect(wrapper.text()).toContain('Page 2 of 3');
        wrapper.unmount();
    });

    test('opens an entry with discussion and returns to the same filtered page', async () => {
        const wrapper = await render('/roadmap/shipped?page=2&area=Editor');
        await clickLink(wrapper, 'a[href="/roadmap/entry/shipped-10?area=Editor"]');
        expect(wrapper.find('h1').text()).toBe('shipped entry 10');
        expect(wrapper.text()).toContain('Full details for shipped entry 10');
        expect(wrapper.text()).toContain('Entry discussion');
        await clickLink(wrapper, 'a[href="/roadmap/shipped?page=2&area=Editor"]');
        expect(wrapper.text()).toContain('Page 2 of 3');
        wrapper.unmount();
    });

    test.each(['/roadmap?idea=shipped-24', '/roadmap#idea-shipped-24'])(
        'keeps old entry links working: %s', async url => {
            const wrapper = await render(url);
            expect(wrapper.find('h1').text()).toBe('shipped entry 24');
            expect(wrapper.text()).toContain('Entry discussion');
            wrapper.unmount();
        }
    );

    test('keeps stage search usable and resets pagination', async () => {
        const wrapper = await render('/roadmap/shipped?page=3');
        act(() => {
            wrapper.find('input[aria-label="Search roadmap"]').simulate('change', {target: {value: 'entry 12'}});
        });
        wrapper.update();
        expect(wrapper.find('article')).toHaveLength(1);
        expect(wrapper.find('article').text()).toContain('shipped entry 12');
        expect(wrapper.text()).not.toContain('Page 3');
        wrapper.unmount();
    });

    test('shows a missing-entry message for stale links', async () => {
        const wrapper = await render('/roadmap/entry/missing');
        expect(wrapper.text()).toContain('This roadmap entry could not be found.');
        wrapper.unmount();
    });
});

describe('roadmap changes tab', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        api.roadmap.mockResolvedValue({ideas: [{
            ...entry('building', 0),
            pullRequests: [pull({number: 20, state: 'open', linkedBy: 'manual'})]
        }]});
        api.developmentPulls.mockResolvedValue({pulls: [
            pull({number: 20, state: 'open'}),
            pull({number: 21, state: 'merged', mergedAt: '2026-09-12T00:00:00Z'}),
            pull({number: 12, repo: 'scratch-vm', state: 'draft'})
        ]});
    });

    test('groups open and merged work, and links a pull request to its entry', async () => {
        const wrapper = await render('/roadmap/changes');
        expect(wrapper.find('h1').text()).toBe('Changes');
        expect(wrapper.find('h2').map(node => node.text())).toEqual(['In review2', 'Recently merged1']);
        expect(wrapper.text()).toContain('Pull 20');
        expect(wrapper.text()).toContain('scratch-vm');
        expect(wrapper.find('a[href="https://github.com/MistWarp/scratch-gui/pull/21"]').exists()).toBe(true);
        expect(wrapper.find('a[href="/roadmap/entry/building-0"]').exists()).toBe(true);
        wrapper.unmount();
    });

    test('does not offer the entry composer on the changes tab', async () => {
        const wrapper = await render('/roadmap/changes');
        expect(wrapper.text()).not.toContain('Add an entry');
        wrapper.unmount();
    });

    test('filters the feed by repository', async () => {
        const wrapper = await render('/roadmap/changes');
        await act(async () => {
            wrapper.find('select[aria-label="Filter by repository"]')
                .simulate('change', {target: {value: 'scratch-vm'}});
        });
        wrapper.update();
        expect(wrapper.text()).toContain('1 result');
        expect(wrapper.text()).not.toContain('Pull 20');
        wrapper.unmount();
    });

    test('searches the feed', async () => {
        const wrapper = await render('/roadmap/changes');
        await act(async () => {
            wrapper.find('input[aria-label="Search changes"]').simulate('change', {target: {value: 'Pull 21'}});
        });
        wrapper.update();
        expect(wrapper.text()).toContain('1 result');
        expect(wrapper.text()).toContain('Recently merged1');
        wrapper.unmount();
    });

    test('reports a feed that could not be loaded without hiding the roadmap', async () => {
        api.developmentPulls.mockRejectedValue(new Error('offline'));
        const wrapper = await render('/roadmap/changes');
        expect(wrapper.text()).toContain('Could not load changes.');
        wrapper.unmount();
    });

    test('shows an entry its linked pull requests', async () => {
        const wrapper = await render('/roadmap/entry/building-0');
        expect(wrapper.text()).toContain('Pull requests');
        expect(wrapper.find('a[href="https://github.com/MistWarp/scratch-gui/pull/20"]').exists()).toBe(true);
        wrapper.unmount();
    });

    test('lets an admin attach and detach a pull request', async () => {
        api.updateIdea.mockResolvedValue({idea: {pullRequests: [
            pull({number: 20, state: 'open', linkedBy: 'manual'}),
            pull({number: 21, state: 'merged', linkedBy: 'manual'})
        ]}});
        const wrapper = await render('/roadmap/entry/building-0');
        await act(async () => {
            wrapper.find('input#link-building-0').simulate('change', {target: {value: ' scratch-gui#21 '}});
        });
        wrapper.update();
        await act(async () => {
            wrapper.find('form').filterWhere(node => node.find('input#link-building-0').exists()).simulate('submit');
        });
        wrapper.update();
        expect(api.updateIdea).toHaveBeenCalledWith('building-0', {pulls: ['scratch-gui#20', 'scratch-gui#21']});

        api.updateIdea.mockResolvedValue({idea: {pullRequests: [pull({number: 21, state: 'merged', linkedBy: 'manual'})]}});
        await act(async () => {
            wrapper.find('button[aria-label="Unlink scratch-gui#20"]').simulate('click');
        });
        wrapper.update();
        expect(api.updateIdea).toHaveBeenLastCalledWith('building-0', {pulls: ['scratch-gui#21']});
        wrapper.unmount();
    });

    test('offers no linking controls to a pull request the entry only referenced', async () => {
        api.roadmap.mockResolvedValue({ideas: [{
            ...entry('building', 0),
            pullRequests: [pull({number: 20, state: 'open', linkedBy: 'reference'})]
        }]});
        const wrapper = await render('/roadmap/entry/building-0');
        expect(wrapper.find('button[aria-label="Unlink scratch-gui#20"]').exists()).toBe(false);
        wrapper.unmount();
    });
});
