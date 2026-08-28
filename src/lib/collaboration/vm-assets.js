/**
 * Asset byte access for the collaboration engine.
 *
 * Assets already attached to a target are read straight from the VM.
 * Assets received over the wire that no target references yet (the op
 * that uses them is still in flight) live in a per-VM session cache
 * until the applier attaches them.
 */

const sessionCaches = new WeakMap(); // vm -> Map<md5ext, Uint8Array>

const cacheFor = vm => {
    let cache = sessionCaches.get(vm);
    if (!cache) {
        cache = new Map();
        sessionCaches.set(vm, cache);
    }
    return cache;
};

const findAssetInTargets = (vm, md5ext) => {
    if (!vm || !vm.runtime) return null;
    for (const target of vm.runtime.targets) {
        const sprite = target.sprite;
        if (!sprite) continue;
        for (const costume of sprite.costumes || []) {
            if (costume.md5 === md5ext && costume.asset) return costume.asset;
        }
        for (const sound of sprite.sounds || []) {
            if (sound.md5 === md5ext && sound.asset) return sound.asset;
        }
    }
    return null;
};

/**
 * Get an asset's bytes by md5ext.
 * @param {VirtualMachine} vm The VM.
 * @param {string} md5ext e.g. "abc...def.svg".
 * @returns {Uint8Array|null} The bytes, or null when unknown.
 */
const getAssetData = (vm, md5ext) => {
    const cached = cacheFor(vm).get(md5ext);
    if (cached) return cached;
    const asset = findAssetInTargets(vm, md5ext);
    return asset && asset.data ? asset.data : null;
};

/**
 * Whether an asset's bytes are available locally.
 * @param {VirtualMachine} vm The VM.
 * @param {string} md5ext Asset id.
 * @returns {boolean} True when present.
 */
const hasAssetData = (vm, md5ext) => getAssetData(vm, md5ext) !== null;

/**
 * Store received asset bytes in the session cache for the applier.
 * @param {VirtualMachine} vm The VM.
 * @param {string} md5ext Asset id.
 * @param {Uint8Array} data The bytes.
 */
const storeAssetData = (vm, md5ext, data) => {
    cacheFor(vm).set(md5ext, data);
};

/**
 * Create a scratch-storage Asset from cached/target bytes so the VM can
 * attach it to a costume or sound.
 * @param {VirtualMachine} vm The VM.
 * @param {string} md5ext Asset id.
 * @returns {object|null} The storage Asset, or null.
 */
const createStorageAsset = (vm, md5ext) => {
    const existing = findAssetInTargets(vm, md5ext);
    if (existing) return existing;
    const data = cacheFor(vm).get(md5ext);
    if (!data) return null;

    const storage = vm.runtime.storage;
    if (!storage) return null;
    const dotIndex = md5ext.lastIndexOf('.');
    const assetId = md5ext.slice(0, dotIndex);
    const dataFormat = md5ext.slice(dotIndex + 1).toLowerCase();

    let assetType;
    if (dataFormat === 'svg') {
        assetType = storage.AssetType.ImageVector;
    } else if (dataFormat === 'png' || dataFormat === 'jpg' || dataFormat === 'jpeg' ||
        dataFormat === 'bmp' || dataFormat === 'gif') {
        assetType = storage.AssetType.ImageBitmap;
    } else if (dataFormat === 'wav' || dataFormat === 'mp3' || dataFormat === 'ogg') {
        assetType = storage.AssetType.Sound;
    } else {
        return null;
    }
    return storage.createAsset(assetType, dataFormat, data, assetId, false);
};

/**
 * Drop the session cache for a VM (on disconnect).
 * @param {VirtualMachine} vm The VM.
 */
const clearAssetCache = vm => {
    sessionCaches.delete(vm);
};

export {
    getAssetData,
    hasAssetData,
    storeAssetData,
    createStorageAsset,
    clearAssetCache
};
