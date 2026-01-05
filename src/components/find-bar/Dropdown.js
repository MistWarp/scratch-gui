import BlockInstance from '../../lib/find-bar/BlockInstance';

import Carousel from './Carousel';
import {getReactInternalKey} from './dom-utils';

const normalizeMessagePlaceholders = text => String(text).replace(/%\d+/g, '()');

export default class Dropdown {
    constructor ({ScratchBlocks, utils, vm, msg}) {
        this.ScratchBlocks = ScratchBlocks;
        this.utils = utils;
        this.vm = vm;
        this.msg = msg;

        this.el = null;
        this.items = [];
        this.selected = null;
        this.carousel = new Carousel(utils);
    }

    get workspace () {
        return this.ScratchBlocks.getMainWorkspace();
    }

    createDom () {
        this.el = document.createElement('ul');
        this.el.className = 'sa-find-dropdown';
        return this.el;
    }

    inputKeyDown (e) {
        if (e.key === 'ArrowUp') {
            this.navigateFilter(-1);
            e.preventDefault();
            return;
        }

        if (e.key === 'ArrowDown') {
            this.navigateFilter(1);
            e.preventDefault();
            return;
        }

        if (e.key === 'Enter') {
            if (this.selected) {
                this.navigateFilter(1);
            }
            e.preventDefault();
            return;
        }

        this.carousel.inputKeyDown(e);
    }

    navigateFilter (dir) {
        let nxt;
        if (this.selected && this.selected.style.display !== 'none') {
            nxt = dir === -1 ? this.selected.previousSibling : this.selected.nextSibling;
        } else {
            nxt = this.items[0];
            dir = 1;
        }
        while (nxt && nxt.style.display === 'none') {
            nxt = dir === -1 ? nxt.previousSibling : nxt.nextSibling;
        }
        if (nxt) {
            nxt.scrollIntoView({block: 'nearest'});
            this.onItemClick(nxt);
        }
    }

    addItem (proc, messagesList, colours) {
        const item = document.createElement('li');
        item.innerText = proc.procCode;
        item.data = proc;
        const name = proc.procCode.toUpperCase();
        item.displayName = normalizeMessagePlaceholders(
            messagesList[0][name] || messagesList[1][name] || proc.procCode
        );

        const colorIds = {
            receive: 'events',
            event: 'events',
            define: 'more',
            var: 'data',
            VAR: 'data',
            list: 'data-lists',
            LIST: 'data-lists',
            costume: 'looks',
            sound: 'sounds',
            block: 'more'
        };

        if (proc.cls === 'flag') {
            item.className = 'sa-find-flag';
        } else {
            let colorId = colorIds[proc.cls];
            if (!colorId) {
                const code = proc.procCode.split('_', 1)[0];
                if ([
                    'motion',
                    'control',
                    'looks',
                    'event',
                    'sound',
                    'sensing',
                    'data',
                    'pen',
                    'extensions',
                    'other'
                ].includes(code)) {
                    colorId = code;
                    if (colorId === 'sound') colorId = 'sounds';
                } else if (code === 'operator') {
                    colorId = 'operators';
                } else {
                    colorId = 'more';
                }
            }
            if (colorId === 'more') {
                item.className = 'sa-block-color sa-block-color-more';
                item.style.color = colours[name];
            } else {
                item.className = `sa-block-color sa-block-color-${colorId}`;
            }
        }

        item.addEventListener('mousedown', e => {
            this.onItemClick(item);
            e.preventDefault();
            return false;
        });

        this.items.push(item);
        this.el.appendChild(item);
        return item;
    }

    onItemClick (item, instanceBlock) {
        if (this.selected && this.selected !== item) {
            this.selected.classList.remove('sel');
            this.selected = null;
        }
        if (this.selected !== item) {
            item.classList.add('sel');
            this.selected = item;
        }

        if (item.data.targetId && item.data.targetId !== this.utils.getEditingTarget().id) {
            const target = this.vm.runtime.getTargetById(item.data.targetId);
            if (target) {
                this.vm.setEditingTarget(target.id);
                setTimeout(() => {
                    this.navigateToBlock(item, instanceBlock);
                }, 100);
                return;
            }
        }

        this.navigateToBlock(item, instanceBlock);
    }

    navigateToBlock (item, instanceBlock) {
        const cls = item.data.cls;

        if (cls === 'costume' || cls === 'sound') {
            const assetPanel = document.querySelector('[class^=asset-panel_wrapper]');
            if (assetPanel) {
                const reactKey = getReactInternalKey(assetPanel);
                const reactInstance = reactKey ? assetPanel[reactKey] : null;
                const reactProps = reactInstance?.child?.stateNode?.props;
                if (reactProps && typeof reactProps.onItemClick === 'function') {
                    reactProps.onItemClick(item.data.y);
                    const selectorList = assetPanel.firstChild?.firstChild;
                    const row = selectorList?.children?.[item.data.y];
                    if (row && typeof row.scrollIntoView === 'function') {
                        row.scrollIntoView({behavior: 'auto', block: 'center', inline: 'start'});
                    }
                    const wrapper = assetPanel.closest('div[class*=gui_flex-wrapper]');
                    if (wrapper) wrapper.scrollTop = 0;
                }
            }
            return;
        }

        if (cls === 'var' || cls === 'VAR' || cls === 'list' || cls === 'LIST') {
            const blocks = this.getVariableUsesById(item.data.labelID);
            this.carousel.build(item, blocks, instanceBlock);
            return;
        }

        if (cls === 'define') {
            const blocks = this.getCallsToProcedureById(item.data.labelID);
            this.carousel.build(item, blocks, instanceBlock);
            return;
        }

        if (cls === 'receive') {
            const blocks = this.getCallsToEventsByName(item.data.eventName);
            if (!instanceBlock) {
                const currentTargetID = this.utils.getEditingTarget().id;
                for (const block of blocks) {
                    if (block.targetId === currentTargetID) {
                        instanceBlock = block;
                        break;
                    }
                }
            }
            this.carousel.build(item, blocks, instanceBlock);
            return;
        }

        if (item.data.clones) {
            const blocks = [this.workspace.getBlockById(item.data.labelID)];
            for (const cloneID of item.data.clones) {
                blocks.push(this.workspace.getBlockById(cloneID));
            }
            this.carousel.build(item, blocks, instanceBlock);
            return;
        }

        this.utils.scrollBlockIntoView(item.data.labelID);
        this.carousel.remove();
    }

    getVariableUsesById (id) {
        const uses = [];
        const topBlocks = this.workspace.getTopBlocks();
        for (const topBlock of topBlocks) {
            const kids = topBlock.getDescendants();
            for (const block of kids) {
                const blockVariables = block.getVarModels && block.getVarModels();
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

    getCallsToProcedureById (id) {
        const procBlock = this.workspace.getBlockById(id);
        const label = procBlock.getChildren()[0];
        const procCode = label.getProcCode();

        const uses = [procBlock];
        const topBlocks = this.workspace.getTopBlocks();
        for (const topBlock of topBlocks) {
            const kids = topBlock.getDescendants();
            for (const block of kids) {
                if (block.type === 'procedures_call') {
                    if (block.getProcCode() === procCode) {
                        uses.push(block);
                    }
                }
            }
        }

        return uses;
    }

    getCallsToEventsByName (name) {
        const uses = [];
        const targets = this.vm.runtime.targets;

        for (const target of targets) {
            if (!target.isOriginal) continue;
            const blocks = target.blocks;
            if (!blocks._blocks) continue;

            for (const id of Object.keys(blocks._blocks)) {
                const block = blocks._blocks[id];
                if (
                    block.opcode === 'event_whenbroadcastreceived' &&
                    block.fields.BROADCAST_OPTION.value === name
                ) {
                    uses.push(new BlockInstance(target, block));
                } else if (block.opcode === 'event_broadcast' || block.opcode === 'event_broadcastandwait') {
                    const broadcastInputBlockId = block.inputs.BROADCAST_INPUT.block;
                    const broadcastInputBlock = blocks._blocks[broadcastInputBlockId];
                    if (broadcastInputBlock) {
                        const eventName = broadcastInputBlock.opcode === 'event_broadcast_menu' ?
                            broadcastInputBlock.fields.BROADCAST_OPTION.value :
                            this.msg('complex-broadcast');
                        if (eventName === name) {
                            uses.push(new BlockInstance(target, block));
                        }
                    }
                }
            }
        }

        return uses;
    }

    empty () {
        for (const item of this.items) {
            if (this.el.contains(item)) {
                this.el.removeChild(item);
            }
        }
        this.items = [];
        this.selected = null;
    }
}
