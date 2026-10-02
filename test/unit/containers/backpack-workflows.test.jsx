import {Backpack} from '../../../src/containers/backpack.jsx';
import {
    codePayload,
    costumePayload,
    saveBackpackObject,
    spritePayload,
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

const flushPromises = () => new Promise(resolve => setImmediate(resolve));

const makeBackpack = overrides => {
    const backpack = new Backpack({
        host: 'https://backpack.example',
        intl: {formatMessage: jest.fn(message => message.defaultMessage)},
        onCloseAlert: jest.fn(),
        onShowAlert: jest.fn(),
        token: 'token',
        username: 'user',
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

    test('highlights only block drags over the backpack, ignoring asset drags', () => {
        const backpack = makeBackpack({
            dragInfo: {dragging: true, dragType: DragConstants.SPRITE}
        });
        backpack.state.assetDragOver = true;
        expect(backpack.render().props.dragActive).toBe(false);
        expect(backpack.render().props.dragOver).toBe(false);

        const handle = document.createElement('div');
        document.body.appendChild(handle);
        handle.getBoundingClientRect = () => ({left: 10, right: 310, top: 700, bottom: 740,
            width: 300, height: 40});
        backpack.setHandleRef(handle);
        backpack.handleBlockDragHook('start');
        expect(backpack.render().props.dragActive).toBe(true);
        expect(backpack.render().props.dragOver).toBe(false);

        backpack.handleGlobalPointerMove({clientX: 100, clientY: 699});
        expect(backpack.render().props.dragOver).toBe(false);
        backpack.handleGlobalPointerMove({clientX: 100, clientY: 720});
        expect(backpack.render().props.dragOver).toBe(true);
        backpack.handleGlobalPointerMove({clientX: 100, clientY: 741});
        expect(backpack.render().props.dragOver).toBe(false);
        backpack.handleGlobalPointerMove({clientX: 100, clientY: 720});
        backpack.handleBlockDragHook('end');
        expect(backpack.render().props.dragOver).toBe(false);
        expect(backpack.pendingBlockDrop).toBe(true);
        clearTimeout(backpack.pendingBlockDropTimer);
        handle.remove();
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
        await flushPromises();
        expect(saveBackpackObject).toHaveBeenCalledTimes(1);
        expect(secondDrop).toBe(firstDrop);

        finishSave({id: 'saved', name: 'Costume'});
        await firstDrop;
    });

    test('queues a different save made while the first is pending', async () => {
        let finishSave;
        saveBackpackObject
            .mockImplementationOnce(() => new Promise(resolve => {
                finishSave = resolve;
            }))
            .mockImplementationOnce(() => Promise.resolve({id: 'second', name: 'Second'}));
        const backpack = makeBackpack();

        const firstDrop = backpack.handleDrop({dragType: DragConstants.COSTUME, payload: {asset: {clean: true}}});
        const secondDrop = backpack.handleDrop({dragType: DragConstants.COSTUME, payload: {asset: {clean: true}}});
        await flushPromises();
        expect(saveBackpackObject).toHaveBeenCalledTimes(1);

        finishSave({id: 'first', name: 'First'});
        await expect(firstDrop).resolves.toBe(true);
        await expect(secondDrop).resolves.toBe(true);
        expect(saveBackpackObject).toHaveBeenCalledTimes(2);
        expect(backpack.state.contents.map(item => item.id)).toEqual(['second', 'first']);
        expect(backpack.props.onShowAlert).toHaveBeenCalledWith('backpackSaved');
    });

    test('saves a right-clicked script with every block below and inside it', async () => {
        codePayload.mockResolvedValueOnce({type: 'script', name: 'code'});
        const stored = {
            top: {id: 'top', opcode: 'event_whenflagclicked', next: 'move', parent: null, topLevel: true,
                inputs: {}, fields: {}, x: 5, y: 6},
            move: {id: 'move', opcode: 'motion_movesteps', next: null, parent: 'top', topLevel: false,
                inputs: {STEPS: {name: 'STEPS', block: 'steps', shadow: 'steps'}}, fields: {}},
            steps: {id: 'steps', opcode: 'math_number', next: null, parent: 'move', topLevel: false,
                shadow: true, inputs: {}, fields: {NUM: {name: 'NUM', value: '10'}}}
        };
        const exportStandaloneBlocks = jest.fn(blocks => blocks);
        const backpack = makeBackpack({
            vm: {
                editingTarget: {blocks: {getBlock: id => stored[id]}},
                exportStandaloneBlocks
            }
        });

        await expect(backpack.handleSaveRequest({kind: 'script', blockId: 'top'})).resolves.toBe(true);

        expect(exportStandaloneBlocks.mock.calls[0][0].map(block => block.id)).toEqual(['top', 'move', 'steps']);
        expect(codePayload).toHaveBeenCalledWith(
            expect.objectContaining({topBlockId: 'top'}),
            expect.anything()
        );
        expect(saveBackpackObject).toHaveBeenCalledTimes(1);
    });

    test('passes right-clicked sprites, costumes and sounds to the drop path', async () => {
        spritePayload.mockResolvedValueOnce({type: 'sprite', name: 'Sprite1'});
        const vm = {};
        const backpack = makeBackpack({vm});

        await expect(backpack.handleSaveRequest({dragType: DragConstants.SPRITE, payload: 'sprite-id'}))
            .resolves.toBe(true);
        expect(spritePayload).toHaveBeenCalledWith('sprite-id', vm);

        await expect(backpack.handleSaveRequest({dragType: DragConstants.BACKPACK_CODE, payload: {}}))
            .resolves.toBe(false);
        await expect(backpack.handleSaveRequest({kind: 'script', blockId: 'missing'})).resolves.toBe(false);
        expect(saveBackpackObject).toHaveBeenCalledTimes(1);
    });

    test('renames an item inline and trims the new name', async () => {
        updateBackpackObject.mockResolvedValueOnce({id: 'item', name: 'New name'});
        const backpack = makeBackpack({host: 'local'});
        backpack.state.contents = [{id: 'item', name: 'Old name', type: 'costume'}];

        expect(backpack.handleRenameStart('item')).toBe(true);
        expect(backpack.state.renamingId).toBe('item');
        await expect(backpack.handleRenameSubmit('item', '  New name  ')).resolves.toBe(true);

        expect(backpack.state.renamingId).toBe(null);
        expect(updateBackpackObject).toHaveBeenCalledWith(expect.objectContaining({
            id: 'item',
            name: 'New name'
        }));
        expect(backpack.state.contents[0].name).toBe('New name');
    });

    test('does not rename an item when the new name is empty or unchanged', async () => {
        const backpack = makeBackpack({host: 'local'});
        backpack.state.contents = [{id: 'item', name: 'Old name', type: 'sound'}];

        await expect(backpack.handleRenameSubmit('item', '   ')).resolves.toBe(false);
        await expect(backpack.handleRenameSubmit('item', 'Old name')).resolves.toBe(false);

        expect(updateBackpackObject).not.toHaveBeenCalled();
        expect(backpack.renamingItems.size).toBe(0);
    });

    test('only offers renaming for the local backpack', () => {
        const remote = makeBackpack();
        remote.state.contents = [{id: 'item', name: 'Old name', type: 'sprite'}];
        expect(remote.handleRenameStart('item')).toBe(false);

        const local = makeBackpack({host: 'local'});
        local.state.contents = [{id: 'item', name: 'Old name', type: 'sprite'}];
        expect(local.handleRenameStart('item')).toBe(true);
    });

    test('filters contents by type before searching', () => {
        const backpack = makeBackpack();
        backpack.state.contents = [
            {id: '1', name: 'Walk', type: 'script'},
            {id: '2', name: 'Walk', type: 'costume'},
            {id: '3', name: 'Jump', type: 'script'}
        ];
        backpack.state.filter = 'script';
        backpack.state.searchQuery = 'walk';
        expect(backpack.getFilteredContents().map(item => item.id)).toEqual(['1']);
    });
});
