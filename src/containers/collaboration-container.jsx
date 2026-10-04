import React, {Component} from 'react';
import {getIsShowingProject} from '../reducers/project-state.js';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import CollaborationModal from '../components/collaboration-modal/collaboration-modal.jsx';
import ProjectSession from '../components/collaboration-modal/project-session.jsx';
import CollaborationService from '../lib/collaboration/index.js';
import NotificationSystem from '../lib/notification-manager.js';
import {formatCollabError, isRetryableCollabError} from '../lib/collaboration/describe-error.js';
import {setGitModalInitialView} from '../lib/git/modal-view.js';

import {
    setProjectPresence,
    openCollaborationModal,
    closeCollaborationModal,
    setCollaborationConnected,
    setCollaborationUsers,
    setCollaborationError,
    setCollaborationRoomId,
    setCollaborationRoomPrivacy,
    setCollaborationInvite,
    setCollaborationLoading,
    setCollaborationHostLoadingProgress,
    setCollaborationReconnecting,
    setUserActivity,
    removeUserActivity
} from '../reducers/collaboration';

import {
    setUsername
} from '../reducers/tw';

import {
    openSimpleDialog,
    openUsernameModal,
    openGitModal
} from '../reducers/modals';

/* eslint-disable max-len */
const messages = defineMessages({
    joinConfirmTitle: {
        defaultMessage: 'Join the live session?',
        description: 'Title of the dialog confirming that joining a live collaboration session replaces the open project',
        id: 'mw.collaboration.joinConfirmTitle'
    },
    joinConfirmMessage: {
        defaultMessage: 'The host\'s project will replace the one you have open. A device backup of your current project is saved first. This project stops saving to MistWarp until you leave the session.',
        description: 'Message of the dialog confirming that joining a live collaboration room replaces the open project',
        id: 'mw.collaboration.joinConfirmMessage'
    },
    joinConfirmMessageProject: {
        defaultMessage: 'The host\'s project will replace the one you have open. A device backup of your current project is saved first. Your edits can be saved to this MistWarp project.',
        description: 'Message of the dialog confirming that joining a live session of a MistWarp project replaces the open project',
        id: 'mw.collaboration.joinConfirmMessageProject'
    },
    joinConfirmButton: {
        defaultMessage: 'Join',
        description: 'Button confirming that the user wants to join a live collaboration session',
        id: 'mw.collaboration.joinConfirmButton'
    },
    joinCancelled: {
        defaultMessage: 'Joining was cancelled. Your project is unchanged.',
        description: 'Shown when the user chose not to join a live collaboration session',
        id: 'mw.collaboration.joinCancelled'
    },
    userLeft: {
        defaultMessage: '{name} left the live session.',
        description: 'Notification when a collaborator leaves. {name} is their name.',
        id: 'mw.collaboration.userLeft'
    },
    someoneLeft: {
        defaultMessage: 'Someone left the live session.',
        description: 'Notification when a collaborator whose name is unknown leaves',
        id: 'mw.collaboration.someoneLeft'
    },
    kicked: {
        defaultMessage: 'The host removed you from the room. Your copy of the project is still here.',
        description: 'Shown to a collaborator the host removed from the live session',
        id: 'mw.collaboration.kicked'
    },
    youLeft: {
        defaultMessage: 'You left the live session.',
        description: 'Notification after leaving a live collaboration session',
        id: 'mw.collaboration.youLeft'
    },
    joinRequest: {
        defaultMessage: '{name} wants to join your live session.',
        description: 'Notification for the host when someone asks to join. {name} is their name.',
        id: 'mw.collaboration.joinRequest'
    },
    joinRequestUnnamed: {
        defaultMessage: 'Someone wants to join your live session.',
        description: 'Notification for the host when someone whose name is unknown asks to join',
        id: 'mw.collaboration.joinRequestUnnamed'
    },
    letThemIn: {
        defaultMessage: 'Let them in',
        description: 'Button in the join request notification that lets the person into the live session',
        id: 'mw.collaboration.letThemIn'
    },
    openLiveCollaboration: {
        defaultMessage: 'Open Live Collaboration',
        description: 'Button in the join request notification that opens the Live Collaboration window',
        id: 'mw.collaboration.openLiveCollaboration'
    },
    approveFailed: {
        defaultMessage: 'Could not let them in. Open Live Collaboration to try again.',
        description: 'Error when approving a request to join the live session failed',
        id: 'mw.collaboration.approveFailed'
    },
    denyFailed: {
        defaultMessage: 'Could not deny the request to join.',
        description: 'Error when denying a request to join the live session failed',
        id: 'mw.collaboration.denyFailed'
    },
    joinDenied: {
        defaultMessage: 'The host did not let you in.',
        description: 'Shown when the host denied a request to join the live session',
        id: 'mw.collaboration.joinDenied'
    },
    nowEditing: {
        defaultMessage: 'The host let you edit. Your changes now reach everyone.',
        description: 'Notification when the host lets a collaborator edit',
        id: 'mw.collaboration.nowEditing'
    },
    nowWatching: {
        defaultMessage: 'The host set you to watch. You can follow along, but your changes will not be kept.',
        description: 'Notification when the host makes a collaborator watch only',
        id: 'mw.collaboration.nowWatching'
    },
    downloadGaveUp: {
        defaultMessage: 'The host\'s project could not be downloaded. Leave the live session and join again to retry.',
        description: 'Error when downloading the host\'s project kept failing',
        id: 'mw.collaboration.downloadGaveUp'
    },
    hostRestarted: {
        defaultMessage: 'The host reopened the live session, so their project is loading again.',
        description: 'Notification when the host reloaded and their project is being downloaded again',
        id: 'mw.collaboration.hostRestarted'
    },
    leftForOtherProject: {
        defaultMessage: 'You opened another project, so you left the live session.',
        description: 'Notification when opening another project ended the live session',
        id: 'mw.collaboration.leftForOtherProject'
    },
    extensionsSkipped: {
        defaultMessage: 'These extensions from the host were not loaded: {extensions}. Blocks that use them will not work for you.',
        description: 'Warning when extensions of the host\'s project were not loaded. {extensions} lists their IDs.',
        id: 'mw.collaboration.extensionsSkipped'
    },
    snapshotUploadFailed: {
        defaultMessage: 'The project could not be sent to {name}. They will try again automatically.',
        description: 'Warning for the host when their project could not be sent to someone joining. {name} is their name.',
        id: 'mw.collaboration.snapshotUploadFailed'
    },
    snapshotUploadFailedUnnamed: {
        defaultMessage: 'The project could not be sent to someone joining. They will try again automatically.',
        description: 'Warning for the host when their project could not be sent to someone joining whose name is unknown',
        id: 'mw.collaboration.snapshotUploadFailedUnnamed'
    },
    brokerBack: {
        defaultMessage: 'New people can join the room again.',
        description: 'Notification for the host when the collaboration server is reachable again',
        id: 'mw.collaboration.brokerBack'
    },
    brokerLostRelayed: {
        defaultMessage: 'Lost the collaboration server. Anyone connected through it will rejoin when it is back.',
        description: 'Warning for the host when the collaboration server is lost and some guests depended on it',
        id: 'mw.collaboration.brokerLostRelayed'
    },
    brokerLost: {
        defaultMessage: 'New people cannot join right now. Everyone already in the room can keep editing.',
        description: 'Warning for the host when the collaboration server is lost',
        id: 'mw.collaboration.brokerLost'
    },
    reconnected: {
        defaultMessage: 'Reconnected to the live session.',
        description: 'Notification when the connection to the live session is back',
        id: 'mw.collaboration.reconnected'
    }
});
/* eslint-enable max-len */

const MAX_ATTACH_ATTEMPTS = 20;
const BROKER_OFFLINE_NOTICE_DELAY_MS = 5000;
// After a failed project download the snapshot service retries on its own;
// if nothing more is heard by then, stop covering the editor.
const SYNC_RETRY_GIVE_UP_MS = 30000;

class CollaborationContainer extends Component {
    constructor (props) {
        super(props);

        this.collaborationService = CollaborationService.getInstance();
        this.state = {
            inviteLink: null,
            inviteRole: null,
            myRole: null,
            // The last join/host can be tried again with the same settings.
            canRetry: false,
            // Creating a room whose id the broker still holds from our
            // previous page (e.g. after a reload).
            reclaimingRoom: false
        };
        // How the last room join/host was started, for "Try again".
        this.lastConnect = null;
        // Join request notifications by requester, so answering a request
        // anywhere removes its notification.
        this.joinRequestNotices = new Map();

        this.handleJoinRoom = this.handleJoinRoom.bind(this);
        this.handleCreateRoom = this.handleCreateRoom.bind(this);
        this.handleLeaveRoom = this.handleLeaveRoom.bind(this);
        this.handleKickUser = this.handleKickUser.bind(this);
        this.handleChangeUsername = this.handleChangeUsername.bind(this);
        this.handleUserJoined = this.handleUserJoined.bind(this);
        this.handleUserLeft = this.handleUserLeft.bind(this);
        this.handleUsernameChanged = this.handleUsernameChanged.bind(this);
        this.handleKickedFromRoom = this.handleKickedFromRoom.bind(this);
        this.handleHostLeft = this.handleHostLeft.bind(this);
        this.handleConnectedToHost = this.handleConnectedToHost.bind(this);
        this.handleDisconnected = this.handleDisconnected.bind(this);
        this.handleUsersUpdated = this.handleUsersUpdated.bind(this);
        this.handleConnectionFailed = this.handleConnectionFailed.bind(this);
        this.handleCancelConnection = this.handleCancelConnection.bind(this);
        this.handleApproveJoinRequest = this.handleApproveJoinRequest.bind(this);
        this.handleDenyJoinRequest = this.handleDenyJoinRequest.bind(this);
        this.handleCancelJoinRequest = this.handleCancelJoinRequest.bind(this);
        this.handleJoinRequestReceived = this.handleJoinRequestReceived.bind(this);
        this.handleJoinRequestCancelled = this.handleJoinRequestCancelled.bind(this);
        this.handleJoinApproved = this.handleJoinApproved.bind(this);
        this.handleJoinDenied = this.handleJoinDenied.bind(this);
        this.handleRoomPrivacyChanged = this.handleRoomPrivacyChanged.bind(this);
        this.handleWorkspaceReattach = this.handleWorkspaceReattach.bind(this);
        this.handleProjectSyncDownloadStart = this.handleProjectSyncDownloadStart.bind(this);
        this.handleProjectSyncDownloadProgress = this.handleProjectSyncDownloadProgress.bind(this);
        this.handleProjectSyncDownloadComplete = this.handleProjectSyncDownloadComplete.bind(this);
        this.handleProjectSyncApplyStart = this.handleProjectSyncApplyStart.bind(this);
        this.handleProjectSyncApplyComplete = this.handleProjectSyncApplyComplete.bind(this);
        this.handleProjectSyncDownloadError = this.handleProjectSyncDownloadError.bind(this);
        this.handleHostRestarted = this.handleHostRestarted.bind(this);
        this.handleLeftForOtherProject = this.handleLeftForOtherProject.bind(this);
        this.handleExtensionsSkipped = this.handleExtensionsSkipped.bind(this);
        this.handleSnapshotUploadFailed = this.handleSnapshotUploadFailed.bind(this);
        this.handleBrokerStatus = this.handleBrokerStatus.bind(this);
        this.handleRoleChanged = this.handleRoleChanged.bind(this);
        this.handleChangeInviteRole = this.handleChangeInviteRole.bind(this);
        this.handleChangeUserRole = this.handleChangeUserRole.bind(this);
        this.syncSessionInfo = this.syncSessionInfo.bind(this);
        this.handlePresenceEditingChanged = this.handlePresenceEditingChanged.bind(this);
        this.handleReconnecting = this.handleReconnecting.bind(this);
        this.handleReconnected = this.handleReconnected.bind(this);
        this.handleHostIdTaken = this.handleHostIdTaken.bind(this);
        this.handleRetry = this.handleRetry.bind(this);
    }

    componentDidMount () {
        const params = new URLSearchParams(window.location.search);
        if (params.get('branches') === '1') this.props.onOpenBranches();
        else if (params.get('collaborate') === '1') this.props.onOpen();
        // Initialize collaboration service with VM
        if (this.props.vm) {
            this.collaborationService.init(this.props.vm);
        }

        // Set up event listeners
        this.collaborationService.on('user-joined', this.handleUserJoined);
        this.collaborationService.on('user-left', this.handleUserLeft);
        this.collaborationService.on('users-updated', this.handleUsersUpdated);
        this.collaborationService.on('username-changed', this.handleUsernameChanged);
        this.collaborationService.on('kicked-from-room', this.handleKickedFromRoom);
        this.collaborationService.on('host-left', this.handleHostLeft);
        this.collaborationService.on('connected-to-host', this.handleConnectedToHost);
        this.collaborationService.on('disconnected', this.handleDisconnected);
        this.collaborationService.on('connection-failed', this.handleConnectionFailed);
        this.collaborationService.on('join-request-received', this.handleJoinRequestReceived);
        this.collaborationService.on('join-request-cancelled', this.handleJoinRequestCancelled);
        this.collaborationService.on('join-approved', this.handleJoinApproved);
        this.collaborationService.on('join-denied', this.handleJoinDenied);
        this.collaborationService.on('room-privacy-changed', this.handleRoomPrivacyChanged);
        this.collaborationService.on('request-workspace-reattach', this.handleWorkspaceReattach);
        this.collaborationService.on('project-sync-download-start', this.handleProjectSyncDownloadStart);
        this.collaborationService.on('project-sync-download-progress', this.handleProjectSyncDownloadProgress);
        this.collaborationService.on('project-sync-download-complete', this.handleProjectSyncDownloadComplete);
        this.collaborationService.on('project-sync-apply-start', this.handleProjectSyncApplyStart);
        this.collaborationService.on('project-sync-apply-complete', this.handleProjectSyncApplyComplete);
        this.collaborationService.on('project-sync-download-error', this.handleProjectSyncDownloadError);
        this.collaborationService.on('host-restarted', this.handleHostRestarted);
        this.collaborationService.on('left-for-other-project', this.handleLeftForOtherProject);
        this.collaborationService.on('extensions-skipped', this.handleExtensionsSkipped);
        this.collaborationService.on('snapshot-upload-failed', this.handleSnapshotUploadFailed);
        this.collaborationService.on('broker-status', this.handleBrokerStatus);
        this.collaborationService.on('role-changed', this.handleRoleChanged);
        this.collaborationService.on('invite-changed', this.syncSessionInfo);
        this.collaborationService.on('presence-editing-changed', this.handlePresenceEditingChanged);
        this.collaborationService.on('reconnecting', this.handleReconnecting);
        this.collaborationService.on('reconnected', this.handleReconnected);
        this.collaborationService.on('host-id-taken', this.handleHostIdTaken);

        this._onEditError = ({error}) => NotificationSystem.error(error, 5000);
        this.collaborationService.on('edit-error', this._onEditError);
        this.projectSyncProgress = 0;
        this.projectSyncLoadingBar = null;
    }

    componentDidUpdate (prevProps) {
        // The window lists join requests itself.
        if (this.props.isVisible && !prevProps.isVisible) this.dismissJoinRequestNotices();
        // The tabs are the one piece of our activity this container owns; the
        // sprite and the costume/sound index are reported by their own panes.
        if (this.props.activeTabIndex !== prevProps.activeTabIndex) {
            this.collaborationService.setActivity({tab: this.props.activeTabIndex});
        }
    }

    componentWillUnmount () {
        this.collaborationService.off('edit-error', this._onEditError);
        // Clean up event listeners
        this.collaborationService.off('user-joined', this.handleUserJoined);
        this.collaborationService.off('user-left', this.handleUserLeft);
        this.collaborationService.off('users-updated', this.handleUsersUpdated);
        this.collaborationService.off('username-changed', this.handleUsernameChanged);
        this.collaborationService.off('kicked-from-room', this.handleKickedFromRoom);
        this.collaborationService.off('host-left', this.handleHostLeft);
        this.collaborationService.off('connected-to-host', this.handleConnectedToHost);
        this.collaborationService.off('disconnected', this.handleDisconnected);
        this.collaborationService.off('connection-failed', this.handleConnectionFailed);
        this.collaborationService.off('join-request-received', this.handleJoinRequestReceived);
        this.collaborationService.off('join-request-cancelled', this.handleJoinRequestCancelled);
        this.collaborationService.off('join-approved', this.handleJoinApproved);
        this.collaborationService.off('join-denied', this.handleJoinDenied);
        this.collaborationService.off('room-privacy-changed', this.handleRoomPrivacyChanged);
        this.collaborationService.off('request-workspace-reattach', this.handleWorkspaceReattach);
        this.collaborationService.off('project-sync-download-start', this.handleProjectSyncDownloadStart);
        this.collaborationService.off('project-sync-download-progress', this.handleProjectSyncDownloadProgress);
        this.collaborationService.off('project-sync-download-complete', this.handleProjectSyncDownloadComplete);
        this.collaborationService.off('project-sync-apply-start', this.handleProjectSyncApplyStart);
        this.collaborationService.off('project-sync-apply-complete', this.handleProjectSyncApplyComplete);
        this.collaborationService.off('project-sync-download-error', this.handleProjectSyncDownloadError);
        this.collaborationService.off('host-restarted', this.handleHostRestarted);
        this.collaborationService.off('left-for-other-project', this.handleLeftForOtherProject);
        this.collaborationService.off('extensions-skipped', this.handleExtensionsSkipped);
        this.collaborationService.off('snapshot-upload-failed', this.handleSnapshotUploadFailed);
        this.collaborationService.off('broker-status', this.handleBrokerStatus);
        this.collaborationService.off('role-changed', this.handleRoleChanged);
        this.collaborationService.off('invite-changed', this.syncSessionInfo);
        this.collaborationService.off('presence-editing-changed', this.handlePresenceEditingChanged);
        this.collaborationService.off('reconnecting', this.handleReconnecting);
        this.collaborationService.off('reconnected', this.handleReconnected);
        this.collaborationService.off('host-id-taken', this.handleHostIdTaken);

        if (this.attachTimeout) {
            clearTimeout(this.attachTimeout);
            this.attachTimeout = null;
        }
        clearTimeout(this.brokerOfflineTimer);
        clearTimeout(this.syncRetryTimer);
        this.dismissJoinRequestNotices();
        // The notification manager is app-wide; its other subscribers (the
        // toast renderer) must keep working after this container goes away.

        // Disconnect if connected
        if (this.collaborationService.isConnected) {
            this.collaborationService.disconnect();
        }
    }

    async handleJoinRoom (roomId, username, scope = null, options = {}) {
        // A retry repeats a join the user already agreed to.
        const {intl} = this.props;
        const accepted = options.retry || await new Promise(resolve => this.props.openSimpleDialog({
            type: 'confirm',
            title: intl.formatMessage(messages.joinConfirmTitle),
            message: intl.formatMessage(scope ? messages.joinConfirmMessageProject : messages.joinConfirmMessage),
            choices: [{value: 'join', label: intl.formatMessage(messages.joinConfirmButton)}],
            onOk: () => resolve(true),
            onCancel: () => resolve(false)
        }));
        if (!accepted) {
            const cancelled = new Error(intl.formatMessage(messages.joinCancelled));
            cancelled.cancelled = true;
            throw cancelled;
        }
        const attempt = this.beginConnectAttempt();
        this.lastConnect = {kind: 'join', roomId, username, scope, invite: options.invite || null};
        try {
            this.endNoticeShown = false;
            this.props.onSetError(null);

            await this.collaborationService.connectToRoom(
                roomId, username, false, 'private', this.props.roturHandle, scope, {invite: options.invite}
            );
            this.throwIfAbandoned(attempt);
            if (options.invite) this.props.onSetInvite(null);

            // Don't set connected immediately - wait for connected-to-host event
            this.props.onSetRoomId(roomId);

            // Try to attach to workspace if it exists
            this.tryAttachToWorkspace();

        } catch (error) {
            this.throwIfAbandoned(attempt);
            console.error('Failed to join room:', error);
            throw this.connectFailed(error, {roomId, scope, hosting: false});
        }
    }

    async handleCreateRoom (roomId, username, _privacy, scope = null) {

        if (!roomId) throw new Error('Room ID is required to create a room');

        const attempt = this.beginConnectAttempt();
        this.lastConnect = {kind: 'create', roomId, username, scope};
        try {
            this.endNoticeShown = false;
            this.props.onSetError(null);

            await this.collaborationService.connectToRoom(
                roomId,
                username,
                true,
                'private',
                this.props.roturHandle,
                scope,
                {inviteRole: 'watch'}
            );
            this.throwIfAbandoned(attempt);
            this.setSessionState({reclaimingRoom: false});

            this.props.onSetConnected(true);
            this.props.onSetRoomId(roomId);
            this.props.onSetRoomPrivacy('private');
            this.updateUsersList();

            // Try to attach to workspace if it exists
            this.tryAttachToWorkspace();

        } catch (error) {
            this.throwIfAbandoned(attempt);
            this.setSessionState({reclaimingRoom: false});
            console.error('Failed to create room:', error);
            throw this.connectFailed(error, {roomId, scope, hosting: true});
        }
    }

    /**
     * Report a failed join/host: an actionable message for the window, and
     * whether "Try again" makes sense. Room sessions only — project
     * sessions have their own controls.
     * @param {Error} error What connectToRoom threw.
     * @param {object} context {roomId, scope, hosting}.
     * @returns {Error} An error carrying the display message and the code.
     */
    connectFailed (error, {roomId, scope, hosting}) {
        const code = (error && error.collabCode) || null;
        const message = formatCollabError(this.props.intl, code, error && error.message, {roomId, hosting});
        this.props.onSetError(message);
        this.setSessionState({canRetry: !scope && isRetryableCollabError(code)});
        const failure = new Error(message);
        failure.collabCode = code;
        return failure;
    }

    /**
     * Try the last room join/host again with the same settings.
     * @returns {Promise} Settles like the join/host it repeats.
     */
    handleRetry () {
        const last = this.lastConnect;
        if (!last) return Promise.reject(new Error('There is nothing to try again.'));
        if (last.kind === 'create') return this.handleCreateRoom(last.roomId, last.username, 'private', last.scope);
        return this.handleJoinRoom(last.roomId, last.username, last.scope, {invite: last.invite, retry: true});
    }

    setSessionState (next) {
        if (Object.keys(next).some(key => next[key] !== this.state[key])) this.setState(next);
    }

    beginConnectAttempt () {
        this.connectAttempt = (this.connectAttempt || 0) + 1;
        this.setSessionState({canRetry: false, reclaimingRoom: false});
        return this.connectAttempt;
    }

    /**
     * After the user cancels or leaves mid-connect, the connect call fails
     * (or finishes) late. That outcome is not an error to show.
     * @param {number} attempt The attempt the caller started.
     */
    throwIfAbandoned (attempt) {
        if (attempt === this.connectAttempt) return;
        const cancelled = new Error('Connecting was cancelled.');
        cancelled.cancelled = true;
        throw cancelled;
    }

    tryAttachToWorkspace (attempt = 0) {
        if (this.attachTimeout) {
            clearTimeout(this.attachTimeout);
            this.attachTimeout = null;
        }
        // Try to find the Blockly workspace via AddonHooks
        if (window.AddonHooks && window.AddonHooks.blocklyWorkspace) {
            this.collaborationService.attachToWorkspace(window.AddonHooks.blocklyWorkspace);
        } else if (window.Blockly && window.Blockly.getMainWorkspace && window.Blockly.getMainWorkspace()) {
            // Fallback to global Blockly workspace
            const workspace = window.Blockly.getMainWorkspace();
            this.collaborationService.attachToWorkspace(workspace);
        } else if (this.collaborationService.isConnected && attempt < MAX_ATTACH_ATTEMPTS) {
            this.attachTimeout = setTimeout(() => {
                this.attachTimeout = null;
                this.tryAttachToWorkspace(attempt + 1);
            }, 500);
        }
    }

    handleWorkspaceReattach () {
        this.tryAttachToWorkspace();
    }

    handleLeaveRoom () {
        this.beginConnectAttempt();
        this.endNoticeShown = true;
        this.collaborationService.disconnect();
        this.resetSessionState();
        this.props.onSetRoomPrivacy('public');
        this.props.onSetError(null);
    }

    handleKickUser (userId) {
        this.collaborationService.kickUser(userId);
        this.updateUsersList();
    }

    handleChangeUsername (newUsername) {
        this.collaborationService.changeUsername(newUsername);
        this.updateUsersList();
    }

    handleUserJoined () {
        this.updateUsersList();
    }

    handleUserLeft (user) {
        const name = user.username || user.id;
        if (!user.rejoined) {
            NotificationSystem.info(name ?
                this.props.intl.formatMessage(messages.userLeft, {name}) :
                this.props.intl.formatMessage(messages.someoneLeft), 3000);
        }
        this.updateUsersList();
    }

    handleUsersUpdated () {
        this.updateUsersList();
    }

    resetSessionState () {
        clearTimeout(this.syncRetryTimer);
        this.dismissJoinRequestNotices();
        this.props.onSetConnected(false);
        this.props.onSetRoomId(null);
        this.props.onSetUsers([]);
        this.props.onSetCollabLoading(false);
        this.props.onSetReconnecting(false);
    }

    /**
     * Tell the user why their session ended. The collaboration window shows
     * the same message inline, so only toast when it is closed.
     * @param {string} type Notification type.
     * @param {string} message The message.
     */
    announceEnd (type, message) {
        if (!this.props.isVisible) NotificationSystem[type](message, 8000);
    }

    handleConnectionFailed (data) {
        const code = (data && typeof data === 'object' && data.code) || null;
        const text = data && (typeof data === 'string' ? data : data.error);
        const service = this.collaborationService;
        const message = formatCollabError(this.props.intl, code, text,
            {roomId: this.props.roomId, hosting: service.isHost});
        const last = this.lastConnect;
        this.endNoticeShown = true;
        this.resetSessionState();
        this.props.onSetError(message);
        this.setSessionState({canRetry: Boolean(last && !last.scope && isRetryableCollabError(code))});
        this.announceEnd('error', message);
    }

    handleUsernameChanged (user) {
        // If this is our own username change from another client, update local state.
        // When signed into Rotur the two names are separate, so don't clobber the project name.
        if (
            !this.props.roturHandle &&
            user.id === this.getCurrentUserId() &&
            user.username !== this.props.currentUsername
        ) this.props.onSetUsername(user.username);

        this.updateUsersList();
    }

    handleKickedFromRoom () {
        const message = this.props.intl.formatMessage(messages.kicked);
        this.endNoticeShown = true;
        this.collaborationService.disconnect();
        this.resetSessionState();
        this.setSessionState({canRetry: false});
        this.props.onSetError(message);
        this.announceEnd('warning', message);
    }

    handleHostLeft () {
        const message = formatCollabError(this.props.intl, 'HOST_GONE');
        this.endNoticeShown = true;
        this.resetSessionState();
        this.setSessionState({canRetry: false});
        this.props.onSetError(message);
        this.announceEnd('warning', message);
    }

    handleConnectedToHost () {
        // Now we're actually connected and can show the connected UI
        this.props.onSetConnected(true);

        // Sync username with collaboration service (guests only; see handleUsernameChanged)
        const serviceUsername = this.collaborationService.username;
        if (
            !this.props.roturHandle &&
            serviceUsername &&
            serviceUsername !== this.props.currentUsername
        ) this.props.onSetUsername(serviceUsername);

        // Sync room privacy from service
        const roomPrivacy = this.collaborationService.getRoomPrivacy();
        this.props.onSetRoomPrivacy(roomPrivacy);

        this.updateUsersList();
    }

    handleDisconnected () {
        this.syncSessionInfo();
        if (!this.endNoticeShown) NotificationSystem.info(this.props.intl.formatMessage(messages.youLeft), 3000);
        this.endNoticeShown = false;
        clearTimeout(this.brokerOfflineTimer);
        this.resetSessionState();
        this.props.onSetRoomPrivacy('public');
    }

    handleCancelConnection () {
        this.beginConnectAttempt();
        this.endNoticeShown = true;
        this.collaborationService.disconnect();

        // Clear any connection state
        this.resetSessionState();
        this.props.onSetRoomPrivacy('public');
        this.props.onSetError(null);
    }

    async handleApproveJoinRequest (requesterId, requesterUsername, role) {
        this.dismissJoinRequestNotice(requesterId);
        try {
            await this.collaborationService.approveJoinRequest(requesterId, role);
        } catch (error) {
            console.error('Failed to approve join request:', error);
            this.props.onSetError(error.message || this.props.intl.formatMessage(messages.approveFailed));
            throw error;
        }
    }

    async handleDenyJoinRequest (requesterId) {
        this.dismissJoinRequestNotice(requesterId);
        try {
            await this.collaborationService.denyJoinRequest(requesterId);
        } catch (error) {
            console.error('Failed to deny join request:', error);
            this.props.onSetError(error.message || this.props.intl.formatMessage(messages.denyFailed));
            throw error;
        }
        // A denial changes nothing else in the store; refresh it so the menu
        // bar's waiting count goes down.
        this.updateUsersList();
    }

    handleCancelJoinRequest () {
        // Cancel any pending join request
        if (this.collaborationService.cancelJoinRequest) {
            this.collaborationService.cancelJoinRequest();
        }
        this.handleCancelConnection();
    }

    handleJoinRequestReceived (request) {
        // The modal lists requests itself. Project sessions approve through
        // the project's collaborator list, so there is nothing to ask.
        if (this.props.isVisible || this.collaborationService.scope) return;
        const {intl} = this.props;
        const requesterId = request && request.requesterId;
        const name = request && request.requesterUsername;
        this.dismissJoinRequestNotice(requesterId);
        // Someone is waiting on the host, so this stays until it is answered
        // here, in the window, or the request goes away.
        const noticeId = NotificationSystem.info(name ?
            intl.formatMessage(messages.joinRequest, {name}) :
            intl.formatMessage(messages.joinRequestUnnamed), 0, {
            actions: [{
                label: intl.formatMessage(messages.letThemIn),
                onClick: () => this.handleApproveJoinRequest(requesterId, name).catch(() => {
                    NotificationSystem.error(intl.formatMessage(messages.approveFailed), 6000);
                })
            }, {
                label: intl.formatMessage(messages.openLiveCollaboration),
                onClick: this.props.onOpen
            }]
        });
        if (requesterId) this.joinRequestNotices.set(requesterId, noticeId);
    }

    handleJoinRequestCancelled (request) {
        this.dismissJoinRequestNotice(request && request.requesterId);
    }

    dismissJoinRequestNotice (requesterId) {
        if (!this.joinRequestNotices.has(requesterId)) return;
        NotificationSystem.dismiss(this.joinRequestNotices.get(requesterId));
        this.joinRequestNotices.delete(requesterId);
    }

    dismissJoinRequestNotices () {
        Array.from(this.joinRequestNotices.keys()).forEach(requesterId => this.dismissJoinRequestNotice(requesterId));
    }

    handleJoinApproved () {
        // The user has been approved to join the room
        this.props.onSetConnected(true);
        this.updateUsersList();
    }

    handleJoinDenied (data) {
        const message = data || this.props.intl.formatMessage(messages.joinDenied);
        this.endNoticeShown = true;
        this.resetSessionState();
        this.setSessionState({canRetry: false});
        this.props.onSetError(message);
        this.announceEnd('warning', message);
    }


    handleRoomPrivacyChanged (privacy) {
        this.props.onSetRoomPrivacy(privacy);
    }

    updateUsersList () {
        const users = this.collaborationService.getConnectedUsers();
        this.props.onSetUsers(users);
        this.syncSessionInfo();
    }

    syncSessionInfo () {
        const service = this.collaborationService;
        const next = {
            inviteLink: service.getInviteLink(),
            inviteRole: service.getInviteRole(),
            myRole: service.getMyRole()
        };
        if (Object.keys(next).some(key => next[key] !== this.state[key])) this.setState(next);
    }

    handleRoleChanged (role) {
        this.syncSessionInfo();
        this.updateUsersList();
        if (!this.collaborationService.isConnectedToHostPeer()) return;
        NotificationSystem.info(this.props.intl.formatMessage(role === 'edit' ?
            messages.nowEditing : messages.nowWatching), 5000);
    }

    handleChangeInviteRole (role) {
        this.collaborationService.setInviteRole(role);
        this.syncSessionInfo();
    }

    handleChangeUserRole (userId, role) {
        this.collaborationService.setUserRole(userId, role);
        this.updateUsersList();
    }

    getCurrentUserId () {
        return this.collaborationService.getCurrentUserId();
    }

    // The loader messages are keys the collab loader translates.
    handleProjectSyncDownloadStart () {
        clearTimeout(this.syncRetryTimer);
        this.projectSyncProgress = 0;
        this.props.onSetCollabLoading(true, 'downloading');
        this.props.onSetHostLoadingProgress(0);
    }

    handleProjectSyncDownloadProgress (data) {
        if (data && typeof data.progress === 'number') {
            clearTimeout(this.syncRetryTimer);
            this.projectSyncProgress = data.progress;
            this.props.onSetCollabLoading(true, 'downloading');
            this.props.onSetHostLoadingProgress(data.progress);
        }
    }

    handleProjectSyncDownloadComplete () {
        this.projectSyncProgress = null;
        this.props.onSetCollabLoading(true, 'loading');
        this.props.onSetHostLoadingProgress(0);
    }

    handleProjectSyncApplyStart () {
        clearTimeout(this.syncRetryTimer);
        this.props.onSetCollabLoading(true, 'loading');
        this.props.onSetHostLoadingProgress(0);
    }

    handleProjectSyncApplyComplete () {
        this.props.onSetCollabLoading(false);
        this.props.onSetHostLoadingProgress(0);
    }

    handleProjectSyncDownloadError (data) {
        clearTimeout(this.syncRetryTimer);
        if (data && data.willRetry === false) {
            // Out of retries; connection-failed (SNAPSHOT_FAILED) follows
            // and says why.
            this.props.onSetCollabLoading(false);
            return;
        }
        // The download is retried automatically, so say so instead of
        // dropping the loader over a half-loaded project. The timer only
        // guards against a retry that never starts.
        this.props.onSetCollabLoading(true, 'retrying');
        this.props.onSetHostLoadingProgress(0);
        this.syncRetryTimer = setTimeout(() => {
            this.props.onSetCollabLoading(false);
            NotificationSystem.error(this.props.intl.formatMessage(messages.downloadGaveUp), 8000);
        }, SYNC_RETRY_GIVE_UP_MS);
    }

    handleHostRestarted () {
        // The reconnecting state stays until 'reconnected', which follows
        // once the reloaded project is in.
        NotificationSystem.info(this.props.intl.formatMessage(messages.hostRestarted), 5000);
    }

    handleLeftForOtherProject () {
        this.endNoticeShown = true;
        NotificationSystem.info(this.props.intl.formatMessage(messages.leftForOtherProject), 5000);
    }

    handleExtensionsSkipped ({ids}) {
        NotificationSystem.warning(this.props.intl.formatMessage(messages.extensionsSkipped,
            {extensions: ids.join(', ')}), 8000);
    }

    handleSnapshotUploadFailed ({username}) {
        NotificationSystem.warning(username ?
            this.props.intl.formatMessage(messages.snapshotUploadFailed, {name: username}) :
            this.props.intl.formatMessage(messages.snapshotUploadFailedUnnamed), 6000);
    }

    handleBrokerStatus ({online}) {
        clearTimeout(this.brokerOfflineTimer);
        if (online) {
            if (this.brokerOfflineShown) {
                NotificationSystem.info(this.props.intl.formatMessage(messages.brokerBack), 3000);
            }
            this.brokerOfflineShown = false;
            return;
        }
        if (!this.collaborationService.isHost) return;
        this.brokerOfflineTimer = setTimeout(() => {
            this.brokerOfflineShown = true;
            NotificationSystem.warning(this.props.intl.formatMessage(this.collaborationService.hasRelayedGuests() ?
                messages.brokerLostRelayed : messages.brokerLost), 6000);
        }, BROKER_OFFLINE_NOTICE_DELAY_MS);
    }

    handleReconnecting (info) {
        this.props.onSetReconnecting(true, (info && info.reason) || null);
    }

    handleHostIdTaken () {
        this.setSessionState({reclaimingRoom: true});
    }

    handleReconnected () {
        this.props.onSetReconnecting(false);
        NotificationSystem.success(this.props.intl.formatMessage(messages.reconnected), 3000);
    }

    handlePresenceEditingChanged ({userId, username, handle, activity}) {
        if (!activity) {
            this.props.onRemoveUserActivity(userId);
            return;
        }
        this.props.onSetUserActivity(Object.assign({userId, username, handle}, activity));
    }

    render () {
        return (
            <ProjectSession
                onPresence={this.props.onPresence}
                service={this.collaborationService}
                vm={this.props.vm}
                isReady={this.props.isProjectReady}
                username={this.props.roturHandle}
                onJoinRoom={this.handleJoinRoom}
                onCreateRoom={this.handleCreateRoom}
                onLeaveRoom={this.handleLeaveRoom}
            >
                {/* eslint-disable-next-line react/jsx-no-bind */}
                {(projectSessionActive, projectSession) => (<React.Fragment>
                    <CollaborationModal
                        projectSessionActive={projectSessionActive}
                        projectSession={projectSession}
                        onOpenBranches={this.props.onOpenBranches}
                        visible={this.props.isVisible}
                        currentUsername={this.props.currentUsername}
                        currentUserId={this.getCurrentUserId()}
                        roturHandle={this.props.roturHandle}
                        isConnected={!projectSessionActive && this.props.isConnected}
                        isReconnecting={this.props.isReconnecting}
                        reconnectReason={this.props.reconnectReason}
                        isReclaimingRoom={this.state.reclaimingRoom}
                        canRetry={!projectSessionActive && this.state.canRetry}
                        onRetry={this.handleRetry}
                        roomId={projectSessionActive ? null : this.props.roomId}
                        roomPrivacy={this.props.roomPrivacy}
                        connectedUsers={this.props.connectedUsers}
                        inviteLink={this.state.inviteLink}
                        inviteRole={this.state.inviteRole}
                        myRole={this.state.myRole}
                        pendingInvite={this.props.pendingInvite}
                        onChangeInviteRole={this.handleChangeInviteRole}
                        onChangeUserRole={this.handleChangeUserRole}
                        userActivity={this.props.userActivity}
                        vm={this.props.vm}
                        connectionError={projectSessionActive ? null : this.props.connectionError}
                        onRequestClose={this.props.onRequestClose}
                        onJoinRoom={this.handleJoinRoom}
                        onCreateRoom={this.handleCreateRoom}
                        onLeaveRoom={this.handleLeaveRoom}
                        onKickUser={this.handleKickUser}
                        onChangeUsername={this.handleChangeUsername}
                        onCancelConnection={this.handleCancelConnection}
                        onApproveJoinRequest={this.handleApproveJoinRequest}
                        onDenyJoinRequest={this.handleDenyJoinRequest}
                        onCancelJoinRequest={this.handleCancelJoinRequest}
                        onOpenChangeUsername={this.props.onOpenChangeUsername}
                        onShowToast={this.props.onShowToast}
                        openSimpleDialog={this.props.openSimpleDialog}
                    />
                </React.Fragment>)}
            </ProjectSession>
        );
    }
}

CollaborationContainer.propTypes = {
    onPresence: PropTypes.func.isRequired,
    onOpenBranches: PropTypes.func.isRequired,
    onOpen: PropTypes.func.isRequired,
    isVisible: PropTypes.bool.isRequired,
    isConnected: PropTypes.bool.isRequired,
    intl: intlShape.isRequired,
    isReconnecting: PropTypes.bool,
    reconnectReason: PropTypes.string,
    roomId: PropTypes.string,
    roomPrivacy: PropTypes.string,
    connectedUsers: PropTypes.array.isRequired,
    connectionError: PropTypes.string,
    pendingInvite: PropTypes.string,
    onSetInvite: PropTypes.func.isRequired,
    currentUsername: PropTypes.string,
    roturHandle: PropTypes.string,
    isProjectReady: PropTypes.bool,
    openSimpleDialog: PropTypes.func.isRequired,
    onShowToast: PropTypes.func.isRequired,
    vm: PropTypes.object.isRequired,
    onRequestClose: PropTypes.func.isRequired,
    onSetConnected: PropTypes.func.isRequired,
    onSetUsers: PropTypes.func.isRequired,
    onSetError: PropTypes.func.isRequired,
    onSetRoomId: PropTypes.func.isRequired,
    onSetRoomPrivacy: PropTypes.func.isRequired,
    onSetUsername: PropTypes.func.isRequired,
    onSetCollabLoading: PropTypes.func.isRequired,
    onSetHostLoadingProgress: PropTypes.func.isRequired,
    onSetReconnecting: PropTypes.func.isRequired,
    onSetUserActivity: PropTypes.func.isRequired,
    onRemoveUserActivity: PropTypes.func.isRequired,
    onOpenChangeUsername: PropTypes.func.isRequired,
    activeTabIndex: PropTypes.number,
    // eslint-disable-next-line react/forbid-prop-types
    userActivity: PropTypes.object.isRequired
};

const mapStateToProps = state => ({
    isProjectReady: getIsShowingProject(state.scratchGui.projectState?.loadingState),
    isVisible: state.scratchGui.collaboration.modalVisible,
    isConnected: state.scratchGui.collaboration.isConnected,
    isReconnecting: state.scratchGui.collaboration.isReconnecting,
    reconnectReason: state.scratchGui.collaboration.reconnectReason,
    roomId: state.scratchGui.collaboration.roomId,
    roomPrivacy: state.scratchGui.collaboration.roomPrivacy,
    pendingInvite: state.scratchGui.collaboration.pendingInvite,
    connectedUsers: state.scratchGui.collaboration.connectedUsers,
    userActivity: state.scratchGui.collaboration.activity,
    activeTabIndex: state.scratchGui.editorTab ? state.scratchGui.editorTab.activeTabIndex : 0,
    connectionError: state.scratchGui.collaboration.connectionError,
    // Online identity is the Rotur handle when signed in; the custom name is only a fallback.
    currentUsername: state.scratchGui.rotur.username ?
        `@${state.scratchGui.rotur.username}` :
        state.scratchGui.tw.username,
    roturHandle: state.scratchGui.rotur.username,
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    openSimpleDialog: config => dispatch(openSimpleDialog(config)),
    onPresence: presence => dispatch(setProjectPresence(presence)),
    onOpenBranches: () => {
        setGitModalInitialView('branches');
        dispatch(closeCollaborationModal());
        dispatch(openGitModal());
    },
    onOpen: () => dispatch(openCollaborationModal()),
    onRequestClose: () => dispatch(closeCollaborationModal()),
    onSetConnected: connected => dispatch(setCollaborationConnected(connected)),
    onSetUsers: users => dispatch(setCollaborationUsers(users)),
    onSetError: error => dispatch(setCollaborationError(error)),
    onSetRoomId: roomId => dispatch(setCollaborationRoomId(roomId)),
    onSetRoomPrivacy: privacy => dispatch(setCollaborationRoomPrivacy(privacy)),
    onSetInvite: invite => dispatch(setCollaborationInvite(invite)),
    onSetUsername: username => dispatch(setUsername(username)),
    onSetCollabLoading: (isLoading, message) => dispatch(setCollaborationLoading(isLoading, message)),
    onSetHostLoadingProgress: progress => dispatch(setCollaborationHostLoadingProgress(progress)),
    onSetReconnecting: (isReconnecting, reason) => dispatch(setCollaborationReconnecting(isReconnecting, reason)),
    onSetUserActivity: activity => dispatch(setUserActivity(activity)),
    onRemoveUserActivity: userId => dispatch(removeUserActivity(userId)),
    onOpenChangeUsername: () => dispatch(openUsernameModal()),
    onShowToast: (message, type) => dispatch({
        type: 'scratch-gui/SHOW_TOAST',
        message,
        toastType: type
    })
});

export default compose(
    injectIntl,
    connect(mapStateToProps, mapDispatchToProps)
)(CollaborationContainer);
