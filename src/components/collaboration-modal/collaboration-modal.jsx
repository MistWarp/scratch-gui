import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, intlShape } from 'react-intl';
import classNames from 'classnames';

import Modal from '../../containers/windowed-modal.jsx';
import Box from '../box/box.jsx';
import Button from '../button/button.jsx';
import BufferedInputHOC from '../forms/buffered-input-hoc.jsx';
import Input from '../forms/input.jsx';

const BufferedInput = BufferedInputHOC(Input);

import collaborationIcon from './collaboration-icon.svg';
import userIcon from './user-icon.svg';
import hostIcon from './host-icon.svg';
import kickIcon from './kick-icon.svg';

import styles from './collaboration-modal.css';

class CollaborationModal extends Component {
    constructor(props) {
        super(props);
        
        this.state = {
            roomId: '',
            username: props.currentUsername || '',
            isConnecting: false,
            connectionStep: 'join', // 'join', 'connecting', 'connected'
            showCreateRoom: false,
            newRoomId: '',
            error: null
        };
        
        this.handleRoomIdChange = this.handleRoomIdChange.bind(this);
        this.handleUsernameChange = this.handleUsernameChange.bind(this);
        this.handleJoinRoom = this.handleJoinRoom.bind(this);
        this.handleCreateRoom = this.handleCreateRoom.bind(this);
        this.handleLeaveRoom = this.handleLeaveRoom.bind(this);
        this.handleKickUser = this.handleKickUser.bind(this);
        this.handleChangeUsername = this.handleChangeUsername.bind(this);
        this.toggleCreateRoom = this.toggleCreateRoom.bind(this);
        this.handleNewRoomIdChange = this.handleNewRoomIdChange.bind(this);
    }

    componentDidMount() {
        if (this.props.isConnected) {
            this.setState({ connectionStep: 'connected' });
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.isConnected !== this.props.isConnected) {
            this.setState({
                connectionStep: this.props.isConnected ? 'connected' : 'join',
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
    }

    handleRoomIdChange(roomId) {
        this.setState({ roomId });
    }

    handleUsernameChange(username) {
        this.setState({ username });
    }

    handleNewRoomIdChange(newRoomId) {
        this.setState({ newRoomId });
    }

    async handleJoinRoom() {
        if (!this.state.roomId.trim() || !this.state.username.trim()) {
            this.setState({ error: 'Please enter both room ID and username' });
            return;
        }

        this.setState({ 
            isConnecting: true, 
            connectionStep: 'connecting',
            error: null 
        });

        try {
            await this.props.onJoinRoom(this.state.roomId.trim(), this.state.username.trim());
        } catch (error) {
            this.setState({ 
                error: error.message || 'Failed to join room',
                isConnecting: false,
                connectionStep: 'join'
            });
        }
    }

    async handleCreateRoom() {
        if (!this.state.newRoomId.trim() || !this.state.username.trim()) {
            this.setState({ error: 'Please enter both room ID and username' });
            return;
        }

        this.setState({ 
            isConnecting: true, 
            connectionStep: 'connecting',
            error: null 
        });

        try {
            await this.props.onCreateRoom(this.state.newRoomId.trim(), this.state.username.trim());
            this.setState({ showCreateRoom: false });
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

    handleChangeUsername() {
        if (this.state.username.trim()) {
            this.props.onChangeUsername(this.state.username.trim());
        }
    }

    toggleCreateRoom() {
        this.setState({ 
            showCreateRoom: !this.state.showCreateRoom,
            error: null,
            newRoomId: ''
        });
    }

    renderJoinStep() {
        return (
            <Box className={styles.content}>
                <div className={styles.header}>
                    <img 
                        src={collaborationIcon} 
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
                        defaultMessage="Collaborate with others in real-time! Join an existing room or create a new one."
                        description="Description for collaboration feature"
                        id="gui.collaboration.description"
                    />
                </div>

                {!this.state.showCreateRoom ? (
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

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>
                                <FormattedMessage
                                    defaultMessage="Your Username"
                                    description="Label for username input"
                                    id="gui.collaboration.username"
                                />
                            </label>
                            <BufferedInput
                                className={styles.input}
                                placeholder="Enter your username..."
                                value={this.state.username}
                                onSubmit={this.handleUsernameChange}
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
                                onClick={this.toggleCreateRoom}
                            >
                                <FormattedMessage
                                    defaultMessage="Create New Room"
                                    description="Button to create new collaboration room"
                                    id="gui.collaboration.createRoom"
                                />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>
                                <FormattedMessage
                                    defaultMessage="New Room ID"
                                    description="Label for new room ID input"
                                    id="gui.collaboration.newRoomId"
                                />
                            </label>
                            <BufferedInput
                                className={styles.input}
                                placeholder="Enter new room ID..."
                                value={this.state.newRoomId}
                                onSubmit={this.handleNewRoomIdChange}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label}>
                                <FormattedMessage
                                    defaultMessage="Your Username"
                                    description="Label for username input"
                                    id="gui.collaboration.username"
                                />
                            </label>
                            <BufferedInput
                                className={styles.input}
                                placeholder="Enter your username..."
                                value={this.state.username}
                                onSubmit={this.handleUsernameChange}
                            />
                        </div>

                        <div className={styles.buttonGroup}>
                            <Button
                                className={styles.primaryButton}
                                onClick={this.handleCreateRoom}
                                disabled={this.state.isConnecting}
                            >
                                <FormattedMessage
                                    defaultMessage="Create & Join"
                                    description="Button to create and join collaboration room"
                                    id="gui.collaboration.createAndJoin"
                                />
                            </Button>
                            
                            <Button
                                className={styles.secondaryButton}
                                onClick={this.toggleCreateRoom}
                            >
                                <FormattedMessage
                                    defaultMessage="Back to Join"
                                    description="Button to go back to join room"
                                    id="gui.collaboration.backToJoin"
                                />
                            </Button>
                        </div>
                    </div>
                )}

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
                            onClick={this.props.onCancelConnection}
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
                    <img 
                        src={collaborationIcon} 
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
                                <img
                                    src={user.isHost ? hostIcon : userIcon}
                                    className={styles.userIcon}
                                    draggable={false}
                                />
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
                                        iconSrc={kickIcon}
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

                <div className={styles.usernameSection}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>
                            <FormattedMessage
                                defaultMessage="Change Username"
                                description="Label for username change"
                                id="gui.collaboration.changeUsername"
                            />
                        </label>
                        <div className={styles.usernameChange}>
                            <BufferedInput
                                className={styles.input}
                                value={this.state.username}
                                onSubmit={this.handleUsernameChange}
                            />
                            <Button
                                className={styles.changeUsernameButton}
                                onClick={this.handleChangeUsername}
                                disabled={!this.state.username.trim() || this.state.username === currentUser?.username}
                            >
                                <FormattedMessage
                                    defaultMessage="Update"
                                    description="Update username button"
                                    id="gui.collaboration.update"
                                />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className={styles.buttonGroup}>
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
    intl: intlShape.isRequired
};

export default injectIntl(CollaborationModal);
