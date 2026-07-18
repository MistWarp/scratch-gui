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

        this._cachedVariableUses = new Map();
        this._cachedProcedureCalls = new Map();
        this._cachedEventCalls = new Map();
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
            const blocks = [item.data.labelID, ...item.data.clones].map(id => ({id}));
            this.carousel.build(item, blocks, instanceBlock);
            return;
        }

        this.utils.scrollBlockIntoView(item.data.labelID);
        this.carousel.remove();
    }

    getVariableUsesById (id) {
        if (this._cachedVariableUses.has(id)) {
            return this._cachedVariableUses.get(id);
        }

        const uses = [];
        const target = this.utils.getEditingTarget();
        const blocks = target && target.blocks && target.blocks._blocks;
        if (blocks) {
            for (const blockId of Object.keys(blocks)) {
                const block = blocks[blockId];
                const fields = block.fields;
                if (!fields) continue;
                for (const name of Object.keys(fields)) {
                    if (fields[name].id === id) {
                        uses.push(new BlockInstance(target, block));
                        break;
                    }
                }
            }
        }

        this._cachedVariableUses.set(id, uses);
        return uses;
    }

    getCallsToProcedureById (id) {
        if (this._cachedProcedureCalls.has(id)) {
            return this._cachedProcedureCalls.get(id);
        }

        const uses = [];
        const target = this.utils.getEditingTarget();
        const blocks = target && target.blocks && target.blocks._blocks;
        const def = blocks && blocks[id];
        if (def) {
            uses.push(new BlockInstance(target, def));
            const protoId = def.inputs && def.inputs.custom_block && def.inputs.custom_block.block;
            const proto = protoId && blocks[protoId];
            const procCode = proto && proto.mutation && proto.mutation.proccode;
            if (procCode) {
                for (const blockId of Object.keys(blocks)) {
                    const block = blocks[blockId];
                    if (
                        block.opcode === 'procedures_call' &&
                        block.mutation && block.mutation.proccode === procCode
                    ) {
                        uses.push(new BlockInstance(target, block));
                    }
                }
            }
        }

        this._cachedProcedureCalls.set(id, uses);
        return uses;
    }

    getCallsToEventsByName (name) {
        if (this._cachedEventCalls.has(name)) {
            return this._cachedEventCalls.get(name);
        }

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

        this._cachedEventCalls.set(name, uses);
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
        this._cachedVariableUses.clear();
        this._cachedProcedureCalls.clear();
        this._cachedEventCalls.clear();
    }
}
