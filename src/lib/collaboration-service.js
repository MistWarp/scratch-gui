import {
    serializeEvent as serializeEventExternal,
    reconstructEvent as reconstructEventExternal,
    shouldSyncEvent as shouldSyncEventExternal
} from './collaboration/event-serialization.js';
import {
    collaborationBlockListener as collaborationBlockListenerImpl,
    handleBlockEvent as handleBlockEventImpl
} from './collaboration/block-events.js';
import {
    attachToWorkspace as attachToWorkspaceExternal,
    detachFromWorkspace as detachFromWorkspaceExternal,
    attemptWorkspaceAttachment as attemptWorkspaceAttachmentExternal
} from './collaboration/ui-manager.js';
import {
    sendMessage as sendMessageExternal,
    handleConnection as handleConnectionExternal,
    handleMessage as handleMessageExternal
} from './collaboration/connection-manager.js';
import {
    wrapVMAssetMethods as wrapVMAssetMethodsExternal,
    handleAssetEvent as handleAssetEventExternal
} from './collaboration/asset-events.js';
import {
    sendProjectSync as sendProjectSyncExternal,
    handleProjectSyncStart as handleProjectSyncStartExternal,
    handleProjectSyncChunk as handleProjectSyncChunkExternal,
    debugTargetStates as debugTargetStatesExternal
} from './collaboration/sync-manager.js';
import {
    getTargetIdForMessage,
    getLocalTargetId as _getLocalTargetId
} from './collaboration/target-id-utils.js';
import {
    connectToRoom as connectToRoomExternal,
    setupHost as setupHostExternal,
    connectToHost as connectToHostExternal,
    approveJoinRequest as approveJoinRequestExternal,
    denyJoinRequest as denyJoinRequestExternal,
    cancelJoinRequest as cancelJoinRequestExternal,
    handleJoinRequest as handleJoinRequestExternal,
    handleJoinApproved as handleJoinApprovedExternal,
    handleJoinDenied as handleJoinDeniedExternal,
    handleJoinCancelled as handleJoinCancelledExternal,
    handleRoomPrivacy as handleRoomPrivacyExternal,
    getPendingJoinRequests as getPendingJoinRequestsExternal,
    getRoomPrivacy as getRoomPrivacyExternal,
    changeRoomPrivacy as changeRoomPrivacyExternal,
    handleUserJoin as handleUserJoinExternal
} from './collaboration/room-manager.js';
import {
    setupCursorLayer as setupCursorLayerExternal,
    destroyCursorLayer as destroyCursorLayerExternal,
    bindCursorEvents as bindCursorEventsExternal,
    unbindCursorEvents as unbindCursorEventsExternal,
    handleCursorMove as handleCursorMoveExternal,
    handleCursorLeave as handleCursorLeaveExternal,
    updateAllRemoteCursorPositions as updateAllRemoteCursorPositionsExternal,
    bindViewportSyncListeners as bindViewportSyncListenersExternal,
    unbindViewportSyncListeners as unbindViewportSyncListenersExternal
} from './collaboration/cursor-sync.js';
/**
 * Live Collaboration Service for Scratch projects using Peer projects using PeerJS
 * Manages real-time collaboration features including room management, user tracking, and block synchronization
 */

// Singleton instance
let collaborationServiceInstance = null;

class CollaborationService {
    constructor () {
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
        this.roomPrivacy = 'public'; // Room privacy setting: 'public' or 'private'
        this.pendingJoinRequests = new Map(); // Map of pending join requests (peer ID -> user info)
        this.isDisconnecting = false; // Flag to prevent multiple disconnect calls
        this.connectionTimeout = null; // Store connection timeout reference
        this.seenEventIds = new Set();
        this.remoteCursors = new Map();
        this.cursorLayer = null;
        this.remoteCursorPositions = new Map();
        this._lastCursorOverlay = null;
        this.isLoadingProject = false; // Flag to track if a project is being loaded (including UI init)

        // Sync sequence tracking to prevent loops
        this._currentSyncSequence = 0; // Incremented by host on each sync send
        this._lastReceivedSyncSequence = -1; // Track last sync we completed as client
        this._activeSyncDirection = null; // 'sending' (host) or 'receiving' (client) or null

        // Configure PeerJS with public servers
        this.peerConfig = {
            host: '0.peerjs.com',
            port: 443,
            path: '/',
            secure: true,
            config: {
                iceServers: [
                    {urls: 'stun:vpn.mikedev101.cc:5349'},
                    {urls: 'turn:vpn.mikedev101.cc:5349', username: 'free', credential: 'free'},
                    {urls: 'stun:stun.l.google.com:19302'},
                    {urls: 'stun:freeturn.net:3478'},
                    {urls: 'stun:freeturn.net:5349'},
                    {urls: 'turn:freeturn.net:3478', username: 'free', credential: 'free'},
                    {urls: 'turns:freeturn.net:5349', username: 'free', credential: 'free'}
                ],
                iceCandidatePoolSize: 10,
                iceTransportPolicy: 'all'
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
            'project-sync-start': this.handleProjectSyncStart.bind(this),
            'project-sync-chunk': this.handleProjectSyncChunk.bind(this),
            'targets-update': this.handleTargetsUpdate.bind(this),
            'block-event': (payload, conn) => handleBlockEventImpl(this, payload, conn),
            'asset-event': this.handleAssetEvent.bind(this),
            'cursor-move': this.handleCursorMove.bind(this),
            'cursor-leave': this.handleCursorLeave.bind(this),
            'join-request': this.handleJoinRequest.bind(this),
            'join-approved': this.handleJoinApproved.bind(this),
            'join-denied': this.handleJoinDenied.bind(this),
            'join-cancelled': this.handleJoinCancelled.bind(this),
            'room-privacy': this.handleRoomPrivacy.bind(this),
            'target-switch': this.handleTargetSwitch.bind(this),
            'target-created': this.handleTargetCreated.bind(this),
            'target-deleted': this.handleTargetDeleted.bind(this)
        };
    }

    /**
     * Request a full project sync from the host (client only).
     * This is throttled and guarded to prevent host/client ping-pong loops.
     * @param {string} [reason] Optional reason (helps debugging)
     */
    requestProjectSync (reason = 'unspecified') {
        if (!this.isConnected || this.isHost) return;
        if (!this.hostId) {
            console.warn('[COLLABORATION] requestProjectSync: no hostId yet, skipping');
            return;
        }

        // Don't request sync while we're already in a sync operation
        if (this._activeSyncDirection !== null) {
            console.log('[COLLABORATION] requestProjectSync: sync already active', {
                reason,
                direction: this._activeSyncDirection
            });
            return;
        }

        console.log('[COLLABORATION] 📣 Requesting project sync from host', {
            reason,
            hostId: this.hostId,
            lastSequence: this._lastReceivedSyncSequence
        });

        this.sendMessage('sync-request', {
            reason,
            lastKnownSequence: this._lastReceivedSyncSequence
        }, this.hostId);
    }

    /**
     * Initialize the collaboration service with a VM instance
     * @param {VirtualMachine} vm - The Scratch VM instance
     */
    init (vm) {
        this.vm = vm;

        // Create a custom block listener that filters for collaboration-relevant events
        this.collaborationBlockListener = this.collaborationBlockListener.bind(this);
        
        // Debug: Log flag states periodically
        this._debugFlagInterval = setInterval(() => {
            if (this.isConnected) {
                const timeSinceSync = this.lastSyncTime ? Date.now() - this.lastSyncTime : -1;
                console.log('[🔍 FLAG STATE]', {
                    isConnected: this.isConnected,
                    isHost: this.isHost,
                    isSyncOperation: this.isSyncOperation,
                    isApplyingRemoteChange: this.isApplyingRemoteChange,
                    isLoadingProject: this.isLoadingProject,
                    timeSinceLastSync: timeSinceSync,
                    cooldownActive: timeSinceSync >= 0 && timeSinceSync < 3000,
                    connectionCount: this.connections.size,
                    seenEventIds: this.seenEventIds.size,
                    pendingEvents: this.pendingEvents.length
                });
            }
        }, 5000); // Log every 5 seconds

        // Listen for VM events to sync changes
        if (this.vm) {
            this.vm.on('workspaceUpdate', this.onWorkspaceUpdate.bind(this));
            this.vm.on('PROJECT_CHANGED', this.onProjectChanged.bind(this));
            this.vm.runtime.on('TARGETS_UPDATE', this.onTargetsUpdate.bind(this));
            
            const service = this;
            
            // NOTE: Target switching is disabled to allow independent editing
            // Users can work on different sprites simultaneously
            // this.onEditingTargetChange = this.onEditingTargetChange.bind(this);
            
            // // Wrap setEditingTarget to detect target switches
            // const originalSetEditingTarget = this.vm.setEditingTarget.bind(this.vm);
            // this.vm.setEditingTarget = function (targetId) {
            //     const previousTarget = service.vm.editingTarget ? service.vm.editingTarget.id : null;
            //     originalSetEditingTarget(targetId);
            //     if (service.isConnected && !service.isApplyingRemoteChange && previousTarget !== targetId) {
            //         service.onEditingTargetChange(targetId);
            //     }
            // };
            
            // Wrap addSprite to detect sprite creation
            const originalAddSprite = this.vm.addSprite.bind(this.vm);
            this.vm.addSprite = function (spriteJson) {
                return originalAddSprite(spriteJson).then(() => {
                    if (service.isConnected && !service.isApplyingRemoteChange &&
                        !service.isSyncOperation && !service.isLoadingProject) {
                        service.onTargetCreated();
                    }
                });
            };
            
            // Wrap duplicateSprite to detect sprite duplication
            const originalDuplicateSprite = this.vm.duplicateSprite.bind(this.vm);
            this.vm.duplicateSprite = function (targetId) {
                return originalDuplicateSprite(targetId).then(() => {
                    if (service.isConnected && !service.isApplyingRemoteChange &&
                        !service.isSyncOperation && !service.isLoadingProject) {
                        service.onTargetCreated();
                    }
                });
            };
            
            // Wrap deleteSprite to detect sprite deletion
            const originalDeleteSprite = this.vm.deleteSprite.bind(this.vm);
            this.vm.deleteSprite = function (targetId) {
                const result = originalDeleteSprite(targetId);
                if (service.isConnected && !service.isApplyingRemoteChange &&
                    !service.isSyncOperation && !service.isLoadingProject) {
                    service.onTargetDeleted(targetId);
                }
                return result;
            };
            
            this.wrapVMAssetMethods();
            this.wrapVMLoadProject();
        }
    }

    /**
     * Wrap vm.loadProject to detect project loads and handle collaboration behavior
     */
    wrapVMLoadProject () {
        if (!this.vm || !this.vm.loadProject) return;
        
        const originalLoadProject = this.vm.loadProject.bind(this.vm);
        const service = this;
        
        this.vm.loadProject = function (input) {
            // Check if this is a collaboration-related load (from sync)
            const isSyncLoad = service.isSyncOperation || service.isApplyingRemoteChange;
            
            // Check if we're in the process of connecting (to avoid disconnecting during initial join)
            const isConnecting = service.isConnectedToHost && !service.lastSyncTime;
            
            // Loop detection: If we're loading projects too frequently, something is wrong
            const now = Date.now();
            const timeSinceLastLoad = now - service.lastLoadTime;
            if (!isSyncLoad && service.lastLoadTime > 0 && timeSinceLastLoad < 1000) {
                service.loadCount++;
                if (service.loadCount > 3) {
                    console.error(
                        '[🔄 VM LoadProject Wrapper] ⚠️ LOOP DETECTED: Project loaded',
                        service.loadCount, 'times in rapid succession!'
                    );
                    console.error('[🔄 VM LoadProject Wrapper] Aborting to prevent infinite loop. Flags:', {
                        isLoadingProject: service.isLoadingProject,
                        isSyncOperation: service.isSyncOperation,
                        isConnected: service.isConnected,
                        isHost: service.isHost,
                        scheduledSyncTimeout: !!service.scheduledSyncTimeout
                    });
                    // Force clear all flags to break the loop
                    service.isLoadingProject = false;
                    service.isSyncOperation = false;
                    if (service.scheduledSyncTimeout) {
                        clearTimeout(service.scheduledSyncTimeout);
                        service.scheduledSyncTimeout = null;
                    }
                    // Still allow this load, but prevent future rapid loads
                    service.loadCount = 0;
                    service.lastLoadTime = now + 5000; // Prevent loads for next 5 seconds
                }
            } else {
                service.loadCount = 0;
            }
            service.lastLoadTime = now;
            
            console.log('┌──────────────────────────────────────────────────────────┐');
            console.log('│ 🔄 VM LOADPROJECT CALLED                                 │');
            console.log('└──────────────────────────────────────────────────────────┘');
            console.log('[🔄 VM LoadProject Wrapper] Project load starting', {
                isSyncLoad: isSyncLoad,
                isConnecting: isConnecting,
                isHost: service.isHost,
                isConnected: service.isConnected,
                timeSinceLastLoad: timeSinceLastLoad,
                loadCount: service.loadCount,
                flags: {
                    isSyncOperation: service.isSyncOperation,
                    isApplyingRemoteChange: service.isApplyingRemoteChange,
                    isLoadingProject: service.isLoadingProject
                }
            });
            
            // Always log stack trace to see where the load is being called from
            console.trace('[🔄 VM LoadProject Wrapper] Stack trace for load:');
            
            // Set flag to suppress event broadcasting during project load
            // This includes the entire loading and UI initialization period
            if (!isSyncLoad && service.isConnected) {
                service.isLoadingProject = true;
                console.log('[🔄 VM LoadProject Wrapper] Set isLoadingProject = true (non-sync load)');
            }
            
            return originalLoadProject(input).then(() => {
                console.log('┌──────────────────────────────────────────────────────────┐');
                console.log('│ ✅ VM LOADPROJECT COMPLETED                              │');
                console.log('└──────────────────────────────────────────────────────────┘');
                console.log('[🔄 VM LoadProject Wrapper] Project loaded successfully', {
                    isSyncLoad,
                    isHost: service.isHost,
                    connectionsCount: service.connections.size,
                    flags: {
                        isSyncOperation: service.isSyncOperation,
                        isApplyingRemoteChange: service.isApplyingRemoteChange,
                        isLoadingProject: service.isLoadingProject
                    }
                });
                
                // If host loaded a project (not from sync), sync it to all clients
                // Wait until after UI initialization completes before sending sync
                if (service.isHost && service.isConnected && !isSyncLoad) {
                    // Cancel any previously scheduled sync to prevent duplicates
                    if (service.scheduledSyncTimeout) {
                        console.log('[🔄 VM LoadProject Wrapper] Canceling previous scheduled sync');
                        clearTimeout(service.scheduledSyncTimeout);
                        service.scheduledSyncTimeout = null;
                    }
                    
                    // Only schedule sync if there are actually connections to sync to
                    if (service.connections.size > 0) {
                        console.log(
                            '[🔄 VM LoadProject Wrapper] 📅 Host loaded project, scheduling sync to clients in 3500ms'
                        );
                        service.scheduledSyncTimeout = setTimeout(() => {
                            // Double-check we're not already syncing before sending
                            if (service.isSyncOperation) {
                                console.warn('[🔄 VM LoadProject Wrapper] ⚠️ Already syncing, skipping scheduled sync');
                                service.scheduledSyncTimeout = null;
                                return;
                            }
                            // Also check if we already sent a sync very recently (within last 2 seconds)
                            const timeSinceLastSync = Date.now() - service.lastSyncTime;
                            if (service.lastSyncTime > 0 && timeSinceLastSync < 2000) {
                                console.warn(
                                    `[🔄 VM LoadProject Wrapper] ⚠️ Sync sent ${timeSinceLastSync}ms ago, duplicate`
                                );
                                service.scheduledSyncTimeout = null;
                                return;
                            }
                            console.log(
                                '[🔄 VM LoadProject Wrapper] ⏰ Scheduled sync timer fired, sending sync to clients'
                            );
                            service.scheduledSyncTimeout = null; // Clear the timeout reference
                            service.sendProjectSync(null); // Send to all connections
                        }, 3500); // Send sync after UI initialization completes
                    } else {
                        // No connections, just clear the loading flag
                        console.log(
                            '[🔄 VM LoadProject Wrapper] No clients connected, clearing isLoadingProject immediately'
                        );
                        setTimeout(() => {
                            service.isLoadingProject = false;
                            console.log(
                                '[🔄 VM LoadProject Wrapper] ✅ Cleared isLoadingProject flag (host with no connections)'
                            );
                        }, 3000);
                    }
                } else if (!isSyncLoad && service.isConnected) {
                    // For clients or other non-sync loads, clear the flag after UI initialization
                    setTimeout(() => {
                        service.isLoadingProject = false;
                        console.log('[🔄 VM LoadProject Wrapper] ✅ Cleared isLoadingProject flag (non-host)');
                    }, 3000);
                }
                
                // If client loaded a project (not from sync), disconnect them
                // BUT don't disconnect if we're still in the initial connection process
                if (!service.isHost && service.isConnected && !isSyncLoad && !isConnecting) {
                    console.log('[🔄 VM LoadProject Wrapper] Client loaded project, disconnecting from collaboration');
                    service.disconnect();
                }
                
                return Promise.resolve();
            });
        };
    }

    /**
     * Attach the collaboration block listener to a Blockly workspace
     * This should be called when the blocks component mounts or when collaboration starts
     * @param {Blockly.WorkspaceSvg} workspace - The Blockly workspace instance
     * @return {boolean} - True if attachment was successful, false otherwise
     */
    attachToWorkspace (workspace) {
        return attachToWorkspaceExternal(this, workspace);
    }

    /**
     * Detach the collaboration block listener from a Blockly workspace
     * This should be called when the blocks component unmounts or when collaboration ends
     * @return {boolean} - True if detachment was successful, false otherwise
     */
    detachFromWorkspace () {
        return detachFromWorkspaceExternal(this);
    }

    /**
     * Custom block listener that filters for collaboration-relevant events only
     * This runs alongside the VM's main blockListener but only syncs meaningful code changes
     * @param {Blockly.Events.Abstract} event - The Blockly event object
     * @return {boolean} - True if the event was handled, false otherwise
     */
    collaborationBlockListener (event) {
        return collaborationBlockListenerImpl(this, event);
    }

    /**
     * Determine if a Blockly event should be synced to other collaborators
     * Only sync events that represent actual code changes, not UI navigation
     * @param {Blockly.Events.Abstract} event - The Blockly event object
     * @return {boolean} - True if the event should be synced, false otherwise
     */
    shouldSyncEvent (event) {
        return shouldSyncEventExternal(this, event);
    }

    wrapVMAssetMethods () {
        return wrapVMAssetMethodsExternal(this);
    }

    handleAssetEvent (payload, conn) {
        return handleAssetEventExternal(this, payload, conn);
    }

    /**
     * Serialize a Blockly event for transmission to other collaborators
     * Remove unnecessary data and ensure it's JSON-serializable
     * @param {Blockly.Events.Abstract} event - The Blockly event object
     * @return {object} - The serialized event object
     */
    serializeEvent (event) {
        return serializeEventExternal(this, event);
    }

    /**
     * Generate a unique peer ID for a room to prevent collisions
     * @param {string} roomId - The collaboration room ID
     * @param {boolean} isHost - Whether this peer is the host
     * @return {string} - The generated unique peer ID
     */
    generatePeerId (roomId, isHost = false) {
        if (!roomId) {
            throw new Error('roomId is required for generatePeerId');
        }

        const sanitizedRoomId = roomId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

        if (isHost) {
            // Host ID is predictable based on room name
            return `mistwarp-collab-${sanitizedRoomId}-host`;
        }
        // User IDs include timestamp and random string to prevent collisions
        const timestamp = Date.now();
        const randomString = Math.random().toString(36)
            .substring(2, 11);
        return `mistwarp-collab-${sanitizedRoomId}-user-${timestamp}-${randomString}`;
        
    }

    /**
     * Create or join a collaboration room
     * @param {string} roomId - The collaboration room ID
     * @param {string} username - The user's display name
     * @param {boolean} isHost - Whether this peer is the host
     * @param {string} privacy - Room privacy setting ('public' or 'private')
     * @return {Promise<void>} - A promise that resolves when the room is connected
     */
    connectToRoom (roomId, username, isHost = false, privacy = 'public') {
        return connectToRoomExternal(this, roomId, username, isHost, privacy);
    }

    /**
     * Setup host functionality
     */
    setupHost () {
        setupHostExternal(this);
    }

    /**
     * Helper method to attempt workspace attachment with multiple strategies
     * @param {string} context - Contextual information for logging/debugging
     */
    attemptWorkspaceAttachment (context) {
        attemptWorkspaceAttachmentExternal(this, context);
    }

    /**
     * Connect to the host of the room
     */
    connectToHost () {
        connectToHostExternal(this);
    }

    /**
     * Setup connection event handlers
     * @param {Peer.DataConnection} conn - The connection object
     */
    handleConnection (conn) {
        handleConnectionExternal(this, conn);
    }

    /**
     * Handle incoming messages
     * @param {object} data - The message payload
     * @param {Peer.DataConnection} conn - The connection object
     */
    handleMessage (data, conn) {
        handleMessageExternal(this, data, conn);
    }

    /**
     * Send a message to all connected peers or specific connection
     * @param {string} type - The message type
     * @param {object} payload - The message payload
     * @param {Peer.DataConnection} targetConn - The connection object
     */
    sendMessage (type, payload, targetConn = null) {
        sendMessageExternal(this, type, payload, targetConn);
    }

    /**
     * Message handlers
     * @param {object} payload - The message payload
     * @param {Peer.DataConnection} conn - The connection object
     */
    handleUserJoin (payload, conn) {
        handleUserJoinExternal(this, payload, conn);
    }

    handleUserLeave (payload) {
        this.users.delete(payload.id);
        this.emit('user-left', payload);
    }

    handleUsersList (payload) {
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
        this.emit('users-updated', {users: Array.from(this.users.values())});
    }

    handleUsernameChange (payload) {
        if (this.users.has(payload.id)) {
            this.users.get(payload.id).username = payload.username;
            this.emit('username-changed', payload);
        }
    }

    handleKickUser (payload) {
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

    handleSyncRequest (payload, conn) {
        if (!this.isHost) return;
        const now = Date.now();
        const since = now - this._lastHostSyncRequestHandledAt;
        if (this._lastHostSyncRequestHandledAt > 0 && since < this._hostSyncRequestCooldownMs) {
            console.warn('[COLLABORATION] Host ignoring sync-request burst', {
                since,
                payload
            });
            return;
        }
        this._lastHostSyncRequestHandledAt = now;

        console.log('[COLLABORATION] Host received sync-request, sending project sync', {
            from: conn ? conn.peer : payload.sender,
            requestId: payload && payload.requestId,
            reason: payload && payload.reason
        });

        this.sendProjectSync(conn ? conn : payload.sender);
    }

    handleProjectSyncStart (payload, conn) {
        // If we requested a sync, consider it fulfilled once the host begins sending.
        // This helps prevent repeat client->host sync-request loops.
        if (!this.isHost) {
            this._projectSyncRequestInFlight = false;
        }
        return handleProjectSyncStartExternal(this, payload, conn);
    }

    handleProjectSyncChunk (payload, conn) {
        return handleProjectSyncChunkExternal(this, payload, conn);
    }

    handleTargetsUpdate (payload, conn) {
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
            this.connections.forEach(connection => {
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

    handleBlockEvent (payload, conn, isRetry = false) {
        return handleBlockEventImpl(this, payload, conn, isRetry);
    }

    setupCursorLayer () {
        return setupCursorLayerExternal(this);
    }

    destroyCursorLayer () {
        return destroyCursorLayerExternal(this);
    }

    bindCursorEvents () {
        return bindCursorEventsExternal(this);
    }

    unbindCursorEvents () {
        return unbindCursorEventsExternal(this);
    }

    handleCursorMove (payload, conn) {
        return handleCursorMoveExternal(this, payload, conn);
    }

    handleCursorLeave (payload, conn) {
        return handleCursorLeaveExternal(this, payload, conn);
    }

    updateAllRemoteCursorPositions () {
        return updateAllRemoteCursorPositionsExternal(this);
    }

    bindViewportSyncListeners () {
        return bindViewportSyncListenersExternal(this);
    }

    unbindViewportSyncListeners () {
        return unbindViewportSyncListenersExternal(this);
    }

    /**
     * Reconstruct a Blockly event from serialized data for the VM
     * @param {object} serializedEvent - The serialized event object
     * @return {Blockly.Events.Abstract} - The reconstructed event object
     */
    reconstructEvent (serializedEvent) {
        return reconstructEventExternal(this, serializedEvent);
    }

    /**
     * VM event handlers
     */
    onWorkspaceUpdate () {
        return;
    }

    onProjectChanged () {
        return;
    }

    onTargetsUpdate () {
        return;
    }

    /**
     * Utility methods
     * @param {Peer.DataConnection} conn - The connection object
     * @return {Promise<void>} - A promise that resolves when the project sync is complete
     */
    sendProjectSync (conn) {
        return sendProjectSyncExternal(this, conn);
    }

    changeUsername (newUsername) {
        console.log(`[COLLABORATION] Changing username from "${this.username}" to "${newUsername}"`);
        this.username = newUsername;
        this.sendMessage('username-change', {
            id: this.peer.id,
            username: newUsername
        });

        if (this.users.has(this.peer.id)) {
            this.users.get(this.peer.id).username = newUsername;
        }

        console.log(`[COLLABORATION] Username change broadcasted to all clients`);
    }

    kickUser (userId) {
        if (this.isHost) {
            this.sendMessage('kick-user', {targetId: userId});

            // Close connection locally
            const conn = this.connections.get(userId);
            if (conn) {
                if (conn.close) conn.close();
                this.connections.delete(userId);
            }
        }
    }

    getConnectedUsers () {
        return Array.from(this.users.values());
    }

    isUserHost (userId) {
        const user = this.users.get(userId);
        return user && user.isHost;
    }

    isConnectedToHostPeer () {
        return this.isConnectedToHost;
    }

    disconnect () {
        console.log('🧹 Disconnecting, roomId before clear:', this.roomId);

        // Prevent multiple disconnect calls
        if (this.isDisconnecting) {
            console.log('🔄 Already disconnecting, skipping');
            return;
        }

        if (!this.peer && !this.isConnected && !this.isConnectedToHost) {
            console.log('🔄 Already disconnected, skipping');
            return;
        }

        // Mark as disconnecting to prevent duplicate calls
        this.isDisconnecting = true;

        // Clear any pending timeouts
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }
        
        if (this.scheduledSyncTimeout) {
            clearTimeout(this.scheduledSyncTimeout);
            this.scheduledSyncTimeout = null;
        }

        if (this.peer) {
            try {
                // Clear pending events and debug interval before closing connections
                this.clearPendingEvents();

                if (this._debugFlagInterval) {
                    clearInterval(this._debugFlagInterval);
                    this._debugFlagInterval = null;
                }

                // Close all active connections
                this.connections.forEach(conn => {
                    try {
                        if (conn) {
                            if (conn.close) conn.close();
                        }
                    } catch (e) {
                        console.warn('Error closing connection:', e);
                    }
                });

                // Destroy the peer if possible
                if (this.peer && !this.peer.destroyed && this.peer.destroy) {
                    this.peer.destroy();
                }
            } catch (e) {
                console.warn('Error destroying peer:', e);
            }
            this.peer = null;
        }

        // Detach from workspace
        this.detachFromWorkspace();

        // Clear pending events
        this.clearPendingEvents();

        this.connections.clear();
        this.users.clear();
        this.pendingJoinRequests.clear(); // Clear pending join requests
        this.isConnected = false;
        this.isConnectedToHost = false; // Reset host connection flag
        this.isHost = false;
        this.roomId = null;
        this.roomPrivacy = 'public'; // Reset room privacy
        this.hostId = null; // Clear host ID
        this.wasKicked = false; // Reset kick flag
        this.currentConnectionFailureHandler = null; // Clear connection failure handler
        this.targetMapping = {}; // Clear target mapping
        this.isSyncOperation = false; // Clear sync operation flag
        this.isLoadingProject = false; // Clear loading flag
        this.seenEventIds.clear();
        this.destroyCursorLayer();

        // Reset disconnecting flag after cleanup
        this.isDisconnecting = false;

        this.emit('disconnected');
    }

    /**
     * Event emitter functionality
     * @param {string} event - The event name
     * @param {function} callback - The callback function to register
     */
    on (event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off (event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit (event, data) {
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
     * @param {object} payload - The event payload
     */
    queuePendingEvent (payload) {
        // Add timestamp to track how long events have been pending
        const eventWithTimestamp = {
            ...payload,
            queuedAt: Date.now()
        };

        this.pendingEvents.push(eventWithTimestamp);

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
    startRetryTimer () {
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
    processPendingEvents () {
        if (this.pendingEvents.length === 0) {
            return;
        }

        console.log('🔄 Processing', this.pendingEvents.length, 'pending events');

        const currentTime = Date.now();
        const eventsToRetry = [];
        const expiredEvents = [];
        const preSyncEvents = [];

        // Separate events that should be retried vs. those that have expired or are from before sync
        for (const event of this.pendingEvents) {
            const age = currentTime - event.queuedAt;
            
            // Filter out events queued before the last sync
            if (event.queuedAt < this.lastSyncTime) {
                preSyncEvents.push(event);
            } else if (age > 30000) { // 30 seconds timeout
                expiredEvents.push(event);
            } else {
                eventsToRetry.push(event);
            }
        }

        // Remove pre-sync events
        if (preSyncEvents.length > 0) {
            console.warn('⚠️ Removing', preSyncEvents.length, 'events queued before last sync');
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
                const cleanPayload = {...payload};
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
    clearPendingEvents () {
        this.pendingEvents = [];
        if (this.retryTimer) {
            clearTimeout(this.retryTimer);
            this.retryTimer = null;
        }
    }

    /**
     * Debug method to validate and log current target states
     * @param {string} context - The context to log the target states for
     * @return {object} - An object containing target information
     */
    debugTargetStates (context = '') {
        return debugTargetStatesExternal(this, context);
    }

    /**
     * Handle join request from a potential collaborator
     * @param {object} data - The join request payload
     * @param {Peer.DataConnection} connection - The connection object
     * @return {void}
     */
    handleJoinRequest (data, connection) {
        return handleJoinRequestExternal(this, data, connection);
    }

    /**
     * Handle join approval response
     * @param {object} data - The join approval payload
     * @param {Peer.DataConnection} connection - The connection object
     * @return {void}
     */
    handleJoinApproved (data, connection) {
        return handleJoinApprovedExternal(this, data, connection);
    }

    /**
     * Handle join denial response
     * @param {object} data - The join denial payload
     * @param {Peer.DataConnection} connection - The connection object
     * @return {void}
     */
    handleJoinDenied (data, connection) {
        return handleJoinDeniedExternal(this, data, connection);
    }

    /**
     * Handle room privacy information
     * @param {object} data - The room privacy payload
     * @param {Peer.DataConnection} connection - The connection object
     * @return {void}
     */
    handleRoomPrivacy (data, connection) {
        return handleRoomPrivacyExternal(this, data, connection);
    }

    /**
     * Handle editing target change from host
     * NOTE: Disabled to allow independent editing - users can work on different sprites
     */
    handleTargetSwitch () {
        // Disabled: Each user can edit different targets independently
        // if (this.isHost || !this.vm) return;
        //
        // const targetId = getLocalTargetId(this, data.targetId);
        // if (targetId && this.vm.runtime.getTargetById(targetId)) {
        //     this.isApplyingRemoteChange = true;
        //     this.vm.setEditingTarget(targetId);
        //     setTimeout(() => {
        //         this.isApplyingRemoteChange = false;
        //     }, 100);
        // }
    }

    /**
     * Handle target created event from host
     */
    handleTargetCreated () {
        if (this.isHost || !this.vm) return;
        
        // Request a full project sync to get the new target
        console.log('[COLLABORATION] New target created by host, requesting sync');
        this.requestProjectSync('host-target-created');
    }

    /**
     * Handle target deleted event from host
     */
    handleTargetDeleted () {
        if (this.isHost || !this.vm) return;
        
        // Request a full project sync to handle the deletion
        console.log('[COLLABORATION] Target deleted by host, requesting sync');
        this.requestProjectSync('host-target-deleted');
    }

    /**
     * Called when the editing target changes (local change)
     */
    onEditingTargetChange () {
    }

    /**
     * Called when a target is created (local change)
     */
    onTargetCreated () {
        if (!this.isConnected || this.isApplyingRemoteChange ||
            this.isSyncOperation || this.isLoadingProject) return;
        
        console.log('[COLLABORATION] Local target created, syncing to peers');
        this.sendMessage('target-created', {
            timestamp: Date.now()
        });
        
        // Send full project sync to ensure clients get the new target
        if (this.isHost) {
            setTimeout(() => {
                this.sendProjectSync(null);
            }, 500);
        }
    }

    /**
     * Called when a target is deleted (local change)
     * @param {string} targetId - The deleted target ID
     */
    onTargetDeleted (targetId) {
        if (!this.isConnected || this.isApplyingRemoteChange ||
            this.isSyncOperation || this.isLoadingProject) return;
        
        console.log('[COLLABORATION] Local target deleted, syncing to peers');
        const targetIdToSend = getTargetIdForMessage(this, targetId);
        this.sendMessage('target-deleted', {
            targetId: targetIdToSend,
            timestamp: Date.now()
        });
        
        // Send full project sync to ensure clients remove the target
        if (this.isHost) {
            setTimeout(() => {
                this.sendProjectSync(null);
            }, 500);
        }
    }

    /**
     * Approve a join request (host only)
     * @param {string} requesterId - The ID of the user who requested to join
     * @param {string} requesterUsername - The username of the user who requested to join
     * @return {Promise<void>} - A promise that resolves when the join request is approved
     */
    approveJoinRequest (requesterId, requesterUsername) {
        return approveJoinRequestExternal(this, requesterId, requesterUsername);
    }

    /**
     * Deny a join request (host only)
     * @param {string} requesterId - The ID of the user who requested to join
     * @param {string} reason - The reason for the join request being denied
     * @return {Promise<void>} - A promise that resolves when the join request is denied
     */
    denyJoinRequest (requesterId, reason = 'Host denied your request') {
        return denyJoinRequestExternal(this, requesterId, reason);
    }

    /**
     * Cancel a pending join request (for clients waiting for approval)
     * @return {Promise<void>} - A promise that resolves when the join request is cancelled
     */
    cancelJoinRequest () {
        return cancelJoinRequestExternal(this);
    }

    /**
     * Handle join cancellation from a client
     * @param {object} data - The join cancellation payload
     * @param {Peer.DataConnection} connection - The connection object
     * @return {void}
     */
    handleJoinCancelled (data, connection) {
        return handleJoinCancelledExternal(this, data, connection);
    }

    /**
     * Get pending join requests (host only)
     * @return {object[]} - An array of pending join requests
     */
    getPendingJoinRequests () {
        return getPendingJoinRequestsExternal(this);
    }

    /**
     * Get current room privacy setting
     * @return {string} - The current room privacy setting
     */
    getRoomPrivacy () {
        return getRoomPrivacyExternal(this);
    }

    /**
     * Change room privacy setting (host only)
     * @param {string} newPrivacy - The new room privacy setting
     * @return {Promise<void>} - A promise that resolves when the room privacy is changed
     */
    changeRoomPrivacy (newPrivacy) {
        return changeRoomPrivacyExternal(this, newPrivacy);
    }
}

// Export singleton instance
const CollaborationServiceExport = {
    getInstance () {
        if (!collaborationServiceInstance) {
            collaborationServiceInstance = new CollaborationService();
        }
        return collaborationServiceInstance;
    }
};

// Make it available globally for easier access from components
if (typeof window !== 'undefined') {
    window.CollaborationService = CollaborationServiceExport;
}

export default CollaborationServiceExport;
