import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import VM from 'scratch-vm';
import AudioEngine from 'scratch-audio';

import {setProjectUnchanged} from '../reducers/project-changed';
import {
    LoadingStates,
    getIsLoadingWithId,
    onLoadedProject,
    projectError
} from '../reducers/project-state';
import log from './log';

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
        }
        componentDidMount () {
            if (!this.props.vm.initialized) {
                const initStartTime = performance.now();
                window.vm = this.props.vm;
                
                // Initialize audio engine asynchronously for better performance
                this.initializeAudioAsync();
                
                this.props.vm.initialized = true;
                this.props.vm.setLocale(this.props.locale, this.props.messages);
                
                // Set normal runtime options for the VM
                this.props.vm.setRuntimeOptions({
                    fencing: false,
                    miscLimits: false,
                    maxClones: 300
                });
                
                const initTime = performance.now() - initStartTime;
                
                // Log VM initialization time
                if (window.MISTWARP_LOAD_START_TIME) {
                    const vmInitTime = Date.now() - window.MISTWARP_LOAD_START_TIME;
                    console.log(`🖥️ VM initialized in ${vmInitTime}ms (${(vmInitTime / 1000).toFixed(2)}s) [init: ${initTime.toFixed(2)}ms]`);
                    
                    if (window.performance && window.performance.mark) {
                        window.performance.mark('mistwarp-vm-init');
                    }
                }
            }
            if (!this.props.isPlayerOnly && !this.props.isStarted) {
                this.props.vm.start();
            }
        }
        
        /**
         * Initialize audio engine asynchronously to avoid blocking VM initialization
         */
        async initializeAudioAsync() {
            try {
                // Use requestIdleCallback if available to avoid blocking main thread
                const scheduleAudioInit = window.requestIdleCallback || 
                    ((callback) => setTimeout(callback, 0));
                
                scheduleAudioInit(() => {
                    try {
                        this.audioEngine = new AudioEngine();
                        this.props.vm.attachAudioEngine(this.audioEngine);
                        console.log('🎵 Audio engine initialized asynchronously');
                    } catch (e) {
                        log.error('could not create scratch-audio', e);
                    }
                });
            } catch (e) {
                log.error('async audio initialization failed', e);
            }
        }
        
        componentDidUpdate (prevProps) {
            // if project is in loading state, AND fonts are loaded,
            // and they weren't both that way until now... load project!
            if (this.props.isLoadingWithId && this.props.fontsLoaded &&
                (!prevProps.isLoadingWithId || !prevProps.fontsLoaded)) {
                this.loadProject();
            }
            // Start the VM if entering editor mode with an unstarted vm
            if (!this.props.isPlayerOnly && !this.props.isStarted) {
                this.props.vm.start();
            }
        }
        loadProject () {
            // tw: stop when loading new project
            this.props.vm.quit();
            
            // Import VM load optimizer
            import('../lib/vm-load-optimizer.js').then(module => {
                const vmLoadOptimizer = module.default;
                
                // Use optimized loading
                return vmLoadOptimizer.loadProject(this.props.vm, this.props.projectData, {
                    useCache: true,
                    priority: 'high'
                });
            }).catch(error => {
                console.warn('VM optimizer not available, falling back to standard loading:', error);
                // Fallback to standard loading
                return this.props.vm.loadProject(this.props.projectData);
            }).then(() => {
                // Restore normal runtime options after project loading is complete
                // During loading we had reduced limits for performance, now restore them from Redux state
                if (this.props.runtimeOptions) {
                    this.props.vm.setRuntimeOptions(this.props.runtimeOptions);
                } else {
                    // Fallback to default values if Redux state is not available
                    this.props.vm.setRuntimeOptions({
                        fencing: true,        // Re-enable fencing
                        miscLimits: true,     // Re-enable misc limits 
                        maxClones: 300        // Restore normal clone limit
                    });
                }
                
                // Log project loading completion time
                if (window.MISTWARP_LOAD_START_TIME) {
                    const projectLoadTime = Date.now() - window.MISTWARP_LOAD_START_TIME;
                    console.log(`📦 Project data loaded in ${projectLoadTime}ms (${(projectLoadTime / 1000).toFixed(2)}s)`);
                    
                    if (window.performance && window.performance.mark) {
                        window.performance.mark('mistwarp-project-loaded');
                    }
                }
                
                this.props.onLoadedProject(this.props.loadingState, this.props.canSave);
                // Wrap in a setTimeout because skin loading in
                // the renderer can be async.
                setTimeout(() => this.props.onSetProjectUnchanged());

                // If the vm is not running, call draw on the renderer manually
                // This draws the state of the loaded project with no blocks running
                // which closely matches the 2.0 behavior, except for monitors–
                // 2.0 runs monitors and shows updates (e.g. timer monitor)
                // before the VM starts running other hat blocks.
                if (!this.props.isStarted) {
                    // Wrap in a setTimeout because skin loading in
                    // the renderer can be async.
                    setTimeout(() => this.props.vm.renderer.draw());
                }
            })
            .catch(e => {
                this.props.onError(e);
            });
        }
        render () {
            const {
                /* eslint-disable no-unused-vars */
                fontsLoaded,
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
        fontsLoaded: PropTypes.bool,
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
        runtimeOptions: PropTypes.object,
        username: PropTypes.string,
        vm: PropTypes.instanceOf(VM).isRequired
    };

    const mapStateToProps = state => {
        const loadingState = state.scratchGui.projectState.loadingState;
        return {
            fontsLoaded: state.scratchGui.fontsLoaded,
            isLoadingWithId: getIsLoadingWithId(loadingState),
            locale: state.locales.locale,
            messages: state.locales.messages,
            projectData: state.scratchGui.projectState.projectData,
            projectId: state.scratchGui.projectState.projectId,
            loadingState: loadingState,
            isPlayerOnly: state.scratchGui.mode.isPlayerOnly,
            isStarted: state.scratchGui.vmStatus.started,
            runtimeOptions: state.scratchGui.tw.runtimeOptions
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
