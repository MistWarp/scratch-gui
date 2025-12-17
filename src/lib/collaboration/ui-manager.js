import {
    setupCursorLayer,
    bindCursorEvents,
    bindViewportSyncListeners,
    updateAllRemoteCursorPositions,
    unbindCursorEvents,
    unbindViewportSyncListeners,
    destroyCursorLayer
} from './cursor-sync.js';
import {getTargetIdForMessage} from './target-id-utils.js';

const attachToWorkspace = (service, workspace) => {
    if (!workspace) return;
    service.workspace = workspace;
    
    // Patch Blockly FieldTextInput to track blur events for text input
    // This prevents spamming updates on every keystroke
    if (typeof window !== 'undefined' && window.Blockly && window.Blockly.FieldTextInput) {
        const FieldTextInput = window.Blockly.FieldTextInput;
        
        // Store original widgetDispose
        if (!FieldTextInput.prototype._originalWidgetDispose) {
            FieldTextInput.prototype._originalWidgetDispose = FieldTextInput.prototype.widgetDispose_;
            
            // Override widgetDispose to mark the final event
            FieldTextInput.prototype.widgetDispose_ = function () {
                // Mark the next change event as final (not intermediate)
                if (this.sourceBlock_) {
                    this.sourceBlock_._textInputJustFinished = true;
                    // Clear the flag after a short delay to ensure the event is processed
                    setTimeout(() => {
                        if (this.sourceBlock_) {
                            delete this.sourceBlock_._textInputJustFinished;
                        }
                    }, 100);
                }
                return FieldTextInput.prototype._originalWidgetDispose.call(this);
            };
        }
    }
    
    // Wrap the blockListener to mark intermediate text input events
    const originalBlockListener = service.collaborationBlockListener.bind(service);
    service._wrappedBlockListener = event => {
        console.log(event, event.toJson());
        if (event.type === 'change' && event.element === 'field' && event.name) {
            // Check if this is a text input field change
            const block = service.workspace && service.workspace.getBlockById ?
                service.workspace.getBlockById(event.blockId) : null;
            
            if (block) {
                const field = block.getField(event.name);
                // Only mark as intermediate if it's a FieldTextInput AND the input is still active
                if (field && field.constructor && field.constructor.name === 'FieldTextInput') {
                    // Check if the text input widget has been disposed (blur event)
                    if (!block._textInputJustFinished) {
                        // This is an intermediate text input event (keystroke) - mark it to be filtered
                        event._isIntermediateTextInput = true;
                    }
                }
                // For all other field types (dropdowns, numbers, colors, etc.),
                // let the event through immediately
            }
        }
        
        // For custom block events, batch them to reduce spam
        // BUT: Don't trigger refreshWorkspace during sync/load operations to prevent infinite loops
        if (event.type === 'create' && event.xml &&
            !service.isSyncOperation && !service.isLoadingProject) {
            const xmlString = typeof event.xml === 'string' ? event.xml : event.xml.outerHTML;
            if (xmlString && (xmlString.includes('procedures_definition') ||
                             xmlString.includes('procedures_prototype') ||
                             xmlString.includes('procedures_call'))) {
                // This is a custom block creation - defer workspace refresh
                if (!service._customBlockRefreshPending) {
                    service._customBlockRefreshPending = true;
                    setTimeout(() => {
                        service._customBlockRefreshPending = false;
                        // Only refresh if still not in a sync/load operation
                        if (service.isSyncOperation || service.isLoadingProject) {
                            console.log('[UI Manager] Skipping refreshWorkspace during sync/load');
                            return;
                        }
                        // Refresh the toolbox to show the new custom block
                        if (service.workspace && service.workspace.toolbox_) {
                            service.workspace.toolbox_.refreshSelection();
                        }
                        // Also refresh on the VM side
                        if (service.vm && service.vm.refreshWorkspace) {
                            service.vm.refreshWorkspace();
                        }
                    }, 300); // Wait for all related events to settle
                }
            }
        }
        
        return originalBlockListener(event);
    };
    
    workspace.addChangeListener(service._wrappedBlockListener);
    setupCursorLayer(service);
    bindCursorEvents(service);
    bindViewportSyncListeners(service);
    if (service.workspace.scrollbar && service.workspace.scrollbar.set && !service._origScrollbarSet) {
        const sb = service.workspace.scrollbar;
        service._origScrollbarSet = sb.set.bind(sb);
        sb.set = function (x, y) {
            service._origScrollbarSet(x, y);
            updateAllRemoteCursorPositions(service);
            const svg = service.workspace.getParentSvg && service.workspace.getParentSvg();
            const container = svg ? svg.parentNode : null;
            if (container) {
                const metrics = service.workspace.getMetrics && service.workspace.getMetrics();
                const scale = service.workspace.scale || 1;
                const last = service._lastCursorOverlay;
                if (last) {
                    const wX = metrics ? (metrics.viewLeft + last.x) / scale : last.x;
                    const wY = metrics ? (metrics.viewTop + last.y) / scale : last.y;
                    const localTargetId = service.vm && service.vm.editingTarget ? service.vm.editingTarget.id : null;
                    const targetId = getTargetIdForMessage(service, localTargetId);
                    service.sendMessage('cursor-move', {x: wX, y: wY, targetId});
                }
            }
        };
    }
    if (service.workspace.setScale && !service._origSetScale) {
        service._origSetScale = service.workspace.setScale.bind(service.workspace);
        service.workspace.setScale = function (scale) {
            service._origSetScale(scale);
            updateAllRemoteCursorPositions(service);
            const svg = service.workspace.getParentSvg && service.workspace.getParentSvg();
            const container = svg ? svg.parentNode : null;
            if (container) {
                const metrics = service.workspace.getMetrics && service.workspace.getMetrics();
                const last = service._lastCursorOverlay;
                if (last) {
                    const wX = metrics ? (metrics.viewLeft + last.x) / scale : last.x;
                    const wY = metrics ? (metrics.viewTop + last.y) / scale : last.y;
                    const localTargetId = service.vm && service.vm.editingTarget ? service.vm.editingTarget.id : null;
                    const targetId = getTargetIdForMessage(service, localTargetId);
                    service.sendMessage('cursor-move', {x: wX, y: wY, targetId});
                }
            }
        };
    }
};

const detachFromWorkspace = service => {
    if (!service.workspace) return;
    if (service.workspace) {
        // Remove the wrapped listener, not the original
        if (service._wrappedBlockListener) {
            service.workspace.removeChangeListener(service._wrappedBlockListener);
            delete service._wrappedBlockListener;
        } else {
            service.workspace.removeChangeListener(service.collaborationBlockListener);
        }
    }
    unbindCursorEvents(service);
    unbindViewportSyncListeners(service);
    if (service.workspace && service.workspace.scrollbar && service._origScrollbarSet) {
        service.workspace.scrollbar.set = service._origScrollbarSet;
        service._origScrollbarSet = null;
    }
    if (service.workspace && service._origSetScale) {
        service.workspace.setScale = service._origSetScale;
        service._origSetScale = null;
    }
    destroyCursorLayer(service);
    service.workspace = null;
};

const attemptWorkspaceAttachment = (service, context) => {
    if (service.workspace) return;
    if (window.Blockly && window.Blockly.getMainWorkspace && window.Blockly.getMainWorkspace()) {
        service.attachToWorkspace(window.Blockly.getMainWorkspace());
        return;
    }
    setTimeout(() => {
        attemptWorkspaceAttachment(service, `${context} (retry)`);
    }, 1000);
};

export {
    attachToWorkspace,
    detachFromWorkspace,
    attemptWorkspaceAttachment
};
