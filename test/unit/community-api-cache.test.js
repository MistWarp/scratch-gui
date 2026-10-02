import {request} from '../../src/lib/community/api.js';

const jsonResponse = data => ({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data)
});

describe('community api GET cache', () => {
    beforeEach(() => {
        sessionStorage.clear();
        global.fetch = jest.fn(() => Promise.resolve(jsonResponse({ok: true, value: 1})));
    });

    test('repeated GETs within the TTL hit the cache', async () => {
        const first = await request('/projects/abc');
        const second = await request('/projects/abc');
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(second).toEqual(first);
    });

    test('concurrent GETs share one request', async () => {
        let resolveFetch;
        global.fetch.mockImplementationOnce(() => new Promise(resolve => {
            resolveFetch = resolve;
        }));
        const first = request('/projects/abc');
        const second = request('/projects/abc');
        expect(global.fetch).toHaveBeenCalledTimes(1);
        resolveFetch(jsonResponse({ok: true, value: 2}));
        await expect(Promise.all([first, second])).resolves.toEqual([
            {ok: true, value: 2},
            {ok: true, value: 2}
        ]);
    });

    test('different paths are cached separately', async () => {
        await request('/projects/abc');
        await request('/projects/def');
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    test('mutations invalidate cached GETs', async () => {
        await request('/projects/abc');
        await request('/projects/abc/react', {method: 'POST', body: {type: 'heart'}});
        await request('/projects/abc');
        expect(global.fetch.mock.calls.filter(call => call[0].endsWith('/projects/abc')).length).toBe(2);
    });

    test('a GET started before a mutation cannot restore stale cache data', async () => {
        let resolveGet;
        global.fetch
            .mockImplementationOnce(() => new Promise(resolve => {
                resolveGet = resolve;
            }))
            .mockResolvedValueOnce(jsonResponse({ok: true}))
            .mockResolvedValueOnce(jsonResponse({ok: true, value: 'fresh'}));

        const stale = request('/projects/abc');
        await request('/projects/abc/react', {method: 'POST', body: {type: 'heart'}});
        resolveGet(jsonResponse({ok: true, value: 'stale'}));
        await stale;

        await expect(request('/projects/abc')).resolves.toMatchObject({value: 'fresh'});
        expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    test('mutations invalidate every cached GET when removing reorders storage keys', async () => {
        // Browsers can reorder sessionStorage keys when one is removed.
        const items = new Map();
        const reorderingStorage = {
            get length () {
                return items.size;
            },
            key: index => Array.from(items.keys())[index] ?? null,
            getItem: key => (items.has(key) ? items.get(key) : null),
            setItem: (key, value) => items.set(key, String(value)),
            removeItem: key => {
                items.delete(key);
                const [first] = items;
                if (!first) return;
                items.delete(first[0]);
                items.set(first[0], first[1]);
            },
            clear: () => items.clear()
        };
        const realStorage = Object.getOwnPropertyDescriptor(window, 'sessionStorage');
        Object.defineProperty(window, 'sessionStorage', {configurable: true, value: reorderingStorage});
        try {
            reorderingStorage.setItem('mw:rotur-restore', '{}');
            const paths = ['/me', '/me/settings', '/projects/abc/pulls', '/projects/abc/related',
                '/projects/abc/remixtree', '/projects/abc/comments?offset=0&limit=20'];
            for (const path of paths) await request(path);
            await request('/projects/abc/comments', {method: 'POST', body: {content: 'hello'}});

            expect(Array.from(items.keys())).toEqual(['mw:rotur-restore']);
            await request('/projects/abc/comments?offset=0&limit=20');
            expect(global.fetch.mock.calls.filter(call => call[0].endsWith('/comments?offset=0&limit=20')))
                .toHaveLength(2);
        } finally {
            if (realStorage) Object.defineProperty(window, 'sessionStorage', realStorage);
            else delete window.sessionStorage;
        }
    });

    test('view pings do not invalidate the cache', async () => {
        await request('/projects/abc');
        await request('/projects/abc/view', {method: 'POST'});
        await request('/projects/abc');
        expect(global.fetch.mock.calls.filter(call => call[0].endsWith('/projects/abc')).length).toBe(1);
    });

    test('raw requests bypass the cache', async () => {
        await request('/projects/abc');
        const response = await request('/projects/abc', {raw: true});
        expect(response.ok).toBe(true);
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    test('cache can be disabled for fresh GETs', async () => {
        await request('/admin/extensions', {cache: false});
        await request('/admin/extensions', {cache: false});
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    test('expired entries refetch', async () => {
        const now = Date.now();
        const spy = jest.spyOn(Date, 'now');
        spy.mockReturnValue(now);
        await request('/projects/abc');
        spy.mockReturnValue(now + 61000);
        await request('/projects/abc');
        expect(global.fetch).toHaveBeenCalledTimes(2);
        spy.mockRestore();
    });
});
