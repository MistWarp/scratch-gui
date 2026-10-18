const mockOrigins = {
    ACCOUNT_ORIGIN: 'http://localhost',
    EDITOR_ORIGIN: 'http://editor.localhost'
};
jest.mock('../../../src/lib/account/origins.js', () => mockOrigins);

const {
    SHARED_KEYS, STAMPS_KEY, sharedCredentials, subscribeSharedCredentials
} = require('../../../src/lib/account/shared-credentials.js');

const KEY = 'mw:rotur-oauth';
const COOKIE = 'mw-rotur-oauth';

const cookieValue = name => {
    const part = document.cookie.split(';').map(item => item.trim())
        .find(item => item.startsWith(`${name}=`));
    return part ? JSON.parse(decodeURIComponent(part.slice(name.length + 1))) : null;
};

const setCookieRecord = (name, record) => {
    document.cookie = `${name}=${encodeURIComponent(JSON.stringify(record))}; Path=/`;
};

const emptyPartition = () => localStorage.clear();

beforeEach(() => {
    localStorage.clear();
    for (const part of document.cookie.split(';')) {
        const name = part.split('=')[0].trim();
        if (name) document.cookie = `${name}=; Path=/; Max-Age=0`;
    }
});

test('a write goes to localStorage and a first-party cookie', () => {
    sharedCredentials.setItem(KEY, 'session-a');
    expect(localStorage.getItem(KEY)).toBe('session-a');
    expect(cookieValue(COOKIE)).toEqual({v: 'session-a', t: expect.any(Number)});
    expect(JSON.parse(localStorage.getItem(STAMPS_KEY))[KEY]).toBe(cookieValue(COOKIE).t);
    expect(sharedCredentials.getItem(KEY)).toBe('session-a');
});

test('a partitioned frame reads the session from the cookie', () => {
    sharedCredentials.setItem(KEY, 'session-a');
    emptyPartition();
    expect(sharedCredentials.getItem(KEY)).toBe('session-a');
    expect(localStorage.getItem(KEY)).toBe('session-a');
});

test('a newer write from the other partition wins over a stale local copy', () => {
    sharedCredentials.setItem(KEY, 'old');
    const stamp = cookieValue(COOKIE).t;
    setCookieRecord(COOKIE, {v: 'rotated', t: stamp + 10});
    expect(sharedCredentials.getItem(KEY)).toBe('rotated');
    expect(localStorage.getItem(KEY)).toBe('rotated');
});

test('signing out in one partition signs the other out too', () => {
    sharedCredentials.setItem(KEY, 'session-a');
    const stale = {...localStorage};
    sharedCredentials.removeItem(KEY);
    expect(cookieValue(COOKIE)).toEqual({v: null, t: expect.any(Number)});
    emptyPartition();
    for (const [key, value] of Object.entries(stale)) localStorage.setItem(key, value);
    expect(sharedCredentials.getItem(KEY)).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
});

test('removing a value nobody has writes no cookie', () => {
    sharedCredentials.removeItem(KEY);
    expect(cookieValue(COOKIE)).toBeNull();
});

test('a value saved before the cookie existed is shared with a fresh stamp', () => {
    localStorage.setItem(KEY, 'from-before');
    expect(sharedCredentials.getItem(KEY)).toBe('from-before');
    expect(cookieValue(COOKIE)).toEqual({v: 'from-before', t: expect.any(Number)});
    emptyPartition();
    expect(sharedCredentials.getItem(KEY)).toBe('from-before');
});

test('an older local copy is pushed to a stale cookie', () => {
    setCookieRecord(COOKIE, {v: 'cookie', t: 5});
    localStorage.setItem(KEY, 'local');
    localStorage.setItem(STAMPS_KEY, JSON.stringify({[KEY]: 10}));
    expect(sharedCredentials.getItem(KEY)).toBe('local');
    expect(cookieValue(COOKIE)).toEqual({v: 'local', t: 10});
});

test('a value too large for a cookie clears the cookie instead of leaving an old one', () => {
    sharedCredentials.setItem(KEY, 'small');
    sharedCredentials.setItem(KEY, 'x'.repeat(5000));
    expect(cookieValue(COOKIE)).toBeNull();
    expect(sharedCredentials.getItem(KEY)).toBe('x'.repeat(5000));
});

test('every shared key has its own cookie', () => {
    for (const key of SHARED_KEYS) sharedCredentials.setItem(key, `value of ${key}`);
    emptyPartition();
    for (const key of SHARED_KEYS) expect(sharedCredentials.getItem(key)).toBe(`value of ${key}`);
});

test('other keys stay in localStorage only', () => {
    sharedCredentials.setItem('mw:editor-session', 'local-only');
    expect(localStorage.getItem('mw:editor-session')).toBe('local-only');
    expect(document.cookie).toBe('');
});

test('listeners hear about changes made in the other partition', () => {
    jest.useFakeTimers();
    try {
        const heard = [];
        const unsubscribe = subscribeSharedCredentials(key => heard.push(key));
        sharedCredentials.setItem(KEY, 'mine');
        jest.advanceTimersByTime(1500);
        expect(heard).toEqual([]);
        setCookieRecord(COOKIE, {v: 'theirs', t: cookieValue(COOKIE).t + 1});
        jest.advanceTimersByTime(1500);
        expect(heard).toEqual([KEY]);
        expect(localStorage.getItem(KEY)).toBe('theirs');
        setCookieRecord(COOKIE, {v: null, t: cookieValue(COOKIE).t + 1});
        jest.advanceTimersByTime(1500);
        expect(heard).toEqual([KEY, KEY]);
        expect(localStorage.getItem(KEY)).toBeNull();
        unsubscribe();
    } finally {
        jest.useRealTimers();
    }
});

test('off the account origin nothing is shared', () => {
    mockOrigins.ACCOUNT_ORIGIN = 'https://mistwarp.org';
    try {
        sharedCredentials.setItem(KEY, 'local-only');
        expect(localStorage.getItem(KEY)).toBe('local-only');
        expect(localStorage.getItem(STAMPS_KEY)).toBeNull();
        expect(document.cookie).toBe('');
    } finally {
        mockOrigins.ACCOUNT_ORIGIN = 'http://localhost';
    }
});
