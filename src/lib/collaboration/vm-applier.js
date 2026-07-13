import {OpApplier} from './op-applier.js';
import {OP} from './protocol.js';
import {reconstructEvent} from './block-serialization.js';
import {createStorageAsset} from './vm-assets.js';

const PROCEDURE_WINDOW_DURATION_MS = 5000;
const CREATING_BLOCK_TTL_MS = 1000;

/**
 * Applies sequenced collaboration ops to the real VM and (when the target
 * is currently being edited) the Blockly workspace. All mutations run
 * inside the base class's remote-apply scope so the capture layer ignores
 * the change events they fire.
 */
class VMApplier extends OpApplier {
    /**
     * @param {object} options Options.
     * @param {VirtualMachine} options.vm The scratch-vm instance.
     * @param {Function} options.getWorkspace () => Blockly workspace or null.
     */
    constructor ({vm, getWorkspace}) {
        super();
        this.vm = vm;
        this.getWorkspace = getWorkspace;

        // Procedure-creation bookkeeping shared with the capture layer:
        // remote procedure blocks trigger local toolbox/workspace refreshes
        // that fire spurious events which must not be captured or deleted.
        this._recentlyCreatedProcedureBlocks = new Map();
        this._currentlyCreatingBlocks = new Set();
        this._procedureWindowStart = 0;
        this._timers = new Set();

        // Some VM applies (addSprite, addCostume, ...) are async; chain
        // them so ops always mutate the VM in sequence order.
        this._chain = Promise.resolve();
    }

    /**
     * Serialize applies behind an internal promise chain. The suppression
     * depth stays raised for the whole (possibly async) apply, which is
     * safe because applies never overlap.
     * @param {string} type Op type.
     * @param {object} payload Op payload.
     * @param {object} [meta] {clientId, seq}.
     * @returns {Promise} Resolves when this op has been applied.
     */
    apply (type, payload, meta = {}) {
        this._chain = this._chain.then(async () => {
            this._remoteApplyDepth++;
            try {
                await this._apply(type, payload, meta);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.warn(`[Collab] Failed to apply ${type}:`, error);
            } finally {
                this._remoteApplyDepth--;
            }
        });
        return this._chain;
    }

    /**
     * Synchronous semantic validation, used by the host before assigning
     * a sequence number to a proposal.
     * @param {string} type Op type.
     * @param {object} payload Op payload.
     * @throws When the op cannot apply against current VM state.
     */
    validate (type, payload) {
        const needsTarget = [
            OP.TARGET_UPDATE, OP.SPRITE_DELETE, OP.SPRITE_RENAME,
            OP.COSTUME_DELETE, OP.COSTUME_RENAME, OP.COSTUME_SELECT,
            OP.COSTUME_REORDER, OP.COSTUME_DUPLICATE, OP.COSTUME_UPDATE,
            OP.SOUND_DELETE, OP.SOUND_RENAME, OP.SOUND_REORDER,
            OP.SOUND_DUPLICATE, OP.SOUND_UPDATE
        ];
        if (needsTarget.indexOf(type) !== -1) {
            const target = this.vm.runtime.getTargetById(payload.targetId);
            if (!target) throw new Error(`no such target: ${payload.targetId}`);
        }
    }

    destroy () {
        this._timers.forEach(timer => clearTimeout(timer));
        this._timers.clear();
        this._recentlyCreatedProcedureBlocks.clear();
        this._currentlyCreatingBlocks.clear();
        this._procedureWindowStart = 0;
    }

    isInProcedureCreationWindow () {
        if (this._procedureWindowStart === 0) return false;
        if (Date.now() - this._procedureWindowStart < PROCEDURE_WINDOW_DURATION_MS) {
            return true;
        }
        this._procedureWindowStart = 0;
        return false;
    }

    isRecentlyCreatedProcedureBlock (blockId) {
        if (!blockId) return false;
        const timestamp = this._recentlyCreatedProcedureBlocks.get(blockId);
        if (!timestamp) return false;
        if (Date.now() - timestamp < PROCEDURE_WINDOW_DURATION_MS) {
            return true;
        }
        this._recentlyCreatedProcedureBlocks.delete(blockId);
        return false;
    }

    isCurrentlyCreatingBlock (blockId) {
        return Boolean(blockId) && this._currentlyCreatingBlocks.has(blockId);
    }

    _apply (type, payload) {
        switch (type) {
        case OP.BLOCK_EVENT:
            return this._applyBlockEvent(payload);
        case OP.TARGET_UPDATE:
            return this._applyTargetUpdate(payload);
        case OP.SPRITE_ADD:
        case OP.SPRITE_DELETE:
        case OP.SPRITE_RENAME:
        case OP.SPRITE_REORDER:
        case OP.COSTUME_ADD:
        case OP.COSTUME_DELETE:
        case OP.COSTUME_RENAME:
        case OP.COSTUME_SELECT:
        case OP.COSTUME_REORDER:
        case OP.COSTUME_DUPLICATE:
        case OP.COSTUME_UPDATE:
        case OP.SOUND_ADD:
        case OP.SOUND_DELETE:
        case OP.SOUND_RENAME:
        case OP.SOUND_REORDER:
        case OP.SOUND_DUPLICATE:
        case OP.SOUND_UPDATE:
        case OP.BLOCKS_SHARE:
        case OP.EXTENSION_LOAD:
        case OP.EXTENSION_REMOVE:
        case OP.EXTENSION_REORDER:
            // Async; the apply chain awaits the returned promise so ops
            // keep mutating the VM strictly in sequence order.
            return this._applyAssetOp(type, payload);
        default:
            return undefined; // eslint-disable-line no-undefined
        }
    }

    _findTarget (payload) {
        const runtime = this.vm.runtime;
        if (payload.targetId) {
            const target = runtime.getTargetById(payload.targetId);
            if (target) return target;
        }
        // Fallback for events serialized with a target name only.
        const targetName = payload.targetName ||
            (payload.event && payload.event.targetName);
        if (targetName) {
            return runtime.targets.find(t => t.getName() === targetName) || null;
        }
        return null;
    }

    _applyBlockEvent (payload) {
        const target = this._findTarget(payload);
        if (!target) return; // target since deleted: identical no-op everywhere

        const workspace = this.getWorkspace();
        const event = reconstructEvent(workspace, payload.event);
        if (!event) return;
        event._syncOriginated = true;

        // Always apply to the VM's block representation for that target...
        try {
            if (target.blocks && target.blocks.blocklyListen) {
                target.blocks.blocklyListen(event);
            }
        } catch (e) {
            // VM-side apply failed; workspace apply below may still succeed
        }

        // ...and mirror into the visible workspace only when the user is
        // looking at the same target.
        const isEditingTarget = target === this.vm.editingTarget;
        if (!isEditingTarget || !workspace) return;

        const ScratchBlocks = window.ScratchBlocks;
        if (!ScratchBlocks) return;
        try {
            switch (event.type) {
            case 'create':
                this._applyCreateUI(event, workspace, ScratchBlocks);
                break;
            case 'delete':
                this._applyDeleteUI(event, workspace, ScratchBlocks);
                break;
            case 'move':
                this._applyMoveUI(event, workspace, ScratchBlocks);
                break;
            case 'change':
                if (event.element === 'mutation') {
                    this._applyMutationChangeUI(event, workspace, ScratchBlocks);
                } else {
                    this._applyChangeUI(event, workspace, ScratchBlocks);
                }
                break;
            case 'comment_create':
                this._applyCommentCreateUI(event, workspace, ScratchBlocks);
                break;
            case 'comment_delete':
                this._applyCommentDeleteUI(event, workspace, ScratchBlocks);
                break;
            case 'comment_move':
                this._applyCommentMoveUI(event, workspace, ScratchBlocks);
                break;
            case 'comment_change':
                this._applyCommentChangeUI(event, workspace, ScratchBlocks);
                break;
            case 'var_create':
            case 'var_delete':
            case 'var_rename':
                this._applyVariableUI(event, workspace);
                break;
            default:
                break;
            }
        } catch (e) {
            // A UI apply failure must not break the op stream; the VM state
            // above is what gets serialized and re-synced.
        }
    }

    _withEventsDisabled (ScratchBlocks, fn) {
        const wasEnabled = ScratchBlocks.Events.isEnabled();
        ScratchBlocks.Events.disable();
        try {
            fn();
        } finally {
            if (wasEnabled) ScratchBlocks.Events.enable();
        }
    }

    _applyCreateUI (event, workspace, ScratchBlocks) {
        if (!event.xml || !ScratchBlocks.Xml) return;

        let xml;
        if (typeof event.xml === 'string') {
            const parsed = ScratchBlocks.Xml.textToDom(`<xml>${event.xml}</xml>`);
            xml = parsed ? parsed.firstChild : null;
        } else {
            xml = event.xml;
        }
        if (!xml) return;

        // Replaying an op that is already reflected in a fresh snapshot
        // must be a no-op (at-least-once delivery during onboarding).
        const declaredId = xml.getAttribute && xml.getAttribute('id');
        if (declaredId && workspace.getBlockById(declaredId)) return;

        this._withEventsDisabled(ScratchBlocks, () => {
            if (declaredId) this._currentlyCreatingBlocks.add(declaredId);
            const block = ScratchBlocks.Xml.domToBlock(xml, workspace);
            const createdBlockId = block ? block.id : declaredId;
            if (block) this._currentlyCreatingBlocks.add(block.id);

            const isProcedureBlock = block && (
                block.type === 'procedures_definition' ||
                block.type === 'procedures_prototype'
            );
            if (isProcedureBlock) {
                this._recentlyCreatedProcedureBlocks.set(block.id, Date.now());
                if (this._procedureWindowStart === 0) {
                    this._procedureWindowStart = Date.now();
                }
                if (this.vm.emitWorkspaceUpdate) {
                    this.vm.emitWorkspaceUpdate();
                }
                if (workspace.toolbox_ && workspace.toolbox_.refreshSelection) {
                    workspace.toolbox_.refreshSelection();
                }
            }
            if (createdBlockId) {
                const timer = setTimeout(() => {
                    this._currentlyCreatingBlocks.delete(createdBlockId);
                    this._timers.delete(timer);
                }, CREATING_BLOCK_TTL_MS);
                this._timers.add(timer);
            }
        });
    }

    _applyDeleteUI (event, workspace, ScratchBlocks) {
        const blockId = event.blockId || event.id;
        const block = workspace.getBlockById(blockId);
        if (!block) return;

        const isProcedureBlock = block.type === 'procedures_definition' ||
            block.type === 'procedures_prototype';
        if (isProcedureBlock && this.isRecentlyCreatedProcedureBlock(blockId)) {
            // The procedure modal's teardown fires deletes for blocks a
            // remote peer just created; swallowing them mirrors old behavior.
            return;
        }
        this._withEventsDisabled(ScratchBlocks, () => {
            block.dispose(false, true);
        });
    }

    _applyMoveUI (event, workspace, ScratchBlocks) {
        const blockId = event.blockId || event.id;
        const block = workspace.getBlockById(blockId);
        if (!block) return;

        this._withEventsDisabled(ScratchBlocks, () => {
            if (block.getParent()) {
                block.unplug(false);
            }
            if (event.newCoordinate) {
                const currentPos = block.getRelativeToSurfaceXY();
                block.moveBy(event.newCoordinate.x - currentPos.x, event.newCoordinate.y - currentPos.y);
            } else if (event.newParentId) {
                const parentBlock = workspace.getBlockById(event.newParentId);
                if (!parentBlock) return;
                const blockConnection = block.outputConnection || block.previousConnection;
                let parentConnection = null;
                if (event.newInputName) {
                    const input = parentBlock.getInput(event.newInputName);
                    if (input) parentConnection = input.connection;
                } else if (blockConnection && parentBlock.nextConnection) {
                    parentConnection = parentBlock.nextConnection;
                }
                if (parentConnection && blockConnection) {
                    parentConnection.connect(blockConnection);
                }
            }
        });
    }

    _applyChangeUI (event, workspace, ScratchBlocks) {
        if (!event.blockId || !event.name || event.element !== 'field') return;
        const block = workspace.getBlockById(event.blockId);
        if (!block) return;
        const field = block.getField(event.name);
        if (!field || !('newValue' in event)) return;

        this._withEventsDisabled(ScratchBlocks, () => {
            field.setValue(event.newValue);
        });
    }

    _applyMutationChangeUI (event, workspace, ScratchBlocks) {
        if (!event.blockId || event.element !== 'mutation') return;
        const block = workspace.getBlockById(event.blockId);
        if (!block || typeof block.domToMutation !== 'function') return;
        if (typeof event.newValue === 'undefined') return;

        this._withEventsDisabled(ScratchBlocks, () => {
            const mutationXml = ScratchBlocks.Xml.textToDom(`<xml>${event.newValue}</xml>`);
            if (!mutationXml || !mutationXml.firstChild) return;
            block.domToMutation(mutationXml.firstChild);
            if (block.rendered && block.initSvg && !block.isInsertionMarker()) {
                block.initSvg();
                block.render();
            }
            if (this.vm.editingTarget && this.vm.editingTarget.blocks) {
                this.vm.editingTarget.blocks.populateProcedureCache();
            }
            if (workspace.toolbox_) {
                workspace.toolbox_.refreshSelection();
            }
        });
    }

    _applyCommentCreateUI (event, workspace, ScratchBlocks) {
        if (!ScratchBlocks.Xml) return;
        this._withEventsDisabled(ScratchBlocks, () => {
            if (event.xml) {
                let xmlText;
                if (typeof event.xml === 'string') {
                    xmlText = event.xml;
                } else if (ScratchBlocks.Xml.domToText) {
                    xmlText = ScratchBlocks.Xml.domToText(event.xml);
                } else if (event.xml.outerHTML) {
                    xmlText = event.xml.outerHTML;
                }
                if (xmlText) {
                    const xml = ScratchBlocks.Xml.textToDom(`<xml>${xmlText}</xml>`);
                    ScratchBlocks.Xml.domToWorkspace(xml, workspace);
                    return;
                }
            }
            if (event.blockId) {
                const block = workspace.getBlockById(event.blockId);
                if (block && block.setCommentText) {
                    const x = event.xy ? event.xy.x : 0;
                    const y = event.xy ? event.xy.y : 0;
                    block.setCommentText(event.text || '', event.commentId, x, y, event.minimized || false);
                    if (block.comment && event.width && event.height) {
                        block.comment.setSize(event.width, event.height);
                    }
                }
            } else if (ScratchBlocks.WorkspaceComment) {
                const comment = new ScratchBlocks.WorkspaceComment(
                    workspace,
                    event.text || '',
                    event.height || 100,
                    event.width || 200,
                    event.minimized || false,
                    event.commentId
                );
                if (event.xy) {
                    comment.moveTo(event.xy.x, event.xy.y);
                }
            }
        });
    }

    _applyCommentDeleteUI (event, workspace, ScratchBlocks) {
        const comment = workspace.getCommentById(event.commentId);
        if (!comment) return;
        this._withEventsDisabled(ScratchBlocks, () => {
            comment.dispose(false, false);
        });
    }

    _applyCommentMoveUI (event, workspace, ScratchBlocks) {
        const comment = workspace.getCommentById(event.commentId);
        if (!comment) return;
        this._withEventsDisabled(ScratchBlocks, () => {
            if (event.newCoordinate_) {
                comment.moveTo(event.newCoordinate_.x, event.newCoordinate_.y);
            } else if (event.newCoordinate) {
                const coord = typeof event.newCoordinate === 'string' ?
                    event.newCoordinate.split(',').map(parseFloat) :
                    [event.newCoordinate.x, event.newCoordinate.y];
                comment.moveTo(coord[0], coord[1]);
            }
        });
    }

    _applyCommentChangeUI (event, workspace, ScratchBlocks) {
        const comment = workspace.getCommentById(event.commentId);
        if (!comment) return;
        this._withEventsDisabled(ScratchBlocks, () => {
            const newContents = event.newContents_ || event.newContents;
            if (!newContents) return;
            if (typeof newContents.minimized !== 'undefined' && comment.setMinimized) {
                comment.setMinimized(newContents.minimized);
            }
            if (newContents.width && newContents.height && comment.setSize) {
                comment.setSize(newContents.width, newContents.height);
            }
            if (newContents.text && comment.setText) {
                comment.setText(newContents.text);
            }
        });
    }

    _applyVariableUI (event, workspace) {
        if (!event.run || typeof event.run !== 'function') return;
        if (event.type === 'var_delete') {
            const variable = workspace.getVariableById(event.varId);
            if (!variable) return;
            const uses = workspace.variableMap_.getVariableUsesById(event.varId);
            if (uses && uses.length > 0) {
                workspace.deleteVariableInternal_(variable, uses);
            } else {
                workspace.variableMap_.deleteVariable(variable);
            }
        } else {
            event.run(true);
        }
    }

    _applyTargetUpdate (payload) {
        const target = this.vm.runtime.getTargetById(payload.targetId);
        if (!target) return;
        const props = payload.props;
        if (typeof props.x === 'number' || typeof props.y === 'number') {
            target.setXY(
                typeof props.x === 'number' ? props.x : target.x,
                typeof props.y === 'number' ? props.y : target.y
            );
        }
        if (typeof props.direction === 'number') target.setDirection(props.direction);
        if (typeof props.size === 'number') target.setSize(props.size);
        if (typeof props.visible === 'boolean') target.setVisible(props.visible);
        if (typeof props.rotationStyle === 'string') target.setRotationStyle(props.rotationStyle);
        if (typeof props.draggable === 'boolean') target.setDraggable(props.draggable);
        this.vm.runtime.requestTargetsUpdate(target);
    }

    async _applyAssetOp (type, payload) {
        const vm = this.vm;
        const runtime = vm.runtime;

        switch (type) {
        case OP.SPRITE_ADD: {
            if (runtime.getTargetById(payload.targetId)) return; // replay
            const json = JSON.parse(JSON.stringify(payload.spriteJson));
            this._attachAssets(json.costumes || []);
            this._attachAssets(json.sounds || []);

            // addSprite selects the sprite it created, which would yank
            // every peer's editor onto someone else's new sprite.
            const previousEditingTarget = vm.editingTarget ? vm.editingTarget.id : null;
            const before = new Set(runtime.targets.map(t => t.id));
            await vm.addSprite(json);
            const newTarget = runtime.targets.find(t => !before.has(t.id));
            // Adopt the originator's target id so every peer addresses
            // this sprite identically from now on.
            if (newTarget) newTarget.id = payload.targetId;
            if (previousEditingTarget && runtime.getTargetById(previousEditingTarget)) {
                vm.setEditingTarget(previousEditingTarget);
            }
            vm.emitTargetsUpdate(false);
            return;
        }
        case OP.SPRITE_DELETE: {
            if (!runtime.getTargetById(payload.targetId)) return;
            vm.deleteSprite(payload.targetId);
            return;
        }
        case OP.SPRITE_RENAME: {
            if (!runtime.getTargetById(payload.targetId)) return;
            vm.renameSprite(payload.targetId, payload.name);
            return;
        }
        case OP.SPRITE_REORDER: {
            const index = runtime.targets.findIndex(t => t.id === payload.targetId);
            if (index === -1) return;
            vm.reorderTarget(index, payload.newIndex);
            return;
        }
        case OP.EXTENSION_LOAD: {
            if (vm.extensionManager &&
                !vm.extensionManager.isExtensionLoaded(payload.extensionId)) {
                await vm.extensionManager.loadExtensionURL(payload.extensionId);
            }
            return;
        }
        case OP.EXTENSION_REMOVE: {
            if (vm.extensionManager && typeof vm.extensionManager.removeExtension === 'function') {
                vm.extensionManager.removeExtension(payload.extensionId);
            }
            return;
        }
        case OP.EXTENSION_REORDER: {
            if (vm.extensionManager && typeof vm.extensionManager.reorderExtension === 'function') {
                const keys = Array.from(vm.extensionManager._loadedExtensions.keys());
                const currentIndex = keys.indexOf(payload.extensionId);
                if (currentIndex !== -1) {
                    vm.extensionManager.reorderExtension(currentIndex, payload.newIndex);
                }
            }
            return;
        }
        default:
            break;
        }

        // Everything below operates on the VM's editing target, so switch
        // to the op's target for the call and restore afterwards.
        const target = runtime.getTargetById(payload.targetId);
        if (!target) return;
        const previousEditingTarget = vm.editingTarget ? vm.editingTarget.id : null;
        const needsSwitch = previousEditingTarget !== payload.targetId;
        if (needsSwitch) vm.setEditingTarget(payload.targetId);
        try {
            await this._applyEditingTargetOp(type, payload, target);
        } finally {
            if (needsSwitch && previousEditingTarget && runtime.getTargetById(previousEditingTarget)) {
                vm.setEditingTarget(previousEditingTarget);
            }
        }
    }

    async _applyEditingTargetOp (type, payload, target) {
        const vm = this.vm;
        switch (type) {
        case OP.COSTUME_ADD: {
            const c = payload.costume;
            // Replay guard: skip if this exact costume already exists.
            if (target.getCostumes().some(existing => existing.md5 === c.md5)) return;
            const asset = createStorageAsset(vm, c.md5);
            const costume = {
                name: c.name,
                md5: c.md5,
                dataFormat: c.dataFormat,
                rotationCenterX: c.rotationCenterX,
                rotationCenterY: c.rotationCenterY,
                bitmapResolution: c.bitmapResolution,
                assetId: c.assetId
            };
            if (asset) costume.asset = asset;
            await vm.addCostume(c.md5, costume, payload.targetId);
            return;
        }
        case OP.COSTUME_DELETE:
            if (target.getCostumes()[payload.index]) vm.deleteCostume(payload.index);
            return;
        case OP.COSTUME_RENAME:
            if (target.getCostumes()[payload.index]) vm.renameCostume(payload.index, payload.name);
            return;
        case OP.COSTUME_REORDER:
            if (target.getCostumes()[payload.oldIndex]) {
                vm.reorderCostume(payload.targetId, payload.oldIndex, payload.newIndex);
            }
            return;
        case OP.COSTUME_DUPLICATE:
            if (target.getCostumes()[payload.index]) await vm.duplicateCostume(payload.index);
            return;
        case OP.COSTUME_SELECT:
            if (target.getCostumes()[payload.index]) {
                target.setCostume(payload.index);
                vm.runtime.requestTargetsUpdate(target);
            }
            return;
        case OP.COSTUME_UPDATE: {
            if (!target.getCostumes()[payload.index]) return;
            if (payload.isVector) {
                vm.updateSvg(payload.index, payload.svg, payload.rotationCenterX, payload.rotationCenterY);
                return;
            }
            await this._applyBitmapUpdate(payload);
            return;
        }
        case OP.SOUND_ADD: {
            const s = payload.sound;
            if (target.getSounds().some(existing => existing.md5 === s.md5)) return;
            const asset = createStorageAsset(vm, s.md5);
            const sound = {
                name: s.name,
                md5: s.md5,
                dataFormat: s.dataFormat,
                assetId: s.assetId,
                rate: s.rate,
                sampleCount: s.sampleCount
            };
            if (asset) sound.asset = asset;
            await vm.addSound(sound, payload.targetId);
            return;
        }
        case OP.SOUND_DELETE:
            if (target.getSounds()[payload.index]) vm.deleteSound(payload.index);
            return;
        case OP.SOUND_RENAME:
            if (target.getSounds()[payload.index]) vm.renameSound(payload.index, payload.name);
            return;
        case OP.SOUND_REORDER:
            if (target.getSounds()[payload.oldIndex]) {
                vm.reorderSound(payload.targetId, payload.oldIndex, payload.newIndex);
            }
            return;
        case OP.SOUND_DUPLICATE:
            if (target.getSounds()[payload.index]) await vm.duplicateSound(payload.index);
            return;
        case OP.SOUND_UPDATE: {
            if (!target.getSounds()[payload.index]) return;
            const audioData = payload.audioData;
            const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextCtor) return;
            const audioContext = new AudioContextCtor();
            const audioBuffer = audioContext.createBuffer(
                audioData.numberOfChannels,
                audioData.length,
                audioData.sampleRate
            );
            for (let i = 0; i < audioData.numberOfChannels; i++) {
                const channelData = audioBuffer.getChannelData(i);
                const sourceData = audioData.channels[i] || [];
                for (let j = 0; j < sourceData.length; j++) {
                    channelData[j] = sourceData[j];
                }
            }
            vm.updateSoundBuffer(payload.index, audioBuffer);
            return;
        }
        case OP.BLOCKS_SHARE:
            await vm.shareBlocksToTarget(payload.blocks, payload.targetId);
            return;
        default:
            break;
        }
    }

    _applyBitmapUpdate (payload) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    this.vm.updateBitmap(
                        payload.index,
                        imageData,
                        payload.rotationCenterX,
                        payload.rotationCenterY,
                        payload.bitmapResolution || 2
                    );
                } finally {
                    resolve();
                }
            };
            img.onerror = () => resolve();
            img.src = payload.bitmapData;
        });
    }

    // Costumes/sounds in a serialized sprite key their asset as `md5ext`,
    // not the runtime's `md5`.
    _attachAssets (items) {
        items.forEach(item => {
            if (!item.md5ext) return;
            const asset = createStorageAsset(this.vm, item.md5ext);
            if (asset) {
                item.asset = asset;
                item.assetId = asset.assetId;
            }
        });
    }
}

/**
 * Adopt the host's target ids after loading a snapshot. sb3 files do not
 * serialize target ids, so every load regenerates them — without this,
 * peers address the "same" sprite by different ids and every id-keyed op
 * and presence signal misses.
 * @param {VirtualMachine} vm The VM that just loaded the snapshot.
 * @param {Array.<object>} targetIds Host's [{id, name, isStage}].
 */
const remapTargetIds = (vm, targetIds) => {
    const runtime = vm.runtime;
    targetIds.forEach(({id, name, isStage}) => {
        const target = isStage ?
            runtime.targets.find(t => t.isStage) :
            runtime.targets.find(t => !t.isStage && t.getName() === name);
        if (!target || target.id === id) return;
        const oldId = target.id;
        target.id = id;
        // Keep monitors pointing at the renamed target (best effort).
        try {
            if (runtime._monitorState && typeof runtime._monitorState.map === 'function') {
                runtime._monitorState = runtime._monitorState.map(record => (
                    record.get && record.get('targetId') === oldId ?
                        record.set('targetId', id) : record
                ));
            }
        } catch (error) {
            // Monitor bookkeeping is non-critical.
        }
    });
    vm.emitTargetsUpdate(false);
};

export default VMApplier;
export {remapTargetIds};
