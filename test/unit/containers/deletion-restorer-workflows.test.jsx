import {DeletionRestorer} from '../../../src/containers/deletion-restorer.jsx';

const makeRestorer = overrides => {
    const restorer = new DeletionRestorer({
        children: jest.fn(),
        deletedItem: 'Sprite',
        dispatchUpdateRestore: jest.fn(),
        onShowRestoreError: jest.fn(),
        restore: jest.fn(() => Promise.resolve()),
        ...overrides
    });
    restorer.setState = update => {
        restorer.state = {...restorer.state, ...update};
    };
    return restorer;
};

describe('deletion restorer workflows', () => {
    test('runs restore once and consumes undo only after success', async () => {
        let finishRestore;
        const restore = jest.fn(() => new Promise(resolve => {
            finishRestore = resolve;
        }));
        const restorer = makeRestorer({restore});

        const firstRestore = restorer.restoreDeletion();
        restorer.restoreDeletion();
        await Promise.resolve();
        expect(restore).toHaveBeenCalledTimes(1);
        expect(restorer.props.dispatchUpdateRestore).not.toHaveBeenCalled();

        finishRestore();
        await firstRestore;
        expect(restorer.props.dispatchUpdateRestore).toHaveBeenCalledWith({
            restoreFun: null,
            deletedItem: ''
        });
    });

    test('keeps undo available and shows an error when restore fails', async () => {
        const restore = jest.fn(() => Promise.reject(new Error('restore failed')));
        const restorer = makeRestorer({restore});

        await expect(restorer.restoreDeletion()).resolves.toBe(false);

        expect(restorer.props.dispatchUpdateRestore).not.toHaveBeenCalled();
        expect(restorer.props.onShowRestoreError).toHaveBeenCalledTimes(1);
        expect(restorer.state.restoring).toBe(false);
    });
});
