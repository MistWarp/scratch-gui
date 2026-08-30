import React from 'react';
import configureStore from 'redux-mock-store';

import {mountWithIntl, shallowWithIntl} from '../../helpers/intl-helpers.jsx';

import ProjectFetcherHOC from '../../../src/lib/components/project-fetcher-hoc.jsx';
import storage from '../../../src/lib/persistence/storage';
import {LoadingState} from '../../../src/reducers/project-state';
import {getEditorProject, fetchWorkspace, takeProjectHandoff} from '../../../src/lib/community/api.js';
import {cachedFetchBuffer} from '../../../src/lib/community/cached-fetch.js';

jest.mock('../../../src/lib/git/browser-git.js', () => ({
    cloneRepo: jest.fn(),
    deleteRepo: jest.fn(() => Promise.resolve())
}));
jest.mock('../../../src/lib/git/mwp.js', () => ({
    checkoutMwpBranch: jest.fn(() => Promise.resolve()),
    importMwp: jest.fn(() => Promise.resolve())
}));
jest.mock('../../../src/lib/community/api.js', () => ({
    fetchWorkspace: jest.fn(),
    getEditorProject: jest.fn(),
    takeProjectHandoff: jest.fn()
}));
jest.mock('../../../src/lib/community/cached-fetch.js', () => ({
    cachedFetchBuffer: jest.fn()
}));


describe('ProjectFetcherHOC', () => {
    const mockStore = configureStore();
    let store;

    beforeEach(() => {
        jest.clearAllMocks();
        window.history.replaceState({}, '', '/');
        store = mockStore({
            scratchGui: {
                mode: {
                    isEmbedded: true
                },
                projectState: {},
                vm: {
                    clear: () => {},
                    loadProject: () => {},
                    stop: () => {}
                }
            }
        });
    });

    test('reads embedded mode from the store', () => {
        const Component = () => <div />;
        const WrappedComponent = ProjectFetcherHOC(Component);
        const mounted = mountWithIntl(<WrappedComponent store={store} />);
        expect(mounted.find(Component).prop('isEmbedded')).toBe(true);
    });

    test('keeps the current VM intact while fetching replacement data', async () => {
        const Component = () => <div />;
        const WrappedComponent = ProjectFetcherHOC(Component);
        const loadPromise = new Promise(() => {});
        const originalLoad = storage.load;
        storage.load = jest.fn(() => loadPromise);
        const vmForFetch = {
            clear: jest.fn(),
            loadProject: jest.fn(),
            quit: jest.fn()
        };
        const wrapper = shallowWithIntl(
            <WrappedComponent
                store={store}
                vm={vmForFetch}
            />,
            {context: {store}}
        );
        const instance = wrapper.dive().dive().instance();

        instance.fetchProject('0', LoadingState.FETCHING_WITH_ID);
        await Promise.resolve();

        expect(vmForFetch.quit).toHaveBeenCalledTimes(1);
        expect(vmForFetch.clear).not.toHaveBeenCalled();
        storage.load = originalLoad;
    });

    test('ignores an older fetch that finishes after a newer project', async () => {
        const Component = () => <div />;
        const WrappedComponent = ProjectFetcherHOC(Component);
        const pendingLoads = [];
        const originalLoad = storage.load;
        storage.load = jest.fn(() => new Promise(resolve => pendingLoads.push(resolve)));
        const onFetchedProjectData = jest.fn();
        const vmForFetch = {
            loadProject: jest.fn(),
            quit: jest.fn()
        };
        const wrapper = shallowWithIntl(
            <WrappedComponent
                onFetchedProjectData={onFetchedProjectData}
                store={store}
                vm={vmForFetch}
            />,
            {context: {store}}
        );
        const instance = wrapper.dive().dive().instance();

        const oldFetch = instance.fetchProject('0', LoadingState.FETCHING_WITH_ID);
        await Promise.resolve();
        const newFetch = instance.fetchProject('0', LoadingState.FETCHING_WITH_ID);
        await Promise.resolve();
        pendingLoads[1]({data: 'new project'});
        await newFetch;
        pendingLoads[0]({data: 'old project'});
        await oldFetch;

        expect(onFetchedProjectData).toHaveBeenCalledTimes(1);
        expect(onFetchedProjectData).toHaveBeenCalledWith('new project', LoadingState.FETCHING_WITH_ID);
        storage.load = originalLoad;
    });

    test('loads a MistWarp project without downloading or importing its workspace', async () => {
        const Component = () => <div />;
        const WrappedComponent = ProjectFetcherHOC(Component);
        getEditorProject.mockImplementation(id => Promise.resolve({
            project: {
                id,
                title: id,
                projectJsonUrl: `https://projects.example/${id}.json`,
                workspaceUrl: `https://projects.example/${id}.mwp`
            }
        }));
        cachedFetchBuffer.mockImplementation(url => Promise.resolve(url));
        const onFetchedProjectData = jest.fn();
        const vmForFetch = {loadProject: jest.fn(), quit: jest.fn()};
        const wrapper = shallowWithIntl(
            <WrappedComponent
                onFetchedProjectData={onFetchedProjectData}
                store={store}
                vm={vmForFetch}
            />,
            {context: {store}}
        );
        const instance = wrapper.dive().dive().instance();

        window.history.replaceState({}, '', '/?platform_project=new');
        await instance.fetchProject('0', LoadingState.FETCHING_WITH_ID);

        expect(fetchWorkspace).not.toHaveBeenCalled();
        expect(onFetchedProjectData).toHaveBeenCalledTimes(1);
        expect(onFetchedProjectData.mock.calls[0][0]).toContain('/new.json');
    });

    test('uses the project page handoff without refetching editor metadata', async () => {
        const project = {
            id: 'handoff',
            title: 'Handoff',
            projectJsonUrl: 'https://projects.example/handoff.json',
            workspaceUrl: 'https://projects.example/handoff.mwp'
        };
        takeProjectHandoff.mockReturnValue(project);
        cachedFetchBuffer.mockResolvedValue('handoff data');
        const Component = () => <div />;
        const WrappedComponent = ProjectFetcherHOC(Component);
        const onFetchedProjectData = jest.fn();
        const vmForFetch = {loadProject: jest.fn(), quit: jest.fn()};
        const wrapper = shallowWithIntl(
            <WrappedComponent
                onFetchedProjectData={onFetchedProjectData}
                store={store}
                vm={vmForFetch}
            />,
            {context: {store}}
        );

        window.history.replaceState({}, '', '/?platform_project=handoff');
        await wrapper.dive().dive().instance().fetchProject('0', LoadingState.FETCHING_WITH_ID);

        expect(getEditorProject).not.toHaveBeenCalled();
        expect(fetchWorkspace).not.toHaveBeenCalled();
        expect(onFetchedProjectData).toHaveBeenCalledWith('handoff data', LoadingState.FETCHING_WITH_ID);
    });

    test.skip('when there is an id, it tries to update the store with that id', () => {
        const Component = ({projectId}) => <div>{projectId}</div>;
        const WrappedComponent = ProjectFetcherHOC(Component);
        const mockSetProjectIdFunc = jest.fn();
        mountWithIntl(
            <WrappedComponent
                projectId="100"
                setProjectId={mockSetProjectIdFunc}
                store={store}
            />
        );
        expect(mockSetProjectIdFunc.mock.calls[0][0]).toBe('100');
    });
    test.skip('when there is a reduxProjectId and isFetchingWithProjectId is true, it loads the project', () => {
        const mockedOnFetchedProject = jest.fn();
        const originalLoad = storage.load;
        storage.load = jest.fn((type, id) => Promise.resolve({data: id}));
        const Component = ({projectId}) => <div>{projectId}</div>;
        const WrappedComponent = ProjectFetcherHOC(Component);
        const mounted = mountWithIntl(
            <WrappedComponent
                store={store}
                onFetchedProjectData={mockedOnFetchedProject}
            />
        );
        mounted.setProps({
            reduxProjectId: '100',
            isFetchingWithId: true,
            loadingState: LoadingState.FETCHING_WITH_ID
        });
        expect(storage.load).toHaveBeenLastCalledWith(
            storage.AssetType.Project, '100', storage.DataFormat.JSON
        );
        storage.load = originalLoad;
        // nextTick needed since storage.load is async, and onFetchedProject is called in its then()
        process.nextTick(
            () => expect(mockedOnFetchedProject)
                .toHaveBeenLastCalledWith('100', LoadingState.FETCHING_WITH_ID)
        );
    });
});
