import WavEncoder from 'wav-encoder';

export const SOUND_BYTE_LIMIT = 10 * 1000 * 1000; // 10mb

const _computeRMS = function (samples, start, end, scaling = 0.55) {
    const length = end - start;
    if (length === 0) return 0;
    // Calculate RMS, adapted from https://github.com/Tonejs/Tone.js/blob/master/Tone/component/Meter.js#L88
    let sum = 0;
    for (let i = start; i < end; i++) {
        const sample = samples[i];
        sum += sample ** 2;
    }
    const rms = Math.sqrt(sum / length);
    const val = rms / scaling;
    return Math.sqrt(val);
};

const computeRMS = (samples, scaling) => _computeRMS(samples, 0, samples.length, scaling);

const computeChunkedRMS = function (samples, chunkSize = 1024) {
    const sampleCount = samples.length;
    const chunkLevels = [];
    for (let i = 0; i < sampleCount; i += chunkSize) {
        const maxIndex = Math.min(sampleCount, i + chunkSize);
        chunkLevels.push(_computeRMS(samples, i, maxIndex));
    }
    return chunkLevels;
};

const encodeAndAddSoundToVM = function (vm, samples, sampleRate, name, callback, targetId) {
    return WavEncoder.encode({
        sampleRate: sampleRate,
        channelData: [samples]
    }).then(wavBuffer => {
        const vmSound = {
            format: '',
            dataFormat: 'wav',
            rate: sampleRate,
            sampleCount: samples.length
        };

        // Create an asset from the encoded .wav and get resulting md5
        const storage = vm.runtime.storage;
        vmSound.asset = storage.createAsset(
            storage.AssetType.Sound,
            storage.DataFormat.WAV,
            new Uint8Array(wavBuffer),
            null,
            true // generate md5
        );
        vmSound.assetId = vmSound.asset.assetId;

        // update vmSound object with md5 property
        vmSound.md5 = `${vmSound.assetId}.${vmSound.dataFormat}`;
        // The VM will update the sound name to a fresh name
        vmSound.name = name;

        return vm.addSound(vmSound, targetId).then(() => {
            if (callback) callback();
            return vmSound;
        });
    });
};

/**
 @typedef SoundBuffer
 @type {Object}
 @property {Float32Array} samples Array of audio samples
 @property {number} sampleRate Audio sample rate
 */

/**
 * Downsample the given buffer to try to reduce file size below SOUND_BYTE_LIMIT
 * @param {SoundBuffer} buffer - Buffer to resample
 * @param {function(SoundBuffer):Promise<SoundBuffer>} resampler - resampler function
 * @returns {SoundBuffer} Downsampled buffer with half the sample rate
 */
const downsampleIfNeeded = (buffer, resampler) => {
    const {samples, sampleRate} = buffer;
    const encodedByteLength = samples.length * 2; /* bitDepth 16 bit */
    // Resolve immediately if already within byte limit
    if (encodedByteLength < SOUND_BYTE_LIMIT) {
        return Promise.resolve({samples, sampleRate});
    }
    // TW: Don't check if the sound will still fit at this reduced sample rate.
    // Instead the GUI will show a warning if it's too large.
    return resampler({samples, sampleRate}, 22050);
};

/**
 * Drop every other sample of an audio buffer as a last-resort way of downsampling.
 * @param {SoundBuffer} buffer - Buffer to resample
 * @returns {SoundBuffer} Downsampled buffer with half the sample rate
 */
const dropEveryOtherSample = buffer => {
    const newLength = Math.floor(buffer.samples.length / 2);
    const newSamples = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
        newSamples[i] = buffer.samples[i * 2];
    }
    return {
        samples: newSamples,
        sampleRate: buffer.sampleRate / 2
    };
};

const resampleClip = (clip, newRate) => new Promise((resolve, reject) => {
    const length = clip.channels[0].length;
    const newLength = Math.max(1, Math.round(length * newRate / clip.sampleRate));
    const Context = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    let context;
    try {
        context = new Context(clip.channels.length, newLength, newRate);
    } catch (error) {
        if (newRate === clip.sampleRate / 2) {
            resolve({
                channels: clip.channels.map(channel => dropEveryOtherSample({samples: channel}).samples),
                sampleRate: newRate
            });
            return;
        }
        reject(error);
        return;
    }
    const buffer = context.createBuffer(clip.channels.length, Math.max(1, length), clip.sampleRate);
    clip.channels.forEach((channel, c) => buffer.getChannelData(c).set(channel));
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.start();
    context.oncomplete = ({renderedBuffer}) => {
        const channels = [];
        for (let c = 0; c < clip.channels.length; c++) {
            channels.push(new Float32Array(renderedBuffer.getChannelData(c)));
        }
        resolve({channels, sampleRate: newRate});
    };
    const rendering = context.startRendering();
    if (rendering && typeof rendering.catch === 'function') rendering.catch(reject);
});

const downsampleClipIfNeeded = (clip, resampler = resampleClip) => {
    const encodedByteLength = clip.channels[0].length * clip.channels.length * 2;
    if (encodedByteLength < SOUND_BYTE_LIMIT || clip.sampleRate <= 22050) {
        return Promise.resolve(clip);
    }
    return resampler(clip, 22050);
};

const encodeClip = clip => WavEncoder.encode({
    sampleRate: clip.sampleRate,
    channelData: clip.channels
}).then(wavBuffer => new Uint8Array(wavBuffer));

const encodeAndAddClipToVM = (vm, clip, name, targetId) => encodeClip(clip).then(wavData => {
    const storage = vm.runtime.storage;
    const vmSound = {
        format: '',
        dataFormat: 'wav',
        rate: clip.sampleRate,
        sampleCount: clip.channels[0].length
    };
    vmSound.asset = storage.createAsset(
        storage.AssetType.Sound,
        storage.DataFormat.WAV,
        wavData,
        null,
        true
    );
    vmSound.assetId = vmSound.asset.assetId;
    vmSound.md5 = `${vmSound.assetId}.${vmSound.dataFormat}`;
    vmSound.name = name;
    return vm.addSound(vmSound, targetId).then(() => vmSound);
});

export {
    computeRMS,
    downsampleClipIfNeeded,
    encodeAndAddClipToVM,
    encodeClip,
    resampleClip,
    computeChunkedRMS,
    encodeAndAddSoundToVM,
    downsampleIfNeeded,
    dropEveryOtherSample
};
