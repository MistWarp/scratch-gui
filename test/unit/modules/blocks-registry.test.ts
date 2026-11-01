import {afterEach, describe, expect, jest, test} from '@jest/globals';
import {
    type BlocksWorkspace,
    type ScratchBlocksLibrary,
    getActiveWorkspace,
    getScratchBlocks,
    onActiveWorkspace,
    resetBlocksRegistryForTests,
    setActiveWorkspace,
    setScratchBlocks,
    whenScratchBlocks
} from '../../../src/modules/blocks-registry';

const fakeWorkspace = (id: string): BlocksWorkspace => ({
    id,
    getBlockById: () => null,
    getAllBlocks: () => [],
    getTopBlocks: () => [],
    addChangeListener: listener => listener,
    removeChangeListener: () => undefined,
    getParentSvg: () => null
});

const fakeLibrary = (main: BlocksWorkspace | null = null): ScratchBlocksLibrary => ({
    getMainWorkspace: () => main,
    Events: {
        fire: () => undefined,
        disable: () => undefined,
        enable: () => undefined,
        isEnabled: () => true
    },
    Xml: {
        domToText: () => '',
        textToDom: () => document.createElement('xml'),
        blockToDom: () => document.createElement('block')
    }
});

afterEach(() => {
    resetBlocksRegistryForTests();
});

describe('blocks-registry', () => {
    test('hands out the library once it is set, including to earlier waiters', async () => {
        const library = fakeLibrary();
        expect(getScratchBlocks()).toBeNull();
        const waiting = whenScratchBlocks();
        setScratchBlocks(library);
        await expect(waiting).resolves.toBe(library);
        await expect(whenScratchBlocks()).resolves.toBe(library);
        expect(getScratchBlocks()).toBe(library);
    });

    test('tells listeners when the active workspace changes, once per change', () => {
        const first = fakeWorkspace('first');
        const listener = jest.fn();
        const stop = onActiveWorkspace(listener);
        setActiveWorkspace(first);
        setActiveWorkspace(first);
        setActiveWorkspace(null);
        expect(listener.mock.calls).toEqual([[first], [null]]);
        stop();
        setActiveWorkspace(first);
        expect(listener).toHaveBeenCalledTimes(2);
        expect(getActiveWorkspace()).toBe(first);
    });

    test('a listener may unsubscribe while being notified', () => {
        const later = jest.fn();
        const stop = onActiveWorkspace(() => {
            stop();
        });
        onActiveWorkspace(later);
        setActiveWorkspace(fakeWorkspace('only'));
        expect(later).toHaveBeenCalledTimes(1);
    });

    test('the test reset forgets the library, the workspace, waiters and listeners', async () => {
        const listener = jest.fn();
        onActiveWorkspace(listener);
        setScratchBlocks(fakeLibrary());
        setActiveWorkspace(fakeWorkspace('before'));
        resetBlocksRegistryForTests();
        expect(getScratchBlocks()).toBeNull();
        expect(getActiveWorkspace()).toBeNull();

        const waiting = whenScratchBlocks();
        resetBlocksRegistryForTests();
        const resolved = jest.fn();
        void waiting.then(resolved);
        setScratchBlocks(fakeLibrary());
        await Promise.resolve();
        expect(resolved).not.toHaveBeenCalled();

        setActiveWorkspace(fakeWorkspace('after'));
        expect(listener).toHaveBeenCalledTimes(1);
    });
});
