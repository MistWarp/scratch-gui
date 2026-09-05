import React from 'react';
import configureStore from 'redux-mock-store';

import {mountWithIntl, shallowWithIntl} from '../../helpers/intl-helpers.jsx';

import ProjectFetcherHOC from '../../../src/lib/components/project-fetcher-hoc.jsx';
import storage from '../../../src/lib/persistence/storage';
import {LoadingState} from '../../../src/reducers/project-state';
import {getEditorProject, fetchWorkspace} from '../../../src/lib/community/api.js';
import {cachedFetchBuffer} from '../../../src/lib/community/cached-fetch.js';
import {isProjectOperationActive} from '../../../src/lib/project-operation.js';

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
    getEditorProject: jest.fn()
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

    test('rejects another project switch while a fetch is in progress', async () => {
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
        expect(pendingLoads).toHaveLength(1);
        await newFetch;
        pendingLoads[0]({data: 'old project'});
        await oldFetch;

        expect(onFetchedProjectData).toHaveBeenCalledTimes(1);
        expect(onFetchedProjectData).toHaveBeenCalledWith('old project', LoadingState.FETCHING_WITH_ID);
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

    test('fetches current editor metadata before loading a platform project', async () => {
        const currentProject = {
            id: 'handoff',
            title: 'Current project',
            gitHead: 'current-head',
            projectJsonUrl: 'https://projects.example/current.json',
            workspaceUrl: 'https://projects.example/current.mwp'
        };
        getEditorProject.mockResolvedValue({project: currentProject});
        cachedFetchBuffer.mockResolvedValue('current data');
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

        expect(getEditorProject).toHaveBeenCalledWith('handoff');
        expect(cachedFetchBuffer).toHaveBeenCalledWith(currentProject.projectJsonUrl);
        expect(fetchWorkspace).not.toHaveBeenCalled();
        expect(onFetchedProjectData).toHaveBeenCalledWith('current data', LoadingState.FETCHING_WITH_ID);
    });

    test.each(['metadata', 'content'])('can retry a failed %s download without crashing or losing the URL', async step => {
        const project = {
            id: 'p17880301792408280002shiaF',
            projectJsonUrl: 'https://projects.example/current.json'
        };
        const error = new TypeError('Failed to fetch');
        getEditorProject.mockResolvedValue({project});
        cachedFetchBuffer.mockResolvedValue('project data');
        if (step === 'metadata') getEditorProject.mockRejectedValueOnce(error);
        else cachedFetchBuffer.mockRejectedValueOnce(error);
        const Component = () => <div />;
        const WrappedComponent = ProjectFetcherHOC(Component);
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
        const instance = wrapper.dive().dive().instance();
        window.history.replaceState({}, '', `/editor?test=1#mw-${project.id}`);
        const originalUrl = window.location.href;

        await instance.fetchProject('0', LoadingState.FETCHING_NEW_DEFAULT);

        expect(onError).not.toHaveBeenCalled();
        expect(onFetchedProjectData).not.toHaveBeenCalled();
        expect(instance.render().props.projectFetchError).toBe(error);
        expect(isProjectOperationActive(vm)).toBe(false);
        expect(window.location.href).toBe(originalUrl);

        await instance.render().props.onRetryProjectFetch();

        expect(instance.render().props.projectFetchError).toBeNull();
        expect(onError).not.toHaveBeenCalled();
        expect(onFetchedProjectData).toHaveBeenCalledWith('project data', LoadingState.FETCHING_NEW_DEFAULT);
        expect(getEditorProject).toHaveBeenLastCalledWith(project.id);
        expect(window.location.href).toBe(originalUrl);
        vm._mwReleaseProjectLoad();
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
