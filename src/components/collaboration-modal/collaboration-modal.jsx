import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, intlShape } from 'react-intl';
import classNames from 'classnames';

import Modal from '../../containers/windowed-modal.jsx';
import Box from '../box/box.jsx';
import Button from '../button/button.jsx';
import BufferedInputHOC from '../forms/buffered-input-hoc.jsx';
import Input from '../forms/input.jsx';
import FancyCheckbox from '../tw-fancy-checkbox/checkbox.jsx';

const BufferedInput = BufferedInputHOC(Input);

import {Handshake as CollaborationIcon, User, Crown, UserMinus, Copy} from 'lucide-react'

import styles from './collaboration-modal.css';

class CollaborationModal extends Component {
    constructor(props) {
        super(props);
        
        this.state = {
            roomId: '',
            isConnecting: false,
            connectionStep: 'join', // 'join', 'connecting', 'connected', 'pending-approval'
            error: null,
            pendingRequests: [], // Array of join requests for private rooms
            showJoinRequest: false // Show join request dialog for private rooms
        };
        
        // Track whether we've attempted auto-join for specific room IDs to prevent loops
        this.autoJoinAttempted = new Set();
        
        this.handleRoomIdChange = this.handleRoomIdChange.bind(this);
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
    }

    componentDidMount() {
        console.log('[COLLAB MODAL] ComponentDidMount - props:', {
            roomId: this.props.roomId,
            isConnected: this.props.isConnected,
            currentUsername: this.props.currentUsername
        });
        
        if (this.props.isConnected) {
            this.setState({ connectionStep: 'connected' });
        }
        
        // Check if there's already a room ID set (from URL parameter handling)
        if (this.props.roomId && !this.props.isConnected) {
            console.log('[COLLAB MODAL] Auto-joining room from URL:', this.props.roomId);
            this.setState({ 
                roomId: this.props.roomId,
                username: this.props.currentUsername || this.state.username
            });
            
            // Automatically attempt to join the room without confirmation
            setTimeout(() => {
                this.attemptAutoJoin(this.props.roomId, this.props.currentUsername);
            }, 100);
        }
        
        // Set up collaboration service event listeners
        if (typeof window !== 'undefined' && window.CollaborationService) {
            try {
                const service = window.CollaborationService.getInstance();
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

    componentWillUnmount() {
        // Clean up collaboration service event listeners
        if (typeof window !== 'undefined' && window.CollaborationService) {
            try {
                const service = window.CollaborationService.getInstance();
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
        
        // Clear auto-join tracking
        this.autoJoinAttempted.clear();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.isConnected !== this.props.isConnected) {
            this.setState({
                connectionStep: this.props.isConnected ? 'connected' : 'join',
                isConnecting: false,
                error: null
            });
            
            // Clear auto-join tracking when disconnected
            if (!this.props.isConnected) {
                this.autoJoinAttempted.clear();
            }
        }
        
        // Reset to join screen when connection is cancelled (roomId becomes null and not connected)
        if (prevProps.roomId !== this.props.roomId && !this.props.roomId && !this.props.isConnected) {
            this.setState({
                connectionStep: 'join',
                isConnecting: false,
                error: null
            });
        }

        if (prevProps.connectionError !== this.props.connectionError && this.props.connectionError) {
            this.setState({
                error: this.props.connectionError,
                isConnecting: false,
                connectionStep: 'join'
            });
        }

        // Handle room ID prop changes (e.g., when set from URL after component mounts)
        if (prevProps.roomId !== this.props.roomId && this.props.roomId && !this.props.isConnected) {
            console.log('Room ID prop changed, updating local state:', this.props.roomId);
            this.setState({ 
                roomId: this.props.roomId 
            });
            
            // Only attempt auto-join if we haven't already tried this room ID AND
            // this is a transition from no room ID to having a room ID (indicating URL param processing)
            const roomIdKey = `${this.props.roomId}-${this.props.currentUsername}`;
            if (!prevProps.roomId && this.props.roomId && this.props.currentUsername && 
                !this.autoJoinAttempted.has(roomIdKey)) {
                console.log('Auto-joining room after prop update:', this.props.roomId);
                this.autoJoinAttempted.add(roomIdKey);
                setTimeout(() => {
                    this.attemptAutoJoin(this.props.roomId, this.props.currentUsername);
                }, 100);
            }
        }

        // Update pending requests from collaboration service
        if (this.props.visible && typeof window !== 'undefined' && window.CollaborationService) {
            try {
                const service = window.CollaborationService.getInstance();
                if (service && service.getPendingJoinRequests) {
                    const pendingRequests = service.getPendingJoinRequests();
                    if (JSON.stringify(pendingRequests) !== JSON.stringify(this.state.pendingRequests)) {
                        this.setState({ pendingRequests });
                    }
                }
            } catch (error) {
                // Ignore errors accessing collaboration service
            }
        }
    }

    handleRoomIdChange(roomId) {
        this.setState({ roomId });
    }

    async handleJoinRoom() {
        if (!this.state.roomId.trim()) {
            this.setState({ error: 'Please enter a room ID' });
            return;
        }

        this.setState({ 
            isConnecting: true, 
            connectionStep: 'connecting',
            error: null 
        });

        try {
            await this.props.onJoinRoom(this.state.roomId.trim(), this.props.currentUsername);
        } catch (error) {
            this.setState({ 
                error: error.message || 'Failed to join room',
                isConnecting: false,
                connectionStep: 'join'
            });
        }
    }

    async handleCreateRoom() {
        const roomCode = this.generateRoomCode();
        
        this.setState({ 
            isConnecting: true, 
            connectionStep: 'connecting',
            error: null 
        });

        try {
            await this.props.onCreateRoom(roomCode, this.props.currentUsername, 'public');
            
            // Update URL to include room code for easy sharing (no username)
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('room', roomCode);
            // Remove username from URL - we use the stored one
            currentUrl.searchParams.delete('username');
            window.history.replaceState(null, null, currentUrl.toString());
            
            this.setState({ roomId: roomCode });
            
        } catch (error) {
            this.setState({ 
                error: error.message || 'Failed to create room',
                isConnecting: false,
                connectionStep: 'join'
            });
        }
    }

    handleLeaveRoom() {
        this.props.onLeaveRoom();
        this.setState({ 
            connectionStep: 'join',
            roomId: '',
            error: null
        });
    }

    handleKickUser(userId) {
        this.props.onKickUser(userId);
    }

    handleCopyRoomUrl() {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('room', this.props.roomId);
        // Remove username from URL - we use the stored one
        currentUrl.searchParams.delete('username');
        const roomUrl = currentUrl.toString();
        
        // Check if clipboard API is available
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(roomUrl).then(() => {
                console.log('Room URL copied to clipboard');
                alert('Room URL copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy room URL:', err);
                this.fallbackCopyToClipboard(roomUrl);
            });
        } else {
            // Fallback for older browsers or insecure contexts
            this.fallbackCopyToClipboard(roomUrl);
        }
    }

    fallbackCopyToClipboard(text) {
        // Create a temporary textarea element
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
                alert('Room URL copied to clipboard!');
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

    showUrlPrompt(text) {
        // Last resort: show the URL in a prompt for manual copying
        prompt('Copy this room URL to share:', text);
    }

    generateRoomCode() {
        // Generate a random room code
        const adjectives = ['cool', 'fun', 'epic', 'wild', 'neat', 'rad', 'hot', 'ice', 'big', 'tiny'];
        const nouns = ['cat', 'dog', 'owl', 'fox', 'bee', 'ant', 'fish', 'bird', 'frog', 'duck'];
        
        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        
        return `${randomAdjective}-${randomNoun}-${randomNum}`;
    }

    async attemptAutoJoin(roomCode, username) {
        console.log(`Attempting to auto-join room "${roomCode}" as "${username}"`);
        
        if (!roomCode) {
            console.error('attemptAutoJoin called with null/undefined roomCode');
            this.setState({ 
                error: 'No room code provided',
                isConnecting: false,
                connectionStep: 'join'
            });
            return;
        }
        
        if (!username) {
            console.error('attemptAutoJoin called with null/undefined username');
            this.setState({ 
                error: 'Username not available',
                isConnecting: false,
                connectionStep: 'join'
            });
            return;
        }
        
        this.setState({ 
            isConnecting: true, 
            connectionStep: 'connecting',
            error: null 
        });

        try {
            // First, try to join the existing room
            await this.props.onJoinRoom(roomCode, username);
            console.log(`Successfully joined room "${roomCode}"`);
        } catch (error) {
            console.log(`Failed to join room "${roomCode}":`, error.message);
            
            // For auto-join from URL, automatically try to create the room
            // if it doesn't exist, without asking for confirmation
            try {
                console.log(`Auto-creating room "${roomCode}" since it doesn't exist`);
                await this.props.onCreateRoom(roomCode, username);
                console.log(`Successfully created room "${roomCode}"`);
            } catch (createError) {
                console.error(`Failed to create room "${roomCode}":`, createError.message);
                
                // Clear the auto-join attempt tracking for this room since it failed
                const roomIdKey = `${roomCode}-${username}`;
                this.autoJoinAttempted.delete(roomIdKey);
                
                this.setState({ 
                    error: `Room "${roomCode}" doesn't exist and couldn't be created: ${createError.message || 'Unknown error'}`,
                    isConnecting: false,
                    connectionStep: 'join'
                });
            }
        }
    }


    async handleApproveRequest(requesterId, requesterUsername) {
        try {
            await this.props.onApproveJoinRequest(requesterId, requesterUsername);
            // Remove the request from pending list
            this.setState(prevState => ({
                pendingRequests: prevState.pendingRequests.filter(req => req.id !== requesterId)
            }));
        } catch (error) {
            console.error('Failed to approve join request:', error);
            this.setState({ error: 'Failed to approve join request' });
        }
    }

    async handleDenyRequest(requesterId) {
        try {
            await this.props.onDenyJoinRequest(requesterId);
            // Remove the request from pending list
            this.setState(prevState => ({
                pendingRequests: prevState.pendingRequests.filter(req => req.id !== requesterId)
            }));
        } catch (error) {
            console.error('Failed to deny join request:', error);
            this.setState({ error: 'Failed to deny join request' });
        }
    }

    handleCancelJoinRequest() {
        if (this.props.onCancelJoinRequest) {
            this.props.onCancelJoinRequest();
        }
        
        // Disconnect from the collaboration service
        if (typeof window !== 'undefined' && window.CollaborationService) {
            try {
                const service = window.CollaborationService.getInstance();
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

    handleAwaitingApproval() {
        console.log('[COLLAB MODAL] Awaiting approval from host', { 
            isConnected: this.props.isConnected, 
            connectionStep: this.state.connectionStep 
        });
        
        // Always show pending approval screen when this event is emitted
        // This event is only emitted when we actually need approval
        // The collaboration service will emit approval-resolved quickly for public rooms
        this.setState({ 
            connectionStep: 'pending-approval',
            isConnecting: false,
            error: null
        });
    }

    handleApprovalResolved() {
        console.log('[COLLAB MODAL] Approval resolved', { 
            isConnected: this.props.isConnected, 
            connectionStep: this.state.connectionStep 
        });
        
        // Clear the pending approval state - let the componentDidUpdate handle the connected state
        this.setState({ 
            connectionStep: this.props.isConnected ? 'connected' : 'connecting',
            error: null
        });
    }

    handleJoinDenied(reason) {
        console.log('[COLLAB MODAL] Join request denied:', reason);
        this.setState({ 
            connectionStep: 'join',
            isConnecting: false,
            error: `Join request denied: ${reason}`
        });
    }

    async handleChangeCurrentRoomPrivacy(newPrivacy) {
        try {
            await this.props.onChangeRoomPrivacy(newPrivacy);
        } catch (error) {
            console.error('Failed to change room privacy:', error);
            this.setState({ error: 'Failed to change room privacy' });
        }
    }

    handleJoinRequestEvent(data) {
        console.log('[COLLAB MODAL] Join request event received:', data);
        // Update the pending requests from the service
        if (typeof window !== 'undefined' && window.CollaborationService) {
            try {
                const service = window.CollaborationService.getInstance();
                if (service && service.getPendingJoinRequests) {
                    const pendingRequests = service.getPendingJoinRequests();
                    console.log('[COLLAB MODAL] Updated pending requests:', pendingRequests);
                    this.setState({ pendingRequests });
                }
            } catch (error) {
                console.warn('Could not get pending requests:', error);
            }
        }
    }

    renderJoinStep() {
        return (
            <Box className={styles.content}>
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
                    <FormattedMessage
                        defaultMessage="You will be known as: {username}"
                        description="Shows current username"
                        id="gui.collaboration.currentUsername"
                        values={{username: this.props.currentUsername}}
                    />
                </div>

                <div className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>
                            <FormattedMessage
                                defaultMessage="Room ID"
                                description="Label for room ID input"
                                id="gui.collaboration.roomId"
                            />
                        </label>
                        <BufferedInput
                            className={styles.input}
                            placeholder="Enter room ID..."
                            value={this.state.roomId}
                            onSubmit={this.handleRoomIdChange}
                        />
                    </div>



                    <div className={styles.buttonGroup}>
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
                        
                        <Button
                            className={styles.secondaryButton}
                            onClick={this.handleCreateRoom}
                            disabled={this.state.isConnecting}
                        >
                            <FormattedMessage
                                defaultMessage="Create New Room"
                                description="Button to create new collaboration room"
                                id="gui.collaboration.createRoom"
                            />
                        </Button>
                    </div>
                </div>

                {this.state.error && (
                    <div className={styles.error}>
                        {this.state.error}
                    </div>
                )}
            </Box>
        );
    }

    renderConnectingStep() {
        return (
            <Box className={styles.content}>
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
                            onClick={() => {
                                // Reset modal state immediately
                                this.setState({
                                    connectionStep: 'join',
                                    isConnecting: false,
                                    error: null
                                });
                                // Then call the cancel handler
                                this.props.onCancelConnection();
                            }}
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

    renderConnectedStep() {
        const users = this.props.connectedUsers || [];
        const currentUser = users.find(user => user.id === this.props.currentUserId);
        const isHost = currentUser && currentUser.isHost;

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
                            values={{ roomId: this.props.roomId }}
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
                            values={{ userCount: users.length }}
                        />
                    </div>
                </div>

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
                                {user.isHost ? (
                                    <div className={styles.userIcon}>
                                        <User className={styles.userIconSvg} />
                                        <Crown className={styles.hostCrown} />
                                    </div>
                                ) : (
                                    <User className={styles.userIcon} />
                                )}
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
                                </span>
                                
                                {isHost && user.id !== this.props.currentUserId && (
                                    <Button
                                        className={styles.kickButton}
                                        onClick={() => this.handleKickUser(user.id)}
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

                {/* Room Privacy Settings for Host */}
                {isHost && (
                    <div className={styles.privacySection}>
                        <h3 className={styles.sectionTitle}>
                            <FormattedMessage
                                defaultMessage="Room Privacy"
                                description="Room privacy section title"
                                id="gui.collaboration.roomPrivacySettings"
                            />
                        </h3>

                        <div className={styles.privacySelector}>
                            <label className={styles.radioLabel}>
                                <FancyCheckbox
                                    className={styles.checkbox}
                                    checked={this.props.roomPrivacy === 'public'}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            this.handleChangeCurrentRoomPrivacy('public');
                                        }
                                    }}
                                />
                                <span className={styles.radioText}>
                                    <FormattedMessage
                                        defaultMessage="Public - Anyone can join"
                                        description="Public room privacy option"
                                        id="gui.collaboration.publicRoom"
                                    />
                                </span>
                            </label>
                            <label className={styles.radioLabel}>
                                <FancyCheckbox
                                    className={styles.checkbox}
                                    checked={this.props.roomPrivacy === 'private'}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            this.handleChangeCurrentRoomPrivacy('private');
                                        }
                                    }}
                                />
                                <span className={styles.radioText}>
                                    <FormattedMessage
                                        defaultMessage="Private - Requires host approval"
                                        description="Private room privacy option"
                                        id="gui.collaboration.privateRoom"
                                    />
                                </span>
                            </label>
                        </div>
                    </div>
                )}

                {/* Show pending join requests for hosts */}
                {isHost && this.state.pendingRequests.length > 0 && (
                    <div className={styles.requestsSection}>
                        <h3 className={styles.sectionTitle}>
                            <FormattedMessage
                                defaultMessage="Pending Join Requests"
                                description="Pending requests section title"
                                id="gui.collaboration.pendingRequests"
                            />
                        </h3>

                        <div className={styles.requestsList}>
                            {this.state.pendingRequests.map(request => (
                                <div key={request.id} className={styles.requestItem}>
                                    <div className={styles.requesterInfo}>
                                        <User className={styles.userIcon} />
                                        <span className={styles.username}>
                                            {request.username}
                                        </span>
                                    </div>
                                    
                                    <div className={styles.requestActions}>
                                        <Button
                                            className={styles.approveButton}
                                            onClick={() => this.handleApproveRequest(request.id, request.username)}
                                        >
                                            <FormattedMessage
                                                defaultMessage="Approve"
                                                description="Approve join request button"
                                                id="gui.collaboration.approve"
                                            />
                                        </Button>
                                        <Button
                                            className={styles.denyButton}
                                            onClick={() => this.handleDenyRequest(request.id)}
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
                )}

                <div className={styles.buttonGroup}>
                    <Button
                        className={styles.primaryButton}
                        onClick={this.handleCopyRoomUrl}
                        iconElem={Copy}
                        iconClassName={styles.buttonIcon}
                    >
                        <FormattedMessage
                            defaultMessage="Copy Room URL"
                            description="Button to copy room URL for sharing"
                            id="gui.collaboration.copyRoomUrl"
                        />
                    </Button>
                    
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

    renderPendingApprovalStep() {
        return (
            <Box className={styles.content}>
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

    render() {
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
        isHost: PropTypes.bool
    })),
    connectionError: PropTypes.string,
    onRequestClose: PropTypes.func.isRequired,
    onJoinRoom: PropTypes.func.isRequired,
    onCreateRoom: PropTypes.func.isRequired,
    onLeaveRoom: PropTypes.func.isRequired,
    onKickUser: PropTypes.func.isRequired,
    onChangeUsername: PropTypes.func.isRequired,
    onCancelConnection: PropTypes.func.isRequired,
    onApproveJoinRequest: PropTypes.func,
    onDenyJoinRequest: PropTypes.func,
    onCancelJoinRequest: PropTypes.func,
    onChangeRoomPrivacy: PropTypes.func,
    intl: intlShape.isRequired
};

export default injectIntl(CollaborationModal);
