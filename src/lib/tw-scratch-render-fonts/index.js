/* eslint-disable import/no-commonjs */

const SansSerif = require('./NotoSans-Medium.woff2?base64');
const Serif = require('./SourceSerifPro-Regular.woff2?base64');
const Handwriting = require('./handlee-regular.woff2?base64');
const Marker = require('./Knewave.woff2?base64');
const Curly = require('./Griffy-Regular.woff2?base64');
const Pixel = require('./Grand9K-Pixel.woff2?base64');
const Scratch = require('./ScratchSavers_b2.woff2?base64');
const Playful = require('scratch-paint/node_modules/scratch-render-fonts/src/BadComic-Regular.ttf?base64');
const Bubbly = require('scratch-paint/node_modules/scratch-render-fonts/src/QTKooper.otf?base64');
const BitsAndBytes = require('scratch-paint/node_modules/scratch-render-fonts/src/freecam-v2.ttf?base64');
const Technological = require('scratch-paint/node_modules/scratch-render-fonts/src/MonospaceBold.ttf?base64');
const Arcade = require('scratch-paint/node_modules/scratch-render-fonts/src/PressStart2P.ttf?base64');
const Archivo = require('scratch-paint/node_modules/scratch-render-fonts/src/Archivo-Regular.ttf?base64');
const ArchivoBlack = require('scratch-paint/node_modules/scratch-render-fonts/src/Archivo-Black.ttf?base64');

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

// Scratch's SVG renderer expects require('scratch-render-fonts') to be callable.
module.exports = getFonts;
module.exports.loadFonts = loadFonts;
module.exports.FONTS = fontData;
