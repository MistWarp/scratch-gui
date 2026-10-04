/**
 * Parse a link and keep it only if it is http or https.
 * @param {*} raw Link to check.
 * @returns {URL|null} The parsed link, or null when it is missing, malformed or uses another scheme.
 */
const parseHttpUrl = raw => {
    try {
        const url = new URL(raw);
        return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
    } catch (e) {
        return null;
    }
};

/**
 * Make a link safe to put in an href or src: only absolute http and https links are kept.
 * @param {*} raw Link to check.
 * @returns {string|null} The normalized link, or null when it is not a usable http(s) link.
 */
const safeUrl = raw => {
    const url = parseHttpUrl(raw);
    return url ? url.href : null;
};

export {
    parseHttpUrl,
    safeUrl
};
