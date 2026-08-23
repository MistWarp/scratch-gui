import {CostumeTab} from '../../../src/containers/costume-tab.jsx';
import {SoundTab} from '../../../src/containers/sound-tab.jsx';
import {StageSelector} from '../../../src/containers/stage-selector.jsx';

const emptyInputEvent = () => ({target: {files: [], value: ''}});

describe('asset upload progress', () => {
    test('costume upload closes progress after an empty selection', () => {
        const tab = Object.create(CostumeTab.prototype);
        tab.props = {
            onCloseImporting: jest.fn(),
            onShowImporting: jest.fn(),
            vm: {editingTarget: {id: 'sprite'}}
        };

        tab.handleCostumeUpload(emptyInputEvent());

        expect(tab.props.onCloseImporting).toHaveBeenCalledTimes(1);
    });

    test('sound upload closes progress after an empty selection', () => {
        const tab = Object.create(SoundTab.prototype);
        tab.props = {
            onCloseImporting: jest.fn(),
            onShowImporting: jest.fn(),
            vm: {
                editingTarget: {id: 'sprite'},
                runtime: {storage: {}}
            }
        };

        tab.handleSoundUpload(emptyInputEvent());

        expect(tab.props.onCloseImporting).toHaveBeenCalledTimes(1);
    });

    test('backdrop upload closes progress after an empty selection', () => {
        const selector = Object.create(StageSelector.prototype);
        selector.props = {
            id: 'stage',
            onActivateTab: jest.fn(),
            onCloseImporting: jest.fn(),
            onShowImporting: jest.fn(),
            vm: {setEditingTarget: jest.fn()}
        };

        selector.handleBackdropUpload(emptyInputEvent());

        expect(selector.props.onCloseImporting).toHaveBeenCalledTimes(1);
    });
});
