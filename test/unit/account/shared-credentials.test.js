const mockOrigins = {
    ACCOUNT_ORIGIN: 'http://localhost',
    EDITOR_ORIGIN: 'http://editor.localhost'
};
jest.mock('../../../src/lib/account/origins.js', () => mockOrigins);

const {
    SHARED_KEYS, STAMPS_KEY, sharedCredentials, subscribeSharedCredentials, withSharedLease
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

test('a sign-out is shared again after its cookie expired', () => {
    sharedCredentials.setItem(KEY, 'session-a');
    sharedCredentials.removeItem(KEY);
    const tombstone = cookieValue(COOKIE);
    document.cookie = `${COOKIE}=; Path=/; Max-Age=0`;
    expect(sharedCredentials.getItem(KEY)).toBeNull();
    expect(cookieValue(COOKIE)).toEqual(tombstone);
});

test('an older local copy is pushed to a stale cookie', () => {
    setCookieRecord(COOKIE, {v: 'cookie', t: 5});
    localStorage.setItem(KEY, 'local');
    localStorage.setItem(STAMPS_KEY, JSON.stringify({[KEY]: 10}));
    expect(sharedCredentials.getItem(KEY)).toBe('local');
    expect(cookieValue(COOKIE)).toEqual({v: 'local', t: 10});
});

test('a value too large for a cookie leaves a marker instead of an old value', () => {
    sharedCredentials.setItem(KEY, 'small');
    sharedCredentials.setItem(KEY, 'x'.repeat(5000));
    const marker = cookieValue(COOKIE);
    expect(marker).toEqual({big: true, t: expect.any(Number)});
    expect(sharedCredentials.getItem(KEY)).toBe('x'.repeat(5000));
    localStorage.setItem(KEY, 'small');
    localStorage.setItem(STAMPS_KEY, JSON.stringify({[KEY]: marker.t - 1}));
    expect(sharedCredentials.getItem(KEY)).toBe('small');
    expect(cookieValue(COOKIE)).toEqual(marker);
});

test('a cookie set twice under one name is ignored', () => {
    sharedCredentials.setItem(KEY, 'mine');
    const real = document.cookie;
    const tossed = `${COOKIE}=${encodeURIComponent(JSON.stringify({v: 'tossed', t: cookieValue(COOKIE).t + 10}))}`;
    const spy = jest.spyOn(document, 'cookie', 'get').mockReturnValue(`${real}; ${tossed}`);
    try {
        expect(sharedCredentials.getItem(KEY)).toBe('mine');
    } finally {
        spy.mockRestore();
    }
});

test('a stamp from the far future is ignored', () => {
    sharedCredentials.setItem(KEY, 'mine');
    setCookieRecord(COOKIE, {v: 'forged', t: Date.now() + (2 * 24 * 60 * 60 * 1000)});
    expect(sharedCredentials.getItem(KEY)).toBe('mine');
});

test('a lease held by another partition makes the task wait for it', async () => {
    const lease = 'mw-lease-test';
    document.cookie = `${lease}=${encodeURIComponent(JSON.stringify({owner: 'other', until: Date.now() + 10000}))}; Path=/`;
    let ran = false;
    const done = withSharedLease('test', async () => {
        ran = true;
        return document.cookie.includes(lease);
    });
    await new Promise(resolve => setTimeout(resolve, 600));
    expect(ran).toBe(false);
    document.cookie = `${lease}=; Path=/; Max-Age=0`;
    await expect(done).resolves.toBe(true);
    expect(document.cookie.includes(lease)).toBe(false);
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

test('a sandboxed frame keeps working when cookies are inaccessible', () => {
    const spy = jest.spyOn(document, 'cookie', 'get').mockImplementation(() => {
        throw new DOMException('The document is sandboxed', 'SecurityError');
    });
    try {
        jest.isolateModules(() => {
            const fresh = require('../../../src/lib/account/shared-credentials.js');
            expect(() => fresh.subscribeSharedCredentials(() => {})).not.toThrow();
            expect(fresh.sharingCredentials()).toBe(false);
            expect(() => fresh.sharedCredentials.setItem(KEY, 'local-only')).not.toThrow();
            expect(fresh.sharedCredentials.getItem(KEY)).toBe('local-only');
        });
    } finally {
        spy.mockRestore();
    }
});

test('a lease stays held while a long task runs', async () => {
    jest.useFakeTimers();
    try {
        let finish = null;
        const done = withSharedLease('long', () => new Promise(resolve => {
            finish = resolve;
        }));
        await jest.advanceTimersByTimeAsync(25000);
        const lease = cookieValue('mw-lease-long');
        expect(lease.until).toBeGreaterThan(Date.now());
        finish('finished');
        await expect(done).resolves.toBe('finished');
        expect(cookieValue('mw-lease-long')).toBeNull();
    } finally {
        jest.useRealTimers();
    }
});
