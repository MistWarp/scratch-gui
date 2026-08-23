import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {FormattedMessage, injectIntl} from 'react-intl';
import classNames from 'classnames';

import Modal from '../../containers/windowed-modal.jsx';
import Box from '../box/box.jsx';
import Button from '../button/button.jsx';
import Input from '../forms/input.jsx';

import {Handshake as CollaborationIcon, User, Crown, UserMinus, Copy, AlertTriangle, PenLine} from 'lucide-react';

import showAlert from '../../addons/window-system/alert';
import CollaborationService from '../../lib/collaboration/index.js';
import {avatarForCollabUser} from '../../lib/collaboration/avatar.js';
import describeActivity from '../../lib/collaboration/describe-activity.js';

import styles from './collaboration-modal.css';

class CollaborationModal extends Component {
    constructor (props) {
        super(props);

        this.state = {
            roomId: props.roomId || '',
            isConnecting: false,
            connectionStep: props.isConnected ? 'connected' : 'join',
            error: null,
            pendingRequests: [],
            showJoinRequest: false,
            privacyBusy: false
        };

        this._autoJoinKey = null;
        this._privacyPromise = null;

        this.handleRoomIdChange = this.handleRoomIdChange.bind(this);
        this.handleRoomIdKeyPress = this.handleRoomIdKeyPress.bind(this);
        this.maybeAutoJoin = this.maybeAutoJoin.bind(this);
        this.handleJoinRoom = this.handleJoinRoom.bind(this);
        this.handleCreateRoom = this.handleCreateRoom.bind(this);
        this.handleLeaveRoom = this.handleLeaveRoom.bind(this);
        this.handleKickUser = this.handleKickUser.bind(this);
        this.handleCopyRoomUrl = this.handleCopyRoomUrl.bind(this);
        this.fallbackCopyToClipboard = this.fallbackCopyToClipboard.bind(this);
        this.showUrlPrompt = this.showUrlPrompt.bind(this);
        this.generateRoomCode = this.generateRoomCode.bind(this);
        this.attemptAutoJoin = this.attemptAutoJoin.bind(this);
        this.handleApproveRequest = this.handleApproveRequest.bind(this);
        this.handleDenyRequest = this.handleDenyRequest.bind(this);
        this.handleCancelJoinRequest = this.handleCancelJoinRequest.bind(this);
        this.handleChangeCurrentRoomPrivacy = this.handleChangeCurrentRoomPrivacy.bind(this);
        this.handleJoinRequestEvent = this.handleJoinRequestEvent.bind(this);
        this.handleAwaitingApproval = this.handleAwaitingApproval.bind(this);
        this.handleApprovalResolved = this.handleApprovalResolved.bind(this);
        this.handleJoinDenied = this.handleJoinDenied.bind(this);
        this.resetToJoinScreen = this.resetToJoinScreen.bind(this);
        this.handleCancelClick = this.handleCancelClick.bind(this);
        this.handleSelectPublicPrivacy = this.handleSelectPublicPrivacy.bind(this);
        this.handleSelectPrivatePrivacy = this.handleSelectPrivatePrivacy.bind(this);
    }

    componentDidMount () {
        this.maybeAutoJoin();

        if (CollaborationService) {
            try {
                const service = CollaborationService.getInstance();
                if (service) {
                    service.on('join-request-received', this.handleJoinRequestEvent);
                    service.on('awaiting-approval', this.handleAwaitingApproval);
                    service.on('approval-resolved', this.handleApprovalResolved);
                    service.on('join-denied', this.handleJoinDenied);
                }
            } catch (error) {
                console.warn('Could not set up collaboration service event listeners:', error);
            }
        }
    }

    componentDidUpdate (prevProps) {
        if (prevProps.isConnected !== this.props.isConnected) {
            this.setState({
                connectionStep: this.props.isConnected ? 'connected' : 'join',
                isConnecting: false,
                error: null
            });
        }

        if (prevProps.roomId !== this.props.roomId) {
            if (this.props.roomId) {
                this.setState({roomId: this.props.roomId});
            } else {
                this._autoJoinKey = null;
                if (!this.props.isConnected) this.resetToJoinScreen();
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

        if (this.props.visible && CollaborationService) {
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

    componentWillUnmount () {
        if (CollaborationService) {
            try {
                const service = CollaborationService.getInstance();
                if (service) {
                    service.off('join-request-received', this.handleJoinRequestEvent);
                    service.off('awaiting-approval', this.handleAwaitingApproval);
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

    handleSelectPublicPrivacy () {
        return this.handleChangeCurrentRoomPrivacy('public');
    }

    handleSelectPrivatePrivacy () {
        return this.handleChangeCurrentRoomPrivacy('private');
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
            this.setState({error: 'Please enter a room ID'});
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
            await this.props.onCreateRoom(roomCode, this.props.currentUsername, 'public');

            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('room', roomCode);
            currentUrl.searchParams.delete('username');
            window.history.replaceState(null, null, currentUrl.toString());

            this.setState({roomId: roomCode});

        } catch (error) {
            this.setState({
                error: error.message || 'Failed to create room',
                connectionStep: 'join'
            });
        } finally {
            this.setState({isConnecting: false});
        }
    }

    handleLeaveRoom () {
        this.props.onLeaveRoom();
        this.setState({
            connectionStep: 'join',
            roomId: '',
            error: null
        });
    }

    handleKickUser (userId) {
        this.props.onKickUser(userId);
    }

    handleCopyRoomUrl () {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('room', this.props.roomId);
        currentUrl.searchParams.delete('username');
        const roomUrl = currentUrl.toString();

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(roomUrl).then(() => {
                console.log('Room URL copied to clipboard');
                showAlert('Room URL copied to clipboard!');
            })
                .catch(err => {
                    console.error('Failed to copy room URL:', err);
                    this.fallbackCopyToClipboard(roomUrl);
                });
        } else {
            this.fallbackCopyToClipboard(roomUrl);
        }
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
                console.log('Room URL copied to clipboard (fallback)');
                showAlert('Room URL copied to clipboard!');
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
        console.log('Room URL:', text);
        showAlert(
            'Could not copy room URL to clipboard. The URL has been logged to the console for manual copying.'
        );
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
            await this.props.onJoinRoom(roomCode, username);
        } catch (error) {
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


    async handleApproveRequest (requesterId, requesterUsername) {
        try {
            await this.props.onApproveJoinRequest(requesterId, requesterUsername);
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
        console.log('[COLLAB MODAL] Awaiting approval from host', {
            isConnected: this.props.isConnected,
            connectionStep: this.state.connectionStep
        });

        this.setState({
            connectionStep: 'pending-approval',
            isConnecting: false,
            error: null
        });
    }

    handleApprovalResolved () {
        console.log('[COLLAB MODAL] Approval resolved', {
            isConnected: this.props.isConnected,
            connectionStep: this.state.connectionStep
        });

        this.setState({
            connectionStep: this.props.isConnected ? 'connected' : 'connecting',
            error: null
        });
    }

    handleJoinDenied (reason) {
        console.log('[COLLAB MODAL] Join request denied:', reason);
        this.setState({
            connectionStep: 'join',
            isConnecting: false,
            error: `Join request denied: ${reason}`
        });
    }

    async handleChangeCurrentRoomPrivacy (newPrivacy) {
        if (this._privacyPromise || newPrivacy === this.props.roomPrivacy) return this._privacyPromise;

        this.setState({privacyBusy: true, error: null});
        const request = Promise.resolve().then(() => this.props.onChangeRoomPrivacy(newPrivacy));
        this._privacyPromise = request;
        try {
            await request;
        } catch (error) {
            console.error('Failed to change room privacy:', error);
            this.setState({error: 'Failed to change room privacy'});
        } finally {
            if (this._privacyPromise === request) this._privacyPromise = null;
            this.setState({privacyBusy: false});
        }
    }

    handleJoinRequestEvent (data) {
        console.log('[COLLAB MODAL] Join request event received:', data);
        if (CollaborationService) {
            try {
                const service = CollaborationService.getInstance();
                if (service && service.getPendingJoinRequests) {
                    const pendingRequests = service.getPendingJoinRequests();
                    console.log('[COLLAB MODAL] Updated pending requests:', pendingRequests);
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
                    <strong>{'Alpha: '}</strong>
                    {'This feature is in early development. Your projects may get corrupted or broken.'}
                </div>
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
                            defaultMessage="Live Collaboration"
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
                            title="Change username"
                        >
                            <PenLine size={16} />
                        </button>
                    )}
                </div>

                <div className={styles.roomActions}>
                    <div className={styles.joinSection}>
                        <h3 className={styles.sectionTitle}>
                            <FormattedMessage
                                defaultMessage="Join an Existing Room"
                                description="Join room section title"
                                id="gui.collaboration.joinTitle"
                            />
                        </h3>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>
                                <FormattedMessage
                                    defaultMessage="Room ID"
                                    description="Label for room ID input"
                                    id="gui.collaboration.roomId"
                                />
                            </label>
                            <Input
                                className={styles.input}
                                placeholder="Enter room ID..."
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
                                defaultMessage="Join Room"
                                description="Button to join collaboration room"
                                id="gui.collaboration.joinRoom"
                            />
                        </Button>
                        {this.state.error && (
                            <div className={styles.joinError}>
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
                                defaultMessage="Create a New Room"
                                description="Create room section title"
                                id="gui.collaboration.createTitle"
                            />
                        </h3>
                        <div className={styles.createDescription}>
                            <FormattedMessage
                                defaultMessage="Host a room and share its URL to invite people."
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
                                    defaultMessage="Create New Room"
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
                {this.renderAlphaBanner()}
                <div className={styles.connecting}>
                    <div className={styles.spinner} />
                    <FormattedMessage
                        defaultMessage="Connecting to room..."
                        description="Connecting message"
                        id="gui.collaboration.connecting"
                    />
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

    renderConnectedStep () {
        const users = this.props.connectedUsers || [];
        const currentUser = users.find(user => user.id === this.props.currentUserId);
        const isHost = currentUser && currentUser.isHost;

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
                            defaultMessage="Room: {roomId}"
                            description="Connected room title"
                            id="gui.collaboration.connectedRoom"
                            values={{roomId: this.props.roomId}}
                        />
                    </div>
                </div>

                <div className={styles.connectedInfo}>
                    <div className={styles.status}>
                        <span className={styles.statusIndicator} />
                        <FormattedMessage
                            defaultMessage="Connected - {userCount} {userCount, plural, one {user} other {users}} online"
                            description="Connection status"
                            id="gui.collaboration.status"
                            values={{userCount: users.length}}
                        />
                    </div>
                </div>

                <div className={styles.usersSectionWrapper}>
                    <div className={styles.usersSection}>
                        <h3 className={styles.sectionTitle}>
                            <FormattedMessage
                                defaultMessage="Connected Users"
                                description="Users section title"
                                id="gui.collaboration.connectedUsers"
                            />
                        </h3>

                        <div className={styles.usersList}>
                            {users.map(user => (
                                <div
                                    key={user.id}
                                    className={classNames(styles.userItem, {
                                        [styles.currentUser]: user.id === this.props.currentUserId
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
                                        {user.id === this.props.currentUserId && (
                                            <span className={styles.youBadge}>
                                                <FormattedMessage
                                                    defaultMessage="You"
                                                    description="You badge"
                                                    id="gui.collaboration.you"
                                                />
                                            </span>
                                        )}
                                        {this.describeActivity(user.id) && (
                                            <span className={styles.userActivity}>
                                                {this.describeActivity(user.id)}
                                            </span>
                                        )}
                                    </span>

                                    {isHost && user.id !== this.props.currentUserId && (
                                        <Button
                                            className={styles.kickButton}
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
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {isHost && this.state.pendingRequests.length > 0 && (
                    <>
                        <div className={styles.requestsSection}>
                            <h3 className={styles.sectionTitle}>
                                <FormattedMessage
                                    defaultMessage="Pending Join Requests ({count})"
                                    description="Pending requests section title"
                                    id="gui.collaboration.pendingRequests"
                                    values={{count: this.state.pendingRequests.length}}
                                />
                            </h3>

                            <div className={styles.requestsList}>
                                {this.state.pendingRequests.map(request => (
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
                                                onClick={this.handleApproveRequest.bind(this, request.id, request.username)}
                                            >
                                                <FormattedMessage
                                                    defaultMessage="Approve"
                                                    description="Approve join request button"
                                                    id="gui.collaboration.approve"
                                                />
                                            </Button>
                                            <Button
                                                className={styles.denyButton}
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
                    </>
                )}

                {isHost && (
                    <div className={styles.privacySection}>
                        <h3 className={styles.sectionTitle}>
                            <FormattedMessage
                                defaultMessage="Room Privacy"
                                description="Room privacy section title"
                                id="gui.collaboration.roomPrivacySettings"
                            />
                        </h3>

                        <div
                            className={styles.privacySelector}
                            role="radiogroup"
                        >
                            <button
                                className={classNames(styles.privacyOption, {
                                    [styles.privacyOptionActive]: this.props.roomPrivacy === 'public'
                                })}
                                disabled={this.state.privacyBusy}
                                role="radio"
                                aria-checked={this.props.roomPrivacy === 'public'}
                                aria-busy={this.state.privacyBusy || null}
                                onClick={this.handleSelectPublicPrivacy}
                                type="button"
                            >
                                <div className={styles.privacyCardTitle}>
                                    <FormattedMessage
                                        defaultMessage="Public Room"
                                        description="Public room card title"
                                        id="gui.collaboration.publicRoom"
                                    />
                                </div>
                                <div className={styles.privacyCardDesc}>
                                    <FormattedMessage
                                        defaultMessage="Anyone can join this room without approval"
                                        description="Public room explanation"
                                        id="gui.collaboration.publicRoomDesc"
                                    />
                                </div>
                            </button>
                            <button
                                className={classNames(styles.privacyOption, {
                                    [styles.privacyOptionActive]: this.props.roomPrivacy === 'private'
                                })}
                                disabled={this.state.privacyBusy}
                                role="radio"
                                aria-checked={this.props.roomPrivacy === 'private'}
                                aria-busy={this.state.privacyBusy || null}
                                onClick={this.handleSelectPrivatePrivacy}
                                type="button"
                            >
                                <div className={styles.privacyCardTitle}>
                                    <FormattedMessage
                                        defaultMessage="Private Room"
                                        description="Private room card title"
                                        id="gui.collaboration.privateRoom"
                                    />
                                </div>
                                <div className={styles.privacyCardDesc}>
                                    <FormattedMessage
                                        defaultMessage="Users must request approval to join this room"
                                        description="Private room explanation"
                                        id="gui.collaboration.privateRoomDesc"
                                    />
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                <div className={styles.connectedActions}>
                    <div className={styles.primaryActions}>
                        <Button
                            className={styles.primaryButton}
                            onClick={this.handleCopyRoomUrl}
                            iconElem={Copy}
                            iconClassName={styles.buttonIcon}
                        >
                            <FormattedMessage
                                defaultMessage="Copy Room URL to Share"
                                description="Button to copy room URL for sharing"
                                id="gui.collaboration.copyRoomUrl"
                            />
                        </Button>
                    </div>

                    <Button
                        className={styles.dangerButton}
                        onClick={this.handleLeaveRoom}
                    >
                        <FormattedMessage
                            defaultMessage="Leave Room"
                            description="Button to leave collaboration room"
                            id="gui.collaboration.leaveRoom"
                        />
                    </Button>
                </div>
            </Box>
        );
    }

    renderPendingApprovalStep () {
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
                            defaultMessage="Waiting for Host Approval"
                            description="Title for pending approval state"
                            id="gui.collaboration.waitingApproval"
                        />
                    </div>
                </div>

                <div className={styles.description}>
                    <FormattedMessage
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
                            defaultMessage="Cancel Request"
                            description="Button to cancel join request"
                            id="gui.collaboration.cancelRequest"
                        />
                    </Button>
                </div>

                {this.state.error && (
                    <div className={styles.error}>
                        {this.state.error}
                    </div>
                )}
            </Box>
        );
    }

    render () {
        let content;
        switch (this.state.connectionStep) {
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
                height={720}
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
    visible: PropTypes.bool,
    currentUsername: PropTypes.string,
    currentUserId: PropTypes.string,
    isConnected: PropTypes.bool,
    roomId: PropTypes.string,
    roomPrivacy: PropTypes.string,
    connectedUsers: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        username: PropTypes.string.isRequired,
        handle: PropTypes.string,
        isHost: PropTypes.bool
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
    onChangeRoomPrivacy: PropTypes.func
};

export default injectIntl(CollaborationModal);
