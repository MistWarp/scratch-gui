import {OP} from './protocol.js';
import {serializeEvent, shouldSyncEvent} from './block-serialization.js';

const MOVE_DEBOUNCE_MS = 50;
const CREATE_DELAY_MS = 150;
const TEXT_INPUT_DEBOUNCE_MS = 300;
// After the GUI rebuilds the workspace from VM state (project load, sprite
// switch, undo, extension add — anything that emits workspaceUpdate),
// Blockly fires create/move/var events for the rebuilt blocks
// ASYNCHRONOUSLY via its own setTimeout queue. Those are renders, not
// edits; capturing them re-proposes the whole workspace. Suppress capture
// for a window after every workspaceUpdate.
const WORKSPACE_REBUILD_SUPPRESS_MS = 500;

/**
 * The capture layer: turns local edits into ops. One instance per
 * session; all debounce state is instance state and is dropped on
 * detach(), so peers and reconnects can never cross-contaminate.
 *
 * Capture is suppressed while the applier is applying a remote op (its
 * scoped depth counter) and while the facade is loading a project
 * snapshot (`setSuppressed`).
 */
class VMAdapter {
    /**
     * @param {object} options Options.
     * @param {VirtualMachine} options.vm The scratch-vm instance.
     * @param {VMApplier} options.applier Shared applier (suppression scope
     * + procedure bookkeeping).
     * @param {Function} options.onLocalOp (type, payload) => void.
     */
    constructor ({vm, applier, onLocalOp}) {
        this.vm = vm;
        this.applier = applier;
        this.onLocalOp = onLocalOp;
        this.workspace = null;

        this._suppressed = false;
        this._suppressUntil = 0;
        this._pendingCreates = new Map(); // blockId -> {payload, timer}
        this._pendingMoves = new Map(); // blockId -> {payload, timer}
        this._textDebounces = new Map(); // `${blockId}-${fieldName}` -> timer
        this._syncedProcedureBlocks = new Set();

        this._blockListener = this._blockListener.bind(this);
        this._onWorkspaceUpdate = () => {
            this._suppressUntil = Date.now() + WORKSPACE_REBUILD_SUPPRESS_MS;
        };
        if (this.vm) {
            this.vm.on('workspaceUpdate', this._onWorkspaceUpdate);
        }
    }

    /**
     * Suppress or resume capture (used around project snapshot loads).
     * @param {boolean} suppressed New state.
     */
    setSuppressed (suppressed) {
        this._suppressed = suppressed;
    }

    attach (workspace) {
        if (!workspace || this.workspace === workspace) return;
        this.detach();
        this.workspace = workspace;
        // The workspace we just attached to may still be flushing render
        // events from being (re)built; don't capture those.
        this._suppressUntil = Date.now() + WORKSPACE_REBUILD_SUPPRESS_MS;
        workspace.addChangeListener(this._blockListener);
        // Procedure definitions that already exist should never be
        // re-sent by syncProcedureBlocks.
        workspace.getAllBlocks(true).forEach(block => {
            if (block.type === 'procedures_definition') {
                this._syncedProcedureBlocks.add(block.id);
            }
        });
    }

    detach () {
        if (this.workspace) {
            try {
                this.workspace.removeChangeListener(this._blockListener);
            } catch (e) {
                // Workspace already disposed.
            }
        }
        this.workspace = null;
        this._clearTimers();
    }

    destroy () {
        this.detach();
        if (this.vm) {
            this.vm.removeListener('workspaceUpdate', this._onWorkspaceUpdate);
        }
        this._syncedProcedureBlocks.clear();
    }

    /**
     * Send any debounced-but-unsent events immediately.
     */
    flush () {
        this._pendingCreates.forEach((pending, blockId) => {
            clearTimeout(pending.timer);
            this._flushCreate(blockId);
        });
        this._pendingMoves.forEach((pending, blockId) => {
            clearTimeout(pending.timer);
            this._pendingMoves.delete(blockId);
            this._emit(pending.payload);
        });
    }

    /**
     * The custom-procedure modal builds its blocks with Blockly events
     * disabled, so no create events fire. After the modal closes, sync
     * any procedure definitions we haven't sent yet.
     * Replaces the old hand-rolled hack in containers/blocks.jsx.
     */
    syncProcedureBlocks () {
        if (!this.workspace || this._isSuppressed()) return;
        const ScratchBlocks = window.ScratchBlocks;
        if (!ScratchBlocks || !ScratchBlocks.Xml) return;

        this.workspace.getAllBlocks(true).forEach(block => {
            if (block.type !== 'procedures_definition') return;
            if (this._syncedProcedureBlocks.has(block.id)) return;
            this._syncedProcedureBlocks.add(block.id);
            try {
                const xml = ScratchBlocks.Xml.blockToDom(block);
                const xmlText = ScratchBlocks.Xml.domToText(xml);
                this._emit({
                    event: {
                        type: 'create',
                        blockId: block.id,
                        xml: xmlText,
                        recordUndo: false
                    },
                    targetId: this._editingTargetId()
                });
            } catch (e) {
                // Serialize failure; the block will reach peers on resync.
            }
        });
    }

    _editingTargetId () {
        return this.vm && this.vm.editingTarget ? this.vm.editingTarget.id : null;
    }

    isSuppressed () {
        return this._suppressed ||
            this.applier.isApplyingRemote ||
            Date.now() < this._suppressUntil;
    }

    _isSuppressed () {
        return this.isSuppressed();
    }

    _emit (payload) {
        this.onLocalOp(OP.BLOCK_EVENT, payload);
    }

    _blockListener (event) {
        if (this._isSuppressed() || event._syncOriginated) return;
        if (!shouldSyncEvent(event)) return;

        const blockId = event.blockId || event.id;

        // Ignore events for blocks the applier is materializing right now,
        // and procedure-block noise during the remote-creation window.
        if (this.applier.isCurrentlyCreatingBlock(blockId)) return;
        if (this.applier.isInProcedureCreationWindow() && this._isProcedureBlockEvent(event, blockId)) {
            return;
        }

        // Text/number fields: send only the final value after typing stops.
        if (event.type === 'change' && event.element === 'field' && event.name && blockId) {
            const block = this.workspace && this.workspace.getBlockById ?
                this.workspace.getBlockById(blockId) : null;
            const field = block && block.getField(event.name);
            const isTextInput = field && field.constructor && (
                field.constructor.name === 'FieldTextInput' ||
                field.constructor.name === 'FieldTextInputRepeatable' ||
                field.constructor.name === 'FieldNumber'
            );
            if (isTextInput) {
                const debounceKey = `${blockId}-${event.name}`;
                const existing = this._textDebounces.get(debounceKey);
                if (existing) clearTimeout(existing);
                this._textDebounces.set(debounceKey, setTimeout(() => {
                    this._textDebounces.delete(debounceKey);
                    if (!this.workspace) return;
                    const liveBlock = this.workspace.getBlockById(blockId);
                    const liveField = liveBlock && liveBlock.getField(event.name);
                    if (!liveField) return;
                    event.newValue = liveField.getValue();
                    this._capture(event, blockId);
                }, TEXT_INPUT_DEBOUNCE_MS));
                return;
            }
        }

        this._capture(event, blockId);
    }

    _isProcedureBlockEvent (event, blockId) {
        if (blockId && this.workspace) {
            const block = this.workspace.getBlockById(blockId);
            if (block && (
                block.type === 'procedures_definition' ||
                block.type === 'procedures_prototype'
            )) {
                return true;
            }
        }
        if (event.xml && typeof event.xml === 'string' && (
            event.xml.includes('procedures_definition') ||
            event.xml.includes('procedures_prototype')
        )) {
            return true;
        }
        return false;
    }

    _capture (event, blockId) {
        const serialized = serializeEvent(this.vm, event);
        const targetId = this._editingTargetId();
        const payload = {event: serialized, targetId};

        if (event.type === 'create') {
            if (event.xml && typeof event.xml !== 'string') {
                // toJson gave us xml as text already; nothing extra to do.
            }
            const existing = this._pendingCreates.get(blockId);
            if (existing) clearTimeout(existing.timer);
            this._pendingCreates.set(blockId, {
                payload,
                timer: setTimeout(() => this._flushCreate(blockId), CREATE_DELAY_MS)
            });
            if (blockId) this._syncedProcedureBlocks.add(blockId);
            return;
        }

        if (event.type === 'move') {
            // While the create is still pending, keep only the latest move
            // and send it right after the create flushes.
            if (this._pendingCreates.has(blockId)) {
                const existingMove = this._pendingMoves.get(blockId);
                if (existingMove && existingMove.timer) clearTimeout(existingMove.timer);
                this._pendingMoves.set(blockId, {payload, timer: null});
                return;
            }
            const existingMove = this._pendingMoves.get(blockId);
            if (existingMove && existingMove.timer) clearTimeout(existingMove.timer);
            this._pendingMoves.set(blockId, {
                payload,
                timer: setTimeout(() => {
                    const pending = this._pendingMoves.get(blockId);
                    if (!pending) return;
                    this._pendingMoves.delete(blockId);
                    this._emit(pending.payload);
                }, MOVE_DEBOUNCE_MS)
            });
            return;
        }

        if (event.type === 'delete') {
            // Created and deleted within the debounce window: never send.
            const pendingCreate = this._pendingCreates.get(blockId);
            if (pendingCreate) {
                clearTimeout(pendingCreate.timer);
                this._pendingCreates.delete(blockId);
                const pendingMove = this._pendingMoves.get(blockId);
                if (pendingMove && pendingMove.timer) clearTimeout(pendingMove.timer);
                this._pendingMoves.delete(blockId);
                return;
            }
        }

        // Any other event on a block with a pending create flushes it
        // first so peers see the events in a valid order.
        if (this._pendingCreates.has(blockId)) {
            const pendingCreate = this._pendingCreates.get(blockId);
            clearTimeout(pendingCreate.timer);
            this._flushCreate(blockId);
        }

        this._emit(payload);
    }

    _flushCreate (blockId) {
        const pending = this._pendingCreates.get(blockId);
        if (!pending) return;
        this._pendingCreates.delete(blockId);

        // The block may have been deleted while the create was pending.
        if (this.workspace && !this.workspace.getBlockById(blockId)) {
            const pendingMove = this._pendingMoves.get(blockId);
            if (pendingMove) {
                if (pendingMove.timer) clearTimeout(pendingMove.timer);
                this._pendingMoves.delete(blockId);
            }
            return;
        }

        this._emit(pending.payload);

        const pendingMove = this._pendingMoves.get(blockId);
        if (pendingMove) {
            if (pendingMove.timer) clearTimeout(pendingMove.timer);
            this._pendingMoves.delete(blockId);
            this._emit(pendingMove.payload);
        }
    }

    _clearTimers () {
        this._pendingCreates.forEach(pending => clearTimeout(pending.timer));
        this._pendingCreates.clear();
        this._pendingMoves.forEach(pending => {
            if (pending.timer) clearTimeout(pending.timer);
        });
        this._pendingMoves.clear();
        this._textDebounces.forEach(timer => clearTimeout(timer));
        this._textDebounces.clear();
    }
}

export default VMAdapter;
