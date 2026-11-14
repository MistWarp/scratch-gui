import RobotEffect from './effects/robot-effect.js';
import {clipLength} from './sound-data.js';

const MAX_TAIL_SECONDS = 4;

const createOfflineContext = (channels, length, sampleRate) => {
    const Context = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!Context) throw new Error('Offline audio rendering is not supported');
    return new Context(channels, Math.max(1, length), sampleRate);
};

const echoTailSeconds = ({delay, feedback}) => {
    if (feedback <= 0) return delay;
    const repeats = Math.log(0.001) / Math.log(feedback);
    return Math.min(MAX_TAIL_SECONDS, delay * Math.max(1, repeats));
};

const seededRandom = seed => {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

const createImpulse = (context, seconds, decay) => {
    const random = seededRandom(0x5eed);
    const length = Math.max(1, Math.floor(seconds * context.sampleRate));
    const impulse = context.createBuffer(2, length, context.sampleRate);
    for (let c = 0; c < 2; c++) {
        const data = impulse.getChannelData(c);
        for (let i = 0; i < length; i++) {
            data[i] = ((random() * 2) - 1) * Math.pow(1 - (i / length), decay);
        }
    }
    return impulse;
};

const EFFECTS = {
    speed: {
        defaults: {rate: 1.26},
        length: (sourceLength, {rate}) => Math.max(1, Math.floor(sourceLength / rate)),
        body: (sourceLength, params) => EFFECTS.speed.length(sourceLength, params),
        build: (context, source, {rate}) => {
            source.playbackRate.value = rate;
            return source;
        }
    },
    echo: {
        defaults: {delay: 0.25, feedback: 0.3, mix: 0.75},
        length: (sourceLength, params, sampleRate) =>
            sourceLength + Math.ceil(echoTailSeconds(params) * sampleRate),
        body: sourceLength => sourceLength,
        build: (context, source, {delay, feedback, mix}) => {
            const output = context.createGain();
            const wet = context.createGain();
            wet.gain.value = mix;
            const delayNode = context.createDelay(Math.max(1, delay + 0.1));
            delayNode.delayTime.value = delay;
            const loop = context.createGain();
            loop.gain.value = feedback;
            const compressor = context.createDynamicsCompressor();
            compressor.threshold.value = -5;
            compressor.knee.value = 15;
            compressor.ratio.value = 12;
            compressor.attack.value = 0;
            compressor.release.value = 0.25;
            source.connect(compressor);
            source.connect(wet);
            wet.connect(delayNode);
            delayNode.connect(loop);
            loop.connect(delayNode);
            delayNode.connect(compressor);
            compressor.connect(output);
            return output;
        }
    },
    robot: {
        defaults: {},
        length: sourceLength => sourceLength,
        body: sourceLength => sourceLength,
        build: (context, source, params, duration) => {
            const robot = new RobotEffect(context, 0, duration);
            source.connect(robot.input);
            return robot.output;
        }
    },
    reverb: {
        defaults: {size: 1.5, mix: 0.35},
        length: (sourceLength, {size}, sampleRate) =>
            sourceLength + Math.ceil(Math.min(MAX_TAIL_SECONDS, size) * sampleRate),
        body: sourceLength => sourceLength,
        build: (context, source, {size, mix}) => {
            const output = context.createGain();
            const dry = context.createGain();
            dry.gain.value = 1 - (mix / 2);
            const wet = context.createGain();
            wet.gain.value = mix;
            const convolver = context.createConvolver();
            convolver.buffer = createImpulse(context, Math.min(MAX_TAIL_SECONDS, size), 3);
            source.connect(dry);
            source.connect(convolver);
            convolver.connect(wet);
            dry.connect(output);
            wet.connect(output);
            return output;
        }
    },
    lowpass: {
        defaults: {frequency: 1200},
        length: sourceLength => sourceLength,
        body: sourceLength => sourceLength,
        build: (context, source, {frequency}) => {
            const filter = context.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = frequency;
            source.connect(filter);
            return filter;
        }
    },
    highpass: {
        defaults: {frequency: 600},
        length: sourceLength => sourceLength,
        body: sourceLength => sourceLength,
        build: (context, source, {frequency}) => {
            const filter = context.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = frequency;
            source.connect(filter);
            return filter;
        }
    }
};

const isRenderedEffect = name => Object.prototype.hasOwnProperty.call(EFFECTS, name);

const renderEffect = (clip, name, params) => {
    const effect = EFFECTS[name];
    if (!effect) return Promise.reject(new Error(`Unknown effect ${name}`));
    const settings = {...effect.defaults, ...params};
    const sourceLength = Math.max(1, clipLength(clip));
    const {sampleRate} = clip;
    const channelCount = clip.channels.length;
    const length = effect.length(sourceLength, settings, sampleRate);
    const context = createOfflineContext(channelCount, length, sampleRate);
    const buffer = context.createBuffer(channelCount, sourceLength, sampleRate);
    clip.channels.forEach((channel, c) => buffer.getChannelData(c).set(channel.subarray(0, sourceLength)));
    const source = context.createBufferSource();
    source.buffer = buffer;
    const output = effect.build(context, source, settings, sourceLength / sampleRate);
    output.connect(context.destination);
    source.start(0);
    return new Promise((resolve, reject) => {
        context.oncomplete = ({renderedBuffer}) => {
            const channels = [];
            for (let c = 0; c < channelCount; c++) {
                channels.push(new Float32Array(renderedBuffer.getChannelData(c)));
            }
            resolve({
                clip: {channels, sampleRate},
                bodyLength: effect.body(sourceLength, settings)
            });
        };
        const rendering = context.startRendering();
        if (rendering && typeof rendering.catch === 'function') rendering.catch(reject);
    });
};

const effectDefaults = name => ({...(EFFECTS[name] ? EFFECTS[name].defaults : {})});

export {
    effectDefaults,
    echoTailSeconds,
    isRenderedEffect,
    renderEffect
};
