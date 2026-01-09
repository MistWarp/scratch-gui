import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import VM from 'scratch-vm';
import AudioEngine from 'scratch-audio';

import WindowManager from '../../addons/window-system/window-manager';
import * as BrowserGit from '../git/browser-git';
import JSZip from 'jszip';

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
        }
        componentDidMount () {
            if (!this.props.vm.initialized) {
                window.vm = this.props.vm;

                // Expose the window manager on the VM for addons/integration.
                if (!this.props.vm.wm) this.props.vm.wm = WindowManager;

                // Expose MistWarp's browser git integration on the VM.
                if (!this.props.vm.gui) this.props.vm.gui = {};
                if (!this.props.vm.gui.git) this.props.vm.gui.git = BrowserGit;

                this.installGitProjectFileHooks();
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

        installGitProjectFileHooks () {
            const vm = this.props.vm;
            if (vm._mwGit_hooksInstalled) return;

            vm._mwGit_hooksInstalled = true;
            vm._mwGit_originalSaveProjectSb3 = vm.saveProjectSb3;
            vm._mwGit_originalSaveProjectSb3Stream = vm.saveProjectSb3Stream;
            vm._mwGit_originalLoadProject = vm.loadProject;

            const addGitJsonToZip = async zip => {
                const gitJson = await BrowserGit.exportRepoToGitJsonString();
                if (!gitJson) return;
                zip.file('git.json', gitJson);
                const date = new Date(1591657163000);
                for (const file of Object.values(zip.files)) {
                    file.date = date;
                }
            };

            vm.saveProjectSb3 = async (type, options) => {
                // Use scratch-vm's internal zip creation to preserve determinism.
                const zip = vm._saveProjectZip(options);
                await addGitJsonToZip(zip);
                return zip.generateAsync({
                    type: type || 'blob',
                    mimeType: 'application/x.scratch.sb3',
                    compression: 'DEFLATE'
                });
            };

            vm.saveProjectSb3Stream = (type, options) => {
                const zip = vm._saveProjectZip(options);
                return Promise.resolve(addGitJsonToZip(zip)).then(() => zip.generateInternalStream({
                    type: type || 'arraybuffer',
                    mimeType: 'application/x.scratch.sb3',
                    compression: 'DEFLATE'
                }));
            };

            vm.loadProject = async data => {
                // If this looks like an SB3, try to restore git.json first.
                try {
                    let buffer = null;
                    if (data instanceof ArrayBuffer) {
                        buffer = data;
                    } else if (ArrayBuffer.isView(data) && data.buffer) {
                        buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
                    } else if (typeof Blob !== 'undefined' && data instanceof Blob) {
                        buffer = await data.arrayBuffer();
                    }

                    if (buffer) {
                        const zip = await JSZip.loadAsync(buffer);
                        const file = zip.file('git.json');
                        if (file) {
                            const gitJson = await file.async('string');
                            await BrowserGit.importRepoFromGitJsonString(gitJson);
                        }
                    }
                } catch (e) {
                    // ignore malformed/non-sb3 inputs
                }

                return vm._mwGit_originalLoadProject(data);
            };
        }
        loadProject () {
            // tw: stop when loading new project
            this.props.vm.quit();
            return this.props.vm.loadProject(this.props.projectData)
                .then(() => {
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
