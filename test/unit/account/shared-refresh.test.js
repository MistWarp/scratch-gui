import {webcrypto} from 'node:crypto';

if (!global.crypto || !global.crypto.subtle) {
    Object.defineProperty(global, 'crypto', {value: webcrypto, configurable: true});
}

jest.mock('../../../src/lib/account/origins.js', () => ({
    ACCOUNT_ORIGIN: 'http://localhost',
    EDITOR_ORIGIN: 'http://editor.localhost'
}));

const oauth = require('../../../src/lib/rotur/oauth.js');
const {sharedCredentials} = require('../../../src/lib/account/shared-credentials.js');

const KEY = 'mw:rotur-oauth';
const COOKIE = 'mw-rotur-oauth';

const cookieValue = () => {
    const part = document.cookie.split(';').map(item => item.trim())
        .find(item => item.startsWith(`${COOKIE}=`));
    return part ? JSON.parse(decodeURIComponent(part.slice(COOKIE.length + 1))) : null;
};

const tokenResponse = (body, ok = true, status = 200) => Promise.resolve({
    ok, status, json: () => Promise.resolve(body)
});

const session = (refreshToken, expiresAt) => JSON.stringify({
    accessToken: `at_${refreshToken}`, refreshToken, expiresAt, scopes: [], subject: 'u1', username: 'sam'
});

beforeEach(() => {
    localStorage.clear();
    for (const part of document.cookie.split(';')) {
        const name = part.split('=')[0].trim();
        if (name) document.cookie = `${name}=; Path=/; Max-Age=0`;
    }
    global.fetch = jest.fn();
});

test('a refresh that loses to the other partition waits for its token instead of signing out', async () => {
    sharedCredentials.setItem(KEY, session('rrt_old', Date.now() - 1));
    global.fetch.mockImplementation(() => {
        setTimeout(() => {
            const stamp = cookieValue().t + 1;
            document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify({
                v: session('rrt_frame', Date.now() + 3600000), t: stamp
            }))}; Path=/`;
        }, 400);
        return tokenResponse({error: 'invalid_grant'}, false, 400);
    });
    await expect(oauth.getAccessToken()).resolves.toBe('at_rrt_frame');
    expect(JSON.parse(localStorage.getItem(KEY)).refreshToken).toBe('rrt_frame');
    expect(global.fetch).toHaveBeenCalledTimes(1);
});

test('a refresh waits while the other partition holds the refresh lease', async () => {
    sharedCredentials.setItem(KEY, session('rrt_old', Date.now() - 1));
    document.cookie = `mw-lease-rotur-refresh=${encodeURIComponent(JSON.stringify({
        owner: 'frame', until: Date.now() + 10000
    }))}; Path=/`;
    setTimeout(() => {
        const stamp = cookieValue().t + 1;
        document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify({
            v: session('rrt_frame', Date.now() + 3600000), t: stamp
        }))}; Path=/`;
        document.cookie = 'mw-lease-rotur-refresh=; Path=/; Max-Age=0';
    }, 500);
    await expect(oauth.getAccessToken()).resolves.toBe('at_rrt_frame');
    expect(global.fetch).not.toHaveBeenCalled();
});

test('a refresh token that really was revoked still signs out everywhere', async () => {
    sharedCredentials.setItem(KEY, session('rrt_old', Date.now() - 1));
    global.fetch.mockReturnValue(tokenResponse({error: 'invalid_grant'}, false, 400));
    await expect(oauth.getAccessToken()).resolves.toBeNull();
    expect(cookieValue()).toEqual({v: null, t: expect.any(Number)});
}, 10000);
