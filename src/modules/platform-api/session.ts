import type {ResponseCache} from './response-cache';
import type {ApiError, AuthResult, CredentialStore, ErrorFactory, Fetch, SessionProvider} from './types';

const SESSION_KEY = 'mw:mistwarp-session';
const SESSION_WAIT = 15000;
const VALIDATOR_URL = 'https://api.rotur.dev/v2/validators';
const VALIDATOR_KEYS = ['app_1938b6a87799f862', 'mistwarp'];
const ROTUR_ACCOUNT_URL = 'https://rotur.dev/me';

export const RESTRICTED_CODES = ['banned', 'account_blocked', 'app_banned'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const stringField = (data: unknown, key: string): string | undefined => {
    const value = isRecord(data) ? data[key] : undefined;
    return typeof value === 'string' ? value : undefined;
};

const readJSON = async (response: Response): Promise<unknown> => {
    try {
        return await response.json();
    } catch {
        return {};
    }
};

export const isRestricted = (code: unknown): boolean => typeof code === 'string' && RESTRICTED_CODES.includes(code);

export const banMessage = ({message, data}: {message: string; data?: unknown}): string => {
    const reason = stringField(data, 'reason');
    const until = isRecord(data) ? data.until : undefined;
    const ends = until ?
        `${message.replace(/\.$/, '')} until ${new Date(until as string | number).toLocaleDateString()}.` :
        message;
    return reason ? `${ends} Reason: ${reason}` : ends;
};

export const parseResponse = async (response: Response, errors: ErrorFactory): Promise<Record<string, unknown>> => {
    const parsed = await readJSON(response);
    const data = isRecord(parsed) ? parsed : {};
    if (!response.ok || data.ok === false || data.error) {
        const error = errors.response({
            status: response.status,
            code: stringField(data, 'code'),
            serverMessage: stringField(data, 'error'),
            data
        });
        error.redirectUrl = stringField(data, 'redirectUrl') ?? stringField(data, 'redirect_url') ??
            (isRestricted(data.code) ? ROTUR_ACCOUNT_URL : null);
        throw error;
    }
    return data;
};

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
    store(token: string | null): void;
    current(): Promise<string | null>;
    refresh(): Promise<unknown>;
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

    const forgetRequests = (): void => {
        cache.resetRequests();
    };

    const load = (): string | null => {
        if (provider) return provider.get() ?? null;
        try {
            return credentials.getItem(SESSION_KEY) ?? null;
        } catch {
            return null;
        }
    };

    const store = (token: string | null): void => {
        if (provider) {
            if (!token) provider.clear();
            forgetRequests();
            return;
        }
        try {
            const previous = credentials.getItem(SESSION_KEY);
            if (token) {
                credentials.setItem(SESSION_KEY, token);
            } else {
                credentials.removeItem(SESSION_KEY);
            }
            if (previous !== token) forgetRequests();
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
        const error: ApiError = new Error(serverError ?? 'Could not validate Rotur login');
        error.status = response.status;
        const permissionError = /lacks permission|OAuth access tokens/i.test(serverError ?? '');
        if (response.status === 403 && !permissionError) error.code = code ?? 'account_blocked';
        else if (response.status === 429 || response.status >= 500) error.code = code ?? 'VALIDATOR_UNAVAILABLE';
        else error.code = code ?? 'VALIDATOR_GENERATION_FAILED';
        error.redirectUrl = stringField(data, 'redirect_url') ?? ROTUR_ACCOUNT_URL;
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
        const auth = await parseResponse(authResponse, errors) as AuthResult;
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
                    events.onBanned?.(banMessage(failure), failure.redirectUrl ?? ROTUR_ACCOUNT_URL);
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
            return waited ?? null;
        } catch {
            return null;
        } finally {
            clearTimeout(timer);
        }
    };

    const refresh = async (): Promise<unknown> => {
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
            forgetRequests();
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
