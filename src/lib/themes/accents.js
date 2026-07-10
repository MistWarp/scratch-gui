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
import * as accentSunset from './accent/sunset';
import * as accentOcean from './accent/ocean';
import * as accentAurora from './accent/aurora';
import * as accentCosmic from './accent/cosmic';
import * as accentFire from './accent/fire';
import * as accentNebula from './accent/nebula';
import * as accentLavender from './accent/lavender';
import * as accentMint from './accent/mint';
import * as accentCherry from './accent/cherry';
import * as accentSky from './accent/sky';
import * as accentForest from './accent/forest';
import * as accentCoral from './accent/coral';
import * as accentBi from './accent/bi';
import * as accentPan from './accent/pan';
import * as accentLesbian from './accent/lesbian';
import * as accentNonbinary from './accent/nonbinary';
import * as accentAce from './accent/ace';
import * as accentVaporwave from './accent/vaporwave';
import * as accentMatrix from './accent/matrix';
import * as accentHoney from './accent/honey';

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
    },
    {
        name: 'Sunset',
        accent: accentSunset,
        description: 'Beautiful sunset gradient',
        id: 'tw.accent.sunset'
    },
    {
        name: 'Ocean',
        accent: accentOcean,
        description: 'Deep ocean gradient',
        id: 'tw.accent.ocean'
    },
    {
        name: 'Aurora',
        accent: accentAurora,
        description: 'Aurora borealis gradient',
        id: 'tw.accent.aurora'
    },
    {
        name: 'Cosmic',
        accent: accentCosmic,
        description: 'Cosmic space gradient',
        id: 'tw.accent.cosmic'
    },
    {
        name: 'Fire',
        accent: accentFire,
        description: 'Fiery gradient',
        id: 'tw.accent.fire'
    },
    {
        name: 'Nebula',
        accent: accentNebula,
        description: 'Stellar nebula gradient',
        id: 'tw.accent.nebula'
    },
    {
        name: 'Lavender',
        accent: accentLavender,
        description: 'Soft lavender to pink gradient',
        id: 'tw.accent.lavender'
    },
    {
        name: 'Mint',
        accent: accentMint,
        description: 'Fresh mint to cyan gradient',
        id: 'tw.accent.mint'
    },
    {
        name: 'Cherry',
        accent: accentCherry,
        description: 'Vibrant cherry to rose gradient',
        id: 'tw.accent.cherry'
    },
    {
        name: 'Sky',
        accent: accentSky,
        description: 'Light sky blue to white gradient',
        id: 'tw.accent.sky'
    },
    {
        name: 'Forest',
        accent: accentForest,
        description: 'Deep forest to bright green gradient',
        id: 'tw.accent.forest'
    },
    {
        name: 'Coral',
        accent: accentCoral,
        description: 'Warm coral to peach gradient',
        id: 'tw.accent.coral'
    },
    {
        name: 'Bi',
        accent: accentBi,
        description: 'Bi pride flag accent',
        id: 'mw.accent.bi'
    },
    {
        name: 'Pan',
        accent: accentPan,
        description: 'Pan pride flag accent',
        id: 'mw.accent.pan'
    },
    {
        name: 'Lesbian',
        accent: accentLesbian,
        description: 'Lesbian pride flag accent',
        id: 'mw.accent.lesbian'
    },
    {
        name: 'Nonbinary',
        accent: accentNonbinary,
        description: 'Nonbinary pride flag accent',
        id: 'mw.accent.nonbinary'
    },
    {
        name: 'Asexual',
        accent: accentAce,
        description: 'Asexual pride flag accent',
        id: 'mw.accent.asexual'
    },
    {
        name: 'Vaporwave',
        accent: accentVaporwave,
        description: 'Retro vaporwave gradient',
        id: 'mw.accent.vaporwave'
    },
    {
        name: 'Matrix',
        accent: accentMatrix,
        description: 'Digital rain green on black',
        id: 'mw.accent.matrix'
    },
    {
        name: 'Honey',
        accent: accentHoney,
        description: 'Warm golden honey gradient',
        id: 'mw.accent.honey'
    }
];

const ACCENT_GROUPS = [
    {
        label: {id: 'mw.accentGroup.colors', defaultMessage: 'Colors'},
        accents: ['red', 'orange', 'yellow', 'green', 'purple', 'blue', 'pink']
    },
    {
        label: {id: 'mw.accentGroup.pride', defaultMessage: 'Pride'},
        accents: ['rainbow', 'trans', 'gay', 'bi', 'pan', 'lesbian', 'nonbinary', 'asexual']
    },
    {
        label: {id: 'mw.accentGroup.themed', defaultMessage: 'Themed'},
        accents: [
            'rotur', 'sunset', 'ocean', 'aurora', 'cosmic', 'fire', 'nebula', 'lavender',
            'mint', 'cherry', 'sky', 'forest', 'coral', 'vaporwave', 'matrix', 'honey'
        ]
    }
];

const ACCENT_MAP = {};
for (const accent of ACCENTS) {
    ACCENT_MAP[accent.name.toLowerCase()] = {
        ...accent.accent,
        defaultMessage: accent.name,
        description: accent.description,
        id: accent.id
    };
}
const ACCENT_DEFAULT = ACCENTS[0].name.toLowerCase();

export {
    ACCENTS,
    ACCENT_MAP,
    ACCENT_GROUPS,
    ACCENT_DEFAULT
};
