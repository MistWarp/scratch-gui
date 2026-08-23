const CACHE_NAME = 'mw-project-content';
const TTL = 5 * 60 * 1000;
const CACHED_AT_HEADER = 'x-mw-cached-at';
const PRELOAD_TTL = 30 * 1000;
const FAILURE_TTL = 5 * 1000;

const inflight = new Map();
const preloaded = new Map();
const failures = new Map();

const openCache = async () => {
    try {
        if (typeof caches === 'undefined') return null;
        return await caches.open(CACHE_NAME);
    } catch (e) {
        return null;
    }
};

const fetchAndStore = async url => {
    const cache = await openCache();
    if (cache) {
        try {
            const hit = await cache.match(url);
            if (hit) {
                const at = Number(hit.headers.get(CACHED_AT_HEADER));
                if (at && Date.now() - at < TTL) {
                    return hit.arrayBuffer();
                }
            }
        } catch (e) {
            // fall through to network
        }
    }
    const response = await fetch(url);
    if (!response.ok) {
        const error = new Error(`Request returned status ${response.status}`);
        error.status = response.status;
        throw error;
    }
    const buffer = await response.arrayBuffer();
    if (cache) {
        try {
            cache.put(url, new Response(buffer, {headers: {[CACHED_AT_HEADER]: String(Date.now())}})).catch(() => null);
        } catch (e) {
            // cache full or unavailable; the fetch still succeeded
        }
    }
    return buffer;
};

const sharedFetch = url => {
    const failed = failures.get(url);
    if (failed && Date.now() - failed.at < FAILURE_TTL) {
        return Promise.reject(failed.error);
    }
    if (failed) failures.delete(url);
    let promise = inflight.get(url);
    if (!promise) {
        promise = fetchAndStore(url)
            .catch(error => {
                failures.set(url, {error, at: Date.now()});
                throw error;
            })
            .finally(() => inflight.delete(url));
        inflight.set(url, promise);
    }
    return promise;
};

const cachedFetchBuffer = url => {
    const warmed = preloaded.get(url);
    if (warmed && Date.now() - warmed.at < PRELOAD_TTL) {
        preloaded.delete(url);
        return Promise.resolve(warmed.buffer.slice(0));
    }
    if (warmed) preloaded.delete(url);
    return sharedFetch(url).then(buffer => buffer.slice(0));
};

const cachedFetchJson = url => sharedFetch(url)
    .then(buffer => JSON.parse(new TextDecoder().decode(buffer)));

const preloadContent = url => sharedFetch(url).then(buffer => {
    const entry = {buffer, at: Date.now()};
    preloaded.set(url, entry);
    setTimeout(() => {
        if (preloaded.get(url) === entry) preloaded.delete(url);
    }, PRELOAD_TTL);
    return null;
});

const clearContentCache = () => {
    preloaded.clear();
    failures.clear();
    try {
        if (typeof caches !== 'undefined') {
            caches.delete(CACHE_NAME).catch(() => null);
        }
    } catch (e) {
        // ignore
    }
};

export {cachedFetchBuffer, cachedFetchJson, preloadContent, clearContentCache};
