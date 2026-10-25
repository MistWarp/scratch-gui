const isGalleryExtensionUrl = url => (
    url.startsWith('https://extensions.turbowarp.org/') ||
    url.startsWith('https://extensions.mistium.com/')
);

/**
 * Rotur's own Scratch extensions, built from rotur-sdk and served from rotur.dev/scratch.
 * They need the page itself, so they run unsandboxed. The URL is parsed rather than
 * prefix-matched: a path such as /scratch/../x.js would otherwise reach the rest of rotur.dev.
 * @param {string} url The extension's URL
 * @returns {boolean} Whether it is one of Rotur's Scratch extensions
 */
const isRoturScratchExtensionUrl = url => {
    let parsed;
    try {
        parsed = new URL(url);
    } catch (e) {
        return false;
    }
    return parsed.href === url &&
        parsed.origin === 'https://rotur.dev' &&
        !parsed.username &&
        !parsed.password &&
        !parsed.search &&
        !parsed.hash &&
        /^\/scratch\/[a-z0-9-]+\.js$/.test(parsed.pathname);
};

const isTrustedExtensionUrl = url => (
    isGalleryExtensionUrl(url) ||
    isRoturScratchExtensionUrl(url) ||
    url.startsWith('http://localhost:8000/')
);

export {isGalleryExtensionUrl, isRoturScratchExtensionUrl};
export default isTrustedExtensionUrl;
