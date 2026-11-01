import type {Store} from '../storage';
import {createClient, type PlatformClient} from './client';
import {createResponseCache, type ResponseCache} from './response-cache';
import {createSessionManager, type SessionManager} from './session';
import type {CredentialStore, ErrorFactory, Fetch} from './types';

export type {JsonBody, PlatformClient, RequestOptions, UploadProgress} from './client';
export type {CachedPathTest, ResponseCache} from './response-cache';
export type {SessionEvents, SessionManager} from './session';
export type {ApiError, AuthResult, CredentialStore, ErrorFactory, Fetch, SessionProvider} from './types';
export {staleCacheTest} from './response-cache';
export {banMessage, isRestricted, RESTRICTED_CODES} from './session';

export interface PlatformApiOptions {
    baseUrl: string;
    credentials: CredentialStore;
    cacheStore: Store;
    errors: ErrorFactory;
    fetch?: Fetch;
    onSuccess?: (path: string, method: string) => void;
}

export interface PlatformApi extends PlatformClient {
    readonly session: SessionManager;
    readonly cache: ResponseCache;
}

const globalFetch: Fetch = (input, init) => globalThis.fetch(input, init);

export const createPlatformApi = (
    {baseUrl, credentials, cacheStore, errors, fetch = globalFetch, onSuccess}: PlatformApiOptions
): PlatformApi => {
    const cache = createResponseCache({store: cacheStore});
    const session = createSessionManager({baseUrl, credentials, cache, errors, fetch});
    const client = createClient({baseUrl, session, cache, errors, fetch, onSuccess});
    return {...client, session, cache};
};
