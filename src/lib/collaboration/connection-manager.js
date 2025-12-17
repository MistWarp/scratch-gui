/**
 * Send a message to all connected peers or a specific connection
 * @param {CollaborationService} service - The collaboration service instance
 * @param {string} type - The message type
 * @param {object} payload - The message payload
 * @param {Peer.DataConnection|string} targetConn - The connection object or peer ID
 * @return {void}
 */
const sendMessage = (service, type, payload, targetConn) => {
    const message = {type, payload, sender: service.peer ? service.peer.id : null, timestamp: Date.now()};
    if (targetConn) {
        if (typeof targetConn === 'string') {
            const conn = service.connections.get(targetConn);
            if (conn && conn.open) {
                try {
                    conn.send(message);
                } catch (error) {
                    console.error('[Connection] Failed to send message to peer:', error, {type, targetConn});
                }
            }
            return;
        }
        if (targetConn.open) {
            try {
                targetConn.send(message);
            } catch (error) {
                console.error('[Connection] Failed to send message:', error, {type});
            }
            return;
        }
    }
    service.connections.forEach(conn => {
        if (conn.open) {
            try {
                conn.send(message);
            } catch (error) {
                console.error('[Connection] Failed to send message to connection:', error, {type, peer: conn.peer});
            }
        }
    });
};

/**
 * Handle incoming peer connections
 * @param {CollaborationService} service - The collaboration service instance
 * @param {object} data - The message data
 * @param {Peer.DataConnection} conn - The connection object
 * @return {void}
 */
const handleMessage = (service, data, conn) => {
    const {type, payload, sender} = data;
    if (service.messageHandlers[type]) {
        const enrichedPayload = {...payload, sender};
        service.messageHandlers[type](enrichedPayload, conn);
    } else {
        // Unknown message type; ignore to keep connection stable
    }
};

/**
 * Handle incoming peer connections
 * @param {CollaborationService} service - The collaboration service instance
 * @param {object} conn - The connection object
 */
const handleConnection = (service, conn) => {
    service.connections.set(conn.peer, conn);
    conn.on('open', () => {
        if (!service.isHost && conn.peer === service.hostId) {
            service.isConnectedToHost = true;
            service.attemptWorkspaceAttachment('Client connected');
            service.emit('connected-to-host');
        }
        if (!service.isHost) {
            const userInfo = {
                id: service.peer.id,
                username: service.username,
                isHost: service.isHost
            };
            sendMessage(service, 'user-join', userInfo, conn);
            service.emit('awaiting-approval');
        }
    });
    conn.on('data', data => {
        handleMessage(service, data, conn);
    });
    conn.on('close', () => {
        const userInfo = service.users.get(conn.peer);
        service.connections.delete(conn.peer);
        service.users.delete(conn.peer);
        if (conn.peer === service.hostId && !service.isHost) {
            service.emit('host-left');
            setTimeout(() => {
                if (!service.isDisconnecting) {
                    service.disconnect();
                }
            }, 100);
            return;
        }
        if (!service.wasKicked) {
            // Include username in user-left event for toast notification
            service.emit('user-left', {
                id: conn.peer,
                username: userInfo ? userInfo.username : null
            });
        }
    });
    conn.on('error', error => {
        console.warn('[COLLABORATION] Connection error for peer:', conn.peer, error);
        // For hosts, don't disconnect on individual client connection errors
        // Just remove the failed connection
        if (service.isHost) {
            // Get user info before deleting
            const userInfo = service.users.get(conn.peer);
            // Only remove the connection, don't disconnect the host
            service.connections.delete(conn.peer);
            service.users.delete(conn.peer);
            // Emit user-left event for the failed connection
            if (!service.wasKicked) {
                service.emit('user-left', {
                    id: conn.peer,
                    username: userInfo ? userInfo.username : null
                });
            }
        } else {
            // For clients, only remove if it's not the host connection
            if (conn.peer !== service.hostId) {
                service.connections.delete(conn.peer);
                service.users.delete(conn.peer);
            }
            // If it's the host connection that failed, disconnect
            service.emit('host-left');
            setTimeout(() => {
                if (!service.isDisconnecting) {
                    service.disconnect();
                }
            }, 100);
        }
    });
    if (conn.open) {
        conn.emit('open');
    }
};

export {
    sendMessage,
    handleConnection,
    handleMessage
};
