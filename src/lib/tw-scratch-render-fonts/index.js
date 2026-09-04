/* ESM build of the old scratch-render-fonts package.
 * Font binaries come in through the ?base64 query (see vite.config.mjs),
 * which yields the raw base64 string the CSS below expects. */

import SansSerif from './NotoSans-Medium.woff2?base64';
import Serif from './SourceSerifPro-Regular.woff2?base64';
import Handwriting from './handlee-regular.woff2?base64';
import Marker from './Knewave.woff2?base64';
import Curly from './Griffy-Regular.woff2?base64';
import Pixel from './Grand9K-Pixel.woff2?base64';
import Scratch from './ScratchSavers_b2.woff2?base64';
import Playful from 'scratch-paint/node_modules/scratch-render-fonts/src/BadComic-Regular.ttf?base64';
import Bubbly from 'scratch-paint/node_modules/scratch-render-fonts/src/QTKooper.otf?base64';
import BitsAndBytes from 'scratch-paint/node_modules/scratch-render-fonts/src/freecam-v2.ttf?base64';
import Technological from 'scratch-paint/node_modules/scratch-render-fonts/src/MonospaceBold.ttf?base64';
import Arcade from 'scratch-paint/node_modules/scratch-render-fonts/src/PressStart2P.ttf?base64';
import Archivo from 'scratch-paint/node_modules/scratch-render-fonts/src/Archivo-Regular.ttf?base64';
import ArchivoBlack from 'scratch-paint/node_modules/scratch-render-fonts/src/Archivo-Black.ttf?base64';

const fontSource = {
    'Sans Serif': {data: SansSerif, mime: 'font/woff2'},
    'Serif': {data: Serif, mime: 'font/woff2'},
    'Handwriting': {data: Handwriting, mime: 'font/woff2'},
    'Marker': {data: Marker, mime: 'font/woff2'},
    'Curly': {data: Curly, mime: 'font/woff2'},
    'Pixel': {data: Pixel, mime: 'font/woff2'},
    'Scratch': {data: Scratch, mime: 'font/woff2'},
    'Playful': {data: Playful, mime: 'font/ttf'},
    'Bubbly': {data: Bubbly, mime: 'font/otf'},
    'Bits and Bytes': {data: BitsAndBytes, mime: 'font/ttf'},
    'Technological': {data: Technological, mime: 'font/ttf'},
    'Arcade': {data: Arcade, mime: 'font/ttf'},
    'Archivo': {data: Archivo, mime: 'font/ttf'},
    'Archivo Black': {data: ArchivoBlack, mime: 'font/ttf'}
};

const fontData = {};
for (const fontName of Object.keys(fontSource)) {
    const {data, mime} = fontSource[fontName];
    fontData[fontName] =
        `@font-face{font-family:"${fontName}";src:url("data:${mime};base64,${data}");}`;
}

const addFontsToDocument = () => {
    if (document.getElementById('scratch-font-styles')) {
        return;
    }
    let css = '';
    for (const fontName of Object.keys(fontSource)) {
        const fontCSS = fontData[fontName];
        if (fontCSS) {
            css += fontCSS;
        }
    }
    const documentStyleTag = document.createElement('style');
    documentStyleTag.id = 'scratch-font-styles';
    documentStyleTag.textContent = css;
    document.body.insertBefore(documentStyleTag, document.body.firstChild);
};

const waitForFontsToLoad = () => {
    const promises = [];
    if (document.fonts && document.fonts.load) {
        for (const fontName in fontData) {
            promises.push(document.fonts.load(`12px ${fontName}`));
        }
    }
    return Promise.all(promises);
};

const loadFonts = () => {
    addFontsToDocument();
    return waitForFontsToLoad();
};

const getFonts = () => fontData;

export default getFonts;
export {
    loadFonts,
    fontData as FONTS
};
