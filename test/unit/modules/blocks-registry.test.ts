import {beforeEach, describe, expect, jest, test} from '@jest/globals';
import type * as BlocksRegistry from '../../../src/modules/blocks-registry';

type Registry = typeof BlocksRegistry;

let registry: Registry;

beforeEach(async () => {
    jest.resetModules();
    registry = await import('../../../src/modules/blocks-registry');
});

describe('blocks-registry', () => {
    test('hands out the library once it is set, including to earlier waiters', async () => {
        const library = {name: 'ScratchBlocks'};
        expect(registry.getScratchBlocks()).toBeNull();
        const waiting = registry.whenScratchBlocks();
        registry.setScratchBlocks(library);
        await expect(waiting).resolves.toBe(library);
        await expect(registry.whenScratchBlocks()).resolves.toBe(library);
        expect(registry.getScratchBlocks()).toBe(library);
    });

    test('tells listeners when the active workspace changes, once per change', () => {
        const first = {id: 'first'};
        const listener = jest.fn();
        const stop = registry.onActiveWorkspace(listener);
        registry.setActiveWorkspace(first);
        registry.setActiveWorkspace(first);
        registry.setActiveWorkspace(null);
        expect(listener.mock.calls).toEqual([[first], [null]]);
        stop();
        registry.setActiveWorkspace(first);
        expect(listener).toHaveBeenCalledTimes(2);
        expect(registry.getActiveWorkspace()).toBe(first);
    });

    test('a listener may unsubscribe while being notified', () => {
        const later = jest.fn();
        const stop = registry.onActiveWorkspace(() => {
            stop();
        });
        registry.onActiveWorkspace(later);
        registry.setActiveWorkspace({});
        expect(later).toHaveBeenCalledTimes(1);
    });
});
