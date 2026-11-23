import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter, Route, Routes} from 'react-router-dom';

import api from '../../src/community/api';
import GitGraph from '../../src/community/components/GitGraph.jsx';
import HistoryList from '../../src/community/pages/project/HistoryList.jsx';
import Commit from '../../src/community/pages/Commit.jsx';
import {uncommittedSummaryDetail} from '../../src/community/commit-summary.js';
import {
    hasRemixDivergence,
    remixDivergenceCompact,
    remixDivergenceSentence,
    remixParentLabel
} from '../../src/community/remix-origin.js';

jest.mock('../../src/community/UserContext.jsx', () => ({
    useUser: () => ({user: {username: 'mist'}, loading: false, login: jest.fn()})
}));

const formatText = (template, values = {}) => template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
const sha = letter => letter.repeat(40);

const settle = async wrapper => {
    for (let index = 0; index < 8; index++) {
        await act(async () => {
            await Promise.resolve();
        });
    }
    wrapper.update();
};

describe('remix origin helpers', () => {
    const parent = (ahead, behind) => ({
        id: 'parent-1',
        owner: 'alice',
        title: 'Base Game',
        ahead,
        behind
    });

    test('detects divergence availability and formats parent labels', () => {
        expect(hasRemixDivergence(null)).toBe(false);
        expect(hasRemixDivergence({id: 'p1', owner: 'alice', title: 'Base'})).toBe(false);
        expect(hasRemixDivergence(parent(0, 0))).toBe(true);
        expect(remixParentLabel(parent(0, 0))).toBe('alice / Base Game');
        expect(remixParentLabel({title: 'Solo'})).toBe('Solo');
        expect(remixDivergenceSentence({id: 'p1', owner: 'alice', title: 'Base Game', head: sha('b')}, formatText))
            .toBe('Remixed from alice / Base Game.');
    });

    test('formats full and compact ahead/behind descriptions', () => {
        expect(remixDivergenceSentence(parent(0, 0), formatText))
            .toBe('This project is up to date with alice / Base Game.');
        expect(remixDivergenceCompact(parent(0, 0), formatText)).toBe('Up to date');

        expect(remixDivergenceSentence(parent(1, 0), formatText))
            .toBe('This project is 1 commit ahead of alice / Base Game.');
        expect(remixDivergenceCompact(parent(1, 0), formatText)).toBe('1 commit ahead');

        expect(remixDivergenceSentence(parent(4, 0), formatText))
            .toBe('This project is 4 commits ahead of alice / Base Game.');
        expect(remixDivergenceCompact(parent(4, 0), formatText)).toBe('4 commits ahead');

        expect(remixDivergenceSentence(parent(0, 1), formatText))
            .toBe('This project is 1 commit behind alice / Base Game.');
        expect(remixDivergenceCompact(parent(0, 1), formatText)).toBe('1 commit behind');

        expect(remixDivergenceSentence(parent(0, 3), formatText))
            .toBe('This project is 3 commits behind alice / Base Game.');
        expect(remixDivergenceCompact(parent(0, 3), formatText)).toBe('3 commits behind');

        expect(remixDivergenceSentence(parent(1, 1), formatText))
            .toBe('This project is 1 commit ahead and 1 commit behind alice / Base Game.');
        expect(remixDivergenceSentence(parent(1, 2), formatText))
            .toBe('This project is 1 commit ahead and 2 commits behind alice / Base Game.');
        expect(remixDivergenceSentence(parent(2, 1), formatText))
            .toBe('This project is 2 commits ahead and 1 commit behind alice / Base Game.');
        expect(remixDivergenceSentence(parent(5, 3), formatText))
            .toBe('This project is 5 commits ahead and 3 commits behind alice / Base Game.');
        expect(remixDivergenceCompact(parent(5, 3), formatText)).toBe('5 ahead, 3 behind');
    });
});

describe('uncommitted changes display', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('summarizes uncommitted changes with summary sentence or file count fallback', () => {
        expect(uncommittedSummaryDetail(null, formatText, 'en')).toBe('');
        expect(uncommittedSummaryDetail({files: 1}, formatText, 'en')).toBe('1 changed file');
        expect(uncommittedSummaryDetail({files: 3}, formatText, 'en')).toBe('3 changed files');
        expect(uncommittedSummaryDetail({
            files: 2,
            summary: {
                sprites: ['Hero'],
                spriteCount: 1,
                authoredFiles: 2,
                totals: {
                    scripts: {added: 2, removed: 0, changed: 0, moved: 0},
                    assets: {added: 0, removed: 0, modified: 0}
                }
            }
        }, formatText, 'en')).toBe('Added 2 scripts in Hero');
    });

    test('renders an uncommitted node and row at the top of GitGraph without a restore button', () => {
        const graph = {
            branches: ['main'],
            branchLogs: [{branch: 'main', oids: [sha('a'), sha('b')]}],
            nodes: [
                {sha: sha('a'), message: 'Latest commit', author: 'mist', date: 1790000000000, parents: [sha('b')], branches: ['main']},
                {sha: sha('b'), message: 'Initial version', author: 'mist', date: 1789000000000, parents: [], branches: ['main']}
            ]
        };
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <GitGraph
                    projectId="project-1"
                    baseUrl="/p/space-game"
                    graph={graph}
                    currentBranch="main"
                    onRestore={jest.fn()}
                    uncommitted={{
                        head: sha('a'),
                        branch: 'main',
                        author: 'mist',
                        date: 1790500000000,
                        files: 2
                    }}
                />
            </MemoryRouter>
        );
        const items = wrapper.find('ol > li');
        expect(items).toHaveLength(3);
        expect(items.at(0).text()).toContain('Not committed');
        expect(items.at(0).text()).toContain('Uncommitted changes');
        expect(items.at(0).text()).toContain('2 changed files');
        expect(items.at(0).find('button')).toHaveLength(0);
        expect(items.at(0)
            .find('a[aria-label="View uncommitted changes"]')
            .prop('href'))
            .toBe('/p/space-game/commits/worktree');
        expect(wrapper.find('svg circle')).toHaveLength(3);
        expect(wrapper.find('svg path').filterWhere(path => path.prop('strokeDasharray') === '4 3')).toHaveLength(1);
        wrapper.unmount();
    });

    test('renders an uncommitted item in the fallback HistoryList commit list', async () => {
        jest.spyOn(api, 'commitSummaries').mockResolvedValue({summaries: {}});
        const wrapper = mount(
            <MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                <HistoryList
                    id="project-1"
                    baseUrl="/project/project-1"
                    history={{
                        branch: 'main',
                        commits: [{sha: sha('a'), message: 'First commit', author: 'mist', date: 1790000000000}],
                        uncommitted: {head: sha('a'), branch: 'main', author: 'mist', files: 1}
                    }}
                />
            </MemoryRouter>
        );
        await settle(wrapper);
        const items = wrapper.find('ul > li');
        expect(items).toHaveLength(2);
        expect(items.at(0).text()).toContain('Not committed');
        expect(items.at(0).text()).toContain('Uncommitted changes');
        expect(items.at(0)
            .find('a')
            .at(0)
            .prop('href')).toBe('/project/project-1/commits/worktree');
        wrapper.unmount();
    });

    test('loads and renders the worktree diff page without commit management or co-authors', async () => {
        jest.spyOn(api, 'getProject').mockResolvedValue({
            project: {
                id: 'project-1',
                title: 'Space game',
                owner: 'mist',
                edited: 1790500000000,
                gitHead: sha('a'),
                isOwner: true,
                canViewSource: true,
                canSeeInside: true,
                seeInside: true
            }
        });
        const coAuthorsSpy = jest.spyOn(api, 'commitCoAuthors').mockResolvedValue({coAuthors: []});
        jest.spyOn(api, 'commitChanges').mockResolvedValue({
            ok: true,
            sha: 'worktree',
            oid: 'worktree',
            parent: sha('a'),
            uncommitted: true,
            commit: {message: 'Uncommitted changes'},
            targets: [],
            files: []
        });
        const wrapper = mount(
            <MemoryRouter
                initialEntries={['/project/project-1/commits/worktree']}
                future={{v7_startTransition: true, v7_relativeSplatPath: true}}
            >
                <Routes>
                    <Route
                        path="/project/:id/commits/:sha"
                        element={<Commit />}
                    />
                </Routes>
            </MemoryRouter>
        );
        await settle(wrapper);

        expect(coAuthorsSpy).not.toHaveBeenCalled();
        expect(wrapper.text()).toContain('Uncommitted changes');
        expect(wrapper.text()).toContain('Not committed');
        expect(wrapper.text()).toContain('Working files');
        expect(wrapper.text()).not.toContain('Manage');
        wrapper.unmount();
    });
});
