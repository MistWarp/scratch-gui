import costumePayload from '../../../src/lib/backpack/costume-payload';
import soundPayload from '../../../src/lib/backpack/sound-payload';

jest.mock('../../../src/lib/backpack/thumbnail', () => jest.fn(() => Promise.resolve('thumbnail')));
jest.mock('../../../src/lib/utils/get-costume-url', () => jest.fn(() => 'data:image/png;base64,costume'));

describe('backpack payloads', () => {
    test('rejects an unsupported costume before exporting or creating a thumbnail', async () => {
        const vm = {getExportedCostumeBase64: jest.fn()};

        await expect(costumePayload({
            asset: {},
            dataFormat: 'gif',
            name: 'Animated costume'
        }, vm)).rejects.toThrow('Unsupported costume format: gif');

        expect(vm.getExportedCostumeBase64).not.toHaveBeenCalled();
    });

    test('rejects an unsupported sound before encoding it', async () => {
        const sound = {
            asset: {encodeDataURI: jest.fn()},
            dataFormat: 'ogg',
            name: 'Music'
        };

        await expect(soundPayload(sound)).rejects.toThrow('Unsupported sound format: ogg');
        expect(sound.asset.encodeDataURI).not.toHaveBeenCalled();
    });
});
