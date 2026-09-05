import {storeAssetData, getAssetData} from './vm-assets';

// Binary arguments use the asset channel, never giant JSON arrays. This also
// preserves encoded audio, which is needed for saving a sound edit.
export const encodeCommand = (vm, command) => {
    const refs = new Set();
    const encode = value => {
        if (value === null || typeof value !== 'object') return value;
        if (value.assetType && value.data && value.assetId) {
            return {__editAsset: true,
                assetType: value.assetType.name,
                dataFormat: value.dataFormat,
                data: encode(value.data)};
        }
        if (value.getChannelData && typeof value.numberOfChannels === 'number') {
            return {__editAudio: true,
                sampleRate: value.sampleRate,
                channels: Array.from({length: value.numberOfChannels}, (_, i) => encode(value.getChannelData(i)))};
        }
        if (typeof ImageData !== 'undefined' && value instanceof ImageData) {
            return {__editImage: true, width: value.width, height: value.height, data: encode(value.data)};
        }
        if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
            const bytes = value instanceof ArrayBuffer ? new Uint8Array(value) :
                new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
            const storage = vm.runtime.storage;
            const asset = storage.createAsset(storage.AssetType.Sound, 'bin', bytes.slice(), null, true);
            const ref = `${asset.assetId}.bin`;
            storeAssetData(vm, ref, bytes.slice());
            refs.add(ref);
            return {__editBinary: ref,
                arrayType: value instanceof ArrayBuffer ? 'ArrayBuffer' :
                    value.constructor.name === 'Buffer' ? 'Uint8Array' : value.constructor.name};
        }
        if (Array.isArray(value)) return value.map(encode);
        const out = {};
        Object.keys(value).forEach(key => {
            if (['skinId', 'soundId', 'broken'].includes(key)) return;
            if (typeof value[key] !== 'function' && typeof value[key] !== 'undefined') out[key] = encode(value[key]);
        });
        return out;
    };
    return {command: encode(command), assetRefs: Array.from(refs)};
};

export const decodeCommand = (vm, command) => {
    const decode = value => {
        if (value === null || typeof value !== 'object') return value;
        if (value.__editBinary) {
            const bytes = getAssetData(vm, value.__editBinary);
            if (!bytes) throw new Error(`Missing command asset ${value.__editBinary}`);
            const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
            const types = {Uint8Array,
                Uint8ClampedArray,
                Float32Array,
                Int16Array,
                Uint16Array,
                Int32Array,
                Uint32Array};
            if (value.arrayType === 'ArrayBuffer') return buffer;
            if (!types[value.arrayType]) throw new Error('Unsupported binary argument');
            return new types[value.arrayType](buffer);
        }
        if (value.__editAsset) {
            const storage = vm.runtime.storage;
            const type = Object.values(storage.AssetType).find(item => item.name === value.assetType);
            if (!type) throw new Error('Unsupported asset type');
            return storage.createAsset(type, value.dataFormat, decode(value.data), null, true);
        }
        if (value.__editAudio) {
            const channels = value.channels.map(decode);
            const context = vm.runtime.audioEngine.audioContext;
            const buffer = context.createBuffer(channels.length, channels[0].length, value.sampleRate);
            channels.forEach((channel, index) => buffer.getChannelData(index).set(channel));
            return buffer;
        }
        if (value.__editImage) return new ImageData(decode(value.data), value.width, value.height);
        if (Array.isArray(value)) return value.map(decode);
        const out = Object.create(null);
        Object.keys(value).forEach(key => {
            if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('Invalid command key');
            out[key] = decode(value[key]);
        });
        return out;
    };
    return decode(command);
};
