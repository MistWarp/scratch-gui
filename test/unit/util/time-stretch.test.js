import {resampleLinear, stretchClip} from '../../../src/lib/audio/time-stretch';

const RATE = 8000;

const sine = (frequency, seconds, phase = 0) => {
    const samples = new Float32Array(Math.round(RATE * seconds));
    for (let i = 0; i < samples.length; i++) samples[i] = Math.sin((2 * Math.PI * frequency * i / RATE) + phase);
    return samples;
};

const crossingsPerSecond = (samples, from, to) => {
    let count = 0;
    for (let i = from + 1; i < to; i++) {
        if ((samples[i - 1] < 0) !== (samples[i] < 0)) count++;
    }
    return count / ((to - from) / RATE);
};

const rms = (samples, from, to) => {
    let sum = 0;
    for (let i = from; i < to; i++) sum += samples[i] * samples[i];
    return Math.sqrt(sum / (to - from));
};

describe('time stretch', () => {
    test('makes audio longer without changing its pitch', async () => {
        const clip = {channels: [sine(440, 1)], sampleRate: RATE};
        const stretched = await stretchClip(clip, 1.5);
        const out = stretched.channels[0];
        expect(out.length).toBe(12000);
        expect(crossingsPerSecond(out, 1000, 11000)).toBeGreaterThan(860);
        expect(crossingsPerSecond(out, 1000, 11000)).toBeLessThan(900);
        expect(rms(out, 1000, 11000)).toBeGreaterThan(0.6);
        expect(rms(out, 1000, 11000)).toBeLessThan(0.8);
    });

    test('makes audio shorter without changing its pitch', async () => {
        const clip = {channels: [sine(300, 2)], sampleRate: RATE};
        const stretched = await stretchClip(clip, 0.5);
        const out = stretched.channels[0];
        expect(out.length).toBe(8000);
        expect(crossingsPerSecond(out, 500, 7500)).toBeGreaterThan(585);
        expect(crossingsPerSecond(out, 500, 7500)).toBeLessThan(615);
    });

    test('keeps stereo channels in step with each other', async () => {
        const left = sine(200, 1);
        const clip = {channels: [left, left.map(value => -value)], sampleRate: RATE};
        const stretched = await stretchClip(clip, 1.25);
        expect(stretched.channels.length).toBe(2);
        const [a, b] = stretched.channels;
        let worst = 0;
        for (let i = 0; i < a.length; i++) worst = Math.max(worst, Math.abs(a[i] + b[i]));
        expect(worst).toBeLessThan(1e-5);
    });

    test('very short audio is resampled instead', async () => {
        const clip = {channels: [new Float32Array([0, 1, 0, -1])], sampleRate: RATE};
        const stretched = await stretchClip(clip, 2);
        expect(stretched.channels[0].length).toBe(8);
        expect(stretched.sampleRate).toBe(RATE);
    });

    test('linear resampling keeps the first and last samples', () => {
        const out = resampleLinear({channels: [new Float32Array([0, 1, 2])], sampleRate: RATE}, 5).channels[0];
        expect(Array.from(out)).toEqual([0, 0.5, 1, 1.5, 2]);
    });
});
