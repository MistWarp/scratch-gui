import {OP} from './protocol.js';

const COSTUME_SELECT_DEBOUNCE_MS = 200;

const sanitizeCostume = costume => ({
    name: costume.name,
    md5: costume.md5,
    dataFormat: costume.dataFormat,
    rotationCenterX: costume.rotationCenterX,
    rotationCenterY: costume.rotationCenterY,
    bitmapResolution: costume.bitmapResolution,
    assetId: costume.assetId
});

const sanitizeSound = sound => ({
    name: sound.name,
    md5: sound.md5,
    dataFormat: sound.dataFormat,
    assetId: sound.assetId,
    rate: sound.rate,
    sampleCount: sound.sampleCount
});

/**
 * Serialize a target into a payload the receiving peer can hand straight
 * to vm.addSprite. It must be a real sprite3 JSON — target.toJSON() is a
 * runtime dump that fails the VM's sprite schema — so go through the VM's
 * own sb3 serializer, which also leaves the Asset bytes behind (they can
 * be megabytes; they travel on the asset channel instead).
 * @param {VirtualMachine} vm The VM.
 * @param {string} targetId The sprite to serialize.
 * @returns {{spriteJson: object, assetRefs: Array.<string>}} Payload parts.
 */
const serializeSprite = (vm, targetId) => {
    const spriteJson = JSON.parse(vm.toJSON(targetId));
    const assetRefs = []
        .concat(spriteJson.costumes || [], spriteJson.sounds || [])
        .map(item => item.md5ext)
        .filter(Boolean);
    return {spriteJson, assetRefs};
};

const imageDataToDataUrl = imageData => {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext('2d').putImageData(imageData, 0, 0);
    return canvas.toDataURL();
};

const serializeAudioBuffer = buffer => {
    const channels = [];
    for (let i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(Array.from(buffer.getChannelData(i)));
    }
    return {
        numberOfChannels: buffer.numberOfChannels,
        length: buffer.length,
        sampleRate: buffer.sampleRate,
        channels
    };
};

/**
 * Wrap the VM's sprite/costume/sound/extension entry points so local
 * edits become ops. All wrappers no-op while a remote op is being applied
 * or capture is suppressed. Every patch is recorded on the passed patcher
 * and restored on disconnect.
 *
 * @param {object} options Options.
 * @param {VirtualMachine} options.vm The VM.
 * @param {VmPatcher} options.patcher Patch registry for this session.
 * @param {Function} options.isSuppressed () => boolean.
 * @param {Function} options.onLocalOp (type, payload) => void.
 * @returns {Function} A cleanup function for the non-patch listeners.
 */
const wrapVmMethods = ({vm, patcher, isSuppressed, onLocalOp}) => {
    const runtime = vm.runtime;

    const editingTargetId = () => (vm.editingTarget ? vm.editingTarget.id : null);

    const captureNewTarget = () => {
        // After addSprite/duplicateSprite the VM selects the new target.
        const target = vm.editingTarget;
        if (!target || !target.sprite || target.isStage) return;
        const {spriteJson, assetRefs} = serializeSprite(vm, target.id);
        onLocalOp(OP.SPRITE_ADD, {targetId: target.id, spriteJson, assetRefs});
    };

    patcher.patch(vm, 'addSprite', original => (...args) => {
        const result = original(...args);
        if (!isSuppressed() && result && result.then) {
            result.then(() => {
                if (!isSuppressed()) captureNewTarget();
            });
        }
        return result;
    });

    patcher.patch(vm, 'duplicateSprite', original => (...args) => {
        const result = original(...args);
        if (!isSuppressed() && result && result.then) {
            result.then(() => {
                if (!isSuppressed()) captureNewTarget();
            });
        }
        return result;
    });

    patcher.patch(vm, 'deleteSprite', original => targetId => {
        const existed = Boolean(runtime.getTargetById(targetId));
        const result = original(targetId);
        if (!isSuppressed() && existed) {
            onLocalOp(OP.SPRITE_DELETE, {targetId});
        }
        return result;
    });

    patcher.patch(vm, 'renameSprite', original => (targetId, newName) => {
        const result = original(targetId, newName);
        if (!isSuppressed()) {
            const target = runtime.getTargetById(targetId);
            onLocalOp(OP.SPRITE_RENAME, {targetId, name: target ? target.getName() : newName});
        }
        return result;
    });

    patcher.patch(vm, 'reorderTarget', original => (targetIndex, newIndex) => {
        const result = original(targetIndex, newIndex);
        if (!isSuppressed() && result) {
            const target = runtime.targets[newIndex];
            if (target) {
                onLocalOp(OP.SPRITE_REORDER, {targetId: target.id, newIndex});
            }
        }
        return result;
    });

    const captureCostumeAdd = (result, optTargetId) => {
        if (isSuppressed() || !result || !result.then) return;
        result.then(() => {
            if (isSuppressed()) return;
            const targetId = optTargetId || editingTargetId();
            const target = targetId ? runtime.getTargetById(targetId) : null;
            if (!target) return;
            const costumes = target.getCostumes();
            const costume = costumes[target.currentCostume] || costumes[costumes.length - 1];
            if (!costume || !costume.md5) return;
            onLocalOp(OP.COSTUME_ADD, {
                targetId,
                costume: sanitizeCostume(costume),
                assetRefs: [costume.md5]
            });
        });
    };

    patcher.patch(vm, 'addCostume', original => (md5ext, costumeObject, optTargetId, optVersion) => {
        const result = original(md5ext, costumeObject, optTargetId, optVersion);
        captureCostumeAdd(result, optTargetId);
        return result;
    });

    if (typeof vm.addCostumeFromLibrary === 'function') {
        patcher.patch(vm, 'addCostumeFromLibrary', original => (md5ext, costumeObject) => {
            const result = original(md5ext, costumeObject);
            captureCostumeAdd(result, null);
            return result;
        });
    }

    patcher.patch(vm, 'deleteCostume', original => index => {
        const targetId = editingTargetId();
        const result = original(index);
        if (!isSuppressed() && targetId) {
            onLocalOp(OP.COSTUME_DELETE, {targetId, index});
        }
        return result;
    });

    patcher.patch(vm, 'renameCostume', original => (index, newName) => {
        const result = original(index, newName);
        const targetId = editingTargetId();
        if (!isSuppressed() && targetId) {
            onLocalOp(OP.COSTUME_RENAME, {targetId, index, name: newName});
        }
        return result;
    });

    patcher.patch(vm, 'reorderCostume', original => (targetId, costumeIndex, newIndex) => {
        const result = original(targetId, costumeIndex, newIndex);
        if (!isSuppressed() && result) {
            onLocalOp(OP.COSTUME_REORDER, {targetId, oldIndex: costumeIndex, newIndex});
        }
        return result;
    });

    patcher.patch(vm, 'duplicateCostume', original => index => {
        const targetId = editingTargetId();
        const result = original(index);
        if (!isSuppressed() && targetId) {
            onLocalOp(OP.COSTUME_DUPLICATE, {targetId, index});
        }
        return result;
    });

    patcher.patch(vm, 'addSound', original => (soundObject, optTargetId) => {
        const result = original(soundObject, optTargetId);
        if (!isSuppressed() && result && result.then) {
            result.then(() => {
                if (isSuppressed()) return;
                const targetId = optTargetId || editingTargetId();
                const target = targetId ? runtime.getTargetById(targetId) : null;
                if (!target) return;
                const sounds = target.getSounds();
                const sound = sounds[sounds.length - 1];
                if (!sound || !sound.md5) return;
                onLocalOp(OP.SOUND_ADD, {
                    targetId,
                    sound: sanitizeSound(sound),
                    assetRefs: [sound.md5]
                });
            });
        }
        return result;
    });

    patcher.patch(vm, 'deleteSound', original => index => {
        const targetId = editingTargetId();
        const result = original(index);
        if (!isSuppressed() && targetId) {
            onLocalOp(OP.SOUND_DELETE, {targetId, index});
        }
        return result;
    });

    patcher.patch(vm, 'renameSound', original => (index, newName) => {
        const result = original(index, newName);
        const targetId = editingTargetId();
        if (!isSuppressed() && targetId) {
            onLocalOp(OP.SOUND_RENAME, {targetId, index, name: newName});
        }
        return result;
    });

    patcher.patch(vm, 'reorderSound', original => (targetId, soundIndex, newIndex) => {
        const result = original(targetId, soundIndex, newIndex);
        if (!isSuppressed() && result) {
            onLocalOp(OP.SOUND_REORDER, {targetId, oldIndex: soundIndex, newIndex});
        }
        return result;
    });

    patcher.patch(vm, 'duplicateSound', original => index => {
        const targetId = editingTargetId();
        const result = original(index);
        if (!isSuppressed() && targetId) {
            onLocalOp(OP.SOUND_DUPLICATE, {targetId, index});
        }
        return result;
    });

    patcher.patch(vm, 'updateSvg', original => (costumeIndex, svg, rotationCenterX, rotationCenterY) => {
        const result = original(costumeIndex, svg, rotationCenterX, rotationCenterY);
        const targetId = editingTargetId();
        if (!isSuppressed() && targetId) {
            onLocalOp(OP.COSTUME_UPDATE, {
                targetId,
                index: costumeIndex,
                isVector: true,
                svg,
                rotationCenterX,
                rotationCenterY
            });
        }
        return result;
    });

    patcher.patch(vm, 'updateBitmap', original =>
        (costumeIndex, bitmap, rotationCenterX, rotationCenterY, bitmapResolution) => {
            const result = original(costumeIndex, bitmap, rotationCenterX, rotationCenterY, bitmapResolution);
            const targetId = editingTargetId();
            if (!isSuppressed() && targetId) {
                try {
                    onLocalOp(OP.COSTUME_UPDATE, {
                        targetId,
                        index: costumeIndex,
                        isVector: false,
                        bitmapData: imageDataToDataUrl(bitmap),
                        rotationCenterX,
                        rotationCenterY,
                        bitmapResolution: bitmapResolution || 2
                    });
                } catch (e) {
                    // Canvas conversion failed; skip this update.
                }
            }
            return result;
        });

    if (typeof vm.updateSoundBuffer === 'function') {
        patcher.patch(vm, 'updateSoundBuffer', original => (soundIndex, newBuffer, soundEncoding) => {
            const result = original(soundIndex, newBuffer, soundEncoding);
            const targetId = editingTargetId();
            if (!isSuppressed() && targetId && newBuffer) {
                try {
                    onLocalOp(OP.SOUND_UPDATE, {
                        targetId,
                        index: soundIndex,
                        audioData: serializeAudioBuffer(newBuffer)
                    });
                } catch (e) {
                    // Serialization failed; skip.
                }
            }
            return result;
        });
    }

    patcher.patch(vm, 'shareBlocksToTarget', original => (blocks, targetId, optFromTargetId) => {
        const result = original(blocks, targetId, optFromTargetId);
        if (!isSuppressed()) {
            onLocalOp(OP.BLOCKS_SHARE, {targetId, blocks});
        }
        return result;
    });

    if (vm.extensionManager) {
        patcher.patch(vm.extensionManager, 'loadExtensionURL', original => (extensionURL, ...rest) => {
            const result = original(extensionURL, ...rest);
            if (!isSuppressed()) {
                onLocalOp(OP.EXTENSION_LOAD, {extensionId: String(extensionURL)});
            }
            return result;
        });
        if (typeof vm.extensionManager.removeExtension === 'function') {
            patcher.patch(vm.extensionManager, 'removeExtension', original => (extensionId, ...rest) => {
                const result = original(extensionId, ...rest);
                if (!isSuppressed()) {
                    onLocalOp(OP.EXTENSION_REMOVE, {extensionId: String(extensionId)});
                }
                return result;
            });
        }
        if (typeof vm.extensionManager.reorderExtension === 'function') {
            patcher.patch(vm.extensionManager, 'reorderExtension', original => (index, newIndex) => {
                const keys = Array.from(vm.extensionManager._loadedExtensions.keys());
                const extensionId = keys[index];
                const result = original(index, newIndex);
                if (!isSuppressed() && extensionId) {
                    onLocalOp(OP.EXTENSION_REORDER, {extensionId, newIndex});
                }
                return result;
            });
        }
    }

    // Costume selection has no dedicated VM entry point; diff the editing
    // target's currentCostume on targetsUpdate (debounced).
    let lastCostumeByTarget = new Map();
    let costumeSelectTimer = null;
    const onTargetsUpdate = () => {
        if (isSuppressed()) return;
        const target = vm.editingTarget;
        if (!target) return;
        const previous = lastCostumeByTarget.get(target.id);
        const current = target.currentCostume;
        if (previous === current) return;
        lastCostumeByTarget.set(target.id, current);
        if (typeof previous === 'undefined') return; // first observation
        if (costumeSelectTimer) clearTimeout(costumeSelectTimer);
        costumeSelectTimer = setTimeout(() => {
            costumeSelectTimer = null;
            if (isSuppressed() || !vm.editingTarget) return;
            onLocalOp(OP.COSTUME_SELECT, {
                targetId: vm.editingTarget.id,
                index: vm.editingTarget.currentCostume
            });
        }, COSTUME_SELECT_DEBOUNCE_MS);
    };
    vm.on('targetsUpdate', onTargetsUpdate);

    // Sprite transform edits (drag on stage, sprite info pane) arrive via
    // the VM's SPRITE_INFO_CHANGED hook — the ONE transform stream.
    // The runtime emits (target, changedProps). Drags fire once per
    // mousemove, so updates are coalesced per target before proposing.
    const pendingTargetUpdates = new Map(); // targetId -> {props, timer}
    const TARGET_UPDATE_THROTTLE_MS = 100;
    const onSpriteInfoChanged = (target, changedProps) => {
        if (isSuppressed()) return;
        if (!target || !changedProps) return;
        const props = {};
        ['x', 'y', 'direction', 'size', 'visible', 'rotationStyle'].forEach(key => {
            if (typeof changedProps[key] !== 'undefined') props[key] = changedProps[key];
        });
        if (Object.keys(props).length === 0) return;

        const pending = pendingTargetUpdates.get(target.id);
        if (pending) {
            Object.assign(pending.props, props);
            return;
        }
        pendingTargetUpdates.set(target.id, {
            props,
            timer: setTimeout(() => {
                const entry = pendingTargetUpdates.get(target.id);
                pendingTargetUpdates.delete(target.id);
                if (entry && !isSuppressed()) {
                    onLocalOp(OP.TARGET_UPDATE, {targetId: target.id, props: entry.props});
                }
            }, TARGET_UPDATE_THROTTLE_MS)
        });
    };
    runtime.on('SPRITE_INFO_CHANGED', onSpriteInfoChanged);

    return () => {
        vm.removeListener('targetsUpdate', onTargetsUpdate);
        runtime.removeListener('SPRITE_INFO_CHANGED', onSpriteInfoChanged);
        if (costumeSelectTimer) clearTimeout(costumeSelectTimer);
        pendingTargetUpdates.forEach(entry => clearTimeout(entry.timer));
        pendingTargetUpdates.clear();
        lastCostumeByTarget = null;
    };
};

export default wrapVmMethods;
