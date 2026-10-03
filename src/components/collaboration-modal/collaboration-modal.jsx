import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {defineMessages, FormattedMessage, injectIntl, intlShape} from 'react-intl';
import classNames from 'classnames';

import Modal from '../../containers/windowed-modal.jsx';
import Box from '../box/box.jsx';
import Button from '../button/button.jsx';
import Input from '../forms/input.jsx';

import {
    Handshake as CollaborationIcon,
    User,
    Crown,
    UserMinus,
    Copy,
    AlertTriangle,
    PenLine,
    Link,
    Eye,
    Pencil
} from 'lucide-react';

import CollaborationService from '../../lib/collaboration/index.js';
import {avatarForCollabUser} from '../../lib/collaboration/avatar.js';
import describeActivity from '../../lib/collaboration/describe-activity.js';

import styles from './collaboration-modal.css';

const messages = defineMessages({
    inviteLinkCopied: {
        defaultMessage: 'Invite link copied to clipboard',
        description: 'Toast shown after the collaboration invite link is copied',
        id: 'mw.collaboration.inviteLinkCopied'
    },
    inviteLinkPromptTitle: {
        defaultMessage: 'Copy invite link',
        description: 'Title of the dialog showing the collaboration invite link when it could not be copied',
        id: 'mw.collaboration.inviteLinkPromptTitle'
    },
    inviteLinkPromptMessage: {
        defaultMessage: 'The link could not be copied automatically. Copy it from the field below.',
        description: 'Message of the dialog showing the collaboration invite link when it could not be copied',
        id: 'mw.collaboration.inviteLinkPromptMessage'
    },
    inviteLinkTitle: {
        defaultMessage: 'Invite link',
        description: 'Heading of the section with the collaboration invite link',
        id: 'mw.collaboration.inviteLinkTitle'
    },
    inviteLinkFieldLabel: {
        defaultMessage: 'Invite link',
        description: 'Accessible label of the read-only field holding the collaboration invite link',
        id: 'mw.collaboration.inviteLinkFieldLabel'
    },
    copyInviteLink: {
        defaultMessage: 'Copy',
        description: 'Button that copies the collaboration invite link',
        id: 'mw.collaboration.copyInviteLink'
    },
    inviteRoleLabel: {
        defaultMessage: 'People with the link can',
        description: 'Label of the control choosing what the collaboration invite link allows',
        id: 'mw.collaboration.inviteRoleLabel'
    },
    inviteRoleWatch: {
        defaultMessage: 'Watch',
        description: 'Invite link option letting people only watch the session',
        id: 'mw.collaboration.inviteRoleWatch'
    },
    inviteRoleEdit: {
        defaultMessage: 'Edit',
        description: 'Invite link option letting people edit the project',
        id: 'mw.collaboration.inviteRoleEdit'
    },
    inviteWatchHelp: {
        defaultMessage: 'They can see every change and follow along, but cannot edit.',
        description: 'Help text shown when the collaboration invite link only allows watching',
        id: 'mw.collaboration.inviteWatchHelp'
    },
    inviteEditHelp: {
        defaultMessage: 'They can change the project, just like you.',
        description: 'Help text shown when the collaboration invite link allows editing',
        id: 'mw.collaboration.inviteEditHelp'
    },
    roleEditing: {
        defaultMessage: 'Editing',
        description: 'Pill shown next to a collaborator who can edit the project',
        id: 'mw.collaboration.roleEditing'
    },
    roleWatching: {
        defaultMessage: 'Watching',
        description: 'Pill shown next to a collaborator who can only watch',
        id: 'mw.collaboration.roleWatching'
    },
    letEdit: {
        defaultMessage: 'Let edit',
        description: 'Button that lets a watching collaborator edit the project',
        id: 'mw.collaboration.letEdit'
    },
    makeWatcher: {
        defaultMessage: 'Make watcher',
        description: 'Button that turns an editing collaborator into a watcher',
        id: 'mw.collaboration.makeWatcher'
    },
    letWatch: {
        defaultMessage: 'Let watch',
        description: 'Button that approves a join request as a watcher',
        id: 'mw.collaboration.letWatch'
    },
    letUserEdit: {
        defaultMessage: 'Let {name} edit',
        description: 'Accessible label of the button letting a named collaborator edit',
        id: 'mw.collaboration.letUserEdit'
    },
    letUserWatch: {
        defaultMessage: 'Let {name} watch',
        description: 'Accessible label of the button approving a named join request as a watcher',
        id: 'mw.collaboration.letUserWatch'
    },
    makeUserWatcher: {
        defaultMessage: 'Make {name} a watcher',
        description: 'Accessible label of the button turning a named collaborator into a watcher',
        id: 'mw.collaboration.makeUserWatcher'
    },
    removeUser: {
        defaultMessage: 'Remove {name}',
        description: 'Accessible label of the button removing a named collaborator from the room',
        id: 'mw.collaboration.removeUser'
    },
    denyUser: {
        defaultMessage: 'Deny {name}',
        description: 'Accessible label of the button denying a named join request',
        id: 'mw.collaboration.denyUser'
    },
    watcherNotice: {
        // eslint-disable-next-line max-len
        defaultMessage: 'You are watching. You can look around and follow along, but changes are made by the host and editors.',
        description: 'Notice shown to a collaborator who can only watch the session',
        id: 'mw.collaboration.watcherNotice'
    },
    reconnecting: {
        defaultMessage: 'Connection lost. Reconnecting…',
        description: 'Status in the collaboration window while the connection to the host is being restored',
        id: 'mw.collaboration.reconnecting'
    },
    connectingToRoom: {
        defaultMessage: 'Connecting to room "{roomId}"…',
        description: 'Shown while connecting to a collaboration room. {roomId} is the room code.',
        id: 'mw.collaboration.connectingToRoom'
    },
    aloneHint: {
        defaultMessage: 'No one else has joined yet. Share the invite link below to bring people in.',
        description: 'Hint shown to a collaboration host while nobody else is in the room',
        id: 'mw.collaboration.aloneHint'
    },
    endForEveryone: {
        defaultMessage: 'End live session for everyone',
        description: 'Button the collaboration host uses to end the session for all collaborators',
        id: 'mw.collaboration.endForEveryone'
    },
    leaveSession: {
        defaultMessage: 'Leave live session',
        description: 'Button a collaboration guest uses to leave the session',
        id: 'mw.collaboration.leaveSession'
    },
    endConfirmTitle: {
        defaultMessage: 'End the live session?',
        description: 'Title of the dialog confirming that the host wants to end a collaboration session',
        id: 'mw.collaboration.endConfirmTitle'
    },
    endConfirmMessage: {
        // eslint-disable-next-line max-len
        defaultMessage: '{count, plural, one {# person is} other {# people are}} still here. Ending the session disconnects everyone. They keep their own copy of the project.',
        description: 'Message of the dialog confirming that the host wants to end a collaboration session with guests',
        id: 'mw.collaboration.endConfirmMessage'
    },
    endConfirmButton: {
        defaultMessage: 'End for everyone',
        description: 'Button confirming that the collaboration host wants to end the session for everyone',
        id: 'mw.collaboration.endConfirmButton'
    },
    changeUsername: {
        defaultMessage: 'Change username',
        description: 'Accessible label of the button that changes the name used in collaboration',
        id: 'mw.collaboration.changeUsername'
    },
    roomIdPlaceholder: {
        defaultMessage: 'Enter room ID…',
        description: 'Placeholder of the collaboration room ID field',
        id: 'mw.collaboration.roomIdPlaceholder'
    },
    enterRoomId: {
        defaultMessage: 'Enter a room ID to join, or create a new room below.',
        description: 'Error shown when trying to join a collaboration room without a room ID',
        id: 'mw.collaboration.enterRoomId'
    }
});

const INVITE_ROLES = ['watch', 'edit'];

class CollaborationModal extends Component {
    constructor (props) {
        super(props);

        this.state = {
            roomId: props.roomId || '',
            isConnecting: false,
            connectionStep: props.isConnected ? 'connected' : 'join',
            error: null,
            pendingRequests: [],
            showJoinRequest: false
        };

        this._autoJoinKey = null;

        this.handleRoomIdChange = this.handleRoomIdChange.bind(this);
        this.handleRoomIdKeyPress = this.handleRoomIdKeyPress.bind(this);
        this.maybeAutoJoin = this.maybeAutoJoin.bind(this);
        this.handleJoinRoom = this.handleJoinRoom.bind(this);
        this.handleCreateRoom = this.handleCreateRoom.bind(this);
        this.handleLeaveRoom = this.handleLeaveRoom.bind(this);
        this.handleKickUser = this.handleKickUser.bind(this);
        this.handleCopyInviteLink = this.handleCopyInviteLink.bind(this);
        this.handleInviteLinkFocus = this.handleInviteLinkFocus.bind(this);
        this.handleSelectInviteWatch = this.handleSelectInviteWatch.bind(this);
        this.handleSelectInviteEdit = this.handleSelectInviteEdit.bind(this);
        this.handleInviteRoleKeyDown = this.handleInviteRoleKeyDown.bind(this);
        this.fallbackCopyToClipboard = this.fallbackCopyToClipboard.bind(this);
        this.showUrlPrompt = this.showUrlPrompt.bind(this);
        this.generateRoomCode = this.generateRoomCode.bind(this);
        this.attemptAutoJoin = this.attemptAutoJoin.bind(this);
        this.handleApproveRequest = this.handleApproveRequest.bind(this);
        this.handleDenyRequest = this.handleDenyRequest.bind(this);
        this.handleCancelJoinRequest = this.handleCancelJoinRequest.bind(this);
        this.handleJoinRequestEvent = this.handleJoinRequestEvent.bind(this);
        this.handleAwaitingApproval = this.handleAwaitingApproval.bind(this);
        this.handleApprovalResolved = this.handleApprovalResolved.bind(this);
        this.handleJoinDenied = this.handleJoinDenied.bind(this);
        this.resetToJoinScreen = this.resetToJoinScreen.bind(this);
        this.handleCancelClick = this.handleCancelClick.bind(this);
        this.handleJoinRequestsChanged = this.handleJoinRequestsChanged.bind(this);
        this.handleProjectLeave = this.handleProjectLeave.bind(this);
        this.leaveRoom = this.leaveRoom.bind(this);
    }

    componentDidMount () {
        this.maybeAutoJoin();

        if (CollaborationService) {
            try {
                const service = CollaborationService.getInstance();
                if (service) {
                    service.on('join-request-received', this.handleJoinRequestEvent);
                    service.on('join-request-cancelled', this.handleJoinRequestsChanged);
                    // 'awaiting-approval' fires for every hello, including
                    // invite links and reconnects; only 'join-pending' means
                    // the host really has to let us in.
                    service.on('join-pending', this.handleAwaitingApproval);
                    service.on('approval-resolved', this.handleApprovalResolved);
                    service.on('join-denied', this.handleJoinDenied);
                }
            } catch (error) {
                console.warn('Could not set up collaboration service event listeners:', error);
            }
        }
    }

    /* eslint-disable react/no-did-update-set-state */
    componentDidUpdate (prevProps) {
        // When the session ends, the container's connectionError says why
        // (kicked, host left, denied...). Keep it rather than wiping it, in
        // whatever order the connected/room/error updates arrive.
        if (prevProps.isConnected !== this.props.isConnected) {
            this.setState({
                connectionStep: this.props.isConnected ? 'connected' : 'join',
                isConnecting: false,
                error: this.props.isConnected ? null : (this.props.connectionError || null)
            });
        }

        if (prevProps.roomId !== this.props.roomId) {
            if (this.props.roomId) {
                this.setState({roomId: this.props.roomId});
            } else {
                this._autoJoinKey = null;
                if (!this.props.isConnected) {
                    this.setState({
                        connectionStep: 'join',
                        isConnecting: false,
                        error: this.props.connectionError || null
                    });
                }
            }
        }

        if (prevProps.connectionError !== this.props.connectionError && this.props.connectionError) {
            this.setState({
                error: this.props.connectionError,
                isConnecting: false,
                connectionStep: 'join'
            });
        }

        this.maybeAutoJoin();

        if (this.props.visible && !this.props.projectSessionActive && CollaborationService) {
            try {
                const service = CollaborationService.getInstance();
                if (service && service.getPendingJoinRequests) {
                    const pendingRequests = service.getPendingJoinRequests();
                    const hasChanged =
                        JSON.stringify(pendingRequests) !== JSON.stringify(this.state.pendingRequests);

                    if (hasChanged) {
                        this.setState({pendingRequests});
                    }
                }
            } catch (error) {
                // ignore
            }
        }
    }
    /* eslint-enable react/no-did-update-set-state */

    componentWillUnmount () {
        if (CollaborationService) {
            try {
                const service = CollaborationService.getInstance();
                if (service) {
                    service.off('join-request-received', this.handleJoinRequestEvent);
                    service.off('join-request-cancelled', this.handleJoinRequestsChanged);
                    service.off('join-pending', this.handleAwaitingApproval);
                    service.off('approval-resolved', this.handleApprovalResolved);
                    service.off('join-denied', this.handleJoinDenied);
                }
            } catch (error) {
                console.warn('Could not clean up collaboration service event listeners:', error);
            }
        }

        this._autoJoinKey = null;
    }

    resetToJoinScreen () {
        this.setState({
            connectionStep: 'join',
            isConnecting: false,
            error: null
        });
    }

    handleCancelClick () {
        this.resetToJoinScreen();
        this.props.onCancelConnection();
    }

    handleRoomIdChange (event) {
        this.setState({roomId: event.target.value});
    }

    handleRoomIdKeyPress (event) {
        if (event.key === 'Enter') this.handleJoinRoom();
    }

    async handleJoinRoom () {
        const roomId = this.state.roomId.trim();
        if (!roomId) {
            this.setState({error: this.props.intl.formatMessage(messages.enterRoomId)});
            return;
        }
        this._autoJoinKey = `${roomId}-${this.props.currentUsername}`;

        this.setState({
            isConnecting: true,
            connectionStep: 'connecting',
            error: null
        });

        try {
            await this.props.onJoinRoom(roomId, this.props.currentUsername);
        } catch (error) {
            if (error && error.cancelled) {
                this.resetToJoinScreen();
                return;
            }
            this.setState({
                error: error.collabCode === 'ROOM_NOT_FOUND' ?
                    `Nobody is hosting room "${roomId}" yet. You can create it below.` :
                    error.message || 'Failed to join room',
                isConnecting: false,
                connectionStep: 'join'
            });
        }
    }

    async handleCreateRoom () {
        const roomCode = this.state.roomId.trim() || this.generateRoomCode();
        this._autoJoinKey = `${roomCode}-${this.props.currentUsername}`;

        this.setState({
            isConnecting: true,
            connectionStep: 'connecting',
            error: null
        });

        try {
            // The room code is deliberately not put in the address bar: a
            // reload would then try to join the room this tab was hosting.
            // People join through the invite link.
            await this.props.onCreateRoom(roomCode, this.props.currentUsername, 'private');

            this.setState({roomId: roomCode});

        } catch (error) {
            if (error && error.cancelled) {
                this.resetToJoinScreen();
                return;
            }
            this.setState({
                error: error.message || 'Failed to create room',
                connectionStep: 'join'
            });
        } finally {
            this.setState({isConnecting: false});
        }
    }

    /**
     * Run `leave` straight away, or after confirming when we host people
     * who would all be disconnected by it.
     * @param {boolean} isHost Whether we host the session.
     * @param {Function} leave Ends or leaves the session.
     */
    confirmEndForEveryone (isHost, leave) {
        const others = (this.props.connectedUsers || []).filter(user => user.id !== this.props.currentUserId);
        if (!isHost || others.length === 0) {
            leave();
            return;
        }
        const {intl} = this.props;
        this.props.openSimpleDialog({
            type: 'confirm',
            title: intl.formatMessage(messages.endConfirmTitle),
            message: intl.formatMessage(messages.endConfirmMessage, {count: others.length}),
            choices: [{value: 'end', label: intl.formatMessage(messages.endConfirmButton)}],
            onOk: leave,
            onCancel: () => {}
        });
    }

    isHosting () {
        const me = (this.props.connectedUsers || []).find(user => user.id === this.props.currentUserId);
        return Boolean(me && me.isHost);
    }

    handleLeaveRoom () {
        this.confirmEndForEveryone(this.isHosting(), this.leaveRoom);
    }

    leaveRoom () {
        this.props.onLeaveRoom();
        this.setState({
            connectionStep: 'join',
            roomId: '',
            error: null
        });
    }

    handleProjectLeave () {
        const project = this.props.projectSession || {};
        if (!project.onLeave) return;
        // Cancelling a join or a leave already under way needs no confirmation.
        const ending = project.isHost && !project.busy && project.phase !== 'joining';
        this.confirmEndForEveryone(ending, project.onLeave);
    }

    handleKickUser (userId) {
        this.props.onKickUser(userId);
    }

    handleChangeUserRole (userId, role) {
        if (this.props.onChangeUserRole) this.props.onChangeUserRole(userId, role);
    }

    handleCopyInviteLink () {
        const inviteLink = this.props.inviteLink;
        if (!inviteLink) return;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(inviteLink).then(() => {
                this.props.onShowToast(this.props.intl.formatMessage(messages.inviteLinkCopied), 'success');
            })
                .catch(err => {
                    console.error('Failed to copy invite link:', err);
                    this.fallbackCopyToClipboard(inviteLink);
                });
        } else {
            this.fallbackCopyToClipboard(inviteLink);
        }
    }

    handleInviteLinkFocus (event) {
        event.target.select();
    }

    handleSelectInviteWatch () {
        this.changeInviteRole('watch');
    }

    handleSelectInviteEdit () {
        this.changeInviteRole('edit');
    }

    changeInviteRole (role) {
        if (role === this.props.inviteRole) return;
        if (this.props.onChangeInviteRole) this.props.onChangeInviteRole(role);
    }

    handleInviteRoleKeyDown (event) {
        const step = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1}[event.key];
        if (!step) return;
        event.preventDefault();
        const current = Math.max(0, INVITE_ROLES.indexOf(this.props.inviteRole || 'watch'));
        const next = INVITE_ROLES[(current + step + INVITE_ROLES.length) % INVITE_ROLES.length];
        this.changeInviteRole(next);
        const group = event.currentTarget;
        const target = group.querySelector(`[data-role="${next}"]`);
        if (target) target.focus();
    }

    fallbackCopyToClipboard (text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);

        try {
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            if (successful) {
                this.props.onShowToast(this.props.intl.formatMessage(messages.inviteLinkCopied), 'success');
            } else {
                console.warn('Fallback copy failed');
                this.showUrlPrompt(text);
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
            this.showUrlPrompt(text);
        } finally {
            document.body.removeChild(textArea);
        }
    }

    showUrlPrompt (text) {
        this.props.openSimpleDialog({
            type: 'prompt',
            title: this.props.intl.formatMessage(messages.inviteLinkPromptTitle),
            message: this.props.intl.formatMessage(messages.inviteLinkPromptMessage),
            defaultValue: text
        });
    }

    generateRoomCode () {
        const adjectives = ['cool', 'fun', 'epic', 'wild', 'neat', 'rad', 'hot', 'ice', 'big', 'tiny'];
        const nouns = ['cat', 'dog', 'owl', 'fox', 'bee', 'ant', 'fish', 'bird', 'frog', 'duck'];

        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
        const randomNum = Math.floor(Math.random() * 1000).toString()
            .padStart(3, '0');

        return `${randomAdjective}-${randomNoun}-${randomNum}`;
    }

    maybeAutoJoin () {
        if (this.props.projectSessionActive) return;
        const {roomId, currentUsername, isConnected} = this.props;
        if (!roomId || !currentUsername || isConnected) return;
        if (CollaborationService.getInstance().roomId) return;
        const key = `${roomId}-${currentUsername}`;
        if (this._autoJoinKey === key) return;
        this._autoJoinKey = key;
        this.attemptAutoJoin(roomId, currentUsername);
    }

    async attemptAutoJoin (roomCode, username) {
        this.setState({
            isConnecting: true,
            connectionStep: 'connecting',
            error: null
        });

        try {
            await this.props.onJoinRoom(roomCode, username, null, {invite: this.props.pendingInvite});
        } catch (error) {
            if (error && error.cancelled) {
                this.setState({roomId: roomCode});
                this.resetToJoinScreen();
                return;
            }
            this.setState({
                roomId: roomCode,
                error: error.collabCode === 'ROOM_NOT_FOUND' ?
                    `Nobody is hosting room "${roomCode}" yet. You can create it below.` :
                    error.message || 'Failed to join room',
                isConnecting: false,
                connectionStep: 'join'
            });
        }
    }

    async handleApproveRequest (requesterId, requesterUsername, role) {
        try {
            await this.props.onApproveJoinRequest(requesterId, requesterUsername, role);
            this.setState(prevState => ({
                pendingRequests: prevState.pendingRequests.filter(req => req.id !== requesterId)
            }));
        } catch (error) {
            console.error('Failed to approve join request:', error);
            this.setState({error: 'Failed to approve join request'});
        }
    }

    async handleDenyRequest (requesterId) {
        try {
            await this.props.onDenyJoinRequest(requesterId);
            this.setState(prevState => ({
                pendingRequests: prevState.pendingRequests.filter(req => req.id !== requesterId)
            }));
        } catch (error) {
            console.error('Failed to deny join request:', error);
            this.setState({error: 'Failed to deny join request'});
        }
    }

    handleCancelJoinRequest () {
        if (this.props.onCancelJoinRequest) {
            this.props.onCancelJoinRequest();
        }

        if (CollaborationService) {
            try {
                const service = CollaborationService.getInstance();
                if (service) {
                    service.disconnect();
                }
            } catch (error) {
                console.warn('Could not disconnect from collaboration service:', error);
            }
        }

        this.setState({
            connectionStep: 'join',
            isConnecting: false,
            error: null
        });
    }

    handleAwaitingApproval () {
        if (CollaborationService?.getInstance().scope || this.props.isConnected) return;
        this.setState({
            connectionStep: 'pending-approval',
            isConnecting: false,
            error: null
        });
    }

    handleApprovalResolved () {
        if (CollaborationService?.getInstance().scope) return;
        this.setState({
            connectionStep: this.props.isConnected ? 'connected' : 'connecting',
            error: null
        });
    }

    handleJoinDenied (reason) {
        if (CollaborationService?.getInstance().scope) return;
        this.setState({
            connectionStep: 'join',
            isConnecting: false,
            error: reason || null
        });
    }

    handleJoinRequestsChanged () {
        this.handleJoinRequestEvent();
    }

    handleJoinRequestEvent () {
        if (CollaborationService?.getInstance().scope) return;
        if (CollaborationService) {
            try {
                const service = CollaborationService.getInstance();
                if (service && service.getPendingJoinRequests) {
                    const pendingRequests = service.getPendingJoinRequests();
                    this.setState({pendingRequests});
                }
            } catch (error) {
                console.warn('Could not get pending requests:', error);
            }
        }
    }

    describeActivity (userId) {
        return describeActivity(this.props.vm, (this.props.userActivity || {})[userId]);
    }

    renderUserIcon (user, isHost) {
        const avatarUrl = avatarForCollabUser(user);
        if (avatarUrl) {
            return (
                <img
                    className={styles.avatar}
                    src={avatarUrl}
                    alt=""
                    draggable={false}
                />
            );
        }
        return (
            <div className={styles.userIcon}>
                {isHost ? <Crown /> : <User />}
            </div>
        );
    }

    renderAlphaBanner () {
        return (
            <div className={styles.alphaBanner}>
                <div className={styles.bannerIcon}>
                    <AlertTriangle size={16} />
                </div>
                <div className={styles.bannerContent}>
                    {'Collaboration is experimental. Keep a downloaded backup before a shared editing session.'}
                </div>
            </div>
        );
    }

    renderRolePill (user) {
        const watching = user.role === 'watch';
        return (
            <span
                className={classNames(styles.rolePill, {
                    [styles.rolePillWatching]: watching
                })}
            >
                {watching ? <Eye size={11} /> : <Pencil size={11} />}
                {this.props.intl.formatMessage(watching ? messages.roleWatching : messages.roleEditing)}
            </span>
        );
    }

    renderInviteSection () {
        const {intl, inviteLink} = this.props;
        if (!inviteLink) return null;
        const inviteRole = this.props.inviteRole || 'watch';
        return (
            <div className={styles.inviteSection}>
                <h3 className={styles.sectionTitle}>
                    <Link
                        className={styles.sectionIcon}
                        size={16}
                    />
                    {intl.formatMessage(messages.inviteLinkTitle)}
                </h3>
                <div className={styles.inviteRow}>
                    <input
                        className={classNames(styles.input, styles.inviteInput)}
                        type="text"
                        readOnly
                        value={inviteLink}
                        aria-label={intl.formatMessage(messages.inviteLinkFieldLabel)}
                        onFocus={this.handleInviteLinkFocus}
                    />
                    <Button
                        className={classNames(styles.primaryButton, styles.copyButton)}
                        onClick={this.handleCopyInviteLink}
                        iconElem={Copy}
                        iconClassName={styles.buttonIcon}
                    >
                        {intl.formatMessage(messages.copyInviteLink)}
                    </Button>
                </div>
                <div className={styles.inviteRoleRow}>
                    <span
                        className={styles.inviteRoleLabel}
                        id="collaborationInviteRoleLabel"
                    >
                        {intl.formatMessage(messages.inviteRoleLabel)}
                    </span>
                    <div
                        className={styles.segmented}
                        role="radiogroup"
                        aria-labelledby="collaborationInviteRoleLabel"
                        onKeyDown={this.handleInviteRoleKeyDown}
                    >
                        <button
                            className={classNames(styles.segment, {
                                [styles.segmentActive]: inviteRole === 'watch'
                            })}
                            type="button"
                            role="radio"
                            data-role="watch"
                            aria-checked={inviteRole === 'watch'}
                            tabIndex={inviteRole === 'watch' ? 0 : -1}
                            onClick={this.handleSelectInviteWatch}
                        >
                            <Eye size={14} />
                            {intl.formatMessage(messages.inviteRoleWatch)}
                        </button>
                        <button
                            className={classNames(styles.segment, {
                                [styles.segmentActive]: inviteRole === 'edit'
                            })}
                            type="button"
                            role="radio"
                            data-role="edit"
                            aria-checked={inviteRole === 'edit'}
                            tabIndex={inviteRole === 'edit' ? 0 : -1}
                            onClick={this.handleSelectInviteEdit}
                        >
                            <Pencil size={14} />
                            {intl.formatMessage(messages.inviteRoleEdit)}
                        </button>
                    </div>
                </div>
                <div className={styles.inviteHelp}>
                    {intl.formatMessage(inviteRole === 'edit' ? messages.inviteEditHelp : messages.inviteWatchHelp)}
                </div>
            </div>
        );
    }

    renderWatcherNotice () {
        return (
            <div
                className={styles.watchNotice}
                role="status"
            >
                <div className={styles.privacyNoticeIcon}>
                    <Eye size={14} />
                </div>
                <div>{this.props.intl.formatMessage(messages.watcherNotice)}</div>
            </div>
        );
    }

    renderJoinStep () {
        const typedRoomId = this.state.roomId.trim();
        return (
            <Box className={styles.content}>
                {this.renderAlphaBanner()}

                <div className={styles.header}>
                    <CollaborationIcon
                        className={styles.headerIcon}
                        draggable={false}
                    />
                    <div className={styles.headerText}>
                        <FormattedMessage
                            defaultMessage="Live collaboration"
                            description="Title for collaboration modal"
                            id="gui.collaboration.title"
                        />
                    </div>
                </div>

                <div className={styles.description}>
                    {this.renderUserIcon({handle: this.props.roturHandle}, false)}
                    <FormattedMessage
                        defaultMessage="You will be known as: {username}"
                        description="Shows current username"
                        id="gui.collaboration.currentUsername"
                        values={{username: this.props.currentUsername}}
                    />
                    {!this.props.roturHandle && (
                        <button
                            type="button"
                            className={styles.editUsernameButton}
                            onClick={this.props.onOpenChangeUsername}
                            title={this.props.intl.formatMessage(messages.changeUsername)}
                            aria-label={this.props.intl.formatMessage(messages.changeUsername)}
                        >
                            <PenLine size={16} />
                        </button>
                    )}
                </div>

                <div className={styles.roomActions}>
                    <div className={styles.joinSection}>
                        <h3 className={styles.sectionTitle}>
                            <FormattedMessage
                                defaultMessage="Join a room"
                                description="Join room section title"
                                id="gui.collaboration.joinTitle"
                            />
                        </h3>
                        <div className={styles.inputGroup}>
                            <label
                                className={styles.label}
                                htmlFor="collaborationRoomId"
                            >
                                <FormattedMessage
                                    defaultMessage="Room ID"
                                    description="Label for room ID input"
                                    id="gui.collaboration.roomId"
                                />
                            </label>
                            <Input
                                id="collaborationRoomId"
                                className={styles.input}
                                placeholder={this.props.intl.formatMessage(messages.roomIdPlaceholder)}
                                aria-invalid={Boolean(this.state.error)}
                                aria-describedby={this.state.error ? 'collaborationJoinError' : null}
                                value={this.state.roomId}
                                onChange={this.handleRoomIdChange}
                                onKeyPress={this.handleRoomIdKeyPress}
                            />
                        </div>
                        <Button
                            className={styles.primaryButton}
                            onClick={this.handleJoinRoom}
                            disabled={this.state.isConnecting}
                        >
                            <FormattedMessage
                                defaultMessage="Join room"
                                description="Button to join collaboration room"
                                id="gui.collaboration.joinRoom"
                            />
                        </Button>
                        {this.state.error && (
                            <div
                                className={styles.joinError}
                                id="collaborationJoinError"
                                role="alert"
                            >
                                {this.state.error}
                            </div>
                        )}
                        <div className={styles.privacyNotice}>
                            <div className={styles.privacyNoticeIcon}>
                                <AlertTriangle size={14} />
                            </div>
                            <div>
                                <FormattedMessage
                                    defaultMessage="The host can see your IP address. Other members cannot."
                                    description="Privacy notice shown before joining a collaboration room"
                                    id="gui.collaboration.joinPrivacyNotice"
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.sectionDivider} />

                    <div className={styles.createSection}>
                        <h3 className={styles.sectionTitle}>
                            <FormattedMessage
                                defaultMessage="Create a room"
                                description="Create room section title"
                                id="gui.collaboration.createTitle"
                            />
                        </h3>
                        <div className={styles.createDescription}>
                            <FormattedMessage
                                // eslint-disable-next-line max-len
                                defaultMessage="Anyone with the invite link can join. People who only have the room code ask you first."
                                description="Create room description"
                                id="gui.collaboration.createDescription"
                            />
                        </div>
                        <Button
                            className={styles.secondaryButton}
                            onClick={this.handleCreateRoom}
                            disabled={this.state.isConnecting}
                        >
                            {typedRoomId ? `Host room "${typedRoomId}"` : (
                                <FormattedMessage
                                    defaultMessage="Create new room"
                                    description="Button to create new collaboration room"
                                    id="gui.collaboration.createRoom"
                                />
                            )}
                        </Button>
                        <div className={styles.privacyNotice}>
                            <div className={styles.privacyNoticeIcon}>
                                <AlertTriangle size={14} />
                            </div>
                            <div>
                                <FormattedMessage
                                    defaultMessage="People who join can see your IP address, and you theirs."
                                    description="Privacy notice shown before hosting a collaboration room"
                                    id="gui.collaboration.hostPrivacyNotice"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Box>
        );
    }

    renderConnectingStep () {
        return (
            <Box className={styles.content}>
                <div
                    className={styles.connecting}
                    role="status"
                    aria-live="polite"
                >
                    <div className={styles.spinner} />
                    {this.state.roomId.trim() ?
                        this.props.intl.formatMessage(messages.connectingToRoom, {roomId: this.state.roomId.trim()}) :
                        (
                            <FormattedMessage
                                defaultMessage="Connecting to room..."
                                description="Connecting message"
                                id="gui.collaboration.connecting"
                            />
                        )}
                    <div className={styles.buttonGroup}>
                        <Button
                            className={styles.secondaryButton}
                            onClick={this.handleCancelClick}
                        >
                            <FormattedMessage
                                defaultMessage="Cancel"
                                description="Cancel connection button"
                                id="gui.collaboration.cancel"
                            />
                        </Button>
                    </div>
                </div>
            </Box>
        );
    }

    /* eslint-disable react/jsx-no-bind */
    renderUserRow (user, isHost) {
        const {intl} = this.props;
        const isMe = user.id === this.props.currentUserId;
        const watching = user.role === 'watch';
        return (
            <div
                key={user.id}
                className={classNames(styles.userItem, {
                    [styles.currentUser]: isMe
                })}
            >
                {this.renderUserIcon(user, user.isHost)}
                <span className={styles.username}>
                    {user.username}
                    {user.isHost && (
                        <span className={styles.hostBadge}>
                            <FormattedMessage
                                defaultMessage="Host"
                                description="Host badge"
                                id="gui.collaboration.host"
                            />
                        </span>
                    )}
                    {isMe && (
                        <span className={styles.youBadge}>
                            <FormattedMessage
                                defaultMessage="You"
                                description="You badge"
                                id="gui.collaboration.you"
                            />
                        </span>
                    )}
                    {this.renderRolePill(user)}
                    {this.describeActivity(user.id) && (
                        <span className={styles.userActivity}>
                            {this.describeActivity(user.id)}
                        </span>
                    )}
                </span>

                {isHost && !isMe && (
                    <div className={styles.userActions}>
                        <button
                            type="button"
                            className={styles.roleButton}
                            aria-label={intl.formatMessage(
                                watching ? messages.letUserEdit : messages.makeUserWatcher,
                                {name: user.username}
                            )}
                            onClick={this.handleChangeUserRole.bind(this, user.id, watching ? 'edit' : 'watch')}
                        >
                            {intl.formatMessage(watching ? messages.letEdit : messages.makeWatcher)}
                        </button>
                        <Button
                            className={styles.kickButton}
                            aria-label={intl.formatMessage(messages.removeUser, {name: user.username})}
                            onClick={this.handleKickUser.bind(this, user.id)}
                            iconElem={UserMinus}
                            iconClassName={styles.kickIcon}
                        >
                            <FormattedMessage
                                defaultMessage="Kick"
                                description="Kick user button"
                                id="gui.collaboration.kick"
                            />
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    renderPendingRequests (pendingRequests) {
        const {intl} = this.props;
        return (
            <div className={styles.requestsSection}>
                <h3 className={styles.sectionTitle}>
                    <FormattedMessage
                        defaultMessage="Join requests ({count})"
                        description="Pending requests section title"
                        id="gui.collaboration.pendingRequests"
                        values={{count: pendingRequests.length}}
                    />
                </h3>

                <div className={styles.requestsList}>
                    {pendingRequests.map(request => (
                        <div
                            key={request.id}
                            className={styles.requestItem}
                        >
                            <div className={styles.requesterInfo}>
                                {this.renderUserIcon(request, false)}
                                <span className={styles.username}>
                                    {request.username}
                                </span>
                            </div>

                            <div className={styles.requestActions}>
                                <Button
                                    className={styles.approveButton}
                                    aria-label={intl.formatMessage(messages.letUserWatch, {name: request.username})}
                                    onClick={this.handleApproveRequest.bind(
                                        this, request.id, request.username, 'watch'
                                    )}
                                >
                                    {intl.formatMessage(messages.letWatch)}
                                </Button>
                                <Button
                                    className={styles.approveButton}
                                    aria-label={intl.formatMessage(messages.letUserEdit, {name: request.username})}
                                    onClick={this.handleApproveRequest.bind(
                                        this, request.id, request.username, 'edit'
                                    )}
                                >
                                    {intl.formatMessage(messages.letEdit)}
                                </Button>
                                <Button
                                    className={styles.denyButton}
                                    aria-label={intl.formatMessage(messages.denyUser, {name: request.username})}
                                    onClick={this.handleDenyRequest.bind(this, request.id)}
                                >
                                    <FormattedMessage
                                        defaultMessage="Deny"
                                        description="Deny join request button"
                                        id="gui.collaboration.deny"
                                    />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    /* eslint-enable react/jsx-no-bind */

    renderConnectedStep () {
        const users = this.props.connectedUsers || [];
        const currentUser = users.find(user => user.id === this.props.currentUserId);
        const isHost = currentUser && currentUser.isHost;
        const pendingRequests = this.state.pendingRequests.filter(request =>
            !(this.props.projectPeerIds || []).includes(request.id));

        return (
            <Box className={styles.content}>
                <div className={styles.header}>
                    <CollaborationIcon
                        className={styles.headerIcon}
                        draggable={false}
                    />
                    <div className={styles.headerText}>
                        <FormattedMessage
                            defaultMessage="Room: {roomId}"
                            description="Connected room title"
                            id="gui.collaboration.connectedRoom"
                            values={{roomId: this.props.roomId}}
                        />
                    </div>
                </div>

                <div className={styles.connectedInfo}>
                    <div
                        className={styles.status}
                        role="status"
                        aria-live="polite"
                    >
                        <span
                            className={classNames(styles.statusIndicator, {
                                [styles.statusIndicatorReconnecting]: this.props.isReconnecting
                            })}
                        />
                        {this.props.isReconnecting ? this.props.intl.formatMessage(messages.reconnecting) : (
                            <FormattedMessage
                                // eslint-disable-next-line max-len
                                defaultMessage="Connected - {userCount} {userCount, plural, one {user} other {users}} online"
                                description="Connection status"
                                id="gui.collaboration.status"
                                values={{userCount: users.length}}
                            />
                        )}
                    </div>
                    {isHost && users.length < 2 && (
                        <div className={styles.statusHint}>
                            {this.props.intl.formatMessage(messages.aloneHint)}
                        </div>
                    )}
                </div>

                {!isHost && this.props.myRole === 'watch' && (
                    <div className={styles.usersSectionWrapper}>
                        {this.renderWatcherNotice()}
                    </div>
                )}

                <div className={styles.usersSectionWrapper}>
                    <div className={styles.usersSection}>
                        <h3 className={styles.sectionTitle}>
                            <FormattedMessage
                                defaultMessage="People here"
                                description="Users section title"
                                id="gui.collaboration.connectedUsers"
                            />
                        </h3>

                        <div className={styles.usersList}>
                            {users.map(user => this.renderUserRow(user, isHost))}
                        </div>
                    </div>
                </div>

                {isHost && pendingRequests.length > 0 && this.renderPendingRequests(pendingRequests)}

                {isHost && this.renderInviteSection()}

                <div className={styles.connectedActions}>
                    <Button
                        className={styles.dangerButton}
                        onClick={this.handleLeaveRoom}
                    >
                        {this.props.intl.formatMessage(isHost ? messages.endForEveryone : messages.leaveSession)}
                    </Button>
                </div>
            </Box>
        );
    }

    renderPendingApprovalStep () {
        return (
            <Box className={styles.content}>
                <div className={styles.header}>
                    <CollaborationIcon
                        className={styles.headerIcon}
                        draggable={false}
                    />
                    <div className={styles.headerText}>
                        <FormattedMessage
                            defaultMessage="Waiting for the host"
                            description="Title for pending approval state"
                            id="gui.collaboration.waitingApproval"
                        />
                    </div>
                </div>

                <div className={styles.description}>
                    <FormattedMessage
                        // eslint-disable-next-line max-len
                        defaultMessage="Your request to join this private room has been sent to the host. Please wait for approval."
                        description="Description for pending approval"
                        id="gui.collaboration.pendingApprovalDescription"
                    />
                </div>

                <div className={styles.buttonGroup}>
                    <Button
                        className={styles.secondaryButton}
                        onClick={this.handleCancelJoinRequest}
                    >
                        <FormattedMessage
                            defaultMessage="Cancel request"
                            description="Button to cancel join request"
                            id="gui.collaboration.cancelRequest"
                        />
                    </Button>
                </div>

                {this.state.error && (
                    <div
                        className={styles.error}
                        role="alert"
                    >
                        {this.state.error}
                    </div>
                )}
            </Box>
        );
    }

    /* eslint-disable react/jsx-handler-names */
    renderProjectSession () {
        const users = this.props.connectedUsers || [];
        const project = this.props.projectSession || {};
        const session = project.session;
        const pending = project.busy || ['joining', 'reconnecting'].includes(project.phase);
        const disabled = pending || project.checking || project.viewingCommit || Boolean(project.discoveryError);
        const progress = {
            opening: 'Opening your session…',
            joining: "Joining and loading the host's project…",
            leaving: 'Disconnecting and updating the online listing…',
            reconnecting: 'Connection lost. Reconnecting…'
        }[project.phase];
        let status = 'Working independently. Your live edits are not shared.';
        if (project.active) {
            status = project.isHost ?
                'Your session is open to collaborators.' : 'Connected. Your edits are syncing.';
        }
        if (progress) status = progress;
        if (project.checking) status = 'Checking project collaboration…';
        if (project.loadingProject) status = 'Loading project…';
        if (project.viewingCommit) status = 'Viewing a past commit. Open a branch to use live collaboration.';
        const others = (project.editors || []).filter(editor =>
            editor.username !== project.username?.toLowerCase());
        const otherNames = others.map(editor => editor.username).join(', ');
        let leaveLabel = project.isHost ? 'End live session for everyone' : 'Leave live session';
        if (project.phase === 'joining') leaveLabel = 'Cancel joining';
        if (project.busy) leaveLabel = 'Disconnecting…';
        return (
            <Box className={classNames(styles.content, styles.projectContent)}>
                <div className={styles.header}>
                    <CollaborationIcon
                        className={styles.headerIcon}
                        draggable={false}
                    />
                    <h2 className={styles.headerText}>{'Project collaboration'}</h2>
                </div>
                {project.branch && <p>{`Branch: ${project.branch}`}</p>}
                <div
                    className={styles.projectStatus}
                    role="status"
                    aria-live="polite"
                >{status}</div>
                {project.discoveryError && <p role="status">{project.discoveryError}</p>}
                {!project.discoveryError && others.length > 0 && (
                    <p>{`${otherNames} ${others.length === 1 ? 'is' : 'are'} also on this branch.`}</p>
                )}
                {session && !project.active && !project.checking && !project.discoveryError && (
                    <p>{session.public ? `${session.host} has opened a live session to collaborators.` :
                        `${session.host} is working privately.`}</p>
                )}
                {(project.error || (!project.active && this.props.connectionError)) && (
                    <div
                        className={styles.error}
                        role="alert"
                    >{project.error || this.props.connectionError}</div>
                )}
                <div className={styles.projectActions}>
                    {project.active && (
                        <Button
                            className={styles.secondaryButton}
                            disabled={project.busy}
                            onClick={this.handleProjectLeave}
                        >{leaveLabel}</Button>
                    )}
                    {!project.active && !session && project.canHost && (
                        <Button
                            className={styles.primaryButton}
                            disabled={disabled}
                            onClick={project.onHost}
                        >{project.phase === 'opening' ? 'Opening session…' : 'Open to collaborators'}</Button>
                    )}
                    {!project.active && session?.public && project.canJoin && (
                        <Button
                            className={styles.primaryButton}
                            disabled={disabled}
                            onClick={project.onJoin}
                        >{'Join session…'}</Button>
                    )}
                    {!project.active && (
                        <Button
                            className={styles.secondaryButton}
                            disabled={pending || project.checking}
                            onClick={this.props.onOpenBranches}
                        >{'Open branches…'}</Button>
                    )}
                </div>
                {!project.active && !project.checking && (
                    <p>{"Live sessions are open only to this project's collaborators. " +
                        'To work separately, create a branch in Project history.'}</p>
                )}
                {project.active && !project.isHost && this.props.myRole === 'watch' && this.renderWatcherNotice()}
                {project.active && project.phase === 'live' && (
                    <p>{users.length < 2 ? 'No one else has joined yet.' :
                        `${users.length} people in this session.`}</p>
                )}
                {project.active && (
                    <div className={styles.usersList}>
                        {users.map(user => this.renderUserRow(user, project.isHost))}
                    </div>
                )}
                {project.active && project.isHost && this.renderInviteSection()}
            </Box>
        );
    }
    /* eslint-enable react/jsx-handler-names */

    render () {
        let content;
        const projectMode = this.props.projectSession || this.props.projectSessionActive;
        switch (projectMode ? 'project' : this.state.connectionStep) {
        case 'project':
            content = this.renderProjectSession();
            break;
        case 'join':
            content = this.renderJoinStep();
            break;
        case 'connecting':
            content = this.renderConnectingStep();
            break;
        case 'connected':
            content = this.renderConnectedStep();
            break;
        case 'pending-approval':
            content = this.renderPendingApprovalStep();
            break;
        default:
            content = this.renderJoinStep();
        }

        return (
            <Modal
                visible={this.props.visible}
                className={styles.modalContent}
                onRequestClose={this.props.onRequestClose}
                contentLabel="Live Collaboration"
                id="collaborationModal"
                width={600}
                height={projectMode ? 560 : 720}
                resizable
            >
                <Box className={styles.body}>
                    {content}
                </Box>
            </Modal>
        );
    }
}

CollaborationModal.propTypes = {
    intl: intlShape.isRequired,
    onShowToast: PropTypes.func.isRequired,
    openSimpleDialog: PropTypes.func.isRequired,
    projectSession: PropTypes.object,
    onOpenBranches: PropTypes.func,
    projectSessionActive: PropTypes.bool,
    projectPeerIds: PropTypes.arrayOf(PropTypes.string),
    visible: PropTypes.bool,
    currentUsername: PropTypes.string,
    currentUserId: PropTypes.string,
    isConnected: PropTypes.bool,
    isReconnecting: PropTypes.bool,
    roomId: PropTypes.string,
    inviteLink: PropTypes.string,
    inviteRole: PropTypes.oneOf(['watch', 'edit']),
    myRole: PropTypes.oneOf(['watch', 'edit']),
    pendingInvite: PropTypes.string,
    connectedUsers: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        username: PropTypes.string.isRequired,
        handle: PropTypes.string,
        isHost: PropTypes.bool,
        role: PropTypes.oneOf(['watch', 'edit'])
    })),
    connectionError: PropTypes.string,
    roturHandle: PropTypes.string,
    // eslint-disable-next-line react/forbid-prop-types
    userActivity: PropTypes.object,
    // eslint-disable-next-line react/forbid-prop-types
    vm: PropTypes.object,
    onRequestClose: PropTypes.func.isRequired,
    onJoinRoom: PropTypes.func.isRequired,
    onCreateRoom: PropTypes.func.isRequired,
    onLeaveRoom: PropTypes.func.isRequired,
    onKickUser: PropTypes.func.isRequired,
    onCancelConnection: PropTypes.func.isRequired,
    onApproveJoinRequest: PropTypes.func,
    onDenyJoinRequest: PropTypes.func,
    onCancelJoinRequest: PropTypes.func,
    onChangeInviteRole: PropTypes.func,
    onChangeUserRole: PropTypes.func,
    onOpenChangeUsername: PropTypes.func
};

export default injectIntl(CollaborationModal);
