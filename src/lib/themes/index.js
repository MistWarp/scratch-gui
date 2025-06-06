import defaultsDeep from 'lodash.defaultsdeep';

import * as accentPurple from './accent/purple';
import * as accentBlue from './accent/blue';
import * as accentRed from './accent/red';
import * as accentOrange from './accent/orange';
import * as accentYellow from './accent/yellow';
import * as accentGreen from './accent/green';
import * as accentRainbow from './accent/rainbow';
import * as accentTrans from './accent/trans';
import * as accentGay from './accent/gay';
import * as accentRotur from './accent/rotur';
import * as accentPink from './accent/pink';

import * as guiLight from './gui/light';
import * as guiDark from './gui/dark';
import * as guiMidnight from './gui/midnight';

import * as blocksThree from './blocks/three';
import * as blocksHighContrast from './blocks/high-contrast';
import * as blocksDark from './blocks/dark';

import alignLeftIcon from '../../components/menu-bar/tw-align-left.svg';
import alignCenterIcon from '../../components/menu-bar/tw-align-center.svg';
import alignRightIcon from '../../components/menu-bar/tw-align-right.svg';

const ACCENTS = [
    {
        name: 'Red',
        accent: accentRed,
        description: 'Red accent color',
        id: 'tw.accent.red'
    },
    {
        name: 'Orange',
        accent: accentOrange,
        description: 'Orange accent color',
        id: 'tw.accent.orange'
    },
    {
        name: 'Yellow',
        accent: accentYellow,
        description: 'Yellow accent color',
        id: 'tw.accent.yellow'
    },
    {
        name: 'Green',
        accent: accentGreen,
        description: 'Green accent color',
        id: 'tw.accent.green'
    },
    {
        name: 'Purple',
        accent: accentPurple,
        description: 'Purple accent color',
        id: 'tw.accent.purple'
    },
    {
        name: 'Blue',
        accent: accentBlue,
        description: 'Blue accent color',
        id: 'tw.accent.blue'
    },
    {
        name: 'Rainbow',
        accent: accentRainbow,
        description: 'Rainbow accent color',
        id: 'tw.accent.rainbow'
    },
    {
        name: 'Trans',
        accent: accentTrans,
        description: 'Trans accent color',
        id: 'tw.accent.trans'
    },
    {
        name: 'Gay',
        accent: accentGay,
        description: 'Gay accent color',
        id: 'tw.accent.gay'
    },
    {
        name: 'Rotur',
        accent: accentRotur,
        description: 'Rotur accent color',
        id: 'tw.accent.rotur'
    },
    {
        name: 'Pink',
        accent: accentPink,
        description: 'Pink accent color',
        id: 'tw.accent.pink'
    }
];

const ACCENT_MAP = {};
for (const accent of ACCENTS) {
    ACCENT_MAP[accent.name.toLowerCase()] = {
        defaultMessage: accent.name,
        accent: accent.accent,
        description: accent.description,
        id: accent.id
    };
}
const ACCENT_DEFAULT = ACCENTS[0].name.toLowerCase();

const GUI_LIGHT = 'light';
const GUI_DARK = 'dark';
const GUI_MIDNIGHT = 'midnight';
const GUI_MAP = {
    [GUI_LIGHT]: guiLight,
    [GUI_DARK]: guiDark,
    [GUI_MIDNIGHT]: guiMidnight
};
const GUI_DEFAULT = GUI_LIGHT;


// menubar config

const MENUBAR_ALIGN = {
    left: {
        defaultMessage: 'Left',
        description: 'Label for left-aligned menu bar',
        id: 'tw.menuBar.align.left',
        icon: alignLeftIcon
    },
    center: {
        defaultMessage: 'Center',
        description: 'Label for center-aligned menu bar',
        id: 'tw.menuBar.align.center',
        icon: alignCenterIcon
    },
    right: {
        defaultMessage: 'Right',
        description: 'Label for right-aligned menu bar',
        id: 'tw.menuBar.align.right',
        icon: alignRightIcon
    }
};
const MENUBAR_ALIGN_DEFAULT =  'center';

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
    constructor (accent, gui, blocks, menuBarAlign, wallpaper) {
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
        this.menuBarAlign = ['left', 'center', 'right'].includes(menuBarAlign) ? 
            menuBarAlign : MENUBAR_ALIGN_DEFAULT;
        /** @readonly */
        this.wallpaper = wallpaper || { url: '', opacity: 0.3, history: [] };
    }

    static light = new Theme(ACCENT_DEFAULT, GUI_LIGHT, BLOCKS_DEFAULT, MENUBAR_ALIGN_DEFAULT, { url: '', opacity: 0.3, history: [] });
    static dark = new Theme(ACCENT_DEFAULT, GUI_DARK, BLOCKS_DEFAULT, MENUBAR_ALIGN_DEFAULT, { url: '', opacity: 0.3, history: [] });
    static midnight = new Theme(ACCENT_DEFAULT, GUI_MIDNIGHT, BLOCKS_DEFAULT, MENUBAR_ALIGN_DEFAULT, { url: '', opacity: 0.3, history: [] });
    static highContrast = new Theme(ACCENT_DEFAULT, GUI_DEFAULT, BLOCKS_HIGH_CONTRAST, MENUBAR_ALIGN_DEFAULT, { url: '', opacity: 0.3, history: [] });

    set (what, to) {
        if (what === 'accent') {
            return new Theme(to, this.gui, this.blocks, this.menuBarAlign, this.wallpaper);
        } else if (what === 'gui') {
            return new Theme(this.accent, to, this.blocks, this.menuBarAlign, this.wallpaper);
        } else if (what === 'blocks') {
            return new Theme(this.accent, this.gui, to, this.menuBarAlign, this.wallpaper);
        } else if (what === 'menuBarAlign') {
            return new Theme(this.accent, this.gui, this.blocks, to, this.wallpaper);
        } else if (what === 'wallpaper') {
            return new Theme(this.accent, this.gui, this.blocks, this.menuBarAlign, to);
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
            guiLight.guiColors
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
        return Theme.light.getBlockColors();
    }

    getCustomExtensionColors () {
        return BLOCKS_MAP[this.blocks].customExtensionColors;
    }
}

export {
    Theme,
    defaultBlockColors,

    ACCENT_MAP,

    GUI_LIGHT,
    GUI_DARK,
    GUI_MIDNIGHT,
    GUI_MAP,

    MENUBAR_ALIGN,

    BLOCKS_THREE,
    BLOCKS_DARK,
    BLOCKS_HIGH_CONTRAST,
    BLOCKS_CUSTOM,
    BLOCKS_MAP
};
