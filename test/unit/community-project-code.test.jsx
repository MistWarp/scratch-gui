import React from 'react';
import {act} from 'react-dom/test-utils';
import {mount} from 'enzyme';
import {MemoryRouter, Route, Routes, useLocation, useNavigate} from 'react-router-dom';

import api from '../../src/community/api';
import ProjectCode, {
    codeLocation, codeTabPath, commitContributors
} from '../../src/community/pages/ProjectCode.jsx';
import {codeEntryUrl, listDirectory, searchFiles} from '../../src/community/pages/project/CodeBrowser.jsx';
import {isDeveloperMode, setDeveloperMode} from '../../src/community/developer-mode.js';
import scrollToAnchorWithRetry from '../../src/community/scroll-to-anchor.js';

jest.mock('../../src/community/UserContext.jsx', () => ({
    useUser: () => ({user: null, loading: false, login: jest.fn()})
}));
jest.mock('../../src/community/scroll-to-anchor.js', () => ({
    __esModule: true,
    default: jest.fn(() => () => {})
}));
jest.mock('../../src/lib/community/cached-fetch.js', () => ({
    cachedFetchBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(0))),
    preloadContent: jest.fn(() => Promise.resolve())
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
    {path: 'fractch.json', size: 2},
    {path: 'Cat/assets/a#b?c%d é.txt', size: 4}
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
let navigateTo = null;
const LocationProbe = () => {
    currentLocation = useLocation();
    navigateTo = useNavigate();
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
    jest.spyOn(api, 'getComments').mockResolvedValue({comments: [], issueCounts: {open: 2, done: 1}});
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
        expect(codeLocation('issues')).toEqual({tab: 'issues', kind: 'tree', path: ''});
        expect(codeLocation('issues/12')).toEqual({tab: 'issues', kind: 'issue', path: '', number: 12});
        expect(codeLocation('issues/abc')).toEqual({tab: 'issues', kind: 'tree', path: ''});
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
        expect(listDirectory(files, 'Cat/assets').map(entry => entry.name)).toEqual(['a#b?c%d é.txt', 'Idle.svg']);
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
        expect(tabs).toEqual(['Code', 'Issues2', 'Comments', 'Commits3', 'Branches2', 'Pull requests1', 'Releases1']);
        expect(wrapper.find('a').filterWhere(link => link.text() === 'Read reviews')
            .prop('href')).toBe('/project/project-1#reviews');
        expect(wrapper.find('a').filterWhere(link => link.text() === 'See the remix tree')
            .prop('href')).toBe('/project/project-1/remixes');
        expect(wrapper.text()).toContain('2 open issues');
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

    test('opens files with characters that need encoding', async () => {
        mockApi(baseProject());
        const wrapper = mountAt('/project/project-1/code/tree/Cat/assets');
        await settle(wrapper);
        const link = wrapper.find('a').filterWhere(item => item.text() === 'a#b?c%d é.txt');
        expect(link.prop('href')).toBe('/project/project-1/code/blob/Cat/assets/a%23b%3Fc%25d%20%C3%A9.txt');

        const file = mountAt(link.prop('href'));
        await settle(file);
        expect(api.commitFile).toHaveBeenCalledWith('project-1', sha('a'), 'Cat/assets/a#b?c%d é.txt');
    });

    test('drops an unknown branch from links and tabs', async () => {
        mockApi(baseProject());
        const wrapper = mountAt('/project/project-1/code?branch=nope');
        await settle(wrapper);
        const catLink = wrapper.find('a').filterWhere(link => link.text() === 'Cat');
        expect(catLink.prop('href')).toBe('/project/project-1/code/tree/Cat');
    });

    test('keeps the branch when going back to the code tab', async () => {
        mockApi(baseProject());
        const wrapper = mountAt('/project/project-1/code/commits?branch=levels');
        await settle(wrapper);
        act(() => {
            wrapper.find('[role="tab"]').at(0)
                .simulate('click');
        });
        await settle(wrapper);
        expect(`${currentLocation.pathname}${currentLocation.search}`).toBe('/project/project-1/code?branch=levels');
    });

    test('replaces the project when the address moves to another one', async () => {
        mockApi(baseProject());
        api.getProject.mockImplementation(id => (id === 'project-2' ?
            Promise.reject(Object.assign(new Error('missing'), {status: 404})) :
            Promise.resolve({project: baseProject()})));
        const wrapper = mountAt('/project/project-1/code');
        await settle(wrapper);
        expect(wrapper.find('h1').text()).toBe('mist/Space game');

        act(() => {
            navigateTo('/project/project-2/code');
        });
        await settle(wrapper);
        expect(wrapper.find('h1').exists()).toBe(false);
        expect(wrapper.text()).toContain('Project not found.');
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
            wrapper.find('[role="tab"]').at(3)
                .simulate('click');
        });
        await settle(wrapper);
        expect(currentLocation.pathname).toBe('/project/project-1/code/commits');
        act(() => {
            wrapper.find('[role="tab"]').at(1)
                .simulate('click');
        });
        await settle(wrapper);
        expect(currentLocation.pathname).toBe('/project/project-1/code/issues');
    });

    test('opens an issue thread from its address and hides the tab when issues are off', async () => {
        mockApi(baseProject());
        let wrapper = mountAt('/project/project-1/code/issues/4');
        await settle(wrapper);
        expect(api.getComments).toHaveBeenCalledWith('project-1', {all: true, issue: 'any', number: 4});
        expect(wrapper.text()).toContain('Issue not found');
        wrapper.unmount();

        jest.restoreAllMocks();
        mockApi(baseProject({issuesOff: true}));
        api.getComments.mockResolvedValue({comments: [], issueCounts: {open: 0, done: 0}});
        wrapper = mountAt('/project/project-1/code');
        await settle(wrapper);
        expect(wrapper.find('[role="tab"]').map(tab => tab.text())).not.toContain('Issues0');
        wrapper.unmount();
    });

    test('shows every comment in the comments tab, with issue badges linking to their issue', async () => {
        mockApi(baseProject());
        api.getComments.mockResolvedValue({
            comments: [
                {id: 'c1', author: 'Sam', content: 'Jump is too high', created: 2, issue: {number: 4, state: 'open'}},
                {id: 'c2', author: 'Lee', content: 'Love the music', created: 1},
                {id: 'r1', author: 'mist', content: 'Thanks', parent: 'c2', created: 3}
            ],
            totalRoots: 2,
            nextOffset: 2,
            issueCounts: {open: 1, done: 0}
        });
        const wrapper = mountAt('/project/project-1/code/comments');
        await settle(wrapper);
        expect(wrapper.find('[role="tab"][aria-selected=true]').text()).toBe('Comments');
        expect(wrapper.text()).toContain('Jump is too high');
        expect(wrapper.text()).toContain('Love the music');
        expect(wrapper.text()).toContain('Thanks');
        expect(wrapper.find('a').filterWhere(link => link.text() === 'Issue #4')
            .prop('href')).toBe('/project/project-1/code/issues/4');
    });

    test('scrolls to a linked comment in the comments tab', async () => {
        mockApi(baseProject());
        scrollToAnchorWithRetry.mockClear();
        const wrapper = mountAt('/project/project-1/code/comments#comment-id-c1');
        await settle(wrapper);
        expect(scrollToAnchorWithRetry).toHaveBeenCalledWith('comment-id-c1');
    });

    test('keeps the share key on the view switch, tabs and details links', async () => {
        mockApi(baseProject());
        const wrapper = mountAt('/project/project-1/code?k=secret');
        await settle(wrapper);
        const projectView = wrapper.find('a').filterWhere(link => link.text() === 'Project view');
        expect(projectView).toHaveLength(1);
        expect(projectView.prop('href')).toBe('/project/project-1?k=secret');
        expect(wrapper.find('a').filterWhere(link => link.text() === 'Read reviews')
            .prop('href')).toBe('/project/project-1?k=secret#reviews');
        const comments = wrapper.find('[role="tab"]').filterWhere(item => item.text() === 'Comments');
        await act(async () => {
            comments.simulate('click');
        });
        expect(currentLocation.pathname).toBe('/project/project-1/code/comments');
        expect(currentLocation.search).toBe('?k=secret');
    });

    test('plays the project in the sidebar only once asked', async () => {
        mockApi(baseProject({
            projectJsonUrl: 'https://projects.example/project-1.sb3',
            assetsBase: 'https://assets.example/',
            hasContent: true,
            thumbUrl: 'https://assets.example/thumb.png'
        }));
        const wrapper = mountAt('/project/project-1/code');
        await settle(wrapper);

        expect(wrapper.find('iframe')).toHaveLength(0);
        const play = wrapper.find('button').filterWhere(button => button.prop('aria-label') === 'Play Space game');
        expect(play).toHaveLength(1);
        act(() => {
            play.simulate('click');
        });
        wrapper.update();
        const frame = wrapper.find('iframe');
        expect(frame).toHaveLength(1);
        expect(frame.prop('src')).toContain('platform_project=project-1');
        expect(frame.prop('src')).toContain('apply_project_theme=0');
        expect(frame.prop('sandbox')).toContain('allow-scripts');
        expect(frame.prop('sandbox')).not.toContain('allow-same-origin');
    });

    test('leaves out the player when there is nothing to play', async () => {
        mockApi(baseProject({hasContent: false}));
        const wrapper = mountAt('/project/project-1/code');
        await settle(wrapper);
        expect(wrapper.find('button').filterWhere(button => button.prop('aria-label') === 'Play Space game')).toHaveLength(0);
    });

    test('opens the editor in code mode and turns the developer view off for project view', async () => {
        mockApi(baseProject());
        setDeveloperMode(true);
        const wrapper = mountAt('/project/project-1/code');
        await settle(wrapper);

        const seeInside = wrapper.find('a').filterWhere(link => link.text() === 'See inside');
        expect(seeInside.prop('href')).toContain('mode=code');
        expect(seeInside.prop('href')).toContain('#mw-project-1');
        const projectView = wrapper.find('a').filterWhere(link => link.text() === 'Project view');
        expect(projectView).toHaveLength(1);
        act(() => {
            projectView.simulate('click', {button: 0});
        });
        expect(isDeveloperMode()).toBe(false);
        expect(currentLocation.pathname).toBe('/project/project-1');
        localStorage.removeItem('mw:developer-view');
    });

    test('shows remix origin, divergence status bar and uncommitted banner on the code tab', async () => {
        mockApi(baseProject({
            isOwner: true,
            remixFrom: {
                id: 'parent-1',
                owner: 'alice',
                title: 'Original Space',
                vanitySlug: 'original-space',
                ahead: 3,
                behind: 1
            }
        }));
        api.commits.mockResolvedValue({
            branch: 'main',
            commits,
            uncommitted: {
                head: sha('a'),
                branch: 'main',
                author: 'mist',
                date: 1790500000000,
                files: 2,
                summary: {
                    sprites: ['Cat'],
                    spriteCount: 1,
                    authoredFiles: 2,
                    totals: {
                        scripts: {added: 1, removed: 0, changed: 0, moved: 0},
                        assets: {added: 0, removed: 0, modified: 0}
                    }
                }
            }
        });
        const wrapper = mountAt('/project/project-1/code');
        await settle(wrapper);

        expect(wrapper.text()).toContain('Remixed from');
        const parentLink = wrapper.find('a').filterWhere(link => link.text() === 'alice / Original Space');
        expect(parentLink.prop('href')).toBe('/p/original-space/code');
        expect(wrapper.text()).toContain('This project is 3 commits ahead and 1 commit behind alice / Original Space.');
        const contribute = wrapper.find('a').filterWhere(link => link.text() === 'Contribute');
        expect(contribute.prop('href')).toBe('/p/original-space#contribute');
        expect(wrapper.text()).toContain('Not committed');
        expect(wrapper.text()).toContain('Uncommitted changes');
        expect(wrapper.text()).toContain('Added 1 script in Cat');
        const viewChanges = wrapper.find('a').filterWhere(link => link.text() === 'View changes');
        expect(viewChanges.prop('href')).toBe('/project/project-1/commits/worktree');
    });

    test('offers a sync only to maintainers on the branch the remix has checked out', async () => {
        const remixFrom = {id: 'parent-1', owner: 'alice', title: 'Original Space', ahead: 1, behind: 2};
        const syncButtons = wrapper => wrapper.find('button').filterWhere(button => button.text().includes('Sync with original'));

        mockApi(baseProject({myRole: 'maintainer', remixFrom}));
        const maintainer = mountAt('/project/project-1/code');
        await settle(maintainer);
        expect(syncButtons(maintainer)).toHaveLength(1);
        maintainer.unmount();

        mockApi(baseProject({remixFrom}));
        const visitor = mountAt('/project/project-1/code');
        await settle(visitor);
        expect(visitor.text()).toContain('1 commit ahead and 2 commits behind alice / Original Space');
        expect(syncButtons(visitor)).toHaveLength(0);
        visitor.unmount();

        mockApi(baseProject({isOwner: true, remixFrom}));
        const otherBranch = mountAt('/project/project-1/code?branch=levels');
        await settle(otherBranch);
        expect(otherBranch.text()).not.toContain('behind alice / Original Space');
        expect(syncButtons(otherBranch)).toHaveLength(0);
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
