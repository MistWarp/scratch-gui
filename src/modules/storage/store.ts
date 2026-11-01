export interface KeyValueArea {
    readonly length: number;
    key(index: number): string | null;
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}

export interface Store {
    readString(key: string): string | null;
    readJSON<T>(key: string, fallback: T, isValid: (value: unknown) => value is T): T;
    readJSON(key: string, fallback?: unknown): unknown;
    readBoolean(key: string, fallback?: boolean): boolean;
    writeString(key: string, value: string): boolean;
    writeJSON(key: string, value: unknown): boolean;
    writeBoolean(key: string, value: boolean): boolean;
    remove(key: string): boolean;
    keys(): string[];
}

const resolve = (getArea: () => KeyValueArea | null | undefined): KeyValueArea | null => {
    try {
        return getArea() ?? null;
    } catch {
        return null;
    }
};

export const createStore = (getArea: () => KeyValueArea | null | undefined): Store => {
    const readString = (key: string): string | null => {
        const area = resolve(getArea);
        if (!area) return null;
        try {
            return area.getItem(key);
        } catch {
            return null;
        }
    };

    const writeString = (key: string, value: string): boolean => {
        const area = resolve(getArea);
        if (!area) return false;
        try {
            area.setItem(key, value);
            return true;
        } catch {
            return false;
        }
    };

    function readJSON<T> (key: string, fallback: T, isValid: (value: unknown) => value is T): T;
    function readJSON (key: string, fallback?: unknown): unknown;
    function readJSON (key: string, fallback?: unknown, isValid?: (value: unknown) => boolean): unknown {
        const raw = readString(key);
        if (raw === null) return fallback;
        try {
            const parsed: unknown = JSON.parse(raw);
            return !isValid || isValid(parsed) ? parsed : fallback;
        } catch {
            return fallback;
        }
    }

    const writeJSON = (key: string, value: unknown): boolean => {
        let serialized: string;
        try {
            serialized = JSON.stringify(value);
        } catch {
            return false;
        }
        return writeString(key, serialized);
    };

    const readBoolean = (key: string, fallback = false): boolean => {
        const raw = readString(key);
        if (raw === 'true') return true;
        if (raw === 'false') return false;
        return fallback;
    };

    const writeBoolean = (key: string, value: boolean): boolean => writeString(key, String(value));

    const remove = (key: string): boolean => {
        const area = resolve(getArea);
        if (!area) return false;
        try {
            area.removeItem(key);
            return true;
        } catch {
            return false;
        }
    };

    const keys = (): string[] => {
        const area = resolve(getArea);
        if (!area) return [];
        try {
            const found: string[] = [];
            for (let index = 0; index < area.length; index++) {
                const key = area.key(index);
                if (key !== null) found.push(key);
            }
            return found;
        } catch {
            return [];
        }
    };

    return {readString, readJSON, readBoolean, writeString, writeJSON, writeBoolean, remove, keys};
};
