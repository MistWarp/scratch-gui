/** @jest-environment node */
import {webcrypto} from 'crypto';
import {IDBFactory} from 'fake-indexeddb';
import {signingBytes} from 'rotur-sdk';

const mockClient = {
    account: 'alice-id',
    token: 'alice-token',
    loggedIn: true,
    allowed: true,
    signing: {publicKey: jest.fn(), sign: jest.fn(), privateKey: jest.fn()}
};
const mockEnsureScopes = jest.fn(() => Promise.resolve(mockClient.allowed));
jest.mock('../../src/lib/rotur/client.js', () => ({
    accountKey: () => mockClient.account,
    getAccessToken: () => Promise.resolve(mockClient.token),
    getRotur: () => mockClient,
    fetchCurrentUser: () => Promise.resolve({id: mockClient.account, username: mockClient.account}),
    ensureScopes: (...args) => mockEnsureScopes(...args)
}));

const registered = [];
const message = {content: 'hello', attachments: [{url: 'https://example.com/a'}], timestamp: 1234,
    signingUrl: 'https://chats.mistwarp.org'};
const loadSigning = () => require('../../src/lib/originchats/signing.js');

beforeEach(() => {
    jest.resetModules();
    global.crypto = webcrypto;
    global.indexedDB = new IDBFactory();
    mockClient.account = 'alice-id';
    mockClient.token = 'alice-token';
    mockClient.loggedIn = true;
    mockClient.allowed = true;
    mockEnsureScopes.mockClear();
    mockClient.signing.publicKey.mockReset();
    mockClient.signing.publicKey.mockResolvedValue({});
    registered.length = 0;
    global.fetch = jest.fn(async (url, init) => {
        registered.push(JSON.parse(init.body));
        return {ok: true, status: 201, json: async () => ({user_id: mockClient.account, key_id: `key-${registered.length}`})};
    });
});

test('signs the canonical message with a non-exportable device key and registers only its public half', async () => {
    const {signMessage, messageSigningContent} = loadSigning();
    const [first, second] = await Promise.all([signMessage(message), signMessage({...message, content: 'again'})]);
    expect(first).toMatchObject({timestamp: 1234, author_id: 'alice-id', key_id: 'key-1'});
    expect(second.key_id).toBe(first.key_id);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('https://api.rotur.dev/v2/me/signing-keys', expect.objectContaining({
        headers: {Authorization: 'Bearer alice-token', 'Content-Type': 'application/json'}
    }));
    expect(Object.keys(registered[0]).sort()).toEqual(['name', 'public_key']);
    const publicKey = await crypto.subtle.importKey('raw', Buffer.from(registered[0].public_key, 'base64url'),
        'Ed25519', false, ['verify']);
    const content = messageSigningContent('alice-id', message.content, message.attachments, 1234, message.signingUrl);
    await expect(crypto.subtle.verify('Ed25519', publicKey, Buffer.from(first.signature, 'base64url'),
        signingBytes(content))).resolves.toBe(true);
    content[2] = 'tampered';
    await expect(crypto.subtle.verify('Ed25519', publicKey, Buffer.from(first.signature, 'base64url'),
        signingBytes(content))).resolves.toBe(false);
    const db = await new Promise(resolve => {
        const request = indexedDB.open('mw:chat-signing', 1);
        request.onsuccess = () => resolve(request.result);
    });
    const saved = await new Promise(resolve => {
        const request = db.transaction('keys').objectStore('keys').get('alice-id');
        request.onsuccess = () => resolve(request.result);
    });
    db.close();
    expect(saved.privateKey.extractable).toBe(false);
    await expect(crypto.subtle.exportKey('jwk', saved.privateKey)).rejects.toThrow();
    expect(mockClient.signing.sign).not.toHaveBeenCalled();
    expect(mockClient.signing.privateKey).not.toHaveBeenCalled();
});

test('reuses the stored key after a reload and token refresh, and separates accounts', async () => {
    const first = await loadSigning().signMessage(message);
    jest.resetModules();
    mockClient.token = 'refreshed-token';
    expect((await loadSigning().signMessage(message)).key_id).toBe(first.key_id);
    expect(registered).toHaveLength(1);
    expect(mockClient.signing.publicKey).toHaveBeenCalledWith({user_id: 'alice-id', key_id: 'key-1'}, true);
    mockClient.account = 'bob-id';
    mockClient.token = 'bob-token';
    await expect(loadSigning().signMessage(message)).resolves.toMatchObject({author_id: 'bob-id', key_id: 'key-2'});
    mockClient.account = 'alice-id';
    expect((await loadSigning().signMessage(message)).key_id).toBe(first.key_id);
    expect(registered).toHaveLength(2);
});

test('replaces a revoked saved key', async () => {
    await loadSigning().signMessage(message);
    jest.resetModules();
    mockClient.signing.publicKey.mockRejectedValueOnce(Object.assign(new Error('Revoked'), {status: 404}));
    await expect(loadSigning().signMessage(message)).resolves.toMatchObject({key_id: 'key-2'});
});

test('keeps signing in memory when storage is unavailable', async () => {
    delete global.indexedDB;
    const {signMessage} = loadSigning();
    await signMessage(message);
    await signMessage(message);
    expect(fetch).toHaveBeenCalledTimes(1);
});

test('stops registering after a refusal', async () => {
    fetch.mockResolvedValue({ok: false, status: 403, json: async () => ({error: 'Not allowed'})});
    const {signMessage} = loadSigning();
    await expect(signMessage(message)).rejects.toMatchObject({signingUnavailable: true});
    await expect(signMessage(message)).rejects.toMatchObject({signingUnavailable: true});
    expect(fetch).toHaveBeenCalledTimes(1);
});

test('discards a signing result if the account changes during registration', async () => {
    fetch.mockImplementation(async () => {
        mockClient.account = 'bob-id';
        return {ok: true, json: async () => ({user_id: 'alice-id', key_id: 'key-1'})};
    });
    await expect(loadSigning().signMessage(message)).rejects.toThrow('account changed');
});

test('stops using a cached device key when signing consent is removed', async () => {
    const {signMessage} = loadSigning();
    await signMessage(message);
    mockClient.allowed = false;
    await expect(signMessage(message)).rejects.toMatchObject({signingUnavailable: true});
    expect(fetch).toHaveBeenCalledTimes(1);
});

test('checks signing:keys without prompting and requests it only on a click', async () => {
    const {signingStatus, requestSigningPermission} = loadSigning();
    mockClient.allowed = false;
    await expect(signingStatus(['message_signatures_v1'])).resolves.toBe('needs_permission');
    expect(mockEnsureScopes).toHaveBeenLastCalledWith(['signing:keys']);
    mockClient.allowed = true;
    await expect(requestSigningPermission()).resolves.toBe(true);
    expect(mockEnsureScopes).toHaveBeenCalledWith(['signing:keys'], {prompt: true});
    mockClient.allowed = false;
    await expect(signingStatus(['message_signatures_v1'])).resolves.toBe('needs_permission');
    await expect(signingStatus([])).resolves.toBe('off');
});
