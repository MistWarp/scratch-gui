import {describe, expect, jest, test} from '@jest/globals';
import editorTabReducer, {
    consumeSoundRequest,
    requestSound,
    revealInCode,
    showBlocksTab,
    SOUNDS_TAB_INDEX
} from '../../../src/reducers/editor-tab.js';
import {handleSoundSelection} from '../../../src/lib/spotlight/selectionUtils.js';
import {SoundTab} from '../../../src/containers/sound-tab.jsx';

const soundTab = props => {
    const tab = Object.create(SoundTab.prototype);
    tab.props = {
        onConsumeSoundRequest: jest.fn(),
        vm: {editingTarget: {id: 'sprite', getSounds: () => [{}, {}, {}]}},
        ...props
    };
    tab.handleSelectSound = jest.fn();
    return tab;
};

describe('selecting a sound from Spotlight', () => {
    test('requests the sound for the editing target in one action', () => {
        const dispatch = jest.fn();
        handleSoundSelection({index: 3}, {editingTarget: {id: 'sprite'}}, {dispatch});
        expect(dispatch.mock.calls.map(([action]) => action)).toEqual([
            expect.objectContaining({targetId: 'sprite', index: 3})
        ]);
    });

    test('in blocks mode the request opens the sounds tab', () => {
        const requested = editorTabReducer(undefined, requestSound('sprite', 2));
        expect(requested.activeTabIndex).toBe(SOUNDS_TAB_INDEX);
        expect(requested.reveal).toBeNull();
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

    test('the sound tab ignores a request past the last sound', () => {
        const tab = soundTab({requestedSound: {targetId: 'sprite', index: 5, nonce: 9}});
        tab.applyRequestedSound();
        expect(tab.props.onConsumeSoundRequest).toHaveBeenCalledWith(9);
        expect(tab.handleSelectSound).not.toHaveBeenCalled();
    });

    test('in code mode the request reveals that sound instead of waiting for the sound tab', () => {
        const codeMode = editorTabReducer(undefined, revealInCode());
        const requested = editorTabReducer(codeMode, requestSound('sprite', 1));
        expect(requested.requestedSound).toBeNull();
        expect(requested.reveal).toEqual(expect.objectContaining({kind: 'sound', targetId: 'sprite', index: 1}));
    });

    test('switching editor mode drops a pending request', () => {
        const requested = editorTabReducer(undefined, requestSound('sprite', 1));
        expect(editorTabReducer(requested, revealInCode()).requestedSound).toBeNull();
        expect(editorTabReducer(requested, showBlocksTab(SOUNDS_TAB_INDEX)).requestedSound).toBeNull();
    });
});
