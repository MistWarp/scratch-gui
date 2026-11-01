import {beforeEach, describe, expect, jest, test} from '@jest/globals';
import {createStore, type KeyValueArea} from '../../../src/modules/storage';
import {
    createPlatformApi,
    staleCacheTest,
    type ApiError,
    type ErrorFactory,
    type Fetch
} from '../../../src/modules/platform-api';

const memoryArea = (): KeyValueArea => {
    const entries = new Map<string, string>();
    return {
        get length () {
            return entries.size;
        },
        key: index => [...entries.keys()][index] ?? null,
        getItem: key => entries.get(key) ?? null,
        setItem: (key, value) => {
            entries.set(key, value);
        },
        removeItem: key => {
            entries.delete(key);
        }
    };
};

const errors: ErrorFactory = {
    response: ({status, code, serverMessage, data}) => Object.assign(new Error(serverMessage ?? `HTTP ${String(status)}`), {
        status, code, data, friendly: true
    }),
    network: () => Object.assign(new Error('network'), {code: 'network'}),
    timeout: () => Object.assign(new Error('timeout'), {code: 'timeout'})
};

const textResponse = (text: string, status = 200): Response => {
    const response = {
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(JSON.parse(text) as unknown),
        text: () => Promise.resolve(text),
        clone: () => textResponse(text, status)
    };
    return response as unknown as Response;
};

const json = (body: unknown, status = 200): Response => textResponse(JSON.stringify(body), status);

type FetchMock = jest.MockedFunction<Fetch>;

const setup = (responder: (url: string, init?: RequestInit) => Response | Promise<Response>) => {
    const credentials = memoryArea();
    const cacheArea = memoryArea();
    const fetch: FetchMock = jest.fn((url: string, init?: RequestInit) => Promise.resolve(responder(url, init)));
    const onSuccess = jest.fn();
    const api = createPlatformApi({
        baseUrl: 'https://api.test/v1',
        credentials,
        cacheStore: createStore(() => cacheArea),
        errors,
        fetch,
        onSuccess
    });
    return {api, fetch, credentials, onSuccess};
};

const pathsOf = (fetch: FetchMock): string[] => fetch.mock.calls.map(([url]) => url.replace('https://api.test/v1', ''));

describe('staleCacheTest', () => {
    test('a change to one project keeps other projects cached', () => {
        const isStale = staleCacheTest('POST', '/projects/abc/comments');
        expect(isStale).not.toBeNull();
        expect(isStale?.('/projects/abc')).toBe(true);
        expect(isStale?.('/projects/ABC/comments')).toBe(true);
        expect(isStale?.('/projects/def')).toBe(false);
        expect(isStale?.('/projects/featured')).toBe(true);
        expect(isStale?.('/me')).toBe(true);
    });

    test('wide actions, deletes and unscoped paths drop everything', () => {
        expect(staleCacheTest('POST', '/projects/abc/remix')).toBeNull();
        expect(staleCacheTest('DELETE', '/projects/abc')).toBeNull();
        expect(staleCacheTest('POST', '/settings')).toBeNull();
        expect(staleCacheTest('POST', '/projects/featured/x')).toBeNull();
    });
});

describe('createPlatformApi', () => {
    let responses: Record<string, () => Response>;

    beforeEach(() => {
        responses = {};
    });

    const routed = (url: string): Response => {
        const path = url.replace('https://api.test/v1', '');
        return responses[path]?.() ?? json({ok: true, path});
    };

    test('caches GETs, shares one request between callers, and reports successes', async () => {
        const {api, fetch, onSuccess} = setup(routed);
        const [first, second] = await Promise.all([api.request('/projects/abc'), api.request('/projects/abc')]);
        expect(first).toEqual({ok: true, path: '/projects/abc'});
        expect(second).toEqual(first);
        await api.request('/projects/abc');
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(onSuccess).toHaveBeenCalledWith('/projects/abc', 'GET');
    });

    test('a write drops the cached pages it can change', async () => {
        const {api, fetch} = setup(routed);
        await api.request('/projects/abc');
        await api.request('/projects/def');
        await api.request('/projects/abc/comments', {method: 'POST', body: {content: 'hi'}});
        await api.request('/projects/abc');
        await api.request('/projects/def');
        expect(pathsOf(fetch)).toEqual(['/projects/abc', '/projects/def', '/projects/abc/comments', '/projects/abc']);
        expect(fetch.mock.calls[2]?.[1]?.body).toBe('{"content":"hi"}');
    });

    test('sends the stored session as a bearer token', async () => {
        const {api, fetch, credentials} = setup(routed);
        credentials.setItem('mw:mistwarp-session', 'tok_abc');
        await api.request('/me', {cache: false});
        expect(fetch.mock.calls[0]?.[1]?.headers).toEqual({Authorization: 'Bearer tok_abc'});
    });

    test('retries a GET once after a server error, but not a write', async () => {
        let calls = 0;
        responses['/flaky'] = () => (++calls === 1 ? json({error: 'down'}, 503) : json({ok: true}));
        responses['/write'] = () => json({error: 'down'}, 503);
        const {api, fetch} = setup(routed);
        await expect(api.request('/flaky')).resolves.toEqual({ok: true});
        await expect(api.request('/write', {method: 'POST'})).rejects.toMatchObject({status: 503});
        expect(pathsOf(fetch)).toEqual(['/flaky', '/flaky', '/write']);
    });

    test('turns a failed response into the injected error with its redirect', async () => {
        responses['/banned'] = () => json({error: 'You are banned.', code: 'banned'}, 403);
        const {api} = setup(routed);
        const error = await api.request('/banned').catch((caught: unknown) => caught as ApiError);
        expect(error).toMatchObject({status: 403, code: 'banned', redirectUrl: 'https://rotur.dev/me'});
    });

    test('a 401 clears the session and retries once with a refreshed one', async () => {
        const {api, fetch} = setup(url => (pathsOf(fetch).length === 1 ?
            json({error: 'expired'}, 401) :
            routed(url)));
        let token: string | null = 'tok_old';
        const cleared = jest.fn(() => {
            token = null;
        });
        api.session.setProvider({
            get: () => token,
            clear: cleared,
            refresh: () => {
                token = 'tok_new';
                return Promise.resolve(token);
            }
        });
        await expect(api.request('/projects/mine', {cache: false})).resolves.toEqual({ok: true, path: '/projects/mine'});
        expect(cleared).toHaveBeenCalledTimes(1);
        expect(fetch.mock.calls.map(([, init]) => init?.headers)).toEqual([
            {Authorization: 'Bearer tok_old'},
            {Authorization: 'Bearer tok_new'}
        ]);
    });

    test('raw requests return the response untouched', async () => {
        responses['/history'] = () => textResponse('zip-bytes');
        const {api} = setup(routed);
        const response = await api.requestRaw('/history');
        await expect(response.text()).resolves.toBe('zip-bytes');
    });

    test('logout always forgets the session', async () => {
        responses['/logout'] = () => json({error: 'gone'}, 500);
        const {api, credentials} = setup(routed);
        credentials.setItem('mw:mistwarp-session', 'tok_abc');
        await expect(api.logout()).rejects.toMatchObject({status: 500});
        expect(credentials.getItem('mw:mistwarp-session')).toBeNull();
    });

    test('signing in stores the token and tells the app', async () => {
        const onSignedIn = jest.fn();
        const {api, credentials, fetch} = setup(url => {
            if (url === 'https://api.rotur.dev/v2/validators') return json({validator: 'val_1'});
            if (url.startsWith('https://api.test/v1/auth?v=val_1')) return json({ok: true, token: 'tok_new', minor: true});
            return routed(url);
        });
        api.session.setEvents({onSignedIn});
        await api.session.runExchange('rotur_token');
        expect(credentials.getItem('mw:mistwarp-session')).toBe('tok_new');
        expect(onSignedIn).toHaveBeenCalledWith(expect.objectContaining({token: 'tok_new', minor: true}));
        expect(fetch.mock.calls[0]?.[1]?.headers).toMatchObject({Authorization: 'Bearer rotur_token'});
        expect(fetch.mock.calls.some(([url]) => url.includes('rotur_token'))).toBe(false);
    });
});
