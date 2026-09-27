import LazyScratchBlocks from '../tw-lazy-scratch-blocks';

const PADDING = 10;

let activeDrag = null;

const blockList = payload => (Array.isArray(payload) ? payload : (payload && payload.blocks) || []);

const hasFrames = payload => !Array.isArray(payload) && Boolean(payload && payload.frames && payload.frames.length);

const workspaceFor = vm => {
    if (!vm || !vm.editingTarget || !LazyScratchBlocks.isLoaded()) return null;
    const ScratchBlocks = LazyScratchBlocks.get();
    const workspace = ScratchBlocks.getMainWorkspace();
    if (!workspace || workspace.isFlyout || !workspace.getParentSvg()) return null;
    const rect = workspace.getParentSvg().getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {ScratchBlocks, workspace, rect};
};

const canDragLive = (vm, payload) => {
    const context = workspaceFor(vm);
    if (!context || hasFrames(payload)) return false;
    const list = blockList(payload);
    const tops = list.filter(block => block && block.topLevel);
    if (tops.length !== 1) return false;
    const known = context.ScratchBlocks.Blocks;
    return list.every(block => block && Object.prototype.hasOwnProperty.call(known, block.opcode));
};

const remap = (list, genUid) => {
    const ids = new Map(list.map(block => [block.id, genUid()]));
    const swap = id => (id && ids.has(id) ? ids.get(id) : null);
    return list.map(block => {
        const copy = JSON.parse(JSON.stringify(block));
        copy.id = ids.get(block.id);
        copy.parent = swap(block.parent);
        copy.next = swap(block.next);
        delete copy.comment;
        Object.keys(copy.inputs || {}).forEach(name => {
            const input = copy.inputs[name];
            input.block = swap(input.block);
            input.shadow = swap(input.shadow);
        });
        if (copy.topLevel) {
            copy.x = 0;
            copy.y = 0;
        }
        return copy;
    });
};

const scriptXml = (vm, payload, genUid) => {
    const list = remap(blockList(payload), genUid);
    const top = list.find(block => block.topLevel);
    const Blocks = vm.editingTarget.blocks.constructor;
    const container = new Blocks(vm.runtime, true);
    list.forEach(block => container.createBlock(block));
    return container.blockToXML(top.id);
};

const startLiveDrag = (vm, payload, event, image) => {
    if (!event || event.type !== 'mousedown' || !canDragLive(vm, payload)) return false;
    const {ScratchBlocks, workspace} = workspaceFor(vm);
    const xml = scriptXml(vm, payload, ScratchBlocks.utils.genUid);
    if (!xml) return false;
    const dom = ScratchBlocks.Xml.textToDom(`<xml xmlns="http://www.w3.org/1999/xhtml">${xml}</xml>`);
    ScratchBlocks.Events.setGroup(true);
    let block;
    try {
        block = ScratchBlocks.Xml.domToBlock(dom.firstElementChild, workspace);
    } catch (e) {
        ScratchBlocks.Events.setGroup(false);
        return false;
    }
    const ctm = workspace.getCanvas().getScreenCTM();
    const scale = ctm.a;
    const box = image.getBoundingClientRect();
    const ratio = image.naturalWidth && box.width ? image.naturalWidth / box.width : 1;
    const grabX = Math.max(0, ((event.clientX - box.left) * ratio) - PADDING);
    const grabY = Math.max(0, ((event.clientY - box.top) * ratio) - PADDING);
    block.moveBy(((event.clientX - ctm.e) / scale) - grabX, ((event.clientY - ctm.f) / ctm.d) - grabY);
    const placed = block.getSvgRoot().getBoundingClientRect();
    const dx = (event.clientX - (grabX * scale)) - placed.left;
    const dy = (event.clientY - (grabY * scale)) - placed.top;
    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) block.moveBy(dx / scale, dy / scale);
    try {
        workspace.startDragWithFakeEvent(event, block);
    } catch (e) {
        block.dispose(false);
        ScratchBlocks.Events.setGroup(false);
        return false;
    }
    activeDrag = block.id;
    const release = () => {
        document.removeEventListener('mouseup', release, true);
        setTimeout(() => {
            if (activeDrag === block.id) activeDrag = null;
        }, 100);
    };
    document.addEventListener('mouseup', release, true);
    return true;
};

const chatDragActive = () => Boolean(activeDrag);

export {canDragLive, chatDragActive, startLiveDrag};
