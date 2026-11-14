import React from 'react';
import {mountWithIntl} from '../../helpers/intl-helpers.jsx';
import mockAudioBufferPlayer from '../../__mocks__/audio-buffer-player.js';
import PlaybackStep from '../../../src/containers/playback-step';
import PlaybackStepComponent from '../../../src/components/record-modal/playback-step';

jest.mock('../../../src/lib/audio/audio-buffer-player', () => mockAudioBufferPlayer);
jest.mock('../../../src/components/sound-editor/sound-timeline.jsx', () => () => null);

describe('Record playback step', () => {
    let props;
    const mountStep = () => mountWithIntl(<PlaybackStep {...props} />);
    const inner = wrapper => {
        wrapper.update();
        return wrapper.find(PlaybackStepComponent).props();
    };

    beforeEach(() => {
        props = {
            encoding: false,
            playing: false,
            sampleRate: 100,
            samples: new Float32Array(100),
            trimStart: 0.2,
            trimEnd: 0.8,
            onBack: jest.fn(),
            onPlay: jest.fn(),
            onSetTrimEnd: jest.fn(),
            onSetTrimStart: jest.fn(),
            onStopPlaying: jest.fn(),
            onSubmit: jest.fn()
        };
    });

    test('shows the trim range as the selection and plays only that', () => {
        const wrapper = mountStep();
        expect(inner(wrapper).selection).toEqual({start: 20, end: 80});
        inner(wrapper).onPlay();
        const player = mockAudioBufferPlayer.instance;
        expect(player.playRange).toHaveBeenCalledWith(expect.objectContaining({start: 20, end: 80}));
        expect(props.onPlay).toHaveBeenCalled();
        player.onUpdate(40, [0.5]);
        expect(inner(wrapper).monitor.sample).toBe(40);
        player.onEnded();
        expect(inner(wrapper).monitor.sample).toBeNull();
        expect(props.onStopPlaying).toHaveBeenCalled();
    });

    test('dragging the selection changes the trim', () => {
        const wrapper = mountStep();
        inner(wrapper).onSelect(10, 50);
        expect(props.onSetTrimStart).toHaveBeenCalledWith(0.1);
        expect(props.onSetTrimEnd).toHaveBeenCalledWith(0.5);
        inner(wrapper).onSelect(30, 30);
        expect(props.onSetTrimStart).toHaveBeenCalledTimes(1);
    });

    test('stops playback when it unmounts', () => {
        const wrapper = mountStep();
        const player = mockAudioBufferPlayer.instance;
        wrapper.unmount();
        expect(player.stop).toHaveBeenCalled();
    });
});
