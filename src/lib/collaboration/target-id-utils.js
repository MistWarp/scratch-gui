/**
 * Utility functions for handling target ID mapping between host and clients
 */

/**
 * Get the target ID to send in messages
 * For clients, this maps local target ID to host target ID
 * For hosts, this returns the target ID as-is
 * @param {CollaborationService} service - The collaboration service instance
 * @param {string} localTargetId - The local target ID
 * @return {string|null} - The target ID to send
 */
const getTargetIdForMessage = (service, localTargetId) => {
    if (!localTargetId) return null;
    
    // If we're a client, reverse-map: find the host ID that maps to our local ID
    if (!service.isHost && service.targetMapping) {
        const hostTargetId = Object.keys(service.targetMapping).find(
            hostId => service.targetMapping[hostId] === localTargetId
        );
        if (hostTargetId) {
            return hostTargetId;
        }
    }
    
    // Host sends their own ID, or client sends their ID if no mapping exists
    return localTargetId;
};

/**
 * Get the local target ID from a received message's target ID
 * For clients, this maps host target ID to local target ID
 * For hosts, this returns the target ID as-is
 * @param {CollaborationService} service - The collaboration service instance
 * @param {string} messageTargetId - The target ID from the message
 * @return {string|null} - The local target ID
 */
const getLocalTargetId = (service, messageTargetId) => {
    if (!messageTargetId) return null;
    
    // If we're a client, map host ID to our local ID
    if (!service.isHost && service.targetMapping) {
        const localId = service.targetMapping[messageTargetId];
        if (localId) {
            return localId;
        }
    }
    
    // Host uses received ID as-is, or client uses it if no mapping exists
    return messageTargetId;
};

export {
    getTargetIdForMessage,
    getLocalTargetId
};
