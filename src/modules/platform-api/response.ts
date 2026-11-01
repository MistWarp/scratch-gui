import type {ErrorFactory} from './types';

export const ROTUR_ACCOUNT_URL = 'https://rotur.dev/me';
export const RESTRICTED_CODES = ['banned', 'account_blocked', 'app_banned'];

export const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

export const stringField = (data: unknown, key: string): string | undefined => {
    const value = isRecord(data) ? data[key] : undefined;
    return typeof value === 'string' ? value : undefined;
};

export const isRestricted = (code: unknown): boolean => typeof code === 'string' && RESTRICTED_CODES.includes(code);

export const readJSON = async (response: Response): Promise<unknown> => {
    try {
        return await response.json();
    } catch {
        return {};
    }
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
        error.redirectUrl = stringField(data, 'redirectUrl') || stringField(data, 'redirect_url') ||
            (isRestricted(data.code) ? ROTUR_ACCOUNT_URL : null);
        throw error;
    }
    return data;
};
