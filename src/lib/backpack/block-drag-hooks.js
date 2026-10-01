import lazyScratchBlocks from '../tw-lazy-scratch-blocks';

const listeners = new Set();
let patched = false;

const notify = type => {
    for (const listener of listeners) {
        try {
            listener(type);
        } catch (e) {
            continue;
        }
    }
};

const ensurePatched = () => {
    if (patched || !lazyScratchBlocks.isLoaded()) return patched;
    const ScratchBlocks = lazyScratchBlocks.get();
    const BlockDragger = ScratchBlocks.BlockDragger;
    if (!BlockDragger) return false;
    patched = true;

    const originalStart = BlockDragger.prototype.startBlockDrag;
    BlockDragger.prototype.startBlockDrag = function (...args) {
        const result = originalStart.apply(this, args);
        notify('start');
        return result;
    };

    const originalEnd = BlockDragger.prototype.endBlockDrag;
    BlockDragger.prototype.endBlockDrag = function (...args) {
        const result = originalEnd.apply(this, args);
        notify('end');
        return result;
    };
    return true;
};

const subscribeBlockDrag = listener => {
    listeners.add(listener);
    ensurePatched();
    return () => listeners.delete(listener);
};

export {
    ensurePatched,
    subscribeBlockDrag
};
