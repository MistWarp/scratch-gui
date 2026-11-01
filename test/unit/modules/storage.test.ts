import {describe, expect, test} from '@jest/globals';
import {createStore, type KeyValueArea} from '../../../src/modules/storage';

const memoryArea = (): KeyValueArea & {entries: Map<string, string>} => {
    const entries = new Map<string, string>();
    return {
        entries,
        get length () {
            return entries.size;
        },
        key: index => [...entries.keys()][index] ?? null,
        getItem: key => entries.get(key) ?? null,
        setItem: (key, value) => {
            entries.set(key, value);
        },
        removeItem: key => {
            entries.delete(key);
        }
    };
};

const throwingArea: KeyValueArea = {
    get length (): number {
        throw new Error('SecurityError');
    },
    key: () => {
        throw new Error('SecurityError');
    },
    getItem: () => {
        throw new Error('SecurityError');
    },
    setItem: () => {
        throw new Error('QuotaExceededError');
    },
    removeItem: () => {
        throw new Error('SecurityError');
    }
};

const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every(item => typeof item === 'string');

describe('createStore', () => {
    test('round trips strings, JSON and booleans', () => {
        const area = memoryArea();
        const store = createStore(() => area);
        expect(store.writeString('a', 'text')).toBe(true);
        expect(store.writeJSON('b', {list: [1, 2]})).toBe(true);
        expect(store.writeBoolean('c', true)).toBe(true);
        expect(store.readString('a')).toBe('text');
        expect(store.readJSON('b', null)).toEqual({list: [1, 2]});
        expect(store.readBoolean('c')).toBe(true);
        expect(area.entries.get('c')).toBe('true');
    });

    test('returns the fallback for missing keys', () => {
        const store = createStore(memoryArea);
        expect(store.readString('missing')).toBeNull();
        expect(store.readJSON('missing', [1])).toEqual([1]);
        expect(store.readBoolean('missing')).toBe(false);
        expect(store.readBoolean('missing', true)).toBe(true);
    });

    test('keeps an empty string instead of the fallback', () => {
        const area = memoryArea();
        area.entries.set('empty', '');
        expect(createStore(() => area).readString('empty') ?? 'fallback').toBe('');
    });

    test('returns the fallback for malformed or invalid JSON', () => {
        const area = memoryArea();
        area.entries.set('broken', '{not json');
        area.entries.set('numbers', '[1, 2]');
        area.entries.set('names', '["a", "b"]');
        const store = createStore(() => area);
        expect(store.readJSON('broken', 'fallback')).toBe('fallback');
        expect(store.readJSON('numbers', [], isStringArray)).toEqual([]);
        expect(store.readJSON('names', [], isStringArray)).toEqual(['a', 'b']);
    });

    test('treats anything other than true or false as the boolean fallback', () => {
        const area = memoryArea();
        area.entries.set('flag', 'yes');
        expect(createStore(() => area).readBoolean('flag', true)).toBe(true);
    });

    test('reports failure instead of throwing when storage is blocked', () => {
        const store = createStore(() => throwingArea);
        expect(store.readString('a')).toBeNull();
        expect(store.readJSON('a', 1)).toBe(1);
        expect(store.writeString('a', 'b')).toBe(false);
        expect(store.writeJSON('a', 1)).toBe(false);
        expect(store.remove('a')).toBe(false);
        expect(store.keys()).toEqual([]);
    });

    test('reports failure when the storage area itself is unavailable', () => {
        const store = createStore(() => {
            throw new Error('localStorage is not available');
        });
        expect(store.readString('a')).toBeNull();
        expect(store.writeString('a', 'b')).toBe(false);
        expect(createStore(() => null).writeBoolean('a', true)).toBe(false);
    });

    test('does not write values JSON cannot serialize', () => {
        const area = memoryArea();
        const cyclic: Record<string, unknown> = {};
        cyclic.self = cyclic;
        expect(createStore(() => area).writeJSON('cyclic', cyclic)).toBe(false);
        expect(area.entries.has('cyclic')).toBe(false);
    });

    test('lists keys', () => {
        const area = memoryArea();
        area.entries.set('a', '1');
        area.entries.set('b', '2');
        expect(createStore(() => area).keys()).toEqual(['a', 'b']);
    });

    test('reports whether the area can be read', () => {
        expect(createStore(memoryArea).isAvailable()).toBe(true);
        expect(createStore(() => throwingArea).isAvailable()).toBe(false);
        expect(createStore(() => null).isAvailable()).toBe(false);
    });

    test('removes keys', () => {
        const area = memoryArea();
        area.entries.set('a', '1');
        expect(createStore(() => area).remove('a')).toBe(true);
        expect(area.entries.has('a')).toBe(false);
    });
});
