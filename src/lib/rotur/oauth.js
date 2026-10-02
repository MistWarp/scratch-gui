// Sign in with Rotur for MistWarp: OAuth 2.0 with PKCE as a public client.
//
// Self-contained on purpose, so it can be swapped for rotur-sdk's OAuth
// helpers once they ship. Nothing here imports the rest of MistWarp.
//
// - signIn() opens Rotur's consent screen in a popup (response_mode
//   web_message). If the browser blocks the popup it falls back to a full-page
//   redirect, and completeRedirect() finishes the sign-in when the page loads
//   again.
// - With offline_access the session carries a refresh token. Refresh tokens
//   work once, so tabs refresh under a Web Lock and share the result over a
//   BroadcastChannel (or the storage event where there is none).
// - authorize() gets a token without storing it, for callers that keep their
//   own (each project's Rotur grant).

const config = {
    clientId: 'app_1938b6a87799f862',
    api: 'https://api.rotur.dev',
    site: 'https://rotur.dev',
    navigate: url => location.assign(url)
};

const STORAGE_KEY = 'mw:rotur-oauth';
const PENDING_KEY = 'mw:rotur-oauth-pending';
const CHANNEL = 'mw:rotur-oauth';
const LOCK = 'mw:rotur-oauth-refresh';
const POPUP_NAME = 'rotur-signin';
const MESSAGE_TYPE = 'rotur:signin';
// Refresh this long before the hour is up, so a request never races expiry.
const REFRESH_MARGIN = 2 * 60 * 1000;

const listeners = new Set();
let channel = null;
let refreshInFlight = null;
let refreshTimer = null;

const configure = options => Object.assign(config, options);

const oauthError = (code, message, extra) => Object.assign(new Error(message), {code}, extra);

const base64url = bytes => btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/[=]+$/, '');

const randomString = () => base64url(crypto.getRandomValues(new Uint8Array(32)));

const pkce = async () => {
    const verifier = randomString();
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
    return {verifier, challenge: base64url(digest)};
};

const scopeString = scopes => [...new Set(['profile', ...scopes])].join(' ');

const authorizeUrl = ({scopes, state, challenge, redirectUri, popup}) => `${config.api}/oauth/authorize?${
    new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        ...(popup ? {response_mode: 'web_message'} : {}),
        scope: scopeString(scopes),
        state,
        code_challenge: challenge,
        code_challenge_method: 'S256'
    })
}`;

// The web_message redirect_uri is this page's origin; the full-page fallback
// comes back to the site root, which is registered as a redirect URI.
const redirectUriFor = popup => (popup ? location.origin : `${location.origin}/`);

const tokenRequest = async body => {
    const response = await fetch(`${config.api}/oauth/token`, {
        method: 'POST',
        body: new URLSearchParams({client_id: config.clientId, ...body})
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.access_token) {
        throw oauthError(
            data.error || (response.status === 429 ? 'rate_limited' : 'token_failed'),
            data.error_description || `Rotur sign-in failed (${response.status})`,
            {status: response.status}
        );
    }
    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || null,
        expiresAt: Date.now() + ((Number(data.expires_in) || 3600) * 1000),
        scopes: String(data.scope || '').split(' ')
            .filter(Boolean)
    };
};

// Swap the code, and note whose account it is: the ID stays the same across
// refreshes and renames.
const exchangeCode = async (code, verifier, redirectUri) => {
    const session = await tokenRequest({
        grant_type: 'authorization_code',
        code,
        code_verifier: verifier,
        redirect_uri: redirectUri
    });
    const response = await fetch(`${config.api}/oauth/userinfo`, {
        headers: {Authorization: `Bearer ${session.accessToken}`}
    });
    const info = await response.json().catch(() => ({}));
    if (!response.ok || !info.sub) throw oauthError('userinfo_failed', 'Could not read the Rotur account');
    return {...session, subject: String(info.sub), username: String(info.username || '')};
};

const readSession = () => {
    try {
        const session = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        return session && typeof session.accessToken === 'string' ? session : null;
    } catch (e) {
        return null;
    }
};

const emit = session => {
    for (const listener of listeners) {
        try {
            listener(session);
        } catch (e) {
            // A listener's failure must not stop the others.
        }
    }
};

// The message carries the session itself: in Firefox it can arrive before
// this tab can see the other tab's write to localStorage.
const getChannel = () => {
    if (!channel && typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel(CHANNEL);
        channel.onmessage = event => emit(event.data || null);
    }
    return channel;
};

const writeSession = session => {
    // Signing out twice changes nothing, so it tells nobody.
    if (!session && !readSession()) return;
    try {
        if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        else localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        // Private mode: the session lasts for this page only.
    }
    const shared = getChannel();
    if (shared) shared.postMessage(session);
    emit(session);
};

// Wait for the consent popup to post its answer. The consent page posts from
// rotur.dev; an error Rotur raises before consent lands on our own origin.
const awaitPopup = (popup, state) => new Promise((resolve, reject) => {
    let watch = null;
    let onMessage = null;
    const cleanup = () => {
        clearInterval(watch);
        window.removeEventListener('message', onMessage);
    };
    onMessage = event => {
        const data = event.data;
        if ((event.origin !== config.site && event.origin !== location.origin) ||
            !data || data.type !== MESSAGE_TYPE || data.state !== state) return;
        cleanup();
        if (data.error) {
            reject(oauthError(data.error, data.error_description || 'Rotur sign-in was cancelled'));
        } else {
            resolve(data.code);
        }
    };
    watch = setInterval(() => {
        if (popup.closed) {
            cleanup();
            reject(oauthError('closed', 'The Rotur sign-in window was closed'));
        }
    }, 500);
    window.addEventListener('message', onMessage);
});

/**
 * Get a Rotur token for these scopes. Call it straight from a click: the
 * popup is opened before anything is awaited, or browsers block it.
 * @param {object} options What to ask for.
 * @param {string[]} options.scopes Permissions besides profile.
 * @param {boolean} [options.redirectFallback] Fall back to a full-page redirect
 *     if the popup is blocked. The result then arrives via completeRedirect().
 * @param {string} [options.returnTo] Where a redirect comes back to.
 * @returns {Promise<object>} {accessToken, refreshToken, expiresAt, scopes, subject, username}.
 */
const authorize = async ({scopes, redirectFallback = false, returnTo}) => {
    const popup = window.open('about:blank', POPUP_NAME, `popup,width=480,height=720,left=${
        Math.max(0, (screen.width - 480) / 2)},top=${Math.max(0, (screen.height - 720) / 2)}`);
    const {verifier, challenge} = await pkce();
    const state = randomString();
    if (!popup) {
        if (!redirectFallback) throw oauthError('popup_blocked', 'Allow pop-ups for this site to sign in with Rotur');
        sessionStorage.setItem(PENDING_KEY, JSON.stringify({
            state, verifier, returnTo: returnTo || `${location.pathname}${location.search}${location.hash}`
        }));
        config.navigate(authorizeUrl({scopes, state, challenge, redirectUri: redirectUriFor(false), popup: false}));
        return new Promise(() => {});
    }
    try {
        popup.location.href = authorizeUrl({scopes, state, challenge, redirectUri: redirectUriFor(true), popup: true});
        const code = await awaitPopup(popup, state);
        return await exchangeCode(code, verifier, redirectUriFor(true));
    } finally {
        if (!popup.closed) popup.close();
    }
};

const scheduleRefresh = session => {
    clearTimeout(refreshTimer);
    if (!session || !session.refreshToken) return;
    refreshTimer = setTimeout(() => {
        // eslint-disable-next-line no-use-before-define
        getAccessToken().catch(() => {});
    }, Math.max(0, session.expiresAt - REFRESH_MARGIN - Date.now()));
};

/**
 * Sign in to MistWarp, and keep the session.
 * @param {string[]} scopes Permissions besides profile and offline_access.
 * @returns {Promise<object>} The new session.
 */
const signIn = async scopes => {
    const session = await authorize({scopes: [...scopes, 'offline_access'], redirectFallback: true});
    writeSession(session);
    scheduleRefresh(session);
    return session;
};

/**
 * Finish a sign-in that fell back to a full-page redirect, or hand an error
 * from inside the popup back to the page that opened it. Call it once, early,
 * on every page load.
 * @returns {Promise<object|null>} The new session, or null if this load isn't
 *     the end of a sign-in.
 */
const completeRedirect = async () => {
    const params = new URLSearchParams(location.search);
    if (!params.has('state') || !(params.has('code') || params.has('error'))) return null;
    if (window.name === POPUP_NAME && window.opener) {
        window.opener.postMessage({
            type: MESSAGE_TYPE,
            error: params.get('error') || 'invalid_request',
            error_description: params.get('error_description') || '',
            state: params.get('state')
        }, location.origin);
        window.close();
        return null;
    }
    let pending = null;
    try {
        pending = JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null');
        sessionStorage.removeItem(PENDING_KEY);
    } catch (e) {
        pending = null;
    }
    // Only a sign-in this tab started counts. Anything else is ignored, so a
    // link can't sign someone in.
    if (!pending || pending.state !== params.get('state')) return null;
    history.replaceState(null, '', pending.returnTo || '/');
    if (params.has('error')) {
        throw oauthError(params.get('error'), params.get('error_description') || 'Rotur sign-in was cancelled');
    }
    const session = await exchangeCode(params.get('code'), pending.verifier, redirectUriFor(false));
    writeSession(session);
    scheduleRefresh(session);
    return session;
};

const withLock = task => {
    if (typeof navigator !== 'undefined' && navigator.locks && navigator.locks.request) {
        return navigator.locks.request(LOCK, task);
    }
    return task();
};

// Swap the refresh token, unless another tab already did.
const refresh = stale => withLock(async () => {
    const current = readSession();
    if (!current) return null;
    if (current.refreshToken !== stale.refreshToken || current.expiresAt - REFRESH_MARGIN > Date.now()) {
        scheduleRefresh(current);
        return current;
    }
    try {
        const next = {
            ...await tokenRequest({grant_type: 'refresh_token', refresh_token: current.refreshToken}),
            subject: current.subject,
            username: current.username
        };
        writeSession(next);
        scheduleRefresh(next);
        return next;
    } catch (error) {
        if (error.code !== 'invalid_grant') throw error;
        // Another tab without Web Locks may have won the race.
        const latest = readSession();
        if (latest && latest.refreshToken !== current.refreshToken) return latest;
        // Revoked, expired, banned, or the person left MistWarp on rotur.dev.
        writeSession(null);
        return null;
    }
});

/**
 * The current access token, refreshed first if it is about to expire.
 * @returns {Promise<string|null>} The token, or null when signed out.
 */
const getAccessToken = async () => {
    const session = readSession();
    if (!session) return null;
    if (session.expiresAt - REFRESH_MARGIN > Date.now()) return session.accessToken;
    if (!session.refreshToken) return session.expiresAt > Date.now() ? session.accessToken : null;
    if (!refreshInFlight) {
        refreshInFlight = refresh(session).finally(() => {
            refreshInFlight = null;
        });
    }
    const next = await refreshInFlight;
    return next ? next.accessToken : null;
};

const signOut = () => {
    clearTimeout(refreshTimer);
    writeSession(null);
};

/**
 * Hear about sign-in, refresh and sign-out, in this tab and others.
 * @param {Function} listener Called with the session, or null.
 * @returns {Function} Stops listening.
 */
const onSessionChange = listener => {
    listeners.add(listener);
    getChannel();
    return () => listeners.delete(listener);
};

if (typeof window !== 'undefined') {
    if (typeof BroadcastChannel === 'undefined') {
        window.addEventListener('storage', event => {
            if (event.key !== STORAGE_KEY) return;
            try {
                emit(JSON.parse(event.newValue || 'null'));
            } catch (e) {
                emit(null);
            }
        });
    }
    scheduleRefresh(readSession());
}

export {
    STORAGE_KEY,
    authorize,
    completeRedirect,
    configure,
    getAccessToken,
    onSessionChange,
    readSession,
    signIn,
    signOut
};
