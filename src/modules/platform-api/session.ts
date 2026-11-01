import type {ResponseCache} from './response-cache';
import {isRecord, isRestricted, parseResponse, readJSON, ROTUR_ACCOUNT_URL, stringField} from './response';
import type {ApiError, AuthResult, CredentialStore, ErrorFactory, Fetch, SessionProvider} from './types';

const SESSION_KEY = 'mw:mistwarp-session';
const SESSION_WAIT = 15000;
const VALIDATOR_URL = 'https://api.rotur.dev/v2/validators';
const VALIDATOR_KEYS = ['app_1938b6a87799f862', 'mistwarp'];

export const banMessage = ({message, data}: {message: string; data?: unknown}): string => {
    const reason = stringField(data, 'reason');
    const until = isRecord(data) ? data.until : undefined;
    const ends = typeof until === 'string' || typeof until === 'number' ?
        `${message.replace(/\.$/, '')} until ${new Date(until).toLocaleDateString()}.` :
        message;
    return reason ? `${ends} Reason: ${reason}` : ends;
};

const toAuthResult = (data: Record<string, unknown>): AuthResult => ({
    ...data,
    token: typeof data.token === 'string' ? data.token : undefined,
    minor: typeof data.minor === 'boolean' ? data.minor : undefined
});

export interface SessionEvents {
    onSignedIn?: (auth: AuthResult) => void;
    onAuthInvalid?: () => void;
    onBanned?: (message: string, redirectUrl: string) => void;
}

export interface SessionManagerOptions {
    baseUrl: string;
    credentials: CredentialStore;
    cache: ResponseCache;
    errors: ErrorFactory;
    fetch: Fetch;
}

export interface SessionManager {
    load(): string | null;
    store(token: string | null | undefined): void;
    current(): Promise<string | null>;
    refresh(): Promise<string | AuthResult | null | undefined>;
    hasProvider(): boolean;
    setProvider(provider: SessionProvider | null): void;
    setRoturTokenGetter(getter: () => Promise<string | null>): void;
    setEvents(events: SessionEvents): void;
    requestValidator(roturToken: string, key: string): Promise<string>;
    exchangeValidator(roturToken: string): Promise<AuthResult>;
    runExchange(roturToken: string): Promise<AuthResult>;
}

export const createSessionManager = (
    {baseUrl, credentials, cache, errors, fetch}: SessionManagerOptions
): SessionManager => {
    let provider: SessionProvider | null = null;
    let roturTokenGetter: () => Promise<string | null> = () => Promise.resolve(null);
    let events: SessionEvents = {};
    let exchangeInFlight: Promise<AuthResult> | null = null;

    const load = (): string | null => {
        if (provider) return provider.get() || null;
        try {
            return credentials.getItem(SESSION_KEY) || null;
        } catch {
            return null;
        }
    };

    const store = (token: string | null | undefined): void => {
        if (provider) {
            if (!token) provider.clear();
            cache.resetRequests();
            return;
        }
        try {
            const previous = credentials.getItem(SESSION_KEY);
            if (token) {
                credentials.setItem(SESSION_KEY, token);
            } else {
                credentials.removeItem(SESSION_KEY);
            }
            if (previous !== token) cache.resetRequests();
        } catch {
            return;
        }
    };

    const requestValidator = async (roturToken: string, key: string): Promise<string> => {
        const response = await fetch(VALIDATOR_URL, {
            method: 'POST',
            headers: {'Authorization': `Bearer ${roturToken}`, 'Content-Type': 'application/json'},
            body: JSON.stringify({key})
        });
        const data = await readJSON(response);
        const validator = stringField(data, 'validator');
        if (validator) return validator;
        const serverError = stringField(data, 'error');
        const code = stringField(data, 'code');
        const error: ApiError = new Error(serverError || 'Could not validate Rotur login');
        error.status = response.status;
        const permissionError = /lacks permission|OAuth access tokens/i.test(serverError || '');
        if (response.status === 403 && !permissionError) error.code = code || 'account_blocked';
        else if (response.status === 429 || response.status >= 500) error.code = code || 'VALIDATOR_UNAVAILABLE';
        else error.code = code || 'VALIDATOR_GENERATION_FAILED';
        error.redirectUrl = stringField(data, 'redirect_url') || ROTUR_ACCOUNT_URL;
        error.data = data;
        throw error;
    };

    const isRefused = async (response: Response): Promise<boolean> => {
        if (response.status === 401) return true;
        if (response.status !== 403) return false;
        return stringField(await readJSON(response.clone()), 'code') === 'invalid_validator';
    };

    const exchangeValidator = async (roturToken: string): Promise<AuthResult> => {
        let authResponse: Response | undefined;
        for (const key of VALIDATOR_KEYS) {
            let validator: string;
            try {
                validator = await requestValidator(roturToken, key);
            } catch (error) {
                const failure = error as ApiError;
                if (isRestricted(isRecord(failure.data) ? failure.data.code : undefined)) throw failure;
                if (authResponse) break;
                if (key === VALIDATOR_KEYS[VALIDATOR_KEYS.length - 1]) throw failure;
                continue;
            }
            authResponse = await fetch(`${baseUrl}/auth?v=${encodeURIComponent(validator)}`, {method: 'POST'});
            if (!(await isRefused(authResponse))) break;
        }
        if (!authResponse) throw new Error('Could not validate Rotur login');
        const auth = toAuthResult(await parseResponse(authResponse, errors));
        store(auth.token);
        events.onSignedIn?.(auth);
        return auth;
    };

    const runExchange = (roturToken: string): Promise<AuthResult> => {
        exchangeInFlight ??= exchangeValidator(roturToken)
            .catch((error: unknown) => {
                const failure = error as ApiError;
                if (failure.code === 'VALIDATOR_GENERATION_FAILED') events.onAuthInvalid?.();
                if (isRestricted(failure.code)) {
                    events.onBanned?.(banMessage(failure), failure.redirectUrl || ROTUR_ACCOUNT_URL);
                }
                throw failure;
            })
            .finally(() => {
                exchangeInFlight = null;
            });
        return exchangeInFlight;
    };

    const current = async (): Promise<string | null> => {
        if (!provider) return load();
        const existing = provider.get();
        if (existing) return existing;
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
            const waited = await Promise.race([
                provider.refresh(),
                new Promise<null>(resolve => {
                    timer = setTimeout(() => {
                        resolve(null);
                    }, SESSION_WAIT);
                })
            ]);
            return waited || null;
        } catch {
            return null;
        } finally {
            clearTimeout(timer);
        }
    };

    const refresh = async (): Promise<string | AuthResult | null | undefined> => {
        if (provider) {
            try {
                return await provider.refresh();
            } catch {
                return null;
            }
        }
        const roturToken = await roturTokenGetter();
        if (!roturToken) return null;
        return runExchange(roturToken);
    };

    return {
        load,
        store,
        current,
        refresh,
        hasProvider: () => provider !== null,
        setProvider: next => {
            provider = next;
            cache.resetRequests();
        },
        setRoturTokenGetter: getter => {
            roturTokenGetter = getter;
        },
        setEvents: next => {
            events = next;
        },
        requestValidator,
        exchangeValidator,
        runExchange
    };
};
