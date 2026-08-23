import {BackdropLibrary} from '../../../src/containers/backdrop-library.jsx';
import {CostumeLibrary} from '../../../src/containers/costume-library.jsx';
import {SoundLibrary} from '../../../src/containers/sound-library.jsx';
import {SpriteLibrary} from '../../../src/containers/sprite-library.jsx';

const makeInstance = (Component, vm) => {
    const instance = Object.create(Component.prototype);
    instance.props = {
        onActivateBlocksTab: jest.fn(),
        onNewSound: jest.fn(),
        onShowImportError: jest.fn(),
        vm
    };
    return instance;
};

describe('asset library selection failures', () => {
    test.each([
        ['sprite', SpriteLibrary, 'handleItemSelect', {name: 'Cat'}, 'addSprite'],
        ['costume', CostumeLibrary, 'handleItemSelected', {md5ext: 'costume.svg', name: 'Costume'},
            'addCostumeFromLibrary'],
        ['backdrop', BackdropLibrary, 'handleItemSelect', {md5ext: 'backdrop.svg', name: 'Backdrop'}, 'addBackdrop'],
        ['sound', SoundLibrary, 'handleItemSelected', {_md5: 'sound.wav', format: 'wav', name: 'Sound'}, 'addSound']
    ])('shows an import error when adding a %s fails', async (_name, Component, method, item, vmMethod) => {
        const vm = {[vmMethod]: jest.fn(() => Promise.reject(new Error('add failed')))};
        const instance = makeInstance(Component, vm);

        await instance[method](item);

        expect(instance.props.onShowImportError).toHaveBeenCalledTimes(1);
    });
});

describe('sound library previews', () => {
    test('contains failed preview loads instead of rejecting in the background', async () => {
        const library = Object.create(SoundLibrary.prototype);
        library._isMounted = true;
        library.audioEngine = {};
        library.playingSoundPromise = null;
        library.props = {
            vm: {
                runtime: {
                    storage: {
                        AssetType: {Sound: 'sound'},
                        load: jest.fn(() => Promise.reject(new Error('preview failed')))
                    }
                }
            }
        };

        library.handleItemMouseEnter({_md5: 'missing.wav', name: 'Missing', format: 'wav'});

        await expect(library.playingSoundPromise).resolves.toBeNull();
    });
});
