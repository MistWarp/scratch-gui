import {serializeEvent, shouldSyncEvent} from './block-serialization';
import {encodeCommand} from './command-codec';
import {OP} from './protocol';

/** Connect the editor's VM command boundary to a session. Blockly edits reach
 * this through VM.blockListener, before they mutate the VM. */
export default class VMAdapter {
    constructor ({vm, onLocalOp}) {
        this.vm = vm;
        this.onLocalOp = onLocalOp;
        this.workspace = null;
        this._suppressed = false;
        this._destroyed = false;
        this._seen = new WeakSet();
        this._pending = 0;
        const engine = vm.editingCommands;
        if (!engine) throw new Error('This version of scratch-vm does not support collaboration commands.');
        engine.snapshot();
        engine.handler = command => {
            if (this._suppressed || this._destroyed) return Promise.reject(new Error('The project is synchronizing.'));
            const payload = encodeCommand(vm, command);
            payload.requestId = Array.from(window.crypto.getRandomValues(new Uint32Array(4)),
                n => n.toString(16)).join('-');
            this._pending++;
            engine.deferRefresh = true;
            if (command.method === 'blockEvent') engine.refreshPending = true;
            return Promise.resolve(onLocalOp(OP.VM_EDIT, payload)).then(result => {
                const created = result && result.commit && result.commit.patches.find(patch => patch.create);
                if (created && !this._destroyed) vm.setEditingTarget(created.id);
                return created ? created.id : null;
            })
                .finally(() => {
                    this._pending--;
                    if (!this._pending && !this._destroyed) {
                        engine.deferRefresh = false;
                        if (engine.refreshPending) {
                            engine.refreshPending = false;
                            vm.emitWorkspaceUpdate();
                        }
                    }
                });
        };
        engine.captureEvent = (event, globalVariable) => {
            if (!shouldSyncEvent(event)) return false;
            if (this._seen.has(event)) return true;
            this._seen.add(event);
            if (event._syncOriginated) return true;
            // Rebuild events are marked at creation by the blocks renderer.
            if (event.recordUndo === false && event._mwRenderEvent) return true;
            const target = globalVariable && !event.isLocal ? vm.runtime.getTargetForStage() :
                event._mwTargetId ? vm.runtime.getTargetById(event._mwTargetId) : vm.editingTarget;
            if (!target) return true;
            const serialized = serializeEvent(vm, event);
            if (event.xml && typeof event.xml !== 'string') serialized.xml = event.xml.outerHTML;
            vm.editingCommands.request('blockEvent', [serialized], target.id);
            return true;
        };
    }

    setSuppressed (value) {
        this._suppressed = value;
        this.vm.editingCommands.loadingSnapshot = value;
    }
    isSuppressed () {
        return this._suppressed;
    }
    isMutationSuppressed () {
        return this._suppressed;
    }
    attach (workspace) {
        this.workspace = workspace;
        workspace._mwEditingTargetId = this.vm.editingTarget && this.vm.editingTarget.id;
        const events = window.ScratchBlocks && window.ScratchBlocks.Events;
        if (events && !this._originalFire) {
            this._events = events;
            this._originalFire = events.fire;
            this._fire = event => {
                if (event && !event._mwTargetId && this.vm.editingTarget) {
                    event._mwTargetId = this.workspace && event.workspaceId === this.workspace.id ?
                        this.workspace._mwEditingTargetId : this.vm.editingTarget.id;
                }
                return this._originalFire.call(events, event);
            };
            events.fire = this._fire;
        }
    }
    detach () {
        this.workspace = null;
    }
    flush () {}

    syncProcedureBlocks () {
        if (!this.workspace || this._suppressed) return;
        const target = this.vm.editingTarget;
        const blocks = window.ScratchBlocks;
        this.workspace.getAllBlocks(false).forEach(block => {
            if (block.type !== 'procedures_definition' || target.blocks.getBlock(block.id)) return;
            const xml = blocks.Xml.domToText(blocks.Xml.blockToDom(block));
            this.vm.editingCommands.request('blockEvent', [{type: 'create', blockId: block.id, xml}], target.id);
        });
    }

    destroy () {
        this._destroyed = true;
        if (this._events && this._events.fire === this._fire) this._events.fire = this._originalFire;
        this.vm.editingCommands.handler = null;
        this.vm.editingCommands.captureEvent = null;
        this.vm.editingCommands.deferRefresh = false;
        this.detach();
    }
}
