import React from 'react';
import ReactDOM from 'react-dom';
import {
    ArrowDownToLine,
    ArrowLeftRight,
    ArrowUpRight,
    ArrowUpToLine,
    Brush,
    ChevronsDownUp,
    ChevronsUpDown,
    CircleHelp,
    ClipboardPaste,
    Copy,
    CopyPlus,
    Dot,
    Download,
    EyeOff,
    FolderInput,
    FolderOutput,
    FolderPlus,
    FolderX,
    Frame,
    Globe,
    ImageDown,
    List,
    Maximize2,
    MessageSquarePlus,
    MessageSquareX,
    Minus,
    Pencil,
    Plus,
    RectangleHorizontal,
    Redo2,
    Replace,
    RotateCcw,
    Ruler,
    ScanSearch,
    Scissors,
    SlidersHorizontal,
    Trash2,
    Undo2,
    UnfoldVertical,
    Upload,
    User,
    Variable
} from 'lucide-react';
import styles from './context-menu-icons.css';

const ICON_SIZE = 16;
const ICON_STROKE = 1.75;

const contextMenuIcons = {
    addComment: MessageSquarePlus,
    addFrame: Frame,
    addInput: Plus,
    addToFolder: FolderInput,
    cleanUp: Brush,
    collapse: ChevronsDownUp,
    copy: Copy,
    createFolder: FolderPlus,
    cut: Scissors,
    default: Dot,
    delete: Trash2,
    duplicate: CopyPlus,
    edit: Pencil,
    expand: ChevronsUpDown,
    export: Download,
    exportImage: ImageDown,
    goToDefinition: ArrowUpRight,
    help: CircleHelp,
    hide: EyeOff,
    import: Upload,
    inspect: ScanSearch,
    largeReadout: Maximize2,
    list: List,
    local: User,
    global: Globe,
    makeSpace: UnfoldVertical,
    moveToBottom: ArrowDownToLine,
    moveToTop: ArrowUpToLine,
    normalReadout: RectangleHorizontal,
    paste: ClipboardPaste,
    redo: Redo2,
    removeComment: MessageSquareX,
    removeFolder: FolderX,
    removeFromFolder: FolderOutput,
    removeInput: Minus,
    rename: Pencil,
    reset: RotateCcw,
    slider: SlidersHorizontal,
    sliderRange: Ruler,
    swap: Replace,
    switch: ArrowLeftRight,
    undo: Undo2,
    variable: Variable
};

const blocklyMessageIcons = {
    DUPLICATE: 'duplicate',
    ADD_COMMENT: 'addComment',
    REMOVE_COMMENT: 'removeComment',
    DELETE_BLOCK: 'delete',
    DELETE_X_BLOCKS: 'delete',
    DELETE: 'delete',
    UNDO: 'undo',
    REDO: 'redo',
    CLEAN_UP: 'cleanUp',
    COLLAPSE_ALL: 'collapse',
    EXPAND_ALL: 'expand',
    COLLAPSE_BLOCK: 'collapse',
    EXPAND_BLOCK: 'expand',
    HELP: 'help',
    ADD_FRAME: 'addFrame',
    RENAME_FRAME: 'rename',
    DELETE_FRAME: 'delete',
    COLLAPSE_FRAME: 'collapse',
    EXPAND_FRAME: 'expand',
    EDIT_PROCEDURE: 'edit',
    SHOW_PROCEDURE_DEFINITION: 'goToDefinition',
    PROCEDURES_TO_REPORTER: 'switch',
    PROCEDURES_TO_STATEMENT: 'switch',
    RENAME_VARIABLE: 'rename',
    DELETE_VARIABLE: 'delete',
    RENAME_LIST: 'rename',
    DELETE_LIST: 'delete',
    OPERATORS_ADD_INPUT: 'addInput',
    OPERATORS_REMOVE_INPUT: 'removeInput'
};

const blockTypeFallbackIcons = {
    data_variable: 'variable',
    data_listcontents: 'list'
};

const resolveContextMenuIcon = icon => {
    if (typeof icon === 'string') {
        return contextMenuIcons[icon] || contextMenuIcons.default;
    }
    return icon || contextMenuIcons.default;
};

const markupCache = new Map();

const createContextMenuIconElement = icon => {
    const Icon = resolveContextMenuIcon(icon);
    if (!markupCache.has(Icon)) {
        const container = document.createElement('div');
        ReactDOM.render(React.createElement(Icon, {
            'size': ICON_SIZE,
            'strokeWidth': ICON_STROKE,
            'className': styles.icon,
            'aria-hidden': true
        }), container);
        markupCache.set(Icon, container.firstChild.cloneNode(true));
        ReactDOM.unmountComponentAtNode(container);
    }
    return markupCache.get(Icon).cloneNode(true);
};

const templateCache = new Map();

const templateToRegExp = template => {
    if (!templateCache.has(template)) {
        const source = template
            .split(/%\d+/)
            .map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
            .join('[\\s\\S]*');
        templateCache.set(template, new RegExp(`^${source}$`));
    }
    return templateCache.get(template);
};

const iconForBlocklyOption = (option, ScratchBlocks, targetBlock) => {
    if (option.icon) {
        return option.icon;
    }
    const text = typeof option.text === 'string' ? option.text : String(option.text);
    const Msg = ScratchBlocks.Msg || {};
    for (const key of Object.keys(blocklyMessageIcons)) {
        const template = Msg[key];
        if (typeof template !== 'string' || !template) continue;
        if (template === text || (template.includes('%') && templateToRegExp(template).test(text))) {
            return blocklyMessageIcons[key];
        }
    }
    if (targetBlock && blockTypeFallbackIcons[targetBlock.type]) {
        return blockTypeFallbackIcons[targetBlock.type];
    }
    return 'default';
};

const installBlocklyContextMenuIcons = ScratchBlocks => {
    const ContextMenu = ScratchBlocks && ScratchBlocks.ContextMenu;
    if (!ContextMenu || typeof ContextMenu.populate_ !== 'function' || ContextMenu.mwIconsInstalled) return;
    ContextMenu.mwIconsInstalled = true;
    const originalPopulate = ContextMenu.populate_;
    ContextMenu.populate_ = function (options, rtl) {
        const menu = originalPopulate.call(this, options, rtl);
        let targetBlock = null;
        try {
            const gesture = ScratchBlocks.mainWorkspace && ScratchBlocks.mainWorkspace.currentGesture_;
            targetBlock = gesture ? gesture.targetBlock_ : null;
        } catch (e) {
            targetBlock = null;
        }
        for (let i = 0; i < options.length; i++) {
            const item = menu.getChildAt(i);
            if (!item) continue;
            const icon = createContextMenuIconElement(iconForBlocklyOption(options[i], ScratchBlocks, targetBlock));
            item.setContent([icon, document.createTextNode(String(options[i].text))]);
        }
        return menu;
    };
};

export {
    contextMenuIcons,
    createContextMenuIconElement,
    iconForBlocklyOption,
    installBlocklyContextMenuIcons,
    resolveContextMenuIcon,
    ICON_SIZE,
    ICON_STROKE
};
