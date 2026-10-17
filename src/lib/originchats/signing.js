import {ensureScopes, getRotur} from '../rotur/client.js';
import {isCancelled} from '../rotur/oauth.js';
import {signContent} from './device-key.js';
import {ACCOUNT_ORIGIN, isSplitEditor} from '../account/origins.js';
import {FRAME_PATH} from '../account/protocol.js';
import * as accountBridge from '../account/bridge.js';

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

const scopeGranted = () => {
    if (isSplitEditor()) {
        return accountBridge.call('chat', {action: 'signingStatus'}).then(Boolean, () => false);
    }
    return getRotur().loggedIn ? ensureScopes([SIGNING_SCOPE]) : Promise.resolve(false);
};

const GRANT_WINDOW = 'mw-account-grant';

const requestSplitPermission = () => new Promise((resolve, reject) => {
    const left = Math.max(0, (screen.width - 480) / 2);
    const top = Math.max(0, (screen.height - 640) / 2);
    const popup = window.open(`${ACCOUNT_ORIGIN}${FRAME_PATH}?grant=signing`, GRANT_WINDOW,
        `popup,width=480,height=640,left=${left},top=${top}`);
    if (!popup) {
        reject(new Error('Allow pop-ups for this site, then try again.'));
        return;
    }
    const watch = setInterval(() => {
        if (!popup.closed) return;
        clearInterval(watch);
        resolve();
    }, 500);
});

const signingStatus = async capabilities => {
    if (!Array.isArray(capabilities) || !capabilities.includes(SIGNING_CAPABILITY)) return 'off';
    if (!await hasEd25519()) return 'unsupported';
    return await scopeGranted() ? 'on' : 'needs_permission';
};

const requestSigningPermission = async () => {
    if (isSplitEditor()) {
        await requestSplitPermission();
        return scopeGranted();
    }
    try {
        await ensureScopes([SIGNING_SCOPE], {prompt: true});
    } catch (error) {
        if (!isCancelled(error)) throw error;
    }
    return scopeGranted();
};

const messageSigningContent = (authorId, content, attachments, timestamp, signingUrl) => [
    MESSAGE_CONTEXT, authorId, content, attachments, timestamp, signingUrl
];

const signMessage = async ({content, attachments, timestamp, signingUrl}) => {
    if (isSplitEditor()) {
        return accountBridge.call('chat', {
            action: 'sign',
            content: content || '',
            attachments: attachments || [],
            timestamp,
            signingUrl
        }).catch(error => {
            if (error && error.code === 'signing_unavailable') error.signingUnavailable = true;
            throw error;
        });
    }
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
            .catch(() => {
                verifications.delete(key);
                return 'unavailable';
            }));
        if (verifications.size > 500) verifications.delete(verifications.keys().next().value);
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
