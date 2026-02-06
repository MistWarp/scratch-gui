import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';

import CollaborationModal from '../components/collaboration-modal/collaboration-modal.jsx';
import CollaborationService from '../lib/collaboration-service.js';
import ToastSystem from '../lib/toast-system.js';

import {
    openCollaborationModal,
    closeCollaborationModal,
    setCollaborationConnected,
    setCollaborationUsers,
    setCollaborationError,
    setCollaborationRoomId,
    setCollaborationRoomPrivacy
} from '../reducers/collaboration';

import {
    setUsername
} from '../reducers/tw';

class CollaborationContainer extends Component {
    constructor(props) {
        super(props);
        
        this.collaborationService = CollaborationService.getInstance();
        
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
        this.handleJoinApproved = this.handleJoinApproved.bind(this);
        this.handleJoinDenied = this.handleJoinDenied.bind(this);
        this.handleChangeRoomPrivacy = this.handleChangeRoomPrivacy.bind(this);
        this.handleRoomPrivacyChanged = this.handleRoomPrivacyChanged.bind(this);
        this.handleWorkspaceReattach = this.handleWorkspaceReattach.bind(this);
        this.handleProjectSyncDownloadStart = this.handleProjectSyncDownloadStart.bind(this);
        this.handleProjectSyncDownloadProgress = this.handleProjectSyncDownloadProgress.bind(this);
        this.handleProjectSyncDownloadComplete = this.handleProjectSyncDownloadComplete.bind(this);
        this.handleProjectSyncDownloadError = this.handleProjectSyncDownloadError.bind(this);
    }

    componentDidMount() {
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
        this.collaborationService.on('join-approved', this.handleJoinApproved);
        this.collaborationService.on('join-denied', this.handleJoinDenied);
        this.collaborationService.on('room-privacy-changed', this.handleRoomPrivacyChanged);
        this.collaborationService.on('request-workspace-reattach', this.handleWorkspaceReattach);
        this.collaborationService.on('project-sync-download-start', this.handleProjectSyncDownloadStart);
        this.collaborationService.on('project-sync-download-progress', this.handleProjectSyncDownloadProgress);
        this.collaborationService.on('project-sync-download-complete', this.handleProjectSyncDownloadComplete);
        this.collaborationService.on('project-sync-download-error', this.handleProjectSyncDownloadError);
        
        // Track download progress state
        this.projectSyncProgress = 0;
        this.projectSyncLoadingBar = null;
    }

    componentWillUnmount() {
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
        this.collaborationService.off('room-privacy-changed', this.handleRoomPrivacyChanged);
        this.collaborationService.off('request-workspace-reattach', this.handleWorkspaceReattach);
        this.collaborationService.off('project-sync-download-start', this.handleProjectSyncDownloadStart);
        this.collaborationService.off('project-sync-download-progress', this.handleProjectSyncDownloadProgress);
        this.collaborationService.off('project-sync-download-complete', this.handleProjectSyncDownloadComplete);
        this.collaborationService.off('project-sync-download-error', this.handleProjectSyncDownloadError);
        
        // Disconnect if connected
        if (this.collaborationService.isConnected) {
            this.collaborationService.disconnect();
        }
    }

    async handleJoinRoom(roomId, username) {
        try {
            this.props.onSetError(null);
            
            await this.collaborationService.connectToRoom(roomId, username, false);
            
            // Don't set connected immediately - wait for connected-to-host event
            this.props.onSetRoomId(roomId);
            
            // Try to attach to workspace if it exists
            this.tryAttachToWorkspace();
            
        } catch (error) {
            console.error('Failed to join room:', error);
            this.props.onSetError(error.message || 'Failed to join room');
            throw error;
        }
    }

    async handleCreateRoom(roomId, username, privacy = 'public') {
        
        if (!roomId) throw new Error('Room ID is required to create a room');
        
        try {
            this.props.onSetError(null);
            
            await this.collaborationService.connectToRoom(roomId, username, true, privacy);
            
            // For hosts, set connected immediately since they're always connected
            this.props.onSetConnected(true);
            this.props.onSetRoomId(roomId);
            this.props.onSetRoomPrivacy(privacy);
            this.updateUsersList();
            
            // Try to attach to workspace if it exists
            this.tryAttachToWorkspace();
            
        } catch (error) {
            console.error('Failed to create room:', error);
            this.props.onSetError(error.message || 'Failed to create room');
            throw error;
        }
    }

    tryAttachToWorkspace() {
        // Try to find the Blockly workspace via AddonHooks
        if (window.AddonHooks && window.AddonHooks.blocklyWorkspace) {
            this.collaborationService.attachToWorkspace(window.AddonHooks.blocklyWorkspace);
        } else if (window.Blockly && window.Blockly.getMainWorkspace && window.Blockly.getMainWorkspace()) {
            // Fallback to global Blockly workspace
            const workspace = window.Blockly.getMainWorkspace();
            this.collaborationService.attachToWorkspace(workspace);
        } else {
            // If workspace isn't available yet, try again after a short delay
            setTimeout(() => {
                this.tryAttachToWorkspace();
            }, 500);
        }
    }

    handleWorkspaceReattach() {
        console.log('🔄 Handling workspace reattach request');
        this.tryAttachToWorkspace();
    }

    handleLeaveRoom() {
        this.collaborationService.disconnect();
        this.props.onSetConnected(false);
        this.props.onSetRoomId(null);
        this.props.onSetRoomPrivacy('public');
        this.props.onSetUsers([]);
        this.props.onSetError(null);
    }

    handleKickUser(userId) {
        this.collaborationService.kickUser(userId);
        this.updateUsersList();
    }

    handleChangeUsername(newUsername) {
        this.collaborationService.changeUsername(newUsername);
        this.updateUsersList();
    }

    handleUserJoined(user) {
        console.log('User joined:', user);
        this.updateUsersList();
    }

    handleUserLeft(user) {
        console.log('User left:', user);
        const username = user.username || user.id || 'A user';
        ToastSystem.info(`${username} disconnected`, 3000);
        this.updateUsersList();
    }

    handleUsersUpdated(data) {
        console.log('Users list updated:', data.users);
        this.updateUsersList();
    }

    handleConnectionFailed(data) {
        console.log('Connection failed:', data.error);
        
        // Immediately clear connection state and show error
        this.props.onSetConnected(false);
        this.props.onSetRoomId(null);
        this.props.onSetUsers([]);
        this.props.onSetError(data.error);
    }

    handleUsernameChanged(user) {
        console.log('Username changed:', user);
        
        // If this is our own username change from another client, update local state
        if (
            user.id === this.getCurrentUserId() &&
            user.username !== this.props.currentUsername
        ) this.props.onSetUsername(user.username);
        
        this.updateUsersList();
    }

    handleKickedFromRoom(data) {
        console.log('Kicked from room:', data);
        
        // Disconnect from the collaboration service but don't clear the error
        this.collaborationService.disconnect();
        
        // Set connection state to false and clear room/users
        this.props.onSetConnected(false);
        this.props.onSetRoomId(null);
        this.props.onSetUsers([]);
        
        // Set a specific kick message AFTER clearing the room state
        this.props.onSetError('You have been removed from the collaboration room by the host.');
    }

    handleHostLeft() {
        this.props.onSetConnected(false);
        this.props.onSetRoomId(null);
        this.props.onSetUsers([]);
        
        // Show toast notification
        ToastSystem.warning('The host has left the collaboration room. The room has been closed.', 5000);
        
        // Set a specific message for host leaving
        this.props.onSetError('The host has left the collaboration room. The room has been closed.');
    }

    handleConnectedToHost() {
        console.log('Successfully connected to host');
        
        // Now we're actually connected and can show the connected UI
        this.props.onSetConnected(true);
        
        // Sync username with collaboration service
        const serviceUsername = this.collaborationService.username;
        if (
            serviceUsername &&
            serviceUsername !== this.props.currentUsername
        ) this.props.onSetUsername(serviceUsername);
        
        // Sync room privacy from service
        const roomPrivacy = this.collaborationService.getRoomPrivacy();
        this.props.onSetRoomPrivacy(roomPrivacy);
        
        this.updateUsersList();
    }

    handleDisconnected() {
        console.log('Disconnected from collaboration');
        
        // Show toast notification
        ToastSystem.info('Disconnected from collaboration room', 3000);
        
        this.props.onSetConnected(false);
        this.props.onSetRoomId(null);
        this.props.onSetRoomPrivacy('public');
        this.props.onSetUsers([]);
    }

    handleCancelConnection() {
        console.log('User cancelled connection');
        
        // Disconnect from the collaboration service
        this.collaborationService.disconnect();
        
        // Clear any connection state
        this.props.onSetConnected(false);
        this.props.onSetRoomId(null);
        this.props.onSetRoomPrivacy('public');
        this.props.onSetUsers([]);
        this.props.onSetError(null);
    }

    async handleApproveJoinRequest(requesterId, requesterUsername) {
        try {
            await this.collaborationService.approveJoinRequest(requesterId, requesterUsername);
        } catch (error) {
            console.error('Failed to approve join request:', error);
            this.props.onSetError(error.message || 'Failed to approve join request');
            throw error;
        }
    }

    async handleDenyJoinRequest(requesterId) {
        try {
            await this.collaborationService.denyJoinRequest(requesterId);
        } catch (error) {
            console.error('Failed to deny join request:', error);
            this.props.onSetError(error.message || 'Failed to deny join request');
            throw error;
        }
    }

    handleCancelJoinRequest() {
        // Cancel any pending join request
        if (this.collaborationService.cancelJoinRequest) {
            this.collaborationService.cancelJoinRequest();
        }
        this.handleCancelConnection();
    }

    handleJoinRequestReceived(data) {
        console.log('Join request received:', data);
        // The modal will handle this event directly from the collaboration service
    }

    handleJoinApproved() {
        console.log('Join request approved');
        // The user has been approved to join the room
        this.props.onSetConnected(true);
        this.updateUsersList();
    }

    handleJoinDenied(data) {
        console.log('Join request denied:', data);
        this.props.onSetError(data || 'Your join request was denied');
        this.props.onSetConnected(false);
        this.props.onSetRoomId(null);
    }

    async handleChangeRoomPrivacy(newPrivacy) {
        try {
            await this.collaborationService.changeRoomPrivacy(newPrivacy);
            this.props.onSetRoomPrivacy(newPrivacy);
        } catch (error) {
            console.error('Failed to change room privacy:', error);
            this.props.onSetError(error.message || 'Failed to change room privacy');
            throw error;
        }
    }

    handleRoomPrivacyChanged(privacy) {
        console.log('Room privacy changed to:', privacy);
        this.props.onSetRoomPrivacy(privacy);
    }

    updateUsersList() {
        const users = this.collaborationService.getConnectedUsers();
        this.props.onSetUsers(users);
    }

    getCurrentUserId() {
        return this.collaborationService.peer ? this.collaborationService.peer.id : null;
    }

    handleProjectSyncDownloadStart(data) {
        // Create loading bar overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'project-sync-download-overlay';
        loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        `;
        
        const container = document.createElement('div');
        container.style.cssText = `
            text-align: center;
            max-width: 500px;
            padding: 20px;
        `;
        
        const title = document.createElement('div');
        title.textContent = 'Downloading project from host...';
        title.style.cssText = `
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 20px;
        `;
        
        const progressContainer = document.createElement('div');
        progressContainer.style.cssText = `
            width: 100%;
            height: 8px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 12px;
        `;
        
        const progressBar = document.createElement('div');
        progressBar.className = 'project-sync-progress-bar';
        progressBar.style.cssText = `
            height: 100%;
            width: 0%;
            background: #4CAF50;
            transition: width 0.3s ease;
            border-radius: 4px;
        `;
        
        const progressText = document.createElement('div');
        progressText.className = 'project-sync-progress-text';
        progressText.textContent = '0%';
        progressText.style.cssText = `
            font-size: 14px;
            opacity: 0.9;
        `;
        
        progressContainer.appendChild(progressBar);
        container.appendChild(title);
        container.appendChild(progressContainer);
        container.appendChild(progressText);
        loadingOverlay.appendChild(container);
        document.body.appendChild(loadingOverlay);
        
        this.projectSyncLoadingBar = {
            overlay: loadingOverlay,
            bar: progressBar,
            text: progressText
        };
        this.projectSyncProgress = 0;
    }

    handleProjectSyncDownloadProgress(data) {
        if (this.projectSyncLoadingBar) {
            const progress = Math.min(100, Math.max(0, data.progress || 0));
            this.projectSyncProgress = progress;
            this.projectSyncLoadingBar.bar.style.width = `${progress}%`;
            this.projectSyncLoadingBar.text.textContent = `${Math.round(progress)}%`;
        }
    }

    handleProjectSyncDownloadComplete() {
        // Clear progress state immediately
        this.projectSyncProgress = null;
        
        if (this.projectSyncLoadingBar) {
            // Show 100% briefly, then remove overlay
            // The normal project loading will take over
            setTimeout(() => {
                if (this.projectSyncLoadingBar && this.projectSyncLoadingBar.overlay.parentNode) {
                    this.projectSyncLoadingBar.overlay.style.opacity = '0';
                    this.projectSyncLoadingBar.overlay.style.transition = 'opacity 0.3s ease';
                    setTimeout(() => {
                        if (this.projectSyncLoadingBar && this.projectSyncLoadingBar.overlay.parentNode) {
                            this.projectSyncLoadingBar.overlay.parentNode.removeChild(this.projectSyncLoadingBar.overlay);
                        }
                        this.projectSyncLoadingBar = null;
                        this.projectSyncProgress = null;
                    }, 300);
                } else {
                    this.projectSyncLoadingBar = null;
                    this.projectSyncProgress = null;
                }
            }, 500);
        }
    }

    handleProjectSyncDownloadError(data) {
        if (this.projectSyncLoadingBar) {
            if (this.projectSyncLoadingBar.overlay.parentNode) {
                this.projectSyncLoadingBar.overlay.parentNode.removeChild(this.projectSyncLoadingBar.overlay);
            }
            this.projectSyncLoadingBar = null;
        }
        ToastSystem.error('Failed to download project from host', 5000);
    }

    render() {
        return (
            <CollaborationModal
                visible={this.props.isVisible}
                currentUsername={this.props.currentUsername}
                currentUserId={this.getCurrentUserId()}
                isConnected={this.props.isConnected}
                roomId={this.props.roomId}
                roomPrivacy={this.props.roomPrivacy}
                connectedUsers={this.props.connectedUsers}
                connectionError={this.props.connectionError}
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
                onChangeRoomPrivacy={this.handleChangeRoomPrivacy}
            />
        );
    }
}

CollaborationContainer.propTypes = {
    isVisible: PropTypes.bool.isRequired,
    isConnected: PropTypes.bool.isRequired,
    roomId: PropTypes.string,
    roomPrivacy: PropTypes.string,
    connectedUsers: PropTypes.array.isRequired,
    connectionError: PropTypes.string,
    currentUsername: PropTypes.string,
    vm: PropTypes.object.isRequired,
    onRequestClose: PropTypes.func.isRequired,
    onSetConnected: PropTypes.func.isRequired,
    onSetUsers: PropTypes.func.isRequired,
    onSetError: PropTypes.func.isRequired,
    onSetRoomId: PropTypes.func.isRequired,
    onSetRoomPrivacy: PropTypes.func.isRequired,
    onSetUsername: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
    isVisible: state.scratchGui.collaboration.modalVisible,
    isConnected: state.scratchGui.collaboration.isConnected,
    roomId: state.scratchGui.collaboration.roomId,
    roomPrivacy: state.scratchGui.collaboration.roomPrivacy,
    connectedUsers: state.scratchGui.collaboration.connectedUsers,
    connectionError: state.scratchGui.collaboration.connectionError,
    currentUsername: state.scratchGui.tw.username,
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    onRequestClose: () => dispatch(closeCollaborationModal()),
    onSetConnected: (connected) => dispatch(setCollaborationConnected(connected)),
    onSetUsers: (users) => dispatch(setCollaborationUsers(users)),
    onSetError: (error) => dispatch(setCollaborationError(error)),
    onSetRoomId: (roomId) => dispatch(setCollaborationRoomId(roomId)),
    onSetRoomPrivacy: (privacy) => dispatch(setCollaborationRoomPrivacy(privacy)),
    onSetUsername: (username) => dispatch(setUsername(username))
});

export default compose(
    connect(mapStateToProps, mapDispatchToProps)
)(CollaborationContainer);
