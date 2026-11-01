import React from 'react';
import configureStore from 'redux-mock-store';

import {mountWithIntl, shallowWithIntl} from '../../helpers/intl-helpers.jsx';

import ProjectFetcherHOC from '../../../src/lib/components/project-fetcher-hoc.jsx';
import storage from '../../../src/lib/persistence/storage';
import {LoadingState} from '../../../src/reducers/project-state';
import {getEditorProject, fetchWorkspace} from '../../../src/lib/community/api.js';
import {cachedFetchBuffer} from '../../../src/lib/community/cached-fetch.js';
import {beginProjectOperation, isProjectOperationActive} from '../../../src/lib/project-operation.js';
import {prepareProjectReplacement} from '../../../src/lib/project-replacement.js';
import {projectSession, takeLoadHandoff} from '../../../src/modules/project-session';
import withLoadProjectInterceptors from '../../helpers/load-interceptors.js';

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
jest.mock('../../../src/lib/project-replacement.js', () => ({
    prepareProjectReplacement: jest.fn(() => Promise.resolve(() => Promise.resolve()))
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
                vm: withLoadProjectInterceptors({
                    clear: () => {},
                    loadProject: () => {},
                    stop: () => {},
                    quit: () => {}
                })
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
        const vmForFetch = withLoadProjectInterceptors({
            clear: jest.fn(),
            loadProject: jest.fn(),
            quit: jest.fn()
        });
        const wrapper = shallowWithIntl(
            <WrappedComponent
                store={store}
                vm={vmForFetch}
            />,
            {context: {store}}
        );
        const instance = wrapper.dive().dive()
            .instance();

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
        const vmForFetch = withLoadProjectInterceptors({
            loadProject: jest.fn(),
            quit: jest.fn()
        });
        const wrapper = shallowWithIntl(
            <WrappedComponent
                onFetchedProjectData={onFetchedProjectData}
                store={store}
                vm={vmForFetch}
            />,
            {context: {store}}
        );
        const instance = wrapper.dive().dive()
            .instance();

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

    test('a lock conflict returns to the previous project instead of a fatal error', async () => {
        const Component = () => <div />;
        const WrappedComponent = ProjectFetcherHOC(Component);
        const onAbortProjectSwitch = jest.fn();
        const onShowProjectSwitchError = jest.fn();
        const onError = jest.fn();
        const vmForFetch = withLoadProjectInterceptors({
            loadProject: jest.fn(),
            quit: jest.fn(),
            runtime: {targets: [{}]}
        });
        const release = beginProjectOperation(vmForFetch);
        try {
            const wrapper = shallowWithIntl(
                <WrappedComponent
                    onAbortProjectSwitch={onAbortProjectSwitch}
                    onError={onError}
                    onShowProjectSwitchError={onShowProjectSwitchError}
                    store={store}
                    vm={vmForFetch}
                />,
                {context: {store}}
            );
            const instance = wrapper.dive().dive()
                .instance();
            instance.previousProjectId = '100';
            await instance.fetchProject('200', LoadingState.FETCHING_WITH_ID);
        } finally {
            release();
        }

        expect(onError).not.toHaveBeenCalled();
        expect(onAbortProjectSwitch).toHaveBeenCalledWith('100');
        expect(onShowProjectSwitchError).toHaveBeenCalledTimes(1);
        expect(onShowProjectSwitchError.mock.calls[0][0].message).toMatch(/Wait for the current save/);
    });

    test('a lock conflict on the first project load stays fatal', async () => {
        const Component = () => <div />;
        const WrappedComponent = ProjectFetcherHOC(Component);
        const onAbortProjectSwitch = jest.fn();
        const onError = jest.fn();
        const vmForFetch = withLoadProjectInterceptors({
            loadProject: jest.fn(),
            quit: jest.fn(),
            runtime: {targets: []}
        });
        const release = beginProjectOperation(vmForFetch);
        try {
            const wrapper = shallowWithIntl(
                <WrappedComponent
                    onAbortProjectSwitch={onAbortProjectSwitch}
                    onError={onError}
                    store={store}
                    vm={vmForFetch}
                />,
                {context: {store}}
            );
            const instance = wrapper.dive().dive()
                .instance();
            await instance.fetchProject('200', LoadingState.FETCHING_WITH_ID);
        } finally {
            release();
        }

        expect(onAbortProjectSwitch).not.toHaveBeenCalled();
        expect(onError).toHaveBeenCalledTimes(1);
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
        const vmForFetch = withLoadProjectInterceptors({loadProject: jest.fn(), quit: jest.fn()});
        const wrapper = shallowWithIntl(
            <WrappedComponent
                onFetchedProjectData={onFetchedProjectData}
                store={store}
                vm={vmForFetch}
            />,
            {context: {store}}
        );
        const instance = wrapper.dive().dive()
            .instance();

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
        const vmForFetch = withLoadProjectInterceptors({loadProject: jest.fn(), quit: jest.fn()});
        const wrapper = shallowWithIntl(
            <WrappedComponent
                onFetchedProjectData={onFetchedProjectData}
                store={store}
                vm={vmForFetch}
            />,
            {context: {store}}
        );

        window.history.replaceState({}, '', '/?platform_project=handoff');
        await wrapper.dive().dive()
            .instance()
            .fetchProject('0', LoadingState.FETCHING_WITH_ID);

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
        const vm = withLoadProjectInterceptors({loadProject: jest.fn(), quit: jest.fn()});
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
        takeLoadHandoff(vm).release();
    });

    const mountFetcher = props => {
        const Component = () => <div />;
        const WrappedComponent = ProjectFetcherHOC(Component);
        const wrapper = shallowWithIntl(
            <WrappedComponent
                store={store}
                {...props}
            />,
            {context: {store}}
        );
        return wrapper.dive().dive()
            .instance();
    };

    test('hands the rollback for the previous project to the VM manager', async () => {
        const restore = jest.fn(() => Promise.resolve());
        prepareProjectReplacement.mockResolvedValueOnce(restore);
        getEditorProject.mockResolvedValue({project: {id: 'next', projectJsonUrl: 'https://projects.example/next.json'}});
        cachedFetchBuffer.mockResolvedValue('next data');
        const onAbortProjectSwitch = jest.fn();
        const onFetchedProjectData = jest.fn();
        const vm = withLoadProjectInterceptors({loadProject: jest.fn(), quit: jest.fn(), runtime: {targets: [{}]}});
        const instance = mountFetcher({onAbortProjectSwitch, onFetchedProjectData, vm});
        instance.previousProjectId = '100';
        window.history.replaceState({}, '', '/?platform_project=next');

        await instance.fetchProject('0', LoadingState.FETCHING_WITH_ID);

        expect(onFetchedProjectData).toHaveBeenCalledWith('next data', LoadingState.FETCHING_WITH_ID);
        const {prepareHistory, release, rollback} = takeLoadHandoff(vm);
        expect(typeof prepareHistory).toBe('function');
        await rollback({error: new Error('Broken project')});
        expect(restore).toHaveBeenCalledTimes(1);
        expect(onAbortProjectSwitch).toHaveBeenCalledWith('100');
        expect(isProjectOperationActive(vm)).toBe(true);
        release();
        expect(isProjectOperationActive(vm)).toBe(false);
        expect(takeLoadHandoff(vm)).toEqual({});
    });

    test('unmounting during a fetch leaves no handoff on the VM', async () => {
        let finishDownload;
        const download = new Promise(resolve => {
            finishDownload = resolve;
        });
        const downloadStarted = new Promise(resolve => {
            cachedFetchBuffer.mockImplementation(() => {
                resolve();
                return download;
            });
        });
        getEditorProject.mockResolvedValue({project: {id: 'next', projectJsonUrl: 'https://projects.example/next.json'}});
        const onFetchedProjectData = jest.fn();
        const vm = withLoadProjectInterceptors({loadProject: jest.fn(), quit: jest.fn(), runtime: {targets: [{}]}});
        const instance = mountFetcher({onFetchedProjectData, vm});
        window.history.replaceState({}, '', '/?platform_project=next');

        const fetching = instance.fetchProject('0', LoadingState.FETCHING_WITH_ID);
        await downloadStarted;
        instance.componentWillUnmount();
        finishDownload('next data');
        await fetching;

        expect(onFetchedProjectData).not.toHaveBeenCalled();
        expect(takeLoadHandoff(vm)).toEqual({});
        expect(isProjectOperationActive(vm)).toBe(false);
    });

    test('clears an untaken handoff and releases the operation when handing off fails', async () => {
        getEditorProject.mockResolvedValue({project: {id: 'next', projectJsonUrl: 'https://projects.example/next.json'}});
        cachedFetchBuffer.mockResolvedValue('next data');
        const onError = jest.fn();
        const onFetchedProjectData = jest.fn(() => {
            throw new Error('Could not start loading');
        });
        const vm = withLoadProjectInterceptors({loadProject: jest.fn(), quit: jest.fn(), runtime: {targets: [{}]}});
        const instance = mountFetcher({onError, onFetchedProjectData, vm});
        window.history.replaceState({}, '', '/?platform_project=next');

        await instance.fetchProject('0', LoadingState.FETCHING_WITH_ID);

        expect(onFetchedProjectData).toHaveBeenCalledTimes(1);
        expect(takeLoadHandoff(vm)).toEqual({});
        expect(isProjectOperationActive(vm)).toBe(false);
    });

    test('a load the fetcher did not start clears the project source and records trust', async () => {
        const loadDirectly = jest.fn(() => Promise.resolve('loaded'));
        const vm = withLoadProjectInterceptors({loadProject: loadDirectly, quit: jest.fn()});
        mountFetcher({vm});
        mountFetcher({vm});
        expect(vm._loadProjectInterceptors).toHaveLength(1);

        window.history.replaceState({}, '', '/editor?platform_project=1&keep=1#mw-abc');
        await expect(vm.loadProject('kept', {mwPreserveProjectSource: true, mwCanTrustProject: true}))
            .resolves.toBe('loaded');
        expect(window.location.search).toBe('?platform_project=1&keep=1');
        expect(window.location.hash).toBe('#mw-abc');
        expect(projectSession(vm).canTrustProject).toBe(true);

        await vm.loadProject('dropped file');
        expect(loadDirectly).toHaveBeenLastCalledWith('dropped file', {});
        expect(window.location.search).toBe('?keep=1');
        expect(window.location.hash).toBe('');
        expect(projectSession(vm).canTrustProject).toBe(false);
    });

    test('when there is an id, it tries to update the store with that id', () => {
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
});
