import {getAppearanceSetting} from '../../../src/lib/mw-appearance-settings';
import {
    isBackpackAvailable,
    registerBackpackSaver,
    saveToBackpack
} from '../../../src/lib/backpack/save-to-backpack';

jest.mock('../../../src/lib/mw-appearance-settings', () => ({
    getAppearanceSetting: jest.fn(() => false)
}));

describe('saveToBackpack', () => {
    beforeEach(() => {
        getAppearanceSetting.mockReturnValue(false);
    });

    test('does nothing until a backpack registers', async () => {
        expect(isBackpackAvailable()).toBe(false);
        await expect(saveToBackpack({kind: 'script', blockId: 'a'})).resolves.toBe(false);
    });

    test('hands requests to the registered backpack', async () => {
        const saver = jest.fn(() => Promise.resolve(true));
        const unregister = registerBackpackSaver(saver);
        expect(isBackpackAvailable()).toBe(true);
        await expect(saveToBackpack({kind: 'script', blockId: 'a'})).resolves.toBe(true);
        expect(saver).toHaveBeenCalledWith({kind: 'script', blockId: 'a'});
        unregister();
        expect(isBackpackAvailable()).toBe(false);
    });

    test('is unavailable while the backpack is hidden in settings', async () => {
        const saver = jest.fn(() => Promise.resolve(true));
        const unregister = registerBackpackSaver(saver);
        getAppearanceSetting.mockReturnValue(true);
        expect(isBackpackAvailable()).toBe(false);
        await expect(saveToBackpack({kind: 'script', blockId: 'a'})).resolves.toBe(false);
        expect(saver).not.toHaveBeenCalled();
        unregister();
    });

    test('an old backpack unregistering does not remove a newer one', () => {
        const unregisterOld = registerBackpackSaver(jest.fn());
        const unregisterNew = registerBackpackSaver(jest.fn());
        unregisterOld();
        expect(isBackpackAvailable()).toBe(true);
        unregisterNew();
    });
});
