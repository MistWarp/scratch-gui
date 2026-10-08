import {signingBytes} from 'rotur-sdk';
import {accountKey, fetchCurrentUser, getAccessToken, getRotur} from '../rotur/client.js';

const DATABASE = 'mw:chat-signing';
const STORE = 'keys';
let identity = null;
const refused = new Set();

const base64url = buffer => btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/[=]+$/, '');

// IndexedDB can keep a non-exportable CryptoKey through a reload. Storage
// failures leave the key usable in memory for the rest of this page's life.
const storedKey = (user, value) => new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Signing key storage is blocked'));
    request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => db.close();
        let transaction;
        try {
            transaction = db.transaction(STORE, value ? 'readwrite' : 'readonly');
            const store = transaction.objectStore(STORE);
            const operation = value ? store.put(value, user) : store.get(user);
            transaction.oncomplete = () => {
                db.close();
                resolve(operation.result);
            };
            transaction.onabort = transaction.onerror = () => {
                db.close();
                reject(transaction.error || new Error('Could not store signing key'));
            };
        } catch (error) {
            db.close();
            reject(error);
        }
    };
});

const checkAccount = account => {
    if (!account || accountKey() !== account || !getRotur().loggedIn) {
        throw new Error('The Rotur account changed while signing');
    }
};

const stillServed = key => getRotur().signing.publicKey({user_id: key.userId, key_id: key.keyId}, true)
    .then(() => true, error => !error || error.status !== 404);

const registerKey = async account => {
    const pair = await crypto.subtle.generateKey({name: 'Ed25519'}, false, ['sign', 'verify']);
    const publicKey = await crypto.subtle.exportKey('raw', pair.publicKey);
    const token = await getAccessToken();
    checkAccount(account);
    if (!token) throw new Error('Sign in to Rotur first');
    const response = await fetch('https://api.rotur.dev/v2/me/signing-keys', {
        method: 'POST',
        headers: {'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json'},
        body: JSON.stringify({public_key: base64url(publicKey), name: 'MistWarp'})
    });
    const record = await response.json().catch(() => ({}));
    checkAccount(account);
    if (!response.ok) {
        const error = new Error(record.error || `Signing key registration failed (${response.status})`);
        if (response.status === 400 || response.status === 403 || response.status === 409) {
            refused.add(account);
            error.signingUnavailable = true;
        }
        throw error;
    }
    if (!record.user_id || !record.key_id) throw new Error('Rotur returned an incomplete signing key');
    return {userId: record.user_id, keyId: record.key_id, privateKey: pair.privateKey};
};

const loadKey = account => {
    if (refused.has(account)) {
        throw Object.assign(new Error('Rotur refused the signing key'), {signingUnavailable: true});
    }
    if (!identity || identity.account !== account) {
        const key = Promise.resolve().then(async () => {
            const user = await fetchCurrentUser();
            checkAccount(account);
            if (!user) throw new Error('Could not read the Rotur account');
            const storeKey = user.id || user.username.toLowerCase();
            const saved = await storedKey(storeKey).catch(() => null);
            if (saved && saved.privateKey && !saved.privateKey.extractable &&
                (!user.id || saved.userId === user.id) && await stillServed(saved)) return saved;
            checkAccount(account);
            const made = await registerKey(account);
            if (user.id && made.userId !== user.id) throw new Error('Signing key account mismatch');
            await storedKey(storeKey, made).catch(() => {});
            return made;
        });
        identity = {account, key};
        key.catch(() => {
            if (identity && identity.key === key) identity = null;
        });
    }
    return identity.key;
};

const signContent = async content => {
    const account = accountKey();
    checkAccount(account);
    const key = await loadKey(account);
    checkAccount(account);
    const signature = await crypto.subtle.sign('Ed25519', key.privateKey, signingBytes(content(key.userId)));
    checkAccount(account);
    return {author_id: key.userId, key_id: key.keyId, signature: base64url(signature)};
};

export {signContent};
