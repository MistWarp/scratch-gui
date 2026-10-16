import AddonHooks from '../../addons/hooks.js';

const MARK_CLASS = 'mwExtensionErrorBlock';

let markedIds = new Set();
let wantedIds = new Set();
let tooltipText = '';
let installed = false;

const getWorkspace = () => AddonHooks.blocklyWorkspace;

const setMark = (block, on) => {
    const group = block && block.svgGroup_;
    if (!group || !group.classList) return;
    if (on) {
        group.classList.add(MARK_CLASS);
        if (tooltipText) group.setAttribute('data-mw-extension-error', tooltipText);
    } else {
        group.classList.remove(MARK_CLASS);
        group.removeAttribute('data-mw-extension-error');
    }
};

const applyMarks = () => {
    const workspace = getWorkspace();
    if (!workspace || typeof workspace.getBlockById !== 'function') return;
    const next = new Set();
    for (const id of markedIds) {
        if (!wantedIds.has(id)) setMark(workspace.getBlockById(id), false);
    }
    for (const id of wantedIds) {
        const block = workspace.getBlockById(id);
        if (block) {
            setMark(block, true);
            next.add(id);
        }
    }
    markedIds = next;
};

const install = () => {
    if (installed) return;
    const ScratchBlocks = AddonHooks.blockly;
    const proto = ScratchBlocks && ScratchBlocks.WorkspaceSvg && ScratchBlocks.WorkspaceSvg.prototype;
    if (!proto || typeof proto.restoreGlows !== 'function') return;
    installed = true;
    const original = proto.restoreGlows;
    proto.restoreGlows = function (...args) {
        const result = original.apply(this, args);
        if (this === getWorkspace() && wantedIds.size) {
            try {
                applyMarks();
            } catch (e) {
                console.error(e);
            }
        }
        return result;
    };
};

const setMarkedBlocks = (ids, tooltip) => {
    install();
    wantedIds = new Set(ids);
    tooltipText = tooltip || '';
    try {
        applyMarks();
    } catch (e) {
        console.error(e);
    }
};

export {MARK_CLASS, setMarkedBlocks};
