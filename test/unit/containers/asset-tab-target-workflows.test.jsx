import {CostumeTab} from '../../../src/containers/costume-tab.jsx';
import {SoundTab} from '../../../src/containers/sound-tab.jsx';
import {handleFileUpload, soundUpload} from '../../../src/lib/file-uploader.js';
import {getBackdropLibrary} from '../../../src/lib/libraries/tw-async-libraries.js';

jest.mock('../../../src/lib/file-uploader.js', () => ({
    costumeUpload: jest.fn(),
    handleFileUpload: jest.fn(),
    soundUpload: jest.fn()
}));
jest.mock('../../../src/lib/libraries/tw-async-libraries.js', () => ({
    getBackdropLibrary: jest.fn(),
    getCostumeLibrary: jest.fn(),
    getSoundLibrary: jest.fn()
}));

describe('asset tab target changes', () => {
    test.each([
        ['costume', CostumeTab, 'handleDuplicateCostume', 'duplicateCostume'],
        ['sound', SoundTab, 'handleDuplicateSound', 'duplicateSound']
    ])('shows a visible error when %s duplication throws synchronously', async (
        _name, Component, handler, vmMethod
    ) => {
        const tab = Object.create(Component.prototype);
        tab.props = {
            onShowImportError: jest.fn(),
            vm: {
                editingTarget: {id: 'sprite-a'},
                [vmMethod]: jest.fn(() => {
                    throw new Error('asset disappeared');
                })
            }
        };

        await tab[handler](0);

        expect(tab.props.onShowImportError).toHaveBeenCalledTimes(1);
    });

    test.each([
        ['costume', CostumeTab, 'handleDeleteCostume', 'deleteCostume'],
        ['sound', SoundTab, 'handleDeleteSound', 'deleteSound']
    ])('shows a visible error when %s deletion throws', (_name, Component, handler, vmMethod) => {
        const tab = Object.create(Component.prototype);
        tab.setState = jest.fn();
        tab.props = {
            dispatchUpdateRestore: jest.fn(),
            onShowDeleteError: jest.fn(),
            vm: {
                editingTarget: {sprite: {sounds: [{}]}},
                [vmMethod]: jest.fn(() => {
                    throw new Error('asset disappeared');
                })
            }
        };

        expect(tab[handler](0)).toBe(false);
        expect(tab.props.onShowDeleteError).toHaveBeenCalledTimes(1);
        expect(tab.props.dispatchUpdateRestore).not.toHaveBeenCalled();
        expect(tab.setState).not.toHaveBeenCalled();
    });

    test.each([
        ['costume', CostumeTab, 'handleDeleteCostume', 'deleteCostume'],
        ['sound', SoundTab, 'handleDeleteSound', 'deleteSound']
    ])('ignores a repeated %s delete before the asset list updates', (
        _name, Component, handler, vmMethod
    ) => {
        const tab = Object.create(Component.prototype);
        tab.setState = jest.fn();
        tab.state = {selectedSoundIndex: 0};
        tab.props = {
            dispatchUpdateRestore: jest.fn(),
            onShowDeleteError: jest.fn(),
            vm: {
                editingTarget: {sprite: {sounds: [{}, {}]}},
                [vmMethod]: jest.fn(() => jest.fn())
            }
        };

        expect(tab[handler](0)).toBe(true);
        expect(tab[handler](0)).toBe(false);
        expect(tab.props.vm[vmMethod]).toHaveBeenCalledTimes(1);
        expect(tab.props.dispatchUpdateRestore).toHaveBeenCalledTimes(1);
    });

    test('a delayed sound duplicate does not change selection in the newly selected sprite', async () => {
        let finishDuplicate;
        const tab = Object.create(SoundTab.prototype);
        tab.setState = jest.fn();
        tab.props = {
            onShowImportError: jest.fn(),
            vm: {
                editingTarget: {id: 'sprite-a', sprite: {sounds: [{}, {}]}},
                duplicateSound: jest.fn(() => new Promise(resolve => {
                    finishDuplicate = resolve;
                }))
            }
        };

        const duplicate = tab.handleDuplicateSound(0);
        tab.props.vm.editingTarget = {id: 'sprite-b', sprite: {sounds: [{}]}};
        finishDuplicate();
        await duplicate;

        expect(tab.setState).not.toHaveBeenCalled();
    });

    test('a late sound callback does not update an unmounted tab', () => {
        const tab = Object.create(SoundTab.prototype);
        tab.unmounted = true;
        tab.setState = jest.fn();
        tab.props = {
            vm: {editingTarget: {id: 'sprite-a', sprite: {sounds: [{}]}}}
        };

        expect(tab.handleNewSound('sprite-a')).toBeNull();
        expect(tab.setState).not.toHaveBeenCalled();
    });

    test.each([
        ['costume', CostumeTab],
        ['sound', SoundTab]
    ])('ignores an early %s upload click before the file input mounts', (_name, Component) => {
        const tab = Object.create(Component.prototype);

        expect(tab.handleFileUploadClick()).toBe(false);
    });

    test('library costumes use the target captured before loading', async () => {
        const tab = Object.create(CostumeTab.prototype);
        tab.props = {
            vm: {
                addCostume: jest.fn(() => Promise.resolve()),
                addCostumeFromLibrary: jest.fn()
            }
        };

        await tab.handleNewCostume({md5: 'costume.svg'}, true, 'sprite-a');

        expect(tab.props.vm.addCostume).toHaveBeenCalledWith(
            'costume.svg',
            {md5: 'costume.svg'},
            'sprite-a',
            2
        );
        expect(tab.props.vm.addCostumeFromLibrary).not.toHaveBeenCalled();
    });

    test('a blank costume is added to the target where creation started', async () => {
        const tab = Object.create(CostumeTab.prototype);
        tab.handleNewCostume = jest.fn(() => Promise.resolve());
        tab.props = {
            intl: {formatMessage: jest.fn(() => 'costume1')},
            onShowImportError: jest.fn(),
            vm: {editingTarget: {id: 'sprite-a', isStage: false}}
        };

        const adding = tab.handleNewBlankCostume();
        tab.props.vm.editingTarget = {id: 'sprite-b', isStage: false};
        await adding;

        expect(tab.handleNewCostume).toHaveBeenCalledWith(expect.any(Object), false, 'sprite-a');
    });

    test('Surprise Backdrop uses its captured stage', async () => {
        getBackdropLibrary.mockResolvedValue([{
            bitmapResolution: 1,
            md5ext: 'backdrop.svg',
            name: 'Backdrop',
            rotationCenterX: 240,
            rotationCenterY: 180
        }]);
        const tab = Object.create(CostumeTab.prototype);
        tab.handleNewCostume = jest.fn(() => Promise.resolve());
        tab.props = {
            onShowImportError: jest.fn(),
            vm: {editingTarget: {id: 'stage'}}
        };

        await tab.handleSurpriseBackdrop();

        expect(tab.handleNewCostume).toHaveBeenCalledWith(
            expect.objectContaining({md5: 'backdrop.svg'}),
            false,
            'stage'
        );
    });

    test('keeps the importing notice until every sound file finishes', async () => {
        const completions = [];
        handleFileUpload.mockImplementation((_input, onLoad) => {
            onLoad(new ArrayBuffer(0), 'audio/wav', 'first', 0, 2);
            onLoad(new ArrayBuffer(0), 'audio/wav', 'second', 1, 2);
        });
        soundUpload.mockImplementation((_buffer, _type, _storage, onSound) => onSound({}));
        const tab = Object.create(SoundTab.prototype);
        tab.setState = jest.fn();
        tab.props = {
            onCloseImporting: jest.fn(),
            onShowImportError: jest.fn(),
            onShowImporting: jest.fn(),
            vm: {
                editingTarget: {id: 'sprite-a', sprite: {sounds: []}},
                runtime: {storage: {}},
                addSound: jest.fn(() => new Promise(resolve => completions.push(resolve)))
            }
        };

        tab.handleSoundUpload({target: {files: [{}, {}]}});
        completions[1]();
        await Promise.resolve();
        expect(tab.props.onCloseImporting).not.toHaveBeenCalled();

        completions[0]();
        await Promise.resolve();
        expect(tab.props.onCloseImporting).toHaveBeenCalledTimes(1);
    });
});
