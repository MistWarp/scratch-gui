import {computePeaks} from './sound-data.js';

const WIDTH = 52;
const HEIGHT = 32;
const COLUMNS = 26;
const CACHE_LIMIT = 400;

const cache = new Map();

const lanePath = (samples, top, height, scale) => {
    const {min, max} = computePeaks(samples, 0, samples.length, COLUMNS);
    const middle = top + (height / 2);
    const half = (height / 2) - 1;
    const step = WIDTH / COLUMNS;
    let path = '';
    for (let x = 0; x < COLUMNS; x++) {
        const hi = Math.min(1, max[x] * scale);
        const lo = Math.max(-1, min[x] * scale);
        const y = middle - (hi * half);
        const barHeight = Math.max(1, (hi - lo) * half);
        path += `M${(x * step).toFixed(1)} ${y.toFixed(1)}h${(step - 0.6).toFixed(1)}v${barHeight.toFixed(1)}` +
            `h-${(step - 0.6).toFixed(1)}z`;
    }
    return path;
};

const buildThumbnail = (buffer, color) => {
    const channelCount = Math.min(2, buffer.numberOfChannels);
    const channels = [];
    let peak = 0;
    for (let c = 0; c < channelCount; c++) {
        const samples = buffer.getChannelData(c);
        channels.push(samples);
        for (let i = 0; i < samples.length; i++) {
            const value = Math.abs(samples[i]);
            if (value > peak) peak = value;
        }
    }
    const scale = peak > 0 ? 1 / peak : 1;
    const laneHeight = HEIGHT / channelCount;
    const path = channels.map((samples, c) => lanePath(samples, c * laneHeight, laneHeight, scale)).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" ` +
        `viewBox="0 0 ${WIDTH} ${HEIGHT}"><path fill="${color}" d="${path}"/></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const soundThumbnail = (key, buffer, color) => {
    if (!buffer || !buffer.numberOfChannels || typeof buffer.getChannelData !== 'function') return null;
    const cacheKey = `${key}:${color}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;
    const url = buildThumbnail(buffer, color);
    if (cache.size >= CACHE_LIMIT) cache.clear();
    cache.set(cacheKey, url);
    return url;
};

export default soundThumbnail;
