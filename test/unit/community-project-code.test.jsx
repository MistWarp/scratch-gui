import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter, Route, Routes, useLocation} from 'react-router-dom';

import api from '../../src/community/api';
import ProjectCode, {
    codeLocation, codeTabPath, commitContributors
} from '../../src/community/pages/ProjectCode.jsx';
import {codeEntryUrl, listDirectory, searchFiles} from '../../src/community/pages/project/CodeBrowser.jsx';

jest.mock('../../src/community/UserContext.jsx', () => ({
    useUser: () => ({user: null, loading: false, login: jest.fn()})
}));

const sha = letter => letter.repeat(40);

const baseProject = (extra = {}) => ({
    id: 'project-1',
    title: 'Space game',
    owner: 'mist',
    gitHead: sha('a'),
    gitBranch: 'main',
    commitCount: 3,
    canViewSource: true,
    canSeeInside: true,
    seeInside: true,
    shared: false,
    visibility: 'public',
    instructions: 'Press space to jump.',
    notes: '',
    tags: ['platformer'],
    ...extra
});

const commits = [
    {sha: sha('a'), author: 'mist', date: 1790000000000, message: 'Add the jump'},
    {sha: sha('b'), author: 'Twotanium', date: 1789000000000, message: 'Fix walls'},
    {sha: sha('c'), author: 'mist', date: 1788000000000, message: 'Initial version'}
];

const branches = [
    {name: 'main', head: sha('a'), author: 'mist', date: 1790000000000, message: 'Add the jump'},
    {name: 'levels', head: sha('d'), author: 'Twotanium', date: 1791000000000, message: 'Level two'}
];

const files = [
    {path: 'Cat/main.fractch', size: 20},
    {path: 'Cat/assets/Idle.svg', size: 6},
    {path: 'Stage/main.fractch', size: 20},
    {path: 'fractch.json', size: 2}
];

const lastCommits = {
    paths: {
        'Cat': sha('b'),
        'Cat/main.fractch': sha('b'),
        'Cat/assets': sha('c'),
        'Cat/assets/Idle.svg': sha('c'),
        'Stage': sha('c'),
        'Stage/main.fractch': sha('c'),
        'fractch.json': sha('c')
    },
    commits: {
        [sha('b')]: {author: 'Twotanium', date: 1789000000000, message: 'Fix walls'},
        [sha('c')]: {author: 'mist', date: 1788000000000, message: 'Initial version'}
    }
};

let currentLocation = null;
const LocationProbe = () => {
    currentLocation = useLocation();
    return null;
};

const mountAt = path => mount(
    <MemoryRouter
        initialEntries={[path]}
        future={{v7_startTransition: true, v7_relativeSplatPath: true}}
    >
        <LocationProbe />
        <Routes>
            <Route
                path="/project/:id/code/*"
                element={<ProjectCode />}
            />
            <Route
                path="/project/:id"
                element={<div className="project-page" />}
            />
        </Routes>
    </MemoryRouter>
);

const settle = async wrapper => {
    for (let index = 0; index < 8; index++) {
        await act(async () => {
            await Promise.resolve();
        });
    }
    wrapper.update();
};

const mockApi = (project, {last = lastCommits} = {}) => {
    jest.spyOn(api, 'getProject').mockResolvedValue({project});
    jest.spyOn(api, 'commits').mockResolvedValue({branch: 'main', commits});
    jest.spyOn(api, 'branches').mockResolvedValue({branches});
    jest.spyOn(api, 'pulls').mockResolvedValue({pulls: [{index: 1, state: 'open'}, {index: 2, state: 'closed'}]});
    jest.spyOn(api, 'releases').mockResolvedValue({releases: [{id: 'r1'}]});
    jest.spyOn(api, 'commitSummaries').mockResolvedValue({summaries: {}});
    jest.spyOn(api, 'commitFile').mockResolvedValue({content: btoa('sprite "Cat";')});
    if (last) jest.spyOn(api, 'commitLastCommits').mockResolvedValue(last);
    else jest.spyOn(api, 'commitLastCommits').mockRejectedValue(new Error('not found'));
    return jest.spyOn(api, 'commitTree').mockImplementation((id, head) => Promise.resolve({sha: head, files}));
};

const rowTexts = wrapper => wrapper.find('ul').filterWhere(list => list.prop('className') === 'module-rows')
    .find('li')
    .map(row => row.text());

describe('project developer view helpers', () => {
    test('reads the tab, folder or file from the path after /code', () => {
        expect(codeLocation('')).toEqual({tab: 'code', kind: 'tree', path: ''});
        expect(codeLocation('commits')).toEqual({tab: 'commits', kind: 'tree', path: ''});
        expect(codeLocation('tree/Cat/assets')).toEqual({tab: 'code', kind: 'tree', path: 'Cat/assets'});
        expect(codeLocation('blob/Cat/main.fractch')).toEqual({tab: 'code', kind: 'blob', path: 'Cat/main.fractch'});
        expect(codeLocation('unknown')).toEqual({tab: 'code', kind: 'tree', path: ''});
    });

    test('builds tab and entry urls under the project url', () => {
        expect(codeTabPath('/project/p1', 'code')).toBe('/project/p1/code');
        expect(codeTabPath('/p/space', 'branches')).toBe('/p/space/code/branches');
        expect(codeEntryUrl('/project/p1', 'blob', 'Cat/assets/Sign out?.svg')).toBe('/project/p1/code/blob/Cat/assets/Sign%20out%3F.svg');
        expect(codeEntryUrl('/project/p1', 'tree', '', 'branch=levels')).toBe('/project/p1/code?branch=levels');
    });

    test('lists folders first, then files, by name', () => {
        expect(listDirectory(files, '').map(entry => [entry.name, entry.dir])).toEqual([
            ['Cat', true], ['Stage', true], ['fractch.json', false]
        ]);
        expect(listDirectory(files, 'Cat').map(entry => entry.path)).toEqual(['Cat/assets', 'Cat/main.fractch']);
        expect(listDirectory(files, 'Dog')).toEqual([]);
    });

    test('finds files by any part of their path', () => {
        expect(searchFiles(files, 'MAIN').map(file => file.path)).toEqual(['Cat/main.fractch', 'Stage/main.fractch']);
        expect(searchFiles(files, '  ')).toEqual([]);
    });

    test('counts contributors by commit author, ignoring case', () => {
        expect(commitContributors([
            {author: 'mist'}, {author: 'Mist'}, {author: 'Twotanium'}, {author: ''}
        ])).toEqual([
            {username: 'mist', commits: 2},
            {username: 'Twotanium', commits: 1}
        ]);
        expect(commitContributors(null)).toEqual([]);
    });
});

describe('project developer view page', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('lists the root with each entry\'s latest commit, plus counts and contributors', async () => {
        const commitTree = mockApi(baseProject());
        const wrapper = mountAt('/project/project-1/code');
        await settle(wrapper);

        expect(wrapper.find('h1').text()).toBe('mist/Space game');
        const tabs = wrapper.find('[role="tab"]').map(tab => tab.text());
        expect(tabs).toEqual(['Code', 'Commits3', 'Branches2', 'Pull requests1', 'Releases1']);
        expect(commitTree).toHaveBeenCalledWith('project-1', sha('a'));
        expect(api.commitLastCommits).toHaveBeenCalledWith('project-1', sha('a'));
        const rows = rowTexts(wrapper);
        expect(rows[0]).toContain('Cat');
        expect(rows[0]).toContain('Fix walls');
        expect(rows[1]).toContain('Stage');
        expect(rows[1]).toContain('Initial version');
        expect(rows[2]).toContain('fractch.json');
        expect(wrapper.text()).toContain('Add the jump');
        expect(wrapper.text()).toContain('Press space to jump.');
        expect(wrapper.text()).toContain('Contributors');
    });

    test('opens a folder with a breadcrumb and a parent row', async () => {
        mockApi(baseProject());
        const wrapper = mountAt('/project/project-1/code/tree/Cat');
        await settle(wrapper);

        expect(wrapper.find('nav[aria-label="Breadcrumb"]').text()).toBe('Space game/Cat');
        const rows = rowTexts(wrapper);
        expect(rows[0]).toBe('..');
        expect(rows[1]).toContain('assets');
        expect(rows[2]).toContain('main.fractch');
        expect(wrapper.text()).not.toContain('Contributors');
        expect(wrapper.text()).not.toContain('Press space to jump.');
    });

    test('shows a file on its own page', async () => {
        mockApi(baseProject());
        const wrapper = mountAt('/project/project-1/code/blob/Cat/main.fractch');
        await settle(wrapper);

        expect(api.commitFile).toHaveBeenCalledWith('project-1', sha('a'), 'Cat/main.fractch');
        expect(wrapper.find('nav[aria-label="Breadcrumb"]').text()).toBe('Space game/Cat/main.fractch');
        expect(wrapper.text()).toContain('Fix walls');
        expect(wrapper.text()).toContain('sprite "Cat";');
    });

    test('says when a folder or file is missing', async () => {
        mockApi(baseProject());
        const folder = mountAt('/project/project-1/code/tree/Dog');
        await settle(folder);
        expect(folder.text()).toContain('This folder does not exist on this branch');

        const file = mountAt('/project/project-1/code/blob/Dog/main.fractch');
        await settle(file);
        expect(file.text()).toContain('This file does not exist on this branch');
    });

    test('filters every file with go to file', async () => {
        mockApi(baseProject());
        const wrapper = mountAt('/project/project-1/code');
        await settle(wrapper);

        act(() => {
            wrapper.find('input[type="search"]').simulate('change', {target: {value: 'main'}});
        });
        wrapper.update();
        expect(rowTexts(wrapper)).toEqual(['Cat/main.fractch', 'Stage/main.fractch']);
    });

    test('browses another branch and keeps it in links', async () => {
        const commitTree = mockApi(baseProject());
        const wrapper = mountAt('/project/project-1/code?branch=levels');
        await settle(wrapper);

        expect(commitTree).toHaveBeenCalledWith('project-1', sha('d'));
        expect(commitTree).not.toHaveBeenCalledWith('project-1', sha('a'));
        expect(api.commitLastCommits).toHaveBeenCalledWith('project-1', sha('d'));
        expect(wrapper.text()).toContain('Level two');
        const catLink = wrapper.find('a').filterWhere(link => link.text() === 'Cat');
        expect(catLink.prop('href')).toBe('/project/project-1/code/tree/Cat?branch=levels');
    });

    test('still lists files when latest commits are unavailable', async () => {
        mockApi(baseProject(), {last: null});
        const wrapper = mountAt('/project/project-1/code');
        await settle(wrapper);

        const rows = rowTexts(wrapper);
        expect(rows).toHaveLength(3);
        expect(rows[0]).toBe('Cat');
    });

    test('switches tabs through the address', async () => {
        mockApi(baseProject());
        const wrapper = mountAt('/project/project-1/code');
        await settle(wrapper);

        act(() => {
            wrapper.find('[role="tab"]').at(1)
                .simulate('click');
        });
        await settle(wrapper);
        expect(currentLocation.pathname).toBe('/project/project-1/code/commits');
    });

    test('keeps private source hidden', async () => {
        mockApi(baseProject({canViewSource: false, canSeeInside: false, seeInside: false}));
        const wrapper = mountAt('/project/project-1/code');
        await settle(wrapper);

        expect(wrapper.text()).toContain('The source of this project is private');
        expect(wrapper.find('[role="tab"]').length).toBe(0);
        expect(api.commits).not.toHaveBeenCalled();
        expect(api.branches).not.toHaveBeenCalled();
        expect(api.commitLastCommits).not.toHaveBeenCalled();
    });
});
