import defaultsDeep from 'lodash.defaultsdeep';

import * as blocksThree from './blocks/three';
import * as blocksHighContrast from './blocks/high-contrast';
import * as blocksDark from './blocks/dark';

import {ACCENT_MAP, ACCENT_DEFAULT} from './accents';
import {GUI_MAP, GUI_DEFAULT} from './gui';
import {MENUBAR_ALIGN, MENUBAR_ALIGN_DEFAULT} from './menubar';

const BLOCKS_THREE = 'three';
const BLOCKS_DARK = 'dark';
const BLOCKS_HIGH_CONTRAST = 'high-contrast';
const BLOCKS_CUSTOM = 'custom';
const BLOCKS_DEFAULT = BLOCKS_THREE;
const defaultBlockColors = blocksThree.blockColors;
const BLOCKS_MAP = {
    [BLOCKS_THREE]: {
        blocksMediaFolder: 'blocks-media/default',
        colors: blocksThree.blockColors,
        extensions: blocksThree.extensions,
        customExtensionColors: {},
        useForStage: true
    },
    [BLOCKS_HIGH_CONTRAST]: {
        blocksMediaFolder: 'blocks-media/high-contrast',
        colors: defaultsDeep({}, blocksHighContrast.blockColors, defaultBlockColors),
        extensions: blocksHighContrast.extensions,
        customExtensionColors: blocksHighContrast.customExtensionColors,
        useForStage: true
    },
    [BLOCKS_DARK]: {
        blocksMediaFolder: 'blocks-media/default',
        colors: defaultsDeep({}, blocksDark.blockColors, defaultBlockColors),
        extensions: blocksDark.extensions,
        customExtensionColors: blocksDark.customExtensionColors,
        useForStage: false
    },
    [BLOCKS_CUSTOM]: {
        // to be filled by editor-theme3 addon
        blocksMediaFolder: 'blocks-media/default',
        colors: blocksThree.blockColors,
        extensions: {},
        customExtensionColors: {},
        useForStage: false
    }
};

let themeObjectsCreated = 0;

class Theme {
    constructor (accent, gui, blocks, menuBarAlign, wallpaper, fonts, name) {
        if (!name) name = gui;
        // do not modify these directly
        /** @readonly */
        this.id = ++themeObjectsCreated;
        /** @readonly */
        this.accent = Object.prototype.hasOwnProperty.call(ACCENT_MAP, accent) ? accent : ACCENT_DEFAULT;
        /** @readonly */
        this.gui = Object.prototype.hasOwnProperty.call(GUI_MAP, gui) ? gui : GUI_DEFAULT;
        /** @readonly */
        this.blocks = Object.prototype.hasOwnProperty.call(BLOCKS_MAP, blocks) ? blocks : BLOCKS_DEFAULT;
        /** @readonly */
        this.menuBarAlign = Object
            .keys(MENUBAR_ALIGN)
            .includes(menuBarAlign) ?
            menuBarAlign : MENUBAR_ALIGN_DEFAULT;
    
        /** @readonly */
        this.wallpaper = wallpaper || {url: '', opacity: 0.3, darkness: 0, gridVisible: true, history: []};
        /** @readonly */
        this.fonts = fonts || {system: [], google: [], history: []};

        /** @readonly */
        this.name = name;
    }

    static defaults = Object.create(null);

    set (what, to) {
        if (what === 'accent') {
            return new Theme(to, this.gui, this.blocks, this.menuBarAlign, this.wallpaper, this.fonts, this.name);
        } else if (what === 'gui') {
            return new Theme(this.accent, to, this.blocks, this.menuBarAlign, this.wallpaper, this.fonts, this.name);
        } else if (what === 'blocks') {
            return new Theme(this.accent, this.gui, to, this.menuBarAlign, this.wallpaper, this.fonts, this.name);
        } else if (what === 'menuBarAlign') {
            return new Theme(this.accent, this.gui, this.blocks, to, this.wallpaper, this.fonts, this.name);
        } else if (what === 'wallpaper') {
            return new Theme(this.accent, this.gui, this.blocks, this.menuBarAlign, to, this.fonts, this.name);
        } else if (what === 'fonts') {
            return new Theme(this.accent, this.gui, this.blocks, this.menuBarAlign, this.wallpaper, to, this.name);
        } else if (what === 'name') {
            return new Theme(this.accent, this.gui, this.blocks, this.menuBarAlign, this.wallpaper, this.fonts, to);
        }
        throw new Error(`Unknown theme property: ${what}`);
    }

    getBlocksMediaFolder () {
        return BLOCKS_MAP[this.blocks].blocksMediaFolder;
    }

    getGuiColors () {
        return defaultsDeep(
            {},
            ACCENT_MAP[this.accent].guiColors,
            GUI_MAP[this.gui].guiColors,
            BLOCKS_MAP[this.blocks].colors
        );
    }

    getBlockColors () {
        return defaultsDeep(
            {},
            ACCENT_MAP[this.accent].blockColors,
            GUI_MAP[this.gui].blockColors,
            BLOCKS_MAP[this.blocks].colors
        );
    }

    getExtensions () {
        return BLOCKS_MAP[this.blocks].extensions;
    }

    isDark () {
        return this.getGuiColors()['color-scheme'] === 'dark';
    }

    getStageBlockColors () {
        if (BLOCKS_MAP[this.blocks].useForStage) {
            return this.getBlockColors();
        }
        return Theme.defaults.light.getBlockColors();
    }

    getCustomExtensionColors () {
        return BLOCKS_MAP[this.blocks].customExtensionColors;
    }
}
const keys = Object.keys(GUI_MAP);
for (const key of keys) {
    Theme.defaults[key] = new Theme(
        ACCENT_DEFAULT, key, BLOCKS_DEFAULT, MENUBAR_ALIGN_DEFAULT,
        {url: '', opacity: 0.3, darkness: 0, gridVisible: true, history: []},
        {system: [], google: [], history: []},
        GUI_MAP[key].name
        
    );
}

export {
    Theme,
    defaultBlockColors,

    ACCENT_MAP,
    GUI_MAP,
    MENUBAR_ALIGN,

    ACCENT_DEFAULT,
    GUI_DEFAULT,
    MENUBAR_ALIGN_DEFAULT,

    BLOCKS_THREE,
    BLOCKS_DARK,
    BLOCKS_HIGH_CONTRAST,
    BLOCKS_CUSTOM,
    BLOCKS_MAP
};
