import {ensureScopes, getRotur} from '../rotur/client.js';
import {signContent} from './device-key.js';

const SIGNING_SCOPE = 'signing:keys';
const SIGNING_CAPABILITY = 'message_signatures_v1';
const MESSAGE_CONTEXT = 'originchats.message.v1';
const SKEW_SECONDS = 300;

let nativeSupport = null;
const verifications = new Map();

const hasEd25519 = () => {
    if (!nativeSupport) {
        const subtle = typeof crypto !== 'undefined' && crypto.subtle;
        nativeSupport = subtle ?
            subtle.generateKey({name: 'Ed25519'}, false, ['sign', 'verify']).then(() => true, () => false) :
            Promise.resolve(false);
    }
    return nativeSupport;
};

const scopeGranted = () => (getRotur().loggedIn ? ensureScopes([SIGNING_SCOPE]) : Promise.resolve(false));

const signingStatus = async capabilities => {
    if (!Array.isArray(capabilities) || !capabilities.includes(SIGNING_CAPABILITY)) return 'off';
    if (!await hasEd25519()) return 'unsupported';
    return await scopeGranted() ? 'on' : 'needs_permission';
};

const requestSigningPermission = async () => {
    await ensureScopes([SIGNING_SCOPE], {prompt: true});
    return scopeGranted();
};

const messageSigningContent = (authorId, content, attachments, timestamp, signingUrl) => [
    MESSAGE_CONTEXT, authorId, content, attachments, timestamp, signingUrl
];

const signMessage = async ({content, attachments, timestamp, signingUrl}) => {
    if (!await scopeGranted()) {
        throw Object.assign(new Error('Message signing permission was not granted'), {signingUnavailable: true});
    }
    const proof = await signContent(authorId => messageSigningContent(
        authorId, content || '', attachments || [], timestamp, signingUrl
    ));
    return {timestamp, author_id: proof.author_id, key_id: proof.key_id, signature: proof.signature};
};

const verifyMessage = (message, signingUrl) => {
    if (!message || !message.signature || !message.key_id || !message.author_id) return Promise.resolve('unsigned');
    const signedAt = Number(message.signed_at);
    const sentAt = Number(message.edited_at || message.timestamp);
    if (!Number.isFinite(signedAt) || (Number.isFinite(sentAt) && Math.abs(sentAt - signedAt) > SKEW_SECONDS)) {
        return Promise.resolve('invalid');
    }
    const key = `${message.id}\0${message.signature}`;
    if (!verifications.has(key)) {
        const content = messageSigningContent(message.author_id, message.content || '',
            message.attachments || [], signedAt, signingUrl);
        verifications.set(key, hasEd25519()
            .then(supported => {
                if (!supported) return 'unavailable';
                return getRotur().signing.verify({
                    author_id: message.author_id,
                    key_id: message.key_id,
                    signature: message.signature,
                    username: message.user
                }, content)
                    .then(valid => (valid ? 'verified' : 'invalid'));
            })
            .catch(() => 'unavailable'));
    }
    return verifications.get(key);
};

export {
    SIGNING_CAPABILITY,
    messageSigningContent,
    requestSigningPermission,
    signMessage,
    signingStatus,
    verifyMessage
};
