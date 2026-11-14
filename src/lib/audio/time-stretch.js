import {clipLength} from './sound-data.js';

const FRAME_SECONDS = 0.04;
const SEARCH_SECONDS = 0.012;
const DECIMATION = 4;
const YIELD_FRAMES = 120;

const pause = () => new Promise(resolve => setTimeout(resolve, 0));

const mixDown = clip => {
    const length = clipLength(clip);
    const mono = new Float32Array(length);
    for (const channel of clip.channels) {
        for (let i = 0; i < length; i++) mono[i] += channel[i];
    }
    return mono;
};

const decimate = (samples, factor) => {
    const out = new Float32Array(Math.floor(samples.length / factor));
    for (let i = 0; i < out.length; i++) {
        let sum = 0;
        for (let j = 0; j < factor; j++) sum += samples[(i * factor) + j];
        out[i] = sum / factor;
    }
    return out;
};

const hannWindow = size => {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) window[i] = 0.5 - (0.5 * Math.cos((2 * Math.PI * i) / size));
    return window;
};

const similarity = (samples, a, b, length, stride) => {
    let sum = 0;
    let energy = 0;
    const end = Math.min(length, samples.length - a, samples.length - b);
    for (let i = 0; i < end; i += stride) {
        const value = samples[b + i];
        sum += samples[a + i] * value;
        energy += value * value;
    }
    return sum / Math.sqrt(energy + 1e-9);
};

const bestOffset = (samples, natural, target, radius, length, step, stride) => {
    let best = 0;
    let bestScore = -Infinity;
    for (let offset = -radius; offset <= radius; offset += step) {
        const candidate = target + offset;
        if (candidate < 0 || candidate >= samples.length) continue;
        const score = similarity(samples, natural, candidate, length, stride);
        if (score > bestScore) {
            bestScore = score;
            best = offset;
        }
    }
    return best;
};

const resampleLinear = (clip, newLength) => {
    const length = clipLength(clip);
    const scale = newLength > 1 ? (length - 1) / (newLength - 1) : 0;
    return {
        channels: clip.channels.map(channel => {
            const out = new Float32Array(newLength);
            for (let i = 0; i < newLength; i++) {
                const position = i * scale;
                const index = Math.floor(position);
                const next = Math.min(length - 1, index + 1);
                out[i] = channel[index] + ((channel[next] - channel[index]) * (position - index));
            }
            return out;
        }),
        sampleRate: clip.sampleRate
    };
};

const stretchClip = async (clip, factor) => {
    const length = clipLength(clip);
    const newLength = Math.max(1, Math.round(length * factor));
    const frame = Math.max(8, Math.round(clip.sampleRate * FRAME_SECONDS / 2) * 2);
    if (length < frame * 2 || Math.abs(factor - 1) < 1e-6) return resampleLinear(clip, newLength);

    const hop = frame / 2;
    const analysisHop = hop / factor;
    const radius = Math.max(DECIMATION, Math.round(clip.sampleRate * SEARCH_SECONDS));
    const mono = mixDown(clip);
    const coarse = decimate(mono, DECIMATION);
    const window = hannWindow(frame);
    const frames = Math.ceil(newLength / hop) + 1;
    const outputs = clip.channels.map(() => new Float32Array(newLength));
    const weight = new Float32Array(newLength);

    let previous = 0;
    for (let k = 0; k < frames; k++) {
        let position = 0;
        if (k > 0) {
            const target = Math.round(k * analysisHop);
            const natural = previous + hop;
            const rough = DECIMATION * bestOffset(
                coarse,
                Math.round(natural / DECIMATION),
                Math.round(target / DECIMATION),
                Math.round(radius / DECIMATION),
                Math.round(frame / DECIMATION),
                1,
                1
            );
            const fine = bestOffset(mono, natural, target + rough, DECIMATION, frame, 1, 2);
            position = Math.max(0, Math.min(length - 1, target + rough + fine));
        }
        previous = position;
        const start = k * hop;
        const count = Math.min(frame, newLength - start, length - position);
        for (let i = 0; i < count; i++) weight[start + i] += window[i];
        for (let c = 0; c < outputs.length; c++) {
            const source = clip.channels[c];
            const out = outputs[c];
            for (let i = 0; i < count; i++) out[start + i] += window[i] * source[position + i];
        }
        if (k % YIELD_FRAMES === YIELD_FRAMES - 1) await pause();
    }

    for (const out of outputs) {
        for (let i = 0; i < newLength; i++) {
            if (weight[i] > 1e-3) out[i] /= weight[i];
        }
    }
    return {channels: outputs, sampleRate: clip.sampleRate};
};

export {
    resampleLinear,
    stretchClip
};
