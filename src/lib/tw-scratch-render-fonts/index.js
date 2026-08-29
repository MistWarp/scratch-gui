/* eslint-disable import/no-commonjs */

const SansSerif = require('!!base64-loader!./NotoSans-Medium.woff2');
const Serif = require('!!base64-loader!./SourceSerifPro-Regular.woff2');
const Handwriting = require('!!base64-loader!./handlee-regular.woff2');
const Marker = require('!!base64-loader!./Knewave.woff2');
const Curly = require('!!base64-loader!./Griffy-Regular.woff2');
const Pixel = require('!!base64-loader!./Grand9K-Pixel.woff2');
const Scratch = require('!!base64-loader!./ScratchSavers_b2.woff2');
const Playful = require('!!base64-loader!scratch-paint/node_modules/scratch-render-fonts/src/BadComic-Regular.ttf');
const Bubbly = require('!!base64-loader!scratch-paint/node_modules/scratch-render-fonts/src/QTKooper.otf');
const BitsAndBytes = require('!!base64-loader!scratch-paint/node_modules/scratch-render-fonts/src/freecam-v2.ttf');
const Technological = require('!!base64-loader!scratch-paint/node_modules/scratch-render-fonts/src/MonospaceBold.ttf');
const Arcade = require('!!base64-loader!scratch-paint/node_modules/scratch-render-fonts/src/PressStart2P.ttf');
const Archivo = require('!!base64-loader!scratch-paint/node_modules/scratch-render-fonts/src/Archivo-Regular.ttf');
const ArchivoBlack = require('!!base64-loader!scratch-paint/node_modules/scratch-render-fonts/src/Archivo-Black.ttf');

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

// We have to use legacy module.exports as some parts of Scratch expect require('scratch-render-font') to be a function
module.exports = getFonts;
module.exports.loadFonts = loadFonts;
module.exports.FONTS = fontData;
