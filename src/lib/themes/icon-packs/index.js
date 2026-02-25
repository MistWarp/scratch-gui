import * as iconPacksLucide from './lucide';
import * as iconPacksNone from './none';

const ICON_PACKS = [
    {
        name: 'Lucide',
        iconPack: iconPacksLucide,
        description: 'Modern, clean icon set (default)',
        id: 'tw.iconPack.lucide'
    },
    {
        name: 'None',
        iconPack: iconPacksNone,
        description: 'No icons, text only',
        id: 'tw.iconPack.none'
    }
];

const ICON_PACK_LUCIDE = 'lucide';
const ICON_PACK_NONE = 'none';
const ICON_PACK_DEFAULT = ICON_PACK_LUCIDE;

const ICON_PACK_MAP = {
    [ICON_PACK_LUCIDE]: iconPacksLucide,
    [ICON_PACK_NONE]: iconPacksNone
};

export {
    ICON_PACKS,
    ICON_PACK_MAP,
    ICON_PACK_LUCIDE,
    ICON_PACK_NONE,
    ICON_PACK_DEFAULT
};
