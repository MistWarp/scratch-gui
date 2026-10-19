import {CHAT_URL, DMS_SIGNING_URLS} from '../originchats/links.js';

const CHAT_SERVERS = [CHAT_URL, ...DMS_SIGNING_URLS];
const KEY_NONCE = /^[A-Za-z0-9_-]{32}$/;
const MAX_CONTENT = 20000;
const MAX_ATTACHMENTS = 20;
const MAX_ATTACHMENTS_JSON = 20000;
const CLOCK_WINDOW = 900;
const RATE_WINDOW = 60;
const RATE_LIMITS = {
    validator: 20,
    signingStatus: 30,
    sign: 120
};

const chatValidatorKey = key => typeof key === 'string' &&
    CHAT_SERVERS.some(server => key.startsWith(`originChats-${server}-`) &&
        KEY_NONCE.test(key.slice(`originChats-${server}-`.length)));

const plainAttachments = attachments => {
    if (typeof attachments === 'undefined' || attachments === null) return [];
    if (!Array.isArray(attachments) || attachments.length > MAX_ATTACHMENTS) return null;
    let json;
    try {
        json = JSON.stringify(attachments);
    } catch (e) {
        return null;
    }
    if (json.length > MAX_ATTACHMENTS_JSON) return null;
    return JSON.parse(json);
};

const unavailable = message => Object.assign(new Error(message), {code: 'signing_unavailable'});

const createFrameChat = ({ensureScopes, getRotur, signMessage, now = () => Date.now() / 1000}) => {
    const recent = {validator: [], signingStatus: [], sign: []};

    const limit = action => {
        const at = now();
        const calls = recent[action].filter(time => at - time < RATE_WINDOW);
        if (calls.length >= RATE_LIMITS[action]) {
            recent[action] = calls;
            throw Object.assign(new Error('Too many chat requests. Wait a minute and try again.'),
                {code: 'rate_limited'});
        }
        calls.push(at);
        recent[action] = calls;
    };

    const signedIn = () => {
        if (!getRotur().loggedIn) {
            throw Object.assign(new Error('Sign in with Rotur to chat.'), {code: 'signed_out'});
        }
    };

    return {
        validator: async ({key}) => {
            if (!chatValidatorKey(key)) throw new Error('The editor cannot get a validator for that service');
            signedIn();
            limit('validator');
            await ensureScopes(['validators:generate']);
            const data = await getRotur().validators.generate(key);
            if (!data || !data.validator) {
                throw new Error((data && data.error) || 'Could not verify your Rotur account for chat.');
            }
            return String(data.validator);
        },
        signingStatus: async () => {
            if (!getRotur().loggedIn) return false;
            limit('signingStatus');
            return Boolean(await ensureScopes(['signing:keys']));
        },
        sign: async ({content, attachments, timestamp, signingUrl}) => {
            if (!CHAT_SERVERS.includes(signingUrl)) throw new Error('The editor cannot sign for that service');
            if (typeof content !== 'string' || content.length > MAX_CONTENT) {
                throw new Error('That message cannot be signed');
            }
            if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) {
                throw new Error('That message is not from now');
            }
            if (Math.abs(timestamp - now()) > CLOCK_WINDOW) {
                throw unavailable('This device clock is too far from the chat server to sign messages');
            }
            const cleanAttachments = plainAttachments(attachments);
            if (!cleanAttachments) throw new Error('Those attachments cannot be signed');
            signedIn();
            limit('sign');
            try {
                return await signMessage({content, attachments: cleanAttachments, timestamp, signingUrl});
            } catch (error) {
                if (error && (error.signingUnavailable ||
                    error.name === 'NotSupportedError' || error.name === 'DataError')) {
                    throw unavailable(error.message || 'Message signing is unavailable');
                }
                throw error;
            }
        }
    };
};

export {
    CHAT_SERVERS,
    chatValidatorKey,
    createFrameChat
};
