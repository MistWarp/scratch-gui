import {ACCOUNT_ORIGIN, EDITOR_ORIGIN} from './origins.js';

const COOKIE_NAMES = {
    'mw:rotur-oauth': 'rotur-oauth',
    'mw:rotur-token': 'rotur-token',
    'mw:mistwarp-session': 'mistwarp-session',
    'mw:minor-account': 'minor-account',
    'mw:rotur-settings': 'rotur-settings'
};
const SHARED_KEYS = Object.keys(COOKIE_NAMES);
const STAMPS_KEY = 'mw:shared-stamps';
const MAX_AGE = 400 * 24 * 60 * 60;
const MAX_COOKIE_LENGTH = 4000;
const CHECK_INTERVAL = 1000;
const FUTURE_LIMIT = 24 * 60 * 60 * 1000;
const LEASE_TIME = 20000;
const LEASE_RETRY = 250;
const LEASE_SETTLE = 50;
const LEASE_RENEW = 5000;
const KEEP_ALIVE_INTERVAL = 24 * 60 * 60 * 1000;

const listeners = new Set();
let parsedFrom = null;
let parsed = new Map();
let repeated = new Set();
let lastChecked = null;
let keptAliveAt = 0;
let watching = false;
let cookieAccess = null;

// A sandboxed iframe without allow-same-origin keeps the account origin in
// location.origin but throws when the cookie jar is touched. Probe it once so
// the rest of the module can fall back to localStorage instead of crashing on
// import.
const canReadCookies = () => {
    if (cookieAccess === null) {
        try {
            void document.cookie;
            cookieAccess = true;
        } catch (e) {
            cookieAccess = false;
        }
    }
    return cookieAccess;
};

const enabled = () => typeof document !== 'undefined' && typeof location !== 'undefined' &&
    ACCOUNT_ORIGIN !== EDITOR_ORIGIN && location.origin === ACCOUNT_ORIGIN &&
    !(typeof navigator !== 'undefined' && navigator.cookieEnabled === false) &&
    canReadCookies();

const isShared = key => Object.prototype.hasOwnProperty.call(COOKIE_NAMES, key) && enabled();

const secure = () => location.protocol === 'https:';

const cookieName = key => `${secure() ? '__Host-' : ''}mw-${COOKIE_NAMES[key]}`;

const readCookieString = () => {
    try {
        return document.cookie;
    } catch (e) {
        return '';
    }
};

const readCookies = () => {
    const raw = readCookieString();
    if (raw === parsedFrom) return parsed;
    parsedFrom = raw;
    parsed = new Map();
    repeated = new Set();
    for (const part of raw.split(';')) {
        const index = part.indexOf('=');
        if (index <= 0) continue;
        const name = part.slice(0, index).trim();
        if (parsed.has(name)) repeated.add(name);
        parsed.set(name, part.slice(index + 1).trim());
    }
    return parsed;
};

const readCookie = name => {
    const value = readCookies().get(name);
    if (!value || repeated.has(name)) return null;
    try {
        return JSON.parse(decodeURIComponent(value));
    } catch (e) {
        return null;
    }
};

const cookieRecord = key => {
    const record = readCookie(cookieName(key));
    if (!record || typeof record !== 'object' || !Number.isFinite(record.t)) return null;
    if (record.t > Date.now() + FUTURE_LIMIT) return null;
    if (record.big === true) return {v: null, t: record.t, big: true};
    if (record.v !== null && typeof record.v !== 'string') return null;
    return {v: record.v, t: record.t};
};

const setCookie = (name, value, maxAge) => {
    try {
        document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Strict${secure() ? '; Secure' : ''}`;
    } catch (e) {
        // Cookies can become unavailable after the initial probe.
    }
};

const writeCookie = (key, record) => {
    const name = cookieName(key);
    const value = encodeURIComponent(JSON.stringify({v: record.v, t: record.t}));
    if (name.length + value.length > MAX_COOKIE_LENGTH) {
        setCookie(name, encodeURIComponent(JSON.stringify({big: true, t: record.t})), MAX_AGE);
    } else {
        setCookie(name, value, MAX_AGE);
    }
};

const readStamps = () => {
    try {
        const stamps = JSON.parse(localStorage.getItem(STAMPS_KEY) || '{}');
        return stamps && typeof stamps === 'object' ? stamps : {};
    } catch (e) {
        return {};
    }
};

const localRecord = key => {
    let value = null;
    try {
        value = localStorage.getItem(key);
    } catch (e) {
        value = null;
    }
    return {v: value, t: Number(readStamps()[key]) || 0};
};

const writeLocal = (key, record) => {
    try {
        if (record.v === null) localStorage.removeItem(key);
        else localStorage.setItem(key, record.v);
        localStorage.setItem(STAMPS_KEY, JSON.stringify({...readStamps(), [key]: record.t}));
    } catch (e) {
        return;
    }
};

const notify = key => {
    setTimeout(() => {
        for (const listener of listeners) {
            try {
                listener(key);
            } catch (e) {
                continue;
            }
        }
    });
};

const resolve = key => {
    const local = localRecord(key);
    const cookie = cookieRecord(key);
    if (cookie && cookie.big && cookie.t >= local.t) return local.v;
    if (cookie && cookie.t > local.t) {
        writeLocal(key, cookie);
        if (cookie.v !== local.v) notify(key);
        return cookie.v;
    }
    if (!cookie && (local.v !== null || local.t)) {
        const stamped = local.t ? local : {v: local.v, t: Date.now()};
        if (stamped !== local) writeLocal(key, stamped);
        writeCookie(key, stamped);
    } else if (cookie && local.t > cookie.t) {
        writeCookie(key, local);
    }
    return local.v;
};

const write = (key, value) => {
    const cookie = cookieRecord(key);
    const previous = Math.max(localRecord(key).t, cookie ? cookie.t : 0);
    const record = {v: value, t: Math.max(Date.now(), previous + 1)};
    writeLocal(key, record);
    writeCookie(key, record);
};

const getItem = key => (isShared(key) ? resolve(key) : localStorage.getItem(key));

const setItem = (key, value) => {
    if (!isShared(key)) {
        localStorage.setItem(key, value);
        return;
    }
    write(key, String(value));
};

const removeItem = key => {
    if (!isShared(key)) {
        localStorage.removeItem(key);
        return;
    }
    if (resolve(key) !== null) write(key, null);
};

const keepAlive = () => {
    for (const key of SHARED_KEYS) {
        resolve(key);
        const cookie = cookieRecord(key);
        if (cookie && !cookie.big) writeCookie(key, cookie);
    }
    keptAliveAt = Date.now();
    lastChecked = readCookieString();
};

const check = () => {
    const sinceKeptAlive = Date.now() - keptAliveAt;
    if (sinceKeptAlive < 0 || sinceKeptAlive > KEEP_ALIVE_INTERVAL) keepAlive();
    const raw = readCookieString();
    if (raw === lastChecked) return;
    lastChecked = raw;
    for (const key of SHARED_KEYS) resolve(key);
};

const leaseName = name => `${secure() ? '__Host-' : ''}mw-lease-${name}`;

const readLease = name => {
    const lease = readCookie(leaseName(name));
    return lease && typeof lease.owner === 'string' && Number.isFinite(lease.until) ? lease : null;
};

const writeLease = (name, owner) => {
    setCookie(leaseName(name), encodeURIComponent(JSON.stringify({owner, until: Date.now() + LEASE_TIME})),
        Math.ceil(LEASE_TIME / 1000));
};

const pause = delay => new Promise(done => setTimeout(done, delay));

const withSharedLease = async (name, task) => {
    if (!enabled()) return task();
    const owner = Math.random().toString(36)
        .slice(2);
    const giveUpAt = Date.now() + LEASE_TIME;
    while (Date.now() < giveUpAt) {
        const lease = readLease(name);
        if (!lease || lease.until < Date.now()) {
            writeLease(name, owner);
            await pause(LEASE_SETTLE);
            const held = readLease(name);
            if (!held || held.owner === owner) break;
        }
        await pause(LEASE_RETRY);
    }
    const renew = setInterval(() => {
        const lease = readLease(name);
        if (lease && lease.owner === owner) writeLease(name, owner);
    }, LEASE_RENEW);
    try {
        return await task();
    } finally {
        clearInterval(renew);
        const lease = readLease(name);
        if (lease && lease.owner === owner) setCookie(leaseName(name), '', 0);
    }
};

const watch = () => {
    if (watching || !enabled()) return;
    watching = true;
    keepAlive();
    setInterval(check, CHECK_INTERVAL);
    document.addEventListener('visibilitychange', check);
    window.addEventListener('focus', check);
};

const subscribeSharedCredentials = listener => {
    listeners.add(listener);
    watch();
    return () => listeners.delete(listener);
};

const sharedCredentials = {getItem, setItem, removeItem};

export {
    SHARED_KEYS,
    STAMPS_KEY,
    enabled as sharingCredentials,
    sharedCredentials,
    subscribeSharedCredentials,
    withSharedLease
};
