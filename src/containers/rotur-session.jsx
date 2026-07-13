import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import bindAll from 'lodash.bindall';

import {
    restoreSession,
    login as roturLogin,
    logout as roturLogout,
    syncActivity,
    clearActivity
} from '../lib/rotur/client.js';
import {subscribeRoturSettings} from '../lib/rotur/settings.js';
import {onRoturLogin, onRoturLogout, getUsernameOverride} from '../lib/rotur/cloud-sync.js';
import {clearGitAuth} from '../lib/rotur/git-api.js';
import {setRoturSessionApi} from '../lib/rotur/session-api.js';
import {
    setRoturStatus,
    setRoturUser,
    setRoturUsernameOverride,
    setRoturError,
    clearRoturUser
} from '../reducers/rotur.js';
import {closeModal} from '../reducers/modals.js';
import {setTheme} from '../reducers/theme.js';
import {detectTheme, applyTheme} from '../lib/themes/themePersistance.js';
import {customThemeManager} from '../lib/themes/custom-themes.js';
import {applyLayout} from '../lib/mw-menu-bar-layout.js';
import {setShellUser} from '../lib/git/browser-terminal';
import describeActivity from '../lib/collaboration/describe-activity.js';
import {setProjectAuthor} from '../lib/mw-project-metadata.js';

/**
 * Headless container: restores Rotur session, exposes login/logout, and
 * keeps Rotur activity in sync with the project title.
 */
class RoturSession extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleLogin',
            'handleLogout',
            'syncCurrentActivity',
            'syncProjectAuthor',
            'handleSettingsChanged',
            'applyCloudPreferences'
        ]);
        this.unsubscribeSettings = null;
        this.editingSince = Date.now();
    }

    componentDidMount () {
        this.editingSince = Date.now();
        setShellUser({rotur: this.props.roturUsername});
        this.syncProjectAuthor();
        setRoturSessionApi({
            login: this.handleLogin,
            logout: this.handleLogout
        });
        this.unsubscribeSettings = subscribeRoturSettings(this.handleSettingsChanged);
        this.restore();
    }

    componentDidUpdate (prevProps) {
        if (this.props.roturUsername !== prevProps.roturUsername) {
            setShellUser({rotur: this.props.roturUsername});
        }
        if (
            this.props.roturUsername !== prevProps.roturUsername ||
            this.props.roturId !== prevProps.roturId
        ) {
            this.syncProjectAuthor();
        }
        if (
            this.props.loggedIn &&
            (
                this.props.projectTitle !== prevProps.projectTitle ||
                this.props.isCollaborating !== prevProps.isCollaborating ||
                this.props.activeTabIndex !== prevProps.activeTabIndex ||
                this.props.editingTargetId !== prevProps.editingTargetId ||
                !prevProps.loggedIn
            )
        ) {
            this.syncCurrentActivity();
        }
        if (prevProps.loggedIn && !this.props.loggedIn) {
            clearActivity();
        }
        if (!prevProps.loggedIn && this.props.loggedIn) {
            this.editingSince = Date.now();
        }
    }

    componentWillUnmount () {
        if (this.unsubscribeSettings) {
            this.unsubscribeSettings();
            this.unsubscribeSettings = null;
        }
        setRoturSessionApi(null);
    }

    handleSettingsChanged () {
        if (this.props.loggedIn) {
            this.syncCurrentActivity();
        }
    }

    async applyCloudPreferences () {
        try {
            const {applied} = await onRoturLogin();
            this.props.onSetUsernameOverride(getUsernameOverride());
            if (!applied) return;

            try {
                customThemeManager.themes.clear();
                customThemeManager.loadCustomThemes();
            } catch (e) {
                // eslint-disable-next-line no-console
                console.warn('[Rotur] Failed to reload custom themes', e);
            }
            try {
                const theme = detectTheme();
                this.props.onSetTheme(theme);
                applyTheme(theme);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.warn('[Rotur] Failed to re-apply theme from cloud', e);
            }
            try {
                applyLayout();
            } catch (_) {
                // ignore
            }
        } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('[Rotur] Cloud sync pull failed', e);
        }
    }

    async restore () {
        this.props.onSetStatus('restoring');
        try {
            const user = await restoreSession();
            if (user) {
                this.editingSince = Date.now();
                this.props.onSetUser(user);
                await this.applyCloudPreferences();
                this.syncCurrentActivity();
            } else {
                this.props.onClear();
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn('[Rotur] restore failed', error);
            this.props.onClear();
        }
    }

    /** Keep the byline on saved projects in step with who is signed in. */
    syncProjectAuthor () {
        setProjectAuthor(this.props.roturUsername ? {
            username: this.props.roturUsername,
            id: this.props.roturId
        } : null);
    }

    /**
     * What to publish as our Rotur presence right now.
     * @returns {object} The activity context.
     */
    currentActivityContext () {
        const vm = this.props.vm;
        const target = vm && vm.editingTarget;
        return {
            projectTitle: this.props.projectTitle,
            collaborating: this.props.isCollaborating,
            doing: describeActivity(vm, target ? {
                targetId: target.id,
                tab: this.props.activeTabIndex
            } : null),
            editingSince: this.editingSince
        };
    }

    syncCurrentActivity () {
        if (!this.props.loggedIn) return;
        syncActivity(this.currentActivityContext());
    }

    async handleLogin () {
        this.props.onSetStatus('logging-in');
        try {
            const user = await roturLogin();
            this.editingSince = Date.now();
            this.props.onSetUser(user);
            this.props.onCloseLoginModal();
            await this.applyCloudPreferences();
            this.syncCurrentActivity();
            return user;
        } catch (error) {
            const message = error && error.message ? error.message : String(error);
            const code = error && error.code;
            // Soft-cancel: user closed the popup or it timed out
            if (code === 'aborted' || code === 'timeout' || /abort|timeout|closed|popup/i.test(message)) {
                this.props.onSetStatus(this.props.loggedIn ? 'ready' : 'idle');
                return null;
            }
            this.props.onSetError(message);
            throw error;
        }
    }

    handleLogout () {
        onRoturLogout();
        clearGitAuth();
        roturLogout();
        this.props.onClear();
    }

    render () {
        return null;
    }
}

RoturSession.propTypes = {
    loggedIn: PropTypes.bool,
    projectTitle: PropTypes.string,
    isCollaborating: PropTypes.bool,
    activeTabIndex: PropTypes.number,
    editingTargetId: PropTypes.string,
    roturId: PropTypes.string,
    // eslint-disable-next-line react/forbid-prop-types
    vm: PropTypes.object,
    onSetStatus: PropTypes.func.isRequired,
    onSetUser: PropTypes.func.isRequired,
    onSetUsernameOverride: PropTypes.func.isRequired,
    onSetError: PropTypes.func.isRequired,
    onClear: PropTypes.func.isRequired,
    onCloseLoginModal: PropTypes.func.isRequired,
    onSetTheme: PropTypes.func.isRequired,
    roturUsername: PropTypes.string
};

const mapStateToProps = state => ({
    loggedIn: Boolean(state.scratchGui.rotur && state.scratchGui.rotur.username),
    projectTitle: state.scratchGui.projectTitle,
    roturUsername: (state.scratchGui.rotur && state.scratchGui.rotur.username) || null,
    roturId: (state.scratchGui.rotur && state.scratchGui.rotur.id) || null,
    isCollaborating: state.scratchGui.collaboration.isConnected,
    activeTabIndex: state.scratchGui.editorTab.activeTabIndex,
    editingTargetId: state.scratchGui.targets.editingTarget,
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    onSetStatus: status => dispatch(setRoturStatus(status)),
    onSetUser: user => dispatch(setRoturUser(user)),
    onSetUsernameOverride: username => dispatch(setRoturUsernameOverride(username)),
    onSetError: error => dispatch(setRoturError(error)),
    onClear: () => dispatch(clearRoturUser()),
    onCloseLoginModal: () => dispatch(closeModal('roturLoginModal')),
    onSetTheme: theme => dispatch(setTheme(theme))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(RoturSession);
