const CHANNEL = 'mw:account';
const FRAME_PATH = '/account-frame.html';
const CALL_TIMEOUT = 240000;
const CONNECT_TIMEOUT = 30000;
const PROMPT_LIFETIME = 210000;

const publicIdentity = state => {
    const user = state && state.user;
    return {
        status: state && state.status === 'restoring' ? 'restoring' : (user ? 'ready' : 'idle'),
        user: user ? {
            username: String(user.username || ''),
            id: user.id === null || typeof user.id === 'undefined' ? '' : String(user.id),
            bio: typeof user.bio === 'string' ? user.bio : null,
            ...(user.isStudent ? {
                isStudent: true,
                displayName: String(user.displayName || user.username || '')
            } : {})
        } : null,
        banMessage: state && state.banMessage ? String(state.banMessage) : null
    };
};

const toError = error => ({
    message: String((error && error.message) || error || 'The MistWarp account request failed').slice(0, 300),
    code: error && error.code ? String(error.code) : '',
    status: error && typeof error.status === 'number' ? error.status : 0
});

const fromError = data => {
    const error = new Error(data.message);
    if (data.code) error.code = data.code;
    if (data.status) error.status = data.status;
    return error;
};

export {
    CHANNEL,
    FRAME_PATH,
    CALL_TIMEOUT,
    CONNECT_TIMEOUT,
    PROMPT_LIFETIME,
    publicIdentity,
    toError,
    fromError
};
