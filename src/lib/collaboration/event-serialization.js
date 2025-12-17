const serializeEvent = (service, event) => {
    const json = event.toJson();
    // Add targetName for reliable lookup
    const target = service.vm.editingTarget;
    if (target) {
        json.targetName = target.getName();
    }
    return json;
};

// reconstructEvent remains the same: Blockly.Events.fromJson(json, workspace) will preserve extra props like targetName

const reconstructEvent = (service, serializedEvent) => {
    // Use Blockly's built-in fromJson() method for deserialization
    // This handles all event types correctly and is much simpler
    if (!serializedEvent) {
        console.warn('[Collab] No serialized event provided');
        return null;
    }
    
    if (!service.workspace) {
        console.warn('[Collab] No workspace available for event reconstruction');
        return null;
    }
    
    // serializedEvent is a plain JavaScript object (already parsed from JSON by PeerJS)
    // We pass it to fromJson() which expects a plain object, not a JSON string
    
    // Get reference to ScratchBlocks (Blockly)
    const ScratchBlocks = window.ScratchBlocks;
    
    if (!ScratchBlocks || !ScratchBlocks.Events || !ScratchBlocks.Events.fromJson) {
        console.warn('[Collab] ScratchBlocks.Events.fromJson not available');
        return null;
    }
    
    try {
        const event = ScratchBlocks.Events.fromJson(serializedEvent, service.workspace);
        return event;
    } catch (error) {
        console.warn('[Collab] Failed to reconstruct event:', error, serializedEvent);
        return null;
    }
};

const shouldSyncEvent = (service, event) => {
    if (!event || !event.type) {
        return false;
    }

    const syncableEvents = [
        'create',
        'delete',
        'change',
        'move',
        'var_create',
        'var_delete',
        'var_rename',
        'comment_create',
        'comment_delete',
        'comment_change',
        'comment_move'
    ];

    if (!syncableEvents.includes(event.type)) {
        return false;
    }

    if (event.type === 'move') {
        return true;
    }

    if (event.type === 'change') {
        // Filter out UI-only events but allow field changes including intermediate text input
        if (event.element === 'select' || event.element === 'click') {
            return false;
        }
        // Only sync field changes when editing is complete (blur/finished)
        // Skip intermediate text input events to reduce spam
        if (event.element === 'field' && event.name) {
            // Check if this is an intermediate text input change
            // These events fire on every keystroke - we only want the final value
            if (event._isIntermediateTextInput) {
                return false;
            }
        }
        // Allow all other field changes
        return true;
    }

    return true;
};

export {
    serializeEvent,
    reconstructEvent,
    shouldSyncEvent
};
