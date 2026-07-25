const isGalleryExtensionUrl = url => (
    url.startsWith('https://extensions.turbowarp.org/') ||
    url.startsWith('https://extensions.mistium.com/')
);

const isTrustedExtensionUrl = url => isGalleryExtensionUrl(url) || url.startsWith('http://localhost:8000/');

export {isGalleryExtensionUrl};
export default isTrustedExtensionUrl;
