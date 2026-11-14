const clampIndex = (value, length) => Math.max(0, Math.min(length, Math.round(value)));

const clipLength = clip => (clip.channels.length ? clip.channels[0].length : 0);

const createClip = (channelCount, length, sampleRate) => ({
    channels: Array.from({length: channelCount}, () => new Float32Array(length)),
    sampleRate
});

const fromAudioBuffer = buffer => {
    const channels = [];
    for (let i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(new Float32Array(buffer.getChannelData(i)));
    }
    return {channels, sampleRate: buffer.sampleRate};
};

const fromSamples = (samples, sampleRate) => ({
    channels: [new Float32Array(samples)],
    sampleRate
});

const normalizeRange = (clip, start, end) => {
    const length = clipLength(clip);
    const a = clampIndex(start, length);
    const b = clampIndex(end, length);
    return a <= b ? [a, b] : [b, a];
};

const matchChannels = (clip, channelCount) => {
    if (clip.channels.length === channelCount) return clip;
    const length = clipLength(clip);
    if (channelCount === 1) {
        const mixed = new Float32Array(length);
        for (const channel of clip.channels) {
            for (let i = 0; i < length; i++) mixed[i] += channel[i] / clip.channels.length;
        }
        return {channels: [mixed], sampleRate: clip.sampleRate};
    }
    const channels = [];
    for (let c = 0; c < channelCount; c++) {
        channels.push(new Float32Array(clip.channels[Math.min(c, clip.channels.length - 1)]));
    }
    return {channels, sampleRate: clip.sampleRate};
};

const sliceClip = (clip, start, end) => {
    const [a, b] = normalizeRange(clip, start, end);
    return {
        channels: clip.channels.map(channel => channel.slice(a, b)),
        sampleRate: clip.sampleRate
    };
};

const replaceRange = (clip, start, end, insert) => {
    const [a, b] = normalizeRange(clip, start, end);
    const other = insert ? matchChannels(insert, clip.channels.length) : null;
    const insertLength = other ? clipLength(other) : 0;
    const length = clipLength(clip);
    const newLength = Math.max(1, length - (b - a) + insertLength);
    return {
        channels: clip.channels.map((channel, c) => {
            const out = new Float32Array(newLength);
            out.set(channel.subarray(0, a), 0);
            if (other) out.set(other.channels[c], a);
            out.set(channel.subarray(b), a + insertLength);
            return out;
        }),
        sampleRate: clip.sampleRate
    };
};

const removeRange = (clip, start, end) => replaceRange(clip, start, end, null);

const insertClip = (clip, at, insert) => replaceRange(clip, at, at, insert);

const insertSilence = (clip, at, length) => insertClip(
    clip,
    at,
    createClip(clip.channels.length, Math.max(0, Math.round(length)), clip.sampleRate)
);

const mapRange = (clip, start, end, fn) => {
    const [a, b] = normalizeRange(clip, start, end);
    return {
        channels: clip.channels.map((channel, c) => {
            const out = new Float32Array(channel);
            for (let i = a; i < b; i++) out[i] = fn(channel[i], i - a, b - a, c);
            return out;
        }),
        sampleRate: clip.sampleRate
    };
};

const dbToGain = db => Math.pow(10, db / 20);

const gainToDb = gain => (gain > 0 ? 20 * Math.log10(gain) : -Infinity);

const applyGain = (clip, start, end, gain) => mapRange(clip, start, end, value => value * gain);

const silenceRange = (clip, start, end) => mapRange(clip, start, end, () => 0);

const fadeCurve = (t, shape) => (shape === 'smooth' ? 0.5 - (0.5 * Math.cos(Math.PI * t)) : t);

const fadeRange = (clip, start, end, direction, shape = 'linear') => mapRange(
    clip,
    start,
    end,
    (value, index, length) => {
        const t = length > 1 ? index / (length - 1) : 1;
        const amount = fadeCurve(direction === 'in' ? t : 1 - t, shape);
        return value * amount;
    }
);

const reverseRange = (clip, start, end) => {
    const [a, b] = normalizeRange(clip, start, end);
    return {
        channels: clip.channels.map(channel => {
            const out = new Float32Array(channel);
            for (let i = a; i < b; i++) out[i] = channel[b - 1 - (i - a)];
            return out;
        }),
        sampleRate: clip.sampleRate
    };
};

const PEAK_BLOCK = 256;

const buildPeakIndex = (clip, blockSize = PEAK_BLOCK) => ({
    blockSize,
    channels: clip.channels.map(channel => {
        const count = Math.ceil(channel.length / blockSize);
        const min = new Float32Array(count);
        const max = new Float32Array(count);
        for (let block = 0; block < count; block++) {
            let lo = Infinity;
            let hi = -Infinity;
            const end = Math.min(channel.length, (block + 1) * blockSize);
            for (let i = block * blockSize; i < end; i++) {
                const value = channel[i];
                if (value < lo) lo = value;
                if (value > hi) hi = value;
            }
            min[block] = lo;
            max[block] = hi;
        }
        return {min, max};
    })
});

const scanSamples = (channel, from, to, result) => {
    for (let i = from; i < to; i++) {
        const value = channel[i];
        if (value < result.lo) result.lo = value;
        if (value > result.hi) result.hi = value;
    }
};

const scanRange = (channel, from, to, level) => {
    const result = {lo: Infinity, hi: -Infinity};
    const a = Math.max(0, from);
    const b = Math.min(channel.length, to);
    if (level && b - a >= level.blockSize * 2) {
        const size = level.blockSize;
        const firstBlock = Math.ceil(a / size);
        const lastBlock = Math.floor(b / size);
        scanSamples(channel, a, firstBlock * size, result);
        for (let block = firstBlock; block < lastBlock; block++) {
            if (level.min[block] < result.lo) result.lo = level.min[block];
            if (level.max[block] > result.hi) result.hi = level.max[block];
        }
        scanSamples(channel, lastBlock * size, b, result);
    } else {
        scanSamples(channel, a, b, result);
    }
    return result;
};

const levelOf = (index, channelIndex) => (
    index ? {blockSize: index.blockSize, ...index.channels[channelIndex]} : null
);

const peakOf = (clip, start = 0, end = clipLength(clip), index = null) => {
    const [a, b] = normalizeRange(clip, start, end);
    let peak = 0;
    clip.channels.forEach((channel, c) => {
        if (b <= a) return;
        const {lo, hi} = scanRange(channel, a, b, levelOf(index, c));
        peak = Math.max(peak, Math.abs(lo), Math.abs(hi));
    });
    return peak;
};

const normalizeToPeak = (clip, start, end, targetDb = -1) => {
    const peak = peakOf(clip, start, end);
    if (peak === 0) return clip;
    return applyGain(clip, start, end, dbToGain(targetDb) / peak);
};

const mixInto = (clip, at, other, gain = 1) => {
    const source = matchChannels(other, clip.channels.length);
    const length = clipLength(clip);
    const start = clampIndex(at, length);
    const otherLength = clipLength(source);
    const newLength = Math.max(length, start + otherLength);
    return {
        channels: clip.channels.map((channel, c) => {
            const out = new Float32Array(newLength);
            out.set(channel, 0);
            const add = source.channels[c];
            for (let i = 0; i < otherLength; i++) out[start + i] += add[i] * gain;
            return out;
        }),
        sampleRate: clip.sampleRate
    };
};

const spliceProcessed = (clip, start, end, processed, bodyLength) => {
    const [a, b] = normalizeRange(clip, start, end);
    const source = matchChannels(processed, clip.channels.length);
    const total = clipLength(source);
    const body = Math.max(0, Math.min(total, Math.round(bodyLength)));
    const replaced = replaceRange(clip, a, b, sliceClip(source, 0, body));
    if (body >= total) return replaced;
    return mixInto(replaced, a + body, sliceClip(source, body, total), 1);
};

const computePeaks = (channel, start, end, columns, level = null) => {
    const min = new Float32Array(columns);
    const max = new Float32Array(columns);
    const span = (end - start) / columns;
    for (let x = 0; x < columns; x++) {
        const from = Math.floor(start + (x * span));
        const to = Math.max(from + 1, Math.floor(start + ((x + 1) * span)));
        const {lo, hi} = scanRange(channel, from, to, level);
        min[x] = lo === Infinity ? 0 : lo;
        max[x] = hi === -Infinity ? 0 : hi;
    }
    return {min, max};
};

const nearestZeroCrossing = (clip, sample, radius) => {
    const length = clipLength(clip);
    if (sample <= 0 || sample >= length) return sample;
    const valueAt = index => {
        let sum = 0;
        for (const channel of clip.channels) sum += channel[index];
        return sum;
    };
    const crosses = index => {
        if (index <= 0 || index >= length) return false;
        const before = valueAt(index - 1);
        const after = valueAt(index);
        return before === 0 || after === 0 || (before < 0) !== (after < 0);
    };
    for (let distance = 0; distance <= radius; distance++) {
        if (crosses(sample - distance)) return sample - distance;
        if (crosses(sample + distance)) return sample + distance;
    }
    return sample;
};

const fitLength = (clip, length) => {
    const current = clipLength(clip);
    if (current === length) return clip;
    return {
        channels: clip.channels.map(channel => {
            const out = new Float32Array(length);
            out.set(channel.subarray(0, Math.min(current, length)));
            return out;
        }),
        sampleRate: clip.sampleRate
    };
};

const encodedByteLength = clip => clipLength(clip) * clip.channels.length * 2;

const isSameClip = (a, b) => {
    if (!a || !b || a.sampleRate !== b.sampleRate || a.channels.length !== b.channels.length) return false;
    return a.channels.every((channel, c) => {
        const other = b.channels[c];
        if (channel.length !== other.length) return false;
        for (let i = 0; i < channel.length; i++) {
            if (channel[i] !== other[i]) return false;
        }
        return true;
    });
};

export {
    applyGain,
    buildPeakIndex,
    clipLength,
    computePeaks,
    createClip,
    dbToGain,
    encodedByteLength,
    fadeRange,
    fitLength,
    fromAudioBuffer,
    fromSamples,
    gainToDb,
    insertClip,
    insertSilence,
    isSameClip,
    levelOf,
    mapRange,
    matchChannels,
    mixInto,
    nearestZeroCrossing,
    normalizeToPeak,
    peakOf,
    removeRange,
    replaceRange,
    reverseRange,
    silenceRange,
    sliceClip,
    spliceProcessed
};
