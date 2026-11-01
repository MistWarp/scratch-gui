import {describe, expect, jest, test} from '@jest/globals';
import editorTabReducer, {
    consumeSoundRequest,
    requestSound,
    SOUNDS_TAB_INDEX
} from '../../../src/reducers/editor-tab.js';
import {handleSoundSelection} from '../../../src/lib/spotlight/selectionUtils.js';
import {SoundTab} from '../../../src/containers/sound-tab.jsx';

const soundTab = props => {
    const tab = Object.create(SoundTab.prototype);
    tab.props = {
        onConsumeSoundRequest: jest.fn(),
        vm: {editingTarget: {id: 'sprite'}},
        ...props
    };
    tab.handleSelectSound = jest.fn();
    return tab;
};

describe('selecting a sound from Spotlight', () => {
    test('requests the sound for the editing target and opens the sounds tab', () => {
        const dispatch = jest.fn();
        handleSoundSelection({index: 3}, {editingTarget: {id: 'sprite'}}, {dispatch});
        expect(dispatch.mock.calls.map(([action]) => action)).toEqual([
            expect.objectContaining({targetId: 'sprite', index: 3}),
            expect.objectContaining({activeTabIndex: SOUNDS_TAB_INDEX})
        ]);
    });

    test('does nothing without an editing target', () => {
        const dispatch = jest.fn();
        handleSoundSelection({index: 3}, {editingTarget: null}, {dispatch});
        expect(dispatch).not.toHaveBeenCalled();
    });

    test('the request is cleared only by its own nonce', () => {
        const requested = editorTabReducer(undefined, requestSound('sprite', 2));
        const {nonce} = requested.requestedSound;
        expect(requested.requestedSound).toEqual({targetId: 'sprite', index: 2, nonce});
        expect(editorTabReducer(requested, consumeSoundRequest(nonce + 1))).toBe(requested);
        expect(editorTabReducer(requested, consumeSoundRequest(nonce)).requestedSound).toBeNull();
    });

    test('the sound tab selects the requested sound and consumes the request', () => {
        const tab = soundTab({requestedSound: {targetId: 'sprite', index: 2, nonce: 7}});
        tab.applyRequestedSound();
        expect(tab.props.onConsumeSoundRequest).toHaveBeenCalledWith(7);
        expect(tab.handleSelectSound).toHaveBeenCalledWith(2);
    });

    test('the sound tab ignores a request for another target', () => {
        const tab = soundTab({requestedSound: {targetId: 'other', index: 2, nonce: 8}});
        tab.applyRequestedSound();
        expect(tab.props.onConsumeSoundRequest).toHaveBeenCalledWith(8);
        expect(tab.handleSelectSound).not.toHaveBeenCalled();
    });
});
