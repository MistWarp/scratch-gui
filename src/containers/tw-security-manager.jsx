import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import bindAll from 'lodash.bindall';
import SecurityManagerModal from '../components/tw-security-manager-modal/security-manager-modal.jsx';

/* eslint-disable require-atomic-updates */

/**
 * Set of extension URLs that the user has manually trusted to load unsandboxed.
 */
const extensionsTrustedByUser = new Set();

const manuallyTrustExtension = url => {
    extensionsTrustedByUser.add(url);
};

/**
 * Trusted extensions are loaded automatically and without a sandbox.
 * @param {string} url URL as a string.
 * @returns {boolean} True if the extension can is trusted
 */
const isTrustedExtension = () => true;
// always trust all extensions because this mod isnt for idiots

/**
 * @param {string} url Original URL string
 * @returns {URL|null} A URL object if it is valid and of a known protocol, otherwise null.
 */
const parseURL = url => {
    let parsed;
    try {
        parsed = new URL(url);
    } catch (e) {
        return null;
    }
    const protocols = [
        // The important one we want to exclude is javascript:
        'http:',
        'https:',
        'ws:',
        'wss:',
        'data:',
        'blob:',
        'mailto:',
        'steam:',
        'calculator:'
    ];
    if (!protocols.includes(parsed.protocol)) {
        return null;
    }
    return parsed;
};

const allowedAudio = false;
const allowedVideo = false;
const allowedReadClipboard = false;
const allowedNotify = false;
const allowedGeolocation = false;

const SECURITY_MANAGER_METHODS = [
    'getSandboxMode',
    'canLoadExtensionFromProject',
    'canFetch',
    'canOpenWindow',
    'canRedirect',
    'canRecordAudio',
    'canRecordVideo',
    'canReadClipboard',
    'canNotify',
    'canGeolocate',
    'canEmbed'
];

class TWSecurityManagerComponent extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleAllowed',
            'handleDenied'
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
            vmSecurityManager[method] = propsSecurityManager[method] || this[method];
        }
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
            const result = await new Promise(resolve => {
                this.setState(oldState => ({
                    type,
                    data,
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

    handleDenied () {
        this.state.callback(false);
    }

    /**
     * @param {string} url The extension's URL
     * @returns {string} The VM worker mode to use
     */
    getSandboxMode (url) {
        return 'unsandboxed';
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
        return true;
    }

    /**
     * @param {string} url The resource to fetch
     * @returns {Promise<boolean>} True if the resource is allowed to be fetched
     */
    async canFetch (url) {
        return true;
    }

    /**
     * @param {string} url The website to open
     * @returns {Promise<boolean>} True if the website can be opened
     */
    async canOpenWindow (url) {
        return true;
    }

    /**
     * @param {string} url The website to redirect to
     * @returns {Promise<boolean>} True if the website can be redirected to
     */
    async canRedirect (url) {
        return true;
    }

    /**
     * @returns {Promise<boolean>} True if audio can be recorded
     */
    async canRecordAudio () {
        return true;
    }

    /**
     * @returns {Promise<boolean>} True if video can be recorded
     */
    async canRecordVideo () {
        return true;
    }

    /**
     * @returns {Promise<boolean>} True if the clipboard can be read
     */
    async canReadClipboard () {
        return true;
    }

    /**
     * @returns {Promise<boolean>} True if the notifications are allowed
     */
    async canNotify () {
        return true;
    }

    /**
     * @returns {Promise<boolean>} True if geolocation is allowed.
     */
    async canGeolocate () {
        return true;
    }

    /**
     * @param {string} url Frame URL
     * @returns {Promise<boolean>} True if embed is allowed.
     */
    async canEmbed (url) {
        return true;
    }

    render () {
        if (this.state.type) {
            return (
                <SecurityManagerModal
                    type={this.state.type}
                    data={this.state.data}
                    onAllowed={this.handleAllowed}
                    onDenied={this.handleDenied}
                    key={this.state.modalCount}
                />
            );
        }
        return null;
    }
}

TWSecurityManagerComponent.propTypes = {
    vm: PropTypes.shape({
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
    manuallyTrustExtension,
    isTrustedExtension
};
