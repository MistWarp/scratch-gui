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
jest.mock('rotur-sdk', () => ({
    Rotur: class {
        constructor () {
            this.token = null;
            this.socket = {};
            this.me = {get: () => Promise.resolve({'username': 'sam', 'sys.id': 'id-1'})};
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

beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    mockOauth.session = null;
    mockOauth.signIn.mockReset();
});

test('signing in asks for nothing that spends credits, changes settings or reads secrets', () => {
    for (const scope of [
        'credits:transfer', 'credits:manage', 'gifts:create', 'items:buy', 'cosmetics:buy', 'cosmetics:gift',
        'account:settings', 'signing:private', 'tokens:manage', 'account:delete', 'groups:manage', 'email'
    ]) {
        expect(client.SIGN_IN_SCOPES).not.toContain(scope);
    }
    expect(client.SIGN_IN_SCOPES).toEqual(expect.arrayContaining([
        'offline_access', 'validators:generate', 'account:view', 'notifications:view', 'credits:view'
    ]));
    expect(new Set(client.SIGN_IN_SCOPES).size).toBe(client.SIGN_IN_SCOPES.length);
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
    mockOauth.signIn.mockImplementation(scopes => {
        mockOauth.session = {accessToken: 'rotur_st_new', scopes: ['profile', ...scopes], subject: 'id-1'};
        return Promise.resolve(mockOauth.session);
    });
    await client.login();
    expect(mockOauth.signIn).toHaveBeenCalledWith(client.SIGN_IN_SCOPES);
    expect(localStorage.getItem('mw:rotur-token')).toBeNull();
    expect(client.getRotur().token).toBe('rotur_st_new');
    expect(client.needsReconnect()).toBe(false);
    expect(client.accountKey()).toBe('id-1');
    expect(JSON.stringify(sessionStorage)).not.toContain('rotur_st_new');
});

test('extra permissions are only asked for when the session lacks them', async () => {
    mockOauth.session = {accessToken: 'rotur_st_a', scopes: ['profile', ...client.SIGN_IN_SCOPES], subject: 'id-1'};
    await expect(client.ensureScopes(['account:view'])).resolves.toBe(true);
    expect(mockOauth.signIn).not.toHaveBeenCalled();

    mockOauth.signIn.mockImplementation(scopes => {
        mockOauth.session = {accessToken: 'rotur_st_b', scopes: ['profile', ...scopes], subject: 'id-1'};
        return Promise.resolve(mockOauth.session);
    });
    await expect(client.ensureScopes(['signing:private'])).resolves.toBe(true);
    expect(mockOauth.signIn.mock.calls[0][0]).toEqual(expect.arrayContaining(['signing:private', 'account:view']));
});
