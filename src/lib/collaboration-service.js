/**
 * Live Collaboration Service for Scratch projects using Peer projects using PeerJS
 * Manages real-time collaboration features including room management, user tracking, and block synchronization
 */

// Singleton instance
let collaborationServiceInstance = null;

class CollaborationService {
    constructor() {
        this.peer = null;
        this.connections = new Map(); // Map of peer IDs to connection objects
        this.isHost = false;
        this.roomId = null;
        this.username = null;
        this.isConnected = false;
        this.isConnectedToHost = false; // Track if we're actually connected to the host
        this.users = new Map(); // Map of peer IDs to user info
        this.hostId = null; // Track who the host is
        this.vm = null;
        this.eventListeners = new Map();
        this.isApplyingRemoteChange = false; // Flag to prevent infinite loops
        this.wasKicked = false; // Flag to track if user was kicked
        this.pendingEvents = []; // Queue for events that couldn't be applied immediately
        this.retryTimer = null; // Timer for retrying pending events
        this.currentConnectionFailureHandler = null; // Handler for connection failures during host connection
        this.targetMapping = {}; // Mapping between host target IDs and our target IDs
        this.lastSyncTime = 0; // Track when we last performed a sync operation
        this.isSyncOperation = false; // Flag to mark events as sync-originated

        // Configure PeerJS with public servers
        this.peerConfig = {
            host: '0.peerjs.com',
            port: 443,
            path: '/',
            secure: true,
            config: {
                iceServers: [
                    { urls: 'stun:vpn.mikedev101.cc:5349' },
                    { urls: 'turn:vpn.mikedev101.cc:5349', username: "free", credential: "free" },
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:freeturn.net:3478' },
                    { urls: 'stun:freeturn.net:5349' },
                    { urls: 'turn:freeturn.net:3478', username: "free", credential: "free" },
                    { urls: 'turns:freeturn.net:5349', username: "free", credential: "free" },
                ],
                iceCandidatePoolSize: 10,
                iceTransportPolicy: 'all',
            },
            debug: 2 // Enable debug logging
        };

        this.messageHandlers = {
            'user-join': this.handleUserJoin.bind(this),
            'user-leave': this.handleUserLeave.bind(this),
            'users-list': this.handleUsersList.bind(this),
            'username-change': this.handleUsernameChange.bind(this),
            'kick-user': this.handleKickUser.bind(this),
            'sync-request': this.handleSyncRequest.bind(this),
            'project-sync': this.handleProjectSync.bind(this),
            'targets-update': this.handleTargetsUpdate.bind(this),
            'block-event': this.handleBlockEvent.bind(this)
        };
    }

    /**
     * Initialize the collaboration service with a VM instance
     */
    init(vm) {
        this.vm = vm;

        // Create a custom block listener that filters for collaboration-relevant events
        this.collaborationBlockListener = this.collaborationBlockListener.bind(this);

        // Listen for VM events to sync changes
        if (this.vm) {
            this.vm.on('workspaceUpdate', this.onWorkspaceUpdate.bind(this));
            this.vm.on('PROJECT_CHANGED', this.onProjectChanged.bind(this));
            this.vm.runtime.on('TARGETS_UPDATE', this.onTargetsUpdate.bind(this));
        }
    }

    /**
     * Attach the collaboration block listener to a Blockly workspace
     * This should be called when the blocks component mounts or when collaboration starts
     */
    attachToWorkspace(workspace) {
        if (workspace && this.isConnected) {
            console.log('📎 Attaching collaboration listener to workspace');
            this.workspace = workspace;
            workspace.addChangeListener(this.collaborationBlockListener);
        }
    }

    /**
     * Detach the collaboration block listener from a Blockly workspace
     */
    detachFromWorkspace() {
        if (this.workspace) {
            console.log('📎 Detaching collaboration listener from workspace');
            this.workspace.removeChangeListener(this.collaborationBlockListener);
            this.workspace = null;
        }
    }

    /**
     * Custom block listener that filters for collaboration-relevant events only
     * This runs alongside the VM's main blockListener but only syncs meaningful code changes
     */
    collaborationBlockListener(event) {
        // Skip if we're not connected or if we're applying a remote change
        if (!this.isConnected || this.isApplyingRemoteChange) {
            // Add extra debugging during remote changes to see what events are being filtered
            if (this.isApplyingRemoteChange) {
                console.log('🔇 Filtered event during remote change:', event.type, event.blockId);
            }
            return;
        }

        // Skip events that are part of programmatic changes (no group ID usually means programmatic)
        // User-initiated events typically have a group ID
        if (!event.group) {
            console.log('🔇 Filtered event without group:', event.type, event.blockId);
            return;
        }

        // Skip events that are marked as originating from sync operations
        if (this.isSyncOperation || event._syncOriginated) {
            console.log('🔇 Filtered sync-originated event:', event.type, event.blockId);
            return;
        }

        // Skip non-meaningful events that should not be synced
        if (!this.shouldSyncEvent(event)) return;

        console.log('🔄 Syncing block event:', event.type, 'blockId:', event.blockId, 'group:', event.group);
        
        // For move events, log the parent/input information for debugging
        if (event.type === 'move') {
            console.log('📤 Original move event:', {
                id: event.blockId,
                oldParent: event.oldParent,
                newParent: event.newParent,
                oldInput: event.oldInput,
                newInput: event.newInput
            });
        }
        
        // For delete events, log the IDs being deleted
        if (event.type === 'delete') {
            console.log('📤 Original delete event:', {
                blockId: event.blockId,
                ids: event.ids
            });
        }
        
        // Serialize the event
        const serializedEvent = this.serializeEvent(event);
        console.log('📤 Serialized event:', serializedEvent);
        
        // Get the current editing target to include in the sync
        const editingTarget = this.vm && this.vm.editingTarget ? this.vm.editingTarget.id : null;
        
        // Send the block event to other collaborators
        this.sendMessage('block-event', {
            event: serializedEvent,
            targetId: editingTarget,
            timestamp: Date.now()
        });
    }

    /**
     * Determine if a Blockly event should be synced to other collaborators
     * Only sync events that represent actual code changes, not UI navigation
     */
    shouldSyncEvent(event) {
        console.log('🤔 Checking if should sync event:', event.type, event);
        
        if (!event || !event.type) {
            console.log('❌ No event or event type');
            return false;
        }

        // Always sync these core block operations
        const syncableEvents = [
            'create',     // Block creation
            'delete',     // Block deletion  
            'change',     // Block field/property changes
            'move',       // Block connections/disconnections (but not position-only moves)
            'var_create', // Variable creation
            'var_delete', // Variable deletion
            'var_rename', // Variable renaming
            'comment_create', // Comment creation
            'comment_delete', // Comment deletion
            'comment_change'  // Comment changes
        ];

        if (!syncableEvents.includes(event.type)) {
            console.log('❌ Event type not in syncable list:', event.type);
            return false;
        }

        // For move events, sync both connection changes AND position changes
        if (event.type === 'move') {
            // Always sync move events - they could be position changes or connection changes
            // Both are important for collaboration
            console.log('� Syncing move event - connection or position change');
            return true;
        }

        // For change events, skip some UI-only changes
        if (event.type === 'change') {
            // Skip if it's just a visual/UI change like selection
            if (event.element === 'select' || event.element === 'click') {
                console.log('❌ Skipping UI-only change event');
                return false;
            }
        }

        console.log('✅ Event should be synced:', event.type);
        return true;
    }

    /**
     * Serialize a Blockly event for transmission to other collaborators
     * Remove unnecessary data and ensure it's JSON-serializable
     */
    serializeEvent(event) {
        // Helper function to safely serialize values
        const safeSerialize = (value) => {
            if (value === null || value === undefined) return value;
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
            if (Array.isArray(value)) return value.map(safeSerialize);
            if (typeof value === 'object') {
                // For DOM elements, convert to string representation
                if (value.nodeType && value.outerHTML) {
                    return value.outerHTML;
                }
                // For coordinate objects, extract only x and y
                if (value.x !== undefined && value.y !== undefined) {
                    return { x: value.x, y: value.y };
                }
                // For other objects, try to extract only primitive properties
                const safe = {};
                for (const key in value) {
                    if (value.hasOwnProperty && value.hasOwnProperty(key)) {
                        const prop = value[key];
                        if (typeof prop === 'string' || typeof prop === 'number' || typeof prop === 'boolean') {
                            safe[key] = prop;
                        }
                    }
                }
                return safe;
            }
            // For functions or other non-serializable types, return null
            return null;
        };

        const serialized = {
            type: event.type,
            blockId: safeSerialize(event.blockId),
            workspaceId: safeSerialize(event.workspaceId),
            group: safeSerialize(event.group)
        };

        // Include event-specific data
        switch (event.type) {
            case 'create':
                // Convert XML DOM element to string
                if (event.xml && event.xml.outerHTML) {
                    serialized.xml = event.xml.outerHTML;
                } else if (typeof event.xml === 'string') {
                    serialized.xml = event.xml;
                }
                serialized.ids = safeSerialize(event.ids);
                // Include position data for create events
                if (event.x !== undefined) serialized.x = safeSerialize(event.x);
                if (event.y !== undefined) serialized.y = safeSerialize(event.y);
                break;
            
            case 'delete':
                serialized.ids = safeSerialize(event.ids);
                // Also include blockId for single block deletes
                if (event.blockId !== undefined) {
                    serialized.blockId = safeSerialize(event.blockId);
                }
                break;
            
            case 'change':
                serialized.element = safeSerialize(event.element);
                serialized.name = safeSerialize(event.name);
                serialized.oldValue = safeSerialize(event.oldValue);
                serialized.newValue = safeSerialize(event.newValue);
                break;
            
            case 'move':
                serialized.oldParentId = safeSerialize(event.oldParent);
                serialized.newParentId = safeSerialize(event.newParent);
                serialized.oldInputName = safeSerialize(event.oldInput);
                serialized.newInputName = safeSerialize(event.newInput);
                serialized.oldCoordinate = safeSerialize(event.oldCoordinate);
                serialized.newCoordinate = safeSerialize(event.newCoordinate);

                if (event.x !== undefined) serialized.x = safeSerialize(event.x);
                if (event.y !== undefined) serialized.y = safeSerialize(event.y);
                
                if (event.reason !== undefined) serialized.reason = safeSerialize(event.reason);
                break;
                
            case 'var_create':
            case 'var_delete':
            case 'var_rename':
                serialized.varId = safeSerialize(event.varId);
                serialized.varName = safeSerialize(event.varName);
                serialized.varType = safeSerialize(event.varType);
                if (event.newName) serialized.newName = safeSerialize(event.newName);
                break;
                
            case 'comment_create':
            case 'comment_delete':
            case 'comment_change':
                serialized.commentId = safeSerialize(event.commentId);
                if (event.text) serialized.text = safeSerialize(event.text);
                if (event.xy) serialized.xy = safeSerialize(event.xy);
                if (event.width) serialized.width = safeSerialize(event.width);
                if (event.height) serialized.height = safeSerialize(event.height);
                if (event.minimized !== undefined) serialized.minimized = safeSerialize(event.minimized);
                break;
        }

        return serialized;
    }

    /**
     * Generate a unique peer ID for a room to prevent collisions
     */
    generatePeerId(roomId, isHost = false) {
        const sanitizedRoomId = roomId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

        if (isHost) {
            // Host ID is predictable based on room name
            return `mistwarp-collab-${sanitizedRoomId}-host`;
        } else {
            // User IDs include timestamp and random string to prevent collisions
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substr(2, 9);
            return `mistwarp-collab-${sanitizedRoomId}-user-${timestamp}-${randomString}`;
        }
    }

    /**
     * Create or join a collaboration room
     */
    async connectToRoom(roomId, username, isHost = false) {
        console.log('🚀 connectToRoom called with roomId:', roomId, 'username:', username, 'isHost:', isHost);
        
        try {
            // Clean up any existing connection first
            if (this.peer) {
                console.log('🧹 Cleaning up existing peer connection before creating new room');
                this.disconnect();
                // Wait a bit for cleanup to complete
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            this.roomId = roomId;
            console.log('🏷️ Set roomId to:', this.roomId);
            this.username = username || `User${Math.floor(Math.random() * 1000)}`;
            this.isHost = isHost;

            // Import PeerJS dynamically
            const { Peer } = await import('peerjs');

            // Create peer with room-specific ID to prevent collisions
            const peerId = this.generatePeerId(roomId, isHost);

            this.peer = new Peer(peerId, this.peerConfig);

            return new Promise((resolve, reject) => {
                this.peer.on('open', (id) => {
                    console.log('Connected to room with ID:', id);
                    this.isConnected = true;

                    if (this.isHost) {
                        this.setupHost();
                    } else {
                        this.connectToHost();
                    }

                    resolve(id);
                });

                this.peer.on('error', (error) => {
                    console.error('Peer connection error:', error);
                    // Store room ID before cleanup since disconnect() will clear it
                    const roomIdForError = this.roomId;
                    
                    // If we have a connection failure handler (during host connection), use it
                    if (this.currentConnectionFailureHandler) {
                        console.log('🔗 Calling connection failure handler from peer error');
                        this.currentConnectionFailureHandler(`Could not connect to host. Room "${roomIdForError}" may not exist or host may be offline.`);
                        return;
                    }
                    
                    // Otherwise handle as a general peer error
                    // Clean up state when peer fails to initialize
                    this.disconnect();
                    reject(error);
                });

                this.peer.on('connection', (conn) => {
                    this.handleIncomingConnection(conn);
                });
            });
        } catch (error) {
            console.error('Failed to connect to room:', error);
            // Clean up any partial state if room connection fails
            this.disconnect();
            throw error;
        }
    }

    /**
     * Setup host functionality
     */
    setupHost() {
        console.log('Setting up as host for room:', this.roomId);
        this.hostId = this.peer.id; // Set this peer as the host
        this.isConnectedToHost = true; // Host is automatically connected
        const hostUser = {
            id: this.peer.id,
            username: this.username,
            isHost: true
        };
        this.users.set(this.peer.id, hostUser);

        // Emit room created event
        this.emit('room-created', { roomId: this.roomId, hostId: this.peer.id });

        // Emit initial user joined event for the host
        this.emit('user-joined', hostUser);
    }

    /**
     * Connect to the host of the room
     */
    connectToHost() {
        // Generate the expected host ID for this room
        const hostId = this.generatePeerId(this.roomId, true);
        this.hostId = hostId; // Set the host ID
        console.log('🔌 Connecting to host:', hostId);

        // Add ourselves to the users list when joining
        const ourUser = {
            id: this.peer.id,
            username: this.username,
            isHost: false
        };
        this.users.set(this.peer.id, ourUser);
        this.emit('user-joined', ourUser);

        // Store room ID before any cleanup operations
        const roomIdForError = this.roomId;
        let errorHandled = false;
        let connectionTimeout = null;
        let conn = null;

        // Function to handle connection failure (called by both timeout and error handlers)
        const handleConnectionFailure = (errorMessage) => {
            if (errorHandled) {
                console.log('🛑 Connection error already handled, skipping duplicate');
                return;
            }
            errorHandled = true;
            console.error('💥 Connection failed:', errorMessage);
            if (connectionTimeout) {
                clearTimeout(connectionTimeout);
                connectionTimeout = null;
            }
            // Close the connection if it exists
            if (conn) {
                conn.close();
            }
            // Clean up the entire peer connection and reset state
            this.disconnect();
            this.emit('connection-failed', {
                error: errorMessage
            });
        };

        // Store the failure handler so we can call it from the peer error handler
        this.currentConnectionFailureHandler = handleConnectionFailure;

        try {
            conn = this.peer.connect(hostId, {
                label: 'collaboration',
                metadata: {
                    username: this.username,
                    roomId: this.roomId
                },
                reliable: true
            });

            console.log('🚀 Connection attempt initiated to:', hostId);

            // Set a longer timeout for connection
            connectionTimeout = setTimeout(() => {
                if (!conn.open) {
                    console.error('⏱️ Connection to host timed out after 15 seconds');
                    handleConnectionFailure(`Connection to room "${roomIdForError}" timed out. Host may not be available.`);
                }
            }, 15000); // 15 second timeout

            conn.on('open', () => {
                if (!errorHandled) {
                    if (connectionTimeout) {
                        clearTimeout(connectionTimeout);
                        connectionTimeout = null;
                    }
                    // Clear the failure handler since we succeeded
                    this.currentConnectionFailureHandler = null;
                    console.log('🎉 Successfully connected to host!');
                }
            });

            // Add error handling for connection attempt
            conn.on('error', (error) => {
                console.log('🚨 Connection error event fired:', error);
                handleConnectionFailure(`Could not connect to host. Room "${roomIdForError}" may not exist or host may be offline.`);
            });

            // Add ICE connection state monitoring
            conn.peerConnection.addEventListener('iceconnectionstatechange', () => {
                console.log('🧊 ICE connection state:', conn.peerConnection.iceConnectionState);
            });

            conn.peerConnection.addEventListener('connectionstatechange', () => {
                console.log('🔗 Connection state:', conn.peerConnection.connectionState);
            });

            this.handleConnection(conn);
        } catch (error) {
            console.error('Error connecting to host:', error);
            // Store room ID before cleanup since disconnect() will clear it
            const roomIdForError = this.roomId;
            // Clean up the entire peer connection and reset state
            this.disconnect();
            this.emit('connection-failed', {
                error: `Failed to connect to room "${roomIdForError}". Please check the room name.`
            });
        }
    }

    /**
     * Handle incoming peer connections
     */
    handleIncomingConnection(conn) {
        console.log('Host: Incoming connection from:', conn.peer);

        // For incoming connections on the host, we should immediately set up the connection
        // The client will send us a user-join message once the connection opens
        this.handleConnection(conn);
    }

    /**
     * Setup connection event handlers
     */
    handleConnection(conn) {
        console.log('Setting up connection with:', conn.peer);

        // Store connection immediately
        this.connections.set(conn.peer, conn);

        // Set up all event handlers first
        conn.on('open', () => {
            console.log('✓ Connection opened with:', conn.peer);

            // If we're connecting to the host, mark as connected to host
            if (!this.isHost && conn.peer === this.hostId) {
                this.isConnectedToHost = true;
                console.log('🎉 Successfully connected to host!');
                this.emit('connected-to-host');
            }

            // Only send user join message if we initiated the connection (we're the client)
            if (!this.isHost) {
                // Client: Send user join message
                const userInfo = {
                    id: this.peer.id,
                    username: this.username,
                    isHost: this.isHost
                };

                console.log('Client: Sending user-join message:', userInfo);
                this.sendMessage('user-join', userInfo, conn);

                // Request sync from host
                this.sendMessage('sync-request', {}, conn);
                
                // Debug targets before sync
                this.debugTargetStates('Before requesting sync');
            } else {
                // Host: Wait for user-join message, but send project state
                console.log('Host: Connection ready, waiting for user-join message');

                // Send current project state to new client
                if (this.vm) {
                    this.debugTargetStates('Host sending project sync');
                    this.sendProjectSync(conn);
                }
            }
        });

        conn.on('data', (data) => {
            console.log('📨 Received data from', conn.peer, ':', data.type);
            this.handleMessage(data, conn);
        });

        conn.on('close', () => {
            console.log('❌ Connection closed with:', conn.peer);
            this.connections.delete(conn.peer);
            this.users.delete(conn.peer);
            
            // Check if the host left
            if (conn.peer === this.hostId && !this.isHost) {
                console.log('🏠 Host has left the room, closing collaboration');
                this.emit('host-left');
                return;
            }
            
            // Only emit user-left if we weren't kicked and it's not the host
            if (!this.wasKicked) {
                this.emit('user-left', { id: conn.peer });
            }
        });

        conn.on('error', (error) => {
            console.error('💥 Connection error with', conn.peer, ':', error);
            this.connections.delete(conn.peer);
            this.users.delete(conn.peer);
        });

        // If connection is already open, trigger the open handler
        if (conn.open) {
            console.log('Connection already open, triggering open handler');
            conn.emit('open');
        }
    }

    /**
     * Handle incoming messages
     */
    handleMessage(data, conn) {
        const { type, payload, sender } = data;

        if (this.messageHandlers[type]) {
            // Add sender information to payload for handlers that need it
            const enrichedPayload = { ...payload, sender };
            this.messageHandlers[type](enrichedPayload, conn);
        } else {
            console.warn('Unknown message type:', type);
        }
    }

    /**
     * Send a message to all connected peers or specific connection
     */
    sendMessage(type, payload, targetConn = null) {
        const message = { type, payload, sender: this.peer.id, timestamp: Date.now() };

        if (targetConn) {
            if (targetConn.open) {
                targetConn.send(message);
            }
        } else {
            this.connections.forEach((conn) => {
                if (conn.open) {
                    conn.send(message);
                }
            });
        }
    }

    /**
     * Message handlers
     */
    handleUserJoin(payload, conn) {
        console.log('User joined:', payload);

        // Don't add ourselves again if we're already in the list
        if (payload.id === this.peer.id) {
            console.log('Ignoring self join message');
            return;
        }

        this.users.set(payload.id, payload);
        this.emit('user-joined', payload);

        // If we're the host, send the current user list to the new user
        if (this.isHost) {
            console.log('Host: Sending user list to new user');
            // Send current users to the new connection
            const currentUsers = Array.from(this.users.values());
            this.sendMessage('users-list', { users: currentUsers }, conn);

            // Broadcast to all other peers that a new user joined
            this.connections.forEach((connection) => {
                if (connection !== conn && connection.open) {
                    console.log('Host: Broadcasting new user to existing peers');
                    connection.send({
                        type: 'user-join',
                        payload,
                        sender: this.peer.id,
                        timestamp: Date.now()
                    });
                }
            });

            // Emit users updated event for host UI
            this.emit('users-updated', { users: currentUsers });
        }
    }

    handleUserLeave(payload, conn) {
        this.users.delete(payload.id);
        this.emit('user-left', payload);
    }

    handleUsersList(payload, conn) {
        // Received the current users list from host
        console.log('Received users list from host:', payload.users);

        // Don't clear our own user if we're not in the host's list yet
        const ourUser = this.users.get(this.peer.id);

        this.users.clear();
        payload.users.forEach(user => {
            this.users.set(user.id, user);
        });

        // Make sure we're still in the list
        if (ourUser && !this.users.has(this.peer.id)) {
            this.users.set(this.peer.id, ourUser);
        }

        console.log('Updated users list:', Array.from(this.users.values()));
        this.emit('users-updated', { users: Array.from(this.users.values()) });
    }

    handleUsernameChange(payload, conn) {
        if (this.users.has(payload.id)) {
            this.users.get(payload.id).username = payload.username;
            this.emit('username-changed', payload);
        }
    }

    handleKickUser(payload, conn) {
        if (payload.targetId === this.peer.id) {
            // We're being kicked - set flag before disconnecting
            this.wasKicked = true;
            this.disconnect();
            this.emit('kicked-from-room', payload);
        } else if (this.isHost) {
            // Host is kicking someone else, close their connection
            const targetConn = this.connections.get(payload.targetId);
            if (targetConn) {
                targetConn.close();
                this.connections.delete(payload.targetId);
                this.users.delete(payload.targetId);
            }
        }
    }

    handleSyncRequest(payload, conn) {
        if (this.isHost) {
            console.log('📨 Host received sync request from client');
            this.debugTargetStates('Host handling sync request');
            this.sendProjectSync(conn);
        }
    }

    handleProjectSync(payload, conn) {
        if (!this.isHost && this.vm) {
            // Apply project sync from host (only during initial room joining)
            console.log('📥 Applying initial project sync from host');
            console.log('📥 Project contains targets:', payload.targetInfo);
            console.log('📥 Host editing target:', payload.currentEditingTarget);
            
            // DEBUG: Log some block IDs from the received project data before loading
            if (payload.projectData.targets && payload.projectData.targets.length > 0) {
                for (const target of payload.projectData.targets) {
                    if (target.blocks) {
                        const blockIds = Object.keys(target.blocks).slice(0, 3); // First 3 block IDs
                        console.log(`📥 Received ${target.name} block IDs (sample):`, blockIds);
                    }
                }
            }
            
            // Set both flags to prevent ANY events during sync from being transmitted
            this.isApplyingRemoteChange = true;
            this.isSyncOperation = true;
            
            // Also temporarily detach from workspace to prevent event capture during load
            const wasAttachedToWorkspace = !!this.workspace;
            if (wasAttachedToWorkspace) {
                console.log('🔇 Temporarily detaching from workspace during project sync');
                this.detachFromWorkspace();
            }
            
            // IMPORTANT: Modify the project data to include the correct target IDs BEFORE loading
            // This prevents the VM from creating new targets with different IDs
            if (payload.projectData.targets && payload.targetInfo) {
                payload.projectData.targets.forEach((targetData, i) => {
                    if (payload.targetInfo[i] && payload.targetInfo[i].id) {
                        // Set the target ID in the project data itself
                        targetData.id = payload.targetInfo[i].id;
                        console.log(`📥 Pre-setting target ${i} ID to:`, targetData.id);
                    }
                });
            }
            
            // Load the project and wait for it to complete
            this.vm.loadProject(payload.projectData).then(() => {
                console.log('📥 Project loaded successfully');
                
                // DEBUG: Log block IDs after loading to see if they changed
                this.vm.runtime.targets.forEach((target, i) => {
                    if (target.blocks && target.blocks._blocks) {
                        const blockIds = Object.keys(target.blocks._blocks).slice(0, 3); // First 3 block IDs
                        console.log(`📥 After loading ${target.getName()} block IDs (sample):`, blockIds);
                    }
                });
                
                // CRITICAL: Force target IDs to match host after loading if they don't match
                // Sometimes VM.loadProject doesn't preserve the IDs we set
                if (payload.targetInfo) {
                    payload.targetInfo.forEach((expectedTarget, i) => {
                        const actualTarget = this.vm.runtime.targets[i];
                        if (actualTarget && actualTarget.id !== expectedTarget.id) {
                            console.warn(`⚠️ Target ID mismatch at index ${i}: expected ${expectedTarget.id}, got ${actualTarget.id}`);
                            console.log(`🔧 Force-setting target ${i} ID from ${actualTarget.id} to ${expectedTarget.id}`);
                            
                            // Force the target ID to match the host
                            actualTarget.id = expectedTarget.id;
                            
                            // Also update the runtime's target lookup if it exists
                            if (this.vm.runtime._targets) {
                                // Remove old ID mapping
                                delete this.vm.runtime._targets[actualTarget.id];
                                // Add new ID mapping
                                this.vm.runtime._targets[expectedTarget.id] = actualTarget;
                            }
                        }
                    });
                }
                
                // Verify that target IDs match what we expect (should be correct now)
                const ourTargets = this.vm.runtime.targets.map(target => ({
                    id: target.id,
                    name: target.getName(),
                    isOriginal: target.isOriginal
                }));
                console.log('📥 Our targets after sync (should match host exactly):', ourTargets);
                
                // Final verification of target IDs
                let allTargetsMatch = true;
                if (payload.targetInfo) {
                    payload.targetInfo.forEach((expectedTarget, i) => {
                        const actualTarget = this.vm.runtime.targets[i];
                        if (actualTarget && actualTarget.id !== expectedTarget.id) {
                            console.error(`❌ CRITICAL: Target ID still mismatched at index ${i}: expected ${expectedTarget.id}, got ${actualTarget.id}`);
                            allTargetsMatch = false;
                        }
                    });
                }
                
                if (allTargetsMatch) {
                    console.log('✅ All target IDs match host expectations');
                } else {
                    console.error('❌ CRITICAL: Target ID mismatch persists - collaboration may not work properly');
                }
                
                // Create a mapping for quick target ID lookups during block events
                this.targetMapping = {};
                if (payload.targetInfo) {
                    payload.targetInfo.forEach((targetInfo, i) => {
                        const actualTarget = this.vm.runtime.targets[i];
                        if (actualTarget) {
                            this.targetMapping[targetInfo.id] = actualTarget.id;
                            // Since we've forced the IDs to match, they should be the same
                            console.log(`📍 Target mapping: ${targetInfo.id} -> ${actualTarget.id}`);
                        }
                    });
                }
                
                // Set the editing target directly since IDs should match now
                if (payload.currentEditingTarget) {
                    const targetExists = this.vm.runtime.getTargetById(payload.currentEditingTarget);
                    if (targetExists) {
                        console.log('🎯 Setting editing target to match host:', payload.currentEditingTarget);
                        this.vm.setEditingTarget(payload.currentEditingTarget);
                    } else {
                        console.warn('⚠️ Host editing target not found:', payload.currentEditingTarget);
                        console.log('🔍 Available targets:', this.vm.runtime.targets.map(t => ({ id: t.id, name: t.getName() })));
                        
                        // Fallback to first non-stage target
                        const fallbackTarget = ourTargets.find(t => !t.isOriginal);
                        if (fallbackTarget) {
                            console.log('🎯 Using fallback editing target:', fallbackTarget.id);
                            this.vm.setEditingTarget(fallbackTarget.id);
                        }
                    }
                }
                
                // Re-attach to workspace if we were attached before
                if (wasAttachedToWorkspace) {
                    // Wait a bit before re-attaching to ensure all project load events have settled
                    setTimeout(() => {
                        console.log('🔊 Re-attaching to workspace after project sync');
                        this.emit('request-workspace-reattach');
                    }, 500);
                }
                
                // Clear the sync operation flag first, then the remote change flag
                setTimeout(() => {
                    this.isSyncOperation = false;
                    console.log('🔓 Clearing sync operation flag');
                }, 1000);
                
                setTimeout(() => {
                    this.isApplyingRemoteChange = false;
                    console.log('🔓 Clearing remote change flag after project sync');
                    
                    // Debug targets after sync completion
                    const finalState = this.debugTargetStates('After project sync complete');
                    
                    // Emit event to notify that sync is complete
                    this.emit('project-synced', {
                        targets: finalState.targets,
                        editingTarget: finalState.editingTarget ? finalState.editingTarget.id : null
                    });
                }, 1500);
            }).catch((error) => {
                console.error('❌ Failed to load project during sync:', error);
                this.isApplyingRemoteChange = false;
                this.isSyncOperation = false;
                
                // Re-attach to workspace even on error
                if (wasAttachedToWorkspace) {
                    setTimeout(() => {
                        this.emit('request-workspace-reattach');
                    }, 500);
                }
                
                this.emit('sync-failed', { error });
            });
        }
    }

    handleTargetsUpdate(payload, conn) {
        // Handle targets update (sprite creation/deletion) from other users
        if (this.vm && payload.sender !== this.peer.id && !this.isApplyingRemoteChange) {
            // Apply targets update from other user
            console.log('Applying targets update from:', payload.sender);
            // Note: targets updates are typically handled via project sync, 
            // so we might just log this for now to avoid conflicts
        }

        // If we're the host, broadcast to all other peers (except the sender)
        // But don't broadcast if we're currently applying a remote change
        if (this.isHost && payload.sender !== this.peer.id && !this.isApplyingRemoteChange) {
            this.connections.forEach((connection) => {
                if (connection !== conn && connection.open) {
                    connection.send({
                        type: 'targets-update',
                        payload,
                        sender: payload.sender,
                        timestamp: Date.now()
                    });
                }
            });
        }
    }

    handleBlockEvent(payload, conn, isRetry = false) {
        // Don't apply our own events back to ourselves
        if (payload.sender === this.peer.id) {
            return;
        }

        console.log('📥 Received block event:', payload);

        // Apply the block event to the local workspace
        if (this.vm && payload.event) {
            this.isApplyingRemoteChange = true;
            
            try {
                // Reconstruct the event for the VM
                const reconstructedEvent = this.reconstructEvent(payload.event);
                console.log('📥 Reconstructed event:', reconstructedEvent);
                
                // Mark this event as sync-originated to prevent re-transmission
                reconstructedEvent._syncOriginated = true;
                
                // General safety check before applying any event
                if (!this.vm || !this.vm.blockListener) return;
                
                // Light safety check for create events - just need VM runtime
                if (reconstructedEvent.type === 'create' && !this.vm.runtime) return;

                // Use target mapping to translate target IDs if needed
                let targetIdToUse = payload.targetId;
                if (this.targetMapping[payload.targetId]) {
                    targetIdToUse = this.targetMapping[payload.targetId];
                    console.log(`📍 Mapped target ID ${payload.targetId} -> ${targetIdToUse}`);
                } else if (!this.vm.runtime.getTargetById(payload.targetId)) {
                    console.warn(`⚠️ Target ${payload.targetId} not found, searching for alternatives`);
                    // Try to find target by name as fallback
                    for (const target of this.vm.runtime.targets) {
                        if (target.getName() === (reconstructedEvent.targetName || '')) {
                            targetIdToUse = target.id;
                            console.log(`📍 Found target by name: ${targetIdToUse}`);
                            break;
                        }
                    }
                }

                // Additional safety checks for events that access existing blocks
                if (['delete', 'move', 'change'].includes(reconstructedEvent.type)) {
                    if (!this.vm.runtime) return;
                    
                    // Find the target that contains the blocks
                    let targetBlocks = null;
                    
                    if (targetIdToUse) {
                        // Try to find the specific target
                        const target = this.vm.runtime.getTargetById(targetIdToUse);
                        if (target && target.blocks && target.blocks._blocks) {
                            targetBlocks = target.blocks._blocks;
                            console.log('📍 Found target blocks for target:', targetIdToUse);
                        } else {
                            console.warn('⚠️ Target not found or has no blocks:', targetIdToUse);
                        }
                    }
                    
                    // Fallback: search all targets for the block
                    if (!targetBlocks) {
                        console.log('🔍 Searching all targets for block:', reconstructedEvent.id);
                        for (const target of this.vm.runtime.targets) {
                            if (target.blocks && target.blocks._blocks && target.blocks._blocks[reconstructedEvent.id]) {
                                targetBlocks = target.blocks._blocks;
                                targetIdToUse = target.id; // Update the target ID to use
                                console.log('📍 Found block in target:', target.id);
                                break;
                            }
                        }
                    }
                    
                    if (!targetBlocks) {
                        if (isRetry) return;
                        console.warn('⚠️ No target found containing the required blocks, queueing event');
                        this.queuePendingEvent(payload);
                        return;
                    }
                    
                    // Specific safety check for move events
                    if (reconstructedEvent.type === 'move') {
                        console.log('🔗 Processing move event - block:', reconstructedEvent.id, 
                                   'oldParent:', reconstructedEvent.oldParent, 
                                   'newParent:', reconstructedEvent.newParent,
                                   'oldInput:', reconstructedEvent.oldInput,
                                   'newInput:', reconstructedEvent.newInput);
                        
                        if (!targetBlocks[reconstructedEvent.id]) {
                            if (isRetry) return;
                            console.warn('⚠️ Queueing move event for non-existent block:', reconstructedEvent.id);
                            this.queuePendingEvent(payload);
                            return;
                        }
                        // For move events with oldParent, make sure the old parent exists
                        if (reconstructedEvent.oldParent && !targetBlocks[reconstructedEvent.oldParent]) {
                            if (isRetry) return;
                            console.warn('⚠️ Queueing move event - oldParent block does not exist:', reconstructedEvent.oldParent);
                            this.queuePendingEvent(payload);
                            return;
                        }
                        // For move events with newParent, make sure the new parent exists  
                        if (reconstructedEvent.newParent && !targetBlocks[reconstructedEvent.newParent]) {
                            if (isRetry) return;
                            console.warn('⚠️ Queueing move event - newParent block does not exist:', reconstructedEvent.newParent);
                            this.queuePendingEvent(payload);
                            return;
                        }
                    }
                    
                    // Safety check for delete events - be more lenient since blocks might already be deleted
                    if (reconstructedEvent.type === 'delete' && reconstructedEvent.ids) {
                        // For delete events, we're more lenient - if the blocks don't exist, they're already deleted
                        // which is fine. We only queue if there's a structural issue.
                        console.log('🗑️ Processing delete event for blocks:', reconstructedEvent.ids);
                        
                        // Check if ANY of the blocks exist - if none exist, they might already be deleted
                        const someBlockExists = Array.isArray(reconstructedEvent.ids) 
                            ? reconstructedEvent.ids.some(id => targetBlocks[id])
                            : targetBlocks[reconstructedEvent.ids];
                        
                        if (!someBlockExists) {
                            console.log('ℹ️ Delete event for already deleted blocks, skipping:', reconstructedEvent.ids);
                            // Don't queue this - just skip it since blocks are already deleted
                            return;
                        }
                    }
                    
                    // Safety check for change events - make sure block exists
                    if (reconstructedEvent.type === 'change' && reconstructedEvent.blockId) {
                        if (!targetBlocks[reconstructedEvent.blockId]) {
                            if (isRetry) return;
                            console.warn('⚠️ Queueing change event for non-existent block:', reconstructedEvent.blockId);
                            this.queuePendingEvent(payload);
                            return;
                        }
                    }
                }
                
                // Apply the event through the VM's block listener
                console.log('📍 Applying event to target:', targetIdToUse);
                const targetForEvent = this.vm.runtime.getTargetById(targetIdToUse);
                
                if (!targetForEvent) {
                    console.warn('⚠️ Target not found for event:', targetIdToUse);
                    if (isRetry) return;
                    this.queuePendingEvent(payload);
                    return;
                }
                
                // Remember current editing target to restore later
                const originalTarget = this.vm.editingTarget;
                
                // Switch to the target that should receive the event if needed
                if (originalTarget && originalTarget.id !== payload.targetId) {
                    console.log('🔄 Switching from target', originalTarget.id, 'to', payload.targetId, 'for event');
                    this.vm.setEditingTarget(payload.targetId);
                }
                
                // Apply the event - extend the remote change flag to cover any cascading events
                const originalFlag = this.isApplyingRemoteChange;
                this.isApplyingRemoteChange = true;
                
                try {
                    console.log('🔧 Applying event to target blocks');
                    targetForEvent.blocks.blocklyListen(reconstructedEvent);

                    if (['move','delete'].includes(reconstructedEvent.type)) {
                        if (this.workspace && this.workspace.render) this.workspace.render();
                        this.vm.emitWorkspaceUpdate();
                    }
                } finally {
                    // Much shorter delay since we have better event filtering
                    setTimeout(() => {
                        this.isApplyingRemoteChange = originalFlag;
                        console.log('🔓 Cleared extended remote change flag after block application');
                    }, 25); // Reduced from 50ms
                }
                
                // Restore original target if we switched
                if (originalTarget) {
                    console.log('🔄 Restoring original editing target:', originalTarget.id);
                    this.vm.setEditingTarget(originalTarget.id);
                }
                
                // If this was a create event, trigger processing of pending events
                // since new blocks might satisfy dependencies for queued events
                if (reconstructedEvent.type === 'create' && this.pendingEvents.length > 0) {
                    console.log('🔄 Triggering pending events processing after block creation');
                    setTimeout(() => this.processPendingEvents(), 100);
                }
                
                // Force additional UI updates for all events with more aggressive rendering
                setTimeout(() => {
                    console.log('🔄 Triggering comprehensive workspace refresh');
                    this.vm.emitWorkspaceUpdate();
                    
                    // For move events, also trigger comprehensive workspace rendering
                    if (reconstructedEvent.type === 'move' && this.workspace) {
                        console.log('🎨 Triggering comprehensive workspace refresh for move event');
                        
                        // Multiple approaches to force UI refresh
                        if (this.workspace.render) {
                            this.workspace.render();
                        }
                        
                        // Force all blocks to re-render
                        if (this.workspace.getAllBlocks) {
                            const allBlocks = this.workspace.getAllBlocks();
                            allBlocks.forEach(block => {
                                if (block.render) {
                                    block.render();
                                }
                            });
                        }
                        
                        // Force workspace resize (this often triggers proper rendering)
                        if (this.workspace.resizeContents) {
                            this.workspace.resizeContents();
                        }
                        
                        // Try to get the specific moved block and force its rendering
                        if (this.workspace.getBlockById) {
                            const block = this.workspace.getBlockById(reconstructedEvent.id);
                            if (block) {
                                console.log('🔗 Forcing comprehensive block refresh for moved block');
                                if (block.render) {
                                    block.render();
                                }
                                // Update connections
                                if (block.bumpNeighbours) {
                                    block.bumpNeighbours();
                                }
                                // Force parent block to update if it exists
                                if (reconstructedEvent.newParent && this.workspace.getBlockById(reconstructedEvent.newParent)) {
                                    const parentBlock = this.workspace.getBlockById(reconstructedEvent.newParent);
                                    console.log('🔗 Forcing parent block refresh');
                                    if (parentBlock.render) {
                                        parentBlock.render();
                                    }
                                }
                            }
                        }
                    }
                }, 100); // Longer delay for comprehensive refresh
                
            } catch (error) {
                console.error('❌ Error applying remote block event:', error);
            } finally {
                // Much shorter delay since we have better event filtering
                setTimeout(() => {
                    this.isApplyingRemoteChange = false;
                    console.log('🔓 Cleared remote change flag after block event');
                }, 100);
            }
        }

        // If we're the host, broadcast to all other peers (except the sender)
        if (this.isHost && payload.sender !== this.peer.id) {
            this.connections.forEach((connection) => {
                if (connection !== conn && connection.open) {
                    connection.send({
                        type: 'block-event',
                        payload,
                        sender: payload.sender,
                        timestamp: Date.now()
                    });
                }
            });
        }
    }

    /**
     * Reconstruct a Blockly event from serialized data for the VM
     */
    reconstructEvent(serializedEvent) {
        const event = { ...serializedEvent };

        // Handle XML conversion for create events
        if (event.type === 'create' && event.xml && typeof event.xml === 'string') {
            try {
                // Convert XML string back to DOM element
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(event.xml, 'text/xml');
                event.xml = xmlDoc.documentElement;
            } catch (error) {
                console.warn('Failed to parse XML for create event:', error);
                // If parsing fails, remove the xml property to prevent errors
                delete event.xml;
            }
        }

        // Handle coordinate objects - ensure they have the right structure
        if (event.oldCoordinate && typeof event.oldCoordinate === 'object') {
            // Make sure coordinate has x and y properties
            if (event.oldCoordinate.x !== undefined && event.oldCoordinate.y !== undefined) {
                // Create a proper coordinate-like object
                event.oldCoordinate = {
                    x: Number(event.oldCoordinate.x),
                    y: Number(event.oldCoordinate.y)
                };
            }
        }

        if (event.newCoordinate && typeof event.newCoordinate === 'object') {
            // Make sure coordinate has x and y properties
            if (event.newCoordinate.x !== undefined && event.newCoordinate.y !== undefined) {
                // Create a proper coordinate-like object
                event.newCoordinate = {
                    x: Number(event.newCoordinate.x),
                    y: Number(event.newCoordinate.y)
                };
            }
        }

        // Ensure numeric position values are properly typed
        if (event.x !== undefined) event.x = Number(event.x);
        if (event.y !== undefined) event.y = Number(event.y);

        // Map blockId to id for all event types that use it
        if (event.blockId !== undefined) {
            event.id = event.blockId;
            // Keep blockId for compatibility but also set id
        }

        // For delete events, ensure we have proper ID mapping
        if (event.type === 'delete') {
            // If we have ids but no blockId, and ids is a single item, use it as blockId/id
            if (event.ids && !event.blockId) {
                if (Array.isArray(event.ids) && event.ids.length === 1) {
                    event.id = event.ids[0];
                    event.blockId = event.ids[0];
                } else if (!Array.isArray(event.ids)) {
                    event.id = event.ids;
                    event.blockId = event.ids;
                }
            }
        }

        // Ensure workspaceId is properly set for the VM
        if (event.workspaceId === undefined || event.workspaceId === null) {
            // Set a default workspace ID if not present
            event.workspaceId = 'main'; // Or get from current VM state
        }

        // Map serialized property names back to what the VM expects for move events
        if (event.type === 'move') {
            // Map parent IDs back to expected property names
            if (event.oldParentId !== undefined) {
                event.oldParent = event.oldParentId;
                delete event.oldParentId;
            }
            if (event.newParentId !== undefined) {
                event.newParent = event.newParentId;
                delete event.newParentId;
            }
            // Map input names back to input IDs that the VM expects
            if (event.oldInputName !== undefined) {
                event.oldInput = event.oldInputName;
                delete event.oldInputName;
            }
            if (event.newInputName !== undefined) {
                event.newInput = event.newInputName;
                delete event.newInputName;
            }
        }

        return event;
    }

    /**
     * VM event handlers
     */
    onWorkspaceUpdate() {
        // Don't sync workspace updates at all during normal editing
        // These contain complete XML including block positions and cause fighting
        // between users. Block changes are better handled via PROJECT_CHANGED events.
        return;
    }

    onProjectChanged() {
        // Don't sync project changes automatically - they're too heavy and often just UI navigation
        // Instead, we'll rely on more specific block/workspace events for actual content changes
        return;
    }

    onTargetsUpdate() {
        // Don't sync targets updates automatically - they're often just UI navigation
        // Only sync when there are actual structural changes (sprite creation/deletion)
        return;
    }

    /**
     * Utility methods
     */
    sendProjectSync(conn) {
        if (this.vm) {
            console.log('📤 Sending project sync to new client');
            
            // Mark that we're performing a sync operation
            this.isSyncOperation = true;
            this.lastSyncTime = Date.now();
            
            const projectData = this.vm.toJSON();
            
            // Include detailed metadata about targets for better sync and mapping
            const targetInfo = this.vm.runtime.targets.map(target => ({
                id: target.id,
                name: target.getName(),
                isOriginal: target.isOriginal,
                visible: target.visible,
                x: target.x,
                y: target.y,
                // Add more identifying information
                isStage: target.isStage,
                layerOrder: target.layerOrder || 0,
                // Include some sprite-specific data if available
                direction: target.direction,
                size: target.size,
                currentCostume: target.currentCostume
            }));
            
            const currentEditingTarget = this.vm.editingTarget ? this.vm.editingTarget.id : null;
            
            this.sendMessage('project-sync', { 
                projectData,
                targetInfo,
                currentEditingTarget,
                syncTimestamp: this.lastSyncTime // Include sync timestamp
            }, conn);
            
            console.log('📤 Sent project with', targetInfo.length, 'targets, editing target:', currentEditingTarget);
            console.log('📤 Target details:', targetInfo);
            
            // Clear the sync operation flag after a short delay
            setTimeout(() => {
                this.isSyncOperation = false;
                console.log('🔓 Cleared sync operation flag after sending project');
            }, 500);
        }
    }

    changeUsername(newUsername) {
        this.username = newUsername;
        this.sendMessage('username-change', {
            id: this.peer.id,
            username: newUsername
        });

        if (this.users.has(this.peer.id)) {
            this.users.get(this.peer.id).username = newUsername;
        }
    }

    kickUser(userId) {
        if (this.isHost) {
            this.sendMessage('kick-user', { targetId: userId });

            // Close connection locally
            const conn = this.connections.get(userId);
            if (conn) {
                conn.close();
                this.connections.delete(userId);
            }
        }
    }

    getConnectedUsers() {
        return Array.from(this.users.values());
    }

    isUserHost(userId) {
        const user = this.users.get(userId);
        return user && user.isHost;
    }

    isConnectedToHostPeer() {
        return this.isConnectedToHost;
    }

    disconnect() {
        console.log('🧹 Disconnecting, roomId before clear:', this.roomId);
        
        if (this.peer) {
            this.connections.forEach(conn => conn.close());
            this.peer.destroy();
            this.peer = null;
        }

        // Detach from workspace
        this.detachFromWorkspace();

        // Clear pending events
        this.clearPendingEvents();

        this.connections.clear();
        this.users.clear();
        this.isConnected = false;
        this.isConnectedToHost = false; // Reset host connection flag
        this.isHost = false;
        this.roomId = null;
        this.hostId = null; // Clear host ID
        this.wasKicked = false; // Reset kick flag
        this.currentConnectionFailureHandler = null; // Clear connection failure handler
        this.targetMapping = {}; // Clear target mapping
        this.isSyncOperation = false; // Clear sync operation flag

        this.emit('disconnected');
    }

    /**
     * Event emitter functionality
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Event listener error:', error);
                }
            });
        }
    }

    /**
     * Queue an event that couldn't be applied immediately for later retry
     */
    queuePendingEvent(payload) {
        // Add timestamp to track how long events have been pending
        const eventWithTimestamp = {
            ...payload,
            queuedAt: Date.now()
        };
        
        this.pendingEvents.push(eventWithTimestamp);
        console.log('📝 Queued pending event, total pending:', this.pendingEvents.length);
        
        // Start retry timer if not already running
        this.startRetryTimer();
        
        // Limit queue size to prevent memory leaks
        if (this.pendingEvents.length > 100) {
            console.warn('⚠️ Pending events queue is getting large, removing oldest events');
            this.pendingEvents.splice(0, 10); // Remove oldest 10 events
        }
    }

    /**
     * Start a timer to retry pending events
     */
    startRetryTimer() {
        if (this.retryTimer) {
            return; // Timer already running
        }
        
        this.retryTimer = setTimeout(() => {
            this.retryTimer = null;
            this.processPendingEvents();
            
            // Continue retrying if there are still pending events
            if (this.pendingEvents.length > 0) {
                this.startRetryTimer();
            }
        }, 1000); // Retry every second
    }

    /**
     * Process queued events that couldn't be applied previously
     */
    processPendingEvents() {
        if (this.pendingEvents.length === 0) {
            return;
        }
        
        console.log('🔄 Processing', this.pendingEvents.length, 'pending events');
        
        const currentTime = Date.now();
        const eventsToRetry = [];
        const expiredEvents = [];
        
        // Separate events that should be retried vs. those that have expired
        for (const event of this.pendingEvents) {
            const age = currentTime - event.queuedAt;
            if (age > 30000) { // 30 seconds timeout
                expiredEvents.push(event);
            } else {
                eventsToRetry.push(event);
            }
        }
        
        // Remove expired events
        if (expiredEvents.length > 0) {
            console.warn('⚠️ Removing', expiredEvents.length, 'expired pending events');
        }
        
        // Clear the pending events array
        this.pendingEvents = [];
        
        // Try to apply the non-expired events
        for (const payload of eventsToRetry) {
            try {
                // Remove the queuedAt timestamp before processing
                const cleanPayload = { ...payload };
                delete cleanPayload.queuedAt;
                
                // Try to apply the event again
                this.handleBlockEvent(cleanPayload, null, true); // Pass true to indicate this is a retry
            } catch (error) {
                console.warn('⚠️ Failed to retry pending event:', error);
                // If it fails again, it will be re-queued
            }
        }
    }

    /**
     * Clear all pending events (useful when disconnecting or resetting)
     */
    clearPendingEvents() {
        this.pendingEvents = [];
        if (this.retryTimer) {
            clearTimeout(this.retryTimer);
            this.retryTimer = null;
        }
    }

    /**
     * Debug method to validate and log current target states
     */
    debugTargetStates(context = '') {
        if (!this.vm || !this.vm.runtime) {
            console.log(`🐛 [${context}] No VM or runtime available`);
            return { targets: [], editingTarget: null };
        }

        const targets = this.vm.runtime.targets.map(target => ({
            id: target.id,
            name: target.getName(),
            isOriginal: target.isOriginal,
            visible: target.visible
        }));
        
        const editingTarget = this.vm.editingTarget ? {
            id: this.vm.editingTarget.id,
            name: this.vm.editingTarget.getName()
        } : null;
        
        console.log(`🐛 [${context}] Current targets:`, targets);
        console.log(`🐛 [${context}] Editing target:`, editingTarget);
        
        return { targets, editingTarget };
    }
}

// Export singleton instance
export default {
    getInstance() {
        if (!collaborationServiceInstance) {
            collaborationServiceInstance = new CollaborationService();
        }
        return collaborationServiceInstance;
    }
};
