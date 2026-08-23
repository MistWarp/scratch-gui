import React from 'react';
import PropTypes from 'prop-types';
import {intlShape, injectIntl} from 'react-intl';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';

import {setProjectUnchanged} from '../../reducers/project-changed.js';
import {setProjectTitle} from '../../reducers/project-title.js';
import {
    LoadingStates,
    getIsCreatingNew,
    getIsFetchingWithId,
    getIsFetchingWithoutId,
    getIsLoading,
    getIsShowingProject,
    onFetchedProjectData,
    projectError,
    setProjectId
} from '../../reducers/project-state.js';
import {
    activateTab,
    BLOCKS_TAB_INDEX
} from '../../reducers/editor-tab.js';

import log from '../utils/log.js';
import storage from '../persistence/storage.js';

import VM from 'scratch-vm';
import {fetchProjectMeta} from './tw-project-meta-fetcher-hoc.jsx';
import {cloneRepo, deleteRepo} from '../git/browser-git.js';
import {checkoutMwpBranch, importMwp} from '../git/mwp.js';
import {markProjectHistoryLoading, preloadProjectHistory} from '../git/project-history.js';
import {buildSb3FromFractchTree} from '../git/fractch-tree.js';
import {getAuth as getRoturGitAuth} from '../rotur/git-api.js';
import {rememberPlatformProject} from '../community/publish.js';
import {
    fetchWorkspace,
    getEditorProject as getMistWarpEditorProject
} from '../community/api.js';
import {hasBridge, bridgeFetch} from '../community/embed-bridge.js';
import {cachedFetchBuffer} from '../community/cached-fetch.js';

const cloneProjectFromRepo = async url => {
    const {fs, dir} = await cloneRepo({url, onAuth: getRoturGitAuth});
    const sb3 = await buildSb3FromFractchTree({fs, dir});
    return {data: sb3 instanceof ArrayBuffer ? sb3 : await sb3.arrayBuffer()};
};

const isHttpUrl = url => /^https?:\/\//.test(url);

let fetchInitiatedLoad = false;
let projectHistoryLoadQueue = Promise.resolve();

const queueProjectHistoryLoad = task => {
    const result = projectHistoryLoadQueue.then(task, task);
    projectHistoryLoadQueue = result.catch(() => {});
    return result;
};

const clearProjectSourceFromUrl = () => {
    if (typeof location === 'undefined' || typeof URLSearchParams === 'undefined') return;
    const params = new URLSearchParams(location.search);
    let changed = false;
    for (const key of ['clone', 'project_url', 'platform_project', 'mw_assets', 'mw_te']) {
        if (params.has(key)) {
            params.delete(key);
            changed = true;
        }
    }
    const hasMwHash = /^#mw-/.test(location.hash);
    if (!changed && !hasMwHash) return;
    const query = params.toString();
    const hash = hasMwHash ? '' : location.hash;
    try {
        history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}${hash}`);
    } catch (e) {
        // ignore
    }
};

const clearProjectSourceOnForeignLoads = vm => {
    if (!vm || vm._mwClearsProjectSourceUrl) return;
    vm._mwClearsProjectSourceUrl = true;
    const originalLoadProject = vm.loadProject.bind(vm);
    vm.loadProject = (...args) => {
        vm._mwCanTrustProject = Boolean(args[1] && args[1].mwCanTrustProject);
        if (fetchInitiatedLoad) {
            fetchInitiatedLoad = false;
        } else {
            clearProjectSourceFromUrl();
        }
        return originalLoadProject(...args);
    };
};

const fetchArrayBuffer = url => cachedFetchBuffer(url);

const loadPlatformProject = async (id, source) => {
    const project = source || (await getMistWarpEditorProject(id)).project;
    const [data, workspace] = await Promise.all([
        hasBridge() ? bridgeFetch(project.projectJsonUrl) : fetchArrayBuffer(project.projectJsonUrl),
        project.workspaceUrl ? fetchWorkspace(project.workspaceUrl) : Promise.resolve(null)
    ]);
    return {data, title: project.title, platformProject: project, workspace};
};

// TW: Temporary hack for project tokens
const fetchProjectToken = async projectId => {
    if (projectId === '0') {
        return null;
    }
    // Parse ?token=abcdef
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.has('token')) {
        return searchParams.get('token');
    }
    // Parse #1?token=abcdef
    const hashParams = new URLSearchParams(location.hash.split('?')[1]);
    if (hashParams.has('token')) {
        return hashParams.get('token');
    }
    try {
        const metadata = await fetchProjectMeta(projectId);
        return metadata.project_token;
    } catch (e) {
        log.error(e);
        throw new Error('Cannot access project token. Project is probably unshared. See https://docs.turbowarp.org/unshared-projects');
    }
};

/* Higher Order Component to provide behavior for loading projects by id. If
 * there's no id, the default project is loaded.
 * @param {React.Component} WrappedComponent component to receive projectData prop
 * @returns {React.Component} component with project loading behavior
 */
const ProjectFetcherHOC = function (WrappedComponent) {
    class ProjectFetcherComponent extends React.Component {
        constructor (props) {
            super(props);
            bindAll(this, [
                'fetchProject'
            ]);
            storage.setProjectHost(props.projectHost);
            storage.setProjectToken(props.projectToken);
            storage.setAssetHost(props.assetHost);
            storage.setTranslatorFunction(props.intl.formatMessage);
            clearProjectSourceOnForeignLoads(props.vm);
            this.fetchGeneration = 0;
            if (typeof location !== 'undefined' && typeof URLSearchParams !== 'undefined') {
                const initialPlatformId = new URLSearchParams(location.search).get('platform_project') ||
                    (location.hash.match(/^#mw-([\w-]+)/) || [])[1];
                rememberPlatformProject(initialPlatformId ? {id: initialPlatformId} : null);
            }
            // props.projectId might be unset, in which case we use our default;
            // or it may be set by an even higher HOC, and passed to us.
            // Either way, we now know what the initial projectId should be, so
            // set it in the redux store.
            if (
                props.projectId !== '' &&
                props.projectId !== null &&
                typeof props.projectId !== 'undefined'
            ) {
                this.props.setProjectId(props.projectId.toString());
            }
        }
        componentDidUpdate (prevProps) {
            if (prevProps.projectHost !== this.props.projectHost) {
                storage.setProjectHost(this.props.projectHost);
            }
            if (prevProps.projectToken !== this.props.projectToken) {
                storage.setProjectToken(this.props.projectToken);
            }
            if (prevProps.assetHost !== this.props.assetHost) {
                storage.setAssetHost(this.props.assetHost);
            }
            if (this.props.isFetchingWithId && !prevProps.isFetchingWithId) {
                this.fetchProject(this.props.reduxProjectId, this.props.loadingState);
            }
            if (this.props.isShowingProject && !prevProps.isShowingProject) {
                this.props.onProjectUnchanged();
            }
            if (this.props.isShowingProject && (prevProps.isLoadingProject || prevProps.isCreatingNew)) {
                this.props.onActivateTab(BLOCKS_TAB_INDEX);
            }
        }
        componentWillUnmount () {
            this.fetchGeneration++;
        }
        fetchProject (projectId, loadingState) {
            const fetchGeneration = ++this.fetchGeneration;
            // Stop scripts while fetching, but keep the current project intact until replacement data exists.
            this.props.vm.quit();
            markProjectHistoryLoading();
            this.props.vm._mwPrepareProjectHistory = null;
            this.props.vm._mwHistoryBootstrapError = null;

            const isInitialFetch = !this.hasFetchedProject;
            this.hasFetchedProject = true;
            if (!isInitialFetch && getIsFetchingWithoutId(loadingState)) {
                clearProjectSourceFromUrl();
            }

            let assetPromise;
            const searchParams = typeof URLSearchParams === 'undefined' ?
                null :
                new URLSearchParams(location.search);
            const cloneUrl = searchParams && searchParams.get('clone');
            const platformProject = searchParams && searchParams.get('platform_project');
            const hashMatch = typeof location === 'undefined' ?
                null :
                location.hash.match(/^#mw-([\w-]+)/);
            const hashProjectId = hashMatch && hashMatch[1];
            const mistwarpAssets = searchParams && searchParams.get('mw_assets');
            let mistwarpTrustedExtensions = [];
            try {
                mistwarpTrustedExtensions = JSON.parse((searchParams && searchParams.get('mw_te')) || '[]');
            } catch (e) {
                mistwarpTrustedExtensions = [];
            }
            if (mistwarpAssets && isHttpUrl(mistwarpAssets)) {
                storage.addMistWarpAssetStore(mistwarpAssets);
            }
            let projectUrl = searchParams && searchParams.get('project_url');
            let sourceProvidesHistory = false;
            if (hashProjectId || platformProject) {
                sourceProvidesHistory = true;
                const id = hashProjectId || platformProject;
                const source = this.props.isEmbedded && platformProject && !hashProjectId && projectUrl ? {
                    id,
                    projectJsonUrl: projectUrl,
                    assetsBase: mistwarpAssets,
                    trustedExtensions: mistwarpTrustedExtensions
                } : null;
                assetPromise = loadPlatformProject(id, source);
            } else if (cloneUrl) {
                sourceProvidesHistory = true;
                assetPromise = queueProjectHistoryLoad(async () => {
                    if (fetchGeneration !== this.fetchGeneration) return null;
                    rememberPlatformProject(null);
                    const projectAsset = await cloneProjectFromRepo(cloneUrl);
                    return fetchGeneration === this.fetchGeneration ?
                        {...projectAsset, historyPrepared: true} :
                        null;
                });
            } else if (projectUrl) {
                if (
                    !projectUrl.startsWith('http:') &&
                    !projectUrl.startsWith('https:') &&
                    !projectUrl.startsWith('data:')
                ) {
                    projectUrl = `https://${projectUrl}`;
                }
                const jsonUrl = projectUrl;
                assetPromise = (hasBridge() ? bridgeFetch(jsonUrl) : fetchArrayBuffer(jsonUrl))
                    .then(buffer => ({data: buffer}));
            } else {
                // TW: Temporary hack for project tokens
                assetPromise = fetchProjectToken(projectId)
                    .then(token => {
                        storage.setProjectToken(token);
                        return storage.load(storage.AssetType.Project, projectId, storage.DataFormat.JSON);
                    });
            }

            return assetPromise
                .then(async projectAsset => {
                    if (fetchGeneration !== this.fetchGeneration) return;
                    if (projectAsset) {
                        if (!projectAsset.historyPrepared) {
                            const historyReady = await queueProjectHistoryLoad(async () => {
                                if (fetchGeneration !== this.fetchGeneration) return false;
                                if (projectAsset.platformProject) {
                                    const project = projectAsset.platformProject;
                                    if (project.assetsBase && isHttpUrl(project.assetsBase)) {
                                        storage.addMistWarpAssetStore(project.assetsBase);
                                    }
                                    rememberPlatformProject(project);
                                    if (projectAsset.workspace) {
                                        await importMwp(projectAsset.workspace);
                                        if (project.gitBranch) await checkoutMwpBranch(project.gitBranch);
                                    } else {
                                        await deleteRepo();
                                    }
                                } else if (!sourceProvidesHistory) {
                                    rememberPlatformProject(null);
                                    await deleteRepo();
                                }
                                return fetchGeneration === this.fetchGeneration;
                            });
                            if (!historyReady || fetchGeneration !== this.fetchGeneration) return;
                        }
                        fetchInitiatedLoad = true;
                        this.props.vm._mwPrepareProjectHistory = () =>
                            preloadProjectHistory(this.props.vm, {force: true});
                        if (projectAsset.title) {
                            this.props.onSetProjectTitle(projectAsset.title);
                        }
                        this.props.onFetchedProjectData(projectAsset.data, loadingState);
                    } else {
                        // Treat failure to load as an error
                        // Throw to be caught by catch later on
                        throw new Error('Could not find project');
                    }
                })
                .catch(err => {
                    if (fetchGeneration !== this.fetchGeneration) return;
                    this.props.vm._mwPrepareProjectHistory = null;
                    this.props.onError(err);
                    log.error(err);
                });
        }
        render () {
            const {
                /* eslint-disable no-unused-vars */
                assetHost,
                intl,
                isLoadingProject: isLoadingProjectProp,
                loadingState,
                onActivateTab,
                onError: onErrorProp,
                onFetchedProjectData: onFetchedProjectDataProp,
                onProjectUnchanged,
                projectHost,
                projectId,
                reduxProjectId,
                setProjectId: setProjectIdProp,
                /* eslint-enable no-unused-vars */
                isFetchingWithId: isFetchingWithIdProp,
                ...componentProps
            } = this.props;
            return (
                <WrappedComponent
                    fetchingProject={isFetchingWithIdProp}
                    {...componentProps}
                />
            );
        }
    }
    ProjectFetcherComponent.propTypes = {
        assetHost: PropTypes.string,
        canSave: PropTypes.bool,
        intl: intlShape.isRequired,
        isCreatingNew: PropTypes.bool,
        isEmbedded: PropTypes.bool,
        isFetchingWithId: PropTypes.bool,
        isLoadingProject: PropTypes.bool,
        isShowingProject: PropTypes.bool,
        loadingState: PropTypes.oneOf(LoadingStates),
        onActivateTab: PropTypes.func,
        onError: PropTypes.func,
        onFetchedProjectData: PropTypes.func,
        onProjectUnchanged: PropTypes.func,
        onSetProjectTitle: PropTypes.func,
        projectHost: PropTypes.string,
        projectToken: PropTypes.string,
        projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        reduxProjectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        setProjectId: PropTypes.func,
        vm: PropTypes.instanceOf(VM)
    };
    ProjectFetcherComponent.defaultProps = {
        assetHost: 'https://assets.scratch.mit.edu',
        projectHost: 'https://projects.scratch.mit.edu'
    };

    const mapStateToProps = state => ({
        isCreatingNew: getIsCreatingNew(state.scratchGui.projectState.loadingState),
        isEmbedded: state.scratchGui.mode.isEmbedded,
        isFetchingWithId: getIsFetchingWithId(state.scratchGui.projectState.loadingState),
        isLoadingProject: getIsLoading(state.scratchGui.projectState.loadingState),
        isShowingProject: getIsShowingProject(state.scratchGui.projectState.loadingState),
        loadingState: state.scratchGui.projectState.loadingState,
        reduxProjectId: state.scratchGui.projectState.projectId,
        vm: state.scratchGui.vm
    });
    const mapDispatchToProps = dispatch => ({
        onActivateTab: tab => dispatch(activateTab(tab)),
        onError: error => dispatch(projectError(error)),
        onFetchedProjectData: (projectData, loadingState) =>
            dispatch(onFetchedProjectData(projectData, loadingState)),
        setProjectId: projectId => dispatch(setProjectId(projectId)),
        onProjectUnchanged: () => dispatch(setProjectUnchanged()),
        onSetProjectTitle: title => dispatch(setProjectTitle(title))
    });
    // Allow incoming props to override redux-provided props. Used to mock in tests.
    const mergeProps = (stateProps, dispatchProps, ownProps) => Object.assign(
        {}, stateProps, dispatchProps, ownProps
    );
    return injectIntl(connect(
        mapStateToProps,
        mapDispatchToProps,
        mergeProps
    )(ProjectFetcherComponent));
};

export {
    ProjectFetcherHOC as default
};
