import {webcrypto} from 'node:crypto';
import {TextEncoder} from 'node:util';

if (!global.crypto || !global.crypto.subtle) {
    Object.defineProperty(global, 'crypto', {value: webcrypto, configurable: true});
}
if (!global.TextEncoder) global.TextEncoder = TextEncoder;

const oauth = require('../../src/lib/rotur/oauth.js');

// Wait for a condition rather than a number of ticks: PKCE hashing and fetches
// settle on their own schedule.
const waitFor = async check => {
    for (let i = 0; i < 400; i++) {
        if (check()) return;
        await new Promise(resolve => setTimeout(resolve, 5));
    }
    throw new Error('timed out waiting');
};

const tokenResponse = (body, ok = true, status = 200) => Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body)
});

// The token endpoint, then /oauth/userinfo, as Rotur answers them.
const signInResponses = token => (url => tokenResponse(String(url).endsWith('/oauth/userinfo') ?
    {sub: 'user-id-1', username: 'sam'} :
    token));

// A popup whose consent page answers through postMessage, like rotur.dev's.
const fakePopup = () => {
    const popup = {closed: false, close: jest.fn(() => {
        popup.closed = true;
    }), location: {}};
    jest.spyOn(window, 'open').mockReturnValue(popup);
    const answer = data => {
        const state = new URL(popup.location.href).searchParams.get('state');
        window.dispatchEvent(new MessageEvent('message', {
            origin: 'https://rotur.dev',
            data: {type: 'rotur:signin', state, ...data}
        }));
    };
    return {popup, answer};
};

const store = session => localStorage.setItem('mw:rotur-oauth', JSON.stringify(session));

beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    oauth.signOut();
    global.fetch = jest.fn();
});

afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
});

test('signs in through the popup with PKCE and keeps a refreshable session', async () => {
    const {popup, answer} = fakePopup();
    global.fetch.mockImplementation(signInResponses({
        access_token: 'rotur_st_access', refresh_token: 'rrt_one', expires_in: 3600,
        scope: 'profile offline_access account:view'
    }));

    const signedIn = oauth.signIn(['account:view', 'offline_access']);
    await waitFor(() => popup.location.href);
    const url = new URL(popup.location.href);
    expect(url.origin + url.pathname).toBe('https://api.rotur.dev/oauth/authorize');
    expect(Object.fromEntries(url.searchParams)).toMatchObject({
        client_id: 'app_1938b6a87799f862',
        redirect_uri: location.origin,
        response_type: 'code',
        response_mode: 'web_message',
        scope: 'profile account:view offline_access',
        code_challenge_method: 'S256'
    });
    expect(url.searchParams.get('code_challenge')).toMatch(/^[A-Za-z0-9_-]{43}$/);

    // A message from anywhere else, or for another sign-in, is ignored.
    window.dispatchEvent(new MessageEvent('message', {
        origin: 'https://evil.example', data: {type: 'rotur:signin', code: 'x', state: url.searchParams.get('state')}
    }));
    window.dispatchEvent(new MessageEvent('message', {
        origin: 'https://rotur.dev', data: {type: 'rotur:signin', code: 'x', state: 'other'}
    }));
    answer({code: 'the-code'});
    const session = await signedIn;

    const [tokenUrl, init] = global.fetch.mock.calls[0];
    expect(tokenUrl).toBe('https://api.rotur.dev/oauth/token');
    const body = Object.fromEntries(init.body);
    expect(body).toMatchObject({
        grant_type: 'authorization_code', client_id: 'app_1938b6a87799f862', code: 'the-code', redirect_uri: location.origin
    });
    expect(body.code_verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(session).toMatchObject({
        accessToken: 'rotur_st_access', refreshToken: 'rrt_one', subject: 'user-id-1', username: 'sam'
    });
    expect(global.fetch.mock.calls[1][1].headers.Authorization).toBe('Bearer rotur_st_access');
    expect(oauth.readSession().accessToken).toBe('rotur_st_access');
    expect(popup.close).toHaveBeenCalled();
});

test('a cancelled or closed popup rejects without storing anything', async () => {
    const first = fakePopup();
    const denied = oauth.signIn([]);
    await waitFor(() => first.popup.location.href);
    first.answer({error: 'access_denied'});
    await expect(denied).rejects.toMatchObject({code: 'access_denied'});

    const second = fakePopup();
    const closed = oauth.signIn([]);
    await waitFor(() => second.popup.location.href);
    second.popup.closed = true;
    await expect(closed).rejects.toMatchObject({code: 'closed'});
    expect(oauth.readSession()).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
});

test('a blocked popup only goes to Rotur in this tab when the caller allows it', async () => {
    jest.spyOn(window, 'open').mockReturnValue(null);
    const navigate = jest.fn();
    oauth.configure({navigate});
    await expect(oauth.signIn(['groups:view'], {redirectFallback: false})).rejects.toMatchObject({code: 'popup_blocked'});
    expect(navigate).not.toHaveBeenCalled();
});

test('the redirect fallback comes back to the same page, and only for the sign-in this tab started', async () => {
    jest.spyOn(window, 'open').mockReturnValue(null);
    const navigate = jest.fn();
    const replace = jest.fn();
    oauth.configure({navigate, replace});
    history.replaceState(null, '', '/project/7');
    oauth.signIn(['account:view']);
    await waitFor(() => navigate.mock.calls.length);
    const target = new URL(navigate.mock.calls[0][0]);
    expect(target.searchParams.get('redirect_uri')).toBe(`${location.origin}/`);
    expect(target.searchParams.has('response_mode')).toBe(false);
    const state = target.searchParams.get('state');
    const pending = sessionStorage.getItem('mw:rotur-oauth-pending');
    expect(JSON.parse(pending)).toMatchObject({state, returnTo: '/project/7'});

    // Coming back with someone else's code and state does nothing.
    history.replaceState(null, '', '/?code=attacker-code&state=attacker-state');
    await expect(oauth.completeRedirect()).resolves.toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();

    sessionStorage.setItem('mw:rotur-oauth-pending', pending);
    global.fetch.mockImplementation(signInResponses({access_token: 'rotur_st_r', refresh_token: 'rrt_r', expires_in: 3600}));
    history.replaceState(null, '', `/?code=good-code&state=${state}&iss=https%3A%2F%2Fapi.rotur.dev`);
    await expect(oauth.completeRedirect()).resolves.toMatchObject({accessToken: 'rotur_st_r'});
    // A full load, so the app's router lands on the page too.
    expect(replace).toHaveBeenCalledWith('/project/7');
    expect(Object.fromEntries(global.fetch.mock.calls[0][1].body).redirect_uri).toBe(`${location.origin}/`);
    history.replaceState(null, '', '/');
});

test('refreshes once across tabs and shares the new token', async () => {
    store({accessToken: 'old', refreshToken: 'rrt_old', expiresAt: Date.now() + 1000, scopes: [], subject: 'user-id-1'});
    let release;
    global.fetch.mockReturnValue(new Promise(resolve => {
        release = () => resolve({ok: true, status: 200, json: () => Promise.resolve({
            access_token: 'new', refresh_token: 'rrt_new', expires_in: 3600
        })});
    }));
    const a = oauth.getAccessToken();
    const b = oauth.getAccessToken();
    await waitFor(() => global.fetch.mock.calls.length);
    release();
    await expect(Promise.all([a, b])).resolves.toEqual(['new', 'new']);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(Object.fromEntries(global.fetch.mock.calls[0][1].body)).toMatchObject({
        grant_type: 'refresh_token', refresh_token: 'rrt_old', client_id: 'app_1938b6a87799f862'
    });
    expect(oauth.readSession()).toMatchObject({accessToken: 'new', refreshToken: 'rrt_new', subject: 'user-id-1'});
});

test('a refresh that finishes after signing out does not sign back in', async () => {
    store({accessToken: 'old', refreshToken: 'rrt_old', expiresAt: Date.now() + 1000, scopes: []});
    let release;
    global.fetch.mockReturnValue(new Promise(resolve => {
        release = () => resolve({ok: true, status: 200, json: () => Promise.resolve({
            access_token: 'new', refresh_token: 'rrt_new', expires_in: 3600
        })});
    }));
    const token = oauth.getAccessToken();
    await waitFor(() => global.fetch.mock.calls.length);
    oauth.signOut();
    release();
    await expect(token).resolves.toBeNull();
    expect(oauth.readSession()).toBeNull();
});

test('uses a token another tab refreshed instead of spending its own', async () => {
    store({accessToken: 'old', refreshToken: 'rrt_old', expiresAt: Date.now() + 1000, scopes: []});
    // The other tab wins the race and writes its result first.
    global.fetch.mockImplementationOnce(() => {
        store({accessToken: 'from-other-tab', refreshToken: 'rrt_other', expiresAt: Date.now() + 3600000, scopes: []});
        return tokenResponse({error: 'invalid_grant', error_description: 'Refresh token is invalid or expired'}, false, 400);
    });
    await expect(oauth.getAccessToken()).resolves.toBe('from-other-tab');
});

test('a revoked refresh token signs out and tells listeners', async () => {
    store({accessToken: 'old', refreshToken: 'rrt_old', expiresAt: Date.now() - 1, scopes: []});
    const listener = jest.fn();
    const stop = oauth.onSessionChange(listener);
    global.fetch.mockReturnValue(tokenResponse({error: 'invalid_grant'}, false, 400));
    await expect(oauth.getAccessToken()).resolves.toBeNull();
    expect(oauth.readSession()).toBeNull();
    expect(listener).toHaveBeenCalledWith(null);
    stop();
});

test('a session from another tab keeps refreshing here, retries after errors, and catches up on waking', async () => {
    jest.useFakeTimers();
    const soon = {accessToken: 'old', refreshToken: 'rrt_old', expiresAt: Date.now() + 3 * 60 * 1000, scopes: []};
    store(soon);
    global.fetch.mockImplementation(() => Promise.reject(new TypeError('Failed to fetch')));
    // Another tab wrote this session; this tab takes over its refresh timer.
    window.dispatchEvent(new StorageEvent('storage', {key: 'mw:rotur-oauth', newValue: JSON.stringify(soon)}));
    await jest.advanceTimersByTimeAsync((60 * 1000) + 10);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    // Offline: it tries again 30 seconds later.
    global.fetch.mockImplementation(() => tokenResponse({access_token: 'new', refresh_token: 'rrt_new', expires_in: 3600}));
    await jest.advanceTimersByTimeAsync((30 * 1000) + 10);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(oauth.readSession().accessToken).toBe('new');

    // After sleeping past expiry, coming back to the tab refreshes straight away.
    store({accessToken: 'stale', refreshToken: 'rrt_stale', expiresAt: Date.now() - 1, scopes: []});
    global.fetch.mockImplementation(() => tokenResponse({access_token: 'awake', refresh_token: 'rrt_awake', expires_in: 3600}));
    document.dispatchEvent(new Event('visibilitychange'));
    await jest.advanceTimersByTimeAsync(10);
    expect(oauth.readSession().accessToken).toBe('awake');
});

test('an error inside the popup is handed to the opener', async () => {
    const opener = {postMessage: jest.fn()};
    const close = jest.spyOn(window, 'close').mockImplementation(() => {});
    window.name = 'rotur-signin';
    Object.defineProperty(window, 'opener', {value: opener, configurable: true});
    history.replaceState(null, '', '/?error=invalid_scope&state=s1&error_description=bad');
    try {
        await expect(oauth.completeRedirect()).resolves.toBeNull();
        expect(opener.postMessage).toHaveBeenCalledWith({
            type: 'rotur:signin', error: 'invalid_scope', error_description: 'bad', state: 's1'
        }, location.origin);
        expect(close).toHaveBeenCalled();
    } finally {
        window.name = '';
        Object.defineProperty(window, 'opener', {value: null, configurable: true});
        history.replaceState(null, '', '/');
    }
});

test('signing out from a sign-out listener does not loop', () => {
    store({accessToken: 'a', refreshToken: 'r', expiresAt: Date.now() + 3600000, scopes: []});
    const listener = jest.fn(() => oauth.signOut());
    const stop = oauth.onSessionChange(listener);
    oauth.signOut();
    expect(listener).toHaveBeenCalledTimes(1);
    stop();
});

test('without BroadcastChannel, other tabs read the session from the storage event', () => {
    const listener = jest.fn();
    const stop = oauth.onSessionChange(listener);
    const session = {accessToken: 'from-other-tab', refreshToken: 'r', expiresAt: Date.now() + 3600000, scopes: []};
    window.dispatchEvent(new StorageEvent('storage', {key: 'mw:rotur-oauth', newValue: JSON.stringify(session)}));
    window.dispatchEvent(new StorageEvent('storage', {key: 'mw:rotur-oauth', newValue: null}));
    expect(listener.mock.calls.map(call => call[0])).toEqual([session, null]);
    stop();
});

test('other tabs get the session in the message, not from storage they may not see yet', () => {
    const channels = [];
    global.BroadcastChannel = class {
        constructor (name) {
            this.name = name;
            this.posted = [];
            channels.push(this);
        }
        postMessage (data) {
            this.posted.push(data);
        }
    };
    try {
        const listener = jest.fn();
        const stop = oauth.onSessionChange(listener);
        expect(channels).toHaveLength(1);
        // Another tab signed in; this tab's localStorage doesn't show it yet.
        const session = {accessToken: 'from-other-tab', refreshToken: 'r', expiresAt: Date.now() + 3600000, scopes: []};
        channels[0].onmessage({data: session});
        channels[0].onmessage({data: null});
        expect(listener.mock.calls.map(call => call[0])).toEqual([session, null]);
        // And this tab's own changes go out with the session in them.
        store(session);
        oauth.signOut();
        expect(channels[0].posted).toEqual([null]);
        stop();
    } finally {
        delete global.BroadcastChannel;
    }
});
