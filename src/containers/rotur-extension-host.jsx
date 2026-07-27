import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import bindAll from 'lodash.bindall';
import RoturConsentModal from '../components/mw-rotur-consent-modal/consent-modal.jsx';
import {
    hasFullGrant, commitGrant, grantedScopesFor, callRotur,
    activityAllowed, rememberActivityDecision, isActivityMethod
} from '../lib/rotur/extension-bridge.js';
import {getRoturSettings, setRoturSetting} from '../lib/rotur/settings.js';
import {isLoggedIn} from '../lib/rotur/client.js';
import {getState as getRoturIdentityState} from '../lib/rotur/identity.js';

// Attaches a Rotur "host" onto vm.runtime so builtin Rotur extensions can act as
// the logged-in user without ever seeing the token. The token stays inside the
// GUI's Rotur client (lib/rotur/client.js); this host only exposes identity,
// per-project consent, and gated calls. Mirrors tw-security-manager's modal-lock.
class RoturExtensionHost extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleAllowed', 'handleDenied', 'handleShareThis', 'handleShareAll', 'handleShareNo',
            'getUser', 'ensureConsent', 'ensureActivitySharing', 'call', 'getProjectId'
        ]);
        this.nextModalCallbacks = [];
        this.modalLocked = false;
        this.state = {type: null, data: null, callback: null, modalCount: 0};
    }

    componentDidMount () {
        this.props.vm.runtime.roturHost = {
            getUser: this.getUser,
            ensureConsent: this.ensureConsent,
            call: this.call,
            projectId: this.getProjectId,
            projectName: () => this.props.projectTitle || '',
            projectImage: () => {
                const id = this.getProjectId();
                return id ? `https://mwapi.mistium.com/thumbnails/${encodeURIComponent(id)}.png` : '';
            },
            grantedScopes: () => grantedScopesFor({name: this.props.vm.runtime.projectName || ''})
        };
    }

    componentWillUnmount () {
        if (this.props.vm.runtime.roturHost) {
            delete this.props.vm.runtime.roturHost;
            delete this.props.vm.runtime._roturHostResolved;
        }
    }

    async acquireModalLock () {
        if (this.modalLocked) {
            await new Promise(resolve => this.nextModalCallbacks.push(resolve));
        } else {
            this.modalLocked = true;
        }
        const releaseLock = () => {
            if (this.nextModalCallbacks.length) {
                this.nextModalCallbacks.shift()();
            } else {
                this.modalLocked = false;
                this.setState({type: null});
            }
        };
        const showModal = async (type, data) => {
            const result = await new Promise(resolve => {
                this.setState(old => ({
                    type,
                    data: data || {},
                    callback: resolve,
                    modalCount: old.modalCount + 1
                }));
            });
            releaseLock();
            return result;
        };
        return {showModal};
    }

    handleAllowed () {
        this.state.callback(true);
    }

    handleDenied () {
        this.state.callback(false);
    }

    handleShareThis () {
        this.state.callback('this');
    }

    handleShareAll () {
        this.state.callback('all');
    }

    handleShareNo () {
        this.state.callback('no');
    }

    activityKey () {
        return this.getProjectId() || `name:${this.props.projectTitle || ''}`;
    }

    async ensureActivitySharing () {
        const mode = getRoturSettings().activitySharing;
        const key = this.activityKey();
        const decision = activityAllowed(mode, key);
        if (decision !== null) {
            return decision;
        }
        if (this.props.vm.runtime._mwProjectTrusted === true) {
            return true;
        }
        const {showModal} = await this.acquireModalLock();
        const choice = await showModal('share', {
            username: this.currentUser().username,
            name: this.props.projectTitle
        });
        if (choice === 'all') {
            setRoturSetting('activitySharing', 'all');
            return true;
        }
        if (choice === 'this') {
            rememberActivityDecision(key, true);
            return true;
        }
        rememberActivityDecision(key, false);
        return false;
    }

    getProjectId () {
        try {
            return JSON.parse(sessionStorage.getItem('mw:mistwarp-current-project')).id || '';
        } catch (e) {
            return '';
        }
    }

    currentUser () {
        const user = getRoturIdentityState().user || {};
        return {
            loggedIn: isLoggedIn() || Boolean(this.props.username),
            username: user.username || this.props.username || '',
            id: (user.id === null || typeof user.id === 'undefined' ? '' : String(user.id)) ||
                this.props.id || ''
        };
    }

    getUser () {
        return this.currentUser();
    }

    async ensureConsent (scopes, meta) {
        if (!this.currentUser().loggedIn) {
            throw new Error('Log in to Rotur to let this project connect');
        }
        if (hasFullGrant(meta, scopes)) {
            return true;
        }
        if (this.props.vm.runtime._mwProjectTrusted === true) {
            await commitGrant(meta, scopes);
            return true;
        }
        const {showModal} = await this.acquireModalLock();
        const allowed = await showModal('consent', {
            scopes,
            username: this.currentUser().username,
            name: meta && meta.name
        });
        if (!allowed) {
            return false;
        }
        await commitGrant(meta, scopes);
        return true;
    }

    async call (method, args, opts) {
        if (isActivityMethod(method)) {
            const allowed = await this.ensureActivitySharing();
            if (!allowed) {
                return '';
            }
        }
        if (opts && opts.sensitive) {
            const {showModal} = await this.acquireModalLock();
            const confirmed = await showModal('confirm', {
                label: opts.label || method,
                username: this.currentUser().username
            });
            if (!confirmed) {
                throw new Error('You cancelled this Rotur action');
            }
        }
        return callRotur(method, args);
    }

    render () {
        if (this.state.type) {
            return (
                <RoturConsentModal
                    type={this.state.type}
                    data={this.state.data}
                    onAllowed={this.handleAllowed}
                    onDenied={this.handleDenied}
                    onShareThis={this.handleShareThis}
                    onShareAll={this.handleShareAll}
                    onShareNo={this.handleShareNo}
                    key={this.state.modalCount}
                />
            );
        }
        return null;
    }
}

RoturExtensionHost.propTypes = {
    vm: PropTypes.shape({
        runtime: PropTypes.object.isRequired
    }).isRequired,
    username: PropTypes.string,
    id: PropTypes.string,
    projectTitle: PropTypes.string
};

const mapStateToProps = state => ({
    vm: state.scratchGui.vm,
    username: state.scratchGui.rotur.username,
    id: state.scratchGui.rotur.id,
    projectTitle: state.scratchGui.projectTitle
});

export {
    RoturExtensionHost
};

export default connect(mapStateToProps)(RoturExtensionHost);
