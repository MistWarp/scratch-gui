import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import VM from 'scratch-vm';
import AudioEngine from 'scratch-audio';

import {setProjectUnchanged} from '../../reducers/project-changed';
import {
    LoadingStates,
    getIsLoadingWithId,
    onLoadedProject,
    projectError
} from '../../reducers/project-state';
import log from '../utils/log';

/**
 * List of fonts that could be used by security prompts.
 */
const SECURITY_CRITICAL_FONTS = [
    'Helvetica Neue',
    'Helvetica',
    'Arial'
];

/*
 * Higher Order Component to manage events emitted by the VM
 * @param {React.Component} WrappedComponent component to manage VM events for
 * @returns {React.Component} connected component with vm events bound to redux
 */
const vmManagerHOC = function (WrappedComponent) {
    class VMManager extends React.Component {
        constructor (props) {
            super(props);
            bindAll(this, [
                'loadProject'
            ]);
            this._isMounted = false;
            this.loadGeneration = 0;
            this.loadTimeouts = new Set();
        }
        componentDidMount () {
            this._isMounted = true;
            if (!this.props.vm.initialized) {
                window.vm = this.props.vm;

                try {
                    this.audioEngine = new AudioEngine();
                    this.props.vm.attachAudioEngine(this.audioEngine);
                } catch (e) {
                    log.error('could not create scratch-audio', e);
                }
                for (const font of SECURITY_CRITICAL_FONTS) {
                    this.props.vm.runtime.fontManager.restrictFont(font);
                }
                this.props.vm.initialized = true;
                this.props.vm.setLocale(this.props.locale, this.props.messages);
            }
            if (!this.props.isPlayerOnly && !this.props.isStarted) {
                this.props.vm.start();
            }
            if (this.props.isLoadingWithId) {
                this.loadProject();
            }
        }
        componentDidUpdate (prevProps) {
            // Built-in font data is available synchronously. Start parsing as
            // soon as the fetched project enters the VM loading state.
            if (this.props.isLoadingWithId && !prevProps.isLoadingWithId) {
                this.loadProject();
            }
            // Start the VM if entering editor mode with an unstarted vm
            if (!this.props.isPlayerOnly && !this.props.isStarted) {
                this.props.vm.start();
            }
        }
        componentWillUnmount () {
            this._isMounted = false;
            this.loadGeneration++;
            this.loadTimeouts.forEach(timeout => clearTimeout(timeout));
            this.loadTimeouts.clear();
        }

        loadProject () {
            const loadGeneration = ++this.loadGeneration;
            const {
                canSave,
                isStarted,
                loadingState,
                onError,
                onLoadedProject: handleLoadedProject,
                onSetProjectUnchanged,
                projectData,
                vm
            } = this.props;
            // tw: stop when loading new project
            vm.quit();
            const prepareProjectHistory = vm._mwPrepareProjectHistory;
            vm._mwPrepareProjectHistory = null;
            return vm.loadProject(projectData, {skipGitImport: true})
                .then(() => {
                    if (!this._isMounted || loadGeneration !== this.loadGeneration) return false;
                    if (prepareProjectHistory) {
                        // History has its own loading state and is not needed to
                        // render or edit. Do not hold the whole editor behind it.
                        Promise.resolve()
                            .then(() => prepareProjectHistory())
                            .catch(error => {
                                log.error('Could not preload MistWarp version history:', error);
                            });
                    }
                    handleLoadedProject(loadingState, canSave);
                    // Wrap in a setTimeout because skin loading in
                    // the renderer can be async.
                    const unchangedTimeout = setTimeout(() => {
                        this.loadTimeouts.delete(unchangedTimeout);
                        if (this._isMounted && loadGeneration === this.loadGeneration) {
                            onSetProjectUnchanged();
                        }
                    });
                    this.loadTimeouts.add(unchangedTimeout);

                    // If the vm is not running, call draw on the renderer manually
                    // This draws the state of the loaded project with no blocks running
                    // which closely matches the 2.0 behavior, except for monitors–
                    // 2.0 runs monitors and shows updates (e.g. timer monitor)
                    // before the VM starts running other hat blocks.
                    if (!isStarted) {
                        // Wrap in a setTimeout because skin loading in
                        // the renderer can be async.
                        const drawTimeout = setTimeout(() => {
                            this.loadTimeouts.delete(drawTimeout);
                            if (this._isMounted && loadGeneration === this.loadGeneration) {
                                vm.renderer.draw();
                            }
                        });
                        this.loadTimeouts.add(drawTimeout);
                    }
                    return true;
                })
                .catch(e => {
                    if (this._isMounted && loadGeneration === this.loadGeneration) {
                        onError(e);
                    }
                    return false;
                });
        }
        render () {
            const {
                /* eslint-disable no-unused-vars */
                loadingState,
                locale,
                messages,
                isStarted,
                onError: onErrorProp,
                onLoadedProject: onLoadedProjectProp,
                onSetProjectUnchanged,
                projectData,
                /* eslint-enable no-unused-vars */
                isLoadingWithId: isLoadingWithIdProp,
                vm,
                ...componentProps
            } = this.props;
            return (
                <WrappedComponent
                    isLoading={isLoadingWithIdProp}
                    vm={vm}
                    {...componentProps}
                />
            );
        }
    }

    VMManager.propTypes = {
        canSave: PropTypes.bool,
        cloudHost: PropTypes.string,
        isLoadingWithId: PropTypes.bool,
        isPlayerOnly: PropTypes.bool,
        isStarted: PropTypes.bool,
        loadingState: PropTypes.oneOf(LoadingStates),
        locale: PropTypes.string,
        messages: PropTypes.objectOf(PropTypes.string),
        onError: PropTypes.func,
        onLoadedProject: PropTypes.func,
        onSetProjectUnchanged: PropTypes.func,
        projectData: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
        projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        username: PropTypes.string,
        vm: PropTypes.instanceOf(VM).isRequired
    };

    const mapStateToProps = state => {
        const loadingState = state.scratchGui.projectState.loadingState;
        return {
            isLoadingWithId: getIsLoadingWithId(loadingState),
            locale: state.locales.locale,
            messages: state.locales.messages,
            projectData: state.scratchGui.projectState.projectData,
            projectId: state.scratchGui.projectState.projectId,
            loadingState: loadingState,
            isPlayerOnly: state.scratchGui.mode.isPlayerOnly,
            isStarted: state.scratchGui.vmStatus.started
        };
    };

    const mapDispatchToProps = dispatch => ({
        onError: error => dispatch(projectError(error)),
        onLoadedProject: (loadingState, canSave) =>
            dispatch(onLoadedProject(loadingState, canSave, true)),
        onSetProjectUnchanged: () => dispatch(setProjectUnchanged())
    });

    // Allow incoming props to override redux-provided props. Used to mock in tests.
    const mergeProps = (stateProps, dispatchProps, ownProps) => Object.assign(
        {}, stateProps, dispatchProps, ownProps
    );

    return connect(
        mapStateToProps,
        mapDispatchToProps,
        mergeProps
    )(VMManager);
};

export default vmManagerHOC;
