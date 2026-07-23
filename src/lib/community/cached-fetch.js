const CACHE_NAME = 'mw-project-content';
const TTL = 5 * 60 * 1000;
const CACHED_AT_HEADER = 'x-mw-cached-at';

const inflight = new Map();

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
        throw new Error(`Request returned status ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    if (cache) {
        try {
            await cache.put(url, new Response(buffer, {headers: {[CACHED_AT_HEADER]: String(Date.now())}}));
        } catch (e) {
            // cache full or unavailable; the fetch still succeeded
        }
    }
    return buffer;
};

const sharedFetch = url => {
    let promise = inflight.get(url);
    if (!promise) {
        promise = fetchAndStore(url).finally(() => inflight.delete(url));
        inflight.set(url, promise);
    }
    return promise;
};

const cachedFetchBuffer = url => sharedFetch(url).then(buffer => buffer.slice(0));

const cachedFetchJson = url => sharedFetch(url)
    .then(buffer => JSON.parse(new TextDecoder().decode(buffer)));

const clearContentCache = () => {
    try {
        if (typeof caches !== 'undefined') {
            caches.delete(CACHE_NAME).catch(() => null);
        }
    } catch (e) {
        // ignore
    }
};

export {cachedFetchBuffer, cachedFetchJson, clearContentCache};
