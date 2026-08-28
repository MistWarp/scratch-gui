const CACHE_NAME = 'mw-project-content';
const TTL = 5 * 60 * 1000;
const CACHED_AT_HEADER = 'x-mw-cached-at';
const ETAG_HEADER = 'x-mw-etag';
const PRELOAD_TTL = 30 * 1000;

const inflight = new Map();
const preloaded = new Map();
const cacheWrites = new Map();

const openCache = async () => {
    try {
        if (typeof caches === 'undefined') return null;
        return await caches.open(CACHE_NAME);
    } catch (e) {
        return null;
    }
};

const getHeader = (headers, name) => {
    if (!headers) return null;
    if (typeof headers.get === 'function') return headers.get(name);
    return headers[name] || headers[name.toLowerCase()] || null;
};

const fetchAndStore = async url => {
    const cache = await openCache();
    let cachedHit = null;
    let storedEtag = null;
    if (cache) {
        try {
            const hit = await cache.match(url);
            if (hit) {
                const at = Number(getHeader(hit.headers, CACHED_AT_HEADER));
                if (at && Date.now() - at < TTL) {
                    return hit.arrayBuffer();
                }
                storedEtag = getHeader(hit.headers, ETAG_HEADER) || getHeader(hit.headers, 'etag');
                cachedHit = hit;
            }
        } catch (e) {
            // fall through to network
        }
    }

    const requestHeaders = {};
    if (storedEtag) {
        requestHeaders['If-None-Match'] = storedEtag;
    }

    let response;
    try {
        response = await fetch(url, Object.keys(requestHeaders).length ? {headers: requestHeaders} : {});
    } catch (err) {
        if (cachedHit) {
            return cachedHit.arrayBuffer();
        }
        throw err;
    }

    if (response.status === 304 && cachedHit) {
        const buffer = await cachedHit.arrayBuffer();
        if (cache) {
            const headers = {
                [CACHED_AT_HEADER]: String(Date.now()),
                ...(storedEtag ? {[ETAG_HEADER]: storedEtag} : {})
            };
            const write = cache.put(url, new Response(buffer, {headers})).catch(() => null);
            cacheWrites.set(url, write);
            write.finally(() => {
                if (cacheWrites.get(url) === write) cacheWrites.delete(url);
            });
        }
        return buffer;
    }

    if (!response.ok) {
        const error = new Error(`Request returned status ${response.status}`);
        error.status = response.status;
        throw error;
    }

    const etag = getHeader(response.headers, 'etag');
    const buffer = await response.arrayBuffer();
    if (cache) {
        try {
            const headers = {
                [CACHED_AT_HEADER]: String(Date.now()),
                ...(etag ? {[ETAG_HEADER]: etag} : {})
            };
            const write = cache.put(
                url,
                new Response(buffer, {headers})
            ).catch(() => null);
            cacheWrites.set(url, write);
            write.finally(() => {
                if (cacheWrites.get(url) === write) cacheWrites.delete(url);
            });
        } catch (e) {
            // cache full or unavailable; the fetch still succeeded
        }
    }
    return buffer;
};

const sharedFetch = url => {
    let promise = inflight.get(url);
    if (!promise) {
        promise = fetchAndStore(url)
            .finally(() => inflight.delete(url));
        inflight.set(url, promise);
    }
    return promise;
};

const cachedFetchBuffer = url => {
    const warmed = preloaded.get(url);
    if (warmed && Date.now() - warmed.at < PRELOAD_TTL) {
        preloaded.delete(url);
        return Promise.resolve(warmed.buffer);
    }
    if (warmed) preloaded.delete(url);
    // Project consumers treat the downloaded bytes as immutable. Returning the
    // shared buffer avoids copying the entire project before JSZip reads it.
    return sharedFetch(url);
};

const cachedFetchJson = url => sharedFetch(url)
    .then(buffer => JSON.parse(new TextDecoder().decode(buffer)));

const preloadContent = url => sharedFetch(url).then(async buffer => {
    // A project page and its player/editor can run in separate JS realms, so
    // the persistent cache is the handoff between them. Wait for that handoff
    // here, but never make a direct editor load wait for a cache write.
    const cacheWrite = cacheWrites.get(url);
    if (cacheWrite) await cacheWrite;
    const entry = {buffer, at: Date.now()};
    preloaded.set(url, entry);
    setTimeout(() => {
        if (preloaded.get(url) === entry) preloaded.delete(url);
    }, PRELOAD_TTL);
    return null;
});

const clearContentCache = () => {
    preloaded.clear();
    try {
        if (typeof caches !== 'undefined') {
            caches.delete(CACHE_NAME).catch(() => null);
        }
    } catch (e) {
        // ignore
    }
};

export {cachedFetchBuffer, cachedFetchJson, preloadContent, clearContentCache};
