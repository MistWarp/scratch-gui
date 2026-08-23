import {Backpack} from '../../../src/containers/backpack.jsx';
import {
    costumePayload,
    saveBackpackObject,
    updateBackpackObject
} from '../../../src/lib/api/backpack';
import storage from '../../../src/lib/persistence/storage';
import DragConstants from '../../../src/lib/constants/drag-constants';

jest.mock('../../../src/lib/api/backpack', () => ({
    LOCAL_API: 'local',
    costumePayload: jest.fn(() => Promise.resolve({type: 'costume'})),
    soundPayload: jest.fn(),
    spritePayload: jest.fn(),
    codePayload: jest.fn(),
    getBackpackContents: jest.fn(),
    saveBackpackObject: jest.fn(() => Promise.resolve({id: 'saved', name: 'Costume'})),
    deleteBackpackObject: jest.fn(),
    updateBackpackObject: jest.fn()
}));
jest.mock('../../../src/lib/persistence/storage', () => ({
    AssetType: {
        ImageVector: 'ImageVector',
        ImageBitmap: 'ImageBitmap',
        Sound: 'Sound'
    },
    _hasAddedBackpackSource: false,
    addWebSource: jest.fn(),
    store: jest.fn(() => Promise.resolve())
}));

const makeBackpack = overrides => {
    const backpack = new Backpack({
        host: 'https://backpack.example',
        intl: {formatMessage: jest.fn(message => message.defaultMessage)},
        token: 'token',
        username: 'user',
        openSimpleDialog: jest.fn(),
        vm: {},
        ...overrides
    });
    backpack.setState = (update, callback) => {
        const nextState = typeof update === 'function' ? update(backpack.state, backpack.props) : update;
        backpack.state = {...backpack.state, ...nextState};
        if (callback) callback();
    };
    return backpack;
};

describe('backpack workflows', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('pre-saves a dirty remote asset before adding it to the backpack', async () => {
        const asset = {
            assetId: 'asset',
            assetType: 'ImageBitmap',
            clean: false,
            data: new Uint8Array([1]),
            dataFormat: 'png'
        };
        const backpack = makeBackpack();

        await backpack.handleDrop({
            dragType: DragConstants.COSTUME,
            payload: {asset}
        });

        expect(costumePayload).toHaveBeenCalledTimes(1);
        expect(storage.store).toHaveBeenCalledWith('ImageBitmap', 'png', asset.data, 'asset');
        expect(storage.store.mock.invocationCallOrder[0])
            .toBeLessThan(saveBackpackObject.mock.invocationCallOrder[0]);
    });

    test('turns a save failure into visible state without rejecting', async () => {
        saveBackpackObject.mockRejectedValueOnce(new Error('offline'));
        const backpack = makeBackpack();

        await expect(backpack.handleDrop({
            dragType: DragConstants.COSTUME,
            payload: {asset: {clean: true}}
        })).resolves.toBe(false);

        expect(backpack.state.error).toContain('offline');
        expect(backpack.state.loading).toBe(false);
    });

    test('turns a payload failure into visible state without trying to save', async () => {
        costumePayload.mockRejectedValueOnce(new Error('Unsupported costume format: gif'));
        const backpack = makeBackpack();

        await expect(backpack.handleDrop({
            dragType: DragConstants.COSTUME,
            payload: {asset: {clean: true}}
        })).resolves.toBe(false);

        expect(saveBackpackObject).not.toHaveBeenCalled();
        expect(backpack.state.error).toContain('Unsupported costume format: gif');
        expect(backpack.state.loading).toBe(false);
    });

    test('ignores duplicate drops while the first save is pending', async () => {
        let finishSave;
        saveBackpackObject.mockImplementationOnce(() => new Promise(resolve => {
            finishSave = resolve;
        }));
        const backpack = makeBackpack();
        const dragInfo = {
            dragType: DragConstants.COSTUME,
            payload: {asset: {clean: true}}
        };

        const firstDrop = backpack.handleDrop(dragInfo);
        const secondDrop = backpack.handleDrop(dragInfo);
        await Promise.resolve();
        await Promise.resolve();
        expect(saveBackpackObject).toHaveBeenCalledTimes(1);
        expect(secondDrop).toBe(firstDrop);

        finishSave({id: 'saved', name: 'Costume'});
        await firstDrop;
    });

    test('renames an item through the in-app prompt', async () => {
        updateBackpackObject.mockResolvedValueOnce({id: 'item', name: 'New name'});
        const openSimpleDialog = jest.fn(config => config.onOk('  New name  '));
        const backpack = makeBackpack({openSimpleDialog});
        backpack.state.contents = [{id: 'item', name: 'Old name', type: 'costume'}];

        await expect(backpack.handleRename('item')).resolves.toBe(true);

        expect(openSimpleDialog).toHaveBeenCalledWith(expect.objectContaining({
            type: 'prompt',
            defaultValue: 'Old name'
        }));
        expect(updateBackpackObject).toHaveBeenCalledWith(expect.objectContaining({
            id: 'item',
            name: 'New name'
        }));
        expect(backpack.state.contents[0].name).toBe('New name');
    });

    test('does not rename an item when the prompt is cancelled', async () => {
        const openSimpleDialog = jest.fn(config => config.onCancel());
        const backpack = makeBackpack({openSimpleDialog});
        backpack.state.contents = [{id: 'item', name: 'Old name', type: 'sound'}];

        await expect(backpack.handleRename('item')).resolves.toBe(false);

        expect(updateBackpackObject).not.toHaveBeenCalled();
        expect(backpack.renamingItems.size).toBe(0);
    });
});
