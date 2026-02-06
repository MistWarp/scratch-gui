import Peer from 'peerjs';

/**
 * Setup the host user and attempt workspace attachment
 * @param {CollaborationService} service - The collaboration service instance
 */
const setupHost = service => {
    service.hostId = service.peer.id;
    service.isConnectedToHost = true;
    service.currentConnectionFailureHandler = null;
    const hostUser = {
        id: service.peer.id,
        username: service.username,
        isHost: true
    };
    service.users.set(service.peer.id, hostUser);
    if (service.vm && service.vm.runtime && service.vm.runtime.targets) {
        service.targetMapping = {};
        service.vm.runtime.targets.forEach(target => {
            service.targetMapping[target.id] = target.id;
        });
    }
    service.attemptWorkspaceAttachment('Host setup');
    service.emit('room-created', {roomId: service.roomId, hostId: service.peer.id});
    service.emit('user-joined', hostUser);
};

/**
 * Connect to the host of the room
 * @param {CollaborationService} service - The collaboration service instance
 */
const connectToHost = service => {
    const hostId = service.generatePeerId(service.roomId, true);
    service.hostId = hostId;
    const roomIdForError = service.roomId;
    let errorHandled = false;
    let conn = null;
    const handleConnectionFailure = errorMessage => {
        if (errorHandled) {
            return;
        }
        errorHandled = true;
        if (service.connectionTimeout) {
            clearTimeout(service.connectionTimeout);
            service.connectionTimeout = null;
        }
        if (conn) {
            conn.close();
        }
        service.disconnect();
        service.emit('connection-failed', {error: errorMessage});
    };
    service.currentConnectionFailureHandler = handleConnectionFailure;
    try {
        conn = service.peer.connect(hostId, {
            label: 'collaboration',
            metadata: {
                username: service.username,
                roomId: service.roomId
            },
            reliable: true
        });
        service.connectionTimeout = setTimeout(() => {
            if (!conn.open && !errorHandled) {
                handleConnectionFailure(`Connection to room "${roomIdForError}" timed out. Host may not be available.`);
            }
        }, 15000);
        conn.on('open', () => {
            if (!errorHandled) {
                errorHandled = true;
                if (service.connectionTimeout) {
                    clearTimeout(service.connectionTimeout);
                    service.connectionTimeout = null;
                }
                service.currentConnectionFailureHandler = null;
            }
        });
        conn.on('error', () => {
            if (!errorHandled) {
                errorHandled = true;
                if (service.connectionTimeout) {
                    clearTimeout(service.connectionTimeout);
                    service.connectionTimeout = null;
                }
                handleConnectionFailure(
                    `Could not connect to host. Room "${roomIdForError}" may not exist or host may be offline.`
                );
            }
        });
        conn.peerConnection.addEventListener('iceconnectionstatechange', () => {});
        conn.peerConnection.addEventListener('connectionstatechange', () => {});
        service.handleConnection(conn);
    } catch (error) {
        const roomIdForError2 = service.roomId;
        service.disconnect();
        service.emit('connection-failed', {
            error: `Failed to connect to room "${roomIdForError2}". Please check the room name.`
        });
    }
};

/**
 * Connect to a collaboration room
 * @param {CollaborationService} service - The collaboration service instance
 * @param {string} roomId - The collaboration room ID
 * @param {string} username - The user's display name
 * @param {boolean} isHost - Whether this peer is the host
 * @param {string} privacy - Room privacy setting ('public' or 'private')
 * @return {Promise<void>} - A promise that resolves when the room is connected
 */
const connectToRoom = async (service, roomId, username, isHost = false, privacy = 'public') => {
    if (!roomId) {
        throw new Error('roomId is required to connect to a room');
    }
    try {
        service.roomId = roomId;
        if (service.peer) {
            service.disconnect();
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        const peerId = service.generatePeerId(roomId, isHost);
        service.peer = new Peer(peerId, service.peerConfig);
        return new Promise((resolve, reject) => {
            service.username = username || `User${Math.floor(Math.random() * 1000)}`;
            service.isHost = isHost;
            service.roomPrivacy = privacy;
            service.peer.on('open', id => {
                service.isConnected = true;
                service.roomId = roomId;
                if (service.isHost) {
                    setupHost(service);
                } else {
                    connectToHost(service);
                }
                resolve(id);
            });
            service.peer.on('error', error => {
                if (service.isDisconnecting) return;
                const roomIdForError = service.roomId;
                if (service.currentConnectionFailureHandler && !service.isHost) {
                    service.currentConnectionFailureHandler(
                        `Could not connect to host. Room "${roomIdForError}" may not exist or host may be offline.`
                    );
                    return;
                }
                // For hosts, only disconnect on critical peer errors, not client connection failures
                // Client connection failures are handled in handleConnection's error handler
                if (service.isHost) {
                    // Only disconnect on critical errors like peer ID taken or server connection issues
                    const errorMessage = error.message || error.toString();
                    if (errorMessage.includes('taken') || errorMessage.includes('unavailable') ||
                        errorMessage.includes('server') || errorMessage.includes('network')) {
                        console.error('[COLLABORATION] Critical peer error on host:', error);
                        service.disconnect();
                        reject(error);
                    } else {
                        // Log but don't disconnect for non-critical errors (like client connection failures)
                        console.warn('[COLLABORATION] Non-critical peer error on host (ignored):', error);
                    }
                } else {
                    // Clients should disconnect on peer errors
                    service.disconnect();
                    reject(error);
                }
            });
            service.peer.on('connection', conn => {
                service.handleConnection(conn);
            });
        });
    } catch (error) {
        service.disconnect();
        throw error;
    }
};

/**
 * Approve a join request (host only)
 * @param {CollaborationService} service - The collaboration service instance
 * @param {string} requesterId - The ID of the user who requested to join
 * @param {string} requesterUsername - The username of the user who requested to join
 */
const approveJoinRequest = (service, requesterId, requesterUsername) => {
    if (!service.isHost) return;
    const request = service.pendingJoinRequests.get(requesterId);
    if (!request) return;
    service.sendMessage('join-approved', {
        roomId: service.roomId,
        hostUsername: service.username
    }, requesterId);
    const userPayload = {
        id: requesterId,
        username: requesterUsername,
        isHost: false
    };
    service.users.set(requesterId, userPayload);
    service.emit('user-joined', userPayload);
    const currentUsers = Array.from(service.users.values());
    service.sendMessage('users-list', {users: currentUsers}, requesterId);
    // Don't send project sync here - let the client request it with sync-request
    // This prevents duplicate syncs and follows a cleaner request-response pattern
    // if (service.vm) {
    //     service.sendProjectSync(requesterId);
    // }
    service.connections.forEach(connection => {
        if (connection !== request.connection && connection.open) {
            service.sendMessage('user-join', userPayload, connection.peer);
        }
    });
    service.emit('users-updated', {users: currentUsers});
    service.pendingJoinRequests.delete(requesterId);
};

const handleJoinRequest = (service, data, connection) => {
    if (!service.isHost) return;
    if (service.roomPrivacy === 'public') {
        approveJoinRequest(service, connection.peer, data.requester.username);
    } else {
        service.pendingJoinRequests.set(connection.peer, {
            id: connection.peer,
            username: data.requester.username,
            connection: connection
        });
        service.emit('join-request-received', {
            requesterId: connection.peer,
            requesterUsername: data.requester.username
        });
    }
};

/**
 * Handle a join approval response
 * @param {CollaborationService} service - The collaboration service instance
 * @param {Peer.DataConnection} connection - The connection object
 */
const handleJoinApproved = (service, connection) => {
    service.emit('approval-resolved');
    const ourUser = {
        id: service.peer.id,
        username: service.username,
        isHost: false
    };
    service.users.set(service.peer.id, ourUser);
    service.emit('user-joined', ourUser);
    service.sendMessage('sync-request', {}, connection);
    service.emit('join-approved');
    service.emit('connected-to-host');
};

/**
 * Handle a user joining the room
 * @param {CollaborationService} service - The collaboration service instance
 * @param {object} payload - The user's join payload
 * @param {Peer.DataConnection} conn - The connection object
 */
const handleUserJoin = (service, payload, conn) => {
    if (payload.id === service.peer.id && !service.isHost) {
        service.emit('approval-resolved');
        service.users.set(service.peer.id, payload);
        service.emit('user-joined', payload);
        service.emit('connected-to-host');
        // Don't send sync-request here - it's already sent in handleJoinApproved
        // service.sendMessage('sync-request', {}, conn ? conn : service.hostId);
        return;
    }
    if (payload.id === service.peer.id) return;
    service.pendingJoinRequests.set(payload.id, {
        id: payload.id,
        username: payload.username,
        connection: conn
    });
    service.emit('join-request-received', {
        requesterId: payload.id,
        requesterUsername: payload.username
    });
    if (service.isHost) {
        if (service.roomPrivacy === 'private') return;
        if (service.roomPrivacy === 'public') approveJoinRequest(service, payload.id, payload.username, conn);
    }
    service.users.set(payload.id, payload);
    service.emit('user-joined', payload);
    if (service.isHost) {
        const currentUsers = Array.from(service.users.values());
        service.sendMessage('users-list', {users: currentUsers}, conn ? conn : payload.id);
        // Don't send project sync here - it's already sent in approveJoinRequest
        // if (service.vm) {
        //     service.sendProjectSync(conn ? conn : payload.id);
        // }
        service.connections.forEach(connection => {
            if (connection !== conn && connection.open) {
                service.sendMessage('user-join', payload, connection.peer);
            }
        });
        service.emit('users-updated', {users: currentUsers});
    }
};

/**
 * Handle a join denial response
 * @param {CollaborationService} service - The collaboration service instance
 * @param {object} data - The join denial payload
 */
const handleJoinDenied = (service, data) => {
    service.emit('approval-resolved');
    service.emit('join-denied', data.reason || 'Join request was denied');
};

/**
 * Handle a join cancellation from a client
 * @param {CollaborationService} service - The collaboration service instance
 * @param {object} data - The join cancellation payload
 * @param {Peer.DataConnection} connection - The connection object
 */
const handleJoinCancelled = (service, data, connection) => {
    if (!service.isHost) return;
    if (service.pendingJoinRequests.has(data.id)) {
        service.pendingJoinRequests.delete(data.id);
        service.emit('join-request-cancelled', {
            requesterId: data.id,
            requesterUsername: data.username
        });
    }
    if (connection && !connection.destroyed && connection.close) {
        connection.close();
    }
    service.connections.delete(data.id);
};

/**
 * Deny a join request (host only)
 * @param {CollaborationService} service - The collaboration service instance
 * @param {string} requesterId - The ID of the user who requested to join
 * @param {string} reason - The reason for the join request being denied
 */
const denyJoinRequest = (service, requesterId, reason = 'Host denied your request') => {
    if (!service.isHost) return;
    const request = service.pendingJoinRequests.get(requesterId);
    if (!request) return;
    service.sendMessage('join-denied', {reason}, requesterId);
    if (request.connection && request.connection.close) request.connection.close();
    service.pendingJoinRequests.delete(requesterId);
};

/**
 * Cancel a pending join request (for clients waiting for approval)
 * @param {CollaborationService} service - The collaboration service instance
 */
const cancelJoinRequest = service => {
    if (service.connections.has(service.hostId)) {
        const conn = service.connections.get(service.hostId);
        if (conn) {
            service.sendMessage('join-cancelled', {
                id: service.peer.id,
                username: service.username
            }, conn);
        }
    }
    service.disconnect();
};

/**
 * Handle room privacy information
 * @param {CollaborationService} service - The collaboration service instance
 * @param {object} data - The room privacy payload
 */
const handleRoomPrivacy = (service, data) => {
    service.roomPrivacy = data.privacy;
    service.emit('room-privacy-changed', data.privacy);
};

/**
 * Get pending join requests (host only)
 * @param {CollaborationService} service - The collaboration service instance
 * @return {object[]} - An array of pending join requests
 */
const getPendingJoinRequests = service => {
    if (!service.isHost || !service.isConnected || service.isDisconnecting) {
        return [];
    }
    const requests = Array.from(service.pendingJoinRequests.values()).map(request => ({
        id: request.id,
        username: request.username
    }));
    return requests;
};

/**
 * Get current room privacy setting
 * @param {CollaborationService} service - The collaboration service instance
 * @return {string} - The current room privacy setting
 */
const getRoomPrivacy = service => service.roomPrivacy;

/**
 * Change room privacy setting (host only)
 * @param {CollaborationService} service - The collaboration service instance
 * @param {string} newPrivacy - The new room privacy setting
 */
const changeRoomPrivacy = (service, newPrivacy) => {
    if (!service.isHost) throw new Error('Only the host can change room privacy');
    if (newPrivacy !== 'public' && newPrivacy !== 'private') {
        throw new Error('Privacy must be either "public" or "private"');
    }
    service.roomPrivacy = newPrivacy;
    service.sendMessage('room-privacy', {privacy: newPrivacy});
};

export {
    setupHost,
    connectToHost,
    handleJoinRequest,
    handleJoinApproved,
    handleUserJoin,
    handleJoinDenied,
    handleJoinCancelled,
    approveJoinRequest,
    denyJoinRequest,
    cancelJoinRequest,
    handleRoomPrivacy,
    getPendingJoinRequests,
    getRoomPrivacy,
    changeRoomPrivacy,
    connectToRoom
};
