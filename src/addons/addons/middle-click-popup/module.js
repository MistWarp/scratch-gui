import EventTarget from '../../event-target.js'; /* inserted by pull.js */

const textWidthCache = new Map();
const textWidthCacheSize = 1000;

const eventTarget = new EventTarget();
const eventClearTextCache = 'clearTextCache';

/**
 * Gets the width of an svg text element, with caching.
 * @param {SVGTextElement} textElement The text element
 * @returns {number} The width of the text element
 */
const getTextWidth = textElement => {
    const string = textElement.innerHTML;
    if (string.length === 0) return 0;
    let width = textWidthCache.get(string);
    if (width) return width;
    width = textElement.getBoundingClientRect().width;
    textWidthCache.set(string, width);
    if (textWidthCache.size > textWidthCacheSize) {
        textWidthCache.delete(textWidthCache.keys().next());
    }
    return width;
};

/**
 * Clears the text width cache of the middle click popup.
 */
const clearTextWidthCache = () => {
    textWidthCache.clear();
    eventTarget.dispatchEvent(new CustomEvent(eventClearTextCache));
};

/**
 * @param {function(): void} func The function to call when the cache is cleared
 */
const onClearTextWidthCache = func => {
    eventTarget.addEventListener(eventClearTextCache, func);
};

export {
    getTextWidth,
    clearTextWidthCache,
    onClearTextWidthCache
};
