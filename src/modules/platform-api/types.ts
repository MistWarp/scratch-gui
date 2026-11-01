export interface ApiError extends Error {
    status?: number;
    code?: string;
    data?: unknown;
    serverMessage?: string;
    redirectUrl?: string | null;
    friendly?: boolean;
}

export interface ResponseErrorDetails {
    status: number;
    code?: string;
    serverMessage?: string;
    data: unknown;
}

export interface ErrorFactory {
    response(details: ResponseErrorDetails): ApiError;
    network(cause?: unknown): ApiError;
    timeout(cause?: unknown): ApiError;
}

export interface CredentialStore {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}

export interface SessionProvider {
    get(): string | null | undefined;
    clear(): void;
    refresh(): Promise<string | null | undefined>;
}

export interface AuthResult {
    token: string;
    minor?: boolean;
    [key: string]: unknown;
}

export type Fetch = (input: string, init?: RequestInit) => Promise<Response>;
