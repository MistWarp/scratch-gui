import {
    cachedFetchBuffer,
    clearContentCache,
    preloadContent
} from '../../src/lib/community/cached-fetch.js';

describe('community project content cache', () => {
    const url = 'https://projects.example/project.sb3';
    let originalResponse;

    beforeEach(async () => {
        originalResponse = global.Response;
        global.Response = jest.fn((body, options) => ({body, options}));
        global.caches = {
            delete: jest.fn(() => Promise.resolve()),
            open: jest.fn(() => Promise.resolve(null))
        };
        global.fetch = jest.fn();
        clearContentCache();
    });

    afterEach(() => {
        global.Response = originalResponse;
        delete global.caches;
        delete global.fetch;
    });

    test('hands a preloaded project to the loader without copying it', async () => {
        const buffer = new Uint8Array([1, 2, 3]).buffer;
        global.fetch.mockResolvedValue({
            ok: true,
            arrayBuffer: () => Promise.resolve(buffer)
        });

        await preloadContent(url);
        const loaded = await cachedFetchBuffer(url);

        expect(loaded).toBe(buffer);
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('a retry makes a new request after a failed download', async () => {
        const buffer = new ArrayBuffer(1);
        global.fetch
            .mockRejectedValueOnce(new Error('offline'))
            .mockResolvedValueOnce({
                ok: true,
                arrayBuffer: () => Promise.resolve(buffer)
            });

        await expect(cachedFetchBuffer(url)).rejects.toThrow('offline');
        await expect(cachedFetchBuffer(url)).resolves.toBe(buffer);
        expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    test('concurrent consumers share one network request', async () => {
        const buffer = new ArrayBuffer(2);
        global.fetch.mockResolvedValue({
            ok: true,
            arrayBuffer: () => Promise.resolve(buffer)
        });

        const [first, second] = await Promise.all([
            cachedFetchBuffer(url),
            cachedFetchBuffer(url)
        ]);

        expect(first).toBe(buffer);
        expect(second).toBe(buffer);
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('preloading waits until another page can read the persistent cache', async () => {
        const persistentUrl = `${url}?persistent=1`;
        const buffer = new ArrayBuffer(1);
        let finishCacheWrite;
        const cache = {
            match: jest.fn(() => Promise.resolve(null)),
            put: jest.fn(() => new Promise(resolve => {
                finishCacheWrite = resolve;
            }))
        };
        global.caches.open.mockResolvedValue(cache);
        global.fetch.mockResolvedValue({
            ok: true,
            arrayBuffer: () => Promise.resolve(buffer)
        });
        let preloadFinished = false;

        const preload = preloadContent(persistentUrl).then(() => {
            preloadFinished = true;
        });
        for (let i = 0; i < 10 && cache.put.mock.calls.length === 0; i++) {
            await Promise.resolve();
        }

        expect(cache.put).toHaveBeenCalledTimes(1);
        expect(preloadFinished).toBe(false);
        finishCacheWrite();
        await preload;
        expect(preloadFinished).toBe(true);
    });

    test('revalidates expired entry with If-None-Match and reuses buffer on 304', async () => {
        const buffer = new ArrayBuffer(4);
        const headerMap = {
            'x-mw-cached-at': String(Date.now() - 10 * 60 * 1000), // expired
            'x-mw-etag': '"project-123"'
        };
        const cachedResponse = {
            headers: {
                get: name => headerMap[name.toLowerCase()] || null
            },
            arrayBuffer: () => Promise.resolve(buffer)
        };

        const cache = {
            match: jest.fn(() => Promise.resolve(cachedResponse)),
            put: jest.fn(() => Promise.resolve())
        };
        global.caches.open.mockResolvedValue(cache);
        global.fetch.mockResolvedValue({
            status: 304,
            ok: false
        });

        const loaded = await cachedFetchBuffer(url);
        expect(global.fetch).toHaveBeenCalledWith(url, {
            headers: {
                'If-None-Match': '"project-123"'
            }
        });
        expect(loaded).toBe(buffer);
        expect(cache.put).toHaveBeenCalledTimes(1);
    });
});
