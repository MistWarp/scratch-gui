import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { compose } from 'redux';

import CollaborationModal from '../components/collaboration-modal/collaboration-modal.jsx';
import CollaborationService from '../lib/collaboration-service.js';

import {
    openCollaborationModal,
    closeCollaborationModal,
    setCollaborationConnected,
    setCollaborationUsers,
    setCollaborationError,
    setCollaborationRoomId
} from '../reducers/collaboration';

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

    async handleCreateRoom(roomId, username) {
        try {
            this.props.onSetError(null);
            
            await this.collaborationService.connectToRoom(roomId, username, true);
            
            // For hosts, set connected immediately since they're always connected
            this.props.onSetConnected(true);
            this.props.onSetRoomId(roomId);
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

    handleLeaveRoom() {
        this.collaborationService.disconnect();
        this.props.onSetConnected(false);
        this.props.onSetRoomId(null);
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
        console.log('Host has left the room');
        
        // Disconnect from the collaboration service
        this.collaborationService.disconnect();
        
        // Set connection state to false and clear room/users
        this.props.onSetConnected(false);
        this.props.onSetRoomId(null);
        this.props.onSetUsers([]);
        
        // Set a specific message for host leaving
        this.props.onSetError('The host has left the collaboration room. The room has been closed.');
    }

    handleConnectedToHost() {
        console.log('Successfully connected to host');
        
        // Now we're actually connected and can show the connected UI
        this.props.onSetConnected(true);
        this.updateUsersList();
    }

    handleDisconnected() {
        console.log('Disconnected from collaboration');
        this.props.onSetConnected(false);
        this.props.onSetRoomId(null);
        this.props.onSetUsers([]);
    }

    handleCancelConnection() {
        console.log('User cancelled connection');
        
        // Disconnect from the collaboration service
        this.collaborationService.disconnect();
        
        // Clear any connection state
        this.props.onSetConnected(false);
        this.props.onSetRoomId(null);
        this.props.onSetUsers([]);
        this.props.onSetError(null);
    }

    updateUsersList() {
        const users = this.collaborationService.getConnectedUsers();
        this.props.onSetUsers(users);
    }

    getCurrentUserId() {
        return this.collaborationService.peer ? this.collaborationService.peer.id : null;
    }

    render() {
        return (
            <CollaborationModal
                visible={this.props.isVisible}
                currentUsername={this.props.username}
                currentUserId={this.getCurrentUserId()}
                isConnected={this.props.isConnected}
                roomId={this.props.roomId}
                connectedUsers={this.props.connectedUsers}
                connectionError={this.props.connectionError}
                onRequestClose={this.props.onRequestClose}
                onJoinRoom={this.handleJoinRoom}
                onCreateRoom={this.handleCreateRoom}
                onLeaveRoom={this.handleLeaveRoom}
                onKickUser={this.handleKickUser}
                onChangeUsername={this.handleChangeUsername}
                onCancelConnection={this.handleCancelConnection}
            />
        );
    }
}

CollaborationContainer.propTypes = {
    isVisible: PropTypes.bool.isRequired,
    isConnected: PropTypes.bool.isRequired,
    roomId: PropTypes.string,
    connectedUsers: PropTypes.array.isRequired,
    connectionError: PropTypes.string,
    username: PropTypes.string,
    vm: PropTypes.object.isRequired,
    onRequestClose: PropTypes.func.isRequired,
    onSetConnected: PropTypes.func.isRequired,
    onSetUsers: PropTypes.func.isRequired,
    onSetError: PropTypes.func.isRequired,
    onSetRoomId: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
    isVisible: state.scratchGui.collaboration.modalVisible,
    isConnected: state.scratchGui.collaboration.isConnected,
    roomId: state.scratchGui.collaboration.roomId,
    connectedUsers: state.scratchGui.collaboration.connectedUsers,
    connectionError: state.scratchGui.collaboration.connectionError,
    username: state.scratchGui.tw.username,
    vm: state.scratchGui.vm
});

const mapDispatchToProps = dispatch => ({
    onRequestClose: () => dispatch(closeCollaborationModal()),
    onSetConnected: (connected) => dispatch(setCollaborationConnected(connected)),
    onSetUsers: (users) => dispatch(setCollaborationUsers(users)),
    onSetError: (error) => dispatch(setCollaborationError(error)),
    onSetRoomId: (roomId) => dispatch(setCollaborationRoomId(roomId))
});

export default compose(
    connect(mapStateToProps, mapDispatchToProps)
)(CollaborationContainer);
