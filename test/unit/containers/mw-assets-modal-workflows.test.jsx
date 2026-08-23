import {MWAssetsModal} from '../../../src/containers/mw-assets-modal';

jest.mock('../../../src/lib/persistence/storage', () => ({
    AssetType: {CustomAsset: 'CustomAsset'},
    createAsset: jest.fn(() => ({assetId: 'new', data: new Uint8Array([1]), dataFormat: 'bin'}))
}));
jest.mock('../../../src/lib/utils/download-blob', () => jest.fn());

const assetEntry = (name, id) => ({
    name,
    asset: {
        assetId: id,
        data: new Uint8Array([1]),
        dataFormat: 'png'
    }
});

const makeModal = overrides => {
    const assetManager = {
        assets: [],
        addAsset: jest.fn(),
        deleteAsset: jest.fn(),
        getObjectURL: jest.fn(),
        getUnusedName: jest.fn(name => name),
        off: jest.fn(),
        on: jest.fn(),
        renameAsset: jest.fn(),
        ...overrides
    };
    const modal = new MWAssetsModal({
        intl: {formatMessage: message => message.defaultMessage},
        onClose: jest.fn(),
        onShowImportError: jest.fn(),
        vm: {
            emitWorkspaceUpdate: jest.fn(),
            runtime: {assetManager}
        }
    });
    modal.setState = update => {
        const nextState = typeof update === 'function' ? update(modal.state, modal.props) : update;
        modal.state = {...modal.state, ...nextState};
    };
    modal.mounted = true;
    return {assetManager, modal};
};

describe('custom asset manager workflows', () => {
    test('keeps the original parent while the folder form is open', () => {
        const {modal} = makeModal();
        modal.state.selected = 'Parent';

        expect(modal.handleNewFolder()).toBe(true);
        modal.state.selected = 'Other';
        modal.handleDialogInput({target: {value: '  Child  '}});

        expect(modal.handleDialogConfirm()).toBe(true);
        expect(modal.state.folders).toEqual(['Parent/Child']);
        expect(modal.state.selected).toBe('Parent/Child');
    });

    test('resolves the same asset again before confirming deletion', () => {
        const first = assetEntry('first.png', 'first');
        const deleting = assetEntry('delete.png', 'delete');
        const {assetManager, modal} = makeModal({assets: [first, deleting]});

        expect(modal.handleDelete(1)).toBe(true);
        assetManager.assets.shift();
        expect(modal.handleDialogConfirm()).toBe(true);

        expect(assetManager.deleteAsset).toHaveBeenCalledWith(0);
    });

    test('keeps the selected asset when an earlier item disappears', () => {
        const first = assetEntry('first.png', 'first');
        const selected = assetEntry('selected.png', 'selected');
        const {assetManager, modal} = makeModal({assets: [first, selected]});
        modal.handleSelectFile(1);

        assetManager.assets.splice(0, 1);
        modal.handleAssetsChanged();

        expect(modal.state.selectedIndex).toBe(0);
        expect(modal.getPreview().name).toBe('selected.png');
    });

    test('reports failed imports once and returns a useful result', async () => {
        const {modal} = makeModal();
        const files = [
            {name: 'good.bin', arrayBuffer: () => Promise.resolve(new ArrayBuffer(1))},
            {name: 'bad.bin', arrayBuffer: () => Promise.reject(new Error('read failed'))}
        ];

        await expect(modal.addFiles(files, '')).resolves.toEqual({added: 1, failed: 1});

        expect(modal.props.onShowImportError).toHaveBeenCalledTimes(1);
    });

    test('ignores stale export and delete actions', () => {
        const {modal} = makeModal();

        expect(modal.handleExport(5)).toBe(false);
        expect(modal.handleDelete(5)).toBe(false);
    });

    test('locks duplicate imports and closing until file reads finish', async () => {
        let finishRead;
        const {modal} = makeModal();
        const files = [{
            name: 'slow.bin',
            arrayBuffer: () => new Promise(resolve => {
                finishRead = resolve;
            })
        }];

        const first = modal.addFiles(files, '');
        const second = modal.addFiles(files, '');
        modal.handleClose();

        expect(second).toBe(first);
        expect(modal.state.importing).toBe(true);
        expect(modal.props.onClose).not.toHaveBeenCalled();

        finishRead(new ArrayBuffer(1));
        await first;
        expect(modal.state.importing).toBe(false);
        modal.handleClose();
        expect(modal.props.onClose).toHaveBeenCalledTimes(1);
    });
});
