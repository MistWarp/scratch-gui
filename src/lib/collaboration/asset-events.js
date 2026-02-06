const wrapVMAssetMethods = service => {
    const vm = service.vm;
    if (!vm) return;
    const self = service;
    const wrap = (obj, methodName, handler) => {
        const original = obj[methodName].bind(obj);
        obj[methodName] = function (...args) {
            const result = original(...args);
            if (!self.isConnected || self.isApplyingRemoteChange ||
                self.isSyncOperation || self.isLoadingProject) return result;
            try {
                handler(args, result);
            } catch (e) {
                console.warn('Error in asset event handler:', e);
            }
            return result;
        };
    };
    wrap(vm, 'addCostume', args => {
        const [md5ext, costumeObject, optTargetId] = args;
        const target = optTargetId ? vm.runtime.getTargetById(optTargetId) : vm.editingTarget;
        const targetId = target ? target.id : null;
        const c = costumeObject || {};
        const payload = {
            kind: 'costume-add',
            targetId,
            costume: {
                name: c.name,
                md5: c.md5 || (c.assetId && c.dataFormat ? `${c.assetId}.${c.dataFormat}` : md5ext),
                dataFormat: c.dataFormat,
                rotationCenterX: c.rotationCenterX,
                rotationCenterY: c.rotationCenterY,
                bitmapResolution: c.bitmapResolution
            }
        };
        self.sendMessage('asset-event', payload);
    });
    wrap(vm, 'addCostumeFromLibrary', args => {
        const [md5ext, costumeObject] = args;
        const target = vm.editingTarget;
        const targetId = target ? target.id : null;
        const c = costumeObject || {};
        const payload = {
            kind: 'costume-add',
            targetId,
            costume: {
                name: c.name,
                md5: c.md5 || md5ext,
                dataFormat: c.dataFormat,
                rotationCenterX: c.rotationCenterX,
                rotationCenterY: c.rotationCenterY,
                bitmapResolution: c.bitmapResolution
            }
        };
        self.sendMessage('asset-event', payload);
    });
    wrap(vm, 'deleteCostume', args => {
        const [index] = args;
        const target = vm.editingTarget;
        const targetId = target ? target.id : null;
        const costume = target && target.getCostumes ? target.getCostumes()[index] : null;
        const payload = {
            kind: 'costume-delete',
            targetId,
            index,
            md5: costume && (costume.md5 ||
                (
                    costume.assetId && costume.dataFormat ?
                        `${costume.assetId}.${costume.dataFormat}` :
                        null
                )
            ),
            name: costume && costume.name
        };
        self.sendMessage('asset-event', payload);
    });
    wrap(vm, 'renameCostume', args => {
        const [index, newName] = args;
        const target = vm.editingTarget;
        const targetId = target ? target.id : null;
        const payload = {kind: 'costume-rename', targetId, index, newName};
        self.sendMessage('asset-event', payload);
    });
    wrap(vm, 'reorderCostume', args => {
        const [targetId, index, newIndex] = args;
        const payload = {kind: 'costume-reorder', targetId, index, newIndex};
        self.sendMessage('asset-event', payload);
    });
    wrap(vm, 'duplicateCostume', args => {
        const [index] = args;
        const target = vm.editingTarget;
        const targetId = target ? target.id : null;
        const original = target && target.getCostumes ? target.getCostumes()[index] : null;
        const payload = {
            kind: 'costume-duplicate',
            targetId,
            index,
            name: original && original.name
        };
        self.sendMessage('asset-event', payload);
    });
    wrap(vm, 'addSound', args => {
        const [soundObject, optTargetId] = args;
        const target = optTargetId ? vm.runtime.getTargetById(optTargetId) : vm.editingTarget;
        const targetId = target ? target.id : null;
        const s = soundObject || {};
        const payload = {
            kind: 'sound-add',
            targetId,
            sound: {
                name: s.name,
                md5: s.md5,
                dataFormat: s.dataFormat
            }
        };
        self.sendMessage('asset-event', payload);
    });
    wrap(vm, 'deleteSound', args => {
        const [index] = args;
        const target = vm.editingTarget;
        const targetId = target ? target.id : null;
        const sound = target && target.getSounds ? target.getSounds()[index] : null;
        const payload = {
            kind: 'sound-delete',
            targetId,
            index,
            md5: sound && sound.md5,
            name: sound && sound.name
        };
        self.sendMessage('asset-event', payload);
    });
    wrap(vm, 'renameSound', args => {
        const [index, newName] = args;
        const target = vm.editingTarget;
        const targetId = target ? target.id : null;
        const payload = {kind: 'sound-rename', targetId, index, newName};
        self.sendMessage('asset-event', payload);
    });
    wrap(vm, 'reorderSound', args => {
        const [targetId, index, newIndex] = args;
        const payload = {kind: 'sound-reorder', targetId, index, newIndex};
        self.sendMessage('asset-event', payload);
    });
    wrap(vm, 'duplicateSound', args => {
        const [index] = args;
        const target = vm.editingTarget;
        const targetId = target ? target.id : null;
        const original = target && target.getSounds ? target.getSounds()[index] : null;
        const payload = {
            kind: 'sound-duplicate',
            targetId,
            index,
            name: original && original.name
        };
        self.sendMessage('asset-event', payload);
    });
};

const handleAssetEvent = (service, payload, conn) => {
    if (payload.sender === service.peer.id) return;
    if (!service.vm) return;
    const kind = payload.kind;
    const tId = payload.targetId;
    const prevTarget = service.vm.editingTarget && service.vm.editingTarget.id;
    if (tId && prevTarget !== tId) service.vm.setEditingTarget(tId);
    service.isApplyingRemoteChange = true;
    try {
        if (kind === 'costume-add' && payload.costume) {
            const c = payload.costume;
            const md5ext = c.md5;
            const obj = {
                name: c.name,
                md5: c.md5,
                dataFormat: c.dataFormat,
                rotationCenterX: c.rotationCenterX,
                rotationCenterY: c.rotationCenterY,
                bitmapResolution: c.bitmapResolution
            };
            service.vm.addCostume(md5ext, obj, tId);
        } else if (kind === 'costume-delete') {
            const i = payload.index;
            service.vm.deleteCostume(i);
        } else if (kind === 'costume-rename') {
            service.vm.renameCostume(payload.index, payload.newName);
        } else if (kind === 'costume-reorder') {
            service.vm.reorderCostume(payload.targetId, payload.index, payload.newIndex);
        } else if (kind === 'costume-duplicate') {
            service.vm.duplicateCostume(payload.index);
        } else if (kind === 'sound-add' && payload.sound) {
            const s = payload.sound;
            const obj = {name: s.name, md5: s.md5, dataFormat: s.dataFormat};
            service.vm.addSound(obj, tId);
        } else if (kind === 'sound-delete') {
            service.vm.deleteSound(payload.index);
        } else if (kind === 'sound-rename') {
            service.vm.renameSound(payload.index, payload.newName);
        } else if (kind === 'sound-reorder') {
            service.vm.reorderSound(payload.targetId, payload.index, payload.newIndex);
        } else if (kind === 'sound-duplicate') {
            service.vm.duplicateSound(payload.index);
        }
    } finally {
        const originalFlag = service.isApplyingRemoteChange;
        setTimeout(() => {
            service.isApplyingRemoteChange = originalFlag;
        }, 25);
        if (prevTarget && prevTarget !== tId) service.vm.setEditingTarget(prevTarget);
    }
    if (service.isHost && payload.sender !== service.peer.id) {
        service.connections.forEach(connection => {
            if (connection !== conn && connection.open) {
                connection.send({type: 'asset-event', payload, sender: payload.sender, timestamp: Date.now()});
            }
        });
    }
};

export {
    wrapVMAssetMethods,
    handleAssetEvent
};
