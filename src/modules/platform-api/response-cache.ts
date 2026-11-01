import type {Store} from '../storage';

const KEY_PREFIX = 'mw:api-cache:';
const DEFAULT_TTL = 60 * 1000;

const SCOPED_COLLECTIONS = ['projects', 'spaces', 'users', 'news', 'roadmap', 'bounties'];
const COLLECTION_PAGES = ['featured', 'random'];
const WIDE_ACTIONS = ['remix', 'publish', 'unpublish', 'visibility', 'restore', 'upload', 'history'];

export type CachedPathTest = (path: string) => boolean;

interface CacheEntry {
    data: unknown;
    at: number;
}

const isCacheEntry = (value: unknown): value is CacheEntry =>
    typeof value === 'object' && value !== null && 'at' in value && 'data' in value;

const pathSegments = (path: string): string[] => (path.split('?')[0] ?? '').split('/').filter(Boolean);

export const isCacheNeutral = (path: string): boolean =>
    path.endsWith('/view') || path.endsWith('/live') || path === '/errors';

export const staleCacheTest = (method: string, path: string): CachedPathTest | null => {
    const [collection, id, action] = pathSegments(path);
    if (!collection || !SCOPED_COLLECTIONS.includes(collection) || !id || COLLECTION_PAGES.includes(id)) return null;
    if ((action && WIDE_ACTIONS.includes(action)) || (!action && method === 'DELETE')) return null;
    const item = id.toLowerCase();
    return cached => {
        const [cachedCollection, cachedId] = pathSegments(cached);
        const otherItem = cachedCollection === collection && Boolean(cachedId) &&
            !COLLECTION_PAGES.includes(cachedId ?? '') && cachedId?.toLowerCase() !== item;
        return !otherItem;
    };
};

export interface ResponseCache {
    readonly generation: number;
    keyFor(path: string, session: string | null): string;
    read(key: string): unknown;
    write(key: string, data: unknown): void;
    pending(key: string): Promise<unknown> | undefined;
    track<T>(key: string, request: Promise<T>): Promise<T>;
    invalidate(test?: CachedPathTest | null): void;
    resetRequests(): void;
}

export interface ResponseCacheOptions {
    store: Store;
    now?: () => number;
    ttl?: number;
}

export const createResponseCache = (
    {store, now = () => Date.now(), ttl = DEFAULT_TTL}: ResponseCacheOptions
): ResponseCache => {
    let generation = 0;
    const inFlight = new Map<string, Promise<unknown>>();

    const pathOf = (key: string): string => {
        const start = key.indexOf(':/', KEY_PREFIX.length);
        return start === -1 ? '' : key.slice(start + 1);
    };

    const invalidate = (test: CachedPathTest | null = null): void => {
        generation += 1;
        for (const key of [...inFlight.keys()]) {
            if (!test || test(pathOf(key))) inFlight.delete(key);
        }
        for (const key of store.keys()) {
            if (key.startsWith(KEY_PREFIX) && (!test || test(pathOf(key)))) store.remove(key);
        }
    };

    const read = (key: string): unknown => {
        const entry = store.readJSON<CacheEntry | null>(key, null, isCacheEntry);
        if (!entry) return null;
        if (!entry.at || now() - entry.at > ttl) {
            store.remove(key);
            return null;
        }
        return entry.data;
    };

    const write = (key: string, data: unknown): void => {
        if (!store.writeJSON(key, {data, at: now()})) invalidate();
    };

    const track = async <T>(key: string, request: Promise<T>): Promise<T> => {
        inFlight.set(key, request);
        try {
            return await request;
        } finally {
            if (inFlight.get(key) === request) inFlight.delete(key);
        }
    };

    return {
        get generation () {
            return generation;
        },
        keyFor: (path, session) => `${KEY_PREFIX}${session ? session.slice(-8) : 'anon'}:${path}`,
        read,
        write,
        pending: key => inFlight.get(key),
        track,
        invalidate,
        resetRequests: () => {
            generation += 1;
            inFlight.clear();
        }
    };
};
