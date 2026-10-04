import CommandQueue from './command-queue';
import {OP} from './protocol';
import {decodeCommand} from './command-codec';
import {createStorageAsset} from './vm-assets';

/** Apply VM edits, independent of Blockly and the current editor selection. */
class VMApplier {
    constructor ({vm, isLocalClient}) {
        this.vm = vm;
        this.queue = new CommandQueue();
        this.isLocalClient = isLocalClient || (() => false);
        this.applyingLocal = false;
    }

    validate (type, payload) {
        if (type !== OP.VM_EDIT) throw new Error('Unsupported editing protocol');
        if (!payload.command && !payload.commit) throw new Error('Missing edit command');
    }

    apply (type, payload, meta = {}) {
        this.validate(type, payload);
        return this.queue.run(async active => {
            const engine = this.vm.editingCommands;
            const editing = this.vm.editingTarget;
            this.applyingLocal = this.isLocalClient(meta.clientId);
            try {
                if (payload.commit) {
                    await engine.apply(payload.commit, id => createStorageAsset(this.vm, id), active);
                    return payload;
                }
                const commit = await engine.execute(decodeCommand(this.vm, payload.command), active);
                if (!active()) throw new Error('Collaboration session ended');
                return {commit, assetRefs: commit.assetRefs};
            } finally {
                this.applyingLocal = false;
                // Deleting the edited sprite moves the selection, but the
                // engine only refreshes for patches to the new sprite. Without
                // this the workspace keeps showing (and editing) the old one.
                if (this.vm.editingTarget !== editing) {
                    if (engine.deferRefresh) engine.refreshPending = true;
                    else this.vm.emitWorkspaceUpdate();
                }
            }
        });
    }

    destroy () {
        this.queue.cancel();
    }
}

/**
 * Adopt the host's target ids (and editing state) after loading a snapshot.
 * @param {VirtualMachine} vm The VM that loaded the snapshot.
 * @param {Array.<object>} targetIds Host target states.
 * @param {Function} [active] Whether the load is still wanted.
 * @param {string} [editingTargetId] Sprite to keep editing, when it still exists.
 */
const remapTargetIds = async (vm, targetIds, active = () => true, editingTargetId = null) => {
    for (const state of targetIds) {
        if (!active()) throw new Error('Snapshot load cancelled');
        const target = vm.runtime.targets.find(item => Boolean(item.isStage) === Boolean(state.isStage) &&
            (state.isStage || item.getName() === state.name));
        if (!target) throw new Error(`Snapshot is missing sprite ${state.name}`);
        const oldId = target.id;
        target.id = state.id;
        // Sprite-specific monitors (x position, size...) embed the target id
        // in their own id, which is also the id of the palette checkbox.
        const prefix = `${oldId}_`;
        const remapId = id => (oldId !== state.id && typeof id === 'string' && id.startsWith(prefix) ?
            `${state.id}_${id.slice(prefix.length)}` : id);
        const monitors = vm.runtime._monitorState;
        if (monitors) {
            for (const record of monitors.values()) {
                if (record.targetId !== oldId) continue;
                const id = remapId(record.id);
                if (id === record.id) {
                    monitors.set(record.id, {targetId: state.id});
                } else {
                    monitors.delete(record.id);
                    record.merge({id, targetId: state.id});
                    monitors.set(id, record);
                }
            }
        }
        const monitorBlocks = vm.runtime.monitorBlocks;
        for (const block of Object.values(monitorBlocks._blocks)) {
            if (block.targetId !== oldId) continue;
            block.targetId = state.id;
            const id = remapId(block.id);
            if (id === block.id) continue;
            delete monitorBlocks._blocks[block.id];
            const script = monitorBlocks._scripts.indexOf(block.id);
            if (script !== -1) monitorBlocks._scripts[script] = id;
            block.id = id;
            monitorBlocks._blocks[id] = block;
        }
        monitorBlocks.resetCache();
        if (state.blocks) await vm.editingCommands.applyState(target, state, id => createStorageAsset(vm, id), active);
    }
    // Loading picked a sprite of its own. A resync should leave the guest
    // where they were.
    const editing = editingTargetId && vm.runtime.getTargetById(editingTargetId);
    if (editing && editing.isOriginal) {
        // Snapshot loads own the VM until they finish.
        // eslint-disable-next-line require-atomic-updates
        vm.editingTarget = editing;
        vm.runtime.setEditingTarget(editing);
    }
    vm.emitTargetsUpdate(false);
    vm.emitWorkspaceUpdate();
};

export default VMApplier;
export {remapTargetIds};
