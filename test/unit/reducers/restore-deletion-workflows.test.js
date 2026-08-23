import {singleFlightRestore} from '../../../src/reducers/restore-deletion.js';

describe('deletion restore state', () => {
    test('keyboard and button undo share one in-flight restoration', async () => {
        let finishRestore;
        const restore = jest.fn(() => new Promise(resolve => {
            finishRestore = resolve;
        }));
        const guardedRestore = singleFlightRestore(restore);

        const keyboardUndo = guardedRestore();
        const buttonUndo = guardedRestore();
        await Promise.resolve();

        expect(buttonUndo).toBe(keyboardUndo);
        expect(restore).toHaveBeenCalledTimes(1);
        finishRestore(true);
        await keyboardUndo;
        await expect(guardedRestore()).resolves.toBe(false);
        expect(restore).toHaveBeenCalledTimes(1);
    });

    test('a failed restoration can be retried', async () => {
        const restore = jest.fn()
            .mockRejectedValueOnce(new Error('restore failed'))
            .mockResolvedValueOnce(true);
        const guardedRestore = singleFlightRestore(restore);

        await expect(guardedRestore()).rejects.toThrow('restore failed');
        await expect(guardedRestore()).resolves.toBe(true);
        expect(restore).toHaveBeenCalledTimes(2);
    });
});
