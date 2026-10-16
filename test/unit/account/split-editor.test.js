jest.mock('../../../src/lib/account/origins.js', () => ({
    ACCOUNT_ORIGIN: 'https://mistwarp.org',
    EDITOR_ORIGIN: 'https://editor.mistwarp.org',
    isSplitEditor: () => true,
    isEditorOrigin: origin => origin === 'https://editor.mistwarp.org'
}));

const mockIdentityListeners = new Set();
let mockIdentity = {status: 'ready', user: {username: 'mist', id: 'u1', bio: null}, banMessage: null};
const mockCall = jest.fn();
let mockTokens = 0;
jest.mock('../../../src/lib/account/bridge.js', () => ({
    connect: jest.fn(() => Promise.resolve()),
    call: (...args) => mockCall(...args),
    getIdentity: () => mockIdentity,
    subscribeIdentity: listener => {
        mockIdentityListeners.add(listener);
        return () => mockIdentityListeners.delete(listener);
    },
    subscribeEvents: () => () => {}
}));

const identity = require('../../../src/lib/rotur/identity.js');
const {request, loadSession} = require('../../../src/lib/community/api.js');
const {isLoggedIn, getAccessToken, accountKey} = require('../../../src/lib/rotur/client.js');

beforeEach(() => {
    localStorage.clear();
    mockCall.mockReset();
    mockCall.mockImplementation(async method => {
        if (method === 'editorSession') {
            mockTokens += 1;
            return {token: `editor-${mockTokens}`, expiresAt: Date.now() + 3600000};
        }
        if (method === 'signOut') return {status: 'idle', user: null};
        return null;
    });
});

test('restoring the split editor uses the account frame and never stores credentials', async () => {
    const user = await identity.restore();
    expect(user).toMatchObject({username: 'mist', id: 'u1', avatarUrl: expect.stringContaining('mist')});
    expect(loadSession()).toMatch(/^editor-\d+$/);
    expect(isLoggedIn()).toBe(true);
    await expect(getAccessToken()).resolves.toBeNull();
    expect(accountKey()).toBe('u1');
    expect(localStorage.getItem('mw:mistwarp-session')).toBeNull();
    expect(localStorage.getItem('mw:rotur-oauth')).toBeNull();
    expect(localStorage.getItem('mw:rotur-token')).toBeNull();
});

test('a rejected editor token is replaced through the account frame once', async () => {
    await identity.restore();
    const auth = [];
    window.fetch = jest.fn((url, options) => {
        auth.push(options.headers.Authorization);
        return Promise.resolve(auth.length === 1 ?
            {ok: false, status: 401, json: () => Promise.resolve({error: 'not authenticated'})} :
            {ok: true, status: 200, json: () => Promise.resolve({ok: true, value: 1})});
    });
    await expect(request('/me/quota', {cache: false})).resolves.toMatchObject({value: 1});
    expect(auth).toEqual([expect.stringMatching(/^Bearer editor-/), expect.stringMatching(/^Bearer editor-/)]);
    expect(auth[0]).not.toBe(auth[1]);
});

test('signing out asks the account frame and clears the editor token', async () => {
    await identity.restore();
    identity.logout();
    expect(mockCall).toHaveBeenCalledWith('signOut');
    expect(identity.getState().user).toBeNull();
    expect(loadSession()).toBeNull();
});

test('signing out elsewhere reaches the editor', async () => {
    await identity.restore();
    mockIdentity = {status: 'idle', user: null, banMessage: null};
    for (const listener of mockIdentityListeners) listener(mockIdentity);
    expect(identity.getState().user).toBeNull();
    expect(loadSession()).toBeNull();
    mockIdentity = {status: 'ready', user: {username: 'mist', id: 'u1', bio: null}, banMessage: null};
});
