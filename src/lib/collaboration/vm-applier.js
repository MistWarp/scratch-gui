import CommandQueue from './command-queue';
import {OP} from './protocol';
import {decodeCommand} from './command-codec';
import {createStorageAsset} from './vm-assets';

/** Apply VM edits, independent of Blockly and the current editor selection. */
class VMApplier {
    constructor ({vm}) {
        this.vm = vm;
        this.queue = new CommandQueue();
        this.isApplyingRemote = false;
    }

    validate (type, payload) {
        if (type !== OP.VM_EDIT) throw new Error('Unsupported editing protocol');
        if (!payload.command && !payload.commit) throw new Error('Missing edit command');
    }

    apply (type, payload) {
        this.validate(type, payload);
        return this.queue.run(async active => {
            const engine = this.vm.editingCommands;
            if (payload.commit) {
                await engine.apply(payload.commit, id => createStorageAsset(this.vm, id), active);
                return payload;
            }
            const commit = await engine.execute(decodeCommand(this.vm, payload.command), active);
            if (!active()) throw new Error('Collaboration session ended');
            return {commit, assetRefs: commit.assetRefs};
        });
    }

    destroy () {
        this.queue.cancel();
    }
}

const remapTargetIds = async (vm, targetIds, active = () => true) => {
    for (const state of targetIds) {
        if (!active()) throw new Error('Snapshot load cancelled');
        const target = vm.runtime.targets.find(item => Boolean(item.isStage) === Boolean(state.isStage) &&
            (state.isStage || item.getName() === state.name));
        if (!target) throw new Error(`Snapshot is missing sprite ${state.name}`);
        const oldId = target.id;
        target.id = state.id;
        if (vm.runtime._monitorState) {
            for (const record of vm.runtime._monitorState.values()) {
                if (record.targetId === oldId) {
                    vm.runtime._monitorState.set(record.id, {targetId: state.id});
                }
            }
        }
        for (const block of Object.values(vm.runtime.monitorBlocks._blocks)) {
            if (block.targetId === oldId) block.targetId = state.id;
        }
        vm.runtime.monitorBlocks.resetCache();
        if (state.blocks) await vm.editingCommands.applyState(target, state, id => createStorageAsset(vm, id), active);
    }
    vm.emitTargetsUpdate(false);
    vm.emitWorkspaceUpdate();
};

export default VMApplier;
export {remapTargetIds};
