// import ShowBroadcast from "./show-broadcast.js";
import DomHelpers from './DomHelpers.js';
import UndoGroup from './UndoGroup.js';

export default class DevTools {
    constructor (addon, msg, m) {
        this.addon = addon;
        this.msg = msg;
        this.m = m;
        /**
     * @type {VirtualMachine}
     */
        this.domHelpers = new DomHelpers(addon);

        this.codeTab = null;
        this.costTab = null;
        this.costTabBody = null;
        this.selVarID = null;
        this.canShare = false;

        this.mouseXY = {x: 0, y: 0};
    }

    async init () {
        this.addContextMenus();
        while (true) {
            const root = await this.addon.tab.waitForElement('ul[class*=gui_tab-list_]', {
                markAsSeen: true,
                reduxEvents: [
                    'scratch-gui/mode/SET_PLAYER',
                    'fontsLoaded/SET_FONTS_LOADED',
                    'scratch-gui/locales/SELECT_LOCALE'
                ],
                reduxCondition: state => !state.scratchGui.mode.isPlayerOnly
            });
            this.initInner(root);
        }
    }
    async addContextMenus () {
        const blockly = await this.addon.tab.traps.getBlockly();
        const oldCleanUpFunc = blockly.WorkspaceSvg.prototype.cleanUp;
        const self = this;
        blockly.WorkspaceSvg.prototype.cleanUp = function () {
            if (self.addon.settings.get('enableCleanUpPlus')) {
                self.doCleanUp();
            } else {
                oldCleanUpFunc.call(this);
            }
        };

        const originalMsg = blockly.Msg.CLEAN_UP;
        if (this.addon.settings.get('enableCleanUpPlus')) blockly.Msg.CLEAN_UP = this.m('clean-plus');
        this.addon.settings.addEventListener('change', () => {
            if (this.addon.settings.get('enableCleanUpPlus')) blockly.Msg.CLEAN_UP = this.m('clean-plus');
            else blockly.Msg.CLEAN_UP = originalMsg;
        });

        this.addon.tab.createBlockContextMenu(
            (items, block) => {
                items.push({
                    enabled: blockly.clipboardXml_,
                    text: this.m('paste'),
                    separator: true,
                    _isDevtoolsFirstItem: true,
                    callback: () => {
                        const ids = this.getTopBlockIDs();

                        document.dispatchEvent(
                            new KeyboardEvent('keydown', {
                                keyCode: 86,
                                ctrlKey: true,
                                griff: true
                            })
                        );

                        setTimeout(() => {
                            this.beginDragOfNewBlocksNotInIDs(ids);
                        }, 10);
                    }
                });
                
                // Add "Clean up detached scripts" option after "Clean up blocks"
                const detachedBlocks = this.getDetachedBlocks();
                if (detachedBlocks.length > 0) {
                    // Find the index of the "Clean up" option
                    const cleanUpIndex = items.findIndex(item => 
                        item.text && (item.text === blockly.Msg.CLEAN_UP || item.text.includes('Clean up'))
                    );
                    
                    const cleanUpDetachedOption = {
                        enabled: true,
                        text: this.m('clean-up-detached'),
                        callback: () => {
                            this.cleanUpDetachedScripts();
                        }
                    };
                    
                    if (cleanUpIndex !== -1) {
                        // Insert right after the "Clean up blocks" option
                        items.splice(cleanUpIndex + 1, 0, cleanUpDetachedOption);
                    } else {
                        // Fallback: add at the end if "Clean up" option not found
                        items.push(cleanUpDetachedOption);
                    }
                }
                
                return items;
            },
            {workspace: true}
        );
        this.addon.tab.createBlockContextMenu(
            (items, block) => {
                items.push(
                    {
                        enabled: true,
                        text: this.m('make-space'),
                        _isDevtoolsFirstItem: true,
                        callback: () => {
                            this.doCleanUp(block);
                        },
                        separator: true
                    },
                    {
                        enabled: true,
                        text: this.m('copy-all'),
                        callback: () => {
                            this.eventCopyClick(block);
                        },
                        separator: true
                    },
                    {
                        enabled: true,
                        text: this.m('copy-block'),
                        callback: () => {
                            this.eventCopyClick(block, 1);
                        }
                    },
                    {
                        enabled: true,
                        text: this.m('cut-block'),
                        callback: () => {
                            this.eventCopyClick(block, 2);
                        }
                    }
                );
                // const BROADCAST_BLOCKS = ["event_whenbroadcastreceived", "event_broadcast", "event_broadcastandwait"];
                // if (BROADCAST_BLOCKS.includes(block.type)) {
                //   // Show Broadcast
                //   const broadcastId = this.showBroadcastSingleton.getAssociatedBroadcastId(block.id);
                //   if (broadcastId) {
                //     ["Senders", "Receivers"].forEach((showKey, i) => {
                //       items.push({
                //         enabled: true,
                //         text: this.msg(`show-${showKey}`.toLowerCase()),
                //         callback: () => {
                //           this.showBroadcastSingleton[`show${showKey}`](broadcastId);
                //         },
                //         separator: i == 0,
                //       });
                //     });
                //   }
                // }
                return items;
            },
            {blocks: true}
        );
        this.addon.tab.createBlockContextMenu(
            (items, block) => {
                if (block.getCategory() === 'data' || block.getCategory() === 'data-lists') {
                    this.selVarID = block.getVars()[0];
                    items.push({
                        enabled: true,
                        text: this.m('swap', {var: block.getCategory() === 'data' ? this.m('variables') : this.m('lists')}),
                        callback: async () => {
                            const wksp = this.getWorkspace();
                            const v = wksp.getVariableById(this.selVarID);
                            // prompt() returns Promise in desktop app
                            const varName = await window.prompt(this.msg('replace', {name: v.name}));
                            if (varName) {
                                this.doReplaceVariable(this.selVarID, varName, v.type);
                            }
                        },
                        separator: true
                    });
                }
                return items;
            },
            {blocks: true, flyout: true}
        );
    }

    getWorkspace () {
        return Blockly.getMainWorkspace();
    }

    isCostumeEditor () {
        return this.costTab.className.indexOf('gui_is-selected') >= 0;
    }

    /**
   * A nicely ordered version of the top blocks
   * @returns {[Blockly.Block]}
   */
    getTopBlocks () {
        const result = this.getOrderedTopBlockColumns();
        const columns = result.cols;
        /**
     * @type {[[Blockly.Block]]}
     */
        let topBlocks = [];
        for (const col of columns) {
            topBlocks = topBlocks.concat(col.blocks);
        }
        return topBlocks;
    }

    /**
   * A much nicer way of laying out the blocks into columns
   */
    doCleanUp (block) {
        const workspace = this.getWorkspace();
        const makeSpaceForBlock = block && block.getRootBlock();

        UndoGroup.startUndoGroup(workspace);

        const result = this.getOrderedTopBlockColumns(true);
        const columns = result.cols;
        const orphanCount = result.orphans.blocks.length;
        if (orphanCount > 0 && !block) {
            const message = this.msg('orphaned', {
                count: orphanCount
            });
            if (confirm(message)) {
                for (const block of result.orphans.blocks) {
                    block.dispose();
                }
            } else {
                columns.unshift(result.orphans);
            }
        }

        let cursorX = 48;

        const maxWidths = result.maxWidths;

        for (const column of columns) {
            let cursorY = 64;
            let maxWidth = 0;

            for (const block of column.blocks) {
                const extraWidth = block === makeSpaceForBlock ? 380 : 0;
                const extraHeight = block === makeSpaceForBlock ? 480 : 72;
                const xy = block.getRelativeToSurfaceXY();
                if (cursorX - xy.x !== 0 || cursorY - xy.y !== 0) {
                    block.moveBy(cursorX - xy.x, cursorY - xy.y);
                }
                const heightWidth = block.getHeightWidth();
                cursorY += heightWidth.height + extraHeight;

                const maxWidthWithComments = maxWidths[block.id] || 0;
                maxWidth = Math.max(maxWidth, Math.max(heightWidth.width + extraWidth, maxWidthWithComments));
            }

            cursorX += maxWidth + 96;
        }

        const topComments = workspace.getTopComments();
        for (const comment of topComments) {
            if (comment.setVisible) {
                comment.setVisible(false);
                comment.needsAutoPositioning_ = true;
                comment.setVisible(true);
            }
        }

        setTimeout(() => {
            // Locate unused local variables...
            const workspace = this.getWorkspace();
            const map = workspace.getVariableMap();
            const vars = map.getVariablesOfType('');
            const unusedLocals = [];

            for (const row of vars) {
                if (row.isLocal) {
                    const usages = map.getVariableUsesById(row.getId());
                    if (!usages || usages.length === 0) {
                        unusedLocals.push(row);
                    }
                }
            }

            if (unusedLocals.length > 0) {
                const unusedCount = unusedLocals.length;
                let message = this.msg('unused-var', {
                    count: unusedCount
                });
                for (let i = 0; i < unusedLocals.length; i++) {
                    const orphan = unusedLocals[i];
                    if (i > 0) {
                        message += ', ';
                    }
                    message += orphan.name;
                }
                if (confirm(message)) {
                    for (const orphan of unusedLocals) {
                        workspace.deleteVariableById(orphan.getId());
                    }
                }
            }

            // Locate unused local lists...
            const lists = map.getVariablesOfType('list');
            const unusedLists = [];

            for (const row of lists) {
                if (row.isLocal) {
                    const usages = map.getVariableUsesById(row.getId());
                    if (!usages || usages.length === 0) {
                        unusedLists.push(row);
                    }
                }
            }
            if (unusedLists.length > 0) {
                const unusedCount = unusedLists.length;
                let message = this.msg('unused-list', {
                    count: unusedCount
                });
                for (let i = 0; i < unusedLists.length; i++) {
                    const orphan = unusedLists[i];
                    if (i > 0) {
                        message += ', ';
                    }
                    message += orphan.name;
                }
                if (confirm(message)) {
                    for (const orphan of unusedLists) {
                        workspace.deleteVariableById(orphan.getId());
                    }
                }
            }

            UndoGroup.endUndoGroup(workspace);
        }, 100);
    }

    /**
   * Badly Orphaned - might want to delete these!
   * @param topBlock
   * @returns {boolean}
   */
    isBlockAnOrphan (topBlock) {
        return !!topBlock.outputConnection;
    }

    /**
     * Get all detached blocks (blocks without hat blocks)
     * @returns {Array} Array of detached blocks
     */
    getDetachedBlocks() {
        const workspace = this.getWorkspace();
        const topBlocks = workspace.getTopBlocks();
        return topBlocks.filter(block => !block.startHat_);
    }

    /**
     * Clean up detached scripts after user confirmation
     */
    cleanUpDetachedScripts() {
        const detachedBlocks = this.getDetachedBlocks();
        if (detachedBlocks.length === 0) return;

        const message = this.msg('detached-scripts', {
            count: detachedBlocks.length
        });

        if (confirm(message)) {
            const workspace = this.getWorkspace();
            UndoGroup.startUndoGroup(workspace);

            for (const block of detachedBlocks) {
                block.dispose();
            }

            UndoGroup.endUndoGroup(workspace);
        }
    }

    /**
   * Split the top blocks into ordered columns
   * @param separateOrphans true to keep all orphans separate
   * @returns {{orphans: {blocks: [Block], x: number, count: number}, cols: [Col]}}
   */
    getOrderedTopBlockColumns (separateOrphans) {
        const w = this.getWorkspace();
        const topBlocks = w.getTopBlocks();
        const maxWidths = {};

        if (separateOrphans) {
            const topComments = w.getTopComments();

            // todo: tie comments to blocks... find widths and width of block stack row...
            for (const comment of topComments) {
                // comment.autoPosition_();
                // Hiding and showing repositions the comment right next to it's block - nice!
                if (comment.setVisible) {
                    comment.setVisible(false);
                    comment.needsAutoPositioning_ = true;
                    comment.setVisible(true);

                    // let bb = comment.block_.svgPath_.getBBox();
                    const right = comment.getBoundingRectangle().bottomRight.x;

                    // Get top block for stack...
                    const root = comment.block_.getRootBlock();
                    const left = root.getBoundingRectangle().topLeft.x;
                    maxWidths[root.id] = Math.max(right - left, maxWidths[root.id] || 0);
                }
            }
        }

        // Default scratch ordering is horrid... Lets try something more clever.

        /**
     * @type {Col[]}
     */
        const cols = [];
        const TOLERANCE = 256;
        const orphans = {x: -999999, count: 0, blocks: []};

        for (const topBlock of topBlocks) {
            // let r = b.getBoundingRectangle();
            const position = topBlock.getRelativeToSurfaceXY();
            /**
       * @type {Col}
       */
            let bestCol = null;
            let bestError = TOLERANCE;

            if (separateOrphans && this.isBlockAnOrphan(topBlock)) {
                orphans.blocks.push(topBlock);
                continue;
            }

            // Find best columns
            for (const col of cols) {
                const err = Math.abs(position.x - col.x);
                if (err < bestError) {
                    bestError = err;
                    bestCol = col;
                }
            }

            if (bestCol) {
                // We found a column that we fitted into
                bestCol.x = (bestCol.x * bestCol.count + position.x) / ++bestCol.count; // re-average the columns as more items get added...
                bestCol.blocks.push(topBlock);
            } else {
                // Create a new column
                cols.push(new Col(position.x, 1, [topBlock]));
            }
        }

        // if (orphans.blocks.length > 0) {
        //     cols.push(orphans);
        // }

        // Sort columns, then blocks inside the columns
        cols.sort((a, b) => a.x - b.x);
        for (const col of cols) {
            col.blocks.sort((a, b) => a.getRelativeToSurfaceXY().y - b.getRelativeToSurfaceXY().y);
        }

        return {cols: cols, orphans: orphans, maxWidths: maxWidths};
    }

    /**
   * Find all the uses of a named variable.
   * @param {string} id ID of the variable to find.
   * @return {!Array.<!Blockly.Block>} Array of block usages.
   */
    getVariableUsesById (id) {
        const uses = [];

        const topBlocks = this.getTopBlocks(true); // todo: Confirm this was the right getTopBlocks?
        for (const topBlock of topBlocks) {
            /** @type {!Array<!Blockly.Block>} */
            const kids = topBlock.getDescendants();
            for (const block of kids) {
                /** @type {!Array<!Blockly.VariableModel>} */
                const blockVariables = block.getVarModels();
                if (blockVariables) {
                    for (const blockVar of blockVariables) {
                        if (blockVar.getId() === id) {
                            uses.push(block);
                        }
                    }
                }
            }
        }

        return uses;
    }

    /**
   * Quick and dirty replace all instances of one variable / list with another variable / list
   * @param varId original variable name
   * @param newVarName new variable name
   * @param type type of variable ("" = variable, anything else is a list?
   */
    doReplaceVariable (varId, newVarName, type) {
        const wksp = this.getWorkspace();
        const v = wksp.getVariable(newVarName, type);
        if (!v) {
            alert(this.msg('var-not-exist'));
            return;
        }
        const newVId = v.getId();

        UndoGroup.startUndoGroup(wksp);
        const blocks = this.getVariableUsesById(varId);
        for (const block of blocks) {
            try {
                if (type === '') {
                    block.getField('VARIABLE').setValue(newVId);
                } else {
                    block.getField('LIST').setValue(newVId);
                }
            } catch (e) {
                // ignore
            }
        }
        UndoGroup.endUndoGroup(wksp);
    }

    /*
    function doInjectScripts(codeString) {
      let w = getWorkspace();
      let xml = new XML(); // document.implementation.createDocument(null, "xml");
      let x = xml.xmlDoc.firstChild;

      let tree = math.parse(codeString);
      console.log(tree);

      const binaryOperatorTypes = {
        add: "operator_add",
        subtract: "operator_subtract",
        this.multiply: "operator_multiply",
        divide: "operator_divide",
      };

      const BLOCK_TYPE = {
        number: "math_number",
        text: "text",
      };

      function translateMathToXml(x, tree, shadowType) {
        let xShadowField = null;
        if (shadowType) {
          let xShadow = xml.newXml(x, "shadow", { type: shadowType });
          if (shadowType === BLOCK_TYPE.number) {
            xShadowField = xml.newXml(xShadow, "field", { name: "NUM" });
          } else if (shadowType === BLOCK_TYPE.text) {
            xShadowField = xml.newXml(xShadow, "field", { name: "TEXT" });
          }
        }

        if (!tree || !tree.type) {
          return;
        }

        if (tree.type === "OperatorNode") {
          let operatorType = binaryOperatorTypes[tree.fn];
          if (operatorType) {
            let xOp = newXml(x, "block", { type: operatorType });
            translateMathToXml(xml.newXml(xOp, "value", { name: "NUM1" }), tree.args[0], BLOCK_TYPE.number);
            translateMathToXml(xml.newXml(xOp, "value", { name: "NUM2" }), tree.args[1], BLOCK_TYPE.number);
            return;
          }

          return;
        }

        if (tree.type === "ConstantNode") {
          // number or text in quotes
          if (xShadowField) {
            xml.setAttr(xShadowField, { text: tree.value });
          }
          return;
        }

        if (tree.type === "SymbolNode") {
          // variable
          let xVar = xml.newXml(x, "block", { type: "data_variable" });
          xml.newXml(xVar, "field", { name: "VARIABLE", text: tree.name });
          return;
        }

        if (tree.type === "FunctionNode") {
          // Method Call
          if (tree.fn.name === "join") {
            let xOp = newXml(x, "block", { type: "operator_join" });
            translateMathToXml(xml.newXml(xOp, "value", { name: "STRING1" }), tree.args[0], BLOCK_TYPE.text);
            translateMathToXml(xml.newXml(xOp, "value", { name: "STRING2" }), tree.args[1], BLOCK_TYPE.text);
            return;
          }
        }
      }

      translateMathToXml(x, tree);
      console.log(x);

      let ids = Blockly.Xml.domToWorkspace(x, w);
      console.log(ids);
    }
     */
    /*
    function clickInject(e) {
      let codeString = window.prompt("Griffpatch: Enter an expression (i.e. a+2*3)");
      if (codeString) {
        doInjectScripts(codeString);
      }
      e.preventDefault();
      return false;
    }
    */

    /**
   * Returns a Set of the top blocks in this workspace / sprite
   * @returns {Set<any>} Set of top blocks
   */
    getTopBlockIDs () {
        const wksp = this.getWorkspace();
        const topBlocks = wksp.getTopBlocks();
        const ids = new Set();
        for (const block of topBlocks) {
            ids.add(block.id);
        }
        return ids;
    }

    /**
   * Initiates a drag event for all block stacks except those in the set of ids.
   * But why? - Because we know all the ids of the existing stacks before we paste / duplicate - so we can find the
   * new stack by excluding all the known ones.
   * @param ids Set of previously known ids
   */
    beginDragOfNewBlocksNotInIDs (ids) {
        if (!this.addon.settings.get('enablePasteBlocksAtMouse')) {
            return;
        }
        const wksp = this.getWorkspace();
        const topBlocks = wksp.getTopBlocks();
        for (const block of topBlocks) {
            if (!ids.has(block.id)) {
                // console.log("I found a new block!!! - " + block.id);
                // todo: move the block to the mouse pointer?
                const mouseXYClone = {x: this.mouseXY.x, y: this.mouseXY.y};
                block.setIntersects(true); // fixes offscreen block pasting in TurboWarp
                this.domHelpers.triggerDragAndDrop(block.svgPath_, null, mouseXYClone);
            }
        }
    }

    updateMousePosition (e) {
        this.mouseXY.x = e.clientX;
        this.mouseXY.y = e.clientY;
    }

    eventMouseMove (e) {
        this.updateMousePosition(e);
    }

    eventKeyDown (e) {
        const switchCostume = up => {
            // todo: select previous costume
            const selected = this.costTabBody.querySelector("div[class*='sprite-selector-item_is-selected']");
            const node = up ? selected.parentNode.previousSibling : selected.parentNode.nextSibling;
            if (node) {
                const wrapper = node.closest('div[class*=gui_flex-wrapper]');
                node.querySelector("div[class^='sprite-selector-item_sprite-name']").click();
                node.scrollIntoView({
                    behavior: 'auto',
                    block: 'center',
                    inline: 'start'
                });
                wrapper.scrollTop = 0;
            }
        };

        if (document.URL.indexOf('editor') <= 0) {
            return;
        }

        const ctrlKey = e.ctrlKey || e.metaKey;

        if (e.key === 'ArrowLeft' && ctrlKey) {
            // Ctrl + Left Arrow Key
            if (document.activeElement.tagName === 'INPUT') {
                return;
            }

            if (this.isCostumeEditor()) {
                switchCostume(true);
                e.cancelBubble = true;
                e.preventDefault();
                return true;
            }
        }

        if (e.key === 'ArrowRight' && ctrlKey) {
            // Ctrl + Right Arrow Key
            if (document.activeElement.tagName === 'INPUT') {
                return;
            }

            if (this.isCostumeEditor()) {
                switchCostume(false);
                e.cancelBubble = true;
                e.preventDefault();
                return true;
            }
        }

        if (e.keyCode === 86 && ctrlKey && !e.griff) {
            // Ctrl + V
            // Set a timeout so we can take control of the paste after the event
            const ids = this.getTopBlockIDs();
            setTimeout(() => {
                this.beginDragOfNewBlocksNotInIDs(ids);
            }, 10);
        }

    // if (e.keyCode === 220 && (!document.activeElement || document.activeElement.tagName === 'INPUT')) {
    //
    // }
    }

    eventCopyClick (block, blockOnly) {
        const wksp = this.getWorkspace();

        if (block) {
            block.select();
            const next = blockOnly ? block.getNextBlock() : null;
            if (next) {
                next.unplug(false); // setParent(null);
            }

            // separate child temporarily
            document.dispatchEvent(new KeyboardEvent('keydown', {keyCode: 67, ctrlKey: true}));
            if (next || blockOnly === 2) {
                setTimeout(() => {
                    if (next) {
                        wksp.undo(); // undo the unplug above...
                    }
                    if (blockOnly === 2) {
                        UndoGroup.startUndoGroup(wksp);
                        block.dispose(true);
                        UndoGroup.endUndoGroup(wksp);
                    }
                }, 0);
            }
        }
    }

    eventMouseDown (e) {
        this.updateMousePosition(e);
    }

    eventMouseUp (e) {
        this.updateMousePosition(e);
    }

    initInner (root) {
        const guiTabs = root.childNodes;

        if (this.codeTab && guiTabs[0] !== this.codeTab) {
            // We have been CHANGED!!! - Happens when going to project page, and then back inside again!!!
            this.domHelpers.unbindAllEvents();
        }

        this.codeTab = guiTabs[0];
        this.costTab = guiTabs[1];
        this.costTabBody = document.querySelector(`div[aria-labelledby=${this.costTab.id}]`);

        this.domHelpers.bindOnce(document, 'keydown', (...e) => this.eventKeyDown(...e), true);
        this.domHelpers.bindOnce(document, 'mousemove', (...e) => this.eventMouseMove(...e), true);
        this.domHelpers.bindOnce(document, 'mousedown', (...e) => this.eventMouseDown(...e), true); // true to capture all mouse downs 'before' the dom events handle them
        this.domHelpers.bindOnce(document, 'mouseup', (...e) => this.eventMouseUp(...e), true);
    }

}

class Col {
    /**
   * @param x {Number} x position (for ordering)
   * @param count {Number}
   * @param blocks {[Block]}
   */
    constructor (x, count, blocks) {
    /**
     * x position (for ordering)
     * @type {Number}
     */
        this.x = x;
        /**
     * @type {Number}
     */
        this.count = count;
        /**
     * @type {[Blockly.Block]}
     */
        this.blocks = blocks;
    }
}
