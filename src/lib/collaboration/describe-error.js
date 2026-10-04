/**
 * Turn a collaboration failure into something a person can act on. Used by
 * the collaboration container and window so every surface says the same.
 *
 * Codes come from the engine: a connect() rejection carries `collabCode`,
 * and the 'connection-failed' event carries `code`.
 */

import {defineMessages} from 'react-intl';

/* eslint-disable max-len */
const messages = defineMessages({
    roomNotFound: {
        defaultMessage: 'Nobody is hosting room "{roomId}" right now. Check the code, or ask the host for a new invite link.',
        description: 'Live collaboration error when nobody hosts the room. {roomId} is the room code.',
        id: 'mw.collaboration.error.roomNotFound'
    },
    roomNotFoundUnnamed: {
        defaultMessage: 'Nobody is hosting this room right now. Check the code, or ask the host for a new invite link.',
        description: 'Live collaboration error when nobody hosts the room and its code is unknown',
        id: 'mw.collaboration.error.roomNotFoundUnnamed'
    },
    roomTaken: {
        defaultMessage: 'The code for room "{roomId}" is already in use. Pick another code, or create a new room.',
        description: 'Live collaboration error when the room code to host is taken. {roomId} is the room code.',
        id: 'mw.collaboration.error.roomTaken'
    },
    roomTakenUnnamed: {
        defaultMessage: 'The code for this room is already in use. Pick another code, or create a new room.',
        description: 'Live collaboration error when the room code to host is taken and the code is unknown',
        id: 'mw.collaboration.error.roomTakenUnnamed'
    },
    serverUnreachable: {
        defaultMessage: 'Could not reach the collaboration server. Check your internet connection, then try again.',
        description: 'Live collaboration error when the collaboration server cannot be reached',
        id: 'mw.collaboration.error.serverUnreachable'
    },
    openTimeout: {
        defaultMessage: 'Could not finish opening the room. Check your internet connection, then try again.',
        description: 'Live collaboration error when opening (hosting) a room timed out',
        id: 'mw.collaboration.error.openTimeout'
    },
    dialTimeout: {
        defaultMessage: 'Could not connect to the host. One of your networks may be blocking the connection. Try again, or try a different network.',
        description: 'Live collaboration error when a guest could not connect to the host in time',
        id: 'mw.collaboration.error.dialTimeout'
    },
    noAnswer: {
        defaultMessage: 'The host did not answer. If this keeps happening, reload the page on both computers so you use the same version of MistWarp.',
        description: 'Live collaboration error when the host does not answer a join',
        id: 'mw.collaboration.error.noAnswer'
    },
    connectionLost: {
        defaultMessage: 'The connection to the live session was lost and could not be restored. Your copy of the project is still here.',
        description: 'Live collaboration error when the connection dropped and reconnecting failed',
        id: 'mw.collaboration.error.connectionLost'
    },
    snapshotFailed: {
        defaultMessage: 'The host\'s project could not be downloaded. Try joining again.',
        description: 'Live collaboration error when the host\'s project could not be downloaded',
        id: 'mw.collaboration.error.snapshotFailed'
    },
    assetFailed: {
        defaultMessage: 'A costume or sound from the host would not download. Try joining again.',
        description: 'Live collaboration error when a costume or sound could not be downloaded from the host',
        id: 'mw.collaboration.error.assetFailed'
    },
    hostGone: {
        defaultMessage: 'The host ended the live session. Your copy of the project is still here.',
        description: 'Live collaboration message when the host ended the session',
        id: 'mw.collaboration.error.hostGone'
    },
    generic: {
        defaultMessage: 'The live session connection failed. Check your internet connection and try again.',
        description: 'Live collaboration error for a failure without a more specific explanation',
        id: 'mw.collaboration.error.generic'
    }
});
/* eslint-enable max-len */

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
 * @returns {{message: object, values: object}|{text: string}} A message
 * descriptor and its values, or the engine's untranslated text.
 */
const describeCollabError = (code, fallback, {roomId, hosting} = {}) => {
    const named = (withRoom, withoutRoom) => (roomId ?
        {message: withRoom, values: {roomId}} :
        {message: withoutRoom, values: {}});
    switch (code) {
    case 'ROOM_NOT_FOUND':
        return named(messages.roomNotFound, messages.roomNotFoundUnnamed);
    case 'ROOM_TAKEN':
        return named(messages.roomTaken, messages.roomTakenUnnamed);
    case 'SERVER_UNREACHABLE':
        return {message: messages.serverUnreachable, values: {}};
    case 'DIAL_TIMEOUT':
        return {message: hosting ? messages.openTimeout : messages.dialTimeout, values: {}};
    case 'NO_ANSWER':
        return {message: messages.noAnswer, values: {}};
    case 'RECONNECT_FAILED':
    case 'CONNECTION_LOST':
        return {message: messages.connectionLost, values: {}};
    case 'SNAPSHOT_FAILED':
        return {message: messages.snapshotFailed, values: {}};
    case 'ASSET_FAILED':
        return {message: messages.assetFailed, values: {}};
    case 'HOST_GONE':
        return {message: messages.hostGone, values: {}};
    default:
        return fallback ? {text: fallback} : {message: messages.generic, values: {}};
    }
};

/**
 * describeCollabError, as text in the editor's language.
 * @param {object} intl The react-intl object.
 * @param {string|null} code The engine's error code.
 * @param {string} [fallback] The engine's own text, used for unknown codes.
 * @param {object} [context] See describeCollabError.
 * @returns {string} The message.
 */
const formatCollabError = (intl, code, fallback, context) => {
    const description = describeCollabError(code, fallback, context);
    return description.message ? intl.formatMessage(description.message, description.values) : description.text;
};

const isRetryableCollabError = code => RETRYABLE.has(code);

export {describeCollabError, formatCollabError, isRetryableCollabError};
