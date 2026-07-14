import storage from '../persistence/storage';
import {inlineSvgFonts} from '@turbowarp/scratch-svg-renderer';

// Contains 'font-family', but doesn't only contain 'font-family="none"'
const HAS_FONT_REGEXP = 'font-family(?!="none")';

const getCostumeUrl = (function () {
    const MAX_ENTRIES = 512;
    const cache = new Map();

    return function (asset) {
        const cached = cache.get(asset.assetId);
        if (typeof cached !== 'undefined') {
            return cached;
        }

        let url;

        // If the SVG refers to fonts, they must be inlined in order to display correctly in the img tag.
        // Avoid parsing the SVG when possible, since it's expensive.
        if (asset.assetType === storage.AssetType.ImageVector) {
            const svgString = asset.decodeText();
            if (svgString.match(HAS_FONT_REGEXP)) {
                const svgText = inlineSvgFonts(svgString);
                url = `data:image/svg+xml;utf8,${encodeURIComponent(svgText)}`;
            } else {
                url = asset.encodeDataURI();
            }
        } else {
            url = asset.encodeDataURI();
        }

        if (cache.size >= MAX_ENTRIES) {
            cache.clear();
        }
        cache.set(asset.assetId, url);

        return url;
    };
}());

export {
    getCostumeUrl as default,
    HAS_FONT_REGEXP
};
