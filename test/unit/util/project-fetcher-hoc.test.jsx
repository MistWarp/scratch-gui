import React from 'react';
import configureStore from 'redux-mock-store';

import {mountWithIntl, shallowWithIntl} from '../../helpers/intl-helpers.jsx';

import ProjectFetcherHOC from '../../../src/lib/components/project-fetcher-hoc.jsx';
import storage from '../../../src/lib/persistence/storage';
import {LoadingState} from '../../../src/reducers/project-state';
import {importMwp} from '../../../src/lib/git/mwp.js';
import {getEditorProject, fetchWorkspace} from '../../../src/lib/community/api.js';
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

    test('applies a newer project workspace after an older import finishes', async () => {
        const Component = () => <div />;
        const WrappedComponent = ProjectFetcherHOC(Component);
        let finishOldImport;
        let signalOldImportStarted;
        const oldImportStarted = new Promise(resolve => {
            signalOldImportStarted = resolve;
        });
        importMwp.mockImplementation(workspace => {
            if (workspace.name === 'old') {
                return new Promise(resolve => {
                    finishOldImport = resolve;
                    signalOldImportStarted();
                });
            }
            return Promise.resolve();
        });
        getEditorProject.mockImplementation(id => Promise.resolve({
            project: {
                id,
                title: id,
                projectJsonUrl: `https://projects.example/${id}.json`,
                workspaceUrl: `https://projects.example/${id}.mwp`
            }
        }));
        fetchWorkspace.mockImplementation(url => Promise.resolve({
            name: url.includes('/old.') ? 'old' : 'new'
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

        window.history.replaceState({}, '', '/?platform_project=old');
        const oldFetch = instance.fetchProject('0', LoadingState.FETCHING_WITH_ID);
        await oldImportStarted;
        window.history.replaceState({}, '', '/?platform_project=new');
        const newFetch = instance.fetchProject('0', LoadingState.FETCHING_WITH_ID);

        finishOldImport();
        await Promise.all([oldFetch, newFetch]);

        expect(importMwp.mock.calls.map(call => call[0].name)).toEqual(['old', 'new']);
        expect(onFetchedProjectData).toHaveBeenCalledTimes(1);
        expect(onFetchedProjectData.mock.calls[0][0]).toContain('/new.json');
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
