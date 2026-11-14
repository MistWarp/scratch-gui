import {
    applyGain,
    clipLength,
    dbToGain,
    fadeRange,
    fitLength,
    insertSilence,
    mixInto,
    normalizeToPeak,
    replaceRange,
    reverseRange,
    silenceRange,
    sliceClip,
    spliceProcessed
} from './sound-data.js';
import {renderEffect} from './effect-render.js';
import {stretchClip} from './time-stretch.js';

const TOOL_GROUPS = ['volume', 'time', 'effects', 'mix'];

const TOOLS = [
    {
        id: 'gain',
        group: 'volume',
        params: [{key: 'db', min: -24, max: 24, step: 0.5, nudge: 1, defaultValue: 3, unit: 'dB'}]
    },
    {
        id: 'normalize',
        group: 'volume',
        params: [{key: 'db', min: -12, max: 0, step: 0.5, nudge: 1, defaultValue: -1, unit: 'dB'}]
    },
    {
        id: 'fadeIn',
        group: 'volume',
        params: [{key: 'shape', options: ['linear', 'smooth'], defaultValue: 'smooth'}]
    },
    {
        id: 'fadeOut',
        group: 'volume',
        params: [{key: 'shape', options: ['linear', 'smooth'], defaultValue: 'smooth'}]
    },
    {
        id: 'silence',
        group: 'volume',
        params: []
    },
    {
        id: 'speed',
        group: 'time',
        params: [{key: 'percent', min: 50, max: 200, step: 1, nudge: 5, defaultValue: 125, unit: '%'}]
    },
    {
        id: 'stretch',
        group: 'time',
        params: [{key: 'percent', min: 50, max: 200, step: 1, nudge: 5, defaultValue: 150, unit: '%'}]
    },
    {
        id: 'pitch',
        group: 'time',
        params: [{key: 'semitones', min: -12, max: 12, step: 1, defaultValue: 3, unit: '', signed: true}]
    },
    {
        id: 'reverse',
        group: 'time',
        params: []
    },
    {
        id: 'insertSilence',
        group: 'time',
        atCursor: true,
        params: [{key: 'seconds', min: 0.1, max: 10, step: 0.1, nudge: 0.5, defaultValue: 1, unit: 's'}]
    },
    {
        id: 'echo',
        group: 'effects',
        params: [
            {key: 'delay', min: 50, max: 1000, step: 10, nudge: 50, defaultValue: 250, unit: 'ms'},
            {key: 'feedback', min: 0, max: 90, step: 1, nudge: 5, defaultValue: 30, unit: '%'}
        ]
    },
    {
        id: 'reverb',
        group: 'effects',
        params: [
            {key: 'size', min: 0.2, max: 4, step: 0.1, nudge: 0.5, defaultValue: 1.5, unit: 's'},
            {key: 'mix', min: 0, max: 100, step: 1, nudge: 5, defaultValue: 35, unit: '%'}
        ]
    },
    {
        id: 'robot',
        group: 'effects',
        params: []
    },
    {
        id: 'lowpass',
        group: 'effects',
        params: [{key: 'frequency', min: 100, max: 10000, step: 50, nudge: 200, defaultValue: 1200, unit: 'Hz'}]
    },
    {
        id: 'highpass',
        group: 'effects',
        params: [{key: 'frequency', min: 20, max: 5000, step: 10, nudge: 100, defaultValue: 600, unit: 'Hz'}]
    },
    {
        id: 'mix',
        group: 'mix',
        atCursor: true,
        needsSource: true,
        params: [{key: 'db', min: -24, max: 6, step: 0.5, nudge: 1, defaultValue: 0, unit: 'dB'}]
    }
];

const TOOLS_BY_ID = TOOLS.reduce((all, tool) => {
    all[tool.id] = tool;
    return all;
}, {});

const getTool = id => TOOLS_BY_ID[id] || null;

const defaultParams = id => {
    const tool = getTool(id);
    if (!tool) return {};
    return tool.params.reduce((params, param) => {
        params[param.key] = param.defaultValue;
        return params;
    }, {});
};

const clampParam = (param, value) => {
    if (param.options) return param.options.includes(value) ? value : param.defaultValue;
    const number = Number(value);
    if (!Number.isFinite(number)) return param.defaultValue;
    return Math.min(param.max, Math.max(param.min, number));
};

const findParam = (id, key) => {
    const tool = getTool(id);
    const param = tool && tool.params.find(item => item.key === key);
    return param && !param.options ? param : null;
};

const parseParam = (id, key, text) => {
    const param = findParam(id, key);
    const match = String(text).trim()
        .replace(',', '.')
        .replace('\u2212', '-')
        .match(/^[+-]?(\d+\.?\d*|\.\d+)/);
    if (!param || !match) return null;
    const stepped = param.min + (Math.round((Number(match[0]) - param.min) / param.step) * param.step);
    return Number(clampParam(param, stepped).toFixed(6));
};

const nudgeParam = (id, key, value, direction) => {
    const param = findParam(id, key);
    if (!param) return null;
    const size = param.nudge || param.step;
    const position = Number((value / size).toFixed(6));
    const next = direction > 0 ? Math.floor(position) + 1 : Math.ceil(position) - 1;
    return Number(clampParam(param, next * size).toFixed(6));
};

const resolveParams = (id, params) => {
    const tool = getTool(id);
    if (!tool) return {};
    return tool.params.reduce((resolved, param) => {
        resolved[param.key] = clampParam(param, params ? params[param.key] : param.defaultValue);
        return resolved;
    }, {});
};

const targetRange = (clip, selection) => {
    const length = clipLength(clip);
    if (selection && selection.end > selection.start) {
        return [Math.max(0, selection.start), Math.min(length, selection.end)];
    }
    return [0, length];
};

const keepSelection = (selection, start, newLength) => (
    selection ? {start, end: start + newLength} : null
);

const insertionPoint = (clip, selection, cursor) => {
    const length = clipLength(clip);
    const point = selection ? selection.start : cursor;
    return Math.max(0, Math.min(length, Math.round(point || 0)));
};

const renderRange = (clip, start, end, name, params, selection) =>
    renderEffect(sliceClip(clip, start, end), name, params).then(({clip: processed, bodyLength}) => ({
        clip: spliceProcessed(clip, start, end, processed, bodyLength),
        selection: keepSelection(selection, start, bodyLength),
        previewEnd: start + clipLength(processed),
        splice: {at: start, removed: end - start, inserted: bodyLength}
    }));

const replaceWith = (clip, start, end, processed, selection) => ({
    clip: replaceRange(clip, start, end, processed),
    selection: keepSelection(selection, start, clipLength(processed)),
    splice: {at: start, removed: end - start, inserted: clipLength(processed)}
});

const stretchRange = (clip, start, end, factor, selection) =>
    stretchClip(sliceClip(clip, start, end), factor)
        .then(processed => replaceWith(clip, start, end, processed, selection));

const pitchRange = (clip, start, end, semitones, selection) => {
    if (semitones === 0) return Promise.resolve(replaceWith(clip, start, end, sliceClip(clip, start, end), selection));
    const ratio = Math.pow(2, semitones / 12);
    return stretchClip(sliceClip(clip, start, end), ratio)
        .then(stretched => renderEffect(stretched, 'speed', {rate: ratio}))
        .then(({clip: processed}) => replaceWith(clip, start, end, fitLength(processed, end - start), selection));
};

const applyTool = (id, clip, {selection, cursor, params, source}) => {
    const settings = resolveParams(id, params);
    const [start, end] = targetRange(clip, selection);
    const same = next => Promise.resolve({clip: next, selection: keepSelection(selection, start, end - start)});
    switch (id) {
    case 'gain':
        return same(applyGain(clip, start, end, dbToGain(settings.db)));
    case 'normalize':
        return same(normalizeToPeak(clip, start, end, settings.db));
    case 'fadeIn':
        return same(fadeRange(clip, start, end, 'in', settings.shape));
    case 'fadeOut':
        return same(fadeRange(clip, start, end, 'out', settings.shape));
    case 'silence':
        return same(silenceRange(clip, start, end));
    case 'reverse':
        return same(reverseRange(clip, start, end));
    case 'speed':
        return renderRange(clip, start, end, 'speed', {rate: settings.percent / 100}, selection);
    case 'stretch':
        return stretchRange(clip, start, end, settings.percent / 100, selection);
    case 'pitch':
        return pitchRange(clip, start, end, settings.semitones, selection);
    case 'echo':
        return renderRange(clip, start, end, 'echo', {
            delay: settings.delay / 1000,
            feedback: settings.feedback / 100,
            mix: 0.75
        }, selection);
    case 'reverb':
        return renderRange(clip, start, end, 'reverb', {size: settings.size, mix: settings.mix / 100}, selection);
    case 'robot':
        return renderRange(clip, start, end, 'robot', {}, selection);
    case 'lowpass':
    case 'highpass':
        return renderRange(clip, start, end, id, {frequency: settings.frequency}, selection);
    case 'insertSilence': {
        const at = insertionPoint(clip, selection, cursor);
        const length = Math.round(settings.seconds * clip.sampleRate);
        return Promise.resolve({
            clip: insertSilence(clip, at, length),
            selection: {start: at, end: at + length},
            splice: {at, removed: 0, inserted: length}
        });
    }
    case 'mix': {
        if (!source) return Promise.reject(new Error('Choose a sound to mix in'));
        const at = insertionPoint(clip, selection, cursor);
        const prepared = source.sampleRate === clip.sampleRate ? source : null;
        if (!prepared) return Promise.reject(new Error('Sample rates differ'));
        return Promise.resolve({
            clip: mixInto(clip, at, prepared, dbToGain(settings.db)),
            selection: {start: at, end: at + clipLength(prepared)}
        });
    }
    default:
        return Promise.reject(new Error(`Unknown tool ${id}`));
    }
};

const affectedRange = (id, clip, selection, cursor, result) => {
    if (typeof result.previewEnd === 'number') {
        const start = result.selection ? result.selection.start : 0;
        return [start, Math.min(clipLength(result.clip), result.previewEnd)];
    }
    if (result.selection) return [result.selection.start, result.selection.end];
    if (getTool(id) && getTool(id).atCursor) {
        const at = insertionPoint(clip, selection, cursor);
        return [at, clipLength(result.clip)];
    }
    return [0, clipLength(result.clip)];
};

export {
    TOOL_GROUPS,
    TOOLS,
    affectedRange,
    applyTool,
    defaultParams,
    getTool,
    nudgeParam,
    parseParam,
    resolveParams
};
