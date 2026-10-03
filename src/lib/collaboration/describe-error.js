/**
 * Turn a collaboration failure into something a person can act on. Used by
 * the collaboration container and window so every surface says the same.
 *
 * Codes come from the engine: a connect() rejection carries `collabCode`,
 * and the 'connection-failed' event carries `code`.
 */

// Failures where trying the same thing again can work.
const RETRYABLE = new Set([
    'RECONNECT_FAILED',
    'ROOM_NOT_FOUND',
    'DIAL_TIMEOUT',
    'SERVER_UNREACHABLE',
    'NO_ANSWER',
    'SNAPSHOT_FAILED',
    'ASSET_FAILED',
    'CONNECTION_LOST'
]);

/**
 * @param {string|null} code The engine's error code.
 * @param {string} [fallback] The engine's own text, used for unknown codes.
 * @param {object} [context] Context.
 * @param {string} [context.roomId] The room involved.
 * @param {boolean} [context.hosting] Whether we were creating/hosting the room.
 * @returns {string} The message.
 */
const describeCollabError = (code, fallback, {roomId, hosting} = {}) => {
    const room = roomId ? `room "${roomId}"` : 'this room';
    switch (code) {
    case 'ROOM_NOT_FOUND':
        return `Nobody is hosting ${room} right now. Check the code, or ask the host for a new invite link.`;
    case 'ROOM_TAKEN':
        return `The code for ${room} is already in use. Pick another code, or create a new room.`;
    case 'SERVER_UNREACHABLE':
        return 'Could not reach the collaboration server. Check your internet connection, then try again.';
    case 'DIAL_TIMEOUT':
        return hosting ?
            'Could not finish opening the room. Check your internet connection, then try again.' :
            'Could not connect to the host. One of your networks may be blocking the connection. ' +
            'Try again, or try a different network.';
    case 'NO_ANSWER':
        return 'The host did not answer. If this keeps happening, reload the page on both computers ' +
            'so you use the same version of MistWarp.';
    case 'RECONNECT_FAILED':
    case 'CONNECTION_LOST':
        return 'The connection to the live session was lost and could not be restored. ' +
            'Your copy of the project is still here.';
    case 'SNAPSHOT_FAILED':
        return "The host's project could not be downloaded. Try joining again.";
    case 'ASSET_FAILED':
        return 'A costume or sound from the host would not download. Try joining again.';
    case 'HOST_GONE':
        return 'The host ended the live session. Your copy of the project is still here.';
    default:
        return fallback || 'The live session connection failed. Check your internet connection and try again.';
    }
};

const isRetryableCollabError = code => RETRYABLE.has(code);

export {describeCollabError, isRetryableCollabError};
