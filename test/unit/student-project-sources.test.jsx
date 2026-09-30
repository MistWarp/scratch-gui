import React from 'react';
import configureStore from 'redux-mock-store';

import {shallowWithIntl} from '../helpers/intl-helpers.jsx';
import ProjectFetcherHOC from '../../src/lib/components/project-fetcher-hoc.jsx';
import {fetchProjectMeta} from '../../src/lib/components/tw-project-meta-fetcher-hoc.jsx';
import PackagerIntegrationHOC from '../../src/lib/components/tw-packager-integration-hoc.jsx';
import storage from '../../src/lib/persistence/storage';
import {LoadingState} from '../../src/reducers/project-state';
import {getEditorProject} from '../../src/lib/community/api.js';
import {cachedFetchBuffer} from '../../src/lib/community/cached-fetch.js';
import {cloneRepo} from '../../src/lib/git/browser-git.js';
import {canStudentSessionLoadUrl} from '../../src/lib/rotur/student-flag.js';

jest.mock('../../src/lib/git/browser-git.js', () => ({
    cloneRepo: jest.fn(),
    deleteRepo: jest.fn(() => Promise.resolve())
}));
jest.mock('../../src/lib/git/mwp.js', () => ({
    buildSb3FromCurrentRepo: jest.fn(),
    importMwp: jest.fn(() => Promise.resolve()),
    isMwpArchive: jest.fn(() => Promise.resolve(false))
}));
jest.mock('../../src/lib/community/api.js', () => ({
    fetchWorkspace: jest.fn(),
    getEditorProject: jest.fn()
}));
jest.mock('../../src/lib/community/cached-fetch.js', () => ({
    cachedFetchBuffer: jest.fn()
}));
jest.mock('../../src/containers/packager.jsx', () => () => null);

const STUDENT_KEY = 'mw:classroom-student';
const SAMPLE = 'https://extensions.turbowarp.org/samples/Box2D.sb3';

const makeStore = isEmbedded => configureStore()({
    scratchGui: {
        mode: {isEmbedded},
        projectState: {},
        vm: {clear: () => {}, loadProject: () => {}, stop: () => {}, quit: () => {}}
    }
});

const makeFetcher = ({isEmbedded = false} = {}) => {
    const store = makeStore(isEmbedded);
    const WrappedComponent = ProjectFetcherHOC(() => <div />);
    const onFetchedProjectData = jest.fn();
    const onError = jest.fn();
    const vm = {loadProject: jest.fn(), quit: jest.fn()};
    const wrapper = shallowWithIntl(
        <WrappedComponent
            onError={onError}
            onFetchedProjectData={onFetchedProjectData}
            store={store}
            vm={vm}
        />,
        {context: {store}}
    );
    const instance = wrapper.dive().dive()
        .instance();
    return {instance, onFetchedProjectData, onError, vm};
};

describe('project sources for class accounts', () => {
    let originalLoad;
    let originalAddStore;

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        originalLoad = storage.load;
        originalAddStore = storage.addMistWarpAssetStore;
        storage.load = jest.fn(() => Promise.resolve({data: 'default project'}));
        storage.addMistWarpAssetStore = jest.fn();
        cachedFetchBuffer.mockImplementation(url => Promise.resolve(`buffer:${url}`));
        cloneRepo.mockResolvedValue({fs: {}, dir: '/repo'});
        global.fetch = jest.fn(() => Promise.reject(new Error('network')));
    });

    afterEach(() => {
        storage.load = originalLoad;
        storage.addMistWarpAssetStore = originalAddStore;
        localStorage.clear();
        window.history.replaceState({}, '', '/');
        delete global.fetch;
    });

    test('a student ignores a clone URL and opens the default project', async () => {
        localStorage.setItem(STUDENT_KEY, '1');
        window.history.replaceState({}, '', '/editor?clone=https://github.com/user/repo.git');
        const {instance, onFetchedProjectData, vm} = makeFetcher();
        await instance.fetchProject('0', LoadingState.FETCHING_WITH_ID);
        expect(cloneRepo).not.toHaveBeenCalled();
        expect(onFetchedProjectData).toHaveBeenCalledWith('default project', LoadingState.FETCHING_WITH_ID);
        vm._mwReleaseProjectLoad();
    });

    test('a student ignores a project URL on another host', async () => {
        localStorage.setItem(STUDENT_KEY, '1');
        window.history.replaceState({}, '', '/editor?project_url=https://tracker.example/project.sb3');
        const {instance, onFetchedProjectData, vm} = makeFetcher();
        await instance.fetchProject('0', LoadingState.FETCHING_WITH_ID);
        expect(cachedFetchBuffer).not.toHaveBeenCalled();
        expect(onFetchedProjectData).toHaveBeenCalledWith('default project', LoadingState.FETCHING_WITH_ID);
        vm._mwReleaseProjectLoad();
    });

    test('a student can still open extension gallery samples', async () => {
        localStorage.setItem(STUDENT_KEY, '1');
        window.history.replaceState({}, '', `/editor?project_url=${SAMPLE}`);
        const {instance, onFetchedProjectData, vm} = makeFetcher();
        await instance.fetchProject('0', LoadingState.FETCHING_WITH_ID);
        expect(cachedFetchBuffer).toHaveBeenCalledWith(SAMPLE);
        expect(onFetchedProjectData).toHaveBeenCalledWith(`buffer:${SAMPLE}`, LoadingState.FETCHING_WITH_ID);
        vm._mwReleaseProjectLoad();
    });

    test('a student embed loads project data and assets from MistWarp, not the URL', async () => {
        localStorage.setItem(STUDENT_KEY, '1');
        getEditorProject.mockResolvedValue({project: {
            id: 'p1', title: 'Class project', projectJsonUrl: 'https://api.mistwarp.org/p1.json'
        }});
        window.history.replaceState({}, '', '/embed?platform_project=p1' +
            '&project_url=https://tracker.example/p1.json&mw_assets=https://tracker.example/assets/' +
            '&mw_te=["hash"]');
        const {instance, onFetchedProjectData, vm} = makeFetcher({isEmbedded: true});
        await instance.fetchProject('0', LoadingState.FETCHING_WITH_ID);
        expect(getEditorProject).toHaveBeenCalledWith('p1');
        expect(cachedFetchBuffer).toHaveBeenCalledWith('https://api.mistwarp.org/p1.json');
        expect(cachedFetchBuffer).not.toHaveBeenCalledWith('https://tracker.example/p1.json');
        expect(storage.addMistWarpAssetStore).not.toHaveBeenCalledWith('https://tracker.example/assets/');
        expect(onFetchedProjectData).toHaveBeenCalledTimes(1);
        vm._mwReleaseProjectLoad();
    });

    test('a student cannot open Scratch projects by number', async () => {
        localStorage.setItem(STUDENT_KEY, '1');
        await expect(fetchProjectMeta('123')).rejects.toThrow('class accounts');
        const {instance, onFetchedProjectData} = makeFetcher();
        await instance.fetchProject('123', LoadingState.FETCHING_WITH_ID);
        expect(global.fetch).not.toHaveBeenCalled();
        expect(storage.load).not.toHaveBeenCalled();
        expect(onFetchedProjectData).not.toHaveBeenCalled();
    });

    test('everyone else keeps clone and project URLs', async () => {
        window.history.replaceState({}, '', '/editor?project_url=https://example.com/project.sb3');
        const first = makeFetcher();
        await first.instance.fetchProject('0', LoadingState.FETCHING_WITH_ID);
        expect(cachedFetchBuffer).toHaveBeenCalledWith('https://example.com/project.sb3');
        first.vm._mwReleaseProjectLoad();
        window.history.replaceState({}, '', '/editor?clone=https://github.com/user/repo.git');
        const second = makeFetcher();
        await second.instance.fetchProject('0', LoadingState.FETCHING_WITH_ID);
        expect(cloneRepo).toHaveBeenCalledWith(expect.objectContaining({url: 'https://github.com/user/repo.git'}));
    });
});

describe('other remote URLs in a student session', () => {
    afterEach(() => {
        localStorage.clear();
    });

    test('only device and same-origin URLs load for a student', () => {
        localStorage.setItem(STUDENT_KEY, '1');
        expect(canStudentSessionLoadUrl('https://images.example/wallpaper.png')).toBe(false);
        expect(canStudentSessionLoadUrl('//images.example/wallpaper.png')).toBe(false);
        expect(canStudentSessionLoadUrl('data:image/png;base64,AAAA')).toBe(true);
        expect(canStudentSessionLoadUrl('blob:http://localhost/1')).toBe(true);
        expect(canStudentSessionLoadUrl('/static/sound.mp3')).toBe(true);
        localStorage.clear();
        expect(canStudentSessionLoadUrl('https://images.example/wallpaper.png')).toBe(true);
    });

    test('a student gets no packager', () => {
        const Packager = PackagerIntegrationHOC(() => null).WrappedComponent;
        localStorage.setItem(STUDENT_KEY, '1');
        const student = new Packager({canOpenPackager: true, confirm: jest.fn()});
        student.setState = jest.fn();
        expect(student.render().props.children[0].props.onClickPackager).toBeNull();
        student.handleClickPackager();
        expect(student.setState).not.toHaveBeenCalled();
        localStorage.clear();
        const other = new Packager({canOpenPackager: true, confirm: jest.fn()});
        expect(other.render().props.children[0].props.onClickPackager).toBe(other.handleClickPackager);
    });
});
