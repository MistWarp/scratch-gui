/* eslint-disable import/no-commonjs */

const SansSerif = require('!!base64-loader!./NotoSans-Medium.woff2');
const Serif = require('!!base64-loader!./SourceSerifPro-Regular.woff2');
const Handwriting = require('!!base64-loader!./handlee-regular.woff2');
const Marker = require('!!base64-loader!./Knewave.woff2');
const Curly = require('!!base64-loader!./Griffy-Regular.woff2');
const Pixel = require('!!base64-loader!./Grand9K-Pixel.woff2');
const Scratch = require('!!base64-loader!./ScratchSavers_b2.woff2');

const fontSource = {
    'Sans Serif': SansSerif,
    'Serif': Serif,
    'Handwriting': Handwriting,
    'Marker': Marker,
    'Curly': Curly,
    'Pixel': Pixel,
    'Scratch': Scratch
};

const fontData = {};
for (const fontName of Object.keys(fontSource)) {
    fontData[fontName] =
        `@font-face{font-family:"${fontName}";src:url("data:font/woff2;base64,${fontSource[fontName]}");}`;
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
