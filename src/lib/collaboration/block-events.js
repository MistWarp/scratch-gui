import {serializeEvent, reconstructEvent, shouldSyncEvent} from './event-serialization.js';

/**
 * Listen for block events and send them to connected peers
 * @param {CollaborationService} service - The collaboration service instance
 * @param {object} event - The Blockly event
*/
const collaborationBlockListener = (service, event) => {
    if (!service.isConnected || service.isApplyingRemoteChange) {
        return;
    }
    // Skip events that originated from remote sync to prevent loops
    if (service.isSyncOperation || event._syncOriginated) return;
    
    // Skip events during project loading (including UI initialization)
    // This prevents flooding clients with initialization events
    if (service.isLoadingProject) {
        return;
    }
    
    // Use shouldSyncEvent as the primary filter for code-affecting events
    if (!shouldSyncEvent(service, event)) {
        return;
    }
    const eventOrigin = service.peer && service.peer.id ? service.peer.id : 'local';
    const eid = `${eventOrigin}-${Date.now()}-${Math.random().toString(36)
        .slice(2, 8)}`;
    const serializedEvent = serializeEvent(service, event);
    
    // Get the target NAME to send (stable across clients)
    const localTarget = service.vm && service.vm.editingTarget ? service.vm.editingTarget : null;
    const targetName = localTarget ? localTarget.getName() : null;

    // Track event origin for loop prevention
    service.sendMessage('block-event', {
        event: serializedEvent,
        targetName: targetName, // Replace targetId with targetName
        eventId: eid,
        eventOrigin: eventOrigin,
        timestamp: Date.now()
    });
};

/**
 * Handle block events received from a peer
 * @param {CollaborationService} service - The collaboration service instance
 * @param {object} payload - The block event payload
 * @param {Peer.DataConnection} conn - The connection object
 * @param {boolean} isRetry - Whether this is a retry
 */
const handleBlockEvent = (service, payload, conn, isRetry = false) => {
    // Loop prevention: Check if we've already seen this event
    if (payload.eventId && service.seenEventIds.has(payload.eventId)) return;
    console.log(service, payload, conn);
    const eventOrigin = payload.eventOrigin || payload.sender;
    if (eventOrigin === service.peer.id) return;
    if (payload.sender === service.peer.id) return;
    if (service.vm && payload.event) {
        service.isApplyingRemoteChange = true;
        try {
            const reconstructedEvent = reconstructEvent(service, payload.event);
            if (reconstructedEvent === null) {
                if (isRetry) return;
                service.queuePendingEvent(payload);
                return;
            }
            // Mark event as originating from remote sync to prevent re-syncing
            reconstructedEvent._syncOriginated = true;
            // Store event origin for tracking
            reconstructedEvent._eventOrigin = eventOrigin;
            if (!service.vm || !service.vm.blockListener) {
                return;
            }
            if (reconstructedEvent.type === 'create' && !service.vm.runtime) {
                return;
            }
            
            // Resolve local target by NAME (primary method)
            let targetIdToUse = null;
            let targetForEvent = service.vm.runtime.targets.find(target => target.getName() === payload.targetName);
            if (targetForEvent) {
                targetIdToUse = targetForEvent.id;
            } else if (payload.targetId && service.vm.runtime.getTargetById(payload.targetId)) {
                targetIdToUse = payload.targetId;
                targetForEvent = service.vm.runtime.getTargetById(targetIdToUse);
            } else if (reconstructedEvent.targetName) { // Extra fallback from serialized event
                targetForEvent = service.vm.runtime.targets
                    .find(target => target.getName() === reconstructedEvent.targetName);
                if (targetForEvent) {
                    targetIdToUse = targetForEvent.id;
                }
            }

            if (!targetForEvent) {
                if (isRetry) return;
                service.queuePendingEvent(payload);
                return;
            }

            if (['delete', 'move', 'change'].includes(reconstructedEvent.type)) {
                if (!service.vm.runtime) return;
                let targetBlocks = targetForEvent.blocks._blocks;
                if (!targetBlocks) {
                    // Scan all targets as last resort
                    for (const target of service.vm.runtime.targets) {
                        if (target.blocks && target.blocks._blocks && target.blocks._blocks[reconstructedEvent.id]) {
                            targetBlocks = target.blocks._blocks;
                            targetIdToUse = target.id;
                            targetForEvent = target;
                            break;
                        }
                    }
                }
                if (!targetBlocks) {
                    if (isRetry) return;
                    service.queuePendingEvent(payload);
                    return;
                }
                if (reconstructedEvent.type === 'move') {
                    if (!targetBlocks[reconstructedEvent.id]) {
                        if (isRetry) return;
                        service.queuePendingEvent(payload);
                        return;
                    }
                    if (reconstructedEvent.oldParent && !targetBlocks[reconstructedEvent.oldParent]) {
                        if (isRetry) return;
                        service.queuePendingEvent(payload);
                        return;
                    }
                    if (reconstructedEvent.newParent && !targetBlocks[reconstructedEvent.newParent]) {
                        if (isRetry) return;
                        service.queuePendingEvent(payload);
                        return;
                    }
                }
            }
            
            // Check if this event is for the currently editing target
            const isCurrentlyEditingTarget = service.vm.editingTarget &&
                service.vm.editingTarget.id === targetIdToUse;
            
            const originalFlag = service.isApplyingRemoteChange;
            service.isApplyingRemoteChange = true;
            try {
                // Apply to VM directly ONLY if not the current target
                if (!isCurrentlyEditingTarget) {
                    targetForEvent.blocks.blocklyListen(reconstructedEvent);
                }
                
                // Only update the visual workspace if this is the currently editing target
                if (isCurrentlyEditingTarget && service.workspace) {
                    const workspace = service.workspace;
                    
                    // Get reference to ScratchBlocks (Blockly)
                    const ScratchBlocks = window.ScratchBlocks;
                    
                    if (ScratchBlocks && ScratchBlocks.Events && ScratchBlocks.Events.fire) {
                        // Use ScratchBlocks.Events.fire() to replay the event
                        // This is much simpler and handles all event types correctly
                        try {
                            // Temporarily disable events to prevent re-syncing
                            const wasEnabled = ScratchBlocks.Events.isEnabled();
                            ScratchBlocks.Events.disable();
                            
                            // Fire the event to apply it to the workspace
                            ScratchBlocks.Events.fire(reconstructedEvent);
                            
                            // Re-enable events
                            if (wasEnabled) ScratchBlocks.Events.enable();
                            
                            // Handle special cases that need extra UI updates
                            if (reconstructedEvent.type === 'create') {
                                const createdBlock = workspace.getBlockById &&
                                    workspace.getBlockById(reconstructedEvent.blockId || reconstructedEvent.id);
                                
                                if (createdBlock && (createdBlock.type === 'procedures_definition' ||
                                    createdBlock.type === 'procedures_prototype')) {
                                    // Refresh the toolbox for custom blocks
                                    setTimeout(() => {
                                        if (workspace.toolbox_ && workspace.toolbox_.refreshSelection) {
                                            workspace.toolbox_.refreshSelection();
                                        }
                                    }, 100);
                                }
                            } else if (['var_create', 'var_delete', 'var_rename'].includes(reconstructedEvent.type)) {
                                // Refresh toolbox for variable changes
                                if (workspace.refreshToolboxSelection_) {
                                    workspace.refreshToolboxSelection_();
                                } else if (workspace.toolbox_ && workspace.toolbox_.refreshSelection) {
                                    workspace.toolbox_.refreshSelection();
                                }
                            }
                            
                            // Force workspace render to ensure changes are visible
                            if (workspace.render) {
                                workspace.render();
                            }
                            
                            // Emit workspace update
                            if (service.vm && service.vm.emitWorkspaceUpdate) {
                                service.vm.emitWorkspaceUpdate();
                            }
                        } catch (error) {
                            console.warn('[Collab] Failed to fire event:', error, reconstructedEvent);
                        }
                    } else {
                        console.warn('[Collab] ScratchBlocks.Events.fire not available');
                    }
                }
            } finally {
                setTimeout(() => {
                    service.isApplyingRemoteChange = originalFlag;
                }, 200);
            }
            
            // No longer need to restore original target since we don't switch away
            
            if (reconstructedEvent.type === 'create' && service.pendingEvents.length > 0) {
                setTimeout(() => service.processPendingEvents(), 100);
            }
            if (payload.eventId) service.seenEventIds.add(payload.eventId);
            
            // Only try to bump neighbors if this is the current editing target
            if (reconstructedEvent.type === 'move' && isCurrentlyEditingTarget && service.workspace) {
                if (service.workspace.getBlockById) {
                    const block = service.workspace.getBlockById(reconstructedEvent.id);
                    if (block && block.bumpNeighbours) {
                        block.bumpNeighbours();
                    }
                }
            }
        } finally {
            setTimeout(() => {
                service.isApplyingRemoteChange = false;
            }, 200);
        }
    }
    // This ensures all events flow: client -> host -> all other clients
    if (service.isHost && payload.sender !== service.peer.id) {
        // Host received event from a client, relay to all other clients
        service.connections.forEach(connection => {
            if (connection !== conn && connection.open && connection.peer !== payload.sender) {
                connection.send({
                    type: 'block-event',
                    payload: {
                        ...payload,
                        // Preserve original sender and event origin
                        sender: payload.sender || payload.eventOrigin,
                        eventOrigin: payload.eventOrigin || payload.sender
                    },
                    sender: payload.sender || payload.eventOrigin,
                    timestamp: Date.now()
                });
            }
        });
    }
};

export {
    collaborationBlockListener,
    handleBlockEvent
};
