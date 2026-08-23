import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import bindAll from 'lodash.bindall';
import VM from 'scratch-vm';
import log from '../utils/log';
import {initAppearanceSettings} from '../mw-appearance-settings';
import {initStyleSettings} from '../mw-style-settings';
import {initMenuBarLayout} from '../mw-menu-bar-layout';

import {
    setUsername
} from '../../reducers/tw';
import {
    defaultProjectId,
    setProjectId
} from '../../reducers/project-state';
import {
    setCollaborationRoomId,
    openCollaborationModal
} from '../../reducers/collaboration.js';
import {
    setPlayer,
    setFullScreen
} from '../../reducers/mode';
import {generateRandomUsername} from '../utils/tw-username';
import CollaborationService from '../collaboration/index.js';
import {setSearchParams} from '../utils/navigation';
import {defaultStageSize} from '../../reducers/custom-stage-size';
import {openSimpleDialog} from '../../reducers/modals';

const USERNAME_KEY = 'tw:username';

const parseNonNegativeURLNumber = value => {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
};

const confirmProjectSwitch = ({confirmWithMessage, openDialog, message}) => {
    if (confirmWithMessage) return Promise.resolve(confirmWithMessage(message)).then(Boolean);
    return new Promise(resolve => {
        openDialog({
            type: 'confirm',
            title: 'Switch projects?',
            message,
            onOk: () => resolve(true),
            onCancel: () => resolve(false)
        });
    });
};

const restoreRouterURL = (router, routerState) => {
    if (!router) return false;
    const currentPath = `${location.pathname}${location.search}${location.hash}`;
    const expectedPath = router.generateURL(routerState);
    if (!expectedPath || expectedPath === currentPath) return false;
    history.replaceState(null, null, expectedPath);
    return true;
};

/**
 * The State Manager is responsible for managing persistent state and the URL.
 */

const setLocalStorage = (key, value) => {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        // ignore
    }
};

const getLocalStorage = key => {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        // ignore
    }
    return null;
};

const readHashProjectId = () => {
    const match = location.hash.match(/#(\d+)/);
    return match === null ? null : match[1];
};

class Router {
    constructor ({onSetProjectId, onSetIsPlayerOnly, onSetIsFullScreen}) {
        this.onSetProjectId = onSetProjectId;
        this.onSetIsPlayerOnly = onSetIsPlayerOnly;
        this.onSetIsFullScreen = onSetIsFullScreen;
    }

    onhashchange () {

    }

    onpathchange () {

    }

    generateURL () {
        return '';
    }
}

class HashRouter extends Router {
    onhashchange () {
        return this.onSetProjectId(readHashProjectId() || defaultProjectId);
    }

    generateURL ({projectId}) {
        const hashQuery = location.hash.split('?')[1];
        return `${location.pathname}${location.search}#${projectId}${hashQuery ? `?${hashQuery}` : ''}`;
    }
}

class FileHashRouter extends HashRouter {
    constructor (callbacks) {
        super(callbacks);
        this.playerPath = location.pathname.substring(0, location.pathname.lastIndexOf('/') + 1);
        this.editorPath = `${this.playerPath}editor.html`;
        this.fullscreenPath = `${this.playerPath}fullscreen.html`;
    }

    onpathchange () {
        const pathName = location.pathname;

        if (pathName === this.playerPath) {
            this.onSetIsPlayerOnly(true);
            this.onSetIsFullScreen(false);
        } else if (pathName === this.editorPath) {
            this.onSetIsPlayerOnly(false);
            this.onSetIsFullScreen(false);
        } else if (pathName === this.fullscreenPath) {
            this.onSetIsFullScreen(true);
        }
    }

    generateURL ({projectId, isPlayerOnly, isFullScreen}) {
        let newPathname = '';
        let newHash = '';

        if (projectId !== '0') {
            newHash = projectId;
        }
        const hashQuery = location.hash.split('?')[1];
        if (hashQuery) {
            newHash += `?${hashQuery}`;
        }

        if (isFullScreen) {
            newPathname = this.fullscreenPath;
        } else if (isPlayerOnly) {
            newPathname = this.playerPath;
        } else {
            newPathname = this.editorPath;
        }

        return `${newPathname}${location.search}${newHash ? `#${newHash}` : ''}`;
    }
}

const getCanonicalLinkElement = () => {
    let el = document.querySelector('link[rel=canonical]');
    if (!el) {
        el = document.createElement('link');
        el.rel = 'canonical';
        document.head.appendChild(el);
    }
    return el;
};

class WildcardRouter extends Router {
    constructor (callbacks) {
        super(callbacks);
        this.root = process.env.ROOT;
    }

    async onhashchange () {
        const hashProjectId = readHashProjectId();
        if (hashProjectId) {
            const ok = await this.onSetProjectId(hashProjectId);
            if (ok) {
                // Completely remove the hash
                history.replaceState(null, null, `${location.pathname}${location.search}`);
            }
        } else {
            // Do not detect page type here as it is already setup by index.html, editor.html, etc.
            return this.parseURL(false);
        }
        return true;
    }

    onpathchange () {
        return this.parseURL(true);
    }

    async parseURL (detectPageType) {
        const path = location.pathname.substr(this.root.length);
        const parts = path.split('/');

        const parseProjectId = id => {
            if (id) {
                return this.onSetProjectId(id);
            }
            return this.onSetProjectId(defaultProjectId);
        };

        const parsePageType = type => {
            if (!detectPageType) {
                return;
            }
            if (type === 'fullscreen') {
                this.onSetIsFullScreen(true);
            } else if (type === 'editor') {
                this.onSetIsPlayerOnly(false);
                this.onSetIsFullScreen(false);
            } else {
                this.onSetIsPlayerOnly(true);
                this.onSetIsFullScreen(false);
            }
        };

        if (+parts[0] && Number.isFinite(+parts[0])) {
            if (!await parseProjectId(parts[0])) return false;
            parsePageType(parts[1]);
        } else {
            if (!await this.onSetProjectId(defaultProjectId)) return false;
            parsePageType(parts[0]);
        }
        return true;
    }

    generateURL ({projectId, isPlayerOnly, isFullScreen}) {
        const parts = [];

        if (projectId !== '0') {
            parts.push(projectId);
        }
        if (isFullScreen) {
            parts.push('fullscreen');
        } else if (!isPlayerOnly) {
            parts.push('editor');
        }

        const path = `${this.root}${parts.join('/')}`;
        const canonical = `${location.origin}${this.root}${projectId === '0' ? '' : projectId}`;
        getCanonicalLinkElement().href = canonical;

        return `${path}${location.search}${location.hash}`;
    }
}

const routers = {
    none: Router,
    hash: HashRouter,
    filehash: FileHashRouter,
    wildcard: WildcardRouter
};

/**
 * Return the optimal Router for the current environment
 * @param {string} style Routing style name
 * @param {*} callbacks Redux callbacks
 * @returns {Router} The optimal router for the current environment
 */
const createRouter = (style, callbacks) => {
    const supportedStyles = ['none', 'hash'];

    // FileHashRouter is not supported on non-http(s) protocols.
    const isHTTP = location.protocol === 'http:' || location.protocol === 'https:';
    if (isHTTP) {
        supportedStyles.push('filehash');
    }

    // WildcardRouter is not supported if ROOT is not set.
    if (process.env.ROOT) {
        supportedStyles.push('wildcard');
    }

    if (!supportedStyles.includes(style)) {
        log.warn(`routing style is unknown or not supported: ${style}, falling back to hash`);
        style = 'hash';
    }

    if (Object.prototype.hasOwnProperty.call(routers, style)) {
        return new routers[style](callbacks);
    }

    throw new Error(`unknown router: ${style}`);
};

const TWStateManager = function (WrappedComponent) {
    class StateManagerComponent extends React.Component {
        constructor (props) {
            super(props);
            bindAll(this, [
                'handleHashChange',
                'handlePopState',
                'onSetProjectId',
                'onSetIsPlayerOnly',
                'onSetIsFullScreen',
                'handleRoomCode',
                'handleParentIdentity'
            ]);
        }
        componentDidMount () {
            const urlParams = new URLSearchParams(location.search);

            initAppearanceSettings();
            initStyleSettings();
            initMenuBarLayout();

            if (urlParams.has('fps')) {
                const fps = parseNonNegativeURLNumber(urlParams.get('fps'));
                if (fps === null) {
                    log.warn('Ignoring invalid "fps" URL parameter');
                } else {
                    this.props.vm.setFramerate(fps);
                }
            } else if (urlParams.has('60fps')) {
                this.props.vm.setFramerate(60);
            }

            if (urlParams.has('interpolate')) {
                this.props.vm.setInterpolation(true);
            }

            if (urlParams.has('username')) {
                const username = urlParams.get('username');
                // Do not save username when loaded from URL
                this.doNotPersistUsername = username;
                this.props.onSetUsername(username);
            } else {
                const persistentUsername = this.props.isEmbedded ? null : getLocalStorage(USERNAME_KEY);
                if (persistentUsername === null) {
                    const randomUsername = generateRandomUsername();
                    this.props.onSetUsername(randomUsername);
                    if (this.props.isEmbedded) {
                        this.doNotPersistUsername = randomUsername;
                    }
                } else {
                    this.props.onSetUsername(persistentUsername);
                }
            }

            if (urlParams.has('hqpen') && this.props.vm && this.props.vm.renderer) {
                this.props.vm.renderer.setUseHighQualityRender(true);
            }

            if (urlParams.has('turbo') && this.props.vm) {
                this.props.vm.setTurboMode(true);
            }

            if (urlParams.has('stuck') || urlParams.has('warp_timer')) {
                if (this.props.vm) {
                    this.props.vm.setCompilerOptions({
                        warpTimer: true
                    });
                }
            }

            if (urlParams.has('nocompile')) {
                if (this.props.vm) {
                    this.props.vm.setCompilerOptions({
                        enabled: false
                    });
                }
            }

            if (urlParams.has('clones')) {
                if (this.props.vm) {
                    const clones = parseNonNegativeURLNumber(urlParams.get('clones'));
                    if (clones === null) {
                        log.warn('Ignoring invalid "clones" URL parameter');
                    } else {
                        this.props.vm.setRuntimeOptions({
                            maxClones: clones
                        });
                    }
                }
            }

            if (urlParams.has('offscreen')) {
                this.props.vm.setRuntimeOptions({
                    fencing: false
                });
            }

            if (urlParams.has('limitless')) {
                this.props.vm.setRuntimeOptions({
                    miscLimits: false
                });
            }

            for (const extension of urlParams.getAll('extension')) {
                this.props.vm.extensionManager.loadExtensionURL(extension);
            }

            // Handle room codes for automatic collaboration
            if (urlParams.has('room')) {
                const roomCode = urlParams.get('room');

                this.pendingRoomCode = roomCode;

                const currentUrl = new URL(location.href);
                currentUrl.searchParams.delete('room');
                currentUrl.searchParams.delete('username');
                history.replaceState(null, null, currentUrl.toString());

                if (this.props.username) {
                    this.handleRoomCode(roomCode);
                }
            }

            const routerCallbacks = {
                onSetProjectId: this.onSetProjectId,
                onSetIsPlayerOnly: this.onSetIsPlayerOnly,
                onSetIsFullScreen: this.onSetIsFullScreen
            };
            this.router = createRouter(this.props.routingStyle, routerCallbacks);
            this.router.onhashchange();
            window.addEventListener('hashchange', this.handleHashChange);
            window.addEventListener('popstate', this.handlePopState);
            if (this.props.isEmbedded) {
                window.addEventListener('message', this.handleParentIdentity);
            }
        }
        componentDidUpdate (prevProps) {
            if (this.props.username !== prevProps.username && this.props.username !== this.doNotPersistUsername) {
                // TODO: this always restores the current username once at startup, which is unnecessary
                setLocalStorage(USERNAME_KEY, this.props.username);

                // Check if we have a pending room code to handle now that username is available
                if (this.pendingRoomCode && this.props.username && !prevProps.username) {
                    this.handleRoomCode(this.pendingRoomCode);
                    this.pendingRoomCode = null; // Clear the pending room code
                }
            }

            // Signed-in users are known online by their Rotur handle, which never changes mid-session,
            // so only a guest's custom name gets pushed to the room.
            if (
                !this.props.roturUsername &&
                this.props.username !== prevProps.username &&
                this.props.username
            ) {
                try {
                    const service = CollaborationService.getInstance();
                    if (service && service.isConnectedToHostPeer()) {
                        service.changeUsername(this.props.username);
                    }
                } catch (error) {
                    console.warn('Could not sync username with collaboration service:', error);
                }
            }

            if (
                this.props.roturUsername !== prevProps.roturUsername ||
                this.props.usernameOverride !== prevProps.usernameOverride
            ) {
                this.applyRoturIdentity();
            }

            if (
                this.props.reduxProjectId !== prevProps.reduxProjectId ||
                this.props.isPlayerOnly !== prevProps.isPlayerOnly ||
                this.props.isFullScreen !== prevProps.isFullScreen
            ) {
                const oldPath = `${location.pathname}${location.search}${location.hash}`;
                const routerState = {
                    projectId: this.props.reduxProjectId,
                    isPlayerOnly: this.props.isPlayerOnly,
                    isFullScreen: this.props.isFullScreen
                };
                const newPath = this.router.generateURL(routerState);
                if (newPath && newPath !== oldPath) {
                    history.pushState(null, null, newPath);
                }
            }

            if (
                this.props.customStageSize !== prevProps.customStageSize ||
                this.props.runtimeOptions !== prevProps.runtimeOptions ||
                this.props.compilerOptions !== prevProps.compilerOptions ||
                this.props.highQualityPen !== prevProps.highQualityPen ||
                this.props.framerate !== prevProps.framerate ||
                this.props.interpolation !== prevProps.interpolation ||
                this.props.turbo !== prevProps.turbo
            ) {
                const searchParams = new URLSearchParams(location.search);
                const runtimeOptions = this.props.runtimeOptions;
                const compilerOptions = this.props.compilerOptions;

                // Always remove legacy parameter
                searchParams.delete('60fps');

                const {width, height} = this.props.customStageSize;
                if (width === defaultStageSize.width && height === defaultStageSize.height) {
                    searchParams.delete('size');
                } else {
                    searchParams.set('size', `${width}x${height}`);
                }

                if (this.props.framerate === 30) {
                    searchParams.delete('fps');
                } else {
                    searchParams.set('fps', this.props.framerate);
                }

                if (this.props.interpolation) {
                    searchParams.set('interpolate', '');
                } else {
                    searchParams.delete('interpolate');
                }

                if (this.props.turbo) {
                    searchParams.set('turbo', '');
                } else {
                    searchParams.delete('turbo');
                }

                if (this.props.highQualityPen) {
                    searchParams.set('hqpen', '');
                } else {
                    searchParams.delete('hqpen');
                }

                if (compilerOptions.enabled) {
                    searchParams.delete('nocompile');
                }

                if (this.props.isPlayerOnly) {
                    if (compilerOptions.warpTimer) {
                        searchParams.set('stuck', '');
                    } else {
                        searchParams.delete('stuck');
                    }
                } else {
                    // Leave ?stuck as-is when in editor
                }

                if (runtimeOptions.maxClones === 300) {
                    searchParams.delete('clones');
                } else {
                    searchParams.set('clones', runtimeOptions.maxClones);
                }

                if (runtimeOptions.fencing) {
                    searchParams.delete('offscreen');
                } else {
                    searchParams.set('offscreen', '');
                }

                if (runtimeOptions.miscLimits) {
                    searchParams.delete('limitless');
                } else {
                    searchParams.set('limitless', '');
                }

                setSearchParams(searchParams);
            }
        }
        componentWillUnmount () {
            window.removeEventListener('hashchange', this.handleHashChange);
            window.removeEventListener('popstate', this.handlePopState);
            window.removeEventListener('message', this.handleParentIdentity);
        }
        handleParentIdentity (event) {
            const data = event.data;
            if (!data || data.type !== 'mw:rotur-user' || event.source !== window.parent) return;
            const name = data.user && data.user.loggedIn ?
                (data.displayName || `@${data.user.username}`) :
                null;
            if (!name || name === this.props.username) return;
            this.doNotPersistUsername = name;
            this.props.onSetUsername(name);
        }
        handleHashChange () {
            this.router.onhashchange();
        }
        handlePopState () {
            this.router.onpathchange();
        }
        restoreCurrentRoute () {
            restoreRouterURL(this.router, {
                projectId: this.props.reduxProjectId,
                isPlayerOnly: this.props.isPlayerOnly,
                isFullScreen: this.props.isFullScreen
            });
        }
        async onSetProjectId (id) {
            if (`${id}` === `${this.props.reduxProjectId}`) {
                return true;
            }
            if (this.props.projectChanged) {
                const confirmed = await confirmProjectSwitch({
                    confirmWithMessage: this.props.confirmWithMessage,
                    openDialog: this.props.openSimpleDialog,
                    message: 'Your unsaved changes will be lost. Switch projects?'
                });
                if (!confirmed) {
                    this.restoreCurrentRoute();
                    return false;
                }
            }
            this.props.onSetProjectId(id);
            return true;
        }
        onSetIsPlayerOnly (isPlayerOnly) {
            this.props.onSetIsPlayerOnly(isPlayerOnly);
        }
        onSetIsFullScreen (isFullScreen) {
            this.props.onSetIsFullScreen(isFullScreen);
        }
        applyRoturIdentity () {
            if (this.props.roturUsername) {
                const name = this.props.usernameOverride || `@${this.props.roturUsername}`;
                this.doNotPersistUsername = name;
                this.props.onSetUsername(name);
                return;
            }
            const nickname = getLocalStorage(USERNAME_KEY);
            this.props.onSetUsername(nickname === null ? generateRandomUsername() : nickname);
        }
        handleRoomCode (roomCode) {
            const username = this.props.username;
            if (username && roomCode) {
                this.props.onSetCollaborationRoomId(roomCode);
                setTimeout(() => {
                    if (this.props.onOpenCollaborationModal) {
                        this.props.onOpenCollaborationModal();
                    }
                }, 300);
            } else {
                console.error(`[STATE MANAGER] Missing username (${username}) or roomCode (${roomCode})`);
            }
        }
        render () {
            const {
                /* eslint-disable no-unused-vars */
                customStageSize,
                isFullScreen,
                isPlayerOnly,
                isEmbedded,
                projectChanged,
                compilerOptions,
                runtimeOptions,
                highQualityPen,
                framerate,
                interpolation,
                turbo,
                onSetIsFullScreen,
                onSetIsPlayerOnly,
                onSetProjectId,
                onSetUsername,
                onSetCollaborationRoomId,
                onOpenCollaborationModal,
                reduxProjectId,
                routingStyle,
                username,
                roturUsername,
                usernameOverride,
                vm,
                /* eslint-enable no-unused-vars */
                ...props
            } = this.props;
            return (
                <WrappedComponent
                    {...props}
                />
            );
        }
    }
    StateManagerComponent.propTypes = {
        customStageSize: PropTypes.shape({
            width: PropTypes.number,
            height: PropTypes.number
        }),
        isFullScreen: PropTypes.bool,
        isPlayerOnly: PropTypes.bool,
        isEmbedded: PropTypes.bool,
        projectChanged: PropTypes.bool,
        projectId: PropTypes.string,
        compilerOptions: PropTypes.shape({
            enabled: PropTypes.bool,
            warpTimer: PropTypes.bool
        }),
        runtimeOptions: PropTypes.shape({
            miscLimits: PropTypes.bool,
            fencing: PropTypes.bool,
            maxClones: PropTypes.number
        }),
        highQualityPen: PropTypes.bool,
        framerate: PropTypes.number,
        interpolation: PropTypes.bool,
        turbo: PropTypes.bool,
        onSetIsFullScreen: PropTypes.func,
        onSetIsPlayerOnly: PropTypes.func,
        onSetProjectId: PropTypes.func,
        onSetUsername: PropTypes.func,
        roturUsername: PropTypes.string,
        usernameOverride: PropTypes.string,
        onSetCollaborationRoomId: PropTypes.func,
        onOpenCollaborationModal: PropTypes.func,
        openSimpleDialog: PropTypes.func.isRequired,
        confirmWithMessage: PropTypes.func,
        reduxProjectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        routingStyle: PropTypes.oneOf(Object.keys(routers)),
        username: PropTypes.string,
        vm: PropTypes.instanceOf(VM)
    };
    StateManagerComponent.defaultProps = {
        routingStyle: process.env.ROUTING_STYLE
    };
    const mapStateToProps = state => ({
        customStageSize: state.scratchGui.customStageSize,
        isFullScreen: state.scratchGui.mode.isFullScreen,
        isPlayerOnly: state.scratchGui.mode.isPlayerOnly,
        isEmbedded: state.scratchGui.mode.isEmbedded,
        projectChanged: state.scratchGui.projectChanged,
        reduxProjectId: state.scratchGui.projectState.projectId,
        compilerOptions: state.scratchGui.tw.compilerOptions,
        runtimeOptions: state.scratchGui.tw.runtimeOptions,
        highQualityPen: state.scratchGui.tw.highQualityPen,
        framerate: state.scratchGui.tw.framerate,
        interpolation: state.scratchGui.tw.interpolation,
        turbo: state.scratchGui.vmStatus.turbo,
        username: state.scratchGui.tw.username,
        roturUsername: state.scratchGui.rotur.username,
        usernameOverride: state.scratchGui.rotur.usernameOverride,
        vm: state.scratchGui.vm
    });
    const mapDispatchToProps = dispatch => ({
        onSetIsFullScreen: isFullScreen => dispatch(setFullScreen(isFullScreen)),
        onSetIsPlayerOnly: isPlayerOnly => dispatch(setPlayer(isPlayerOnly)),
        onSetProjectId: projectId => dispatch(setProjectId(projectId)),
        onSetUsername: username => dispatch(setUsername(username)),
        onSetCollaborationRoomId: roomId => dispatch(setCollaborationRoomId(roomId)),
        onOpenCollaborationModal: () => dispatch(openCollaborationModal()),
        openSimpleDialog: config => dispatch(openSimpleDialog(config))
    });
    return connect(
        mapStateToProps,
        mapDispatchToProps
    )(StateManagerComponent);
};

export {
    confirmProjectSwitch,
    parseNonNegativeURLNumber,
    restoreRouterURL,
    TWStateManager as default
};
