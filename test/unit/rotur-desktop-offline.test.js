// The desktop app is offline first: with window.EditorPreload there, nothing
// signs in to Rotur or reaches api.rotur.dev, even with a session stored from
// before.
const roturRequests = [];
const sockets = [];

beforeAll(() => {
    window.EditorPreload = {};
    global.fetch = jest.fn(url => {
        roturRequests.push(String(url));
        return Promise.reject(new Error('offline'));
    });
    global.WebSocket = jest.fn(url => {
        sockets.push(String(url));
    });
    localStorage.setItem('mw:rotur-oauth', JSON.stringify({
        accessToken: 'rotur_st_old',
        refreshToken: 'rrt_old',
        subject: 'id-1',
        username: 'sam',
        scopes: ['profile'],
        expiresAt: Date.now() - 1000
    }));
    localStorage.setItem('mw:rotur-token', 'rotur_legacy');
});

afterAll(() => {
    delete window.EditorPreload;
});

const load = () => ({
    availability: require('../../src/lib/rotur/availability.js'),
    client: require('../../src/lib/rotur/client.js'),
    identity: require('../../src/lib/rotur/identity.js'),
    host: require('../../src/containers/rotur-extension-host.jsx')
});

test('desktop has no Rotur', () => {
    expect(load().availability.hasRotur()).toBe(false);
});

test('a stored session or old token is not restored, and nothing offers to reconnect', async () => {
    const {client, identity} = load();
    await expect(client.getAccessToken()).resolves.toBe(null);
    await expect(client.restoreSession()).resolves.toBe(null);
    await identity.restore();
    expect(identity.getState().user).toBe(null);
    await expect(identity.ensureMistSession()).resolves.toBe(null);
    expect(client.isLoggedIn()).toBe(false);
    expect(client.needsReconnect()).toBe(false);
});

test('signing in and asking for permissions fail with a clear error', async () => {
    const {client} = load();
    await expect(client.login()).rejects.toMatchObject({code: 'rotur_offline'});
    await expect(client.ensureScopes(['posts:view'], {prompt: true})).resolves.toBe(false);
});

test('projects get "not available offline" from the Rotur bridge', async () => {
    const {RoturExtensionHost} = load().host;
    const host = new RoturExtensionHost({vm: {runtime: {_mwProjectTrusted: true}}, projectTitle: 'Game'});
    host.acquireModalLock = jest.fn();
    await expect(host.call('profiles.get', ['sam'])).rejects.toThrow('desktop app');
    await expect(host.ensureConsent(['posts:create'])).rejects.toThrow('desktop app');
    expect(host.acquireModalLock).not.toHaveBeenCalled();
});

test('nothing reached Rotur', () => {
    expect(roturRequests.filter(url => url.includes('rotur.dev'))).toEqual([]);
    expect(sockets).toEqual([]);
});
