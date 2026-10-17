import {chatValidatorKey, createFrameChat} from '../../../src/lib/account/frame-chat.js';

const NOW = 1792198695;
const NONCE = 'abc_def-ghi_jkl-mno_pqr-stuvwxyz';

const setup = ({loggedIn = true, scopes = true} = {}) => {
    const rotur = {
        loggedIn,
        validators: {generate: jest.fn(async key => ({validator: `v:${key.length}`}))}
    };
    const deps = {
        getRotur: () => rotur,
        ensureScopes: jest.fn(async () => scopes),
        signMessage: jest.fn(async ({timestamp}) => ({timestamp, author_id: 'u1', key_id: 'k1', signature: 'sig'})),
        now: () => NOW
    };
    return {chat: createFrameChat(deps), deps, rotur};
};

test('validators are only made for MistWarp and OriginChats chat servers', () => {
    for (const key of [
        `originChats-https://chats.mistwarp.org-${NONCE}`,
        `originChats-wss://dms.mistium.com-${NONCE}`,
        `originChats-wss://dms.originchats.com-${NONCE}`,
        `originChats-https://dms.originchats.com-${NONCE}`
    ]) {
        expect(chatValidatorKey(key)).toBe(true);
    }
    for (const key of [
        'originChats-https://chats.mistwarp.org-',
        'originChats-https://chats.mistwarp.org-abc',
        `originChats-https://chats.mistwarp.org.evil.example-${NONCE}`,
        `originChats-https://chats.mistwarp.org-evil.example-${NONCE}`,
        `originChats-wss://dms.mistium.com-evil.example-${NONCE}`,
        `originChats-https://chats.mistwarp.org-${NONCE.slice(0, 26)}%2F..%2F`,
        `originChats-https://chats.mistwarp.org-${NONCE}x`,
        `originChats-https://evil.example-${NONCE}`,
        `originChats-wss://chats.mistwarp.org-${NONCE}`,
        'warptheme',
        'mistwarp',
        `originChats-https://chats.mistwarp.org-${'a'.repeat(400)}`,
        null,
        {}
    ]) {
        expect(chatValidatorKey(key)).toBe(false);
    }
});

test('a chat validator comes from the account Rotur client', async () => {
    const {chat, rotur} = setup();
    const key = `originChats-https://chats.mistwarp.org-${NONCE}`;
    await expect(chat.validator({key})).resolves.toBe(`v:${key.length}`);
    expect(rotur.validators.generate).toHaveBeenCalledWith(key);
    await expect(chat.validator({key: 'warptheme'})).rejects.toThrow('cannot get a validator');
    expect(rotur.validators.generate).toHaveBeenCalledTimes(1);
});

test('a signed-out account says so instead of minting', async () => {
    const {chat, rotur} = setup({loggedIn: false});
    await expect(chat.validator({key: `originChats-https://chats.mistwarp.org-${NONCE}`}))
        .rejects.toMatchObject({code: 'signed_out'});
    await expect(chat.signingStatus()).resolves.toBe(false);
    expect(rotur.validators.generate).not.toHaveBeenCalled();
});

test('signing status follows the account scope', async () => {
    await expect(setup().chat.signingStatus()).resolves.toBe(true);
    await expect(setup({scopes: false}).chat.signingStatus()).resolves.toBe(false);
});

test('only current chat messages for known servers are signed', async () => {
    const {chat, deps} = setup();
    const message = {
        content: 'hello',
        attachments: [{id: 'a1', name: 'cat.png'}],
        timestamp: NOW + 2,
        signingUrl: 'https://chats.mistwarp.org'
    };
    await expect(chat.sign(message)).resolves.toMatchObject({signature: 'sig', timestamp: NOW + 2});
    expect(deps.signMessage).toHaveBeenCalledWith(message);
    await expect(chat.sign({...message, signingUrl: 'https://evil.example'})).rejects.toThrow('that service');
    await expect(chat.sign({...message, timestamp: NOW - 3600})).rejects.toMatchObject({code: 'signing_unavailable'});
    await expect(chat.sign({...message, timestamp: NOW + 3600})).rejects.toMatchObject({code: 'signing_unavailable'});
    await expect(chat.sign({...message, timestamp: NaN})).rejects.toThrow('not from now');
    await expect(chat.sign({...message, timestamp: 'now'})).rejects.toThrow('not from now');
    await expect(chat.sign({...message, content: 'x'.repeat(20001)})).rejects.toThrow('cannot be signed');
    await expect(chat.sign({...message, attachments: 'nope'})).rejects.toThrow('attachments');
    await expect(chat.sign({...message, attachments: new Array(21).fill({})})).rejects.toThrow('attachments');
    expect(deps.signMessage).toHaveBeenCalledTimes(1);
});

test('a refused or unsupported signing key tells the editor to send unsigned', async () => {
    const {chat, deps} = setup();
    const message = {content: 'hi', attachments: [], timestamp: NOW, signingUrl: 'https://chats.mistwarp.org'};
    deps.signMessage.mockRejectedValueOnce(Object.assign(new Error('no scope'), {signingUnavailable: true}));
    await expect(chat.sign(message)).rejects.toMatchObject({code: 'signing_unavailable'});
    deps.signMessage.mockRejectedValueOnce(Object.assign(new Error('no ed25519'), {name: 'NotSupportedError'}));
    await expect(chat.sign(message)).rejects.toMatchObject({code: 'signing_unavailable'});
    deps.signMessage.mockRejectedValueOnce(new Error('network'));
    await expect(chat.sign(message)).rejects.not.toMatchObject({code: 'signing_unavailable'});
});

test('editor code cannot flood Rotur through the chat requests', async () => {
    let now = NOW;
    const {rotur} = setup();
    const deps = {
        getRotur: () => rotur,
        ensureScopes: jest.fn(async () => true),
        signMessage: jest.fn(async () => ({signature: 'sig'})),
        now: () => now
    };
    const limited = createFrameChat(deps);
    const key = `originChats-https://chats.mistwarp.org-${NONCE}`;
    for (let i = 0; i < 20; i++) await limited.validator({key});
    await expect(limited.validator({key})).rejects.toMatchObject({code: 'rate_limited'});
    expect(rotur.validators.generate).toHaveBeenCalledTimes(20);
    for (let i = 0; i < 30; i++) await limited.signingStatus();
    await expect(limited.signingStatus()).rejects.toMatchObject({code: 'rate_limited'});
    const message = {content: 'hi', attachments: [], timestamp: NOW, signingUrl: 'https://chats.mistwarp.org'};
    for (let i = 0; i < 120; i++) await limited.sign(message);
    await expect(limited.sign(message)).rejects.toMatchObject({code: 'rate_limited'});
    expect(deps.signMessage).toHaveBeenCalledTimes(120);
    now += 61;
    await expect(limited.validator({key})).resolves.toBe(`v:${key.length}`);
    await expect(limited.sign({...message, timestamp: now})).resolves.toEqual({signature: 'sig'});
});
