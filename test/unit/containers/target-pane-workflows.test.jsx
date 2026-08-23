import {TargetPane} from '../../../src/containers/target-pane.jsx';
import downloadBlob from '../../../src/lib/utils/download-blob';
import DragConstants from '../../../src/lib/constants/drag-constants';

jest.mock('../../../src/lib/utils/download-blob', () => jest.fn());

const makeTargetPane = overrides => {
    const targetPane = Object.create(TargetPane.prototype);
    targetPane.exportingSprites = new Set();
    targetPane.deletingSprites = new Set();
    targetPane.props = {
        editingTarget: 'source',
        hoveredTarget: {sprite: 'target'},
        onReceivedBlocks: jest.fn(),
        onShowExportError: jest.fn(),
        onShowDeleteError: jest.fn(),
        onShowImportError: jest.fn(),
        vm: {
            exportSprite: jest.fn(() => Promise.resolve(new Blob())),
            runtime: {
                getTargetById: jest.fn(() => ({getName: () => 'Sprite'}))
            }
        },
        ...overrides
    };
    return targetPane;
};

describe('target pane sprite export', () => {
    beforeEach(() => {
        downloadBlob.mockClear();
    });

    test('uses a safe filename and ignores duplicate clicks while exporting', async () => {
        let finishExport;
        const exportSprite = jest.fn(() => new Promise(resolve => {
            finishExport = resolve;
        }));
        const targetPane = makeTargetPane({
            vm: {
                exportSprite,
                runtime: {
                    getTargetById: () => ({getName: () => 'Cat: main/hero?'})
                }
            }
        });

        const firstExport = targetPane.handleExportSprite('cat');
        await targetPane.handleExportSprite('cat');
        expect(exportSprite).toHaveBeenCalledTimes(1);

        finishExport(new Blob());
        await firstExport;
        expect(downloadBlob).toHaveBeenCalledWith('Cat_ main_hero_.sprite3', expect.any(Blob));
    });

    test('shows an error when export fails', async () => {
        const onShowExportError = jest.fn();
        const targetPane = makeTargetPane({
            onShowExportError,
            vm: {
                exportSprite: jest.fn(() => Promise.reject(new Error('export failed'))),
                runtime: {
                    getTargetById: () => ({getName: () => 'Cat'})
                }
            }
        });

        await targetPane.handleExportSprite('cat');
        expect(onShowExportError).toHaveBeenCalledTimes(1);
        expect(downloadBlob).not.toHaveBeenCalled();
    });
});

describe('target pane sprite duplication', () => {
    test('shows a visible error when the VM rejects synchronously', async () => {
        const onShowImportError = jest.fn();
        const targetPane = makeTargetPane({
            onShowImportError,
            vm: {
                duplicateSprite: jest.fn(() => {
                    throw new Error('sprite disappeared');
                })
            }
        });

        await targetPane.handleDuplicateSprite('missing');

        expect(onShowImportError).toHaveBeenCalledTimes(1);
    });
});

describe('target pane sprite deletion', () => {
    test('creates an undo entry and ignores another click until the sprite disappears', () => {
        const restoreSprite = jest.fn(() => Promise.resolve());
        const dispatchUpdateRestore = jest.fn();
        const targetPane = makeTargetPane({
            dispatchUpdateRestore,
            sprites: {cat: {id: 'cat'}},
            vm: {deleteSprite: jest.fn(() => restoreSprite)}
        });

        expect(targetPane.handleDeleteSprite('cat')).toBe(true);
        expect(targetPane.handleDeleteSprite('cat')).toBe(false);
        expect(targetPane.props.vm.deleteSprite).toHaveBeenCalledTimes(1);
        expect(dispatchUpdateRestore).toHaveBeenCalledWith(expect.objectContaining({
            deletedItem: 'Sprite',
            restoreFun: expect.any(Function)
        }));

        const previousProps = targetPane.props;
        targetPane.props = {...targetPane.props, sprites: {}};
        targetPane.componentDidUpdate(previousProps);
        expect(targetPane.handleDeleteSprite('cat')).toBe(true);
    });

    test('shows a visible error and does not create undo when deletion fails', () => {
        const dispatchUpdateRestore = jest.fn();
        const onShowDeleteError = jest.fn();
        const targetPane = makeTargetPane({
            dispatchUpdateRestore,
            onShowDeleteError,
            vm: {
                deleteSprite: jest.fn(() => {
                    throw new Error('delete failed');
                })
            }
        });

        expect(targetPane.handleDeleteSprite('cat')).toBe(false);
        expect(onShowDeleteError).toHaveBeenCalledTimes(1);
        expect(dispatchUpdateRestore).not.toHaveBeenCalled();
    });
});

describe('target pane asset sharing', () => {
    test('shows a visible error when a dropped asset cannot be shared', async () => {
        const onShowImportError = jest.fn();
        const targetPane = makeTargetPane({
            onShowImportError,
            vm: {
                shareCostumeToTarget: jest.fn(() => Promise.reject(new Error('share failed')))
            }
        });

        await targetPane.handleDrop({
            dragType: DragConstants.COSTUME,
            index: 2
        });

        expect(onShowImportError).toHaveBeenCalledTimes(1);
    });

    test('only shows the block-sharing confirmation after the copy succeeds', async () => {
        const onReceivedBlocks = jest.fn();
        const onShowImportError = jest.fn();
        const targetPane = makeTargetPane({
            onReceivedBlocks,
            onShowImportError
        });
        targetPane.shareBlocks = jest.fn(() => Promise.reject(new Error('copy failed')));

        await targetPane.handleBlockDragEnd({blocks: {}});

        expect(onReceivedBlocks).not.toHaveBeenCalled();
        expect(onShowImportError).toHaveBeenCalledTimes(1);
    });
});

describe('target pane sprite upload progress', () => {
    test('ignores an upload click before the hidden input mounts', () => {
        const targetPane = makeTargetPane();

        expect(targetPane.handleFileUploadClick()).toBe(false);

        const click = jest.fn();
        targetPane.fileInput = {click};
        expect(targetPane.handleFileUploadClick()).toBe(true);
        expect(click).toHaveBeenCalledTimes(1);
    });

    test('closes the importing alert after a rejected file type', () => {
        const onCloseImporting = jest.fn();
        const onShowImportError = jest.fn();
        const targetPane = makeTargetPane({
            onCloseImporting,
            onShowImportError,
            onShowImporting: jest.fn()
        });
        const input = {
            files: [{
                contents: new ArrayBuffer(1),
                name: 'not-a-sprite.txt',
                type: 'text/plain'
            }],
            value: 'selected file'
        };

        targetPane.handleSpriteUpload({target: input});

        expect(onShowImportError).toHaveBeenCalledTimes(1);
        expect(onCloseImporting).toHaveBeenCalledTimes(1);
    });

    test('closes the importing alert for an empty selection', () => {
        const onCloseImporting = jest.fn();
        const targetPane = makeTargetPane({
            onCloseImporting,
            onShowImporting: jest.fn()
        });

        targetPane.handleSpriteUpload({target: {files: [], value: ''}});

        expect(onCloseImporting).toHaveBeenCalledTimes(1);
    });
});
