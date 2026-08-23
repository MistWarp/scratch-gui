import {RecordModal} from '../../../src/containers/record-modal.jsx';
import {encodeAndAddSoundToVM} from '../../../src/lib/audio/audio-util.js';

jest.mock('../../../src/lib/audio/audio-util.js', () => ({
    encodeAndAddSoundToVM: jest.fn()
}));

const makeModal = () => {
    const modal = Object.create(RecordModal.prototype);
    modal._isMounted = true;
    modal.submitPromise = null;
    modal.state = {
        encoding: false,
        sampleRate: 44100,
        samples: new Float32Array([0, 1, 0]),
        trimEnd: 1,
        trimStart: 0
    };
    modal.setState = jest.fn((state, callback) => {
        modal.state = {...modal.state, ...state};
        if (callback) callback();
    });
    modal.props = {
        onClose: jest.fn(),
        onNewSound: jest.fn(),
        onShowImportError: jest.fn(),
        vm: {editingTarget: {id: 'sprite-a'}}
    };
    return modal;
};

describe('record modal save workflow', () => {
    test('deduplicates save clicks and selects the sound only in its original target', async () => {
        let finishEncoding;
        encodeAndAddSoundToVM.mockImplementation(() => new Promise(resolve => {
            finishEncoding = resolve;
        }));
        const modal = makeModal();

        const firstSave = modal.handleSubmit();
        const secondSave = modal.handleSubmit();
        modal.props.vm.editingTarget = {id: 'sprite-b'};

        expect(firstSave).toBe(secondSave);
        expect(encodeAndAddSoundToVM).toHaveBeenCalledTimes(1);
        finishEncoding();
        await expect(firstSave).resolves.toBe(true);
        expect(modal.props.onNewSound).toHaveBeenCalledWith('sprite-a');
    });

    test('does not close while encoding is in progress', () => {
        const modal = makeModal();
        modal.state.encoding = true;

        modal.handleCancel();

        expect(modal.props.onClose).not.toHaveBeenCalled();
    });
});
