import React from 'react';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import configureStore from 'redux-mock-store';
import mockAudioBufferPlayer from '../../__mocks__/audio-buffer-player.js';

import SoundEditor from '../../../src/containers/sound-editor';
import SoundEditorComponent from '../../../src/components/sound-editor/sound-editor';

jest.mock('../../../src/lib/audio/audio-buffer-player', () => mockAudioBufferPlayer);
jest.mock('../../../src/components/sound-editor/sound-timeline.jsx', () => () => null);
jest.mock('../../../src/lib/audio/audio-util.js', () => ({
    downsampleClipIfNeeded: jest.fn(clip => Promise.resolve(clip)),
    encodeAndAddClipToVM: jest.fn(() => Promise.resolve()),
    encodeClip: jest.fn(() => Promise.resolve(new Uint8Array([1]))),
    resampleClip: jest.fn((clip, rate) => Promise.resolve({channels: clip.channels, sampleRate: rate}))
}));

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

const makeBuffer = (channels, sampleRate = 100) => ({
    numberOfChannels: channels.length,
    sampleRate,
    getChannelData: jest.fn(c => channels[c])
});

describe('Sound Editor Container', () => {
    const mockStore = configureStore();
    let buffers;
    let vm;
    let store;
    let mounted = [];

    const mount = (soundIndex = 0) => {
        const wrapper = mountWithIntl(
            <SoundEditor
                soundIndex={soundIndex}
                store={store}
            />
        );
        mounted.push(wrapper);
        return wrapper;
    };
    const props = wrapper => {
        wrapper.update();
        return wrapper.find(SoundEditorComponent).props();
    };
    const samples = wrapper => Array.from(props(wrapper).clip.channels[0]);

    afterEach(() => {
        mounted.forEach(wrapper => wrapper.unmount());
        mounted = [];
    });

    beforeEach(() => {
        mockAudioBufferPlayer.instances = [];
        buffers = [
            makeBuffer([new Float32Array([0.1, 0.2, 0.3, 0.4])]),
            makeBuffer([new Float32Array([0.5, 0.5]), new Float32Array([0.25, 0.25])])
        ];
        vm = {
            getSoundBuffer: jest.fn(index => buffers[index]),
            renameSound: jest.fn(),
            updateSoundBuffer: jest.fn(),
            editingTarget: {
                id: 'sprite',
                sprite: {
                    sounds: [
                        {name: 'first', soundId: 'a', asset: {data: new Uint8Array(10)}},
                        {name: 'second', soundId: 'b'}
                    ]
                }
            }
        };
        store = mockStore({scratchGui: {vm, mode: {isFullScreen: false}, theme: {theme: {}}}});
    });

    test('passes the sound and the initial state to the component', () => {
        const wrapper = mount();
        const componentProps = props(wrapper);
        expect(componentProps.name).toEqual('first');
        expect(componentProps.size).toEqual(10);
        expect(componentProps.sampleRate).toEqual(100);
        expect(componentProps.isStereo).toBe(false);
        expect(componentProps.duration).toBeCloseTo(0.04);
        expect(componentProps.selection).toBeNull();
        expect(componentProps.playhead).toBeNull();
        expect(componentProps.canUndo).toBe(false);
        expect(componentProps.mixSources).toEqual([{index: '1', name: 'second'}]);
        expect(samples(wrapper)).toEqual([0.1, 0.2, 0.3, 0.4].map(Math.fround));
    });

    test('keeps both channels of a stereo sound', () => {
        const wrapper = mount(1);
        expect(props(wrapper).isStereo).toBe(true);
        expect(props(wrapper).clip.channels.length).toBe(2);
    });

    test('plays the selection and pauses where it is', () => {
        const wrapper = mount();
        props(wrapper).onSelect(1, 3);
        props(wrapper).onPlay();
        const player = mockAudioBufferPlayer.instance;
        expect(player.playRange).toHaveBeenCalledWith(expect.objectContaining({start: 1, end: 3, from: 1}));
        player.onUpdate(2, [0.5]);
        expect(props(wrapper).playhead).toBe(2);
        expect(props(wrapper).levels).toEqual([0.5]);
        player.position = 2;
        props(wrapper).onPause();
        expect(player.stop).toHaveBeenCalled();
        expect(props(wrapper).playing).toBe(false);
        props(wrapper).onPlay();
        expect(player.playRange).toHaveBeenLastCalledWith(expect.objectContaining({from: 2}));
        player.onEnded();
        expect(props(wrapper).playing).toBe(false);
        expect(props(wrapper).playhead).toBeNull();
    });

    test('loops playback when loop is on', () => {
        const wrapper = mount();
        props(wrapper).onToggleLoop();
        expect(props(wrapper).loop).toBe(true);
        props(wrapper).onPlay();
        expect(mockAudioBufferPlayer.instance.playRange).toHaveBeenCalledWith(expect.objectContaining({loop: true}));
    });

    test('submits name changes to the vm but ignores empty names', () => {
        const wrapper = mount();
        props(wrapper).onChangeName('hello');
        props(wrapper).onChangeName('  ');
        expect(vm.renameSound).toHaveBeenCalledTimes(1);
        expect(vm.renameSound).toHaveBeenCalledWith(0, 'hello');
    });

    test('deletes the selection, then undoes and redoes it', async () => {
        const wrapper = mount();
        props(wrapper).onSelect(1, 3);
        await props(wrapper).onDelete();
        expect(samples(wrapper)).toEqual([0.1, 0.4].map(Math.fround));
        expect(vm.updateSoundBuffer).toHaveBeenCalledTimes(1);
        expect(props(wrapper).selection).toBeNull();
        expect(props(wrapper).cursor).toBe(1);
        expect(props(wrapper).canUndo).toBe(true);

        await props(wrapper).onUndo();
        expect(samples(wrapper).length).toBe(4);
        expect(props(wrapper).selection).toEqual({start: 1, end: 3});
        expect(props(wrapper).canRedo).toBe(true);

        await props(wrapper).onRedo();
        expect(samples(wrapper).length).toBe(2);
        expect(props(wrapper).canRedo).toBe(false);
    });

    test('does not delete without a selection or when everything is selected', async () => {
        const wrapper = mount();
        expect(await props(wrapper).onDelete()).toBe(false);
        props(wrapper).onSelect(0, 4);
        expect(props(wrapper).canRemove).toBe(false);
        expect(await props(wrapper).onDelete()).toBe(false);
        expect(await props(wrapper).onCut()).toBe(false);
        expect(vm.updateSoundBuffer).not.toHaveBeenCalled();
    });

    test('trims to the selection', async () => {
        const wrapper = mount();
        props(wrapper).onSelect(1, 3);
        await props(wrapper).onTrim();
        expect(samples(wrapper)).toEqual([0.2, 0.3].map(Math.fround));
    });

    test('copies and pastes at the cursor', async () => {
        const wrapper = mount();
        props(wrapper).onSelect(0, 2);
        props(wrapper).onCopy();
        expect(props(wrapper).canPaste).toBe(true);
        props(wrapper).onSeek(4);
        await props(wrapper).onPaste();
        expect(samples(wrapper)).toEqual([0.1, 0.2, 0.3, 0.4, 0.1, 0.2].map(Math.fround));
        expect(props(wrapper).selection).toEqual({start: 4, end: 6});
    });

    test('keeps the sound when saving fails', async () => {
        const audioUtil = require('../../../src/lib/audio/audio-util.js');
        audioUtil.encodeClip.mockImplementationOnce(() => Promise.reject(new Error('nope')));
        const wrapper = mount();
        props(wrapper).onSelect(1, 3);
        expect(await props(wrapper).onDelete()).toBe(false);
        expect(samples(wrapper).length).toBe(4);
        expect(props(wrapper).selection).toEqual({start: 1, end: 3});
        expect(props(wrapper).canUndo).toBe(false);
    });

    test('applies the active tool to the selection', async () => {
        const wrapper = mount();
        props(wrapper).onSelectTool({currentTarget: {getAttribute: () => 'silence'}});
        expect(props(wrapper).activeTool).toBe('silence');
        props(wrapper).onSelect(1, 3);
        await props(wrapper).onApply();
        expect(samples(wrapper)).toEqual([0.1, 0, 0, 0.4].map(Math.fround));
        expect(props(wrapper).selection).toEqual({start: 1, end: 3});
    });

    test('changes tool parameters', async () => {
        const wrapper = mount();
        props(wrapper).onChangeParam({target: {getAttribute: () => 'db', value: '-6'}});
        expect(props(wrapper).toolParams).toEqual({db: -6});
        await props(wrapper).onApply();
        expect(samples(wrapper)[3]).toBeCloseTo(0.2, 2);
    });

    test('switching group picks its first tool', () => {
        const wrapper = mount();
        props(wrapper).onSelectGroup({currentTarget: {getAttribute: () => 'time'}});
        expect(props(wrapper).activeGroup).toBe('time');
        expect(props(wrapper).activeTool).toBe('speed');
    });

    test('mixes another sound in at the cursor', async () => {
        const wrapper = mount();
        props(wrapper).onSelectGroup({currentTarget: {getAttribute: () => 'mix'}});
        props(wrapper).onSeek(3);
        await props(wrapper).onApply();
        const mixed = samples(wrapper);
        expect(mixed.length).toBe(5);
        expect(mixed[3]).toBeCloseTo(0.4 + 0.375, 5);
        expect(props(wrapper).clip.channels.length).toBe(1);
    });

    test('previews a tool without changing the sound', async () => {
        const wrapper = mount();
        await props(wrapper).onPreview();
        expect(props(wrapper).previewing).toBe(true);
        const preview = mockAudioBufferPlayer.instance;
        expect(preview.playRange).toHaveBeenCalledWith(expect.objectContaining({start: 0, end: 4}));
        expect(vm.updateSoundBuffer).not.toHaveBeenCalled();
        preview.onEnded();
        expect(props(wrapper).previewing).toBe(false);
    });

    test('zooms in and out within the sound', () => {
        buffers[0] = makeBuffer([new Float32Array(1000)]);
        const wrapper = mount();
        expect(props(wrapper).canZoomOut).toBe(false);
        props(wrapper).onZoomIn();
        expect(props(wrapper).viewLength).toBe(500);
        expect(props(wrapper).canZoomOut).toBe(true);
        props(wrapper).onView(900, 500);
        expect(props(wrapper).viewStart).toBe(500);
        props(wrapper).onZoomFit();
        expect(props(wrapper).viewLength).toBe(1000);
        expect(props(wrapper).viewStart).toBe(0);
    });

    test('typed start and end times select a range', () => {
        const wrapper = mount();
        props(wrapper).onSubmitStart('0.01');
        expect(props(wrapper).cursor).toBe(1);
        props(wrapper).onSubmitEnd('0.03');
        expect(props(wrapper).selection).toEqual({start: 1, end: 3});
        props(wrapper).onSubmitEnd('nonsense');
        expect(props(wrapper).selection).toEqual({start: 1, end: 3});
    });

    test('keyboard shortcuts select, delete and undo', async () => {
        const wrapper = mount();
        const press = (key, extra = {}) => document.dispatchEvent(
            new KeyboardEvent('keydown', {key, bubbles: true, cancelable: true, ...extra})
        );
        press('a', {ctrlKey: true});
        expect(props(wrapper).selection).toEqual({start: 0, end: 4});
        props(wrapper).onSelect(0, 1);
        press('Delete');
        await flush();
        expect(samples(wrapper).length).toBe(3);
        press('z', {ctrlKey: true});
        await flush();
        expect(samples(wrapper).length).toBe(4);
        press('Escape');
        expect(props(wrapper).selection).toBeNull();
    });

    test('an edit still running when the sound changes is not saved into the new sound', async () => {
        const audioUtil = require('../../../src/lib/audio/audio-util.js');
        let finish;
        audioUtil.resampleClip.mockImplementationOnce(clip => new Promise(resolve => {
            finish = () => resolve({channels: clip.channels, sampleRate: 100});
        }));
        const wrapper = mount();
        props(wrapper).onSelect(0, 2);
        props(wrapper).onCopy();
        buffers[1] = makeBuffer([new Float32Array([1, 1])], 50);
        wrapper.setProps({soundIndex: 1});
        const pending = props(wrapper).onPaste();
        await flush();
        wrapper.setProps({soundIndex: 0});
        finish();
        expect(await pending).toBe(false);
        expect(vm.updateSoundBuffer).not.toHaveBeenCalled();
        expect(props(wrapper).busy).toBe(false);
    });

    test('undo is ignored while an edit is running and history survives repeats', async () => {
        const wrapper = mount();
        props(wrapper).onSelect(0, 1);
        await props(wrapper).onDelete();
        props(wrapper).onSelect(0, 1);
        await props(wrapper).onDelete();
        expect(samples(wrapper).length).toBe(2);
        const first = props(wrapper).onUndo();
        const second = props(wrapper).onUndo();
        expect(await second).toBe(false);
        expect(await first).toBe(true);
        expect(samples(wrapper).length).toBe(3);
        expect(await props(wrapper).onUndo()).toBe(true);
        expect(samples(wrapper).length).toBe(4);
        expect(await props(wrapper).onRedo()).toBe(true);
        expect(await props(wrapper).onRedo()).toBe(true);
        expect(samples(wrapper).length).toBe(2);
    });

    test('an edit that changes nothing does not add an undo step', async () => {
        const wrapper = mount();
        props(wrapper).onChangeParam({target: {getAttribute: () => 'db', value: '0'}});
        expect(await props(wrapper).onApply()).toBe(false);
        expect(props(wrapper).canUndo).toBe(false);
        expect(vm.updateSoundBuffer).not.toHaveBeenCalled();
    });

    test('a failed undo keeps the step', async () => {
        const audioUtil = require('../../../src/lib/audio/audio-util.js');
        const wrapper = mount();
        props(wrapper).onSelect(0, 1);
        await props(wrapper).onDelete();
        audioUtil.encodeClip.mockImplementationOnce(() => Promise.reject(new Error('nope')));
        expect(await props(wrapper).onUndo()).toBe(false);
        expect(props(wrapper).canUndo).toBe(true);
        expect(await props(wrapper).onUndo()).toBe(true);
        expect(samples(wrapper).length).toBe(4);
    });

    test('Shift and the arrow keys extend the selection both ways', () => {
        buffers[0] = makeBuffer([new Float32Array(1000)]);
        const wrapper = mount();
        const press = (key, extra = {}) => document.dispatchEvent(
            new KeyboardEvent('keydown', {key, bubbles: true, cancelable: true, ...extra})
        );
        props(wrapper).onSeek(500);
        press('ArrowLeft', {shiftKey: true});
        expect(props(wrapper).selection).toEqual({start: 480, end: 500});
        press('ArrowLeft', {shiftKey: true});
        expect(props(wrapper).selection).toEqual({start: 460, end: 500});
        press('ArrowRight', {shiftKey: true});
        expect(props(wrapper).selection).toEqual({start: 480, end: 500});
    });

    test('clicking the waveform during a preview ends it', async () => {
        const wrapper = mount();
        await props(wrapper).onPreview();
        expect(props(wrapper).previewing).toBe(true);
        props(wrapper).onSeek(1);
        expect(props(wrapper).previewing).toBe(false);
    });

    test('loads the new sound when the sound changes', async () => {
        const wrapper = mount();
        props(wrapper).onSelect(1, 3);
        await props(wrapper).onDelete();
        wrapper.setProps({soundIndex: 1});
        expect(props(wrapper).isStereo).toBe(true);
        expect(props(wrapper).canUndo).toBe(false);
        expect(props(wrapper).selection).toBeNull();
    });
});
