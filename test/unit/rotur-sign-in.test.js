const mockOauth = {session: null, signIn: jest.fn()};
jest.mock('../../src/lib/rotur/oauth.js', () => ({
    readSession: () => mockOauth.session,
    getAccessToken: () => Promise.resolve(mockOauth.session && mockOauth.session.accessToken),
    signIn: (...args) => mockOauth.signIn(...args),
    signOut: jest.fn(() => {
        mockOauth.session = null;
    }),
    completeRedirect: () => Promise.resolve(null),
    onSessionChange: jest.fn()
}));
const mockRotur = {abilities: null, me: {'username': 'sam', 'sys.id': 'id-1'}};
jest.mock('rotur-sdk', () => ({
    Rotur: class {
        constructor () {
            this.token = null;
            this.socket = {};
            this.me = {
                get: jest.fn(() => Promise.resolve(mockRotur.me)),
                abilities: () => Promise.resolve(mockRotur.abilities)
            };
        }
        get loggedIn () {
            return Boolean(this.token);
        }
        setToken (token) {
            this.token = token;
        }
        logout () {
            this.token = null;
        }
    }
}));

const client = require('../../src/lib/rotur/client.js');

const signInWith = scopes => {
    mockOauth.signIn.mockImplementation(asked => {
        mockOauth.session = {accessToken: 'rotur_st_new', scopes: ['profile', ...(scopes || asked)], subject: 'id-1'};
        return Promise.resolve(mockOauth.session);
    });
};

beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    mockOauth.session = null;
    mockOauth.signIn.mockReset();
    mockRotur.abilities = null;
    mockRotur.me = {'username': 'sam', 'sys.id': 'id-1'};
});

test('signing in asks for nothing that spends credits, changes settings or reads secrets', async () => {
    signInWith();
    await client.login();
    const asked = mockOauth.signIn.mock.calls[0][0];
    for (const scope of [
        'credits:transfer', 'credits:manage', 'gifts:create', 'items:buy', 'cosmetics:buy', 'cosmetics:gift',
        'account:settings', 'signing:private', 'tokens:manage', 'account:delete', 'groups:manage', 'email'
    ]) {
        expect(asked).not.toContain(scope);
    }
    expect(asked).toEqual(expect.arrayContaining(['offline_access', 'account:view', 'notifications:view']));
    expect(new Set(asked).size).toBe(asked.length);
    // The sign-in buttons may fall back to a redirect.
    expect(mockOauth.signIn.mock.calls[0][1]).toEqual({redirectFallback: true});
});

test('someone on the old sign-in stays signed in and is offered a reconnect', async () => {
    localStorage.setItem('mw:rotur-token', 'rotur_legacy');
    await expect(client.restoreSession()).resolves.toMatchObject({username: 'sam', id: 'id-1'});
    expect(client.getRotur().token).toBe('rotur_legacy');
    expect(client.needsReconnect()).toBe(true);
    expect(client.accountKey()).toBe('rotur_legacy');
});

test('reconnecting replaces the old token with a Sign in with Rotur session', async () => {
    localStorage.setItem('mw:rotur-token', 'rotur_legacy');
    signInWith();
    await client.login();
    expect(localStorage.getItem('mw:rotur-token')).toBeNull();
    expect(client.getRotur().token).toBe('rotur_st_new');
    expect(client.needsReconnect()).toBe(false);
    expect(client.accountKey()).toBe('id-1');
    expect(JSON.stringify(sessionStorage)).not.toContain('rotur_st_new');
});

test('switching scopes off on the consent screen never nags or leaves the page', async () => {
    // They turned off groups on Rotur's consent screen.
    mockOauth.session = {accessToken: 'rotur_st_a', scopes: ['profile', 'account:view'], subject: 'id-1'};
    expect(client.needsReconnect()).toBe(false);
    await expect(client.ensureScopes(['groups:view'])).resolves.toBe(false);
    expect(mockOauth.signIn).not.toHaveBeenCalled();
    await expect(client.ensureScopes(['account:view'])).resolves.toBe(true);

    // A click can still ask, in a popup only.
    signInWith(['account:view', 'groups:view']);
    await expect(client.ensureScopes(['groups:view'], {prompt: true})).resolves.toBe(true);
    expect(mockOauth.signIn.mock.calls[0][0]).toEqual(expect.arrayContaining(['groups:view', 'account:view']));
    expect(mockOauth.signIn.mock.calls[0][1]).toEqual({redirectFallback: false});
});

test('the old sign-in reports the permissions its token really has', async () => {
    localStorage.setItem('mw:rotur-token', 'rotur_legacy');
    await client.restoreSession();
    mockRotur.abilities = {token_type: 'sub', permissions: ['account:view', 'credits:view']};
    await expect(client.ensureScopes(['credits:view'])).resolves.toBe(true);
    await expect(client.ensureScopes(['signing:private'])).resolves.toBe(false);
    mockRotur.abilities = {token_type: 'main', permissions: []};
    await expect(client.ensureScopes(['signing:private'])).resolves.toBe(true);
});

test('the cached profile only counts for the account it was saved for', async () => {
    mockOauth.session = {accessToken: 'rotur_st_a', scopes: ['profile'], subject: 'id-1'};
    await expect(client.restoreSession()).resolves.toMatchObject({username: 'sam'});
    // Another tab switched account.
    mockOauth.session = {accessToken: 'rotur_st_b', scopes: ['profile'], subject: 'id-2'};
    mockRotur.me = {'username': 'kit', 'sys.id': 'id-2'};
    await expect(client.restoreSession()).resolves.toMatchObject({username: 'kit', id: 'id-2'});
});
