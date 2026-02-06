import {getTargetIdForMessage} from './target-id-utils.js';
import cursorIcon from '../assets/icon--cursor.svg';

/**
 * Setup the cursor layer
 * @param {CollaborationService} service - The collaboration service instance
 */
const setupCursorLayer = service => {
    if (!service.workspace) return;
    const svg = service.workspace.getParentSvg && service.workspace.getParentSvg();
    if (!svg) return;
    const container = svg.parentNode;
    if (!container) return;
    const layer = document.createElement('div');
    layer.style.position = 'absolute';
    layer.style.left = '0';
    layer.style.top = '0';
    layer.style.right = '0';
    layer.style.bottom = '0';
    layer.style.pointerEvents = 'none';
    layer.style.zIndex = '999';
    container.style.position = container.style.position || 'relative';
    container.appendChild(layer);
    service.cursorLayer = layer;
};

/**
 * Destroy the cursor layer
 * @param {CollaborationService} service - The collaboration service instance
 */
const destroyCursorLayer = service => {
    if (service.cursorLayer && service.cursorLayer.parentNode) {
        service.cursorLayer.parentNode.removeChild(service.cursorLayer);
    }
    service.cursorLayer = null;
    service.remoteCursors.forEach(el => {
        if (el && el.parentNode) el.parentNode.removeChild(el);
    });
    service.remoteCursors.clear();
};

/**
 * Bind cursor events
 * @param {CollaborationService} service - The collaboration service instance
 */
const bindCursorEvents = service => {
    if (!service.workspace) return;
    const svg = service.workspace.getParentSvg && service.workspace.getParentSvg();
    if (!svg) return;
    const container = svg.parentNode;
    if (!container) return;
    service._onMouseMove = e => {
        const rect = container.getBoundingClientRect();
        const x = (e.clientX - rect.left);
        const y = (e.clientY - rect.top);
        if (!service.workspace) return;
        const metrics = service.workspace.getMetrics && service.workspace.getMetrics();
        const scale = service.workspace.scale || 1;
        const wX = metrics ? (metrics.viewLeft + x) / scale : x;
        const wY = metrics ? (metrics.viewTop + y) / scale : y;
        
        // Get the target ID to send (mapped for clients)
        const localTargetId = service.vm && service.vm.editingTarget ? service.vm.editingTarget.id : null;
        const targetId = getTargetIdForMessage(service, localTargetId);
        
        service._lastCursorOverlay = {x, y};
        service.sendMessage('cursor-move', {x: wX, y: wY, targetId});
    };
    service._onMouseLeave = () => {
        service.sendMessage('cursor-leave', {});
    };
    container.addEventListener('mousemove', service._onMouseMove);
    container.addEventListener('mouseleave', service._onMouseLeave);
};

/**
 * Unbind cursor events
 * @param {CollaborationService} service - The collaboration service instance
 */
const unbindCursorEvents = service => {
    if (!service.workspace) return;
    const svg = service.workspace.getParentSvg && service.workspace.getParentSvg();
    if (!svg) return;
    const container = svg.parentNode;
    if (!container) return;
    if (service._onMouseMove) container.removeEventListener('mousemove', service._onMouseMove);
    if (service._onMouseLeave) container.removeEventListener('mouseleave', service._onMouseLeave);
    service._onMouseMove = null;
    service._onMouseLeave = null;
};

/**
 * Handle cursor move
 * @param {CollaborationService} service - The collaboration service instance
 * @param {object} payload - The cursor move payload
 * @param {Peer.DataConnection} conn - The connection object
 */
const handleCursorMove = (service, payload, conn) => {
    if (!service.cursorLayer || !service.workspace) return;
    const id = payload.sender;
    if (!id) return;
    let el = service.remoteCursors.get(id);
    if (!el) {
        el = document.createElement('div');
        el.className = 'collaboration-remote-cursor';
        el.style.position = 'absolute';
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.transform = 'translate(0, 0)';
        el.style.pointerEvents = 'none';
        
        // Create cursor icon from imported SVG
        const cursorImg = document.createElement('img');
        cursorImg.src = cursorIcon;
        cursorImg.className = 'collaboration-cursor-icon';
        cursorImg.style.width = '24px';
        cursorImg.style.height = '24px';
        // Use CSS filter to colorize the cursor to match the theme
        // This filter makes black SVGs white, preserving the shape
        cursorImg.style.filter = 'brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,0.4))';
        cursorImg.draggable = false;
        el.appendChild(cursorImg);
        
        const label = document.createElement('div');
        label.className = 'collaboration-cursor-label';
        label.style.position = 'absolute';
        label.style.top = '26px';
        label.style.left = '0';
        label.style.padding = '3px 7px';
        label.style.background = 'var(--looks-secondary)';
        label.style.color = 'var(--ui-white, white)';
        label.style.fontSize = '11px';
        label.style.fontWeight = '600';
        label.style.borderRadius = '4px';
        label.style.whiteSpace = 'nowrap';
        label.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.appendChild(label);
        service.cursorLayer.appendChild(el);
        service.remoteCursors.set(id, el);
    }
    const metrics = service.workspace.getMetrics && service.workspace.getMetrics();
    const scale = service.workspace.scale || 1;
    const currentTargetId = service.vm && service.vm.editingTarget ? service.vm.editingTarget.id : null;
    
    // Map the remote target ID to local target ID if we're a client
    let remoteTargetId = payload.targetId;
    if (!service.isHost && remoteTargetId && service.targetMapping) {
        // For clients: map host's target ID to our local target ID
        const mappedId = service.targetMapping[remoteTargetId];
        if (mappedId) {
            remoteTargetId = mappedId;
        }
    }
    
    if (remoteTargetId && currentTargetId && remoteTargetId !== currentTargetId) {
        el.style.display = 'none';
    } else {
        const x = (payload.x * scale) - (metrics ? metrics.viewLeft : 0);
        const y = (payload.y * scale) - (metrics ? metrics.viewTop : 0);
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.display = 'block';
    }
    service.remoteCursorPositions.set(id, {x: payload.x, y: payload.y, targetId: remoteTargetId});
    const labelEl = el.children[1]; // Second child is the label
    const user = service.users.get(id);
    const name = user && user.username ? user.username : '';
    if (labelEl) labelEl.textContent = name;

    if (service.isHost && payload.sender !== service.peer.id) {
        service.connections.forEach(connection => {
            if (connection !== conn && connection.open) {
                connection.send({type: 'cursor-move', payload, sender: payload.sender, timestamp: Date.now()});
            }
        });
    }
};

/**
 * Handle cursor leave
 * @param {CollaborationService} service - The collaboration service instance
 * @param {object} payload - The cursor leave payload
 * @param {Peer.DataConnection} conn - The connection object
 */
const handleCursorLeave = (service, payload, conn) => {
    if (!service.cursorLayer) return;
    const id = payload.sender;
    if (!id) return;
    const el = service.remoteCursors.get(id);
    if (el) el.style.display = 'none';
    service.remoteCursorPositions.delete(id);
    if (service.isHost && payload.sender !== service.peer.id) {
        service.connections.forEach(connection => {
            if (connection !== conn && connection.open) {
                connection.send({type: 'cursor-leave', payload, sender: payload.sender, timestamp: Date.now()});
            }
        });
    }
};

/**
 * Update all remote cursor positions
 * @param {CollaborationService} service - The collaboration service instance
 */
const updateAllRemoteCursorPositions = service => {
    if (!service.workspace || !service.cursorLayer) return;
    const metrics = service.workspace.getMetrics && service.workspace.getMetrics();
    const scale = service.workspace.scale || 1;
    const currentTargetId = service.vm && service.vm.editingTarget ? service.vm.editingTarget.id : null;
    service.remoteCursors.forEach((el, id) => {
        const pos = service.remoteCursorPositions.get(id);
        if (!pos) return;
        if (pos.targetId && currentTargetId && pos.targetId !== currentTargetId) {
            el.style.display = 'none';
            return;
        }
        const x = (pos.x * scale) - (metrics ? metrics.viewLeft : 0);
        const y = (pos.y * scale) - (metrics ? metrics.viewTop : 0);
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.display = 'block';
    });
};

/**
 * Bind viewport sync listeners
 * @param {CollaborationService} service - The collaboration service instance
 */
const bindViewportSyncListeners = service => {
    if (!service.workspace) return;
    const svg = service.workspace.getParentSvg && service.workspace.getParentSvg();
    if (!svg) return;
    const container = svg.parentNode;
    if (!container) return;
    service._onViewportWheel = () => {
        updateAllRemoteCursorPositions(service);
        if (!service.workspace) return;
        const metrics = service.workspace.getMetrics && service.workspace.getMetrics();
        const scale = service.workspace.scale || 1;
        if (service._lastCursorOverlay) {
            const wX = metrics ?
                (metrics.viewLeft + service._lastCursorOverlay.x) / scale :
                service._lastCursorOverlay.x;
            const wY = metrics ?
                (metrics.viewTop + service._lastCursorOverlay.y) / scale :
                service._lastCursorOverlay.y;
            
            const localTargetId = service.vm && service.vm.editingTarget ?
                service.vm.editingTarget.id : null;
            const targetId = getTargetIdForMessage(service, localTargetId);
            service.sendMessage('cursor-move', {x: wX, y: wY, targetId});
        }
    };
    service._onWorkspaceChangeForCursor = () => {
        updateAllRemoteCursorPositions(service);
        if (!service.workspace) return;
        const metrics = service.workspace.getMetrics && service.workspace.getMetrics();
        const scale = service.workspace.scale || 1;
        if (service._lastCursorOverlay) {
            const wX = metrics ?
                (metrics.viewLeft + service._lastCursorOverlay.x) / scale :
                service._lastCursorOverlay.x;
            const wY = metrics ?
                (metrics.viewTop + service._lastCursorOverlay.y) / scale :
                service._lastCursorOverlay.y;
            
            const localTargetId = service.vm && service.vm.editingTarget ?
                service.vm.editingTarget.id : null;
            const targetId = getTargetIdForMessage(service, localTargetId);
            service.sendMessage('cursor-move', {x: wX, y: wY, targetId});
        }
    };
    container.addEventListener('wheel', service._onViewportWheel, {passive: true});
    service.workspace.addChangeListener(service._onWorkspaceChangeForCursor);
};

/**
 * Unbind viewport sync listeners
 * @param {CollaborationService} service - The collaboration service instance
 */
const unbindViewportSyncListeners = service => {
    if (!service.workspace) return;
    const svg = service.workspace.getParentSvg && service.workspace.getParentSvg();
    if (!svg) return;
    const container = svg.parentNode;
    if (!container) return;
    if (service._onViewportWheel) container.removeEventListener('wheel', service._onViewportWheel);
    if (service._onWorkspaceChangeForCursor) {
        service.workspace.removeChangeListener(service._onWorkspaceChangeForCursor);
    }
    service._onViewportWheel = null;
    service._onWorkspaceChangeForCursor = null;
};

export {
    setupCursorLayer,
    destroyCursorLayer,
    bindCursorEvents,
    unbindCursorEvents,
    handleCursorMove,
    handleCursorLeave,
    updateAllRemoteCursorPositions,
    bindViewportSyncListeners,
    unbindViewportSyncListeners
};
