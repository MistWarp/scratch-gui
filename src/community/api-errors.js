import {formatCommunityMessage} from './locale.js';

// Friendly, translated messages for MistWarp API failures. The API layer lives
// outside the React tree, so it formats through the active community locale
// instead of the i18n hook; the extractor still sees these source strings.

const GENERIC_SERVER_TEXT = new RegExp(
    '^(bad request|unauthori[sz]ed|forbidden|not found|method not allowed|conflict|gone|' +
    'unprocessable entity|too many requests|internal server error|bad gateway|service unavailable|' +
    'gateway timeout|error|unknown error|request failed.*|failed to fetch|load failed|' +
    'networkerror when attempting to fetch resource|network error.*)\\.?$',
    'i'
);

// A server's own sentence ("That username is taken.") says more than a status
// class, but codes, reason phrases and internals don't belong on screen.
const isHumanMessage = text => {
    if (typeof text !== 'string') return false;
    const value = text.trim();
    if (value.length < 3 || value.length > 300) return false;
    if (!/\s/.test(value)) return false;
    if (GENERIC_SERVER_TEXT.test(value)) return false;
    if (/\b[A-Z0-9]+_[A-Z0-9_]+\b|<\/?[a-z]|\bat \S+:\d+/.test(value)) return false;
    return true;
};

const timeoutMessage = () => formatCommunityMessage('This is taking too long. Try again.');
const networkMessage = () => formatCommunityMessage('Can\'t reach MistWarp. Check your connection.');

const statusMessage = status => {
    if (status === 401) return formatCommunityMessage('Sign in to continue');
    if (status === 403) return formatCommunityMessage('You don\'t have permission to do that.');
    if (status === 404) return formatCommunityMessage('We couldn\'t find that.');
    if (status === 429) return formatCommunityMessage('Too many requests – try again in a moment.');
    if (status >= 500) return formatCommunityMessage('MistWarp is having trouble right now. Try again in a moment.');
    return formatCommunityMessage('Something went wrong.');
};

// The message to show for a failed response: the server's own sentence when it
// sent one, otherwise one for the status class. Server errors never show their
// text, which tends to be internal detail.
const responseMessage = (status, serverMessage) => (
    status < 500 && isHumanMessage(serverMessage) ? serverMessage.trim() : statusMessage(status)
);

const isNetworkFailure = error => error instanceof TypeError ||
    /^(failed to fetch|load failed|networkerror when attempting to fetch resource|network error)/i
        .test(String(error && error.message));

const isAbort = error => Boolean(error) && (error.name === 'AbortError' || error.name === 'TimeoutError');

/**
 * Build the error the API layer throws, with a friendly message and the
 * response details kept for callers that branch on them.
 * @param {object} details - status, code, server message, response data and cause.
 * @returns {Error} An error whose message is ready to show.
 */
const createApiError = ({status = 0, code, serverMessage, data, cause, message} = {}) => {
    const error = new Error(message || responseMessage(status, serverMessage));
    error.status = status;
    if (code) error.code = code;
    if (typeof serverMessage === 'string') error.serverMessage = serverMessage;
    if (data) error.data = data;
    if (cause) error.cause = cause;
    error.friendly = true;
    return error;
};

const createNetworkError = cause => createApiError({code: 'network', cause, message: networkMessage()});
const createTimeoutError = cause => createApiError({code: 'timeout', cause, message: timeoutMessage()});

/**
 * The message to show for any error a community request can throw.
 * @param {*} error - What a request rejected with.
 * @param {string} [fallback] - Shown when the error has nothing better to say.
 * @returns {string} A message for people, never a raw browser or HTTP string.
 */
const friendlyError = (error, fallback) => {
    if (!error) return fallback || statusMessage(0);
    if (typeof error === 'string') return isHumanMessage(error) ? error : (fallback || statusMessage(0));
    if (error.friendly && error.message) return error.message;
    if (error.code === 'timeout' || isAbort(error)) return timeoutMessage();
    if (error.status) return responseMessage(error.status, error.serverMessage || error.message);
    if (isNetworkFailure(error)) return networkMessage();
    if (isHumanMessage(error.message)) return error.message;
    return fallback || statusMessage(0);
};

export {
    createApiError,
    createNetworkError,
    createTimeoutError,
    friendlyError,
    isHumanMessage,
    responseMessage
};
