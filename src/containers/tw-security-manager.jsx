import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import bindAll from 'lodash.bindall';
import log from '../lib/utils/log.js';
import SecurityManagerModal from '../components/tw-security-manager-modal/security-manager-modal.jsx';
import SecurityModals from '../lib/constants/security-manager.js';
import {getPersistedUnsandboxed, setPersistedUnsandboxed} from '../lib/persistence/tw-unsandboxed.js';
import isTrustedExtensionUrl, {isGalleryExtensionUrl} from '../lib/trusted-extension.js';
import {getRememberedPlatformProjectState} from '../lib/community/publish.js';
import {extensionSourceUrl, hashExtensionUrl} from '../lib/community/api.js';
import {blockProjectPrompts, isProjectPromptBlocked} from '../lib/project-prompt-blocking.js';

/* eslint-disable require-atomic-updates */

/**
 * Set of extension URLs that the user has manually trusted to load unsandboxed.
 */
const extensionsTrustedByUser = new Set();

/**
 * Extension URLs discovered while loading the current platform project. Only these URLs may be
 * rewritten to the server's saved-source endpoint. Extensions added from the library or custom
 * extension modal do not exist in the saved project index yet and must load from their original URL.
 */
const platformProjectExtensionUrls = new Set();

const manuallyTrustExtension = url => {
    extensionsTrustedByUser.add(url);
};

const isPlatformProjectLoad = () => {
    try {
        const params = new URLSearchParams(location.search);
        return params.has('mw_assets') || params.has('platform_project') || /^#mw-/.test(location.hash);
    } catch (e) {
        return false;
    }
};

const isPlatformTrustedExtension = async url => {
    if (!isPlatformProjectLoad()) return false;
    const project = getRememberedPlatformProjectState();
    if (!project || !Array.isArray(project.trustedExtensions)) return false;
    return project.trustedExtensions.includes(await hashExtensionUrl(url));
};

/**
 * Trusted extensions are loaded automatically and without a sandbox.
 * @param {string} url URL as a string.
 * @returns {boolean} True if the extension can is trusted
 */
const isTrustedExtension = url => {
    const platformProject = isPlatformProjectLoad() && getRememberedPlatformProjectState();
    if (platformProject && Array.isArray(platformProject.trustedExtensions)) {
        return isGalleryExtensionUrl(url) || extensionsTrustedByUser.has(url);
    }
    return isTrustedExtensionUrl(url) || extensionsTrustedByUser.has(url);
};

const jsExecutionExtension = url => (/\/EvalPlus\.js$/i.test(url) ? 'EvalPlus' : null);

const isOwnedPlatformProject = () => {
    const project = getRememberedPlatformProjectState();
    return Boolean(isPlatformProjectLoad() && project && project.isOwner === true);
};

const isLocalProjectUrl = url => {
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol) &&
            ['127.0.0.1', 'localhost'].includes(parsed.hostname);
    } catch (e) {
        return false;
    }
};

const canTrustLoadedProject = vm => {
    const projectUrl = typeof location === 'undefined' ?
        null :
        new URLSearchParams(location.search).get('project_url');
    return isOwnedPlatformProject() || Boolean(vm._mwCanTrustProject) || isLocalProjectUrl(projectUrl);
};

const fetchHostsTrustedByUser = new Set();
const embedHostsTrustedByUser = new Set();

const isUntrustedPath = parsed => /^\/cdn-cgi\//i.test(parsed.pathname);

const isAlwaysTrustedForFetching = parsed => (
    isTrustedExtension(parsed.href) ||
    parsed.origin === 'https://turbowarp.org' ||
    parsed.origin.endsWith('.turbowarp.org') ||
    parsed.origin.endsWith('.turbowarp.xyz') ||
    parsed.origin === 'https://raw.githubusercontent.com' ||
    parsed.origin === 'https://gist.githubusercontent.com' ||
    parsed.origin === 'https://api.github.com' ||
    parsed.origin === 'https://gitlab.com' ||
    parsed.origin.endsWith('.srht.site') ||
    parsed.origin.endsWith('.itch.io') ||
    parsed.origin === 'https://api.gamejolt.com' ||
    parsed.origin === 'https://httpbin.org' ||
    parsed.origin === 'https://scratchdb.lefty.one'
);

const FETCHABLE_PROTOCOLS = ['http:', 'https:', 'data:', 'blob:', 'ws:', 'wss:'];
const VISITABLE_PROTOCOLS = ['http:', 'https:', 'data:', 'blob:', 'mailto:', 'steam:', 'calculator:'];

/**
 * @param {string} url Original URL string
 * @param {string[]} protocols Allowed protocols
 * @returns {URL|null} A URL object if it is valid and uses an allowed protocol, otherwise null.
 */
const parseURL = (url, protocols) => {
    let parsed;
    try {
        parsed = new URL(url);
    } catch (e) {
        return null;
    }
    if (!protocols.includes(parsed.protocol)) {
        return null;
    }
    return parsed;
};

let allowedAudio = false;
let allowedVideo = false;
let allowedReadClipboard = false;
let allowedNotify = false;
let allowedGeolocation = false;

const SECURITY_MANAGER_METHODS = [
    'getSandboxMode',
    'canLoadExtensionFromProject',
    'rewriteExtensionURL',
    'canFetch',
    'canOpenWindow',
    'canRedirect',
    'canRecordAudio',
    'canRecordVideo',
    'canReadClipboard',
    'canNotify',
    'canGeolocate',
    'canEmbed',
    'canDownload'
];

const withSecurityBypass = (method, implementation, allowAll) => (...args) => {
    if (method === 'rewriteExtensionURL') return implementation(...args);
    return allowAll() ? (method === 'getSandboxMode' ? 'unsandboxed' : true) : implementation(...args);
};

class TWSecurityManagerComponent extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleAllowed',
            'handleBlocked',
            'handleDenied',
            'handleLoadAll',
            'handleProjectLoading'
        ]);
        bindAll(this, SECURITY_MANAGER_METHODS);
        this.nextModalCallbacks = [];
        this.modalLocked = false;
        this.state = {
            type: null,
            data: null,
            callback: null,
            modalCount: 0
        };
    }

    componentDidMount () {
        const vmSecurityManager = this.props.vm.extensionManager.securityManager;
        const propsSecurityManager = this.props.securityManager;
        for (const method of SECURITY_MANAGER_METHODS) {
            vmSecurityManager[method] = withSecurityBypass(
                method,
                propsSecurityManager[method] || this[method],
                () => this.props.vm.runtime._mwProjectTrusted === true ||
                    (typeof window !== 'undefined' && window.__mwAllowAllSecurity === true)
            );
        }
        this.props.vm.on('LOAD_PROGRESS', this.handleProjectLoading);
    }

    componentWillUnmount () {
        this.props.vm.off('LOAD_PROGRESS', this.handleProjectLoading);
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     * @returns {Promise<() => Promise<boolean>>} Resolves with a function that you can call to show the modal.
     * The resolved function returns a promise that resolves with true if the request was approved.
     */
    async acquireModalLock () {
        // We need a two-step process for showing a modal so that we don't overwrite or overlap modals,
        // and so that multiple attempts to fetch resources from the same origin will all be allowed
        // with just one click. This means that some places have to wait until previous modals are
        // closed before it knows if it needs to display another modal.

        if (this.projectPromptsBlocked()) {
            return {
                showModal: () => Promise.resolve(false),
                releaseLock: () => {}
            };
        }

        if (this.modalLocked) {
            await new Promise(resolve => {
                this.nextModalCallbacks.push(resolve);
            });
        } else {
            this.modalLocked = true;
        }

        const releaseLock = () => {
            if (this.nextModalCallbacks.length) {
                const nextModalCallback = this.nextModalCallbacks.shift();
                nextModalCallback();
            } else {
                this.modalLocked = false;
                this.setState({
                    // only clear type in case other data needs to be accessed
                    type: null
                });
            }
        };

        const showModal = async (type, data) => {
            if (this.projectPromptsBlocked()) {
                releaseLock();
                return false;
            }
            const result = await new Promise(resolve => {
                this.setState(oldState => ({
                    type,
                    data: data || {},
                    callback: resolve,
                    modalCount: oldState.modalCount + 1
                }));
            });
            releaseLock();
            return result;
        };

        return {
            showModal,
            releaseLock
        };
    }

    handleAllowed () {
        this.state.callback(true);
    }

    handleBlocked () {
        blockProjectPrompts({name: this.props.vm.runtime.projectName || ''});
        this.state.callback(false);
    }

    handleDenied () {
        this.state.callback(false);
    }

    handleLoadAll () {
        this.props.vm.runtime._mwProjectTrusted = true;
        this.state.callback(true);
    }

    handleProjectLoading ({stage}) {
        if (stage !== 'building') return;
        this.props.vm.runtime._mwProjectTrusted = false;
        extensionsTrustedByUser.clear();
        platformProjectExtensionUrls.clear();
        fetchHostsTrustedByUser.clear();
        embedHostsTrustedByUser.clear();
        allowedAudio = false;
        allowedVideo = false;
        allowedReadClipboard = false;
        allowedNotify = false;
        allowedGeolocation = false;
    }

    projectPromptsBlocked () {
        return isProjectPromptBlocked({name: this.props.vm.runtime.projectName || ''});
    }

    /**
     * @param {string} url The extension's URL
     * @returns {string} The VM worker mode to use
     */
    async getSandboxMode (url) {
        if (await isPlatformTrustedExtension(url) || isTrustedExtension(url)) {
            log.info(`Loading extension ${url} unsandboxed`);
            return 'unsandboxed';
        }
        return 'iframe';
    }

    async rewriteExtensionURL (url) {
        const project = isPlatformProjectLoad() && getRememberedPlatformProjectState();
        if (
            project &&
            project.id &&
            project.projectJsonUrl &&
            platformProjectExtensionUrls.has(url) &&
            !isGalleryExtensionUrl(url)
        ) {
            const rewritten = await extensionSourceUrl(project, url);
            return rewritten;
        }
        return url;
    }

    handleChangeUnsandboxed (e) {
        const checked = e.target.checked;
        this.setState(oldState => ({
            data: {
                ...oldState.data,
                unsandboxed: checked
            }
        }));
    }

    /**
     * @param {string} url The extension's URL
     * @returns {Promise<boolean>} Whether the extension can be loaded
     */
    async canLoadExtensionFromProject (url) {
        const allowProjectExtension = () => {
            if (isPlatformProjectLoad()) {
                platformProjectExtensionUrls.add(url);
            }
            return true;
        };
        const dangerousJs = jsExecutionExtension(url);
        if (await isPlatformTrustedExtension(url)) {
            log.info(`Loading extension ${url} automatically`);
            return allowProjectExtension();
        }
        if (!dangerousJs && isTrustedExtension(url)) {
            log.info(`Loading extension ${url} automatically`);
            return allowProjectExtension();
        }
        if (url === 'builtin:patching' || dangerousJs) {
            const {showModal} = await this.acquireModalLock();
            const allowed = await showModal(SecurityModals.LoadExtension, {
                url,
                dangerousBuiltin: !dangerousJs,
                dangerousJs,
                unsandboxed: true
            });
            return allowed ? allowProjectExtension() : false;
        }
        if (this.props.vm.runtime._mwProjectTrusted === true) return allowProjectExtension();
        const {showModal} = await this.acquireModalLock();
        let unsandboxed = getPersistedUnsandboxed();
        const allowed = await showModal(SecurityModals.LoadExtension, {
            url,
            unsandboxed,
            onChangeUnsandboxed: e => {
                unsandboxed = e.target.checked;
                this.handleChangeUnsandboxed(e);
            }
        });
        if (!allowed) return false;

        if (this.props.vm.runtime._mwProjectTrusted === true) {
            return allowProjectExtension();
        }

        setPersistedUnsandboxed(unsandboxed);
        if (unsandboxed) {
            manuallyTrustExtension(url);
        }
        return allowProjectExtension();
    }

    /**
     * @param {string} url The resource to fetch
     * @returns {Promise<boolean>} True if the resource is allowed to be fetched
     */
    async canFetch (url) {
        const parsed = parseURL(url, FETCHABLE_PROTOCOLS);
        if (!parsed) return false;
        if (isAlwaysTrustedForFetching(parsed)) return !isUntrustedPath(parsed);
        const {showModal, releaseLock} = await this.acquireModalLock();
        const host = ['http:', 'https:', 'ws:', 'wss:'].includes(parsed.protocol) ? parsed.host : null;
        if (host && fetchHostsTrustedByUser.has(host)) {
            releaseLock();
            return true;
        }
        const allowed = await showModal(SecurityModals.Fetch, {url});
        if (host && allowed) fetchHostsTrustedByUser.add(host);
        return allowed;
    }

    /**
     * @param {string} url The website to open
     * @returns {Promise<boolean>} True if the website can be opened
     */
    async canOpenWindow (url) {
        if (!parseURL(url, VISITABLE_PROTOCOLS)) return false;
        const {showModal} = await this.acquireModalLock();
        return showModal(SecurityModals.OpenWindow, {url});
    }

    /**
     * @param {string} url The website to redirect to
     * @returns {Promise<boolean>} True if the website can be redirected to
     */
    async canRedirect (url) {
        if (!parseURL(url, VISITABLE_PROTOCOLS)) return false;
        const {showModal} = await this.acquireModalLock();
        return showModal(SecurityModals.Redirect, {url});
    }

    /**
     * @returns {Promise<boolean>} True if audio can be recorded
     */
    async canRecordAudio () {
        if (!allowedAudio) {
            const {showModal} = await this.acquireModalLock();
            allowedAudio = await showModal(SecurityModals.RecordAudio);
        }
        return allowedAudio;
    }

    /**
     * @returns {Promise<boolean>} True if video can be recorded
     */
    async canRecordVideo () {
        if (!allowedVideo) {
            const {showModal} = await this.acquireModalLock();
            allowedVideo = await showModal(SecurityModals.RecordVideo);
        }
        return allowedVideo;
    }

    /**
     * @returns {Promise<boolean>} True if the clipboard can be read
     */
    async canReadClipboard () {
        if (!allowedReadClipboard) {
            const {showModal} = await this.acquireModalLock();
            allowedReadClipboard = await showModal(SecurityModals.ReadClipboard);
        }
        return allowedReadClipboard;
    }

    /**
     * @returns {Promise<boolean>} True if the notifications are allowed
     */
    async canNotify () {
        if (!allowedNotify) {
            const {showModal} = await this.acquireModalLock();
            allowedNotify = await showModal(SecurityModals.Notify);
        }
        return allowedNotify;
    }

    /**
     * @returns {Promise<boolean>} True if geolocation is allowed.
     */
    async canGeolocate () {
        if (!allowedGeolocation) {
            const {showModal} = await this.acquireModalLock();
            allowedGeolocation = await showModal(SecurityModals.Geolocate);
        }
        return allowedGeolocation;
    }

    /**
     * @param {string} url Frame URL
     * @returns {Promise<boolean>} True if embed is allowed.
     */
    async canEmbed (url) {
        const parsed = parseURL(url, FETCHABLE_PROTOCOLS);
        if (!parsed) return false;
        const host = ['http:', 'https:'].includes(parsed.protocol) ? parsed.host : null;
        const {showModal, releaseLock} = await this.acquireModalLock();
        if (host && embedHostsTrustedByUser.has(host)) {
            releaseLock();
            return true;
        }
        const allowed = await showModal(SecurityModals.Embed, {url});
        if (host && allowed) embedHostsTrustedByUser.add(host);
        return allowed;
    }

    /**
     * @param {string} url URL to download
     * @param {string} name Download filename
     * @returns {Promise<boolean>} Whether the download is allowed
     */
    async canDownload (url, name) {
        if (!parseURL(url, FETCHABLE_PROTOCOLS)) return false;
        const {showModal} = await this.acquireModalLock();
        return showModal(SecurityModals.Download, {url, name});
    }

    render () {
        if (this.state.type) {
            return (
                <SecurityManagerModal
                    type={this.state.type}
                    data={this.state.data}
                    showLoadAll={canTrustLoadedProject(this.props.vm)}
                    onAllowed={this.handleAllowed}
                    onBlocked={this.handleBlocked}
                    onDenied={this.handleDenied}
                    onLoadAll={this.handleLoadAll}
                    key={this.state.modalCount}
                />
            );
        }
        return null;
    }
}

TWSecurityManagerComponent.propTypes = {
    vm: PropTypes.shape({
        on: PropTypes.func.isRequired,
        off: PropTypes.func.isRequired,
        runtime: PropTypes.shape({
            on: PropTypes.func.isRequired,
            off: PropTypes.func.isRequired,
            _mwProjectTrusted: PropTypes.bool,
            projectName: PropTypes.string
        }).isRequired,
        extensionManager: PropTypes.shape({
            securityManager: PropTypes.shape(
                SECURITY_MANAGER_METHODS.reduce((obj, method) => {
                    obj[method] = PropTypes.func.isRequired;
                    return obj;
                }, {})
            ).isRequired
        }).isRequired
    }).isRequired,
    securityManager: PropTypes.shape(Object.fromEntries(SECURITY_MANAGER_METHODS.map(i => [i, PropTypes.func])))
};

TWSecurityManagerComponent.defaultProps = {
    securityManager: {}
};

const mapStateToProps = state => ({
    vm: state.scratchGui.vm
});

const mapDispatchToProps = () => ({});

const ConnectedSecurityManagerComponent = connect(
    mapStateToProps,
    mapDispatchToProps
)(TWSecurityManagerComponent);

export {
    ConnectedSecurityManagerComponent as default,
    TWSecurityManagerComponent,
    manuallyTrustExtension,
    isTrustedExtension,
    isPlatformTrustedExtension,
    isOwnedPlatformProject,
    isLocalProjectUrl,
    canTrustLoadedProject
};
