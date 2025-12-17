// Chunk size for project transmission (in bytes)
const CHUNK_SIZE = 64 * 1024; // 64KB chunks

/**
 * Send a project sync message to all connected peers or specific connection
 * This now sends the project as a complete SB3 file for better asset handling
 * @param {CollaborationService} service - The collaboration service instance
 * @param {Peer.DataConnection} conn - The connection object
 */
const sendProjectSync = async (service, conn) => {
    if (service.vm) {
        // Prevent multiple simultaneous syncs
        if (service.isSyncOperation) {
            console.warn('[Sync] Sync already in progress, ignoring duplicate request');
            console.trace('[Sync] Stack trace for duplicate sync request:');
            return;
        }
        
        // Add cooldown to prevent rapid re-syncs (e.g., from UI events)
        const timeSinceLastSync = Date.now() - service.lastSyncTime;
        if (service.lastSyncTime > 0 && timeSinceLastSync < 5000) {
            console.warn(`[Sync] Too soon after last sync (${timeSinceLastSync}ms), ignoring request`);
            console.trace('[Sync] Stack trace for cooldown sync request:');
            return;
        }
        
        // IMPORTANT: Set isSyncOperation FIRST before any other operations
        // This prevents vm.saveProjectSb3() from triggering loadProject events
        service.isSyncOperation = true;
        service.isApplyingRemoteChange = true; // Also set this to prevent any event loops
        service.lastSyncTime = Date.now();
        
        console.log('═══════════════════════════════════════════════════════════');
        console.log('[📤 OUTGOING SYNC] HOST IS SENDING PROJECT TO CLIENTS');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('[🚀 Sync] Starting new project sync', {
            timestamp: service.lastSyncTime,
            targetConnection: conn ? 'specific peer' : 'all peers',
            connectionCount: service.connections.size,
            isHost: service.isHost,
            flags: {
                isSyncOperation: service.isSyncOperation,
                isApplyingRemoteChange: service.isApplyingRemoteChange,
                isLoadingProject: service.isLoadingProject
            }
        });
        console.trace('[📤 OUTGOING SYNC] Stack trace for who triggered this sync:');
        
        // Emit event to disable editing during sync
        service.emit('sync-lock', {locked: true});
        
        console.log('[Sync] Preparing SB3 project package...');
        
        try {
            // Save project as SB3 ArrayBuffer (includes all assets)
            // Disable optimization to preserve block and comment IDs for collaboration
            const sb3ArrayBuffer = await service.vm.saveProjectSb3('arraybuffer', {allowOptimization: false});
            
            // Convert ArrayBuffer to base64 for transmission
            const uint8Array = new Uint8Array(sb3ArrayBuffer);
            let binary = '';
            const len = uint8Array.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(uint8Array[i]);
            }
            const sb3Base64 = btoa(binary);
            
            const targetInfo = service.vm.runtime.targets.map(target => ({
                id: target.id,
                name: target.getName(),
                isOriginal: target.isOriginal,
                visible: target.visible,
                x: target.x,
                y: target.y,
                isStage: target.isStage,
                layerOrder: target.layerOrder || 0,
                direction: target.direction,
                size: target.size,
                currentCostume: target.currentCostume
            }));
            const currentEditingTarget = service.vm.editingTarget ? service.vm.editingTarget.id : null;
            
            // Get all loaded extensions and their URLs
            const loadedExtensions = Array.from(service.vm.extensionManager._loadedExtensions.keys());
            const extensionURLs = service.vm.extensionManager.getExtensionURLs();
            console.log('[Sync] Loaded extensions:', loadedExtensions);
            console.log('[Sync] Extension URLs:', extensionURLs);
            
            const totalSize = sb3Base64.length;
            
            // Split data into chunks for progress tracking
            const chunks = [];
            for (let i = 0; i < sb3Base64.length; i += CHUNK_SIZE) {
                chunks.push(sb3Base64.slice(i, i + CHUNK_SIZE));
            }
            
            console.log('[Sync] Sending SB3 project sync:', {
                timestamp: service.lastSyncTime,
                totalSize,
                totalChunks: chunks.length,
                targetConnection: conn ? 'specific' : 'broadcast'
            });
            
            // Send metadata first
            service.sendMessage('project-sync-start', {
                totalSize,
                totalChunks: chunks.length,
                targetInfo,
                currentEditingTarget,
                loadedExtensions,
                extensionURLs,
                syncTimestamp: service.lastSyncTime,
                format: 'sb3' // Indicate this is SB3 format
            }, conn);
            
            // Send chunks with progress tracking
            // Use a longer delay to prevent overwhelming the connection
            let sentBytes = 0;
            let chunksCompleted = 0;
            const CHUNK_DELAY = 100; // Increased to 100ms to prevent overwhelming connection
            
            console.log(`[Sync] Sending ${chunks.length} chunks with ${CHUNK_DELAY}ms delay between each`);
            
            // Handle edge case: if no chunks or no connections, clear flags immediately
            if (chunks.length === 0 || service.connections.size === 0) {
                console.log('[Sync] No chunks to send or no connections, clearing flags immediately');
                service.isSyncOperation = false;
                service.isApplyingRemoteChange = false;
                service.isLoadingProject = false;
                service.emit('sync-lock', {locked: false});
                return;
            }
            
            chunks.forEach((chunk, index) => {
                setTimeout(() => {
                    try {
                        service.sendMessage('project-sync-chunk', {
                            chunkIndex: index,
                            chunk,
                            syncTimestamp: service.lastSyncTime
                        }, conn);
                        sentBytes += chunk.length;
                        chunksCompleted++;
                        
                        const progress = Math.round((sentBytes / totalSize) * 100);
                        service.emit('project-sync-upload-progress', {
                            progress,
                            sentBytes,
                            totalSize,
                            chunksCompleted,
                            totalChunks: chunks.length
                        });
                        
                        // Clear flags only after ALL chunks have been sent
                        if (chunksCompleted === chunks.length) {
                            service.isSyncOperation = false;
                            service.isApplyingRemoteChange = false;
                            service.isLoadingProject = false;
                            service.emit('sync-lock', {locked: false});
                            console.log('═══════════════════════════════════════════════════════════');
                            console.log('[📤 OUTGOING SYNC] ✅ COMPLETE - All chunks sent to clients');
                            console.log('═══════════════════════════════════════════════════════════');
                            console.log('[🔄 Sync] All chunks sent, cleared flags', {
                                totalChunks: chunks.length,
                                totalBytes: totalSize
                            });
                        }
                    } catch (error) {
                        console.error(`[Sync] Failed to send chunk ${index}:`, error);
                        chunksCompleted++; // Increment even on error to prevent getting stuck
                        
                        // If this was the last chunk (even if it failed), clear flags to prevent getting stuck
                        if (chunksCompleted === chunks.length) {
                            service.isSyncOperation = false;
                            service.isApplyingRemoteChange = false;
                            service.isLoadingProject = false;
                            service.emit('sync-lock', {locked: false});
                            service.emit('sync-failed', {error: 'Failed to send chunk', chunkIndex: index});
                        }
                    }
                }, index * CHUNK_DELAY);
            });
        } catch (error) {
            console.error('[Sync] Failed to create SB3 package:', error);
            service.isSyncOperation = false;
            service.isApplyingRemoteChange = false;
            service.isLoadingProject = false; // Clear loading flag on error
            service.emit('sync-lock', {locked: false});
            service.emit('sync-failed', {error});
        }
    }
};

/**
 * Debug method to get current target states
 * @param {CollaborationService} service - The collaboration service instance
 * @return {object} - An object containing target information
 */
const debugTargetStates = service => {
    if (!service.vm || !service.vm.runtime) {
        return {targets: [], editingTarget: null};
    }
    const targets = service.vm.runtime.targets.map(target => ({
        id: target.id,
        name: target.getName(),
        isOriginal: target.isOriginal,
        visible: target.visible
    }));
    const editingTarget = service.vm.editingTarget ? {
        id: service.vm.editingTarget.id,
        name: service.vm.editingTarget.getName()
    } : null;
    return {targets, editingTarget};
};

/**
 * Handle project sync start message (metadata)
 * @param {CollaborationService} service - The collaboration service instance
 * @param {object} payload - The sync start payload
 */
const handleProjectSyncStart = (service, payload) => {
    if (!service.isHost && service.vm) {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('[📥 INCOMING SYNC] CLIENT IS RECEIVING PROJECT FROM HOST');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('[Sync] Received project-sync-start:', {
            timestamp: payload.syncTimestamp,
            totalSize: payload.totalSize,
            totalChunks: payload.totalChunks,
            format: payload.format || 'json',
            hasExistingState: !!service.syncDownloadState,
            currentFlags: {
                isSyncOperation: service.isSyncOperation,
                isApplyingRemoteChange: service.isApplyingRemoteChange,
                isLoadingProject: service.isLoadingProject
            }
        });
        
        // If we're already in the middle of loading a project, ignore this sync
        if (service.isSyncOperation || service.isApplyingRemoteChange) {
            console.warn('[Sync] Already processing a sync, ignoring new sync-start');
            return;
        }
        
        // Emit event to disable editing during sync
        service.emit('sync-lock', {locked: true});
        
        // Check if we already have a sync in progress
        if (service.syncDownloadState) {
            // If it's the same sync (same timestamp), ignore
            if (service.syncDownloadState.syncTimestamp === payload.syncTimestamp) {
                console.warn('[Sync] Already processing this sync (same timestamp), ignoring duplicate');
                return;
            }
            // If it's a newer sync, cancel the old one and start the new one
            console.log('[Sync] Canceling previous sync and starting new one');
            service.syncDownloadState = null;
        }
        
        // Initialize sync download state
        service.syncDownloadState = {
            chunks: new Array(payload.totalChunks),
            receivedChunks: 0,
            totalChunks: payload.totalChunks,
            totalSize: payload.totalSize,
            receivedBytes: 0,
            targetInfo: payload.targetInfo,
            currentEditingTarget: payload.currentEditingTarget,
            loadedExtensions: payload.loadedExtensions || [],
            extensionURLs: payload.extensionURLs || {},
            syncTimestamp: payload.syncTimestamp,
            format: payload.format || 'json' // Track whether this is SB3 or JSON format
        };
        
        console.log('[Sync] Starting download, expecting', payload.totalChunks, 'chunks');
        console.log('[Sync] Extensions to load:', payload.loadedExtensions);
        
        service.emit('project-sync-download-start', {
            totalSize: payload.totalSize,
            totalChunks: payload.totalChunks
        });
    }
};

/**
 * Process complete project sync data
 * @param {CollaborationService} service - The collaboration service instance
 * @param {object|ArrayBuffer} projectData - The complete project data (SB3 or JSON)
 * @param {Array} targetInfo - Target information array
 * @param {string} currentEditingTarget - Current editing target ID
 * @param {string} format - Format of the project data ('sb3' or 'json')
 * @param {Array} loadedExtensions - Extensions that should be loaded
 * @param {object} extensionURLs - Extension ID to URL mapping
 */
const processCompleteProjectSync = (service, projectData, targetInfo, currentEditingTarget, format,
    loadedExtensions, extensionURLs) => {
    const wasAttachedToWorkspace = !!service.workspace;
    service.isApplyingRemoteChange = true;
    service.isSyncOperation = true;
    if (wasAttachedToWorkspace) {
        service.detachFromWorkspace();
    }
    
    console.log('[Sync] Loading project, format:', format);
    console.log('[Sync] Extensions to load after project:', loadedExtensions);
    
    let loadPromise;
    
    if (format === 'sb3') {
        // Load SB3 file directly - this handles all assets automatically
        loadPromise = service.vm.loadProject(projectData);
    } else {
        // Legacy JSON format - handle target ID mapping
        if (projectData.targets && targetInfo) {
            projectData.targets.forEach((targetData, i) => {
                if (targetInfo[i] && targetInfo[i].id) {
                    targetData.id = targetInfo[i].id;
                }
            });
        }
        loadPromise = service.vm.loadProject(projectData);
    }
    
    loadPromise.then(async () => {
        const currentService = service;
        
        console.log('[📥 INCOMING SYNC] Project loaded successfully, now processing extensions and targets');
        
        currentService.emit('project-sync-download-progress', {progress: 100});
        setTimeout(() => {
            currentService.emit('project-sync-download-complete');
        }, 200);
        
        // Only manually load extensions for legacy JSON format
        if (format !== 'sb3' && loadedExtensions && loadedExtensions.length > 0) {
            console.log('[Sync] Loading extensions for JSON format project...', loadedExtensions);
            for (const extId of loadedExtensions) {
                if (service.vm.extensionManager.isExtensionLoaded(extId)) {
                    console.log(`[Sync] ✓ Extension ${extId} already loaded, skipping`);
                } else {
                    try {
                        if (service.vm.extensionManager.isBuiltinExtension(extId)) {
                            console.log(`[Sync] ⏳ Loading built-in extension: ${extId}`);
                            service.vm.extensionManager.loadExtensionIdSync(extId);
                            console.log(`[Sync] ✓ Built-in extension ${extId} loaded successfully`);
                        } else if (extensionURLs && extensionURLs[extId]) {
                            console.log(`[Sync] ⏳ Loading custom extension ${extId} from ${extensionURLs[extId]}`);
                            await service.vm.extensionManager.loadExtensionURL(extensionURLs[extId]);
                            console.log(`[Sync] ✓ Custom extension ${extId} loaded successfully`);
                        } else {
                            console.warn(`[Sync] ⚠️ Extension ${extId} is not built-in and no URL provided`);
                        }
                    } catch (error) {
                        console.error(`[Sync] ❌ Failed to load extension ${extId}:`, error);
                    }
                }
            }
        } else if (format === 'sb3') {
            console.log('[Sync] ✓ SB3 format detected - extensions already loaded from project file');
        } else {
            console.log('[Sync] No extensions to load');
        }
        
        // For JSON format, we need to handle target ID mapping
        // For SB3 format, the IDs are already correct
        if (format !== 'sb3' && targetInfo) {
            targetInfo.forEach((expectedTarget, i) => {
                const actualTarget = service.vm.runtime.targets[i];
                if (actualTarget && actualTarget.id !== expectedTarget.id) {
                    const oldId = actualTarget.id;
                    actualTarget.id = expectedTarget.id;
                    if (service.vm.runtime._targets) {
                        delete service.vm.runtime._targets[oldId];
                        service.vm.runtime._targets[expectedTarget.id] = actualTarget;
                    }
                }
            });
        }
        
        const newTargetMapping = {};
        if (targetInfo) {
            targetInfo.forEach((targetInfoItem, i) => {
                const actualTarget = service.vm.runtime.targets[i];
                if (actualTarget) {
                    newTargetMapping[targetInfoItem.id] = actualTarget.id;
                    console.log(
                        `[Sync] Target mapping: ${targetInfoItem.name} ${targetInfoItem.id} → ${actualTarget.id}`
                    );
                }
            });
        }
        currentService.targetMapping = newTargetMapping;
        
        // Keep flags set during these operations to prevent event broadcast
        if (currentEditingTarget) {
            const targetExists = service.vm.runtime.getTargetById(currentEditingTarget);
            if (targetExists) {
                service.vm.setEditingTarget(currentEditingTarget);
            } else {
                const fallbackTarget = service.vm.runtime.targets.find(t => !t.isOriginal);
                if (fallbackTarget) {
                    service.vm.setEditingTarget(fallbackTarget.id);
                }
            }
        }
        
        // Clear flags BEFORE workspace reattachment to avoid blocking legitimate events
        currentService.isSyncOperation = false;
        currentService.isLoadingProject = false;
        currentService.isApplyingRemoteChange = false;
        currentService.emit('sync-lock', {locked: false});
        
        if (wasAttachedToWorkspace) {
            currentService.emit('request-workspace-reattach');
        }
        
        const finalState = debugTargetStates(currentService, 'After project sync complete');
        currentService.emit('project-synced', {
            targets: finalState.targets,
            editingTarget: finalState.editingTarget ? finalState.editingTarget.id : null
        });
        
        console.log('═══════════════════════════════════════════════════════════');
        console.log('[📥 INCOMING SYNC] ✅ COMPLETE - Client successfully received and loaded project');
        console.log('═══════════════════════════════════════════════════════════');
    })
        .catch(error => {
            console.error('═══════════════════════════════════════════════════════════');
            console.error('[📥 INCOMING SYNC] ❌ FAILED - Error loading project:', error);
            console.error('═══════════════════════════════════════════════════════════');
            service.isApplyingRemoteChange = false;
            service.isSyncOperation = false;
            service.isLoadingProject = false; // Clear loading flag on error too
            service.emit('sync-lock', {locked: false});
            if (wasAttachedToWorkspace) {
                service.emit('request-workspace-reattach');
            }
            service.emit('sync-failed', {error});
            service.emit('project-sync-download-error', {error});
            service.syncDownloadState = null;
        });
};

/**
 * Handle project sync chunk message
 * @param {CollaborationService} service - The collaboration service instance
 * @param {object} payload - The chunk payload
 */
const handleProjectSyncChunk = (service, payload) => {
    if (!service.isHost && service.vm && service.syncDownloadState) {
        const state = service.syncDownloadState;
        
        // If we're already processing the complete project, ignore new chunks
        if (service.isSyncOperation && service.isApplyingRemoteChange) {
            console.warn('[Sync] Already loading project, ignoring chunk:', payload.chunkIndex);
            return;
        }
        
        if (state.syncTimestamp !== payload.syncTimestamp) {
            console.warn('[Sync] Received chunk from old sync operation, ignoring:', {
                expectedTimestamp: state.syncTimestamp,
                receivedTimestamp: payload.syncTimestamp,
                chunkIndex: payload.chunkIndex
            });
            return;
        }
        
        if (state.chunks[payload.chunkIndex]) {
            console.warn(`[Sync] Received duplicate chunk ${payload.chunkIndex}, ignoring`);
            return;
        }
        
        state.chunks[payload.chunkIndex] = payload.chunk;
        state.receivedChunks++;
        state.receivedBytes += payload.chunk.length;
        
        const progress = Math.round((state.receivedBytes / state.totalSize) * 100);
        
        if (state.receivedChunks % 10 === 0 || state.receivedChunks === state.totalChunks) {
            console.log(`[Sync] Progress: ${progress}% (${state.receivedChunks}/${state.totalChunks} chunks)`);
        }
        
        service.emit('project-sync-download-progress', {
            progress,
            receivedBytes: state.receivedBytes,
            totalSize: state.totalSize,
            receivedChunks: state.receivedChunks,
            totalChunks: state.totalChunks
        });
        
        if (state.receivedChunks === state.totalChunks) {
            console.log('[Sync] All chunks received, reassembling project');
            
            // Mark that we're about to start processing to prevent duplicate processing
            if (state.isProcessing) {
                console.warn('[Sync] Already processing this sync, ignoring duplicate completion');
                return;
            }
            state.isProcessing = true;
            
            const projectDataString = state.chunks.join('');
            let projectData;
            
            if (state.format === 'sb3') {
                console.log('[Sync] Converting base64 to SB3 ArrayBuffer...');
                const binaryString = atob(projectDataString);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                projectData = bytes.buffer;
            } else {
                projectData = JSON.parse(projectDataString);
            }
            
            // Clear sync state before processing to prevent any new chunks from being accepted
            service.syncDownloadState = null;
            
            processCompleteProjectSync(
                service,
                projectData,
                state.targetInfo,
                state.currentEditingTarget,
                state.format,
                state.loadedExtensions,
                state.extensionURLs
            );
        }
    } else if (!service.isHost && service.vm && !service.syncDownloadState) {
        console.warn(
            '[Sync] Received chunk but no sync state exists - chunk may have arrived before sync-start:',
            payload.chunkIndex
        );
    }
};

export {
    sendProjectSync,
    handleProjectSyncStart,
    handleProjectSyncChunk,
    debugTargetStates
};
