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

const listeners = new Set();
let parsedFrom = null;
let parsed = new Map();
let lastChecked = null;
let watching = false;

const enabled = () => typeof document !== 'undefined' && typeof location !== 'undefined' &&
    ACCOUNT_ORIGIN !== EDITOR_ORIGIN && location.origin === ACCOUNT_ORIGIN &&
    !(typeof navigator !== 'undefined' && navigator.cookieEnabled === false);

const isShared = key => Object.prototype.hasOwnProperty.call(COOKIE_NAMES, key) && enabled();

const secure = () => location.protocol === 'https:';

const cookieName = key => `${secure() ? '__Host-' : ''}mw-${COOKIE_NAMES[key]}`;

const readCookies = () => {
    const raw = document.cookie;
    if (raw === parsedFrom) return parsed;
    parsedFrom = raw;
    parsed = new Map();
    for (const part of raw.split(';')) {
        const index = part.indexOf('=');
        if (index > 0) parsed.set(part.slice(0, index).trim(), part.slice(index + 1).trim());
    }
    return parsed;
};

const cookieRecord = key => {
    const value = readCookies().get(cookieName(key));
    if (!value) return null;
    try {
        const record = JSON.parse(decodeURIComponent(value));
        if (!record || typeof record !== 'object' || !Number.isFinite(record.t)) return null;
        if (record.v !== null && typeof record.v !== 'string') return null;
        return record;
    } catch (e) {
        return null;
    }
};

const setCookie = (key, value, maxAge) => {
    document.cookie = `${cookieName(key)}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Strict${
        secure() ? '; Secure' : ''}`;
};

const writeCookie = (key, record) => {
    const value = encodeURIComponent(JSON.stringify(record));
    if (cookieName(key).length + value.length > MAX_COOKIE_LENGTH) setCookie(key, '', 0);
    else setCookie(key, value, MAX_AGE);
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
    if (cookie && (cookie.t > local.t || (cookie.t === local.t && local.v === null && cookie.v !== null))) {
        writeLocal(key, cookie);
        if (cookie.v !== local.v) notify(key);
        return cookie.v;
    }
    if (local.v !== null && !cookie) {
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

const check = () => {
    const raw = document.cookie;
    if (raw === lastChecked) return;
    lastChecked = raw;
    for (const key of SHARED_KEYS) resolve(key);
};

const keepAlive = () => {
    for (const key of SHARED_KEYS) {
        resolve(key);
        const cookie = cookieRecord(key);
        if (cookie) writeCookie(key, cookie);
    }
    lastChecked = document.cookie;
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
    sharedCredentials,
    subscribeSharedCredentials
};
