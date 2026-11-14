import {
    applyGain,
    buildPeakIndex,
    levelOf,
    clipLength,
    computePeaks,
    createClip,
    dbToGain,
    encodedByteLength,
    fadeRange,
    fromAudioBuffer,
    fromSamples,
    gainToDb,
    insertClip,
    insertSilence,
    isSameClip,
    matchChannels,
    mixInto,
    normalizeToPeak,
    peakOf,
    removeRange,
    replaceRange,
    reverseRange,
    silenceRange,
    sliceClip,
    spliceProcessed
} from '../../../src/lib/audio/sound-data';

const mono = values => fromSamples(new Float32Array(values), 100);
const stereo = (left, right) => ({channels: [new Float32Array(left), new Float32Array(right)], sampleRate: 100});
const values = (clip, channel = 0) => Array.from(clip.channels[channel]);
const rounded = (clip, channel = 0) => values(clip, channel).map(value => Math.round(value * 1000) / 1000);

describe('sound data', () => {
    test('reads every channel of an audio buffer', () => {
        const data = [new Float32Array([1, 2]), new Float32Array([3, 4])];
        const clip = fromAudioBuffer({
            numberOfChannels: 2,
            sampleRate: 48000,
            getChannelData: i => data[i]
        });
        expect(clip.channels.length).toEqual(2);
        expect(values(clip, 1)).toEqual([3, 4]);
        expect(clip.channels[0]).not.toBe(data[0]);
        expect(clip.sampleRate).toEqual(48000);
    });

    test('creates silent clips', () => {
        const clip = createClip(2, 3, 100);
        expect(clipLength(clip)).toEqual(3);
        expect(values(clip, 1)).toEqual([0, 0, 0]);
        expect(clipLength({channels: [], sampleRate: 1})).toEqual(0);
    });

    test('matches channel counts', () => {
        expect(values(matchChannels(stereo([1, 0], [0, 1]), 1))).toEqual([0.5, 0.5]);
        const widened = matchChannels(mono([1, 2]), 2);
        expect(values(widened, 1)).toEqual([1, 2]);
        const same = mono([1]);
        expect(matchChannels(same, 1)).toBe(same);
    });

    test('slices, removes and inserts ranges on every channel', () => {
        const clip = stereo([0, 1, 2, 3], [4, 5, 6, 7]);
        expect(values(sliceClip(clip, 1, 3), 1)).toEqual([5, 6]);
        expect(values(sliceClip(clip, 3, 1))).toEqual([1, 2]);
        expect(values(removeRange(clip, 1, 3), 1)).toEqual([4, 7]);
        expect(values(insertClip(clip, 2, mono([9])), 1)).toEqual([4, 5, 9, 6, 7]);
        expect(values(replaceRange(clip, 0, 2, mono([8])))).toEqual([8, 2, 3]);
        expect(values(insertSilence(mono([1, 2]), 1, 2))).toEqual([1, 0, 0, 2]);
    });

    test('never removes the last sample', () => {
        expect(clipLength(removeRange(mono([1, 2]), 0, 2))).toEqual(1);
    });

    test('changes the volume of a range', () => {
        expect(values(applyGain(mono([1, 1, 1]), 1, 2, 2))).toEqual([1, 2, 1]);
        expect(values(silenceRange(mono([1, 1, 1]), 0, 2))).toEqual([0, 0, 1]);
        expect(dbToGain(0)).toEqual(1);
        expect(gainToDb(1)).toEqual(0);
        expect(gainToDb(0)).toEqual(-Infinity);
    });

    test('fades a range in or out', () => {
        expect(rounded(fadeRange(mono([1, 1, 1]), 0, 3, 'in', 'linear'))).toEqual([0, 0.5, 1]);
        expect(rounded(fadeRange(mono([1, 1, 1]), 0, 3, 'out', 'linear'))).toEqual([1, 0.5, 0]);
        expect(rounded(fadeRange(mono([1, 1, 1, 1, 1]), 0, 5, 'in', 'smooth'))).toEqual([0, 0.146, 0.5, 0.854, 1]);
    });

    test('reverses a range', () => {
        expect(values(reverseRange(stereo([1, 2, 3, 4], [5, 6, 7, 8]), 1, 4, 1), 1)).toEqual([5, 8, 7, 6]);
    });

    test('finds the peak and normalizes to it', () => {
        const clip = stereo([0.1, -0.25], [0.2, 0]);
        expect(peakOf(clip)).toEqual(0.25);
        expect(rounded(normalizeToPeak(clip, 0, 2, 0))).toEqual([0.4, -1]);
        const silent = mono([0, 0]);
        expect(normalizeToPeak(silent, 0, 2, 0)).toBe(silent);
    });

    test('mixes another clip in and grows the clip when it runs past the end', () => {
        const mixed = mixInto(mono([1, 1, 1]), 2, mono([1, 1]), 0.5);
        expect(values(mixed)).toEqual([1, 1, 1.5, 0.5]);
        const intoStereo = mixInto(stereo([0, 0], [0, 0]), 0, mono([1]));
        expect(values(intoStereo, 1)).toEqual([1, 0]);
    });

    test('splices processed audio and mixes its tail over what follows', () => {
        const clip = mono([1, 1, 1, 1]);
        const processed = mono([2, 2, 0.5]);
        expect(values(spliceProcessed(clip, 0, 2, processed, 2))).toEqual([2, 2, 1.5, 1]);
        expect(values(spliceProcessed(clip, 1, 3, mono([3]), 1))).toEqual([1, 3, 1]);
    });

    test('computes peaks per column', () => {
        const {min, max} = computePeaks(new Float32Array([0.5, -0.5, 1, -1]), 0, 4, 2);
        expect(Array.from(min)).toEqual([-0.5, -1]);
        expect(Array.from(max)).toEqual([0.5, 1]);
        const empty = computePeaks(new Float32Array([1]), 5, 7, 2);
        expect(Array.from(empty.max)).toEqual([0, 0]);
    });

    test('a peak index gives the same answers as scanning every sample', () => {
        const data = new Float32Array(5000);
        for (let i = 0; i < data.length; i++) data[i] = Math.sin(i * 0.37) * (i % 977) / 977;
        const clip = stereo(data, data.map(value => -value / 2));
        const index = buildPeakIndex(clip, 64);
        expect(peakOf(clip, 13, 4321, index)).toEqual(peakOf(clip, 13, 4321));
        expect(peakOf(clip, 0, 5000, index)).toEqual(peakOf(clip));
        const fast = computePeaks(clip.channels[1], 7, 4990, 37, levelOf(index, 1));
        const slow = computePeaks(clip.channels[1], 7, 4990, 37);
        expect(Array.from(fast.min)).toEqual(Array.from(slow.min));
        expect(Array.from(fast.max)).toEqual(Array.from(slow.max));
    });

    test('estimates the encoded size and compares clips', () => {
        expect(encodedByteLength(stereo([0, 0], [0, 0]))).toEqual(8);
        expect(isSameClip(mono([1, 2]), mono([1, 2]))).toBe(true);
        expect(isSameClip(mono([1, 2]), mono([1, 3]))).toBe(false);
        expect(isSameClip(mono([1]), stereo([1], [1]))).toBe(false);
        expect(isSameClip(mono([1]), null)).toBe(false);
    });
});
