import BlockInstance from './BlockInstance.js';
import BlockFlasher from './BlockFlasher.js';

const distance = (pos, next) => Math.sqrt(Math.pow(pos.left - next.left, 2) + Math.pow(pos.top - next.top, 2));

// Make these global so that every feature uses the same arrays.
const views = [];
let forward = [];

class NavigationHistory {
    constructor (ScratchBlocks) {
        this.ScratchBlocks = ScratchBlocks;
    }

    storeView (next, dist) {
        forward = [];
        const workspace = this.ScratchBlocks.getMainWorkspace();
        if (!workspace) return;

        const s = workspace.getMetrics();
        const pos = {left: s.viewLeft, top: s.viewTop};
        if (!next || distance(pos, next) > dist) {
            views.push(pos);
        }
    }

    peek () {
        return views.length > 0 ? views[views.length - 1] : null;
    }

    goBack () {
        const workspace = this.ScratchBlocks.getMainWorkspace();
        if (!workspace) return;

        const s = workspace.getMetrics();
        const pos = {left: s.viewLeft, top: s.viewTop};
        let view = this.peek();
        if (!view) return;

        if (distance(pos, view) < 64) {
            if (views.length > 1) {
                views.pop();
                forward.push(view);
            }
        }

        view = this.peek();
        if (!view) return;

        const sx = view.left - s.contentLeft;
        const sy = view.top - s.contentTop;
        workspace.scrollbar.set(sx, sy);
    }

    goForward () {
        const view = forward.pop();
        if (!view) return;

        views.push(view);

        const workspace = this.ScratchBlocks.getMainWorkspace();
        if (!workspace) return;

        const s = workspace.getMetrics();
        const sx = view.left - s.contentLeft;
        const sy = view.top - s.contentTop;
        workspace.scrollbar.set(sx, sy);
    }
}

export default class Utils {
    /**
     * @param {*} vm scratch-vm instance
     * @param {*} ScratchBlocks scratch-blocks module instance
     */
    constructor (vm, ScratchBlocks) {
        this.vm = vm;
        this.ScratchBlocks = ScratchBlocks;

        this.offsetX = 32;
        this.offsetY = 32;
        this.navigationHistory = new NavigationHistory(ScratchBlocks);

        /**
         * The workspace
         */
        this._workspace = null;
    }

    /**
     * Get the Scratch Editing Target
     * @returns {Target} the current editing target
     */
    getEditingTarget () {
        return this.vm.runtime.getEditingTarget();
    }

    /**
     * Set the current workspace (switches sprites)
     * @param {string} targetID ID of the target to switch to
     */
    setEditingTarget (targetID) {
        if (this.getEditingTarget().id !== targetID) {
            this.vm.setEditingTarget(targetID);
        }
    }

    /**
     * Returns the main workspace
     * @returns {Workspace} the current workspace
     */
    getWorkspace () {
        const currentWorkspace = this.ScratchBlocks.getMainWorkspace();
        if (currentWorkspace && currentWorkspace.getToolbox && currentWorkspace.getToolbox()) {
            // getMainWorkspace does not always return the 'real' workspace.
            // We can detect the correct one by whether it has a toolbox.
            this._workspace = currentWorkspace;
        }
        return this._workspace;
    }

    /**
     * Based on wksp.centerOnBlock(li.data.labelID);
     * @param {*|string|BlockInstance} blockOrId A Blockly Block, a block id, or a BlockInstance
     */
    scrollBlockIntoView (blockOrId) {
        const workspace = this.getWorkspace();
        if (!workspace) return;

        let block = null;
        let blockId = null;

        if (blockOrId instanceof BlockInstance) {
            this.setEditingTarget(blockOrId.targetId);
            blockId = blockOrId.id;
        } else if (typeof blockOrId === 'string') {
            blockId = blockOrId;
        } else if (blockOrId && blockOrId.id) {
            blockId = blockOrId.id;
            // Search results for scripts that are not rendered are plain {id}
            // stubs rather than Blockly blocks.
            if (typeof blockOrId.getRootBlock === 'function') {
                block = blockOrId;
            }
        }
        if (!block && blockId) {
            block = workspace.getBlockById(blockId);
        }

        if (!block) {
            this.scrollUnrenderedBlockIntoView(workspace, blockId);
            return;
        }

        const root = block.getRootBlock();
        const base = this.getTopOfStackFor(block);
        const ePos = base.getRelativeToSurfaceXY();
        const rPos = root.getRelativeToSurfaceXY();
        const scale = workspace.scale;
        const x = rPos.x * scale;
        const y = ePos.y * scale;
        const xx = block.width + x;
        const yy = block.height + y;
        const s = workspace.getMetrics();

        if (
            x < s.viewLeft + this.offsetX - 4 ||
            xx > s.viewLeft + s.viewWidth ||
            y < s.viewTop + this.offsetY - 4 ||
            yy > s.viewTop + s.viewHeight
        ) {
            const sx = x - s.contentLeft - this.offsetX;
            const sy = y - s.contentTop - this.offsetY;

            this.navigationHistory.storeView(this.navigationHistory.peek(), 64);
            workspace.scrollbar.set(sx, sy);
            this.navigationHistory.storeView({left: sx, top: sy}, 64);
        }

        if (this.ScratchBlocks.hideChaff) {
            this.ScratchBlocks.hideChaff();
        }
        BlockFlasher.flash(block);
    }

    /**
     * Scroll to a block whose script the workspace has not rendered yet. Getting
     * near it is what makes it render, so scroll first and flash it once it is
     * there.
     * @param {object} workspace The Blockly workspace.
     * @param {?string} blockId The block to go to.
     */
    scrollUnrenderedBlockIntoView (workspace, blockId) {
        if (!blockId || typeof workspace.findDeferredScriptByBlockId !== 'function') return;
        const pending = workspace.findDeferredScriptByBlockId(blockId);
        if (!pending) return;

        const scale = workspace.scale;
        const s = workspace.getMetrics();
        const sx = (pending.x * scale) - s.contentLeft - this.offsetX;
        const sy = (pending.y * scale) - s.contentTop - this.offsetY;

        this.navigationHistory.storeView(this.navigationHistory.peek(), 64);
        workspace.scrollbar.set(sx, sy);
        this.navigationHistory.storeView({left: sx, top: sy}, 64);

        if (this.ScratchBlocks.hideChaff) {
            this.ScratchBlocks.hideChaff();
        }

        let attempts = 90;
        const flashWhenRendered = () => {
            const block = workspace.getBlockById(blockId);
            if (block) {
                BlockFlasher.flash(block);
                return;
            }
            if (attempts-- > 0) {
                requestAnimationFrame(flashWhenRendered);
            }
        };
        requestAnimationFrame(flashWhenRendered);
    }

    /**
     * Find the top stack block of a stack
     * @param {*} block A Blockly block
     * @returns {*} The top stack block
     */
    getTopOfStackFor (block) {
        let base = block;
        while (base.getOutputShape() && base.getSurroundParent()) {
            base = base.getSurroundParent();
        }
        return base;
    }
}
