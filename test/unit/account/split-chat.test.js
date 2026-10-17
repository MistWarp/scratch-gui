jest.mock('../../../src/lib/account/origins.js', () => ({
    ACCOUNT_ORIGIN: 'https://mistwarp.org',
    EDITOR_ORIGIN: 'https://editor.mistwarp.org',
    isSplitEditor: () => true,
    isEditorOrigin: () => true
}));

const mockCall = jest.fn();
jest.mock('../../../src/lib/account/bridge.js', () => ({
    connect: jest.fn(() => Promise.resolve()),
    call: (...args) => mockCall(...args),
    getIdentity: () => ({status: 'ready', user: {username: 'mist', id: 'u1'}}),
    subscribeIdentity: () => () => {}
}));

const {requestSigningPermission, signMessage, signingStatus} = require('../../../src/lib/originchats/signing.js');

beforeEach(() => {
    mockCall.mockReset();
});

test('the split editor signs chat messages through the account frame', async () => {
    mockCall.mockResolvedValue({timestamp: 5, author_id: 'u1', key_id: 'k', signature: 's'});
    await expect(signMessage({content: 'hi', timestamp: 5, signingUrl: 'https://chats.mistwarp.org'}))
        .resolves.toEqual({timestamp: 5, author_id: 'u1', key_id: 'k', signature: 's'});
    expect(mockCall).toHaveBeenCalledWith('chat', {
        action: 'sign',
        content: 'hi',
        attachments: [],
        timestamp: 5,
        signingUrl: 'https://chats.mistwarp.org'
    });
});

test('the split editor reads signing permission from the account frame', async () => {
    mockCall.mockResolvedValue(true);
    await expect(signingStatus(['message_signatures_v1'])).resolves.not.toBe('off');
    mockCall.mockRejectedValue(new Error('bridge down'));
    await expect(signingStatus(['message_signatures_v1'])).resolves.not.toBe('on');
});

test('a signing key the account cannot use sends the message unsigned', async () => {
    mockCall.mockRejectedValue(Object.assign(new Error('no scope'), {code: 'signing_unavailable'}));
    await expect(signMessage({content: 'hi', timestamp: 5, signingUrl: 'https://chats.mistwarp.org'}))
        .rejects.toMatchObject({signingUnavailable: true});
    mockCall.mockRejectedValue(Object.assign(new Error('bridge'), {code: 'bridge'}));
    await expect(signMessage({content: 'hi', timestamp: 5, signingUrl: 'https://chats.mistwarp.org'}))
        .rejects.not.toMatchObject({signingUnavailable: true});
});

test('asking for signing opens the MistWarp grant window and fails when pop-ups are blocked', async () => {
    const open = jest.spyOn(window, 'open').mockReturnValue(null);
    await expect(requestSigningPermission()).rejects.toThrow('pop-ups');
    expect(open).toHaveBeenCalledWith('https://mistwarp.org/account-frame.html?grant=signing',
        'mw-account-grant', expect.stringContaining('popup'));
    jest.useFakeTimers();
    const popup = {closed: false};
    open.mockReturnValue(popup);
    mockCall.mockResolvedValue(true);
    const asked = requestSigningPermission();
    popup.closed = true;
    jest.advanceTimersByTime(600);
    jest.useRealTimers();
    await expect(asked).resolves.toBe(true);
    expect(mockCall).toHaveBeenCalledWith('chat', {action: 'signingStatus'});
    open.mockRestore();
});
