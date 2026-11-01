import {isCacheNeutral, staleCacheTest, type ResponseCache} from './response-cache';
import {parseResponse, type SessionManager} from './session';
import type {ApiError, ErrorFactory, Fetch} from './types';

const GET_TIMEOUT = 15000;
const GET_RETRY_DELAY = 400;
const UPLOAD_STALL_TIMEOUT = 120000;
const UPLOAD_PROCESSING_TIMEOUT = 180000;

export type JsonBody = FormData | Record<string, unknown> | unknown[] | string | number | boolean | null;

export interface RequestOptions {
    method?: string;
    body?: JsonBody;
    headers?: Record<string, string>;
    cache?: boolean;
    timeoutMs?: number;
}

export type UploadProgress = (loaded: number, total: number) => void;

export interface ClientOptions {
    baseUrl: string;
    session: SessionManager;
    cache: ResponseCache;
    errors: ErrorFactory;
    fetch: Fetch;
    onSuccess?: (path: string, method: string) => void;
}

export interface PlatformClient {
    request<T = unknown>(path: string, options?: RequestOptions): Promise<T>;
    requestRaw(path: string, options?: RequestOptions): Promise<Response>;
    upload<T = unknown>(path: string, form: FormData, onProgress?: UploadProgress): Promise<T>;
    logout(): Promise<void>;
}

const sleep = (ms: number): Promise<void> => new Promise(resolve => {
    setTimeout(resolve, ms);
});

const isAuthPath = (path: string): boolean => path.startsWith('/auth') || path.startsWith('/logout');

export const createClient = (
    {baseUrl, session, cache, errors, fetch, onSuccess}: ClientOptions
): PlatformClient => {
    const send = async (path: string, raw: boolean, options: RequestOptions): Promise<unknown> => {
        const {method = 'GET', body, headers = {}, timeoutMs} = options;
        const cacheable = method === 'GET' && !raw && options.cache !== false;
        if (cacheable && session.hasProvider()) await session.current();
        const cacheKey = cacheable ? cache.keyFor(path, session.load()) : '';
        const timeout = timeoutMs ?? (method === 'GET' && !raw ? GET_TIMEOUT : 0);
        if (cacheable) {
            const hit = cache.read(cacheKey);
            if (hit) return hit;
            const pending = cache.pending(cacheKey);
            if (pending) return pending;
        } else if (method !== 'GET' && !isCacheNeutral(path)) {
            cache.invalidate(staleCacheTest(method, path));
        }
        const generation = cache.generation;

        const fetchWith = (token: string | null): Promise<Response> => {
            const finalHeaders: Record<string, string> = {...headers};
            if (token) finalHeaders.Authorization = `Bearer ${token}`;
            const init: RequestInit = {method, headers: finalHeaders};
            if (body instanceof FormData) {
                init.body = body;
            } else if (body !== undefined) {
                finalHeaders['Content-Type'] = 'application/json';
                init.body = JSON.stringify(body);
            }
            const controller = timeout ? new AbortController() : null;
            if (controller) init.signal = controller.signal;
            const timer = controller ? setTimeout(() => {
                controller.abort();
            }, timeout) : null;
            return fetch(`${baseUrl}${path}`, init)
                .catch((error: unknown) => {
                    if (controller?.signal.aborted) throw errors.timeout(error);
                    throw errors.network(error);
                })
                .finally(() => {
                    if (timer) clearTimeout(timer);
                });
        };

        const fetchOnce = async (): Promise<Response> =>
            fetchWith(session.hasProvider() ? await session.current() : session.load());

        const fetchWithRetry = async (): Promise<Response> => {
            if (method !== 'GET') return fetchOnce();
            try {
                const response = await fetchOnce();
                if (!(response.status >= 500)) return response;
            } catch (error) {
                if ((error as ApiError).code !== 'network') throw error;
            }
            await sleep(GET_RETRY_DELAY);
            return fetchOnce();
        };

        const retryWithFreshSession = async (rejected: Response): Promise<Response> => {
            try {
                return (await session.refresh()) ? await fetchWithRetry() : rejected;
            } catch {
                return rejected;
            }
        };

        const run = async (): Promise<unknown> => {
            let response = await fetchWithRetry();
            if (response.status === 401 && !isAuthPath(path)) {
                session.store(null);
                response = await retryWithFreshSession(response);
            }
            if (path === '/me' && response.status === 401) session.store(null);
            if (raw) return response;
            const data = await parseResponse(response, errors);
            onSuccess?.(path, method);
            if (cacheable && generation === cache.generation) cache.write(cacheKey, data);
            return data;
        };

        return cacheable ? cache.track(cacheKey, run()) : run();
    };

    const sendUpload = (path: string, form: FormData, onProgress: UploadProgress | undefined, token: string | null) =>
        new Promise<unknown>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            let timeoutId: ReturnType<typeof setTimeout> | null = null;
            let settled = false;
            const settle = <V>(callback: (value: V) => void) => (value: V): void => {
                if (settled) return;
                settled = true;
                if (timeoutId) clearTimeout(timeoutId);
                callback(value);
            };
            const finishResolve = settle(resolve);
            const finishReject = settle(reject);
            const scheduleTimeout = (delay: number, processing: boolean): void => {
                if (timeoutId) clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    const error: ApiError = new Error(processing ?
                        'The upload finished, but the server took too long to respond. It may still finish in the ' +
                            'background; check My Stuff before retrying.' :
                        'The upload stopped making progress. Check your connection and try again.');
                    error.code = processing ? 'upload_processing_timeout' : 'upload_stalled';
                    finishReject(error);
                    xhr.abort();
                }, delay);
            };
            xhr.open('POST', `${baseUrl}${path}`);
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.upload.onprogress = event => {
                if (settled) return;
                const done = event.lengthComputable && event.loaded >= event.total;
                scheduleTimeout(done ? UPLOAD_PROCESSING_TIMEOUT : UPLOAD_STALL_TIMEOUT, done);
                if (event.lengthComputable && onProgress) onProgress(event.loaded, event.total);
            };
            xhr.onerror = () => {
                finishReject(errors.network());
            };
            xhr.onabort = () => {
                if (!settled) finishReject(new Error('Upload cancelled'));
            };
            xhr.onload = () => {
                let data: Record<string, unknown> = {};
                try {
                    const parsed: unknown = JSON.parse(xhr.responseText);
                    if (typeof parsed === 'object' && parsed !== null) data = parsed as Record<string, unknown>;
                } catch {
                    data = {};
                }
                if (xhr.status >= 200 && xhr.status < 300 && data.ok !== false && !data.error) {
                    finishResolve(data);
                    return;
                }
                finishReject(errors.response({
                    status: xhr.status,
                    code: typeof data.code === 'string' ? data.code : undefined,
                    serverMessage: typeof data.error === 'string' ? data.error : undefined,
                    data
                }));
            };
            scheduleTimeout(UPLOAD_STALL_TIMEOUT, false);
            xhr.send(form);
        });

    const upload = async <T>(path: string, form: FormData, onProgress?: UploadProgress): Promise<T> => {
        const token = session.hasProvider() ? await session.current() : session.load();
        return sendUpload(path, form, onProgress, token) as Promise<T>;
    };

    const request = <T>(path: string, options: RequestOptions = {}): Promise<T> =>
        send(path, false, options) as Promise<T>;

    const requestRaw = (path: string, options: RequestOptions = {}): Promise<Response> =>
        send(path, true, options) as Promise<Response>;

    const logout = async (): Promise<void> => {
        try {
            await request('/logout', {method: 'POST'});
        } finally {
            session.store(null);
        }
    };

    return {request, requestRaw, upload, logout};
};
